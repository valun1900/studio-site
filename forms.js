// AlehKireyeuStudio — отправка заявок
// Никаких токенов на клиенте: всё уходит на серверную функцию Netlify.

const LEAD_ENDPOINT = '/.netlify/functions/lead';
const FORM_OPENED_AT = Date.now();
const DEBUG = /[?&]debug=1/.test(location.search); // логи только при ?debug=1
const log = (...a) => { if (DEBUG) console.log('[forms]', ...a); };

const CONTACT = { whatsapp: '48571931404', telegram: 'valun1900', phone: '+48571931404' };

// Honeypot: невидимое поле, которое заполняют только боты
(function injectHoneypots() {
  const css = document.createElement('style');
  css.textContent = '.hp-field{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;}'
    + '.lead-error{position:fixed;inset:auto 16px 16px 16px;max-width:420px;margin:0 auto;z-index:9999;background:#F8F5EF;color:#1A1714;border:1px solid #E4DCCF;border-radius:14px;padding:20px 22px;box-shadow:0 18px 50px rgba(26,23,20,.22);font-family:inherit;transform:translateY(20px);opacity:0;transition:transform .25s,opacity .25s;}'
    + '.lead-error.show{transform:translateY(0);opacity:1;}'
    + '.lead-error h4{font-family:"Cormorant Garamond",Georgia,serif;font-size:21px;font-weight:600;margin:0 0 6px;}'
    + '.lead-error p{font-size:14px;line-height:1.5;color:#6B6057;margin:0 0 14px;}'
    + '.lead-error-actions{display:flex;flex-wrap:wrap;gap:8px;}'
    + '.lead-error-actions a{flex:1 1 auto;text-align:center;text-decoration:none;font-size:14px;padding:11px 16px;border-radius:8px;background:#1A1714;color:#F8F5EF;min-height:44px;display:flex;align-items:center;justify-content:center;}'
    + '.lead-error-actions a.alt{background:transparent;color:#1A1714;border:1px solid #E4DCCF;}'
    + '.lead-error-close{position:absolute;top:10px;right:12px;border:0;background:none;font-size:20px;line-height:1;color:#6B6057;cursor:pointer;padding:4px 8px;}';
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
    log('форм найдено:', forms.length);
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', add) : add();
})();

function readHoneypot(form) {
  const el = (form || document).querySelector('.hp-field input[name="website"]');
  return el ? el.value : '';
}

// Заявка не ушла — честно говорим об этом и даём прямые контакты
function showLeadError(message, data) {
  document.querySelectorAll('.lead-error').forEach(el => el.remove());
  const txt = encodeURIComponent(
    'Здравствуйте! Хочу записаться на пробное занятие.'
    + (data && data.name ? ' Меня зовут ' + data.name + '.' : '')
    + (data && data.phone ? ' Мой телефон: ' + data.phone + '.' : '')
  );
  const box = document.createElement('div');
  box.className = 'lead-error';
  box.setAttribute('role', 'alert');
  box.innerHTML = '<button class="lead-error-close" aria-label="Закрыть">×</button>'
    + '<h4>Заявка не отправилась</h4>'
    + '<p>' + message + ' Напишите нам напрямую — ответим сразу.</p>'
    + '<div class="lead-error-actions">'
    + '<a href="https://wa.me/' + CONTACT.whatsapp + '?text=' + txt + '" target="_blank" rel="noopener">WhatsApp</a>'
    + '<a href="https://t.me/' + CONTACT.telegram + '" target="_blank" rel="noopener">Telegram</a>'
    + '<a class="alt" href="tel:' + CONTACT.phone + '">Позвонить</a>'
    + '</div>';
  document.body.appendChild(box);
  requestAnimationFrame(() => box.classList.add('show'));
  box.querySelector('.lead-error-close').onclick = () => box.remove();
}

function restoreSubmitButton(form, label) {
  const btn = form && form.querySelector('.form-submit');
  if (!btn) return;
  btn.disabled = false;
  if (label) btn.textContent = label;
}

// Основная функция отправки — вызывается из любой формы
window.submitForm = async function (data, onSuccess, form) {
  log('submitForm вызван');

  const btn = form && form.querySelector('.form-submit');
  const btnLabel = btn ? btn.dataset.label || btn.textContent : '';
  if (btn && !btn.dataset.label && btnLabel !== '...') btn.dataset.label = btnLabel;

  const payload = Object.assign({}, data, {
    website: readHoneypot(form),
    ts: FORM_OPENED_AT
  });

  let res;
  try {
    res = await fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    log('ответ сервера:', res.status);
  } catch (e) {
    log('сеть недоступна');
    restoreSubmitButton(form, btn && btn.dataset.label);
    showLeadError('Похоже, пропала связь.', data);
    return false;
  }

  if (!res.ok) {
    const info = await res.json().catch(() => ({}));
    log('ошибка заявки', res.status, info.error || '');
    restoreSubmitButton(form, btn && btn.dataset.label);
    if (res.status === 429) {
      showLeadError('Слишком много заявок подряд — попробуйте через минуту.', data);
    } else if (res.status === 400) {
      showLeadError('Проверьте, пожалуйста, имя и номер телефона.', data);
    } else {
      showLeadError('Сервер не принял заявку.', data);
    }
    return false;
  }

  // Успех — показываем экран «Заявка принята!», если страница его передала
  if (typeof onSuccess === 'function') {
    restoreSubmitButton(form, btn && btn.dataset.label);
    if (form) try { form.reset(); } catch (e) {}
    onSuccess();
  } else {
    const pl = document.documentElement.lang === 'pl';
    window.location.href = pl ? '../thank-you.html?lang=pl' : 'thank-you.html';
  }
  return true;
};

// Страховка: если инлайновый обработчик формы не сработал (ошибка в другом скрипте),
// заявка всё равно уйдёт — ловим submit на уровне документа.
document.addEventListener('submit', function (e) {
  const f = e.target;
  if (!(f instanceof HTMLFormElement)) return;
  if (f.dataset.leadHandled) return;
  if (e.defaultPrevented) return;

  e.preventDefault();
  f.dataset.leadHandled = '1';
  log('перехвачен submit формы');

  const data = {
    name:      f.querySelector('input[type=text]:not([name=website])')?.value || '',
    phone:     f.querySelector('input[type=tel]')?.value || '',
    messenger: f.querySelectorAll('select')[0]?.value || '',
    for_whom:  f.querySelectorAll('select')[1]?.value || '',
    page:      document.title || location.pathname
  };
  window.submitForm(data, null, f).finally(() => { delete f.dataset.leadHandled; });
}, false);
