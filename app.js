const state = {
  items: [],
  results: new Map(),
  selected: new Map(),
  isSearching: false,
};

const els = {
  menuItems: document.getElementById('menuItems'),
  orientation: document.getElementById('orientation'),
  resultsPerItem: document.getElementById('resultsPerItem'),
  searchBtn: document.getElementById('searchBtn'),
  downloadZipBtn: document.getElementById('downloadZipBtn'),
  results: document.getElementById('results'),
  statusText: document.getElementById('statusText'),
  progressText: document.getElementById('progressText'),
  settingsBtn: document.getElementById('settingsBtn'),
  settingsDialog: document.getElementById('settingsDialog'),
  pexelsKey: document.getElementById('pexelsKey'),
  unsplashKey: document.getElementById('unsplashKey'),
  saveKeysBtn: document.getElementById('saveKeysBtn'),
  clearKeysBtn: document.getElementById('clearKeysBtn'),
  toast: document.getElementById('toast'),
};

const STORAGE_KEYS = {
  pexels: 'menuImageDownloader.pexelsKey',
  unsplash: 'menuImageDownloader.unsplashKey',
};

function init() {
  loadKeys();
  bindEvents();

  if (!getPexelsKey() && !getUnsplashKey()) {
    setTimeout(() => els.settingsDialog.showModal(), 250);
  }
}

function bindEvents() {
  els.settingsBtn.addEventListener('click', () => {
    loadKeys();
    els.settingsDialog.showModal();
  });

  els.saveKeysBtn.addEventListener('click', saveKeys);
  els.clearKeysBtn.addEventListener('click', clearKeys);
  els.searchBtn.addEventListener('click', searchAll);
  els.downloadZipBtn.addEventListener('click', downloadZip);
}

function loadKeys() {
  els.pexelsKey.value = getPexelsKey();
  els.unsplashKey.value = getUnsplashKey();
}

function getPexelsKey() {
  return localStorage.getItem(STORAGE_KEYS.pexels) || '';
}

function getUnsplashKey() {
  return localStorage.getItem(STORAGE_KEYS.unsplash) || '';
}

function saveKeys() {
  localStorage.setItem(STORAGE_KEYS.pexels, els.pexelsKey.value.trim());
  localStorage.setItem(STORAGE_KEYS.unsplash, els.unsplashKey.value.trim());
  els.settingsDialog.close();
  toast('Settings saved.');
}

function clearKeys() {
  localStorage.removeItem(STORAGE_KEYS.pexels);
  localStorage.removeItem(STORAGE_KEYS.unsplash);
  els.pexelsKey.value = '';
  els.unsplashKey.value = '';
  toast('API keys cleared.');
}

function parseItems() {
  return els.menuItems.value
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)
    .filter((item, index, arr) => arr.indexOf(item) === index);
}

async function searchAll() {
  const items = parseItems();

  if (!items.length) {
    toast('Add at least one menu item.');
    return;
  }

  if (!getPexelsKey() && !getUnsplashKey()) {
    toast('Add at least one API key first.');
    els.settingsDialog.showModal();
    return;
  }

  state.items = items;
  state.results.clear();
  state.selected.clear();
  state.isSearching = true;

  setLoading(true);
  renderShell(items);
  setStatus(`Searching ${items.length} item${items.length === 1 ? '' : 's'}...`, `0 / ${items.length} complete`);

  let completed = 0;

  for (const item of items) {
    renderItemLoading(item);

    try {
      const images = await searchItem(item);
      state.results.set(item, images);
      if (images.length) state.selected.set(item, images[0].id);
      renderItem(item);
    } catch (error) {
      state.results.set(item, []);
      renderItem(item, error.message || 'Search failed');
    } finally {
      completed += 1;
      setStatus(
        `Searched ${completed} of ${items.length} item${items.length === 1 ? '' : 's'}.`,
        `${completed} / ${items.length} complete`
      );
    }
  }

  state.isSearching = false;
  setLoading(false);

  const selectedCount = getSelectedImages().length;
  els.downloadZipBtn.disabled = selectedCount === 0;
  setStatus('Search complete.', `${selectedCount} selected image${selectedCount === 1 ? '' : 's'}`);
}

