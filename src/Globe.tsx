import { type ComponentRef, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as THREE from 'three';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { flagPngUrl, loadWorld, mainBounds, type CountryProps, type World } from './countries';
import { CountryCard, Tooltip, ZoomButtons, isTouch, type TipState } from './Tooltip';

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

const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Paints every country with its flag onto an equirectangular canvas,
// which is then wrapped around the sphere as a texture.
function paintTexture(canvas: HTMLCanvasElement, world: World, images: (HTMLImageElement | null)[]) {
  const ctx = canvas.getContext('2d')!;

  const projection = d3.geoEquirectangular()
    .scale(TEX_W / (2 * Math.PI))
    .translate([TEX_W / 2, TEX_H / 2]);
  const boundsPath = d3.geoPath(projection);
  const path = d3.geoPath(projection, ctx);

  // Map colours come from the theme tokens at the time the texture is painted.
  ctx.fillStyle = token('--map-sea');
  ctx.fillRect(0, 0, TEX_W, TEX_H);

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
      ctx.fillStyle = token('--map-land');
      ctx.fill();
    }
    ctx.restore();
  });

  ctx.beginPath();
  world.features.forEach(f => { path(f); });
  ctx.strokeStyle = token('--map-border');
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

async function buildTexture(world: World) {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;

  const images = await Promise.all(world.features.map(f =>
    f.properties.code ? loadImage(flagPngUrl(f.properties.code)) : Promise.resolve(null)));
  paintTexture(canvas, world, images);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  // Repaints with the current theme's map tokens, reusing the loaded flags.
  const repaint = () => {
    paintTexture(canvas, world, images);
    texture.needsUpdate = true;
  };
  return { texture, repaint };
}

export function Globe() {
  const [world, setWorld] = useState<World | null>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [outline, setOutline] = useState('');
  const [tip, setTip] = useState<TipState>(null);
  const [picked, setPicked] = useState<CountryProps | null>(null);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);

  useEffect(() => {
    let cancelled = false;
    let tex: THREE.Texture | null = null;
    let repaint = () => {};
    const onTheme = () => {
      setOutline(token('--outline'));
      repaint();
    };
    // The theme lives on <html data-theme>, or follows the device when unset.
    const observer = new MutationObserver(onTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', onTheme);
    setOutline(token('--outline'));

    loadWorld().then(async w => {
      const built = await buildTexture(w);
      tex = built.texture;
      if (cancelled) return tex.dispose();
      repaint = built.repaint;
      setWorld(w);
      setTexture(tex);
    });
    return () => {
      cancelled = true;
      observer.disconnect();
      media.removeEventListener('change', onTheme);
      tex?.dispose();
    };
  }, []);

  const countryAt = (uv: THREE.Vector2) => {
    const lonLat: [number, number] = [uv.x * 360 - 180, uv.y * 180 - 90];
    return world?.features.find(f => d3.geoContains(f, lonLat));
  };

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!world || !e.uv || e.nativeEvent.pointerType !== 'mouse') return;
    const country = countryAt(e.uv);
    setTip(country ? { x: e.clientX, y: e.clientY, country: country.properties } : null);
  };

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    // Ignore the click that ends a drag-to-rotate.
    if (e.delta > 6 || !e.uv || !isTouch(e.nativeEvent)) return;
    const country = countryAt(e.uv);
    if (country) setPicked(country.properties);
  };

  const zoomBy = (factor: number) => {
    const c = controls.current;
    if (!c) return;
    c.object.position.setLength(THREE.MathUtils.clamp(c.object.position.length() / factor, c.minDistance, c.maxDistance));
    c.update();
  };

  return (
    <>
      {!texture && <div className="pointer-events-none absolute inset-0 grid place-items-center font-body text-body-lg text-fg">Loading flags…</div>}
      {/* flat + unlit: the sticker look, with token colours shown as-is. */}
      <Canvas flat camera={{ position: [0, 0, 3], fov: 45 }}>
        {texture && (
          <>
            {/* biome-ignore lint/a11y/noStaticElementInteractions: three.js mesh, not a DOM element */}
            <mesh onPointerMove={onPointerMove} onPointerOut={() => setTip(null)} onClick={onClick}>
              <sphereGeometry args={[1, 128, 64]} />
              <meshBasicMaterial map={texture} />
            </mesh>
            {/* Sticker edge: a slightly bigger back-face sphere shows as an outline ring. */}
            <mesh scale={1.025}>
              <sphereGeometry args={[1, 64, 32]} />
              <meshBasicMaterial color={outline} side={THREE.BackSide} />
            </mesh>
          </>
        )}
        <OrbitControls ref={controls} enablePan={false} minDistance={1.2} maxDistance={6} zoomSpeed={0.6} />
      </Canvas>
      <Tooltip tip={tip} />
      <ZoomButtons onZoom={zoomBy} />
      <CountryCard country={picked} onClose={() => setPicked(null)} />
    </>
  );
}
