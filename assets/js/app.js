/* ============================================================
   DRF فارسی — App Entry
   نقطه ورود برنامه: اتصال همه ماژول‌ها
   ============================================================ */

import { $, $$, toast, prefersReducedMotion } from './utils.js';
import { Theme } from './theme.js';
import { Progress } from './progress.js';
import { loadManifest } from './loader.js';
import { initSearch } from './search.js';
import { initRouter, go } from './router.js';
import { initSidebar, setActiveNav, closeMobileMenu, bindSidebarFooterLinks } from './sidebar.js';
import { initQuizManager } from './quiz.js';
import { initExercises, resetExercises } from './exercise.js';

/* ============================================================
   Global state
   ============================================================ */
const app = {
  manifest: null,
  booted: false,
};

/* ============================================================
   Bootstrap
   ============================================================ */
async function bootstrap() {
  try {
    // ۱. تم — قبل از هر چیز برای جلوگیری از فلش
    Theme.init();

    // ۲. بارگذاری manifest
    app.manifest = await loadManifest();

    // ۳. Progress
    Progress.init(app.manifest);

    // ۴. Sidebar
    initSidebar(app.manifest, {
      onNavigate: (hash) => {
        go(hash);
      },
    });
    bindSidebarFooterLinks((hash) => go(hash));

    // ۵. Search
    initSearch(app.manifest, {
      onSelect: (item) => {
        go(item.hash);
      },
    });

    // ۶. Quiz manager
    initQuizManager();

    // ۷. Router (شامل رندر اولیه)
    await initRouter();

    // ۸. UI عمومی
    initScrollUi();
    initKeyboardShortcuts();
    initThemeEvents();
    initProgressEvents();
    initExternalLinkSafety();

    app.booted = true;
    console.info('[DRF فارسی] با موفقیت بارگذاری شد.');
  } catch (err) {
    console.error('Bootstrap error:', err);
    renderFatalError(err);
  }
}

/* ============================================================
   Scroll UI: Progress bar + Back-to-top
   ============================================================ */
function initScrollUi() {
  const progressBar = $('#progressBar');
  const toTop = $('#toTop');

  const update = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const percent = height > 0 ? Math.min(100, (scrollTop / height) * 100) : 0;
    if (progressBar) progressBar.style.width = percent + '%';
    if (toTop) toTop.classList.toggle('show', scrollTop > 420);
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);

  toTop?.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  });

  update();
}

/* ============================================================
   Keyboard shortcuts
   ============================================================ */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName;
    const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;

    // Escape: بستن overlay/modal
    if (e.key === 'Escape') {
      closeMobileMenu();
      Progress.closeModal();
    }

    // اگر در حال تایپ هستیم، بقیه shortcutها را نادیده بگیر
    if (isTyping) return;

    // 'g h' → home
    if (e.key === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (lastKeyWas('g', 800)) {
        go('home');
      }
    }

    // '/' → focus search
    if (e.key === '/') {
      e.preventDefault();
      $('#searchInput')?.focus();
    }

    // 't' → toggle theme
    if (e.key === 't' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      Theme.cycle();
    }
  });

  // ردیابی کلیدهای قبلی برای ترکیب‌های دو کلیدی
  let lastKey = { key: '', time: 0 };
  document.addEventListener('keydown', (e) => {
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
    lastKey = { key: e.key, time: Date.now() };
  });

  function lastKeyWas(key, windowMs) {
    // بررسی می‌کنیم که کلید قبلی 'g' بوده و در بازه زمانی مشخص
    // نکته: چون این تابع بعد از ثبت lastKey صدا زده می‌شود،
    // از یک متغیر جداگانه استفاده می‌کنیم
    return prevKey.key === key && (Date.now() - prevKey.time) < windowMs;
  }

  // نگهداری کلید قبلی جداگانه برای ترکیب 'g h'
  let prevKey = { key: '', time: 0 };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (prevKey.key === 'g' && (Date.now() - prevKey.time) < 800) {
        go('home');
      }
    }
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
    prevKey = { key: e.key, time: Date.now() };
  });
}

/* ============================================================
   Theme events
   ============================================================ */
function initThemeEvents() {
  window.addEventListener('theme:changed', (e) => {
    const { label } = e.detail || {};
    if (label) toast(label, 'info', 1400);
  });
}

/* ============================================================
   Progress events
   ============================================================ */
function initProgressEvents() {
  window.addEventListener('progress:changed', () => {
    // هر چیزی که به Progress وابسته است، توسط خود ماژول‌ها به‌روز می‌شود
    // اینجا فقط یک رویداد عمومی می‌فرستیم
  });

  // گوش دادن به event کوییز
  window.addEventListener('quiz:answered', () => {
    // ثبت در quiz.js انجام می‌شود
  });
}

/* ============================================================
   External links safety
   ============================================================ */
function initExternalLinkSafety() {
  $$('a[target="_blank"]').forEach(a => {
    if (!a.rel) a.rel = 'noopener noreferrer';
  });
}

/* ============================================================
   Fatal error
   ============================================================ */
function renderFatalError(err) {
  const body = $('#chapterBody');
  if (!body) return;
  body.innerHTML = `
    <div class="error-state">
      <h2>خطای راه‌اندازی</h2>
      <p>${err.message || 'خطای نامشخص'}</p>
      <p>لطفاً کنسول مرورگر را برای جزئیات بررسی کنید.</p>
      <pre><code>${String(err.stack || err).replace(/</g, '&lt;')}</code></pre>
    </div>
  `;
}

/* ============================================================
   Go!
   ============================================================ */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

/* ============================================================
   Expose برای دیباگ در کنسول (اختیاری)
   ============================================================ */
window.__DRF_FA__ = {
  app,
  go,
  get manifest() { return app.manifest; },
  get progress() { return Progress.state; },
  resetProgress: () => Progress.reset(),
  resetExercises: () => resetExercises(),
};