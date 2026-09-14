/* ============================================================
   DRF فارسی — Router
   مسیریابی hash-based
   فرمت‌های پشتیبانی‌شده:
     #home
     #chapter/serialization  یا  #chapter/ch-013
     #lab/01-first-api
     #project/01-todo-api
     #cheatsheet/http
     #faq
     #exam
     #resources
     #cheatsheets
     #search?q=...
   ============================================================ */

import { loadManifest, loadChapter, findInManifest, getSiblings, prefetch } from './loader.js';
import { renderChapter } from './renderer.js';
import { clearNavigation, buildChapterToc, buildBreadcrumb, buildChapterNav, buildMarkDone } from './toc.js';
import { setActiveNav, closeMobileMenu } from './sidebar.js';
import { initExercises } from './exercise.js';
import { Progress } from './progress.js';
import { $, toast, toFa } from './utils.js';

let manifest = null;
let currentRoute = null;
let renderToken = 0;   // برای جلوگیری از race condition در بارگذاری‌های همزمان

/* ============================================================
   Init
   ============================================================ */
export async function initRouter() {
  manifest = await loadManifest();

  window.addEventListener('hashchange', () => {
    navigate(parseHash());
  });

  // رندر اولیه
  navigate(parseHash());
}

/* ============================================================
   Parse hash
   ============================================================ */
