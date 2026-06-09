// AlehKireyeuStudio — Edit Mode
// Activate by adding ?edit=studio2026 to URL
// Click any text to edit. Click "Save" to download updated HTML.

(function() {
  const PASSWORD = 'studio2026';
  const params = new URLSearchParams(window.location.search);
  if (params.get('edit') !== PASSWORD) return;

  // ── STYLES ──────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .edit-toolbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
      background: #1A1714; color: #F8F5EF;
      padding: 10px 16px; display: flex; align-items: center; gap: 12px;
      font-family: 'Inter', sans-serif; font-size: 13px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    }
    .edit-toolbar-title { font-weight: 500; flex: 1; }
    .edit-toolbar-tag { background: #8B6F47; color: #fff; padding: 3px 8px; border-radius: 3px; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; }
    .edit-toolbar button {
      background: #F8F5EF; color: #1A1714; border: none;
      padding: 8px 16px; font-size: 13px; cursor: pointer;
      border-radius: 4px; font-family: inherit; font-weight: 500;
    }
    .edit-toolbar button:hover { opacity: 0.85; }
    .edit-toolbar button.secondary { background: transparent; color: #F8F5EF; border: 1px solid rgba(248,245,239,0.3); }
    body { padding-top: 48px !important; }

    [data-editable] {
      outline: 1px dashed rgba(139,111,71,0.5);
      outline-offset: 2px;
      transition: outline-color 0.15s, background 0.15s;
      cursor: text;
      min-height: 1em;
    }
    [data-editable]:hover { outline-color: #8B6F47; background: rgba(237,229,216,0.4); }
    [data-editable]:focus { outline: 2px solid #8B6F47; outline-offset: 2px; background: #FFF; }
    [data-editable].changed { outline-color: #4CAF50; }

    .edit-counter {
      position: fixed; bottom: 16px; right: 16px; z-index: 99999;
      background: #1A1714; color: #F8F5EF;
      padding: 8px 14px; border-radius: 20px; font-size: 12px;
      font-family: 'Inter', sans-serif;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      display: none;
    }
    .edit-counter.show { display: block; }
  `;
  document.head.appendChild(style);

  // ── TOOLBAR ─────────────────────────────────────────
  const toolbar = document.createElement('div');
  toolbar.className = 'edit-toolbar';
  toolbar.innerHTML = `
    <span class="edit-toolbar-tag">Режим редактирования</span>
    <span class="edit-toolbar-title">Кликните на любой текст чтобы изменить. Изменений: <span id="changes-count">0</span></span>
    <button class="secondary" onclick="window.editMode.changeFavicon()">🎨 Иконка сайта</button>
    <button class="secondary" onclick="window.editMode.exit()">Выйти</button>
    <button onclick="window.editMode.save()">Скачать обновлённый сайт</button>
  `;
  document.body.appendChild(toolbar);

  const counter = document.createElement('div');
  counter.className = 'edit-counter';
  counter.textContent = 'Нажмите "Скачать" чтобы сохранить изменения';
  document.body.appendChild(counter);

  // ── MAKE ELEMENTS EDITABLE ──────────────────────────
  const SELECTORS = [
    'h1','h2','h3','h4','h5','h6',
    'p','li','span',
    'a[href^="#"]','a[href^="index"]','a[href^="vzroslaya"]','a[href^="detskaya"]','a[href^="podrostok"]',
    'button',
    'strong','em','label',
    '.section-label','.section-title','.hero-tag','.hero-sub','.hero-title',
    '.modal h2','.modal-sub','.modal-tag',
    '.cta-title','.cta-sub','.cta-phone','.cta-privacy',
    '.footer-desc','.footer-copy',
    '[data-i18n]'
  ];

  // Skip these — they have child elements or shouldn't be edited
  const SKIP_CLASSES = ['nav-logo','footer-logo','social-link','float-btn','lang-btn','burger','nav-mobile-btn','modal-close','form-success-icon','hero-stars','price-big','result-num','program-num'];
  const SKIP_TAGS = ['SCRIPT','STYLE','SVG','PATH','CIRCLE','RECT','LINE','POLYLINE','IMG','INPUT','SELECT','OPTION','TEXTAREA','FORM','VIDEO'];

  function shouldSkip(el) {
    if (SKIP_TAGS.includes(el.tagName)) return true;
    if (el.closest('.edit-toolbar')) return true;
    if (el.closest('.tweaks-panel')) return true;
    if (el.closest('nav') && (el.classList.contains('nav-logo') || el.tagName === 'IMG')) return true;
    for (const cls of SKIP_CLASSES) if (el.classList?.contains(cls)) return true;
    // Skip if has element children that are also editable candidates
    const elementChildren = Array.from(el.children).filter(c => !SKIP_TAGS.includes(c.tagName));
    if (elementChildren.length > 0 && !el.matches('h1,h2,h3,h4,p,li,a,button,span,strong,em,label,.hero-title,.section-title,.cta-title')) return true;
    if (el.textContent.trim() === '') return true;
    return false;
  }

  let changesCount = 0;
  const updateCounter = () => {
    document.getElementById('changes-count').textContent = changesCount;
    if (changesCount > 0) counter.classList.add('show');
  };

  function makeEditable(el) {
    if (el.dataset.editable) return;
    if (shouldSkip(el)) return;
    el.dataset.editable = 'true';
    el.dataset.originalText = el.innerHTML;
    el.contentEditable = 'true';
    el.spellcheck = false;

    el.addEventListener('input', () => {
      if (el.innerHTML !== el.dataset.originalText && !el.classList.contains('changed')) {
        el.classList.add('changed');
        changesCount++;
        updateCounter();
      } else if (el.innerHTML === el.dataset.originalText && el.classList.contains('changed')) {
        el.classList.remove('changed');
        changesCount--;
        updateCounter();
      }
    });

    // Prevent links from navigating during edit
    el.addEventListener('click', e => {
      if (el.tagName === 'A') e.preventDefault();
    });
  }

  function processAll() {
    // Get all candidate elements
    const candidates = new Set();
    SELECTORS.forEach(sel => {
      try { document.querySelectorAll(sel).forEach(el => candidates.add(el)); } catch(e) {}
    });
    candidates.forEach(makeEditable);
  }

  setTimeout(processAll, 100);

  // ── SAVE ────────────────────────────────────────────
  window.editMode = {
    changeFavicon() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg,image/svg+xml,image/x-icon,image/webp';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target.result;
          // Update favicon links in current page
          document.querySelectorAll('link[rel*="icon"]').forEach(l => l.remove());
          const l1 = document.createElement('link');
          l1.rel = 'icon';
          l1.type = file.type;
          l1.href = dataUrl;
          document.head.appendChild(l1);
          const l2 = document.createElement('link');
          l2.rel = 'apple-touch-icon';
          l2.href = dataUrl;
          document.head.appendChild(l2);
          // Save the data URL so save() can persist it
          window.editMode._faviconDataUrl = dataUrl;
          window.editMode._faviconType = file.type;
          alert('✓ Иконка обновлена!\n\nТеперь нажмите "Скачать обновлённый сайт" — иконка сохранится в файле.\n\n⚠️ Важно: эту операцию нужно проделать на КАЖДОЙ странице сайта (главная, курсы, и т.д.) — или загрузите файл favicon.svg/png в Netlify напрямую.');
        };
        reader.readAsDataURL(file);
      };
      input.click();
    },
    save() {
      // Clean up edit attributes from clone
      const html = document.documentElement.outerHTML;
      const tempDoc = document.implementation.createHTMLDocument('');
      tempDoc.documentElement.innerHTML = html.replace(/^<html[^>]*>|<\/html>$/g, '');

      // Remove edit toolbar, counter, and edit attributes
      tempDoc.querySelectorAll('.edit-toolbar, .edit-counter').forEach(el => el.remove());
      tempDoc.querySelectorAll('[data-editable]').forEach(el => {
        el.removeAttribute('data-editable');
        el.removeAttribute('data-original-text');
        el.removeAttribute('contenteditable');
        el.removeAttribute('spellcheck');
        el.classList.remove('changed');
      });
      // Remove the edit-mode style block (last <style> we added)
      const styles = tempDoc.querySelectorAll('style');
      styles.forEach(s => {
        if (s.textContent.includes('.edit-toolbar')) s.remove();
      });
      // Remove edit-mode.js script tag
      tempDoc.querySelectorAll('script[src*="edit-mode"]').forEach(s => s.remove());

      const finalHtml = '<!DOCTYPE html>\n' + tempDoc.documentElement.outerHTML;
      const filename = window.location.pathname.split('/').pop() || 'index.html';

      const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Файл "' + filename + '" скачан!\n\nЗагрузите его в Netlify (перетащите в Deploys → "Drag and drop your site folder here"), и сайт обновится.');
    },
    exit() {
      const url = window.location.origin + window.location.pathname;
      window.location.href = url;
    }
  };

  console.log('[EditMode] Активен. Чтобы выйти — нажмите "Выйти" или удалите ?edit=... из URL');
})();
