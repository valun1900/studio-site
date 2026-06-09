// AlehKireyeuStudio — Content loader
// Reads content/site.json (edited via Decap CMS /admin) and applies it to the page.
// Updates contact links/phone, prices, address, and hero images everywhere.

(async function () {
  try {
    const res = await fetch('content/site.json', { cache: 'no-store' });
    if (!res.ok) return;
    const c = await res.json();

    // ── Text fields: <span data-c="price_month"> etc. ──
    document.querySelectorAll('[data-c]').forEach(el => {
      const key = el.getAttribute('data-c');
      if (c[key] != null && c[key] !== '') el.textContent = c[key];
    });

    // ── Images: <img data-c-img="hero_image_index"> ──
    document.querySelectorAll('[data-c-img]').forEach(el => {
      const key = el.getAttribute('data-c-img');
      if (c[key]) el.src = c[key];
    });

    // ── Phone links + display text ──
    if (c.phone_tel) {
      const tel = 'tel:' + c.phone_tel.replace(/\s/g, '');
      document.querySelectorAll('a[href^="tel:"]').forEach(a => a.setAttribute('href', tel));
    }
    if (c.phone_display) {
      document.querySelectorAll('a[href^="tel:"]').forEach(a => {
        // Only replace links whose visible text is a phone number (skip "Позвонить" etc.)
        if (/\+?\d[\d\s]{6,}/.test(a.textContent)) a.textContent = c.phone_display;
      });
    }

    // ── Messenger + social links (auto-targeted by URL) ──
    if (c.whatsapp) {
      document.querySelectorAll('a[href*="wa.me"]').forEach(a => { a.href = 'https://wa.me/' + c.whatsapp; });
    }
    if (c.telegram) {
      document.querySelectorAll('a[href*="t.me/"]').forEach(a => { a.href = 'https://t.me/' + c.telegram; });
    }
    if (c.instagram) {
      document.querySelectorAll('a[href*="instagram.com"]').forEach(a => { a.href = 'https://www.instagram.com/' + c.instagram; });
    }
  } catch (e) {
    console.warn('content.js:', e);
  }
})();
