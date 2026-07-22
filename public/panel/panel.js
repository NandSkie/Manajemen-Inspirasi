let config = null;
let token = localStorage.getItem('admin_token') || '';

const $ = (id) => document.getElementById(id);

// ---------- LOGIN ----------
async function tryLogin() {
  const password = $('passwordInput').value;
  $('loginError').textContent = '';
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok) { $('loginError').textContent = data.error || 'Gagal login'; return; }
    token = data.token;
    localStorage.setItem('admin_token', token);
    showPanel();
  } catch (e) {
    $('loginError').textContent = 'Terjadi kesalahan koneksi.';
  }
}

$('loginBtn').addEventListener('click', tryLogin);
$('passwordInput').addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
$('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  location.reload();
});

async function showPanel() {
  $('loginScreen').style.display = 'none';
  $('panelScreen').style.display = 'block';
  await loadConfig();
  populateForm();
}

async function loadConfig() {
  const res = await fetch('/api/config');
  config = await res.json();
}

// ---------- TABS ----------
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`.tab-panel[data-panel="${tab.dataset.tab}"]`).classList.add('active');
  });
});

// ---------- FILE TO BASE64 ----------
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- POPULATE FORM FROM CONFIG ----------
function populateForm() {
  const p = config.profile || {};
  const t = config.theme || {};
  const w = config.whatsapp || {};

  $('p_name').value = p.name || '';
  $('p_bio').value = p.bio || '';
  $('p_verified').checked = !!p.verified;
  $('avatarPreview').src = p.avatar || 'https://placehold.co/64x64?text=+';

  $('t_bgType').value = t.backgroundType || 'gradient';
  $('t_bgColor').value = t.backgroundColor || '#14b8a6';
  $('t_gradFrom').value = t.gradientFrom || '#2dd4bf';
  $('t_gradTo').value = t.gradientTo || '#0284c7';
  $('t_gradAngle').value = t.gradientAngle ?? 135;
  $('gradAngleVal').textContent = $('t_gradAngle').value;
  $('t_textColor').value = t.textColor || '#ffffff';
  $('t_subColorPicker').value = rgbaToHex(t.subTextColor) || '#ffffff';
  $('t_align').value = t.layoutAlign || 'top';
  $('t_btnColor').value = t.buttonColor || '#22c55e';
  $('t_btnTextColor').value = t.buttonTextColor || '#ffffff';
  $('t_btnShape').value = t.buttonShape || 'rounded';
  $('t_shadowColor').value = t.shadowColor || '#000000';
  $('t_shadowOpacity').value = t.shadowOpacity ?? 0.25;
  $('shadowOpacityVal').textContent = $('t_shadowOpacity').value;
  $('t_shadowBlur').value = t.shadowBlur ?? 14;
  $('shadowBlurVal').textContent = $('t_shadowBlur').value;
  $('t_font').value = t.fontFamily || "'Segoe UI', system-ui, -apple-system, sans-serif";
  toggleBgFields();

  $('w_enabled').checked = !!w.enabled;
  $('w_number').value = w.number || '';
  $('w_message').value = w.message || '';
  $('w_floating').checked = w.floating !== false;

  renderSocialsList();
  renderLinksList();
  renderPresets();
}

// ---------- QUICK COLOR PRESETS ----------
const THEME_PRESETS = [
  { name: 'Teal Ocean', backgroundType: 'gradient', gradientFrom: '#2dd4bf', gradientTo: '#0284c7', gradientAngle: 135, textColor: '#ffffff', subTextColor: '#e0f2fe', buttonColor: '#22c55e', buttonTextColor: '#ffffff', shadowColor: '#000000' },
  { name: 'Sunset', backgroundType: 'gradient', gradientFrom: '#f97316', gradientTo: '#db2777', gradientAngle: 135, textColor: '#ffffff', subTextColor: '#fde68a', buttonColor: '#ffffff', buttonTextColor: '#db2777', shadowColor: '#7c2d12' },
  { name: 'Midnight', backgroundType: 'gradient', gradientFrom: '#1e293b', gradientTo: '#0f172a', gradientAngle: 160, textColor: '#f1f5f9', subTextColor: '#94a3b8', buttonColor: '#6366f1', buttonTextColor: '#ffffff', shadowColor: '#000000' },
  { name: 'Pastel Pink', backgroundType: 'gradient', gradientFrom: '#fbcfe8', gradientTo: '#f5d0fe', gradientAngle: 135, textColor: '#831843', subTextColor: '#9d174d', buttonColor: '#ec4899', buttonTextColor: '#ffffff', shadowColor: '#831843' },
  { name: 'Mono Putih', backgroundType: 'color', backgroundColor: '#f8fafc', textColor: '#0f172a', subTextColor: '#475569', buttonColor: '#0f172a', buttonTextColor: '#ffffff', shadowColor: '#0f172a' },
  { name: 'Emerald', backgroundType: 'gradient', gradientFrom: '#10b981', gradientTo: '#065f46', gradientAngle: 150, textColor: '#ffffff', subTextColor: '#d1fae5', buttonColor: '#facc15', buttonTextColor: '#78350f', shadowColor: '#000000' },
];

