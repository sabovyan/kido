import * as d3 from 'd3';
import * as THREE from 'three';
import { flagPngUrl, mainBounds, type Country, type World } from '../countries';

export type Paint = 'blank' | 'flag' | 'wrong' | 'answer';

const TEX_W = 8192, TEX_H = 4096;
export const COLORS = {
  ocean: '#7fb0d6',
  blank: '#e6e2d6',
  wrong: '#e5484d',
  answer: '#f5a524',
  border: '#555',
};

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
  private ctx: CanvasRenderingContext2D;
  private path: d3.GeoPath<any, any>;
  private boundsPath: d3.GeoPath<any, any>;
  private images = new Map<string, Promise<HTMLImageElement | null>>();

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
    this.reset();
  }

  reset() {
    const { ctx } = this;
    ctx.fillStyle = COLORS.ocean;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
    ctx.beginPath();
    this.world.features.forEach(f => { this.path(f); });
    ctx.fillStyle = COLORS.blank;
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
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

    features.forEach((f, i) => {
      ctx.save();
      ctx.beginPath();
      this.path(f);
      ctx.clip();
      const img = imgs[i];
      if (img) {
        const [[x0, y0], [x1, y1]] = mainBounds(this.boundsPath, f);
        ctx.drawImage(img, x0, y0, x1 - x0, y1 - y0);
      } else {
        ctx.fillStyle = mode === 'flag' ? COLORS.blank : COLORS[mode];
        ctx.fill();
      }
      ctx.restore();

      ctx.beginPath();
      this.path(f);
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    this.texture.needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
  }
}
