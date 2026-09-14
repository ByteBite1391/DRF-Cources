/* ============================================================
   DRF فارسی — TOC & Breadcrumb
   ساخت فهرست درون‌فصل و مسیر ناوبری
   ============================================================ */

import { $, el, escapeHtml } from './utils.js';

/**
 * ساخت TOC خودکار از h2های داخل فصل جاری
 */
export function buildChapterToc(chapterRoot) {
  const holder = $('#chapterToc');
  if (!holder) return;
  holder.innerHTML = '';

  if (!chapterRoot) return;

  const headings = chapterRoot.querySelectorAll('h2');
  if (!headings.length) return;

  const box = el('div', { class: 'toc' });
  box.appendChild(el('div', { class: 'toc-title' }, 'در این فصل'));

  const ol = el('ol');
  headings.forEach((h, i) => {
    if (!h.id) h.id = `section-${i}`;

    const li = el('li');
    const a = el('a', { href: '#' + h.id }, h.textContent);

    a.addEventListener('click', (e) => {
      e.preventDefault();
      h.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // به‌روزرسانی hash بدون پرش
      history.replaceState(null, '', '#' + location.hash.slice(1));
    });

    li.appendChild(a);
    ol.appendChild(li);
  });

  box.appendChild(ol);
  holder.appendChild(box);
}

/**
 * ساخت Breadcrumb برای صفحه جاری
 */
export function buildBreadcrumb({ items = [] } = {}) {
  const holder = $('#breadcrumb');
  if (!holder) return;
  holder.innerHTML = '';

  const parts = [
    { label: 'خانه', href: '#home' },
    ...items,
  ];

  parts.forEach((part, i) => {
    if (i > 0) {
      holder.appendChild(el('span', { class: 'sep' }, '/'));
    }

    if (part.href && i < parts.length - 1) {
      holder.appendChild(el('a', { href: part.href }, part.label));
    } else {
      holder.appendChild(el('span', { class: 'current' }, part.label));
    }
  });
}

/**
 * ساخت ناوبری فصل قبلی/بعدی
 */
export function buildChapterNav({ prev = null, next = null } = {}) {
  const holder = $('#chapterNav');
  if (!holder) return;
  holder.innerHTML = '';

  // دکمه قبلی
  const prevEl = el('a', {
    href: prev ? '#' + prev.hash : '#',
    class: prev ? '' : 'disabled',
  });
  prevEl.appendChild(el('span', { class: 'lbl' }, '← قبلی'));
  prevEl.appendChild(el('span', { class: 'ttl' }, prev?.title || '—'));
  holder.appendChild(prevEl);

  // دکمه بعدی
  const nextEl = el('a', {
    href: next ? '#' + next.hash : '#',
    class: 'next' + (next ? '' : ' disabled'),
  });
  nextEl.appendChild(el('span', { class: 'lbl' }, 'بعدی →'));
  nextEl.appendChild(el('span', { class: 'ttl' }, next?.title || '—'));
  holder.appendChild(nextEl);
}

/**
 * ساخت دکمه "علامت‌گذاری به‌عنوان خوانده‌شده"
 */
export function buildMarkDone({ chapterId, isDone, onToggle }) {
  const holder = $('#markDone');
  if (!holder) return;
  holder.innerHTML = '';

  if (!chapterId || chapterId === 'ch-000') return;

  const btn = el('button', {
    type: 'button',
    class: 'btn ' + (isDone ? '' : 'ghost'),
  });
  btn.textContent = isDone
    ? '✓ این فصل خوانده شده'
    : 'علامت‌گذاری به‌عنوان خوانده‌شده';

  btn.addEventListener('click', () => {
    onToggle(!isDone);
  });

  holder.appendChild(btn);
}

/**
 * پاک‌کردن همه اجزای ناوبری (هنگام تغییر فصل)
 */
export function clearNavigation() {
  ['#chapterToc', '#breadcrumb', '#chapterNav', '#markDone'].forEach(sel => {
    const el = $(sel);
    if (el) el.innerHTML = '';
  });
}