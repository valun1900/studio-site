// AlehKireyeuStudio — Cookie consent (GDPR / RODO)
(function () {
  if (localStorage.getItem('cookie_consent')) return; // already decided

  var L = (localStorage.getItem('lang') === 'pl') ? 'pl' : 'ru';
  var TXT = {
    ru: {
      text: 'Мы используем файлы cookie, чтобы сайт работал корректно и для аналитики. Продолжая пользоваться сайтом, вы соглашаетесь с этим.',
      accept: 'Принять',
      reject: 'Только необходимые',
      more: 'Подробнее'
    },
    pl: {
      text: 'Używamy plików cookie, aby strona działała poprawnie oraz do celów analitycznych. Korzystając z witryny, wyrażasz na to zgodę.',
      accept: 'Akceptuję',
      reject: 'Tylko niezbędne',
      more: 'Więcej'
    }
  };
  var t = TXT[L];

  var css = document.createElement('style');
  css.textContent =
    '.cookie-bar{position:fixed;left:0;right:0;bottom:0;z-index:600;background:#1A1714;color:#F8F5EF;' +
    'padding:16px 20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center;' +
    'font-family:Inter,sans-serif;font-size:13px;line-height:1.5;box-shadow:0 -4px 24px rgba(0,0,0,0.2);' +
    'transform:translateY(100%);transition:transform .4s ease;}' +
    '.cookie-bar.show{transform:translateY(0);}' +
    '.cookie-bar p{margin:0;max-width:620px;color:rgba(248,245,239,.85);}' +
    '.cookie-bar a{color:#F8F5EF;text-decoration:underline;}' +
    '.cookie-actions{display:flex;gap:10px;flex-shrink:0;}' +
    '.cookie-btn{border:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:500;' +
    'padding:10px 18px;border-radius:4px;white-space:nowrap;}' +
    '.cookie-accept{background:#F8F5EF;color:#1A1714;}' +
    '.cookie-reject{background:transparent;color:#F8F5EF;border:1px solid rgba(248,245,239,.35);}' +
    '@media(max-width:600px){.cookie-bar{padding:14px 16px;}.cookie-actions{width:100%;}.cookie-btn{flex:1;}}';
  document.head.appendChild(css);

  var bar = document.createElement('div');
  bar.className = 'cookie-bar';
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-label', 'Cookies');
  bar.innerHTML =
    '<p>' + t.text + ' <a href="privacy.html">' + t.more + '</a></p>' +
    '<div class="cookie-actions">' +
    '<button class="cookie-btn cookie-reject">' + t.reject + '</button>' +
    '<button class="cookie-btn cookie-accept">' + t.accept + '</button>' +
    '</div>';
  document.body.appendChild(bar);
  requestAnimationFrame(function () { bar.classList.add('show'); });

  function decide(value) {
    localStorage.setItem('cookie_consent', value);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'cookie_consent', consent: value });
    bar.classList.remove('show');
    setTimeout(function () { bar.remove(); }, 400);
  }
  bar.querySelector('.cookie-accept').addEventListener('click', function () { decide('accepted'); });
  bar.querySelector('.cookie-reject').addEventListener('click', function () { decide('necessary'); });
})();
