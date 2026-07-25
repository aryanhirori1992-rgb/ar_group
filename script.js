// ===== DATA STORE =====
const ADMIN_USERS = [
  { user: 'admin', pass: '7890' },
  { user: 'team', pass: 'teamma2025' }
];

let isLoggedIn = false;
let items = []; // داتا ژ PostgreSQL دهێت
let currentFilter = 'all';

const CAT_LABELS = {
  website: 'وێبسایت',
  graphic: 'گرافیک دیزاین',
  logo: 'لۆگۆ',
  excel: 'ئەکسل (Excel)',
  pos: 'سیستەمێ POS'
};
const CAT_ICONS = { website:'🌐', graphic:'🎨', logo:'✏️', excel:'📊', pos:'🖥️' };

// 💡 فەنکشنا یاریدەدەر بۆ وەرگرتنا مسیرێ دروست یێ وێنەی / ڤیدیۆیێ ژ سێرڤەری
function getFileSrc(item) {
  const rawPath = item.image_url || item.file_name || '';
  if (!rawPath) return 'https://via.placeholder.com/300'; // وێنەیێ یەدەگ ئەگەر نەبوو
  if (rawPath.startsWith('http') || rawPath.startsWith('/uploads/')) {
    return rawPath;
  }
  return `/uploads/${rawPath}`;
}

// Aspect ratio per category defaults
function getCatRatio(cat, imgW, imgH) {
  if (cat === 'website') return 'ratio-website';
  if (cat === 'graphic' || cat === 'logo') {
    if (!imgW || !imgH) return 'ratio-1-1';
    const r = imgW / imgH;
    if (r < 0.7) return 'ratio-9-16';
    if (r > 1.4) return 'ratio-16-9';
    return 'ratio-1-1';
  }
  return 'ratio-16-9';
}

// ===== RENDER PORTFOLIO =====
function renderGrid() {
  const grid = document.getElementById('portfolio-grid');
  if (!grid) return;

  const filtered = currentFilter === 'all' 
    ? items 
    : items.filter(i => (i.category || i.cat) === currentFilter);

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      <p>هێشتا چو نموونە نەهاتینە زێدەکرن</p>
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map((item) => {
    const itemCat = item.category || item.cat || 'website';
    const isWebsite = itemCat === 'website';
    const catClass = `cat-${itemCat}`;
    
    // خوێندنەوەیا وێنەی / ڤیدیۆی ب ڕێکا فەنکشنا خاوێنکری
    const fileSrc = getFileSrc(item);
    const isVideo = item.file_type === 'video' || fileSrc.endsWith('.mp4');

    const mediaHtml = isVideo
      ? `<video src="${fileSrc}" muted autoplay loop playsinline style="width:100%; height:100%; object-fit:cover;"></video>`
      : `<img src="${fileSrc}" alt="${escHtml(item.title)}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">`;

    return `<div class="card${isWebsite ? ' website-card' : ''}" onclick="openLightbox(${item.id})">
      <div class="img-wrap">
        ${mediaHtml}
        ${isWebsite ? `<div class="website-overlay"><div class="website-actions">
          <button class="wa-btn" onclick="event.stopPropagation(); openLightbox(${item.id})">ببینە</button>
          ${item.url ? `<button class="wa-btn" onclick="event.stopPropagation(); window.open('${sanitizeURL(item.url)}','_blank')">🔗 سەرەدان</button>` : ''}
        </div></div>` : ''}
      </div>
      <div class="card-info">
        <span class="card-cat ${catClass}">${CAT_ICONS[itemCat] || '📁'} ${CAT_LABELS[itemCat] || itemCat}</span>
        <h3>${escHtml(item.title)}</h3>
        ${(item.description || item.desc) ? `<p>${escHtml(item.description || item.desc)}</p>` : ''}
      </div>
    </div>`;
  }).join('');

  const countEl = document.getElementById('stat-count');
  if (countEl) countEl.textContent = items.length + '+';
}

function sanitizeURL(url) {
  try {
    const u = new URL(url);
    if (u.protocol === 'http:' || u.protocol === 'https:') return url;
  } catch(e) {}
  return '#';
}

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== FILTER =====
function filterItems(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderGrid();
}

