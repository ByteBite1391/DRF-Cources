/* ============================================================
   DRF فارسی — Loader
   بارگذاری manifest و فصل‌ها با cache و پیش‌بارگذاری
   ============================================================ */

import { fetchJSON } from './utils.js';

const MANIFEST_URL = 'content/manifest.json';

/* Cache درون‌حافظه */
const cache = new Map();

/* یک Promise مشترک برای manifest تا چند بار fetch نشود */
let manifestPromise = null;

/**
 * بارگذاری manifest (فقط یک بار)
 */
export function loadManifest() {
  if (!manifestPromise) {
    manifestPromise = fetchJSON(MANIFEST_URL).catch(err => {
      manifestPromise = null;
      throw new Error(`بارگذاری manifest ناموفق بود: ${err.message}`);
    });
  }
  return manifestPromise;
}

/**
 * بارگذاری یک فصل با cache
 * @param {string} file - مسیر نسبی فایل JSON
 */
export async function loadChapter(file) {
  if (cache.has(file)) return cache.get(file);

  const promise = fetchJSON(file)
    .then(data => {
      cache.set(file, data);
      return data;
    })
    .catch(err => {
      cache.delete(file);
      throw new Error(`بارگذاری فصل ناموفق بود: ${file} — ${err.message}`);
    });

  cache.set(file, promise);
  return promise;
}

/**
 * بارگذاری هر نوع محتوایی که فیلد `file` دارد
 */
export async function loadResource(item) {
  if (!item || !item.file) {
    throw new Error('منبع نامعتبر: فیلد file وجود ندارد');
  }
  return loadChapter(item.file);
}

/**
 * پیش‌بارگذاری یک فصل (بدون انتظار)
 * برای فصل بعدی در ناوبری استفاده می‌شود
 */
export function prefetch(file) {
  if (!file || cache.has(file)) return;
  // اجرا در پس‌زمینه، خطا را نادیده بگیر
  loadChapter(file).catch(() => {});
}

/**
 * پاک‌کردن cache (برای بازنشانی/توسعه)
 */
export function clearCache() {
  cache.clear();
  manifestPromise = null;
}

/**
 * پیدا کردن آیتم manifest بر اساس id یا slug
 * @param {object} manifest
 * @param {string} idOrSlug - مثل "ch-013" یا "serialization"
 * @param {string} type - "chapters" | "labs" | "projects" | ...
 */
export function findInManifest(manifest, idOrSlug, type = 'chapters') {
  const list = manifest[type] || [];
  return list.find(item =>
    item.id === idOrSlug || item.slug === idOrSlug
  );
}

/**
 * برگرداندن آیتم قبلی و بعدی از یک لیست
 */
export function getSiblings(list, currentId) {
  const idx = list.findIndex(item => item.id === currentId);
  return {
    index: idx,
    prev: idx > 0 ? list[idx - 1] : null,
    next: idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null,
  };
}