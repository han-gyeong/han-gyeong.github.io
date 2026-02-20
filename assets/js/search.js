(async function () {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (!input || !results) return;

  let index = [];
  try {
    const base = document.body.dataset.baseurl || '';
    const res = await fetch(`${base}/search.json`);
    index = await res.json();
  } catch (err) {
    results.innerHTML = '<div class="search-item">검색 인덱스를 불러오지 못했습니다.</div>';
    return;
  }

  function render(items) {
    if (!items.length) {
      results.innerHTML = '<div class="search-item">검색 결과가 없습니다.</div>';
      return;
    }
    results.innerHTML = items.map(item => {
      return `
        <div class="search-item">
          <div class="post-meta">${item.date}</div>
          <a href="${item.url}"><strong>${item.title}</strong></a>
          <div class="post-excerpt">${item.summary}</div>
        </div>
      `;
    }).join('');
  }

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      results.innerHTML = '';
      return;
    }
    const filtered = index.filter(item => {
      const hay = [item.title, item.summary, ...(item.tags || []), ...(item.categories || [])]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
    render(filtered);
  });
})();