// ===== LIGHTBOX =====
function openLightbox(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  const lb = document.getElementById('lightbox');
  document.getElementById('lb-title').textContent = item.title;

  const itemCat = item.category || item.cat || 'website';
  const badge = document.getElementById('lb-cat-badge');
  badge.textContent = (CAT_ICONS[itemCat] || '📁') + ' ' + (CAT_LABELS[itemCat] || itemCat);
  badge.className = `card-cat cat-${itemCat}`;
  badge.style.marginLeft = '0.5rem';

  const imgWrap = document.getElementById('lb-img-wrap');
  const fileSrc = getFileSrc(item);
  const isVideo = item.file_type === 'video' || fileSrc.endsWith('.mp4');

  if (isVideo) {
    imgWrap.innerHTML = `<video src="${fileSrc}" controls autoplay style="max-height:70vh;object-fit:contain;width:100%;"></video>`;
  } else {
    imgWrap.innerHTML = `<img src="${fileSrc}" alt="${escHtml(item.title)}" style="max-height:70vh;object-fit:contain;width:100%;">`;
  }

  document.getElementById('lb-desc').textContent = item.description || item.desc || '';

  const visit = document.getElementById('lb-visit');
  if (item.url && itemCat === 'website') {
    visit.href = sanitizeURL(item.url);
    visit.style.display = 'inline-flex';
  } else {
    visit.style.display = 'none';
  }

  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.classList.remove('open');
  document.body.style.overflow = '';
  const imgWrap = document.getElementById('lb-img-wrap');
  if (imgWrap) imgWrap.innerHTML = '';
}

function closeLightboxOnBg(e) {
  if (e.target === document.getElementById('lightbox')) closeLightbox();
}

// ===== LOGIN =====
function openAdminLogin() {
  if (isLoggedIn) { openAdmin(); return; }
  document.getElementById('login-screen').classList.add('open');
  document.getElementById('login-err').style.display = 'none';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  setTimeout(() => document.getElementById('login-user').focus(), 100);
}

function closeAdminLogin() {
  document.getElementById('login-screen').classList.remove('open');
}

let loginAttempts = 0;
let lockUntil = 0;

function doLogin() {
  const now = Date.now();
  if (now < lockUntil) {
    showLoginErr(`تە کلیل دایە. کێمەکا دی هێشتا ${Math.ceil((lockUntil - now)/1000)} چرکەیان چاڤەڕێ بکە`);
    return;
  }
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value;

  if (!u || !p) { showLoginErr('تکایە هەمی خانەیان پڕبکە'); return; }

  const match = ADMIN_USERS.find(a => a.user === u && a.pass === p);
  if (match) {
    loginAttempts = 0;
    isLoggedIn = true;
    closeAdminLogin();
    openAdmin();
  } else {
    loginAttempts++;
    if (loginAttempts >= 5) {
      lockUntil = Date.now() + 30000;
      loginAttempts = 0;
      showLoginErr('٥ جاران شاشی چێبوو، تکایە ٣٠ چرکەیان چاڤەڕێ بکە');
    } else {
      showLoginErr(`ناڤ یا پاسوۆرد شاشە (${5 - loginAttempts} هەولێن دی ماینە)`);
    }
  }
}

function showLoginErr(msg) {
  const el = document.getElementById('login-err');
  if (el) {
    el.textContent = msg; 
    el.style.display = 'block';
  }
}

const loginPassEl = document.getElementById('login-pass');
if (loginPassEl) {
  loginPassEl.addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
}
const loginUserEl = document.getElementById('login-user');
if (loginUserEl) {
  loginUserEl.addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('login-pass').focus(); });
}

// ===== ADMIN PANEL =====
function openAdmin() {
  document.getElementById('admin-panel').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderManageTable();
}

function closeAdmin() {
  isLoggedIn = false;
  document.getElementById('admin-panel').classList.remove('open');
  document.body.style.overflow = '';
}

function showAdminSection(id, btn) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sb-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`sec-${id}`).classList.add('active');
  if (btn) btn.classList.add('active');
  if (id === 'manage') renderManageTable();
}

// ===== UPLOAD / ADD =====
let selectedFileObject = null;
let selectedImgData = null, selectedImgW = 0, selectedImgH = 0;

function onCatChange() {
  const cat = document.getElementById('f-cat').value;
  document.getElementById('url-field').style.display = cat === 'website' ? 'block' : 'none';
  const showRatio = (cat === 'graphic' || cat === 'logo');
  document.getElementById('ratio-field').style.display = showRatio ? 'block' : 'none';
}

