import data from './countries.json';

// A few easy facts for each flag code the games ask about (Greenland's are under Denmark).
// Built by scripts/build-facts.mjs from GeoNames country info, CC BY 4.0
// (https://www.geonames.org), then checked by hand. Flag hooks are our own words.
export type Continent = 'Africa' | 'Antarctica' | 'Asia' | 'Europe' | 'North America' | 'Oceania' | 'South America';

export type CountryFacts = {
  // Left out when there is none, it's disputed, or we weren't sure.
  capital?: string;
  continent: Continent;
  // Flag codes of countries it shares a land border with, as drawn on our map.
  neighbours: string[];
  // Main languages, most spoken first.
  languages?: string[];
  // Rounded to two digits, e.g. 3,100,000.
  population?: number;
  // What the flag looks like, in words a 7-year-old knows.
  flag: string;
};

export const COUNTRY_FACTS = data as Record<string, CountryFacts>;

export const factsOf = (code: string): CountryFacts | undefined => COUNTRY_FACTS[code];
