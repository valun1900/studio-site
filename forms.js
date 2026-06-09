// AlehKireyeuStudio — Form submission
// Sends to Telegram Bot + Email via FormSubmit

const TG_TOKEN  = '8513370661:AAG-tdRTtFJ5bUo9VfHwF1W42ZmMUUcJrac';
const TG_CHAT   = '388452866';
const FORM_EMAIL = 'studiowroclaw1@gmail.com';

async function sendToTelegram(data) {
  const lines = [];
  lines.push('📬 *Новая заявка — AlehKireyeuStudio*');
  lines.push('');
  if (data.name)      lines.push(`👤 Имя: ${data.name}`);
  if (data.phone)     lines.push(`📞 Телефон: ${data.phone}`);
  if (data.messenger) lines.push(`💬 Мессенджер: ${data.messenger}`);
  if (data.for_whom)  lines.push(`🎭 Для кого: ${data.for_whom}`);
  if (data.age)       lines.push(`🧒 Возраст ребёнка: ${data.age}`);
  if (data.page)      lines.push(`📄 Страница: ${data.page}`);
  lines.push('');
  lines.push(`🕐 ${new Date().toLocaleString('ru-RU', {timeZone: 'Europe/Warsaw'})}`);

  const text = lines.join('\n');
  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'Markdown' })
    });
  } catch(e) { console.warn('TG error', e); }
}

async function sendToEmail(data) {
  try {
    await fetch('https://formspree.io/f/xqewvrvz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        'Имя':        data.name      || '',
        'Телефон':    data.phone     || '',
        'Мессенджер': data.messenger || '',
        'Для кого':   data.for_whom  || '',
        'Возраст':    data.age       || '',
        'Страница':   data.page      || '',
        '_subject':   '🎭 Новая заявка — AlehKireyeuStudio'
      })
    });
  } catch(e) { console.warn('Email error', e); }
}

// Main submit function — call this from any form
window.submitForm = async function(data, onSuccess) {
  await Promise.allSettled([
    sendToTelegram(data),
    sendToEmail(data)
  ]);
  // Redirect to thank-you page (fires Meta Pixel + Google Tag)
  window.location.href = 'thank-you.html';
};