function renderPresets() {
  const wrap = $('presetSwatches');
  wrap.innerHTML = '';
  THEME_PRESETS.forEach(preset => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch-btn';
    btn.title = preset.name;
    const bg = preset.backgroundType === 'gradient'
      ? `linear-gradient(${preset.gradientAngle}deg, ${preset.gradientFrom}, ${preset.gradientTo})`
      : preset.backgroundColor;
    btn.style.background = bg;
    btn.innerHTML = `<span class="swatch-dot" style="background:${preset.buttonColor}"></span>`;
    btn.addEventListener('click', () => applyPreset(preset));
    wrap.appendChild(btn);
  });
}

function applyPreset(preset) {
  $('t_bgType').value = preset.backgroundType;
  if (preset.backgroundColor) $('t_bgColor').value = preset.backgroundColor;
  if (preset.gradientFrom) $('t_gradFrom').value = preset.gradientFrom;
  if (preset.gradientTo) $('t_gradTo').value = preset.gradientTo;
  if (preset.gradientAngle !== undefined) { $('t_gradAngle').value = preset.gradientAngle; $('gradAngleVal').textContent = preset.gradientAngle; }
  $('t_textColor').value = preset.textColor;
  $('t_subColorPicker').value = preset.subTextColor;
  $('t_btnColor').value = preset.buttonColor;
  $('t_btnTextColor').value = preset.buttonTextColor;
  $('t_shadowColor').value = preset.shadowColor;
  toggleBgFields();
  $('saveStatus').textContent = `Preset "${preset.name}" diterapkan. Jangan lupa Simpan.`;
  setTimeout(() => $('saveStatus').textContent = '', 2500);
}

function rgbaToHex(v) {
  if (!v || v.startsWith('#')) return v;
  return '#ffffff';
}

function toggleBgFields() {
  const type = $('t_bgType').value;
  $('bgColorFields').style.display = type === 'color' ? 'block' : 'none';
  $('bgGradientFields').style.display = type === 'gradient' ? 'block' : 'none';
  $('bgImageFields').style.display = type === 'image' ? 'block' : 'none';
}
$('t_bgType').addEventListener('change', toggleBgFields);
$('t_gradAngle').addEventListener('input', () => $('gradAngleVal').textContent = $('t_gradAngle').value);
$('t_shadowOpacity').addEventListener('input', () => $('shadowOpacityVal').textContent = $('t_shadowOpacity').value);
$('t_shadowBlur').addEventListener('input', () => $('shadowBlurVal').textContent = $('t_shadowBlur').value);

async function uploadToGithub(file, nameHint) {
  const dataUrl = await fileToBase64(file);
  $('saveStatus').textContent = 'Mengupload gambar...';
  const res = await fetch('/api/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ dataUrl, name: nameHint })
  });
  const data = await res.json();
  $('saveStatus').textContent = '';
  if (!res.ok) throw new Error(data.error || 'Upload gagal');
  return data.url; // URL CDN (jsDelivr), bukan base64
}

$('avatarFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  $('avatarPreview').src = URL.createObjectURL(file); // preview instan sebelum upload selesai
  try {
    const url = await uploadToGithub(file, 'avatar');
    config.profile.avatar = url;
    $('avatarPreview').src = url;
  } catch (err) {
    $('saveStatus').textContent = 'Gagal upload avatar: ' + err.message;
  }
});

$('t_bgImageFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const url = await uploadToGithub(file, 'background');
    config.theme.backgroundImage = url;
    $('saveStatus').textContent = 'Gambar background terupload ✓';
    setTimeout(() => $('saveStatus').textContent = '', 2000);
  } catch (err) {
    $('saveStatus').textContent = 'Gagal upload background: ' + err.message;
  }
});

