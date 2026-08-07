// ============================================
// Country Matcher — name normalization & alias matching
// ============================================

// Common aliases and abbreviations
const ALIASES = {
  'usa': 'US', 'united states of america': 'US', 'united states': 'US', 'america': 'US',
  'uk': 'GB', 'united kingdom': 'GB', 'great britain': 'GB', 'england': 'GB', 'britain': 'GB',
  'south korea': 'KR', 'korea south': 'KR', 'republic of korea': 'KR',
  'north korea': 'KP', 'korea north': 'KP', 'dprk': 'KP',
  'russia': 'RU', 'russian federation': 'RU',
  'iran': 'IR', 'persia': 'IR',
  'syria': 'SY',
  'turkey': 'TR', 'turkiye': 'TR', 'türkiye': 'TR',
  'ivory coast': 'CI', 'cote d\'ivoire': 'CI', 'cote divoire': 'CI', 'côte d\'ivoire': 'CI',
  'czech republic': 'CZ', 'czechia': 'CZ',
  'greenland': 'DK',
  'congo': 'CG', 'republic of the congo': 'CG', 'congo republic': 'CG', 'congo brazzaville': 'CG',
  'dr congo': 'CD', 'drc': 'CD', 'democratic republic of the congo': 'CD', 'congo kinshasa': 'CD',
  'east timor': 'TL', 'timor leste': 'TL', 'timor-leste': 'TL',
  'cape verde': 'CV', 'cabo verde': 'CV',
  'swaziland': 'SZ', 'eswatini': 'SZ',
  'burma': 'MM', 'myanmar': 'MM',
  'holland': 'NL', 'netherlands': 'NL', 'the netherlands': 'NL',
  'vatican': 'VA', 'vatican city': 'VA', 'holy see': 'VA', 'the holy see': 'VA',
  'palestine': 'PS', 'state of palestine': 'PS',
  'uae': 'AE', 'united arab emirates': 'AE',
  'laos': 'LA', 'lao': 'LA',
  'macedonia': 'MK', 'north macedonia': 'MK',
  'micronesia': 'FM', 'federated states of micronesia': 'FM',
  'brunei': 'BN', 'brunei darussalam': 'BN',
  'bolivia': 'BO',
  'venezuela': 'VE',
  'tanzania': 'TZ',
  'vietnam': 'VN', 'viet nam': 'VN',
  'the gambia': 'GM', 'gambia': 'GM',
  'the bahamas': 'BS', 'bahamas': 'BS',
  'sao tome and principe': 'ST', 'sao tome': 'ST', 'são tomé and príncipe': 'ST',
  'saint kitts and nevis': 'KN', 'st kitts and nevis': 'KN', 'st kitts': 'KN',
  'saint lucia': 'LC', 'st lucia': 'LC',
  'saint vincent and the grenadines': 'VC', 'st vincent': 'VC', 'st vincent and the grenadines': 'VC',
  'antigua and barbuda': 'AG', 'antigua': 'AG',
  'trinidad and tobago': 'TT', 'trinidad': 'TT',
  'bosnia and herzegovina': 'BA', 'bosnia': 'BA',
  'papua new guinea': 'PG', 'png': 'PG',
  'marshall islands': 'MH',
  'solomon islands': 'SB',
  'central african republic': 'CF', 'car': 'CF',
  'south sudan': 'SS',
  'equatorial guinea': 'GQ',
  'guinea bissau': 'GW', 'guinea-bissau': 'GW',
  'sri lanka': 'LK', 'ceylon': 'LK',
  'new zealand': 'NZ',
  'south africa': 'ZA',
  'saudi arabia': 'SA',
  'costa rica': 'CR',
  'el salvador': 'SV',
  'dominican republic': 'DO',
  'sierra leone': 'SL',
  'burkina faso': 'BF',
  'san marino': 'SM',
  // New entries (196 total)
  'taiwan': 'TW', 'chinese taipei': 'TW', 'republic of china': 'TW', 'roc': 'TW', 'formosa': 'TW',
  'kosovo': 'XK', 'republic of kosovo': 'XK',
};

function normalize(str) {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s]/g, '')     // remove special chars
    .replace(/\s+/g, ' ');           // collapse whitespace
}

export class CountryMatcher {
  constructor(countriesData) {
    this.countries = countriesData;
    // Build lookup maps
    this.byId = new Map();
    this.byNormalizedName = new Map();

    for (const country of this.countries) {
      this.byId.set(country.id, country);
      this.byNormalizedName.set(normalize(country.name), country.id);
    }

    // Add all aliases
    for (const [alias, id] of Object.entries(ALIASES)) {
      this.byNormalizedName.set(normalize(alias), id);
    }
  }

  match(input) {
    const norm = normalize(input);
    if (!norm) return null;

    // Direct name match
    const directId = this.byNormalizedName.get(norm);
    if (directId) return directId;

    // Check if input matches any country name start (for partial matching)
    for (const [name, id] of this.byNormalizedName) {
      if (name === norm) return id;
    }

    return null;
  }

  matchCapital(input, countryId) {
    const norm = normalize(input);
    const country = this.byId.get(countryId);
    if (!country) return false;
    return normalize(country.capital) === norm;
  }

  getCountry(id) {
    return this.byId.get(id);
  }

  getCountriesByContinent(continent) {
    return this.countries.filter(c => c.continent === continent);
  }

  getContinents() {
    const map = new Map();
    for (const c of this.countries) {
      if (!map.has(c.continent)) map.set(c.continent, []);
      map.get(c.continent).push(c);
    }
    return map;
  }
}
