import * as d3 from 'd3';
import * as THREE from 'three';
import { flagPngUrl, mainBounds, type Country, type World } from '../countries';

export type Paint = 'blank' | 'flag' | 'wrong' | 'answer';

const TEX_W = 8192, TEX_H = 4096;
// See-through margin around the lifted answer, so the stretched canvas edge stays empty.
const LIFT_PAD = 4;
// Canvas can't use CSS variables, so the theme's map tokens are read when a round starts.
function readColors() {
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => css.getPropertyValue(name).trim();
  return {
    ocean: token('--map-sea'),
    blank: token('--map-land'),
    wrong: token('--map-wrong'),
    answer: token('--map-answer'),
    border: token('--map-border'),
  };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Equirectangular canvas wrapped around the game globe. Countries start blank
// and get repainted one by one (flag revealed, wrong guess, answer highlight).
export class GamePainter {
  readonly texture: THREE.CanvasTexture;
  // The answer alone on a see-through canvas cropped to its bounds, for the layer lifted above the dim.
  readonly lift: THREE.CanvasTexture;
  private ctx: CanvasRenderingContext2D;
  private liftCtx: CanvasRenderingContext2D;
  private path: d3.GeoPath<any, any>;
  private liftPath: d3.GeoPath<any, any>;
  private boundsPath: d3.GeoPath<any, any>;
  private images = new Map<string, Promise<HTMLImageElement | null>>();
  private colors = readColors();

  constructor(private world: World) {
    const canvas = document.createElement('canvas');
    canvas.width = TEX_W;
    canvas.height = TEX_H;
    this.ctx = canvas.getContext('2d')!;

    const projection = d3.geoEquirectangular()
      .scale(TEX_W / (2 * Math.PI))
      .translate([TEX_W / 2, TEX_H / 2]);
    this.boundsPath = d3.geoPath(projection);
    this.path = d3.geoPath(projection, this.ctx);

    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 8;

    this.liftCtx = document.createElement('canvas').getContext('2d')!;
    this.liftPath = d3.geoPath(projection, this.liftCtx);
    this.lift = new THREE.CanvasTexture(this.liftCtx.canvas);
    this.lift.colorSpace = THREE.SRGBColorSpace;
    // No mipmaps: the canvas edge is stretched over the rest of the globe, so it must stay see-through.
    this.lift.generateMipmaps = false;
    this.lift.minFilter = THREE.LinearFilter;
    this.reset();
  }

  reset() {
    this.colors = readColors();
    const { ctx } = this;
    const colors = this.colors;
    ctx.fillStyle = colors.ocean;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
    ctx.beginPath();
    this.world.features.forEach(f => { this.path(f); });
    ctx.fillStyle = colors.blank;
    ctx.fill();
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    this.texture.needsUpdate = true;
  }

  flag(code: string) {
    let img = this.images.get(code);
    if (!img) {
      img = loadImage(flagPngUrl(code));
      this.images.set(code, img);
    }
    return img;
  }

  preloadFlags(codes: string[]) {
    codes.forEach(code => { this.flag(code); });
  }

  async paint(features: Country[], mode: Paint) {
    const imgs = await Promise.all(features.map(f =>
      mode === 'flag' && f.properties.code ? this.flag(f.properties.code) : Promise.resolve(null)));
    const { ctx } = this;
    const colors = this.colors;

    features.forEach((f, i) => {
      ctx.save();
      ctx.beginPath();
      this.path(f);
      ctx.clip();
      const img = imgs[i];
      if (img) {
        const [[x0, y0], [x1, y1]] = mainBounds(this.boundsPath, f);
        // Repeat the mainland-fitted flag, like the flat board's SVG pattern, so far-off parts (Alaska) get filled too.
        const pattern = ctx.createPattern(img, 'repeat');
        pattern?.setTransform(new DOMMatrix().translate(x0, y0).scale((x1 - x0) / img.width, (y1 - y0) / img.height));
        ctx.fillStyle = pattern ?? colors.blank;
        ctx.fill();
      } else {
        ctx.fillStyle = mode === 'flag' ? colors.blank : colors[mode];
        ctx.fill();
      }
      ctx.restore();

      ctx.beginPath();
      this.path(f);
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    this.texture.needsUpdate = true;
  }

  // Draws `features` on the lift canvas, cropped to their bounds, and maps it back onto the globe.
  liftAnswer(features: Country[]) {
    const { liftCtx: ctx, lift } = this;
    const [[x0, y0], [x1, y1]] = this.boundsPath.bounds({ type: 'FeatureCollection', features });
    const x = Math.floor(x0) - LIFT_PAD, y = Math.floor(y0) - LIFT_PAD;
    // Resizing clears the canvas and its transform.
    ctx.canvas.width = Math.ceil(x1) + LIFT_PAD - x;
    ctx.canvas.height = Math.ceil(y1) + LIFT_PAD - y;
    ctx.translate(-x, -y);
    ctx.beginPath();
    features.forEach(f => { this.liftPath(f); });
    ctx.fillStyle = this.colors.answer;
    ctx.fill();
    ctx.strokeStyle = this.colors.border;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Stretch the crop back over its place on the full equirectangular map (flipY puts row 0 at the top).
    const { width: w, height: h } = ctx.canvas;
    lift.repeat.set(TEX_W / w, TEX_H / h);
    lift.offset.set(-x / w, (h + y - TEX_H) / h);
    // A new canvas size needs a new GPU texture.
    lift.dispose();
    lift.needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
    this.lift.dispose();
  }
}