// ---------- SOCIALS ----------
function renderSocialsList() {
  const list = $('socialsList');
  list.innerHTML = '';
  (config.socials || []).forEach((s, idx) => {
    const tpl = $('socialItemTpl').content.cloneNode(true);
    const el = tpl.querySelector('.social-item');
    const platformSelect = el.querySelector('.s_platform');
    const customWrap = el.querySelector('.s_customIconWrap');
    const customFile = el.querySelector('.s_customIconFile');
    const customPreview = el.querySelector('.s_customIconPreview');

    const isCustom = !!s.iconImage;
    platformSelect.value = isCustom ? '__custom__' : (s.icon || 'fa-solid fa-globe');
    customWrap.style.display = isCustom ? 'block' : 'none';
    if (s.iconImage) { customPreview.src = s.iconImage; customPreview.style.display = 'block'; }

    el.querySelector('.s_url').value = s.url || '';
    el.querySelector('.s_bgColor').value = (s.bgColor && /^#[0-9a-fA-F]{6}$/.test(s.bgColor)) ? s.bgColor : '#64748b';

    platformSelect.addEventListener('change', e => {
      if (e.target.value === '__custom__') {
        customWrap.style.display = 'block';
      } else {
        customWrap.style.display = 'none';
        config.socials[idx].icon = e.target.value;
        config.socials[idx].iconImage = '';
      }
    });

    customFile.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      customPreview.src = URL.createObjectURL(file);
      customPreview.style.display = 'block';
      try {
        const url = await uploadToGithub(file, 'social-icon');
        config.socials[idx].iconImage = url;
        config.socials[idx].icon = '';
        customPreview.src = url;
      } catch (err) {
        $('saveStatus').textContent = 'Gagal upload ikon: ' + err.message;
      }
    });

    el.querySelector('.s_url').addEventListener('input', e => config.socials[idx].url = e.target.value);
    el.querySelector('.s_bgColor').addEventListener('input', e => config.socials[idx].bgColor = e.target.value);
    el.querySelector('.s_bgReset').addEventListener('click', () => {
      config.socials[idx].bgColor = '';
      renderSocialsList();
    });
    el.querySelector('.btn-remove').addEventListener('click', () => {
      config.socials.splice(idx, 1);
      renderSocialsList();
    });
    list.appendChild(tpl);
  });
}
$('addSocialBtn').addEventListener('click', () => {
  config.socials = config.socials || [];
  config.socials.push({ icon: 'fa-brands fa-instagram', url: '', bgColor: '', iconImage: '' });
  renderSocialsList();
});

// ---------- LINKS (mendukung tombol biasa + kategori/dropdown) ----------
function moveInArray(arr, idx, dir) {
  const target = idx + dir;
  if (target < 0 || target >= arr.length) return;
  [arr[idx], arr[target]] = [arr[target], arr[idx]];
}

