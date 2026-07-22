async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    render(data);
  } catch (e) {
    document.getElementById('loading').textContent = 'Gagal memuat data. Coba refresh.';
  }
}

function applyTheme(theme = {}) {
  const root = document.documentElement.style;
  const bg = theme.backgroundType === 'gradient'
    ? `linear-gradient(${theme.gradientAngle || 135}deg, ${theme.gradientFrom || '#2dd4bf'}, ${theme.gradientTo || '#0284c7'})`
    : (theme.backgroundColor || '#14b8a6');
  root.setProperty('--bg', bg);
  root.setProperty('--bg-image', theme.backgroundType === 'image' && theme.backgroundImage
    ? `url(${theme.backgroundImage})` : 'none');
  root.setProperty('--text-color', theme.textColor || '#ffffff');
  root.setProperty('--sub-color', theme.subTextColor || 'rgba(255,255,255,.85)');
  root.setProperty('--btn-bg', theme.buttonColor || '#22c55e');
  root.setProperty('--btn-text', theme.buttonTextColor || '#ffffff');
  const shapeMap = { square: '6px', rounded: '16px', pill: '999px' };
  root.setProperty('--btn-radius', shapeMap[theme.buttonShape] || '16px');
  const hex = (theme.shadowColor || '#000000').replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  root.setProperty('--shadow-color', `${r},${g},${b}`);
  root.setProperty('--shadow-opacity', (theme.shadowOpacity ?? 0.25));
  root.setProperty('--shadow-blur', `${theme.shadowBlur ?? 14}px`);
  root.setProperty('--font', theme.fontFamily || `'Segoe UI', system-ui, -apple-system, sans-serif`);
  root.setProperty('--align', theme.layoutAlign === 'center' ? 'center' : 'flex-start');
}

function render(data) {
  applyTheme(data.theme || {});
  const app = document.getElementById('app');
  const p = data.profile || {};
  const socials = (data.socials || []).filter(s => s.url);
  const topItems = (data.links || []).filter(l => l.enabled !== false).sort((a, b) => (a.order || 0) - (b.order || 0));

  app.innerHTML = `
    <div class="profile">
      ${p.avatar ? `<img class="avatar" src="${escAttr(p.avatar)}" alt="avatar">` : ''}
      <h1>${esc(p.name || '')} ${p.verified ? '<i class="fa-solid fa-circle-check" style="color:#3b82f6"></i>' : ''}</h1>
      ${p.bio ? `<p class="bio">${esc(p.bio)}</p>` : ''}
      ${socials.length ? `<div class="socials">${socials.map(s => `
        <a href="${escAttr(s.url)}" target="_blank" rel="noopener" style="${socialStyle(s)}">${s.iconImage ? `<img src="${escAttr(s.iconImage)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : `<i class="${escAttr(s.icon || 'fa-solid fa-link')}"></i>`}</a>
      `).join('')}</div>` : ''}
    </div>
    <div class="links">
      ${topItems.map(item => item.type === 'category' ? renderCategory(item) : renderLinkBtn(item)).join('')}
    </div>
    <div class="footer-tag">Dibuat dengan Link Bio</div>
  `;



  const wa = data.whatsapp || {};
  const waBtn = document.getElementById('wa-float');
  if (wa.enabled && wa.number) {
    const msg = encodeURIComponent(wa.message || '');
    waBtn.href = `https://wa.me/${wa.number.replace(/[^0-9]/g, '')}${msg ? `?text=${msg}` : ''}`;
    waBtn.style.display = wa.floating === false ? 'none' : 'flex';
  }
}

function renderLinkBtn(l) {
  return `
    <a class="link-btn" href="${escAttr(l.url)}" target="_blank" rel="noopener" style="${linkStyle(l)}">
      <span class="link-icon" style="${l.iconBgColor ? `background:${escAttr(l.iconBgColor)};` : ''}">${l.iconImage ? `<img src="${escAttr(l.iconImage)}">` : (l.icon ? `<i class="${escAttr(l.icon)}"></i>` : (l.emoji || ''))}</span>
      <span class="link-title">${esc(l.title || '')}</span>
    </a>
  `;
}

// Kategori dirender sebagai <details>, dibuka/ditutup pakai tap, tanpa perlu JS tambahan.
function renderCategory(cat) {
  const children = (cat.children || []).filter(c => c.enabled !== false);
  return `
    <details class="link-category">
      <summary class="link-btn category-btn" style="${linkStyle(cat)}">
        <span class="link-icon" style="${cat.iconBgColor ? `background:${escAttr(cat.iconBgColor)};` : ''}">${cat.iconImage ? `<img src="${escAttr(cat.iconImage)}">` : (cat.icon ? `<i class="${escAttr(cat.icon)}"></i>` : '<i class="fa-solid fa-folder"></i>')}</span>
        <span class="link-title">${esc(cat.title || '')}</span>
        <i class="fa-solid fa-chevron-down category-chevron"></i>
      </summary>
      <div class="category-children">
        ${children.map(renderLinkBtn).join('') || '<p class="category-empty">Belum ada link di kategori ini.</p>'}
      </div>
    </details>
  `;
}

function hexToRgb(hex) {
  const h = (hex || '').replace('#', '');
  if (h.length !== 6) return null;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  if ([r, g, b].some(n => Number.isNaN(n))) return null;
  return `${r},${g},${b}`;
}

// Tombol link bisa override warna global per-item (kalau customColor aktif)
function linkStyle(l) {
  if (!l.customColor) return '';
  const parts = [];
  if (l.bgColor) parts.push(`background:${l.bgColor}`);
  if (l.textColor) parts.push(`color:${l.textColor}`);
  if (l.shadowColor) {
    const rgb = hexToRgb(l.shadowColor) || '0,0,0';
    const opacity = l.shadowOpacity ?? 0.25;
    const blur = l.shadowBlur ?? 14;
    parts.push(`box-shadow:0 6px ${blur}px rgba(${rgb},${opacity})`);
  }
  return parts.join(';');
}

// Ikon sosmed bisa punya warna latar sendiri
function socialStyle(s) {
  if (!s.bgColor) return '';
  return `background:${s.bgColor}`;
}

function esc(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
function escAttr(str) { return esc(str); }

loadConfig();
