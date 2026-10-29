// Builds src/data/countries.json, the facts Learn shows for each country.
//
//   node scripts/build-facts.mjs
//
// Capital, continent, population, neighbours and languages come from GeoNames
// country info (https://download.geonames.org/export/dump/countryInfo.txt),
// licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).
// The fixes below and the flag hooks in scripts/flag-hooks.json were checked by hand.
// Run it again only to refresh the data, and review the diff before committing.
import { readFileSync, writeFileSync } from 'node:fs';

const SOURCE = 'https://download.geonames.org/export/dump/countryInfo.txt';
const root = new URL('../', import.meta.url);

// Same grouping as buildTargets in src/game/Game.tsx: Greenland's clicks count for Denmark.
const SOVEREIGN = { gl: 'dk' };
// GeoNames lists these as their own countries, but the map draws them as part of another.
const PART_OF = { gf: 'fr' };

const CONTINENTS = { AF: 'Africa', AN: 'Antarctica', AS: 'Asia', EU: 'Europe', NA: 'North America', OC: 'Oceania', SA: 'South America' };
const CONTINENT_FIX = { tl: 'AS' };

// Capitals that are out of date or spelled without their accents in GeoNames.
// null leaves the capital out: disputed (no politics for kids) or not sure.
const CAPITAL_FIX = {
  br: 'Brasília', co: 'Bogotá', cr: 'San José', cm: 'Yaoundé', kz: 'Astana', md: 'Chișinău',
  mm: 'Naypyidaw', mv: 'Malé', nc: 'Nouméa', py: 'Asunción', pw: 'Ngerulmud', st: 'São Tomé',
  tf: 'Port-aux-Français', tg: 'Lomé', fo: 'Tórshavn', is: 'Reykjavík', us: 'Washington, D.C.',
  gu: 'Hagåtña', wf: 'Mata-Utu',
  eh: null, il: null, ps: null, gq: null, ms: null,
};

// Main languages, most spoken first. Without an entry a country gets GeoNames' first language.
const LANGUAGES = {
  af: ['Pashto', 'Dari'], as: ['Samoan', 'English'], aw: ['Papiamento', 'Dutch'],
  ba: ['Bosnian', 'Croatian', 'Serbian'], bd: ['Bengali'], be: ['Dutch', 'French', 'German'],
  bf: ['Mooré', 'French'], bi: ['Kirundi', 'French'], bo: ['Spanish', 'Quechua', 'Aymara'], bw: ['English', 'Tswana'],
  by: ['Belarusian', 'Russian'], bz: ['English', 'Spanish'], ca: ['English', 'French'],
  cd: ['French', 'Lingala', 'Swahili'], cf: ['French', 'Sango'], cg: ['French', 'Lingala'],
  ch: ['German', 'French', 'Italian'], ck: ['English', 'Māori'], cm: ['French', 'English'],
  cw: ['Papiamento', 'Dutch', 'English'], cy: ['Greek', 'Turkish'], dj: ['French', 'Arabic'],
  dz: ['Arabic', 'Berber'], er: ['Tigrinya', 'Arabic', 'English'], fi: ['Finnish', 'Swedish'],
  fj: ['English', 'Fijian', 'Hindi'], fo: ['Faroese', 'Danish'], gq: ['Spanish', 'French', 'Portuguese'],
  gu: ['English', 'Chamorro'], hk: ['Chinese', 'English'], ht: ['Haitian Creole', 'French'],
  ie: ['English', 'Irish'], il: ['Hebrew', 'Arabic'], in: ['Hindi', 'English'], iq: ['Arabic', 'Kurdish'],
  ke: ['Swahili', 'English'], kg: ['Kyrgyz', 'Russian'], ki: ['English', 'Gilbertese'],
  km: ['Comorian', 'Arabic', 'French'], kz: ['Kazakh', 'Russian'], lb: ['Arabic', 'French'],
  lk: ['Sinhala', 'Tamil'], ls: ['Sesotho', 'English'], lu: ['Luxembourgish', 'French', 'German'],
  ma: ['Arabic', 'Berber'], me: ['Montenegrin'], mg: ['Malagasy', 'French'], mh: ['Marshallese', 'English'],
  mk: ['Macedonian', 'Albanian'], ml: ['Bambara', 'French'], mo: ['Chinese', 'Portuguese'],
  mp: ['English', 'Chamorro', 'Carolinian'], mt: ['Maltese', 'English'], mu: ['Mauritian Creole', 'English', 'French'],
  mv: ['Dhivehi'], mw: ['Chichewa', 'English'], ne: ['Hausa', 'French'], ng: ['English', 'Hausa', 'Yoruba', 'Igbo'],
  nr: ['Nauruan', 'English'], nu: ['Niuean', 'English'], nz: ['English', 'Māori'], pe: ['Spanish', 'Quechua'],
  pf: ['French', 'Tahitian'], pg: ['Tok Pisin', 'English', 'Hiri Motu'], ph: ['Filipino', 'English'],
  pk: ['Urdu', 'English'], pr: ['Spanish', 'English'], pw: ['Palauan', 'English'], py: ['Spanish', 'Guaraní'],
  rw: ['Kinyarwanda', 'English', 'French'], sc: ['Seychellois Creole', 'English', 'French'],
  sd: ['Arabic', 'English'], sg: ['English', 'Malay', 'Chinese', 'Tamil'], sl: ['English', 'Krio'],
  sn: ['French', 'Wolof'], so: ['Somali', 'Arabic'], sr: ['Dutch', 'Sranan Tongo'], sx: ['English', 'Dutch'],
  sz: ['Swazi', 'English'], td: ['French', 'Arabic'], tj: ['Tajik', 'Russian'], tl: ['Tetum', 'Portuguese'],
  to: ['Tongan', 'English'], tv: ['Tuvaluan', 'English'], tz: ['Swahili', 'English'], ug: ['English', 'Swahili'],
  va: ['Italian', 'Latin'], vu: ['Bislama', 'English', 'French'], wf: ['Wallisian', 'Futunan', 'French'],
  ws: ['Samoan', 'English'], xk: ['Albanian', 'Serbian'], za: ['Zulu', 'Xhosa', 'Afrikaans', 'English'],
  zm: ['English', 'Bemba'], zw: ['English', 'Shona', 'Ndebele'],
};