async function searchItem(item) {
  const pexelsKey = getPexelsKey();
  const unsplashKey = getUnsplashKey();
  const count = Number(els.resultsPerItem.value || 3);
  const orientation = els.orientation.value;

  if (pexelsKey) {
    try {
      const pexelsResults = await searchPexels(item, count, orientation, pexelsKey);
      if (pexelsResults.length) return pexelsResults;
    } catch (error) {
      console.warn('Pexels failed:', error);
    }
  }

  if (unsplashKey) {
    const unsplashResults = await searchUnsplash(item, count, orientation, unsplashKey);
    if (unsplashResults.length) return unsplashResults;
  }

  return [];
}

async function searchPexels(query, count, orientation, apiKey) {
  const url = new URL('https://api.pexels.com/v1/search');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', count);
  url.searchParams.set('orientation', orientation);

  const response = await fetch(url, {
    headers: { Authorization: apiKey },
  });

  if (!response.ok) throw new Error(`Pexels error ${response.status}`);

  const data = await response.json();

  return (data.photos || []).map(photo => ({
    id: `pexels-${photo.id}`,
    source: 'Pexels',
    itemName: query,
    thumbUrl: photo.src.large,
    downloadUrl: photo.src.original,
    pageUrl: photo.url,
    photographer: photo.photographer,
    width: photo.width,
    height: photo.height,
    ext: getExtensionFromUrl(photo.src.original, 'jpg'),
  }));
}

async function searchUnsplash(query, count, orientation, apiKey) {
  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', count);
  url.searchParams.set('orientation', orientation);
  url.searchParams.set('content_filter', 'high');

  const response = await fetch(url, {
    headers: { Authorization: `Client-ID ${apiKey}` },
  });

  if (!response.ok) throw new Error(`Unsplash error ${response.status}`);

  const data = await response.json();

  return (data.results || []).map(photo => ({
    id: `unsplash-${photo.id}`,
    source: 'Unsplash',
    itemName: query,
    thumbUrl: photo.urls.regular,
    downloadUrl: photo.urls.full,
    pageUrl: `${photo.links.html}?utm_source=menu_image_downloader&utm_medium=referral`,
    photographer: photo.user?.name || 'Unsplash photographer',
    width: photo.width,
    height: photo.height,
    ext: 'jpg',
  }));
}

function renderShell(items) {
  els.results.innerHTML = items.map(item => `
    <article class="panel item-section" data-item="${escapeHtml(item)}">
      <div class="item-head">
        <h2 class="item-title">${escapeHtml(item)}</h2>
        <div class="badges"><span class="badge warn">Waiting</span></div>
      </div>
      <div class="loading-row"><span class="spinner"></span> Searching images...</div>
    </article>
  `).join('');
}

function renderItemLoading(item) {
  const section = findSection(item);
  if (!section) return;

  section.querySelector('.badges').innerHTML = '<span class="badge warn">Searching</span>';
  section.querySelector('.loading-row')?.remove();
  section.insertAdjacentHTML('beforeend', '<div class="loading-row"><span class="spinner"></span> Searching images...</div>');
}

function renderItem(item, error = '') {
  const section = findSection(item);
  if (!section) return;

  const images = state.results.get(item) || [];
  const selectedId = state.selected.get(item);

  if (!images.length) {
    section.innerHTML = `
      <div class="item-head">
        <h2 class="item-title">${escapeHtml(item)}</h2>
        <div class="badges"><span class="badge error">No results</span></div>
      </div>
      <p style="color: var(--muted); margin:0;">${escapeHtml(error || 'No images found from the available sources.')}</p>
    `;
    return;
  }

  const source = images[0].source;

  section.innerHTML = `
    <div class="item-head">
      <h2 class="item-title">${escapeHtml(item)}</h2>
      <div class="badges">
        <span class="badge success">${escapeHtml(source)} ✓</span>
        <span class="badge">${images.length} results</span>
      </div>
    </div>
    <div class="image-grid">
      ${images.map(image => renderImageCard(image, selectedId)).join('')}
    </div>
    <div class="item-actions">
      <button class="btn btn-secondary" data-download-item="${escapeHtml(item)}">↓ Download selected</button>
    </div>
  `;

  section.querySelectorAll('.image-card').forEach(card => {
    card.addEventListener('click', () => {
      state.selected.set(item, card.dataset.imageId);
      renderItem(item);
      els.downloadZipBtn.disabled = getSelectedImages().length === 0;
    });
  });

  section.querySelector('[data-download-item]')?.addEventListener('click', () => downloadSingle(item));
}

