// AlehKireyeuStudio — отправка заявок
// Никаких токенов на клиенте: всё уходит на серверную функцию /api/lead

const LEAD_ENDPOINT = '/api/lead';
const FORM_OPENED_AT = Date.now();

// Honeypot: невидимое поле, которое заполняют только боты
(function injectHoneypots() {
  const css = document.createElement('style');
  css.textContent = '.hp-field{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;}';
  document.head.appendChild(css);
  const add = () => document.querySelectorAll('form').forEach(f => {
    if (f.dataset.hpReady) return;
    f.dataset.hpReady = '1';
    const w = document.createElement('div');
    w.className = 'hp-field';
    w.setAttribute('aria-hidden', 'true');
    w.innerHTML = '<label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label>';
    f.appendChild(w);
  });
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', add) : add();
})();

function readHoneypot() {
  const el = document.querySelector('.hp-field input[name="website"]');
  return el ? el.value : '';
}

// Основная функция отправки — вызывается из любой формы
window.submitForm = async function (data, onSuccess) {
  const payload = Object.assign({}, data, {
    website: readHoneypot(),
    ts: FORM_OPENED_AT
  });

  try {
    const res = await fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const info = await res.json().catch(() => ({}));
      console.warn('Lead error', res.status, info.error || '');
      if (res.status === 400 || res.status === 429) {
        alert(res.status === 429
          ? 'Слишком много заявок подряд. Попробуйте через минуту.'
          : 'Проверьте, пожалуйста, имя и номер телефона.');
        return;
      }
    }
  } catch (e) {
    console.warn('Lead network error', e);
  }

  window.location.href = 'thank-you.html';
};
