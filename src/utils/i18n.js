// Locale files are loaded once when the app starts (not inside a request handler).
const locales = {
  en: require('../../locales/en.json'),
  fr: require('../../locales/fr.json'),
};

const DEFAULT_LANGUAGE = 'en';

// Unknown or missing ?lang= falls back to English instead of crashing.
function resolveLanguage(lang) {
  return Object.hasOwn(locales, lang) ? lang : DEFAULT_LANGUAGE;
}

function getTranslations(lang) {
  return locales[resolveLanguage(lang)];
}

function formatToday(locale, date = new Date()) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(date);
}

module.exports = { resolveLanguage, getTranslations, formatToday };