function renderImageCard(image, selectedId) {
  const selected = image.id === selectedId;
  const attribution = image.source === 'Unsplash'
    ? `<a href="${escapeAttribute(image.pageUrl)}" target="_blank" rel="noopener">${escapeHtml(image.photographer)}</a>`
    : escapeHtml(image.photographer || 'Photographer');

  return `
    <article class="image-card ${selected ? 'selected' : ''}" data-image-id="${escapeAttribute(image.id)}">
      <span class="check">✓</span>
      <img src="${escapeAttribute(image.thumbUrl)}" alt="${escapeAttribute(image.itemName)} image from ${escapeAttribute(image.source)}" loading="lazy" />
      <div class="image-meta">
        <div class="meta-line"><strong>${escapeHtml(image.source)}</strong><span>${image.width} × ${image.height}</span></div>
        <div class="meta-line"><span>By ${attribution}</span><span>${image.ext.toUpperCase()}</span></div>
      </div>
    </article>
  `;
}

function findSection(item) {
  return [...els.results.querySelectorAll('[data-item]')].find(section => section.dataset.item === item);
}

function getSelectedImages() {
  return state.items
    .map(item => {
      const selectedId = state.selected.get(item);
      const image = (state.results.get(item) || []).find(result => result.id === selectedId);
      return image || null;
    })
    .filter(Boolean);
}

async function downloadSingle(item) {
  const image = getSelectedImages().find(selected => selected.itemName === item);
  if (!image) return toast('No selected image for this item.');

  try {
    const blob = await fetchImageBlob(image.downloadUrl);
    saveAs(blob, buildFilename(image.itemName, image.ext));
    toast(`Downloaded ${image.itemName}.`);
  } catch (error) {
    console.error(error);
    toast(`Could not download ${image.itemName}. Try another image.`);
  }
}

async function downloadZip() {
  const selectedImages = getSelectedImages();
  if (!selectedImages.length) return toast('No selected images to download.');

  els.downloadZipBtn.disabled = true;
  els.downloadZipBtn.textContent = 'Preparing ZIP...';

  try {
    const zip = new JSZip();

    for (const image of selectedImages) {
      const blob = await fetchImageBlob(image.downloadUrl);
      zip.file(buildFilename(image.itemName, image.ext), blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, 'menu-images.zip');
    toast('ZIP downloaded.');
  } catch (error) {
    console.error(error);
    toast('Could not create ZIP. Some image hosts may block downloads.');
  } finally {
    els.downloadZipBtn.disabled = false;
    els.downloadZipBtn.textContent = '↓ Download All as ZIP';
  }
}

async function fetchImageBlob(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image download failed ${response.status}`);
  return response.blob();
}

function buildFilename(itemName, ext) {
  const safeName = itemName
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim() || 'menu-item';

  return `${safeName}.${ext || 'jpg'}`;
}

function getExtensionFromUrl(url, fallback) {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split('.').pop()?.toLowerCase();
    return ext && ext.length <= 5 ? ext : fallback;
  } catch {
    return fallback;
  }
}

function setLoading(isLoading) {
  els.searchBtn.disabled = isLoading;
  els.searchBtn.textContent = isLoading ? 'Searching...' : '🔍 Search All Images';
  if (isLoading) els.downloadZipBtn.disabled = true;
}

function setStatus(message, progress) {
  els.statusText.innerHTML = `<strong>${escapeHtml(message)}</strong>`;
  els.progressText.textContent = progress;
}

let toastTimer;
function toast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add('show');
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2800);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[char]));
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

init();
