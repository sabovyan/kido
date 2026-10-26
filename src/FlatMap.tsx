import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { flagUrl, loadWorld, mainBounds, type Country, type CountryProps } from './countries';
import { CountryCard, Tooltip, ZoomButtons, isTouch, type TipState } from './Tooltip';

const width = 1600, height = 820;
const PHONE = '(max-width: 767.98px)';
const COUNTRY = 'stroke-map-border stroke-[0.6] [vector-effect:non-scaling-stroke] hover:stroke-outline hover:stroke-2';

export function FlatMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [tip, setTip] = useState<TipState>(null);
  const [picked, setPicked] = useState<CountryProps | null>(null);

  useEffect(() => {
    let cancelled = false;
    const svg = d3.select(svgRef.current!).attr('viewBox', [0, 0, width, height]);

    loadWorld().then(world => {
      if (cancelled) return;
      svg.selectAll('*').remove();
      const defs = svg.append('defs');
      const g = svg.append('g');

      const projection = d3.geoNaturalEarth1()
        .fitExtent([[10, 40], [width - 10, height - 10]], { type: 'Sphere' });
      const path = d3.geoPath(projection);

      g.append('path').attr('class', 'fill-map-sea').attr('d', path({ type: 'Sphere' }));

      const fills = new Map<Country, string>();
      world.features.forEach((f, i) => {
        if (!f.properties.code) return;
        const [[x0, y0], [x1, y1]] = mainBounds(path, f);
        const id = `flag-${i}`;
        defs.append('pattern')
          .attr('id', id)
          .attr('patternUnits', 'userSpaceOnUse')
          .attr('x', x0).attr('y', y0)
          .attr('width', x1 - x0).attr('height', y1 - y0)
          .append('image')
          .attr('href', flagUrl(f.properties.code))
          .attr('width', x1 - x0).attr('height', y1 - y0)
          .attr('preserveAspectRatio', 'none');
        fills.set(f, `url(#${id})`);
      });

      g.selectAll<SVGPathElement, Country>('path.country')
        .data(world.features)
        .join('path')
        .attr('class', `country ${COUNTRY}`)
        .attr('d', path)
        .style('fill', d => fills.get(d) ?? 'var(--map-land)')
        .on('pointermove', (event: PointerEvent, d) => {
          if (event.pointerType === 'mouse') setTip({ x: event.clientX, y: event.clientY, country: d.properties });
        })
        .on('pointerleave', () => setTip(null))
        // d3-zoom swallows the click that ends a drag, so this only fires on real taps.
        .on('click', (event: MouseEvent, d) => {
          if (isTouch(event)) setPicked(d.properties);
        });

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 20])
        .translateExtent([[0, 0], [width, height]])
        .on('zoom', e => g.attr('transform', e.transform));
      zoomRef.current = zoom;

      // On phones the svg is much taller than the map: zoom within the visible area
      // (so the whole world can be panned) and open zoomed in to fill the height.
      const el = svgRef.current;
      if (el && window.matchMedia(PHONE).matches) {
        const visible = (): [[number, number], [number, number]] => {
          const h = Math.max(height, (width * el.clientHeight) / el.clientWidth);
          return [[0, (height - h) / 2], [width, (height + h) / 2]];
        };
        zoom.extent(visible);
        svg.call(zoom);
        const [[, y0], [, y1]] = visible();
        const k = (y1 - y0) / height;
        svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(k).translate(-width / 2, -height / 2));
      } else {
        svg.call(zoom);
      }
    });

    return () => { cancelled = true; };
  }, []);

  const zoomBy = (factor: number) => {
    const el = svgRef.current, zoom = zoomRef.current;
    if (!el || !zoom) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    d3.select(el).transition().duration(still ? 0 : 240).call(zoom.scaleBy, factor);
  };

  return (
    <>
      <svg ref={svgRef} className="block size-full cursor-grab active:cursor-grabbing" />
      <Tooltip tip={tip} />
      <ZoomButtons onZoom={zoomBy} />
      <CountryCard country={picked} onClose={() => setPicked(null)} />
    </>
  );
}
