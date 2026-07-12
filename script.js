const form = document.getElementById('downloadForm');
const input = document.getElementById('urlInput');
const clearBtn = document.getElementById('clearBtn');
const resultArea = document.getElementById('resultArea');
const submitBtn = form.querySelector('.download-btn');

clearBtn.addEventListener('click', () => {
  input.value = '';
  input.focus();
  resultArea.hidden = true;
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = input.value.trim();
  if (!url) return;

  submitBtn.disabled = true;
  resultArea.hidden = false;
  resultArea.className = 'result-area';
  resultArea.innerHTML = `
    <div class="loading-row">
      <span class="spinner"></span>
      <span>Fetching download options...</span>
    </div>
  `;

  try {
    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || 'Something went wrong.');
    }

    renderResult(data, url);
  } catch (err) {
    resultArea.className = 'result-area error';
    resultArea.innerHTML = `
      <div class="result-title">Couldn't fetch that link</div>
      <p class="result-caption">${escapeHtml(err.message)}</p>
    `;
  } finally {
    submitBtn.disabled = false;
  }
});

function renderResult(data, sourceUrl) {
  const items = extractItems(data);

  if (!items.length) {
    resultArea.className = 'result-area error';
    resultArea.innerHTML = `
      <div class="result-title">No downloadable media found</div>
      <p class="result-caption">The source didn't return any files for this link.</p>
    `;
    return;
  }

  resultArea.className = 'result-area';
  resultArea.innerHTML = `
    <p class="result-caption">Detected from ${escapeHtml(new URL(sourceUrl).hostname)} · ${items.length} option${items.length > 1 ? 's' : ''}</p>
    <div class="media-list">
      ${items.map((item, i) => renderMediaCard(item, i)).join('')}
    </div>
  `;

  items.forEach((item, i) => {
    const btn = resultArea.querySelector(`[data-save="${i}"]`);
    if (btn) btn.addEventListener('click', () => saveFile(item.url, item.filename));
  });
}

function renderMediaCard(item, i) {
  const mediaType = getMediaType(item.url);
  let preview = '';

  if (mediaType === 'video') {
    preview = `<video class="media-preview" src="${escapeAttr(item.url)}" poster="${escapeAttr(item.thumbnail || '')}" controls playsinline preload="none"></video>`;
  } else if (mediaType === 'audio') {
    preview = `
      ${item.thumbnail ? `<img class="result-thumb" src="${escapeAttr(item.thumbnail)}" alt="">` : ''}
      <audio class="media-preview audio" src="${escapeAttr(item.url)}" controls preload="none"></audio>
    `;
  } else if (mediaType === 'photo') {
    preview = `<img class="media-preview" src="${escapeAttr(item.url)}" alt="">`;
  } else if (item.thumbnail) {
    preview = `<img class="result-thumb" src="${escapeAttr(item.thumbnail)}" alt="">`;
  }

  return `
    <div class="media-card">
      <div class="media-preview-wrap ${mediaType}">${preview}</div>
      <div class="media-info">
        <p class="media-title">${escapeHtml((item.title || 'Untitled').slice(0, 90))}</p>
        <div class="media-footer">
          <span class="tag">${escapeHtml(item.quality || mediaType)}</span>
          <button class="save-btn" data-save="${i}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3V15M12 15L7 10M12 15L17 10M5 20H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Save
          </button>
        </div>
      </div>
    </div>
  `;
}

function getMediaType(url) {
  if (/audio=1/.test(url)) return 'audio';
  if (/photo=1/.test(url)) return 'photo';
  return 'video';
}

function extractItems(data) {
  const raw = data.items || data.medias || data.links || data.data || data.result || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const url = item.url || item.link || item.download_url || item.downloadUrl;
    if (!url) return null;
    return {
      title: item.title || item.caption || '',
      url,
      quality: item.quality || item.type || item.format || '',
      thumbnail: item.thumbnail || item.cover || item.image || '',
      filename: guessFilename(url, item.title)
    };
  }).filter(Boolean);
}

function guessFilename(url, title) {
  try {
    const parsed = new URL(url);
    const fromParam = parsed.searchParams.get('filename');
    if (fromParam) return fromParam;
  } catch (e) {}
  const base = (title || 'keepbox-file').replace(/[^\w\-]+/g, '_').slice(0, 60);
  return /audio=1/.test(url) ? `${base}.mp3` : `${base}.mp4`;
}

async function saveFile(url, filename) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename || 'keepbox-file';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || '';
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function escapeAttr(str) {
  return escapeHtml(str);
}
