/* ============================================================
   DRF فارسی — Utilities
   توابع کمکی مشترک برای همه ماژول‌ها
   ============================================================ */

/* ---------- DOM ---------- */
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value !== null && value !== undefined && value !== false) {
      node.setAttribute(key, value === true ? '' : value);
    }
  }
  const append = (c) => {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) c.forEach(append);
    else if (typeof c === 'string' || typeof c === 'number') {
      node.appendChild(document.createTextNode(String(c)));
    } else {
      node.appendChild(c);
    }
  };
  append(children);
  return node;
}

/* ---------- Persian digits ---------- */
const FA_DIGITS = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
export function toFa(input) {
  return String(input ?? '').replace(/\d/g, d => FA_DIGITS[+d]);
}

export function toEn(input) {
  return String(input ?? '')
    .replace(/[۰-۹]/g, d => FA_DIGITS.indexOf(d))
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}

/* ---------- Escape HTML ---------- */
export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------- Normalize Persian/Arabic for search ---------- */
export function normalize(str) {
  return String(str ?? '')
    .toLowerCase()
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ۀهٔ]/g, 'ه')
    .replace(/[أإآا]/g, 'ا')
    .replace(/[ؤو]/g, 'و')
    .replace(/[\u064B-\u0652\u0670]/g, '') // اعراب
    .replace(/[\u200c\u200f\u200e]/g, ' ') // نیم‌فاصله و کنترل‌ها
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---------- Slugify ---------- */
export function slugify(str) {
  return String(str ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/* ---------- Debounce & Throttle ---------- */
export function debounce(fn, wait = 200) {
  let t = null;
  return function debounced(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

export function throttle(fn, wait = 100) {
  let last = 0;
  let timer = null;
  return function throttled(...args) {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      clearTimeout(timer);
      timer = null;
      last = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

/* ---------- Safe localStorage wrapper ---------- */
export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  }
};

/* ---------- Fetch JSON with error handling ---------- */
export async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} — ${url}`);
  }
  return response.json();
}

/* ---------- Format time ---------- */
export function formatMinutes(minutes) {
  const n = Number(minutes) || 0;
  if (n < 60) return `${toFa(n)} دقیقه`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${toFa(h)} ساعت و ${toFa(m)} دقیقه` : `${toFa(h)} ساعت`;
}

/* ---------- Level labels ---------- */
export const LEVEL_LABELS = {
  beginner: { fa: 'مبتدی', stars: 1, color: 'level-beginner' },
  intermediate: { fa: 'متوسط', stars: 2, color: 'level-intermediate' },
  advanced: { fa: 'پیشرفته', stars: 3, color: 'level-advanced' },
  professional: { fa: 'حرفه‌ای', stars: 4, color: 'level-professional' }
};

export function levelStars(level) {
  return LEVEL_LABELS[level]?.stars ?? 1;
}

export function levelFa(level) {
  return LEVEL_LABELS[level]?.fa ?? level;
}

/* ---------- Copy to clipboard ---------- */
export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to fallback
    }
  }
  // Fallback
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  ta.style.pointerEvents = 'none';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

/* ---------- UUID (for toast IDs) ---------- */
export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ---------- Focus trap ---------- */
export function trapFocus(container) {
  const focusable = container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return () => {};
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handler(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  container.addEventListener('keydown', handler);
  return () => container.removeEventListener('keydown', handler);
}

/* ---------- Toast ---------- */
let toastContainer = null;

export function toast(message, variant = 'info', duration = 3000) {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const node = document.createElement('div');
  node.className = `toast ${variant}`;
  node.setAttribute('role', 'status');
  node.textContent = message;
  toastContainer.appendChild(node);

  const remove = () => {
    node.classList.add('leaving');
    setTimeout(() => node.remove(), 220);
  };

  const timer = setTimeout(remove, duration);

  node.addEventListener('click', () => {
    clearTimeout(timer);
    remove();
  });

  return { node, dismiss: remove };
}

/* ---------- Download file (for "export progress") ---------- */
export function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- Group array by key ---------- */
export function groupBy(arr, keyFn) {
  const out = new Map();
  for (const item of arr) {
    const key = keyFn(item);
    if (!out.has(key)) out.set(key, []);
    out.get(key).push(item);
  }
  return out;
}

/* ---------- Simple deep clone (JSON-safe) ---------- */
export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* ---------- Range ---------- */
export function range(n) {
  return Array.from({ length: n }, (_, i) => i);
}

/* ---------- Check reduced motion ---------- */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}