import { escapeICalText } from '../iCalText';

describe('escapeICalText', () => {
  it('escapes a literal backslash', () => {
    expect(escapeICalText('a\\b')).toBe('a\\\\b');
  });

  it('escapes a semicolon', () => {
    expect(escapeICalText('one;two')).toBe('one\\;two');
  });

  it('escapes a comma', () => {
    expect(escapeICalText('one,two,three')).toBe('one\\,two\\,three');
  });

  it('converts \\n line breaks', () => {
    expect(escapeICalText('one\ntwo')).toBe('one\\ntwo');
  });

  it('converts \\r\\n line breaks', () => {
    expect(escapeICalText('one\r\ntwo')).toBe('one\\ntwo');
  });

  it('escapes backslash before applying the other replacements (order matters)', () => {
    // A literal "\," in the input must end up as "\\\\\\," — backslash first,
    // then the comma. If order were wrong we'd get "\\\\,".
    expect(escapeICalText('a\\,b')).toBe('a\\\\\\,b');
  });

  it('passes plain text through untouched', () => {
    expect(escapeICalText('Hello world')).toBe('Hello world');
  });

  it('passes Unicode and emoji through untouched', () => {
    expect(escapeICalText('Buy 🥛 milk')).toBe('Buy 🥛 milk');
  });

  it('handles the empty string', () => {
    expect(escapeICalText('')).toBe('');
  });

  it('escapes all four special characters in one string', () => {
    expect(escapeICalText('a\\b;c,d\ne')).toBe('a\\\\b\\;c\\,d\\ne');
  });
});
