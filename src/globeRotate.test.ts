import { describe, expect, it } from 'vitest';
import { fingerRotateSpeed, mouseRotateSpeed, TOUCH_GAIN } from './globeRotate';

// What OrbitControls does with rotateSpeed: the angle turned for a drag of dx px.
const turnFor = (dx: number, height: number, speed: number) => (2 * Math.PI * dx * speed) / height;

// How far on screen the globe's surface at the middle of the view moves when turned by angle.
const surfaceMove = (angle: number, height: number, distance: number, fov: number) =>
  (angle * height) / (2 * (distance - 1) * Math.tan((fov * Math.PI) / 360));

describe('fingerRotateSpeed', () => {
  it.each([
    [3, 45, 740], // default view, phone
    [1.2, 45, 740], // fully zoomed in
    [6, 45, 740], // fully zoomed out
    [3, 60, 400], // other fov and canvas size
  ])('moves the surface TOUCH_GAIN times as far as the finger (distance %d, fov %d, height %d)', (distance, fov, height) => {
    const speed = fingerRotateSpeed(distance, fov);
    expect(surfaceMove(turnFor(60, height, speed), height, distance, fov)).toBeCloseTo(60 * TOUCH_GAIN, 6);
  });

  it('is about 0.66 at the default distance of 3 with a 45° fov', () => {
    expect(fingerRotateSpeed(3, 45)).toBeCloseTo(0.6592, 4);
  });

  it('slows down as the camera gets closer', () => {
    expect(fingerRotateSpeed(1.2, 45)).toBeLessThan(fingerRotateSpeed(3, 45));
    expect(fingerRotateSpeed(1.2, 45) / fingerRotateSpeed(3, 45)).toBeCloseTo(0.1, 6);
  });
});

describe('mouseRotateSpeed', () => {
  it('keeps the OrbitControls default of 1 at the starting distance', () => {
    expect(mouseRotateSpeed(3, 3)).toBe(1);
  });

  it.each([1.2, 2, 4.5, 6])('moves the surface the same amount per drag as at the start (distance %d)', distance => {
    const atStart = surfaceMove(turnFor(30, 650, mouseRotateSpeed(3, 3)), 650, 3, 45);
    expect(surfaceMove(turnFor(30, 650, mouseRotateSpeed(distance, 3)), 650, distance, 45)).toBeCloseTo(atStart, 6);
  });
});
