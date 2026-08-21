// AlehKireyeuStudio — серверная обработка заявок
// Токен Telegram и chat_id живут ТОЛЬКО в переменных окружения Netlify.
// Клиент никогда их не видит.

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;
const FORMSPREE_ID = process.env.FORMSPREE_ID || '';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);

const RATE_MAX = 3;
const RATE_WINDOW_MS = 60 * 1000;
const MIN_FILL_MS = 2500;
const MAX_FORM_AGE_MS = 60 * 60 * 1000;

const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (list.length >= RATE_MAX) { hits.set(ip, list); return true; }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) { for (const [k, v] of hits) { if (!v.some(t => now - t < RATE_WINDOW_MS)) hits.delete(k); } }
  return false;
}

function corsHeaders(origin) {
  const clean = (origin || '').replace(/\/$/, '');
  const ok = ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(clean);
  return {
    'Access-Control-Allow-Origin': ok ? (clean || '*') : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
    'Content-Type': 'application/json; charset=utf-8',
    _ok: ok
  };
}

function clean(v, max) {
  return String(v == null ? '' : v)
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

const LINK_RE = /(https?:\/\/|www\.|t\.me\/|bit\.ly|tinyurl|<a\s|\[url|\bhttp\b)/i;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

exports.handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || '';
  const h = corsHeaders(origin);
  const ok = h._ok; delete h._ok;

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: h, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: h, body: JSON.stringify({ error: 'method_not_allowed' }) };
  if (!ok) return { statusCode: 403, headers: h, body: JSON.stringify({ error: 'forbidden_origin' }) };

  const ip = event.headers['x-nf-client-connection-ip'] || (event.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return { statusCode: 429, headers: h, body: JSON.stringify({ error: 'too_many_requests' }) };

  let data;
  try { data = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, headers: h, body: JSON.stringify({ error: 'bad_json' }) }; }

  // Honeypot — заполнено только ботом. Отвечаем 200, чтобы бот не подбирал обход.
  if (clean(data.website, 100) || clean(data.company, 100)) {
    return { statusCode: 200, headers: h, body: JSON.stringify({ ok: true }) };
  }

  // Время заполнения формы
  const ts = Number(data.ts);
  if (ts) {
    const age = Date.now() - ts;
    if (age < MIN_FILL_MS || age > MAX_FORM_AGE_MS) {
      return { statusCode: 200, headers: h, body: JSON.stringify({ ok: true }) };
    }
  }

  const name = clean(data.name, 60);
  const phoneRaw = clean(data.phone, 40);
  const messenger = clean(data.messenger, 30);
  const forWhom = clean(data.for_whom, 60);
  const age = clean(data.age, 30);
  const page = clean(data.page, 80);

  const digits = phoneRaw.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) return { statusCode: 400, headers: h, body: JSON.stringify({ error: 'bad_phone' }) };
  if (name && (name.length < 2 || LINK_RE.test(name))) return { statusCode: 400, headers: h, body: JSON.stringify({ error: 'bad_name' }) };
  if ([name, messenger, forWhom, age].some(v => v && LINK_RE.test(v))) return { statusCode: 400, headers: h, body: JSON.stringify({ error: 'links_not_allowed' }) };

  if (!TG_TOKEN || !TG_CHAT) return { statusCode: 500, headers: h, body: JSON.stringify({ error: 'server_not_configured' }) };

  const lines = ['<b>📬 Новая заявка — AlehKireyeuStudio</b>', ''];
  if (name) lines.push(`👤 Имя: ${esc(name)}`);
  lines.push(`📞 Телефон: ${esc(phoneRaw)}`);
  if (messenger) lines.push(`💬 Мессенджер: ${esc(messenger)}`);
  if (forWhom) lines.push(`🎭 Для кого: ${esc(forWhom)}`);
  if (age) lines.push(`🧒 Возраст ребёнка: ${esc(age)}`);
  if (page) lines.push(`📄 Страница: ${esc(page)}`);
  lines.push('', `🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Warsaw' })}`);

  const tasks = [
    fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text: lines.join('\n'), parse_mode: 'HTML', disable_web_page_preview: true })
    })
  ];

  if (FORMSPREE_ID) {
    tasks.push(fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ 'Имя': name, 'Телефон': phoneRaw, 'Мессенджер': messenger, 'Для кого': forWhom, 'Возраст': age, 'Страница': page, '_subject': '🎭 Новая заявка — AlehKireyeuStudio' })
    }));
  }

  const [tg] = await Promise.allSettled(tasks);
  if (tg.status !== 'fulfilled' || !tg.value.ok) {
    return { statusCode: 502, headers: h, body: JSON.stringify({ error: 'telegram_failed' }) };
  }
  return { statusCode: 200, headers: h, body: JSON.stringify({ ok: true }) };
};
