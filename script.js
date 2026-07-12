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
  const thumb = data.thumbnail || data.cover || data.image || '';
  const title = data.title || data.caption || 'Ready to download';
  const links = extractLinks(data);

  resultArea.className = 'result-area';
  resultArea.innerHTML = `
    <div class="result-title">${escapeHtml(title.slice(0, 80))}</div>
    <div class="result-media">
      ${thumb ? `<img class="result-thumb" src="${escapeAttr(thumb)}" alt="">` : ''}
      <div class="result-info">
        <p class="result-caption">Detected from ${escapeHtml(new URL(sourceUrl).hostname)}</p>
        <div class="result-links">
          ${links.map(l => `
            <div class="result-link">
              <span class="tag">${escapeHtml(l.label)}</span>
              <a class="dl" href="${escapeAttr(l.url)}" target="_blank" rel="noopener">Download</a>
            </div>
          `).join('') || '<p class="result-caption">No direct links returned for this link.</p>'}
        </div>
      </div>
    </div>
  `;
}

function extractLinks(data) {
  const links = [];
  const candidates = data.medias || data.links || data.data || data.result || [];
  if (Array.isArray(candidates)) {
    candidates.forEach((item, i) => {
      const url = item.url || item.link || item.download_url || item.downloadUrl;
      if (url) {
        links.push({ label: item.quality || item.type || item.format || `Option ${i + 1}`, url });
      }
    });
  }
  if (!links.length && data.url) links.push({ label: data.quality || 'Download', url: data.url });
  if (!links.length && data.download_url) links.push({ label: 'Download', url: data.download_url });
  return links;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function escapeAttr(str) {
  return escapeHtml(str);
}