// Bangun elemen form untuk satu tombol link (dipakai untuk top-level maupun anak kategori)
function buildLinkFieldsEl(item, array, idx) {
  const tpl = $('linkItemTpl').content.cloneNode(true);
  const el = tpl.querySelector('.link-item');
  el.querySelector('.l_title').value = item.title || '';
  el.querySelector('.l_url').value = item.url || '';
  el.querySelector('.l_enabled').checked = item.enabled !== false;

  const iconType = item.iconImage ? 'upload' : (item.icon ? 'preset' : 'none');
  const iconTypeSelect = el.querySelector('.l_iconType');
  const presetWrap = el.querySelector('.l_iconPresetWrap');
  const uploadWrap = el.querySelector('.l_iconUploadWrap');
  const iconPreview = el.querySelector('.l_iconPreview');
  iconTypeSelect.value = iconType;
  presetWrap.style.display = iconType === 'preset' ? 'block' : 'none';
  uploadWrap.style.display = iconType === 'upload' ? 'block' : 'none';
  if (item.icon) el.querySelector('.l_icon').value = item.icon;
  if (item.iconImage) { iconPreview.src = item.iconImage; iconPreview.style.display = 'block'; }

  iconTypeSelect.addEventListener('change', e => {
    const v = e.target.value;
    presetWrap.style.display = v === 'preset' ? 'block' : 'none';
    uploadWrap.style.display = v === 'upload' ? 'block' : 'none';
    if (v === 'none') { item.icon = ''; item.iconImage = ''; }
    else if (v === 'preset') { item.iconImage = ''; item.icon = el.querySelector('.l_icon').value; }
    else if (v === 'upload') { item.icon = ''; }
  });
  el.querySelector('.l_icon').addEventListener('change', e => item.icon = e.target.value);
  el.querySelector('.l_iconFile').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    iconPreview.src = URL.createObjectURL(file);
    iconPreview.style.display = 'block';
    try {
      const url = await uploadToGithub(file, 'link-icon');
      item.iconImage = url;
      iconPreview.src = url;
    } catch (err) {
      $('saveStatus').textContent = 'Gagal upload ikon: ' + err.message;
    }
  });

  const customColorCb = el.querySelector('.l_customColor');
  const colorFields = el.querySelector('.l_colorFields');
  customColorCb.checked = !!item.customColor;
  colorFields.style.display = item.customColor ? 'block' : 'none';
  el.querySelector('.l_bgColor').value = item.bgColor || '#22c55e';
  el.querySelector('.l_textColor').value = item.textColor || '#ffffff';
  el.querySelector('.l_iconBgColor').value = item.iconBgColor || '#ffffff';
  el.querySelector('.l_shadowColor').value = item.shadowColor || '#000000';
  el.querySelector('.l_shadowOpacity').value = item.shadowOpacity ?? 0.25;
  el.querySelector('.l_shadowOpacityVal').textContent = item.shadowOpacity ?? 0.25;
  el.querySelector('.l_shadowBlur').value = item.shadowBlur ?? 14;
  el.querySelector('.l_shadowBlurVal').textContent = item.shadowBlur ?? 14;

  customColorCb.addEventListener('change', e => {
    item.customColor = e.target.checked;
    colorFields.style.display = e.target.checked ? 'block' : 'none';
  });
  el.querySelector('.l_bgColor').addEventListener('input', e => item.bgColor = e.target.value);
  el.querySelector('.l_textColor').addEventListener('input', e => item.textColor = e.target.value);
  el.querySelector('.l_iconBgColor').addEventListener('input', e => item.iconBgColor = e.target.value);
  el.querySelector('.l_shadowColor').addEventListener('input', e => item.shadowColor = e.target.value);
  el.querySelector('.l_shadowOpacity').addEventListener('input', e => {
    item.shadowOpacity = Number(e.target.value);
    el.querySelector('.l_shadowOpacityVal').textContent = e.target.value;
  });
  el.querySelector('.l_shadowBlur').addEventListener('input', e => {
    item.shadowBlur = Number(e.target.value);
    el.querySelector('.l_shadowBlurVal').textContent = e.target.value;
  });

  el.querySelector('.l_title').addEventListener('input', e => item.title = e.target.value);
  el.querySelector('.l_url').addEventListener('input', e => item.url = e.target.value);
  el.querySelector('.l_enabled').addEventListener('change', e => item.enabled = e.target.checked);

  el.querySelector('.l_remove').addEventListener('click', () => { array.splice(idx, 1); renderLinksList(); });
  el.querySelector('.l_up').addEventListener('click', () => { moveInArray(array, idx, -1); renderLinksList(); });
  el.querySelector('.l_down').addEventListener('click', () => { moveInArray(array, idx, 1); renderLinksList(); });

  return el;
}

// Bangun elemen form untuk satu kategori (berisi beberapa link di dalamnya)
function buildCategoryEl(item, idx) {
  const tpl = $('categoryItemTpl').content.cloneNode(true);
  const el = tpl.querySelector('.category-item');

  el.querySelector('.c_title').value = item.title || '';
  el.querySelector('.c_enabled').checked = item.enabled !== false;
  el.querySelector('.c_icon').value = item.icon || '';

  const customColorCb = el.querySelector('.c_customColor');
  const colorFields = el.querySelector('.c_colorFields');
  customColorCb.checked = !!item.customColor;
  colorFields.style.display = item.customColor ? 'block' : 'none';
  el.querySelector('.c_bgColor').value = item.bgColor || '#22c55e';
  el.querySelector('.c_textColor').value = item.textColor || '#ffffff';

  el.querySelector('.c_title').addEventListener('input', e => item.title = e.target.value);
  el.querySelector('.c_enabled').addEventListener('change', e => item.enabled = e.target.checked);
  el.querySelector('.c_icon').addEventListener('change', e => item.icon = e.target.value);
  customColorCb.addEventListener('change', e => {
    item.customColor = e.target.checked;
    colorFields.style.display = e.target.checked ? 'block' : 'none';
  });
  el.querySelector('.c_bgColor').addEventListener('input', e => item.bgColor = e.target.value);
  el.querySelector('.c_textColor').addEventListener('input', e => item.textColor = e.target.value);

  item.children = item.children || [];
  const childrenWrap = el.querySelector('.category-children');
  item.children.forEach((child, cidx) => {
    childrenWrap.appendChild(buildLinkFieldsEl(child, item.children, cidx));
  });
  el.querySelector('.c_addChild').addEventListener('click', () => {
    item.children.push({ title: '', url: '', icon: 'fa-solid fa-link', enabled: true });
    renderLinksList();
  });

  el.querySelector('.c_remove').addEventListener('click', () => { config.links.splice(idx, 1); renderLinksList(); });
  el.querySelector('.c_up').addEventListener('click', () => { moveInArray(config.links, idx, -1); renderLinksList(); });
  el.querySelector('.c_down').addEventListener('click', () => { moveInArray(config.links, idx, 1); renderLinksList(); });

  return el;
}

