// ============================================================================
// Country → IANA timezone mapping (curated, covers 40+ countries)
// ----------------------------------------------------------------------------
// Used by the clock settings dialog so the user can pick a country and have
// the IANA timezone auto-fill. InternationaLy-supported list would be huge;
// this curated list keeps the picker small and ergonomic.
// ============================================================================

export interface CountryTimezone {
  country: string;
  iana: string;
  // Display name with UTC offset label, e.g. "India (UTC+05:30)"
  label: string;
}

function withOffset(iana: string, country: string): CountryTimezone {
  // Use Intl to compute the offset for "now" so the picker shows the right
  // UTC label even for zones with DST.
  let offsetLabel = '';
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: iana,
      timeZoneName: 'shortOffset',
    });
    const parts = fmt.formatToParts(new Date());
    const tz = parts.find((p) => p.type === 'timeZoneName');
    offsetLabel = tz?.value ?? '';
  } catch {
    offsetLabel = '';
  }
  const label = offsetLabel ? `${country} (${offsetLabel})` : country;
  return { country, iana, label };
}

export const COUNTRY_TIMEZONES: CountryTimezone[] = [
  withOffset('Asia/Kolkata', 'India'),
  withOffset('Asia/Karachi', 'Pakistan'),
  withOffset('Asia/Dhaka', 'Bangladesh'),
  withOffset('Asia/Kathmandu', 'Nepal'),
  withOffset('Asia/Colombo', 'Sri Lanka'),
  withOffset('Asia/Dubai', 'UAE'),
  withOffset('Asia/Riyadh', 'Saudi Arabia'),
  withOffset('Asia/Tehran', 'Iran'),
  withOffset('Asia/Kabul', 'Afghanistan'),
  withOffset('Asia/Yangon', 'Myanmar'),
  withOffset('Asia/Bangkok', 'Thailand'),
  withOffset('Asia/Jakarta', 'Indonesia'),
  withOffset('Asia/Manila', 'Philippines'),
  withOffset('Asia/Hong_Kong', 'Hong Kong'),
  withOffset('Asia/Taipei', 'Taiwan'),
  withOffset('Asia/Shanghai', 'China'),
  withOffset('Asia/Tokyo', 'Japan'),
  withOffset('Asia/Seoul', 'South Korea'),
  withOffset('Asia/Singapore', 'Singapore'),
  withOffset('Asia/Kuala_Lumpur', 'Malaysia'),
  withOffset('Asia/Ho_Chi_Minh', 'Vietnam'),
  withOffset('Australia/Sydney', 'Australia (Sydney)'),
  withOffset('Australia/Perth', 'Australia (Perth)'),
  withOffset('Pacific/Auckland', 'New Zealand'),
  withOffset('Pacific/Honolulu', 'Hawaii (USA)'),
  withOffset('America/Anchorage', 'Alaska (USA)'),
  withOffset('America/Los_Angeles', 'USA (Pacific)'),
  withOffset('America/Denver', 'USA (Mountain)'),
  withOffset('America/Chicago', 'USA (Central)'),
  withOffset('America/New_York', 'USA (Eastern)'),
  withOffset('America/Toronto', 'Canada (Eastern)'),
  withOffset('America/Vancouver', 'Canada (Pacific)'),
  withOffset('America/Mexico_City', 'Mexico'),
  withOffset('America/Sao_Paulo', 'Brazil'),
  withOffset('America/Argentina/Buenos_Aires', 'Argentina'),
  withOffset('America/Bogota', 'Colombia'),
  withOffset('America/Lima', 'Peru'),
  withOffset('America/Santiago', 'Chile'),
  withOffset('Europe/London', 'United Kingdom'),
  withOffset('Europe/Dublin', 'Ireland'),
  withOffset('Europe/Lisbon', 'Portugal'),
  withOffset('Europe/Paris', 'France'),
  withOffset('Europe/Berlin', 'Germany'),
  withOffset('Europe/Madrid', 'Spain'),
  withOffset('Europe/Rome', 'Italy'),
  withOffset('Europe/Amsterdam', 'Netherlands'),
  withOffset('Europe/Brussels', 'Belgium'),
  withOffset('Europe/Zurich', 'Switzerland'),
  withOffset('Europe/Vienna', 'Austria'),
  withOffset('Europe/Stockholm', 'Sweden'),
  withOffset('Europe/Oslo', 'Norway'),
  withOffset('Europe/Copenhagen', 'Denmark'),
  withOffset('Europe/Helsinki', 'Finland'),
  withOffset('Europe/Warsaw', 'Poland'),
  withOffset('Europe/Athens', 'Greece'),
  withOffset('Europe/Istanbul', 'Turkey'),
  withOffset('Europe/Moscow', 'Russia'),
  withOffset('Africa/Cairo', 'Egypt'),
  withOffset('Africa/Lagos', 'Nigeria'),
  withOffset('Africa/Johannesburg', 'South Africa'),
  withOffset('Africa/Nairobi', 'Kenya'),
  withOffset('UTC', 'UTC (Coordinated Universal Time)'),
];

export function findTimezoneByCountry(country?: string): CountryTimezone | undefined {
  if (!country) return undefined;
  // Prefer an exact country match; otherwise fall back to a startsWith match.
  const exact = COUNTRY_TIMEZONES.find((c) =>
    c.country.toLowerCase() === country.toLowerCase(),
  );
  if (exact) return exact;
  return COUNTRY_TIMEZONES.find((c) =>
    c.country.toLowerCase().startsWith(country.toLowerCase().split(' ')[0] ?? ''),
  );
}
