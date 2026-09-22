// Country → Popular Exam mapping for Preparation AI.
// Used by the country selector on the Discover page and by the auth flow to
// pre-filter exams by region. 15 countries (India + 13 popular study-abroad
// destinations + "Other" fallback).

export interface CountryInfo {
  /** Stable lowercase code used in URLs, store state, and selectors. */
  code: string;
  /** Human-readable name shown in the selector. */
  name: string;
  /** Emoji flag (rendered in chip + cards). */
  flag: string;
  /** Exam IDs (matching EXAM_PATTERNS) popular for students from this country. */
  popularExams: string[];
}

export const COUNTRIES: CountryInfo[] = [
  {
    code: 'in',
    name: 'India',
    flag: '🇮🇳',
    popularExams: ['jee-main', 'jee-advanced', 'neet', 'cat', 'upsc', 'gate', 'cuet'],
  },
  {
    code: 'us',
    name: 'USA',
    flag: '🇺🇸',
    popularExams: ['sat', 'gre', 'gmat', 'toefl', 'ap'],
  },
  {
    code: 'uk',
    name: 'UK',
    flag: '🇬🇧',
    popularExams: ['ielts', 'toefl', 'gre', 'gmat'],
  },
  {
    code: 'ca',
    name: 'Canada',
    flag: '🇨🇦',
    popularExams: ['ielts', 'toefl', 'gre', 'gmat'],
  },
  {
    code: 'au',
    name: 'Australia',
    flag: '🇦🇺',
    popularExams: ['ielts', 'toefl', 'gre', 'gmat'],
  },
  {
    code: 'ae',
    name: 'UAE (GCC)',
    flag: '🇦🇪',
    popularExams: ['jee-main', 'neet', 'ielts', 'toefl', 'sat', 'gre', 'gmat'],
  },
  {
    code: 'sg',
    name: 'Singapore',
    flag: '🇸🇬',
    popularExams: ['ielts', 'toefl', 'sat', 'gre', 'gmat'],
  },
  {
    code: 'de',
    name: 'Germany',
    flag: '🇩🇪',
    popularExams: ['ielts', 'toefl', 'gre', 'gmat'],
  },
  {
    code: 'nz',
    name: 'New Zealand',
    flag: '🇳🇿',
    popularExams: ['ielts', 'toefl', 'gre', 'gmat'],
  },
  {
    code: 'ie',
    name: 'Ireland',
    flag: '🇮🇪',
    popularExams: ['ielts', 'toefl', 'gre', 'gmat'],
  },
  {
    code: 'nl',
    name: 'Netherlands',
    flag: '🇳🇱',
    popularExams: ['ielts', 'toefl', 'gre', 'gmat'],
  },
  {
    code: 'se',
    name: 'Sweden',
    flag: '🇸🇪',
    popularExams: ['ielts', 'toefl', 'gre', 'gmat'],
  },
  {
    code: 'jp',
    name: 'Japan',
    flag: '🇯🇵',
    popularExams: ['ielts', 'toefl', 'gre', 'gmat'],
  },
  {
    code: 'sa',
    name: 'Saudi Arabia (GCC)',
    flag: '🇸🇦',
    popularExams: ['jee-main', 'neet', 'ielts', 'toefl', 'sat', 'gre', 'gmat'],
  },
  {
    code: 'qa',
    name: 'Qatar (GCC)',
    flag: '🇶🇦',
    popularExams: ['jee-main', 'neet', 'ielts', 'toefl', 'sat'],
  },
  {
    code: 'om',
    name: 'Oman (GCC)',
    flag: '🇴🇲',
    popularExams: ['jee-main', 'neet', 'ielts', 'toefl', 'sat'],
  },
  {
    code: 'kw',
    name: 'Kuwait (GCC)',
    flag: '🇰🇼',
    popularExams: ['jee-main', 'neet', 'ielts', 'toefl', 'sat'],
  },
  {
    code: 'bh',
    name: 'Bahrain (GCC)',
    flag: '🇧🇭',
    popularExams: ['jee-main', 'neet', 'ielts', 'toefl', 'sat'],
  },
  {
    code: 'other',
    name: 'Other',
    flag: '🌍',
    popularExams: ['ielts', 'toefl', 'sat', 'gre', 'gmat'],
  },
];

export type ExamRegion = 'India' | 'GCC' | 'Global';

export const GCC_COUNTRY_CODES = ['ae', 'sa', 'qa', 'om', 'kw', 'bh'];

export function getRegionForCountry(countryCode?: string): ExamRegion {
  if (!countryCode) return 'India';
  const c = countryCode.toLowerCase().trim();
  if (c === 'in' || c === 'india') return 'India';
  if (
    GCC_COUNTRY_CODES.includes(c) ||
    ['gcc', 'uae', 'united arab emirates', 'dubai', 'abu dhabi', 'saudi', 'saudi arabia', 'qatar', 'doha', 'oman', 'muscat', 'kuwait', 'bahrain'].some((k) => c.includes(k))
  ) {
    return 'GCC';
  }
  return 'Global';
}

/**
 * Returns the list of popular exam IDs for a country code.
 * Falls back to a sensible default (IELTS + TOEFL) for unknown codes.
 */
export function getExamsForCountry(code: string): string[] {
  const country = COUNTRIES.find((c) => c.code === code.toLowerCase());
  if (!country) return ['ielts', 'toefl'];
  return country.popularExams;
}

/**
 * Returns the full CountryInfo for a country code, or undefined if not found.
 */
export function getCountryByCode(code: string): CountryInfo | undefined {
  return COUNTRIES.find((c) => c.code === code.toLowerCase());
}
