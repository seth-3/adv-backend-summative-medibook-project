const { resolveLanguage, getTranslations, formatToday } = require('../utils/i18n');
const { renderFeedbackPage, renderThankYouPage } = require('../views/feedbackPage');

function showForm(req, res) {
  const lang = resolveLanguage(req.query.lang);
  const t = getTranslations(lang);
  res.type('html').send(renderFeedbackPage({ lang, t, today: formatToday(t.locale) }));
}

function submit(req, res) {
  const lang = resolveLanguage(req.query.lang);
  res.type('html').send(renderThankYouPage({ lang, t: getTranslations(lang) }));
}

module.exports = { showForm, submit };
