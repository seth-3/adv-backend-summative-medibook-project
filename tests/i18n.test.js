const { resolveLanguage, getTranslations, formatToday } = require('../src/utils/i18n');

describe('i18n', () => {
  test('supported languages are kept, anything else falls back to English', () => {
    expect(resolveLanguage('fr')).toBe('fr');
    expect(resolveLanguage('de')).toBe('en');
    expect(resolveLanguage(undefined)).toBe('en');
    expect(resolveLanguage('constructor')).toBe('en');
  });

  test('both locale files have exactly 5 questions', () => {
    expect(getTranslations('en').questions).toHaveLength(5);
    expect(getTranslations('fr').questions).toHaveLength(5);
  });

  test('the date is formatted for the active locale', () => {
    const date = new Date(2026, 10, 18);
    expect(formatToday('en-GB', date)).toContain('November');
    expect(formatToday('fr-FR', date)).toContain('novembre');
  });
});