function renderLinksList() {
  const list = $('linksList');
  list.innerHTML = '';
  (config.links || []).forEach((item, idx) => {
    if (item.type === 'category') {
      list.appendChild(buildCategoryEl(item, idx));
    } else {
      list.appendChild(buildLinkFieldsEl(item, config.links, idx));
    }
  });
}
$('addLinkBtn').addEventListener('click', () => {
  config.links = config.links || [];
  config.links.push({ type: 'link', title: '', url: '', icon: 'fa-solid fa-link', iconImage: '', enabled: true, order: config.links.length, customColor: false });
  renderLinksList();
});
$('addCategoryBtn').addEventListener('click', () => {
  config.links = config.links || [];
  config.links.push({ type: 'category', title: 'Kategori Baru', icon: 'fa-solid fa-folder', enabled: true, order: config.links.length, customColor: false, children: [] });
  renderLinksList();
});

// ---------- COLLECT + SAVE ----------
function collectForm() {
  config.profile.name = $('p_name').value;
  config.profile.bio = $('p_bio').value;
  config.profile.verified = $('p_verified').checked;

  config.theme.backgroundType = $('t_bgType').value;
  config.theme.backgroundColor = $('t_bgColor').value;
  config.theme.gradientFrom = $('t_gradFrom').value;
  config.theme.gradientTo = $('t_gradTo').value;
  config.theme.gradientAngle = Number($('t_gradAngle').value);
  config.theme.textColor = $('t_textColor').value;
  config.theme.subTextColor = $('t_subColorPicker').value;
  config.theme.layoutAlign = $('t_align').value;
  config.theme.buttonColor = $('t_btnColor').value;
  config.theme.buttonTextColor = $('t_btnTextColor').value;
  config.theme.buttonShape = $('t_btnShape').value;
  config.theme.shadowColor = $('t_shadowColor').value;
  config.theme.shadowOpacity = Number($('t_shadowOpacity').value);
  config.theme.shadowBlur = Number($('t_shadowBlur').value);
  config.theme.fontFamily = $('t_font').value;

  config.whatsapp = config.whatsapp || {};
  config.whatsapp.enabled = $('w_enabled').checked;
  config.whatsapp.number = $('w_number').value;
  config.whatsapp.message = $('w_message').value;
  config.whatsapp.floating = $('w_floating').checked;

  config.links.forEach((l, i) => l.order = i);
}

async function save() {
  collectForm();
  $('saveStatus').textContent = 'Menyimpan...';
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(config)
    });
    if (res.status === 401) {
      $('saveStatus').textContent = 'Sesi habis, login ulang.';
      localStorage.removeItem('admin_token');
      setTimeout(() => location.reload(), 1200);
      return;
    }
    if (!res.ok) throw new Error('save failed');
    $('saveStatus').textContent = 'Tersimpan ✓';
    setTimeout(() => $('saveStatus').textContent = '', 2000);
    $('previewFrame').src = $('previewFrame').src;
  } catch (e) {
    $('saveStatus').textContent = 'Gagal menyimpan.';
  }
}
$('saveBtn').addEventListener('click', save);
$('refreshPreviewBtn').addEventListener('click', () => { $('previewFrame').src = $('previewFrame').src; });

// ---------- INIT ----------
if (token) {
  showPanel();
}
