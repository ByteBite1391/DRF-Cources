/* ============================================================
   DRF فارسی — Exercise Manager
   ذخیره وضعیت باز/بسته و تکمیل‌شده تمرین‌ها
   ============================================================ */

import { storage, $, $$, toast } from './utils.js';

const STORAGE_KEY = 'drf-fa-exercises-v1';

let state = {};

function load() {
  state = storage.get(STORAGE_KEY, {}) || {};
}

function save() {
  storage.set(STORAGE_KEY, state);
}

/**
 * ذخیره وضعیت یک تمرین خاص
 * @param {string} exerciseId - شناسه یکتا مثل "ch-013-ex1"
 * @param {object} data - { open: bool, solved: bool }
 */
function setState(exerciseId, data) {
  state[exerciseId] = { ...state[exerciseId], ...data, updatedAt: Date.now() };
  save();
}

function getState(exerciseId) {
  return state[exerciseId] || null;
}

/**
 * راه‌اندازی: بازیابی وضعیت قبلی روی همه تمرین‌های موجود در DOM
 */
export function initExercises(root = document) {
  load();

  $$('details.exercise', root).forEach((details, index) => {
    const id = details.dataset.exerciseId || computeId(details, index);
    details.dataset.exerciseId = id;

    // بازیابی وضعیت باز/بسته
    const saved = getState(id);
    if (saved?.open) {
      details.open = true;
    }

    // ذخیره هنگام تغییر
    details.addEventListener('toggle', () => {
      const current = getState(id) || {};
      setState(id, { ...current, open: details.open });
    });

    // دکمه "حل شد" (اختیاری)
    attachSolvedButton(details, id);
  });
}

function computeId(details, index) {
  // استفاده از summary به‌عنوان نام پایه
  const summary = details.querySelector('summary');
  const text = summary?.textContent?.trim() || `exercise-${index}`;
  const slug = text
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]/g, '')
    .slice(0, 40);
  const chapter = $('.chapter.active')?.id || 'ch';
  return `${chapter}-${slug || index}`;
}

function attachSolvedButton(details, id) {
  const body = details.querySelector('.exercise-body');
  if (!body) return;

  // جلوگیری از تکرار دکمه
  if (body.querySelector('.exercise-solved-btn')) return;

  const wrap = document.createElement('div');
  wrap.className = 'exercise-actions';
  wrap.style.marginTop = '12px';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn ghost small exercise-solved-btn';

  const current = getState(id);
  btn.textContent = current?.solved ? '✓ حل شده' : 'علامت‌گذاری به‌عنوان حل‌شده';

  btn.addEventListener('click', () => {
    const s = getState(id) || {};
    const nextSolved = !s.solved;
    setState(id, { ...s, solved: nextSolved });
    btn.textContent = nextSolved ? '✓ حل شده' : 'علامت‌گذاری به‌عنوان حل‌شده';
    btn.classList.toggle('solved', nextSolved);

    if (nextSolved) {
      toast('تمرین حل‌شده ثبت شد', 'success', 1500);
    }
  });

  wrap.appendChild(btn);
  body.appendChild(wrap);
}

/**
 * بازنشانی همه وضعیت تمرین‌ها
 */
export function resetExercises() {
  state = {};
  save();
}

/**
 * آمار تمرین‌های حل‌شده
 */
export function getExerciseStats() {
  const entries = Object.values(state);
  const total = entries.length;
  const solved = entries.filter(e => e.solved).length;
  return { total, solved };
}