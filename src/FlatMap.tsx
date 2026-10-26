import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { flagUrl, loadWorld, mainBounds, type Country } from './countries';
import { Tooltip, type TipState } from './Tooltip';

const width = 1600, height = 820;

export function FlatMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<TipState>(null);

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

      g.append('path').attr('class', 'sphere').attr('d', path({ type: 'Sphere' }));

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
        .attr('class', 'country')
        .attr('d', path)
        .attr('fill', d => fills.get(d) ?? '#ccc')
        .on('mousemove', (event: MouseEvent, d) =>
          setTip({ x: event.clientX, y: event.clientY, country: d.properties }))
        .on('mouseleave', () => setTip(null));

      svg.call(d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 20])
        .translateExtent([[0, 0], [width, height]])
        .on('zoom', e => g.attr('transform', e.transform)));
    });

    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <svg ref={svgRef} className="flat-map" />
      <Tooltip tip={tip} />
    </>
  );
}
