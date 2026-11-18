const escapeHtml = (text) => String(text)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function layout(lang, t, body) {
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(t.title)}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; color: #222; }
    label { display: block; font-weight: bold; margin-top: 1.2rem; }
    textarea { width: 100%; min-height: 90px; margin-top: .4rem; font: inherit; }
    button { margin-top: 1.5rem; padding: .6rem 1.2rem; font: inherit; cursor: pointer; }
    .date { color: #555; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

function renderFeedbackPage({ lang, t, today }) {
  const otherLang = lang === 'en' ? 'fr' : 'en';
  const questions = t.questions.map((question, i) => `
    <label for="q${i + 1}">${i + 1}. ${escapeHtml(question)}</label>
    <textarea id="q${i + 1}" name="q${i + 1}" required></textarea>`).join('');

  return layout(lang, t, `
  <p><a href="/feedback?lang=${otherLang}">${escapeHtml(t.switchLanguage)}</a></p>
  <h1>${escapeHtml(t.title)}</h1>
  <p class="date">${escapeHtml(t.dateLabel)}: ${escapeHtml(today)}</p>
  <p>${escapeHtml(t.instructions)}</p>
  <form method="post" action="/feedback?lang=${lang}">${questions}
    <button type="submit">${escapeHtml(t.submit)}</button>
  </form>`);
}

function renderThankYouPage({ lang, t }) {
  return layout(lang, t, `
  <h1>${escapeHtml(t.title)}</h1>
  <p>${escapeHtml(t.thankYou)}</p>`);
}

module.exports = { renderFeedbackPage, renderThankYouPage };
