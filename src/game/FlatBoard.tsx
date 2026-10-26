import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { flagUrl, mainBounds, type Country } from '../countries';
import type { BoardProps } from './board';
import { COLORS, type Paint } from './painter';

const width = 1600, height = 820;

type Scene = {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  paths: d3.Selection<SVGPathElement, Country, SVGGElement, unknown>;
  path: d3.GeoPath;
  zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
  flags: Map<Country, string>;
};

export function FlatBoard({ world, paints, focus, onPick }: BoardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const scene = useRef<Scene | null>(null);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  });

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const svg = d3.select(el).attr('viewBox', [0, 0, width, height]);
    svg.selectAll('*').remove();
    const defs = svg.append('defs');
    const g = svg.append('g');

    const projection = d3.geoNaturalEarth1()
      .fitExtent([[10, 10], [width - 10, height - 10]], { type: 'Sphere' });
    const path = d3.geoPath(projection);

    g.append('path').attr('class', 'sphere').attr('d', path({ type: 'Sphere' }));

    const flags = new Map<Country, string>();
    world.features.forEach((f, i) => {
      if (!f.properties.code) return;
      const [[x0, y0], [x1, y1]] = mainBounds(path, f);
      const id = `game-flag-${i}`;
      defs.append('pattern')
        .attr('id', id)
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('x', x0).attr('y', y0)
        .attr('width', x1 - x0).attr('height', y1 - y0)
        .append('image')
        .attr('href', flagUrl(f.properties.code))
        .attr('width', x1 - x0).attr('height', y1 - y0)
        .attr('preserveAspectRatio', 'none');
      flags.set(f, `url(#${id})`);
    });

    const paths = g.selectAll<SVGPathElement, Country>('path.country')
      .data(world.features)
      .join('path')
      .attr('class', 'country')
      .attr('d', path)
      .attr('fill', COLORS.blank)
      // d3-zoom swallows the click that ends a drag, so this only fires on real clicks.
      .on('click', (event: MouseEvent, d) => {
        const lonLat = projection.invert?.(d3.pointer(event, g.node()));
        if (lonLat) onPickRef.current(d, lonLat);
      });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 20])
      .translateExtent([[0, 0], [width, height]])
      .on('zoom', e => g.attr('transform', e.transform));
    svg.call(zoom);

    scene.current = { svg, paths, path, zoom, flags };
    return () => { scene.current = null; };
  }, [world]);

  useEffect(() => {
    const s = scene.current;
    if (!s) return;
    const fill = (paint: Paint | undefined, d: Country) =>
      paint === 'flag' ? (s.flags.get(d) ?? COLORS.blank) : COLORS[paint ?? 'blank'];
    s.paths.attr('fill', d => fill(paints.get(d), d));
  }, [paints]);

  // Zoom to the focused country's mainland.
  useEffect(() => {
    const s = scene.current;
    if (!s || !focus) return;
    const main = d3.greatest(focus.features, f => d3.geoArea(f));
    if (!main) return;
    const [[x0, y0], [x1, y1]] = mainBounds(s.path, main);
    const k = Math.min(8, 0.5 / Math.max((x1 - x0) / width, (y1 - y0) / height));
    const t = d3.zoomIdentity.translate(width / 2, height / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    s.svg.transition().duration(1200).call(s.zoom.transform, t);
  }, [focus]);

  return <svg ref={svgRef} className="flat-map" />;
}
