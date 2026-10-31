import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { flagUrl, mainBounds, type Country } from '../countries';
import type { BoardProps } from './board';
import type { Paint } from './painter';

const FILLS: Record<Paint, string> = {
  blank: 'var(--map-land)',
  flag: 'var(--map-land)',
  wrong: 'var(--map-wrong)',
  answer: 'var(--map-answer)',
};

const width = 1600, height = 820;
// Screen px the answer's drop sits below it (shadow-drop-md).
const LIFT = 5;
// Smallest share of the board a focused country should cover.
const MIN_TARGET = 0.1;
const COUNTRY = 'stroke-map-border stroke-[0.6] [vector-effect:non-scaling-stroke] hover:stroke-outline hover:stroke-2';

type Scene = {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  paths: d3.Selection<SVGPathElement, Country, SVGGElement, unknown>;
  path: d3.GeoPath;
  zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
  flags: Map<Country, string>;
  dim: d3.Selection<SVGRectElement, unknown, null, undefined>;
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

    g.append('path').attr('class', 'fill-map-sea').attr('d', path({ type: 'Sphere' }));

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

    // The answer's sticker lift: a solid drop under it, like shadow-drop-md. The region covers the
    // whole map so tiny countries' drops aren't clipped.
    const lift = defs.append('filter')
      .attr('id', 'game-answer-lift')
      .attr('filterUnits', 'userSpaceOnUse')
      .attr('x', 0).attr('y', 0)
      .attr('width', width).attr('height', height);
    lift.append('feFlood').style('flood-color', 'var(--drop)');
    lift.append('feComposite').attr('in2', 'SourceAlpha').attr('operator', 'in');
    const liftOffset = lift.append('feOffset').attr('dy', LIFT);
    const liftMerge = lift.append('feMerge');
    liftMerge.append('feMergeNode');
    liftMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const paths = g.selectAll<SVGPathElement, Country>('path.country')
      .data(world.features)
      .join('path')
      .attr('class', `country ${COUNTRY}`)
      .attr('d', path)
      .style('fill', FILLS.blank)
      // d3-zoom swallows the click that ends a drag, so this only fires on real clicks.
      .on('click', (event: MouseEvent, d) => {
        const lonLat = projection.invert?.(d3.pointer(event, g.node()));
        if (lonLat) onPickRef.current(d, lonLat);
      });

    // A scrim over the rest of the map while there's an answer, so it stands out; clicks pass through.
    const dim = g.append('rect')
      .attr('class', 'fill-scrim pointer-events-none')
      .attr('width', width).attr('height', height)
      .style('display', 'none');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 20])
      .translateExtent([[0, 0], [width, height]])
      .on('zoom', e => {
        g.attr('transform', e.transform);
        // Keep the drop LIFT screen px at every zoom and board size.
        liftOffset.attr('dy', LIFT / (g.node()?.getScreenCTM()?.a ?? e.transform.k));
      });
    svg.call(zoom);

    scene.current = { svg, paths, path, zoom, flags, dim };
    return () => { scene.current = null; };
  }, [world]);

  useEffect(() => {
    const s = scene.current;
    if (!s) return;
    const fill = (paint: Paint | undefined, d: Country) =>
      paint === 'flag' ? (s.flags.get(d) ?? FILLS.flag) : FILLS[paint ?? 'blank'];
    const isAnswer = (d: Country) => paints.get(d) === 'answer';
    // The answer is also lifted off the map.
    s.paths
      .style('fill', d => fill(paints.get(d), d))
      .style('filter', d => (isAnswer(d) ? 'url(#game-answer-lift)' : null));
    // The scrim, then the answer are drawn last, so only the answer stays bright.
    s.dim.raise();
    const answers = s.paths.filter(isAnswer).raise();
    s.dim.style('display', answers.empty() ? 'none' : 'inline');
  }, [paints]);

  // Zoom to the focused country's mainland.
  useEffect(() => {
    const s = scene.current;
    if (!s || !focus) return;
    const main = d3.greatest(focus.features, f => d3.geoArea(f));
    if (!main) return;
    const [[x0, y0], [x1, y1]] = mainBounds(s.path, main);
    const size = Math.max((x1 - x0) / width, (y1 - y0) / height);
    // Fit it to half the board, at most 8x; tiny countries zoom further (up to 20x) to stay MIN_TARGET wide.
    const k = Math.min(20, Math.max(Math.min(8, 0.5 / size), MIN_TARGET / size));
    const t = d3.zoomIdentity.translate(width / 2, height / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    s.svg.transition().duration(1200).call(s.zoom.transform, t);
  }, [focus]);

  return <svg ref={svgRef} className="block size-full cursor-crosshair" />;
}
