import { Link } from '@tanstack/react-router';
import { SegmentedSwitch } from './ui/SegmentedSwitch';

// Map / Globe switch for a game page. Keeps the page's other search params (Learn's `codes`).
// `exact` so the Globe link (no `view`) isn't also marked current on the Map view.
export function ViewSwitch({ from, isMap, className }: { from: '/country/games' | '/country/learn'; isMap: boolean; className?: string }) {
  return (
    <SegmentedSwitch render={<nav aria-label="View" />} className={className}>
      <SegmentedSwitch.Item render={<Link from={from} search={prev => ({ ...prev, view: 'map' })} activeProps={{}} activeOptions={{ exact: true }} aria-current={isMap ? 'page' : undefined} />}>Map</SegmentedSwitch.Item>
      <SegmentedSwitch.Item render={<Link from={from} search={prev => ({ ...prev, view: undefined })} activeProps={{}} activeOptions={{ exact: true }} aria-current={isMap ? undefined : 'page'} />}>Globe</SegmentedSwitch.Item>
    </SegmentedSwitch>
  );
}
