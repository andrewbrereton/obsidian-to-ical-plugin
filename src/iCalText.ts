// RFC 5545 §3.3.11 TEXT escape rules. Apply to property values whose type is
// TEXT — e.g. SUMMARY, DESCRIPTION, LOCATION. Property *parameter* values that
// live inside DQUOTE (e.g. ALTREP="...") follow different rules and should
// NOT be passed through here.
//
// Order matters: escape backslashes first so subsequent escape sequences
// don't get double-escaped.
export function escapeICalText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}
