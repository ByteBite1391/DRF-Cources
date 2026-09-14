/* ============================================================
   DRF فارسی — Progress Manager
   ذخیره و بازیابی پیشرفت کاربر در localStorage
   ============================================================ */

import { storage, toFa, formatMinutes, $, toast, downloadJSON, LEVEL_LABELS } from './utils.js';

const STORAGE_KEY = 'drf-fa-progress-v1';
const SCHEMA_VERSION = 1;

let state = null;
let manifest = null;

/* ---------- State shape ----------
{
  version: 1,
  completedChapters: ["ch-001", "ch-002"],
  completedLabs: ["lab-01"],
  completedProjects: ["project-01"],
  quizScores: { "ch-001": { correct: 3, total: 3 } },
  examScore: null,
  lastVisited: "ch-003",
  startedAt: "2025-01-15T...",
  updatedAt: "2025-01-15T..."
}
----------------------------------- */

function emptyState() {
  const now = new Date().toISOString();
  return {
    version: SCHEMA_VERSION,
    completedChapters: [],
    completedLabs: [],
    completedProjects: [],
    quizScores: {},
    examScore: null,
    lastVisited: null,
    startedAt: now,
    updatedAt: now,
  };
}

function load() {
  const raw = storage.get(STORAGE_KEY, null);
  if (!raw || typeof raw !== 'object') return emptyState();
  // مهاجرت نسخه در آینده اینجا انجام می‌شود
  if (raw.version !== SCHEMA_VERSION) return emptyState();
  return {
    ...emptyState(),
    ...raw,
  };
}

function save() {
  state.updatedAt = new Date().toISOString();
  storage.set(STORAGE_KEY, state);
}

function persistAndNotify() {
  save();
  window.dispatchEvent(new CustomEvent('progress:changed', { detail: { state } }));
}

/* ---------- Init ---------- */
function init(loadedManifest) {
  manifest = loadedManifest;
  state = load();

  // دکمه بازنشانی
  const resetBtn = $('#resetProgressBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('آیا مطمئن هستید که می‌خواهید تمام پیشرفت خود را بازنشانی کنید؟')) {
        reset();
      }
    });
  }

  // دکمه نمایش پیشرفت
  const progressBtn = $('#progressBtn');
  if (progressBtn) {
    progressBtn.addEventListener('click', openModal);
  }

  // بستن مودال
  document.querySelectorAll('#progressModal [data-close]').forEach(el => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  renderBadge();
}

/* ---------- Mark done / undone ---------- */
function markChapterDone(id, done = true) {
  const set = new Set(state.completedChapters);
  if (done) set.add(id);
  else set.delete(id);
  state.completedChapters = [...set];
  persistAndNotify();
  renderBadge();
}

function isChapterDone(id) {
  return state.completedChapters.includes(id);
}

function markLabDone(id, done = true) {
  const set = new Set(state.completedLabs);
  if (done) set.add(id);
  else set.delete(id);
  state.completedLabs = [...set];
  persistAndNotify();
}

function markProjectDone(id, done = true) {
  const set = new Set(state.completedProjects);
  if (done) set.add(id);
  else set.delete(id);
  state.completedProjects = [...set];
  persistAndNotify();
}

function recordQuiz(chapterId, correct, total) {
  const prev = state.quizScores[chapterId] || { correct: 0, total: 0 };
  state.quizScores[chapterId] = {
    correct: prev.correct + correct,
    total: prev.total + total,
  };
  persistAndNotify();
}

function setExamScore(score) {
  state.examScore = score;
  persistAndNotify();
}

function visit(id) {
  state.lastVisited = id;
  save(); // بدون notify برای جلوگیری از رندر مجدد
}

/* ---------- Badge in sidebar ---------- */
function renderBadge() {
  const badge = $('#doneBadge');
  if (!badge || !manifest) return;

  const total = (manifest.chapters || []).filter(c => c.id !== 'ch-000').length;
  const done = state.completedChapters.filter(id => id !== 'ch-000').length;
  badge.textContent = `${toFa(done)} / ${toFa(total)}`;
}

/* ---------- Overall percent ---------- */
function getOverallPercent() {
  if (!manifest) return 0;

  const chapters = (manifest.chapters || []).filter(c => c.id !== 'ch-000');
  const labs = manifest.labs || [];
  const projects = manifest.projects || [];

  const totalItems = chapters.length + labs.length + projects.length;
  if (totalItems === 0) return 0;

  const doneItems =
    state.completedChapters.filter(id => id !== 'ch-000').length +
    state.completedLabs.length +
    state.completedProjects.length;

  return Math.round((doneItems / totalItems) * 100);
}

function getChapterPercent() {
  if (!manifest) return 0;
  const chapters = (manifest.chapters || []).filter(c => c.id !== 'ch-000');
  if (!chapters.length) return 0;
  const done = state.completedChapters.filter(id => id !== 'ch-000').length;
  return Math.round((done / chapters.length) * 100);
}

/* ---------- Modal ---------- */
function openModal() {
  const modal = $('#progressModal');
  if (!modal) return;
  renderModalBody();
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  const closeBtn = modal.querySelector('[data-close]');
  if (closeBtn) closeBtn.focus();
}

