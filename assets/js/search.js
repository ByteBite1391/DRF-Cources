/* ============================================================
   DRF فارسی — Search
   جستجوی دوزبانه (فارسی/انگلیسی) با رتبه‌بندی و ناوبری کیبورد
   ============================================================ */

import { $, $$, normalize, escapeHtml, debounce, toFa } from './utils.js';

/* ============================================================
   State
   ============================================================ */
let manifestRef = null;
let index = [];              // آیتم‌های جستجو
let activeIndex = -1;
let currentResults = [];

/* ============================================================
   Init
   ============================================================ */
export function initSearch(manifest, { onSelect } = {}) {
  manifestRef = manifest;
  buildIndex();

  const input = $('#searchInput');
  const results = $('#searchResults');
  if (!input || !results) return;

  // جستجو با debounce
  const handleInput = debounce(() => {
    runSearch(input.value);
  }, 140);

  input.addEventListener('input', handleInput);
  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2) {
      runSearch(input.value);
    }
  });

  // ناوبری با کیبورد
  input.addEventListener('keydown', (e) => {
    if (!results.classList.contains('open')) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveActive(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveActive(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = currentResults[activeIndex];
      if (item) {
        selectResult(item, onSelect);
      }
    } else if (e.key === 'Escape') {
      closeSearch();
      input.blur();
    }
  });

  // بستن با کلیک بیرون
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) {
      closeSearch();
    }
  });

  // میانبر Ctrl/Cmd + K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });
}

/* ============================================================
   Build index از manifest
   ============================================================ */
function buildIndex() {
  if (!manifestRef) return;
  index = [];

  const sources = [
    { list: manifestRef.chapters || [], type: 'chapter', label: 'فصل', prefix: 'ch' },
    { list: manifestRef.labs || [], type: 'lab', label: 'آزمایشگاه', prefix: 'lab' },
    { list: manifestRef.projects || [], type: 'project', label: 'پروژه', prefix: 'project' },
  ];

  for (const source of sources) {
    for (const item of source.list) {
      index.push({
        id: item.id,
        slug: item.slug,
        title: item.title,
        description: item.description || item.objective || item.lead || '',
        tags: item.tags || [],
        level: item.level,
        type: source.type,
        typeLabel: source.label,
        hash: item.hash || (source.type === 'chapter'
          ? `chapter/${item.slug || item.id}`
          : `${source.type}/${item.slug || item.id}`),
        // فیلد جستجوی نرمال‌شده
        _search: normalize([
          item.title || '',
          item.slug || '',
          item.description || '',
          item.objective || '',
          item.lead || '',
          (item.tags || []).join(' '),
          (item.keywords || []).join(' '),
        ].join(' ')),
      });
    }
  }

  // آیتم‌های ثابت
  const staticItems = [
    { id: 'home', title: 'خانه', type: 'page', hash: 'home', keywords: ['home', 'خانه', 'شروع'] },
    { id: 'resources', title: 'منابع', type: 'page', hash: 'resources', keywords: ['resources', 'منابع', 'لینک'] },
    { id: 'cheatsheets', title: 'چیت‌شیت‌ها', type: 'page', hash: 'cheatsheets', keywords: ['cheatsheet', 'چیت شیت', 'مرجع سریع'] },
    { id: 'faq', title: 'سوالات متداول', type: 'page', hash: 'faq', keywords: ['faq', 'سوالات', 'پرسش'] },
    { id: 'exam', title: 'آزمون نهایی', type: 'page', hash: 'exam', keywords: ['exam', 'آزمون', 'امتحان'] },
  ];

  for (const item of staticItems) {
    index.push({
      ...item,
      typeLabel: 'صفحه',
      _search: normalize([item.title, (item.keywords || []).join(' ')].join(' ')),
    });
  }
}

/* ============================================================
   Run search
   ============================================================ */