function onImgSelect(e) {
  const file = e.target.files ? e.target.files[0] : null;
  if (!file) return;

  if (file.size > 20 * 1024 * 1024) { 
    showToast('فایل گەلەک مەزنە (مەزنترین قەبارە 20MB)', 'error'); 
    return; 
  }

  // خەزنکرنا فایلی بۆ هنارتنێ د submitItem دا
  selectedFileObject = file;

  const reader = new FileReader();
  reader.onload = ev => {
    selectedImgData = ev.target.result;
    let prev = document.getElementById('img-preview');
    
    if (!prev) {
      // ئەگەر تاگ نین بت
      const zone = document.getElementById('drop-zone');
      if (zone) {
        prev = document.createElement('img');
        prev.id = 'img-preview';
        zone.appendChild(prev);
      }
    }

    if (prev) {
      if (file.type.startsWith('video/')) {
        prev.outerHTML = `<video id="img-preview" src="${selectedImgData}" muted autoplay loop style="max-width:100%; max-height:150px; display:block; border-radius:8px; margin-top:0.5rem; margin-x:auto;"></video>`;
      } else {
        prev.outerHTML = `<img id="img-preview" src="${selectedImgData}" style="max-width:100%; max-height:150px; display:block; border-radius:8px; margin-top:0.5rem; margin-x:auto;">`;
      }
    }

    const hint = document.getElementById('img-hint');
    if (hint) hint.textContent = file.name;
  };

  reader.readAsDataURL(file);
}

// 💡 زێدەکرنا پڕۆژەی (Submit)
// 💡 زێدەکرنا پڕۆژەی (Submit) - چاککراو
// 💡 زێدەکرنا پڕۆژەی (Submit) - بێ خەتا و سەلامەت
async function submitItem(e) {
  if (e && e.preventDefault) e.preventDefault();

  if (!isLoggedIn) {
    showToast('تکایە پێشتر بچە ناڤ ئەدمین پانێلێ (Login)', 'error');
    return;
  }

  // ئینانا کێڵگەیان ب پشکنینا ID (دەستنیشانکرنا ئامادەبوونا ئەلەمێنتی د DOM دا)
  const catEl = document.getElementById('f-cat');
  const titleEl = document.getElementById('f-title');
  const descEl = document.getElementById('f-desc');
  const urlEl = document.getElementById('f-url');
  const fileEl = document.getElementById('f-img');

  const cat = catEl ? catEl.value : '';
  const title = titleEl ? titleEl.value.trim() : '';
  const desc = descEl ? descEl.value.trim() : '';
  const url = urlEl ? urlEl.value.trim() : '';
  const fileToUpload = selectedFileObject || (fileEl && fileEl.files ? fileEl.files[0] : null);

  if (!cat) { showToast('تکایە کاتیگۆریەکێ هەلبژێره', 'error'); return; }
  if (!title) { showToast('تکایە ناڤێ پڕۆژەی بنڤێسە', 'error'); return; }
  if (!fileToUpload) { showToast('تکایە فایلەکێ هەلبژێره', 'error'); return; }

  if (cat === 'website' && url) {
    try { new URL(url); } catch(err) { showToast('لینکا وێبسایتی شاشە', 'error'); return; }
  }

const formData = new FormData();
  formData.append('cat', cat);
  formData.append('category', cat);
  formData.append('title', title);
  formData.append('desc', desc);
  formData.append('description', desc);
  formData.append('url', url || '');
  
  // ⚠️ تەنێ ئەڤێ ڕستێ ب هێلە و 'file' ڕابکێشە!
  formData.append('image', fileToUpload);

  try {
    const response = await fetch('/api/projects', { 
      method: 'POST', 
      body: formData 
    });

    if (!response.ok) {
      throw new Error('Error saving project');
    }

    const result = await response.json();
    showToast('نموونە ب سەرکەفتوویی هاتە زێدەکرن ✓', 'success');
    resetForm();
    await loadProjectsFromServer();

  } catch (error) {
    console.error('Upload error:', error);
    showToast('کێشەیەک د دەمێ هنارتنێ دا چێبوو د سێرڤەری دا', 'error');
  }
}

function resetForm() {
  document.getElementById('f-cat').value = '';
  document.getElementById('f-title').value = '';
  document.getElementById('f-desc').value = '';
  document.getElementById('f-url').value = '';
  document.getElementById('f-img').value = '';
  
  const prev = document.getElementById('img-preview');
  if(prev) {
    prev.outerHTML = `<img id="img-preview" src="" style="display:none; max-width:100%; max-height:150px; border-radius:8px; margin-top:0.5rem;">`;
  }
  
  document.getElementById('img-hint').textContent = 'PNG, JPG, WEBP, MP4 — مەزنترین قەبارە 20MB';
  document.getElementById('url-field').style.display = 'none';
  document.getElementById('ratio-field').style.display = 'none';
  selectedImgData = null; selectedImgW = 0; selectedImgH = 0; selectedFileObject = null;
}

