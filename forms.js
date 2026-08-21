// AlehKireyeuStudio — отправка заявок
// Никаких токенов на клиенте: всё уходит на серверную функцию Netlify.

const LEAD_ENDPOINT = '/.netlify/functions/lead';
const FORM_OPENED_AT = Date.now();

console.log('[forms] forms.js загружен, endpoint =', LEAD_ENDPOINT);

// Honeypot: невидимое поле, которое заполняют только боты
(function injectHoneypots() {
  const css = document.createElement('style');
  css.textContent = '.hp-field{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;}';
  document.head.appendChild(css);
  const add = () => {
    const forms = document.querySelectorAll('form');
    forms.forEach(f => {
      if (f.dataset.hpReady) return;
      f.dataset.hpReady = '1';
      const w = document.createElement('div');
      w.className = 'hp-field';
      w.setAttribute('aria-hidden', 'true');
      w.innerHTML = '<label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label>';
      f.appendChild(w);
    });
    console.log('[forms] форм найдено:', forms.length);
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', add) : add();
})();

function readHoneypot(form) {
  const el = (form || document).querySelector('.hp-field input[name="website"]');
  return el ? el.value : '';
}

// Основная функция отправки — вызывается из любой формы
window.submitForm = async function (data, onSuccess, form) {
  console.log('[forms] submitForm вызван, данные:', data);

  const payload = Object.assign({}, data, {
    website: readHoneypot(form),
    ts: FORM_OPENED_AT
  });

  try {
    console.log('[forms] POST →', LEAD_ENDPOINT, payload);
    const res = await fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('[forms] ответ сервера:', res.status);

    if (!res.ok) {
      const info = await res.json().catch(() => ({}));
      console.warn('[forms] ошибка заявки', res.status, info.error || '');
      if (res.status === 429) { alert('Слишком много заявок подряд. Попробуйте через минуту.'); return; }
      if (res.status === 400) { alert('Проверьте, пожалуйста, имя и номер телефона.'); return; }
    }
  } catch (e) {
    console.error('[forms] сеть недоступна:', e);
  }

  console.log('[forms] переход на thank-you.html');
  window.location.href = 'thank-you.html';
};

// Страховка: если инлайновый обработчик формы не сработал (ошибка в другом скрипте),
// заявка всё равно уйдёт — ловим submit на уровне документа.
document.addEventListener('submit', function (e) {
  const f = e.target;
  if (!(f instanceof HTMLFormElement)) return;
  if (f.dataset.leadHandled) return;

  console.log('[forms] перехвачен submit формы:', f);

  if (e.defaultPrevented) { console.log('[forms] submit уже обработан инлайновым handler-ом'); return; }

  e.preventDefault();
  f.dataset.leadHandled = '1';

  const data = {
    name:      f.querySelector('input[type=text]:not([name=website])')?.value || '',
    phone:     f.querySelector('input[type=tel]')?.value || '',
    messenger: f.querySelectorAll('select')[0]?.value || '',
    for_whom:  f.querySelectorAll('select')[1]?.value || '',
    page:      document.title || location.pathname
  };
  window.submitForm(data, null, f).finally(() => { delete f.dataset.leadHandled; });
}, false);