function parseHash() {
  let hash = location.hash.replace(/^#/, '');
  if (!hash) return { type: 'home' };

  // پشتیبانی از #search?q=...
  const [pathPart, queryPart] = hash.split('?');
  const parts = pathPart.split('/').filter(Boolean);
  const query = new URLSearchParams(queryPart || '');

  if (!parts.length) return { type: 'home' };

  const [first, ...rest] = parts;

  switch (first) {
    case 'home':
      return { type: 'home' };
    case 'chapter':
      return { type: 'chapter', idOrSlug: rest.join('/') };
    case 'lab':
      return { type: 'lab', idOrSlug: rest.join('/') };
    case 'project':
      return { type: 'project', idOrSlug: rest.join('/') };
    case 'cheatsheet':
      return { type: 'cheatsheet', idOrSlug: rest.join('/') };
    case 'cheatsheets':
      return { type: 'cheatsheets' };
    case 'faq':
      return { type: 'faq' };
    case 'exam':
      return { type: 'exam' };
    case 'resources':
      return { type: 'resources' };
    case 'search':
      return { type: 'search', q: query.get('q') || '' };
    default:
      // اگر مستقیم ch-013 یا serialization بود، به‌عنوان chapter تلقی کن
      return { type: 'chapter', idOrSlug: first };
  }
}

/* ============================================================
   Navigate
   ============================================================ */
export async function navigate(route) {
  currentRoute = route;

  try {
    switch (route.type) {
      case 'home':
        await renderHome();
        break;
      case 'chapter':
        await renderChapterRoute(route.idOrSlug);
        break;
      case 'lab':
        await renderTypedRoute('lab', route.idOrSlug);
        break;
      case 'project':
        await renderTypedRoute('project', route.idOrSlug);
        break;
      case 'cheatsheet':
        await renderTypedRoute('cheatsheet', route.idOrSlug);
        break;
      case 'cheatsheets':
        await renderCheatsheetsIndex();
        break;
      case 'faq':
        await renderFAQ();
        break;
      case 'exam':
        await renderExam();
        break;
      case 'resources':
        await renderResources();
        break;
      case 'search':
        await renderHome();
        // اجرای جستجو در صورت نیاز
        window.dispatchEvent(new CustomEvent('search:query', { detail: { q: route.q } }));
        break;
      default:
        await renderHome();
    }
  } catch (err) {
    console.error('Router error:', err);
    renderError(err.message || 'خطای نامشخص');
  }
}

/* ============================================================
   Home
   ============================================================ */
async function renderHome() {
  const token = ++renderToken;
  clearNavigation();

  // اگر خانه در manifest بود، از آن استفاده کن
  const homeItem = findInManifest(manifest, 'ch-000', 'chapters')
    || findInManifest(manifest, 'home', 'chapters');

  if (homeItem?.file) {
    const chapter = await loadChapter(homeItem.file);
    if (token !== renderToken) return;
    renderHomeContent(chapter);
  } else {
    renderHomeFallback();
  }

  Progress.visit('ch-000');
  setActiveNav('home');
  buildBreadcrumb({ items: [{ label: 'خانه' }] });
  updateDocumentTitle('خانه');
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderHomeContent(chapter) {
  const body = $('#chapterBody');
  if (!body) return;
  body.innerHTML = '';
  body.appendChild(renderChapter(chapter, manifest));
  initExercises(body);
}

function renderHomeFallback() {
  const body = $('#chapterBody');
  if (!body) return;
  body.innerHTML = `
    <header class="chapter-head">
      <span class="chapter-kicker">DRF فارسی</span>
      <h1>پلتفرم آموزشی Django REST Framework</h1>
      <p class="chapter-lead">
        برای شروع، از منوی کنار یک فصل را انتخاب کنید یا از جستجو استفاده کنید.
      </p>
    </header>
  `;
}

/* ============================================================
   Chapter route
   ============================================================ */
async function renderChapterRoute(idOrSlug) {
  const chapterMeta = findInManifest(manifest, idOrSlug, 'chapters')
    || (manifest.chapters || []).find(c => c.id === idOrSlug);

  if (!chapterMeta) {
    return renderNotFound(`فصل «${idOrSlug}» پیدا نشد.`);
  }

  if (!chapterMeta.file) {
    return renderNotFound(`فایل فصل «${chapterMeta.title}» تعریف نشده است.`);
  }

  const token = ++renderToken;
  showLoading();

  let chapter;
  try {
    chapter = await loadChapter(chapterMeta.file);
  } catch (err) {
    if (token !== renderToken) return;
    return renderError(`بارگذاری فصل ناموفق بود: ${err.message}`);
  }

  if (token !== renderToken) return;

  clearNavigation();

  const body = $('#chapterBody');
  body.innerHTML = '';
  body.appendChild(renderChapter(chapter, manifest));

  initExercises(body);

  // TOC
  buildChapterToc(body);

  // Breadcrumb
  buildBreadcrumb({
    items: [
      { label: 'خانه', href: '#home' },
      { label: chapterMeta.title || 'فصل' },
    ],
  });

  // ناوبری قبلی/بعدی
  const chapters = manifest.chapters || [];
  const siblings = getSiblings(chapters, chapterMeta.id);
  buildChapterNav({
    prev: siblings.prev ? {
      title: siblings.prev.title,
      hash: `chapter/${siblings.prev.slug || siblings.prev.id}`,
    } : null,
    next: siblings.next ? {
      title: siblings.next.title,
      hash: `chapter/${siblings.next.slug || siblings.next.id}`,
    } : null,
  });

  // دکمه علامت‌گذاری
  const isDone = Progress.isChapterDone(chapterMeta.id);
  buildMarkDone({
    chapterId: chapterMeta.id,
    isDone,
    onToggle: (next) => {
      Progress.markChapterDone(chapterMeta.id, next);
      buildMarkDone({
        chapterId: chapterMeta.id,
        isDone: next,
        onToggle: arguments.callee,
      });
      // بازسازی دکمه به روش تمیزتر
      rebuildMarkDone(chapterMeta.id);
    },
  });

  // پیش‌بارگذاری فصل بعدی
  if (siblings.next?.file) {
    prefetch(siblings.next.file);
  }

  // Active nav
  setActiveNav(chapterMeta.slug || chapterMeta.id);
  Progress.visit(chapterMeta.id);
  updateDocumentTitle(chapterMeta.title);
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function rebuildMarkDone(chapterId) {
  const isDone = Progress.isChapterDone(chapterId);
  buildMarkDone({
    chapterId,
    isDone,
    onToggle: (next) => {
      Progress.markChapterDone(chapterId, next);
      rebuildMarkDone(chapterId);
    },
  });
}

/* ============================================================
   Typed routes (lab, project, cheatsheet)
   ============================================================ */
async function renderTypedRoute(type, idOrSlug) {
  const manifestKey = type === 'lab' ? 'labs'
    : type === 'project' ? 'projects'
    : type === 'cheatsheet' ? 'cheatsheets'
    : null;

  if (!manifestKey) return renderNotFound('نوع محتوا پشتیبانی نمی‌شود.');

  const itemMeta = findInManifest(manifest, idOrSlug, manifestKey)
    || (manifest[manifestKey] || []).find(c => c.id === idOrSlug);

  if (!itemMeta) {
    return renderNotFound(`آیتم «${idOrSlug}» پیدا نشد.`);
  }

  if (!itemMeta.file) {
    return renderNotFound(`فایل «${itemMeta.title}» تعریف نشده است.`);
  }

  const token = ++renderToken;
  showLoading();

  let item;
  try {
    item = await loadChapter(itemMeta.file);
  } catch (err) {
    if (token !== renderToken) return;
    return renderError(`بارگذاری ناموفق بود: ${err.message}`);
  }

  if (token !== renderToken) return;

  clearNavigation();

  const body = $('#chapterBody');
  body.innerHTML = '';
  body.appendChild(renderChapter(item, manifest));
  initExercises(body);

  buildChapterToc(body);

  const typeLabels = {
    lab: 'آزمایشگاه',
    project: 'پروژه',
    cheatsheet: 'چیت‌شیت',
  };

  buildBreadcrumb({
    items: [
      { label: 'خانه', href: '#home' },
      { label: typeLabels[type] || type },
      { label: itemMeta.title || '' },
    ],
  });

  setActiveNav(itemMeta.slug || itemMeta.id);
  Progress.visit(itemMeta.id);
  updateDocumentTitle(itemMeta.title);
  window.scrollTo({ top: 0, behavior: 'auto' });
}

/* ============================================================
   Index pages
   ============================================================ */
async function renderCheatsheetsIndex() {
  clearNavigation();
  const body = $('#chapterBody');
  const list = manifest.cheatsheets || [];

  body.innerHTML = `
    <header class="chapter-head">
      <span class="chapter-kicker">مرجع سریع</span>
      <h1>چیت‌شیت‌ها</h1>
      <p class="chapter-lead">مرجع سریع برای موضوعات پرکاربرد DRF.</p>
    </header>
    <div class="card-grid">
      ${list.map(item => `
        <a class="card hoverable" href="#cheatsheet/${item.slug || item.id}" style="text-decoration:none;color:inherit">
          <div class="card-title">${item.title}</div>
          <div class="card-sub">${item.description || ''}</div>
        </a>
      `).join('')}
    </div>
  `;

  buildBreadcrumb({ items: [{ label: 'خانه', href: '#home' }, { label: 'چیت‌شیت‌ها' }] });
  setActiveNav('');
  updateDocumentTitle('چیت‌شیت‌ها');
  window.scrollTo({ top: 0 });
}

async function renderFAQ() {
  clearNavigation();
  const body = $('#chapterBody');
  body.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>در حال بارگذاری…</p></div>`;

  try {
    const faqItem = manifest.faq;
    if (!faqItem?.file) {
      body.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><p>فایل FAQ تعریف نشده است.</p></div>`;
      return;
    }
    const data = await loadChapter(faqItem.file);
    body.innerHTML = '';
    body.appendChild(renderChapter(data, manifest));
    initExercises(body);
  } catch (err) {
    body.innerHTML = `<div class="error-state"><h2>خطا</h2><p>${err.message}</p></div>`;
    return;
  }

  buildBreadcrumb({ items: [{ label: 'خانه', href: '#home' }, { label: 'سوالات متداول' }] });
  updateDocumentTitle('سوالات متداول');
  window.scrollTo({ top: 0 });
}

async function renderExam() {
  clearNavigation();
  const body = $('#chapterBody');

  try {
    const examItem = manifest.exam;
    if (!examItem?.file) {
      body.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📝</div><p>فایل آزمون تعریف نشده است.</p></div>`;
      return;
    }
    const data = await loadChapter(examItem.file);
    body.innerHTML = '';
    body.appendChild(renderChapter(data, manifest));
    initExercises(body);
  } catch (err) {
    body.innerHTML = `<div class="error-state"><h2>خطا</h2><p>${err.message}</p></div>`;
    return;
  }

  buildBreadcrumb({ items: [{ label: 'خانه', href: '#home' }, { label: 'آزمون نهایی' }] });
  updateDocumentTitle('آزمون نهایی');
  window.scrollTo({ top: 0 });
}

async function renderResources() {
  clearNavigation();
  const body = $('#chapterBody');

  try {
    const resItem = manifest.resources;
    if (!resItem?.file) {
      body.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📚</div><p>فایل منابع تعریف نشده است.</p></div>`;
      return;
    }
    const data = await loadChapter(resItem.file);
    body.innerHTML = '';
    body.appendChild(renderChapter(data, manifest));
    initExercises(body);
  } catch (err) {
    body.innerHTML = `<div class="error-state"><h2>خطا</h2><p>${err.message}</p></div>`;
    return;
  }

  buildBreadcrumb({ items: [{ label: 'خانه', href: '#home' }, { label: 'منابع' }] });
  updateDocumentTitle('منابع');
  window.scrollTo({ top: 0 });
}

/* ============================================================
   Error / NotFound states
   ============================================================ */
function renderError(message) {
  const body = $('#chapterBody');
  if (!body) return;
  body.innerHTML = `
    <div class="error-state">
      <h2>خطا</h2>
      <p>${message}</p>
      <p><a href="#home" class="btn">بازگشت به خانه</a></p>
    </div>
  `;
}

function renderNotFound(message) {
  const body = $('#chapterBody');
  if (!body) return;
  body.innerHTML = `
    <div class="error-state">
      <h2>پیدا نشد</h2>
      <p>${message}</p>
      <p><a href="#home" class="btn">بازگشت به خانه</a></p>
    </div>
  `;
}

function showLoading() {
  const body = $('#chapterBody');
  if (!body) return;
  body.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>در حال بارگذاری…</p></div>`;
}

/* ============================================================
   Document title
   ============================================================ */
function updateDocumentTitle(title) {
  document.title = `${title} | DRF فارسی`;
}

/* ============================================================
   Public helpers
   ============================================================ */
export function go(hash) {
  location.hash = hash;
}

export function current() {
  return currentRoute;
}

export function getManifest() {
  return manifest;
}