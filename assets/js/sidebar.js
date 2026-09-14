/* ============================================================
   DRF فارسی — Sidebar
   ساخت منوی کنار از manifest + گروه‌بندی Learning Path
   ============================================================ */

import { $, $$, el, toFa, levelFa, LEVEL_LABELS, normalize } from './utils.js';
import { Progress } from './progress.js';

let manifestRef = null;
let navListRef = null;
let onNavigate = null;

/* ============================================================
   Init
   ============================================================ */
export function initSidebar(manifest, { onNavigate: cb } = {}) {
  manifestRef = manifest;
  navListRef = $('#navList');
  onNavigate = cb || (() => {});
  if (!navListRef) return;

  renderNav();

  // منوی موبایل
  initMobileMenu();

  // واکنش به تغییر Progress (برای بروزرسانی علامت‌ها)
  window.addEventListener('progress:changed', () => updateChecks());
}

/* ============================================================
   Render
   ============================================================ */
function renderNav() {
  if (!navListRef || !manifestRef) return;
  navListRef.innerHTML = '';

  const chapters = manifestRef.chapters || [];

  // گروه‌بندی بر اساس Learning Path اگر وجود داشت
  const path = manifestRef.learningPath;
  if (Array.isArray(path) && path.length) {
    const grouped = new Set();
    for (const stage of path) {
      const stageChapters = (stage.chapters || [])
        .map(id => chapters.find(c => c.id === id))
        .filter(Boolean);
      if (!stageChapters.length) continue;
      stageChapters.forEach(c => grouped.add(c.id));

      navListRef.appendChild(el('div', { class: 'nav-group-title' },
        `مرحله ${toFa(stage.stage)} — ${stage.title}`));

      for (const ch of stageChapters) {
        navListRef.appendChild(buildNavLink(ch));
      }
    }

    // فصل‌هایی که در path نبودند
    const remaining = chapters.filter(c => !grouped.has(c.id));
    if (remaining.length) {
      navListRef.appendChild(el('div', { class: 'nav-group-title' }, 'فصل‌های دیگر'));
      remaining.forEach(ch => navListRef.appendChild(buildNavLink(ch)));
    }
  } else {
    // بدون Learning Path: لیست ساده
    chapters.forEach(ch => navListRef.appendChild(buildNavLink(ch)));
  }

  // لینک‌های اضافه (Labs و Projects و ...)
  const extras = [
    { label: 'آزمایشگاه‌ها', items: manifestRef.labs || [], prefix: '#lab/' },
    { label: 'پروژه‌ها', items: manifestRef.projects || [], prefix: '#project/' },
  ].filter(x => x.items.length);

  if (extras.length) {
    navListRef.appendChild(el('div', { class: 'nav-group-title' }, 'تمرین عملی'));
    for (const group of extras) {
      for (const item of group.items) {
        navListRef.appendChild(buildNavLink({
          id: item.id,
          slug: item.slug,
          title: item.title,
          level: item.level,
          hash: group.prefix + (item.slug || item.id),
          isExtra: true,
          groupLabel: group.label,
        }));
      }
    }
  }

  updateChecks();
}

function buildNavLink(chapter) {
  const a = el('a', {
    class: 'nav-link',
    href: '#' + (chapter.hash || chapter.slug || chapter.id),
    'data-target': chapter.id,
    'data-hash': chapter.hash || chapter.slug || chapter.id,
  });

  // شماره
  const numText = chapter.id?.startsWith('ch-')
    ? toFa(parseInt(chapter.id.split('-')[1], 10) || 0)
    : chapter.id?.split('-')[1] || '•';
  a.appendChild(el('span', { class: 'nav-num' }, numText));

  // عنوان
  a.appendChild(el('span', { class: 'nav-title' }, chapter.title || ''));

  // سطح
  if (chapter.level && LEVEL_LABELS[chapter.level]) {
    const stars = '⭐'.repeat(LEVEL_LABELS[chapter.level].stars);
    a.appendChild(el('span', {
      class: 'nav-level',
      title: levelFa(chapter.level),
    }, stars));
  }

  // تیک خوانده‌شده
  a.appendChild(el('span', { class: 'nav-check' }, '✓'));

  a.addEventListener('click', (e) => {
    e.preventDefault();
    onNavigate(chapter.hash || chapter.slug || chapter.id);
    closeMobileMenu();
  });

  return a;
}

/* ============================================================
   Update checks
   ============================================================ */
function updateChecks() {
  if (!navListRef) return;
  const state = Progress.state;
  if (!state) return;

  const doneChapters = new Set(state.completedChapters);
  const doneLabs = new Set(state.completedLabs);
  const doneProjects = new Set(state.completedProjects);

  $$('.nav-link', navListRef).forEach(link => {
    const id = link.dataset.target;
    if (!id) return;

    let done = false;
    if (id.startsWith('ch-')) done = doneChapters.has(id);
    else if (id.startsWith('lab-')) done = doneLabs.has(id);
    else if (id.startsWith('project-')) done = doneProjects.has(id);

    link.classList.toggle('done', done);
  });
}

/* ============================================================
   Active state
   ============================================================ */
export function setActiveNav(hash) {
  if (!navListRef) return;
  $$('.nav-link', navListRef).forEach(link => {
    link.classList.toggle('active', link.dataset.hash === hash);
  });

  // اسکرول کردن لینک فعال به دید
  const active = navListRef.querySelector('.nav-link.active');
  if (active) {
    active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

/* ============================================================
   Mobile menu
   ============================================================ */
function initMobileMenu() {
  const menuBtn = $('#menuBtn');
  const overlay = $('#overlay');
  const sidebar = $('#sidebar');

  if (!menuBtn || !sidebar) return;

  const toggle = (open) => {
    sidebar.classList.toggle('open', open);
    overlay?.classList.toggle('show', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };

  menuBtn.addEventListener('click', () => {
    const isOpen = sidebar.classList.contains('open');
    toggle(!isOpen);
  });

  overlay?.addEventListener('click', () => toggle(false));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggle(false);
  });

  // بستن با تغییر اندازه به دسکتاپ
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) toggle(false);
  });
}

export function closeMobileMenu() {
  const sidebar = $('#sidebar');
  const overlay = $('#overlay');
  const menuBtn = $('#menuBtn');
  sidebar?.classList.remove('open');
  overlay?.classList.remove('show');
  menuBtn?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

/* ============================================================
   Sidebar footer links
   ============================================================ */
export function bindSidebarFooterLinks(navigate) {
  $$('.sidebar-footer .sidebar-link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(href.slice(1));
      closeMobileMenu();
    });
  });
}