function runSearch(query) {
  const results = $('#searchResults');
  if (!results) return;

  const q = normalize(query);
  if (q.length < 2) {
    closeSearch();
    return;
  }

  const tokens = q.split(/\s+/).filter(Boolean);

  const scored = index
    .map(item => ({ item, score: scoreItem(item, tokens, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  currentResults = scored.map(s => s.item);
  activeIndex = scored.length ? 0 : -1;

  renderResults(scored, query);
  results.classList.add('open');
  const input = $('#searchInput');
  input?.setAttribute('aria-expanded', 'true');
}

/* ============================================================
   Scoring
   ============================================================ */
function scoreItem(item, tokens, fullQuery) {
  let score = 0;
  const haystack = item._search;
  const titleNorm = normalize(item.title || '');

  // تطابق دقیق عنوان
  if (titleNorm === fullQuery) score += 100;

  // عنوان شامل عبارت
  if (titleNorm.includes(fullQuery)) score += 50;

  // همه توکن‌ها در haystack
  const allTokensFound = tokens.every(t => haystack.includes(t));
  if (!allTokensFound) {
    // اگر همه نبودند، فقط وقتی امتیاز می‌دهیم که حداقل یکی match باشد
    const matches = tokens.filter(t => haystack.includes(t));
    if (!matches.length) return 0;
    score += matches.length * 5;
  } else {
    score += 20;
  }

  // تطابق در tags
  const tagsNorm = normalize((item.tags || []).join(' '));
  const tagMatches = tokens.filter(t => tagsNorm.includes(t)).length;
  score += tagMatches * 8;

  // تطابق در slug
  const slugNorm = normalize(item.slug || '');
  if (tokens.some(t => slugNorm.includes(t))) score += 10;

  // اولویت نوع
  if (item.type === 'chapter') score += 3;
  else if (item.type === 'project') score += 2;
  else if (item.type === 'lab') score += 1;

  return score;
}

/* ============================================================
   Render results
   ============================================================ */
function renderResults(scored, rawQuery) {
  const holder = $('#searchResults');
  if (!holder) return;

  holder.innerHTML = '';

  if (!scored.length) {
    const empty = document.createElement('div');
    empty.className = 'sr-empty';
    empty.textContent = `نتیجه‌ای برای «${rawQuery}» پیدا نشد.`;
    holder.appendChild(empty);
    return;
  }

  scored.forEach(({ item }, i) => {
    const a = document.createElement('a');
    a.className = 'sr-item' + (i === activeIndex ? ' active' : '');
    a.href = '#' + item.hash;
    a.setAttribute('role', 'option');
    a.dataset.index = String(i);

    // عنوان
    const title = document.createElement('div');
    title.className = 'sr-title';
    title.appendChild(document.createTextNode(item.title));

    const badge = document.createElement('span');
    badge.className = 'sr-type';
    badge.textContent = item.typeLabel;
    title.appendChild(badge);

    // snippet
    const snippet = document.createElement('div');
    snippet.className = 'sr-snippet';
    snippet.innerHTML = highlightSnippet(item, rawQuery);

    a.appendChild(title);
    a.appendChild(snippet);

    a.addEventListener('mouseenter', () => {
      activeIndex = i;
      updateActive();
    });

    a.addEventListener('click', () => {
      selectResult(item);
    });

    holder.appendChild(a);
  });
}

/* ============================================================
   Highlight snippet
   ============================================================ */
function highlightSnippet(item, rawQuery) {
  const source = item.description || item.title || '';
  const tokens = normalize(rawQuery).split(/\s+/).filter(t => t.length >= 2);
  if (!tokens.length || !source) {
    return escapeHtml(source.slice(0, 120));
  }

  // پیدا کردن اولین تطابق
  const sourceNorm = normalize(source);
  let pos = -1;
  for (const t of tokens) {
    const p = sourceNorm.indexOf(t);
    if (p !== -1 && (pos === -1 || p < pos)) pos = p;
  }

  const start = Math.max(0, pos - 40);
  const end = Math.min(source.length, (pos === -1 ? 0 : pos) + 90);
  let snippet = source.slice(start, end);
  if (start > 0) snippet = '…' + snippet;
  if (end < source.length) snippet = snippet + '…';

  let safe = escapeHtml(snippet);

  // هایلایت هر توکن
  for (const t of tokens) {
    // برای فارسی، فقط حروف مطابق
    const pattern = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      const re = new RegExp(`(${pattern})`, 'gi');
      safe = safe.replace(re, '<mark>$1</mark>');
    } catch {
      // نادیده بگیر
    }
  }

  return safe;
}

/* ============================================================
   Keyboard nav
   ============================================================ */
function moveActive(delta) {
  if (!currentResults.length) return;
  activeIndex = (activeIndex + delta + currentResults.length) % currentResults.length;
  updateActive();
}

function updateActive() {
  const items = $$('.sr-item', $('#searchResults'));
  items.forEach((el, i) => {
    el.classList.toggle('active', i === activeIndex);
  });
  items[activeIndex]?.scrollIntoView({ block: 'nearest' });
}

function selectResult(item, onSelect) {
  closeSearch();
  const input = $('#searchInput');
  if (input) {
    input.value = '';
    input.blur();
  }
  if (typeof onSelect === 'function') {
    onSelect(item);
  } else {
    location.hash = item.hash;
  }
}

function closeSearch() {
  const results = $('#searchResults');
  const input = $('#searchInput');
  if (results) {
    results.classList.remove('open');
    results.innerHTML = '';
  }
  input?.setAttribute('aria-expanded', 'false');
  activeIndex = -1;
  currentResults = [];
}

/* ============================================================
   Public API
   ============================================================ */
export function search(query) {
  runSearch(query);
}

export function close() {
  closeSearch();
}