// ===== MANAGE TABLE =====
function renderManageTable() {
  const tbody = document.getElementById('manage-tbody');
  const countLabel = document.getElementById('item-count-label');
  if (countLabel) countLabel.textContent = `${items.length} نموونە`;
  
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--muted)">چو نموونە نینن</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map(item => {
    const itemCat = item.category || item.cat || 'website';
    const fileSrc = getFileSrc(item);
    const isVideo = item.file_type === 'video' || fileSrc.endsWith('.mp4');

    const thumbHtml = isVideo
      ? `<video class="table-thumb" src="${fileSrc}" muted style="width:50px;height:50px;object-fit:cover;border-radius:4px;"></video>`
      : `<img class="table-thumb" src="${fileSrc}" alt="" style="width:50px;height:50px;object-fit:cover;border-radius:4px;" onerror="this.src='https://via.placeholder.com/50'">`;

    return `<tr>
      <td>${thumbHtml}</td>
      <td style="font-weight:500;">${escHtml(item.title)}</td>
      <td><span class="card-cat cat-${itemCat}">${CAT_LABELS[itemCat] || itemCat}</span></td>
      <td style="color:var(--muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(item.description || item.desc || '—')}</td>
      <td><button class="del-btn" onclick="deleteItem(${item.id})">🗑 سڕینەوە</button></td>
    </tr>`;
  }).join('');
}

// 💡 سڕینەوەیا پڕۆژەی (Delete)
async function deleteItem(id) {
  if (!confirm('تۆ پشتڕاستی کو دکەی دێ ڤێ نموونەیێ سڕی؟')) return;
  try {
    const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (response.ok) {
      showToast('نموونە هاتە سڕین', 'success');
      await loadProjectsFromServer();
    } else {
      throw new Error('Failed to delete');
    }
  } catch (error) {
    console.error(error);
    showToast('کێشەیەک د سڕینەوەیێ دا دروستبوو', 'error');
  }
}

// ===== LOAD FROM SERVER =====
async function loadProjectsFromServer() {
  try {
    const response = await fetch('/api/projects');
    if(!response.ok) throw new Error('Network error');
    items = await response.json();
    renderGrid();
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel && adminPanel.classList.contains('open')) {
      renderManageTable();
    }
  } catch (error) {
    console.error("خەتا د ئینانا داتایان دا:", error);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadProjectsFromServer();
});

// ===== TOAST =====
let toastTimeout;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type} show`;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 3200);
}

// ===== SCROLL =====
function scrollToWork() {
  const el = document.getElementById('portfolio');
  if (el) el.scrollIntoView({ behavior:'smooth' });
}
function scrollToAbout() {
  const el = document.getElementById('about');
  if (el) el.scrollIntoView({ behavior:'smooth' });
}

// ===== KEYBOARD =====
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeLightbox();
    closeAdminLogin();
  }
});

// ===== COUNTER ANIMATION =====
function animateCount(el, target, duration=1200) {
  if(!el) return;
  let start = 0, step = target / (duration/16);
  const timer = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = Math.floor(start) + (start >= target ? '+' : '');
    if (start >= target) clearInterval(timer);
  }, 16);
}

setTimeout(() => {
  const countEl = document.getElementById('stat-count');
  animateCount(countEl, Math.max(items.length, 12));
}, 400);

// ===== MASONRY RESIZE =====
function resizeMasonryItems() {
  const grid = document.querySelector('.portfolio-grid');
  if (!grid) return;

  const rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows')) || 5;
  const allItems = document.querySelectorAll('.card');

  allItems.forEach(item => {
    const itemHeight = item.getBoundingClientRect().height;
    const gapAmount = window.innerWidth <= 640 ? 10 : 15;
    const rowSpan = Math.ceil((itemHeight + gapAmount) / rowHeight);
    item.style.gridRowEnd = `span ${rowSpan}`;
  });
}

function waitForImagesAndResize() {
  const allMedia = document.querySelectorAll('.card img, .card video');
  let loadedCount = 0;
  const totalMedia = allMedia.length;

  if (totalMedia === 0) {
    resizeMasonryItems();
    return;
  }

  allMedia.forEach(media => {
    if (media.tagName === 'VIDEO') {
      media.addEventListener('loadeddata', () => {
        loadedCount++;
        if (loadedCount === totalMedia) resizeMasonryItems();
      });
    } else {
      if (media.complete) {
        loadedCount++;
        if (loadedCount === totalMedia) resizeMasonryItems();
      } else {
        media.addEventListener('load', () => {
          loadedCount++;
          if (loadedCount === totalMedia) resizeMasonryItems();
        });
        media.addEventListener('error', () => {
          loadedCount++;
          if (loadedCount === totalMedia) resizeMasonryItems();
        });
      }
    }
  });
  resizeMasonryItems();
}

const gridContainer = document.querySelector('.portfolio-grid');
if (gridContainer) {
  const observer = new MutationObserver(() => {
    setTimeout(waitForImagesAndResize, 50);
    setTimeout(waitForImagesAndResize, 250);
  });
  observer.observe(gridContainer, { childList: true });
}

window.addEventListener('load', waitForImagesAndResize);
window.addEventListener('resize', resizeMasonryItems);