// Land borders GeoNames gets wrong for our map. Each pair is fixed both ways.
const ADD_NEIGHBOURS = [['cn', 'hk'], ['cn', 'mo']];
// Albania and Serbia only touch through Kosovo; Cuba and the USA only at a navy base.
const DROP_NEIGHBOURS = [['al', 'rs'], ['cu', 'us']];

// Two significant figures: 3,086,700 becomes 3,100,000.
function roundPopulation(n) {
  if (n < 100) return n;
  const step = 10 ** (Math.floor(Math.log10(n)) - 1);
  return Math.round(n / step) * step;
}

const world = JSON.parse(readFileSync(new URL('public/countries.geojson', root), 'utf8'));
const codes = [...new Set(world.features.map(f => SOVEREIGN[f.properties.code] ?? f.properties.code).filter(Boolean))].sort();
const inGame = new Set(codes);
const hooks = JSON.parse(readFileSync(new URL('scripts/flag-hooks.json', root), 'utf8'));

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`GeoNames: ${res.status}`);
const rows = new Map();
for (const line of (await res.text()).split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const c = line.split('\t');
  rows.set(c[0].toLowerCase(), { capital: c[5].trim(), population: Number(c[7]), continent: c[8], languages: c[15], neighbours: c[17] });
}

const languageName = new Intl.DisplayNames(['en'], { type: 'language' });
const neighbours = new Map();
for (const code of codes) {
  const list = (rows.get(code)?.neighbours ?? '').split(',').filter(Boolean)
    .map(n => n.toLowerCase())
    .map(n => PART_OF[n] ?? n)
    .filter(n => n !== code && inGame.has(n));
  neighbours.set(code, new Set(list));
}
// Borders go both ways, e.g. Brazil lists French Guiana (now France), but France doesn't list Brazil.
for (const [a, list] of neighbours) for (const b of list) neighbours.get(b).add(a);
for (const [a, b] of ADD_NEIGHBOURS) { neighbours.get(a).add(b); neighbours.get(b).add(a); }
for (const [a, b] of DROP_NEIGHBOURS) { neighbours.get(a).delete(b); neighbours.get(b).delete(a); }

const facts = {};
const missing = [];
for (const code of codes) {
  const row = rows.get(code);
  if (!row) { missing.push(code); continue; }
  const capital = code in CAPITAL_FIX ? CAPITAL_FIX[code] : row.capital;
  const first = row.languages.split(',')[0];
  const languages = LANGUAGES[code] ?? (first ? [languageName.of(first.split('-')[0])] : []);
  const entry = {};
  if (capital) entry.capital = capital;
  entry.continent = CONTINENTS[CONTINENT_FIX[code] ?? row.continent];
  entry.neighbours = [...neighbours.get(code)].sort();
  if (languages.length) entry.languages = languages;
  if (row.population > 0) entry.population = roundPopulation(row.population);
  if (hooks[code]) entry.flag = hooks[code];
  else missing.push(`${code} (flag)`);
  facts[code] = entry;
}

// One country per line keeps diffs easy to review.
const lines = Object.entries(facts).map(([code, f]) => `  ${JSON.stringify(code)}: ${JSON.stringify(f)}`);
writeFileSync(new URL('src/data/countries.json', root), `{\n${lines.join(',\n')}\n}\n`);
console.log(`Wrote ${lines.length} countries.`);
if (missing.length) console.log(`Missing: ${missing.join(', ')}`);
