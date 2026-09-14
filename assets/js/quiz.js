/* ============================================================
   DRF فارسی — Quiz Manager
   مدیریت متمرکز کوییزها: ثبت امتیاز، ذخیره، اعلان
   ============================================================ */

import { Progress } from './progress.js';
import { toast } from './utils.js';

/**
 * گوش دادن به event کوییزها که از renderer.js ارسال می‌شود
 * و ثبت آن در Progress
 */
export function initQuizManager() {
  window.addEventListener('quiz:answered', (e) => {
    const { quizId, correct, total } = e.detail || {};
    if (!quizId) return;

    // استخراج chapterId از quizId اگر به شکل "ch-013-q1" باشد
    const chapterId = quizId.split('-').slice(0, 2).join('-');
    Progress.recordQuiz(chapterId, correct, total);

    // اگر همه درست بود، اعلان تشویقی
    if (correct === total) {
      toast('پاسخ درست! ✓', 'success', 1800);
    }
  });
}

/**
 * بازنشانی همه کوییزهای یک فصل (هنگام ترک صفحه)
 */
export function resetQuizzesIn(root) {
  if (!root) return;
  root.querySelectorAll('[data-quiz]').forEach(quiz => {
    quiz.querySelectorAll('input').forEach(i => i.checked = false);
    quiz.querySelectorAll('label').forEach(l => l.classList.remove('correct', 'wrong'));
    const result = quiz.querySelector('.quiz-result');
    if (result) {
      result.textContent = '';
      result.className = 'quiz-result';
    }
    const exp = quiz.querySelector('.quiz-explanation');
    if (exp) exp.hidden = true;
  });
}

/**
 * محاسبه امتیاز کلی همه کوییزها از Progress
 */
export function getQuizStats() {
  const scores = Progress.state?.quizScores || {};
  const entries = Object.entries(scores);
  const total = entries.reduce((acc, [, v]) => acc + (v.total || 0), 0);
  const correct = entries.reduce((acc, [, v]) => acc + (v.correct || 0), 0);
  const percent = total ? Math.round((correct / total) * 100) : 0;
  return { total, correct, percent, chapters: entries.length };
}

/**
 * پیام تشویقی بر اساس درصد امتیاز
 */
export function quizFeedback(percent) {
  if (percent >= 90) return { text: 'فوق‌العاده! تسلط کامل داری.', variant: 'success' };
  if (percent >= 75) return { text: 'خوب بود! کمی تمرین بیشتر عالی می‌شود.', variant: 'success' };
  if (percent >= 50) return { text: 'قابل قبول. مرور کن و دوباره امتحان کن.', variant: 'warn' };
  return { text: 'نیاز به مرور بیشتر داری. نگران نباش، دوباره تلاش کن.', variant: 'danger' };
}