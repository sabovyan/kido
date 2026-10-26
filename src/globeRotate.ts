// OrbitControls turns the camera 2π·rotateSpeed per canvas height dragged,
// however close it is. This speed makes the globe's surface (radius 1) under
// the middle of the screen move exactly as far as the finger.
export function fingerRotateSpeed(distance: number, fov: number) {
  return (distance - 1) * Math.tan((fov * Math.PI) / 360) / Math.PI;
}

// A mouse keeps OrbitControls' default speed at the starting distance and
// slows down in step as the camera gets closer, so a drag feels the same at any zoom.
export function mouseRotateSpeed(distance: number, start: number) {
  return (distance - 1) / (start - 1);
}
