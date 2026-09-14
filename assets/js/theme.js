/* ============================================================
   DRF فارسی — Theme Manager
   مدیریت سه حالت: dark / light / system
   ============================================================ */

import { $, storage } from './utils.js';

const STORAGE_KEY = 'drf-fa-theme';
const VALID = ['dark', 'light', 'system'];

let currentPreference = 'system';
let systemMedia = null;

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(resolved) {
  const html = document.documentElement;

  // جلوگیری از انتقال‌های ناخواسته هنگام تغییر تم
  html.classList.add('theme-switching');
  html.setAttribute('data-theme', resolved);

  // به‌روزرسانی آیکون دکمه تم
  const btn = $('#themeBtn');
  if (btn) {
    const icon = resolved === 'dark' ? '🌙' : '☀️';
    btn.textContent = icon;
    btn.title = currentPreference === 'system'
      ? `تم: سیستم (${resolved === 'dark' ? 'تیره' : 'روشن'})`
      : `تم: ${resolved === 'dark' ? 'تیره' : 'روشن'}`;
  }

  // حذف کلاس پس از یک فریم
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      html.classList.remove('theme-switching');
    });
  });
}

function resolve(preference) {
  if (preference === 'system') return getSystemTheme();
  return preference;
}

function setPreference(preference) {
  if (!VALID.includes(preference)) preference = 'system';
  currentPreference = preference;
  storage.set(STORAGE_KEY, preference);
  applyTheme(resolve(preference));
}

function cycle() {
  // dark → light → system → dark
  const order = ['dark', 'light', 'system'];
  const idx = order.indexOf(currentPreference);
  const next = order[(idx + 1) % order.length];
  setPreference(next);
  const label = next === 'system'
    ? 'تم: سیستم'
    : next === 'dark' ? 'تم: تیره' : 'تم: روشن';
  // اعلان کوتاه (اختیاری، توسط app مدیریت می‌شود)
  window.dispatchEvent(new CustomEvent('theme:changed', {
    detail: { preference: next, resolved: resolve(next), label }
  }));
}

function init() {
  // خواندن ترجیح ذخیره‌شده
  const saved = storage.get(STORAGE_KEY, 'system');
  currentPreference = VALID.includes(saved) ? saved : 'system';

  // اعمال اولیه قبل از هر چیز (برای جلوگیری از فلش)
  applyTheme(resolve(currentPreference));

  // گوش دادن به تغییرات سیستم
  systemMedia = window.matchMedia('(prefers-color-scheme: light)');
  const onSystemChange = () => {
    if (currentPreference === 'system') {
      applyTheme(getSystemTheme());
    }
  };

  if (systemMedia.addEventListener) {
    systemMedia.addEventListener('change', onSystemChange);
  } else if (systemMedia.addListener) {
    // Safari قدیمی
    systemMedia.addListener(onSystemChange);
  }

  // دکمه تغییر تم
  const btn = $('#themeBtn');
  if (btn) {
    btn.addEventListener('click', cycle);
  }
}

export const Theme = {
  init,
  get preference() {
    return currentPreference;
  },
  get resolved() {
    return resolve(currentPreference);
  },
  set: setPreference,
  cycle,
};