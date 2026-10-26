import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import * as THREE from 'three';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { flagPngUrl, loadWorld, mainBounds, type World } from './countries';
import { Tooltip, type TipState } from './Tooltip';

const TEX_W = 8192, TEX_H = 4096;

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Paints every country with its flag onto an equirectangular canvas,
// which is then wrapped around the sphere as a texture.
async function buildTexture(world: World) {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d')!;

  const projection = d3.geoEquirectangular()
    .scale(TEX_W / (2 * Math.PI))
    .translate([TEX_W / 2, TEX_H / 2]);
  const boundsPath = d3.geoPath(projection);
  const path = d3.geoPath(projection, ctx);

  ctx.fillStyle = '#7fb0d6';
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  const images = await Promise.all(world.features.map(f =>
    f.properties.code ? loadImage(flagPngUrl(f.properties.code)) : Promise.resolve(null)));

  world.features.forEach((f, i) => {
    ctx.save();
    ctx.beginPath();
    path(f);
    ctx.clip();
    const img = images[i];
    if (img) {
      const [[x0, y0], [x1, y1]] = mainBounds(boundsPath, f);
      ctx.drawImage(img, x0, y0, x1 - x0, y1 - y0);
    } else {
      ctx.fillStyle = '#ccc';
      ctx.fill();
    }
    ctx.restore();
  });

  ctx.beginPath();
  world.features.forEach(f => { path(f); });
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function Globe() {
  const [world, setWorld] = useState<World | null>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [tip, setTip] = useState<TipState>(null);

  useEffect(() => {
    let cancelled = false;
    let tex: THREE.Texture | null = null;
    loadWorld().then(async w => {
      tex = await buildTexture(w);
      if (cancelled) return tex.dispose();
      setWorld(w);
      setTexture(tex);
    });
    return () => { cancelled = true; tex?.dispose(); };
  }, []);

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!world || !e.uv) return;
    const lonLat: [number, number] = [e.uv.x * 360 - 180, e.uv.y * 180 - 90];
    const country = world.features.find(f => d3.geoContains(f, lonLat));
    setTip(country ? { x: e.clientX, y: e.clientY, country: country.properties } : null);
  };

  return (
    <>
      {!texture && <div className="loading">Loading flags…</div>}
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <ambientLight intensity={2.2} />
        <directionalLight position={[5, 3, 5]} intensity={1} />
        {texture && (
          <mesh onPointerMove={onPointerMove} onPointerOut={() => setTip(null)}>
            <sphereGeometry args={[1, 128, 64]} />
            <meshStandardMaterial map={texture} roughness={0.9} />
          </mesh>
        )}
        <OrbitControls enablePan={false} minDistance={1.2} maxDistance={6} zoomSpeed={0.6} />
      </Canvas>
      <Tooltip tip={tip} />
    </>
  );
}
