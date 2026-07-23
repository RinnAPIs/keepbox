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
<p class="result-caption">
${escapeHtml(data.result.platform)} • ${items.length} download option${items.length > 1 ? "s" : ""}
</p>

<div class="media-list">
${items.map((item,i)=>renderMediaCard(item,i)).join("")}
</div>
`;

  items.forEach((item, i) => {
    const btn = resultArea.querySelector(`[data-save="${i}"]`);
    if (btn) btn.addEventListener('click', () => saveFile(item.url, item.filename));
  });
}

function renderMediaCard(item, i) {
  const mediaType = getMediaType(item);
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

function getMediaType(item) {
  if (item.type === "audio") return "audio";

  if (
    item.type === "image" ||
    item.type === "photo"
  ) return "photo";

  if (
    /\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(item.url)
  ) return "photo";

  return "video";
}

function extractItems(data) {
  if (!data?.success || !data?.result) return [];

  const result = data.result;
  const downloads = Array.isArray(result.downloads)
    ? result.downloads
    : [];

  return downloads
    .map(item => ({
      title: result.title || "",
      url: item.url,
      quality: item.quality || item.label || "",
      thumbnail: result.thumbnail || "",
      type: item.type || result.kind || "video",
      filename: guessFilename(
        item.url,
        result.title,
        item.type || result.kind
      )
    }))
    .filter(x => x.url);
}
function guessFilename(url, title, type) {
  const base = (title || "keepbox-file")
    .replace(/[^\w\-]+/g, "_")
    .slice(0, 80);

  if (type === "audio") return base + ".mp3";
  if (type === "image") return base + ".jpg";

  return base + ".mp4";
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
