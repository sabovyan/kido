import * as d3 from 'd3';
import * as THREE from 'three';
import { flagPngUrl, mainBounds, type Country, type World } from '../countries';

export type Paint = 'blank' | 'flag' | 'wrong' | 'answer';

const TEX_W = 8192, TEX_H = 4096;
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
  private ctx: CanvasRenderingContext2D;
  private path: d3.GeoPath<any, any>;
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
        ctx.drawImage(img, x0, y0, x1 - x0, y1 - y0);
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

  dispose() {
    this.texture.dispose();
  }
}
