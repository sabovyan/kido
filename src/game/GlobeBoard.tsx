import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { Country } from '../countries';
import type { BoardProps, Focus } from './board';
import { GamePainter, type Paint } from './painter';

// Matches three.js SphereGeometry UVs for an equirectangular texture.
function lonLatToVec([lon, lat]: [number, number]) {
  const λ = (lon * Math.PI) / 180, φ = (lat * Math.PI) / 180;
  return new THREE.Vector3(Math.cos(φ) * Math.cos(λ), Math.sin(φ), -Math.cos(φ) * Math.sin(λ));
}

function CameraRig({ focus }: { focus: Focus | null }) {
  const camera = useThree(s => s.camera);
  const controls = useThree(s => s.controls) as unknown as { update(): void } | null;
  const anim = useRef<{ from: THREE.Vector3; rot: THREE.Quaternion; dist: number; t: number } | null>(null);

  useEffect(() => {
    if (!focus) return;
    const from = camera.position.clone().normalize();
    const to = lonLatToVec(focus.lonLat);
    anim.current = {
      from,
      rot: new THREE.Quaternion().setFromUnitVectors(from, to),
      dist: camera.position.length(),
      t: 0,
    };
  }, [focus, camera]);

  useFrame((_, dt) => {
    const a = anim.current;
    if (!a) return;
    a.t = Math.min(1, a.t + dt / 1.2);
    const q = new THREE.Quaternion().slerp(a.rot, d3.easeCubicInOut(a.t));
    camera.position.copy(a.from).applyQuaternion(q).multiplyScalar(a.dist);
    camera.lookAt(0, 0, 0);
    controls?.update();
    if (a.t === 1) anim.current = null;
  });

  return null;
}

export function GlobeBoard({ world, paints, focus, onPick }: BoardProps) {
  const [painter, setPainter] = useState<GamePainter | null>(null);
  const painted = useRef(new Map<Country, Paint>());
  const [outline, setOutline] = useState('');

  // The theme lives on <html data-theme>, or follows the device when unset.
  useEffect(() => {
    const read = () => setOutline(getComputedStyle(document.documentElement).getPropertyValue('--outline').trim());
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', read);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', read);
    };
  }, []);

  useEffect(() => {
    const p = new GamePainter(world);
    p.preloadFlags(world.features.flatMap(f => (f.properties.code ? [f.properties.code] : [])));
    painted.current = new Map();
    setPainter(p);
    return () => p.dispose();
  }, [world]);

  // Repaint only the countries whose state changed since the last render.
  useEffect(() => {
    if (!painter) return;
    const prev = painted.current;
    if (paints.size === 0 && prev.size > 0) {
      painter.reset();
    } else {
      for (const f of new Set([...prev.keys(), ...paints.keys()])) {
        const next = paints.get(f) ?? 'blank';
        if ((prev.get(f) ?? 'blank') !== next) painter.paint([f], next);
      }
    }
    painted.current = new Map(paints);
  }, [painter, paints]);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    // Ignore the click that ends a drag-to-rotate.
    if (e.delta > 6 || !e.uv) return;
    const lonLat: [number, number] = [e.uv.x * 360 - 180, e.uv.y * 180 - 90];
    const clicked = world.features.find(f => d3.geoContains(f, lonLat));
    if (clicked) onPick(clicked, lonLat);
  };

  return (
    // flat + unlit: the sticker look, with token colours shown as-is.
    <Canvas flat camera={{ position: [0, 0, 3], fov: 45 }}>
      {painter && (
        <>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: three.js mesh, not a DOM element */}
          <mesh onClick={onClick}>
            <sphereGeometry args={[1, 128, 64]} />
            <meshBasicMaterial map={painter.texture} />
          </mesh>
          {/* Sticker edge: a slightly bigger back-face sphere shows as an outline ring. */}
          <mesh scale={1.025}>
            <sphereGeometry args={[1, 64, 32]} />
            <meshBasicMaterial color={outline} side={THREE.BackSide} />
          </mesh>
        </>
      )}
      <OrbitControls makeDefault enablePan={false} minDistance={1.2} maxDistance={6} zoomSpeed={0.6} />
      <CameraRig focus={focus} />
    </Canvas>
  );
}
