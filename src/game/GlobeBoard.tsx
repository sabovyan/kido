import { type ComponentRef, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { Country } from '../countries';
import { fingerRotateSpeed, mouseRotateSpeed } from '../globeRotate';
import type { BoardProps, Focus } from './board';
import { focusDistance, mainlandRadius } from './globeZoom';
import { GamePainter, type Paint } from './painter';

// Matches three.js SphereGeometry UVs for an equirectangular texture.
function lonLatToVec([lon, lat]: [number, number]) {
  const λ = (lon * Math.PI) / 180, φ = (lat * Math.PI) / 180;
  return new THREE.Vector3(Math.cos(φ) * Math.cos(λ), Math.sin(φ), -Math.cos(φ) * Math.sin(λ));
}

type Flight = { from: THREE.Vector3; rot: THREE.Quaternion; d0: number; d1: number; t: number; duration: number };

// Matches the OrbitControls limit below.
const MIN_DISTANCE = 1.2;

// Turns the camera to look at `to` from `distance`: flies over --dur-fly, or jumps under reduced motion.
function flight(camera: THREE.Camera, to: THREE.Vector3, distance: number): Flight {
  const from = camera.position.clone().normalize();
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fly = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-fly')) / 1000 || 1.2;
  return {
    from,
    rot: new THREE.Quaternion().setFromUnitVectors(from, to),
    d0: camera.position.length(),
    d1: distance,
    t: 0,
    duration: still ? 0 : fly,
  };
}

// Turns to the focused country and comes in close enough for a small one to be easy to tap.
// `held` is whether that country is still painted; once it isn't (or focus clears),
// the camera eases back out to where it was before zooming in.
function CameraRig({ focus, held }: { focus: Focus | null; held: boolean }) {
  const camera = useThree(s => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree(s => s.controls) as unknown as { update(): void } | null;
  const anim = useRef<Flight | null>(null);
  // Distance to ease back out to; null while not zoomed in on a focus.
  const home = useRef<number | null>(null);

  useEffect(() => {
    if (!focus) return;
    // Chained focuses keep the first one's home; a flight back out still going is headed there too.
    home.current ??= anim.current?.d1 ?? camera.position.length();
    const fit = focusDistance(mainlandRadius(focus.lonLat, focus.features), camera.fov, camera.aspect);
    anim.current = flight(camera, lonLatToVec(focus.lonLat), Math.max(MIN_DISTANCE, Math.min(fit, home.current)));
  }, [focus, camera]);

  useEffect(() => {
    if (held || home.current === null) return;
    anim.current = flight(camera, camera.position.clone().normalize(), home.current);
    home.current = null;
  }, [held, camera]);

  useFrame((_, dt) => {
    const a = anim.current;
    if (!a) return;
    a.t = a.duration ? Math.min(1, a.t + dt / a.duration) : 1;
    const e = d3.easeCubicInOut(a.t);
    const q = new THREE.Quaternion().slerp(a.rot, e);
    camera.position.copy(a.from).applyQuaternion(q).multiplyScalar(a.d0 + (a.d1 - a.d0) * e);
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
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);

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

  const held = !!focus && focus.features.some(f => (paints.get(f) ?? 'blank') !== 'blank');

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    // Ignore the click that ends a drag-to-rotate.
    if (e.delta > 6 || !e.uv) return;
    const lonLat: [number, number] = [e.uv.x * 360 - 180, e.uv.y * 180 - 90];
    const clicked = world.features.find(f => d3.geoContains(f, lonLat));
    if (clicked) onPick(clicked, lonLat);
  };

  // OrbitControls spins the same angle per drag however close the camera is,
  // so scale it with zoom: touch turns with the finger, a mouse keeps its usual feel.
  const scaleRotate = () => {
    const c = controls.current;
    if (!c) return;
    const distance = c.object.position.length();
    c.rotateSpeed = window.matchMedia('(hover: none)').matches
      ? fingerRotateSpeed(distance, (c.object as THREE.PerspectiveCamera).fov)
      : mouseRotateSpeed(distance, 3);
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
      <OrbitControls ref={controls} makeDefault enablePan={false} minDistance={MIN_DISTANCE} maxDistance={6} zoomSpeed={0.6} onStart={scaleRotate} onChange={scaleRotate} />
      <CameraRig focus={focus} held={held} />
    </Canvas>
  );
}
