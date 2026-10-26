import { flagUrl, type CountryProps } from './countries';

export type TipState = { x: number; y: number; country: CountryProps } | null;

export function Tooltip({ tip }: { tip: TipState }) {
  if (!tip) return null;
  const { name, code } = tip.country;
  return (
    <div className="tip" style={{ left: tip.x + 12, top: tip.y + 12 }}>
      {code && <img src={flagUrl(code)} alt="" />}
      {name}
    </div>
  );
}