function closeModal() {
  const modal = $('#progressModal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  document.body.style.overflow = '';
}

function renderModalBody() {
  const body = $('#progressModalBody');
  if (!body || !manifest) return;

  const overall = getOverallPercent();
  const chapters = getChapterPercent();

  const totalChapters = (manifest.chapters || []).filter(c => c.id !== 'ch-000').length;
  const doneChapters = state.completedChapters.filter(id => id !== 'ch-000').length;
  const totalLabs = (manifest.labs || []).length;
  const doneLabs = state.completedLabs.length;
  const totalProjects = (manifest.projects || []).length;
  const doneProjects = state.completedProjects.length;

  const quizEntries = Object.entries(state.quizScores);
  const quizTotal = quizEntries.reduce((acc, [, v]) => acc + v.total, 0);
  const quizCorrect = quizEntries.reduce((acc, [, v]) => acc + v.correct, 0);
  const quizPercent = quizTotal ? Math.round((quizCorrect / quizTotal) * 100) : 0;

  const lastVisited = state.lastVisited
    ? (manifest.chapters || []).find(c => c.id === state.lastVisited)
    : null;

  const rows = [
    { label: 'فصل‌ها', done: doneChapters, total: totalChapters },
    { label: 'آزمایشگاه‌ها (Labs)', done: doneLabs, total: totalLabs },
    { label: 'پروژه‌ها', done: doneProjects, total: totalProjects },
  ].filter(r => r.total > 0);

  body.innerHTML = `
    <div class="progress-container">
      <div class="progress-label">
        <span>پیشرفت کلی</span>
        <span>${toFa(overall)}٪</span>
      </div>
      <div class="progress-track-inner">
        <div class="progress-fill" style="width:${overall}%"></div>
      </div>
    </div>

    <div class="section-divider">جزئیات</div>

    <div style="display:flex;flex-direction:column;gap:12px">
      ${rows.map(r => {
        const p = r.total ? Math.round((r.done / r.total) * 100) : 0;
        return `
          <div>
            <div class="progress-label">
              <span>${r.label}</span>
              <span>${toFa(r.done)} / ${toFa(r.total)} (${toFa(p)}٪)</span>
            </div>
            <div class="progress-track-inner">
              <div class="progress-fill" style="width:${p}%"></div>
            </div>
          </div>
        `;
      }).join('')}

      ${quizTotal > 0 ? `
        <div>
          <div class="progress-label">
            <span>امتیاز کوییزها</span>
            <span>${toFa(quizCorrect)} / ${toFa(quizTotal)} (${toFa(quizPercent)}٪)</span>
          </div>
          <div class="progress-track-inner">
            <div class="progress-fill" style="width:${quizPercent}%"></div>
          </div>
        </div>
      ` : ''}

      ${state.examScore !== null ? `
        <div class="note info">
          <span class="note-title">آزمون نهایی</span>
          <p>امتیاز شما: <strong>${toFa(state.examScore)}٪</strong></p>
        </div>
      ` : ''}
    </div>

    <div class="section-divider">آمار</div>

    <div class="card-grid">
      <div class="card">
        <div class="card-title">شروع</div>
        <div class="card-sub">${formatDate(state.startedAt)}</div>
      </div>
      <div class="card">
        <div class="card-title">آخرین بازدید</div>
        <div class="card-sub">${lastVisited ? lastVisited.title : '—'}</div>
      </div>
      <div class="card">
        <div class="card-title">کوییزها</div>
        <div class="card-sub">${toFa(quizEntries.length)} فصل شرکت کرده‌اید</div>
      </div>
    </div>

    <div class="card-actions" style="margin-top:18px">
      <button class="btn ghost small" id="exportProgressBtn">خروجی JSON</button>
      <button class="btn ghost small danger" id="resetProgressModalBtn">بازنشانی پیشرفت</button>
    </div>
  `;

  const exportBtn = body.querySelector('#exportProgressBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      downloadJSON('drf-fa-progress.json', state);
      toast('فایل پیشرفت دانلود شد', 'success');
    });
  }

  const resetBtn = body.querySelector('#resetProgressModalBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('آیا مطمئن هستید؟ تمام پیشرفت پاک می‌شود.')) {
        reset();
        closeModal();
      }
    });
  }
}

/* ---------- Reset ---------- */
function reset() {
  state = emptyState();
  save();
  renderBadge();
  window.dispatchEvent(new CustomEvent('progress:changed', { detail: { state } }));
  toast('پیشرفت بازنشانی شد', 'success');
}

/* ---------- Helpers ---------- */
function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return toFa(`${y}/${m}/${day}`);
  } catch {
    return '—';
  }
}

/* ---------- Public API ---------- */
export const Progress = {
  init,
  markChapterDone,
  isChapterDone,
  markLabDone,
  markProjectDone,
  recordQuiz,
  setExamScore,
  visit,
  getOverallPercent,
  getChapterPercent,
  openModal,
  closeModal,
  reset,
  get state() {
    return state;
  },
};