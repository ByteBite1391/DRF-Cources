/* ============================================================
   DRF فارسی — Renderer
   تبدیل ساختار JSON فصل به HTML
   ============================================================ */

import {
  el, escapeHtml, toFa, formatMinutes,
  levelFa, levelStars, LEVEL_LABELS,
} from './utils.js';
import { renderCodeBlock } from './codeblocks.js';

/* ---------- Block dispatch ---------- */
export function renderBlocks(blocks = []) {
  const frag = document.createDocumentFragment();
  for (const block of blocks) {
    const node = renderBlock(block);
    if (node) frag.appendChild(node);
  }
  return frag;
}

function renderBlock(block) {
  if (!block || !block.type) return null;
  const fn = BLOCK_RENDERERS[block.type];
  if (!fn) {
    console.warn('نوع بلوک ناشناخته:', block.type);
    return null;
  }
  return fn(block);
}

/* ============================================================
   Block Renderers
   ============================================================ */
const BLOCK_RENDERERS = {

  /* ---------- Paragraph ---------- */
  paragraph(b) {
    const p = el('p');
    p.innerHTML = inlineFormat(b.text ?? '');
    return p;
  },

  /* ---------- Heading (h2/h3/h4) ---------- */
  heading(b) {
    const level = Math.min(Math.max(b.level ?? 2, 2), 4);
    const h = el(`h${level}`);
    if (b.id) h.id = b.id;
    h.textContent = b.text ?? '';
    return h;
  },

  /* ---------- List (ordered/unordered) ---------- */
  list(b) {
    const list = el(b.ordered ? 'ol' : 'ul');
    for (const item of (b.items || [])) {
      const li = el('li');
      li.innerHTML = inlineFormat(typeof item === 'string' ? item : item.text ?? '');
      list.appendChild(li);
    }
    return list;
  },

  /* ---------- Code ---------- */
  code(b) {
    return renderCodeBlock({
      code: b.code ?? '',
      lang: b.lang ?? 'python',
      filename: b.filename || null,
      lines: !!b.lines,
      highlight: b.highlight || null,
    });
  },

  /* ---------- Note / Callout ---------- */
  note(b) {
    const variant = b.variant || 'info';
    const box = el('div', { class: `note ${variant}` });
    if (b.title) {
      const t = el('span', { class: 'note-title' }, b.title);
      box.appendChild(t);
    }
    const body = el('div');
    body.innerHTML = inlineFormat(b.text ?? '');
    box.appendChild(body);
    return box;
  },

  /* ---------- Term (inline) ---------- */
  term(b) {
    const span = el('span', { class: 'term' });
    span.appendChild(document.createTextNode(b.fa ?? ''));
    if (b.en) {
      const small = el('small', {}, b.en);
      span.appendChild(small);
    }
    return span;
  },

  /* ---------- Table ---------- */
  table(b) {
    const wrap = el('div', { class: 'table-wrap' });
    const table = el('table');

    if (b.headers && b.headers.length) {
      const thead = el('thead');
      const tr = el('tr');
      for (const h of b.headers) {
        const th = el('th');
        th.innerHTML = inlineFormat(h);
        tr.appendChild(th);
      }
      thead.appendChild(tr);
      table.appendChild(thead);
    }

    const tbody = el('tbody');
    for (const row of (b.rows || [])) {
      const tr = el('tr');
      for (const cell of row) {
        const td = el('td');
        td.innerHTML = inlineFormat(cell);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  },

  /* ---------- Callout Level (Basic / Better / Production) ---------- */
  'callout-level'(b) {
    const wrap = el('div', { class: 'callout-level' });

    const stages = [
      { key: 'basic', label: 'Basic', text: b.basic },
      { key: 'better', label: 'Better', text: b.better },
      { key: 'production', label: 'Production', text: b.production },
    ];

    for (const s of stages) {
      if (!s.text) continue;
      const item = el('div', {
        class: 'callout-level-item',
        'data-stage': s.key,
      });
      const title = el('div', { class: 'callout-level-title' }, s.label);
      const body = el('div', { class: 'callout-level-body' });
      body.innerHTML = inlineFormat(s.text);
      item.appendChild(title);
      item.appendChild(body);
      wrap.appendChild(item);
    }

    return wrap;
  },

  /* ---------- Anti-Pattern ---------- */
  'anti-pattern'(b) {
    const box = el('div', { class: 'anti-pattern' });
    const title = el('div', { class: 'anti-pattern-title' }, b.title ?? 'ضدالگو');
    box.appendChild(title);

    const parts = [
      ['چرا بد است:', b.why],
      ['چه زمانی مشکل می‌شود:', b.when],
      ['چگونه برطرف کنیم:', b.fix],
    ];

    for (const [label, text] of parts) {
      if (!text) continue;
      const sec = el('div', { class: 'anti-pattern-section' });
      const strong = el('strong', {}, label);
      sec.appendChild(strong);
      const span = el('span');
      span.innerHTML = ' ' + inlineFormat(text);
      sec.appendChild(span);
      box.appendChild(sec);
    }

    return box;
  },

  /* ---------- Quiz ---------- */
  quiz(b) {
    return renderQuiz(b);
  },

  /* ---------- Exercise ---------- */
  exercise(b) {
    return renderExercise(b);
  },

  /* ---------- Summary ---------- */
  summary(b) {
    const box = el('div', { class: 'summary-box' });
    box.appendChild(el('h3', {}, b.title ?? 'خلاصه فصل'));
    if (Array.isArray(b.items) && b.items.length) {
      const ul = el('ul');
      for (const item of b.items) {
        const li = el('li');
        li.innerHTML = inlineFormat(item);
        ul.appendChild(li);
      }
      box.appendChild(ul);
    }
    return box;
  },

  /* ---------- Diagram (SVG reference) ---------- */
  diagram(b) {
    const wrap = el('div', { class: 'diagram' });
    if (b.svg) {
      // svg می‌تواند markup مستقیم باشد
      const holder = el('div');
      holder.innerHTML = b.svg;
      wrap.appendChild(holder);
    } else if (b.caption) {
      wrap.appendChild(el('div', {}, b.caption));
    }
    if (b.caption && b.svg) {
      wrap.appendChild(el('div', { class: 'diagram-caption' }, b.caption));
    }
    return wrap;
  },

  /* ---------- Flow (arrow chain) ---------- */
  flow(b) {
    const wrap = el('div', { class: 'flow' });
    const steps = b.steps || [];
    steps.forEach((step, i) => {
      wrap.appendChild(el('span', { class: 'flow-step' }, step));
      if (i < steps.length - 1) {
        wrap.appendChild(el('span', { class: 'flow-arrow' }, '→'));
      }
    });
    return wrap;
  },

  /* ---------- Section Divider ---------- */
  divider(b) {
    return el('div', { class: 'section-divider' }, b.text ?? '');
  },

  /* ---------- Resource list ---------- */
  resources(b) {
    const wrap = el('div', { class: 'resource-list' });
    for (const r of (b.items || [])) {
      const a = el('a', {
        class: 'resource-item',
        href: r.url,
        target: '_blank',
        rel: 'noopener',
      });
      a.appendChild(el('div', { class: 'resource-item-title' }, r.title));
      a.appendChild(el('div', { class: 'resource-item-url' }, r.url));
      if (r.official) {
        a.appendChild(el('span', { class: 'resource-item-official' }, 'official'));
      }
      wrap.appendChild(a);
    }
    return wrap;
  },

  /* ---------- Cheat Sheet ---------- */
  cheatsheet(b) {
    const wrap = el('div', { class: 'cheatsheet' });
    if (b.title) wrap.appendChild(el('h3', {}, b.title));

    const grid = el('div', { class: 'cheatsheet-grid' });
    for (const item of (b.items || [])) {
      const cell = el('div', { class: 'cheatsheet-item' });
      cell.appendChild(el('div', { class: 'cheatsheet-item-title' }, item.title ?? ''));
      const body = el('div', { class: 'cheatsheet-item-body' });
      body.innerHTML = inlineFormat(item.body ?? '');
      cell.appendChild(body);
      grid.appendChild(cell);
    }
    wrap.appendChild(grid);
    return wrap;
  },

  /* ---------- FAQ list ---------- */
  faq(b) {
    const wrap = el('div', { class: 'faq-list' });
    for (const item of (b.items || [])) {
      const details = el('details', { class: 'faq-item' });
      details.appendChild(el('summary', {}, item.q ?? ''));
      const answer = el('div', { class: 'faq-answer' });
      answer.innerHTML = inlineFormat(item.a ?? '');
      details.appendChild(answer);
      wrap.appendChild(details);
    }
    return wrap;
  },

  /* ---------- Lab card ---------- */
  'lab-card'(b) {
    return renderLabCard('lab-card', b);
  },

  /* ---------- Project card ---------- */
  'project-card'(b) {
    return renderLabCard('project-card', b);
  },

  /* ---------- Bug lab ---------- */
  'bug-lab'(b) {
    return renderSpecialLab('bug-lab', 'Bug Lab', b);
  },

  /* ---------- Security lab ---------- */
  'security-lab'(b) {
    return renderSpecialLab('security-lab', 'Security Lab', b);
  },

  /* ---------- Performance lab ---------- */
  'performance-lab'(b) {
    return renderSpecialLab('performance-lab', 'Performance Lab', b);
  },

  /* ---------- Tabs ---------- */
  tabs(b) {
    const wrap = el('div', { class: 'tabs' });
    const nav = el('div', { class: 'tabs-nav' });
    const panels = el('div');

    const tabs = b.tabs || [];
    tabs.forEach((tab, i) => {
      const btn = el('button', {
        type: 'button',
        class: 'tab-btn' + (i === 0 ? ' active' : ''),
        'data-tab-index': i,
      }, tab.label);
      btn.addEventListener('click', () => {
        nav.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
        panels.querySelectorAll('.tab-panel').forEach(x => x.hidden = true);
        btn.classList.add('active');
        panels.children[i].hidden = false;
      });
      nav.appendChild(btn);

      const panel = el('div', {
        class: 'tab-panel',
      });
      if (i !== 0) panel.hidden = true;
      panel.appendChild(renderBlocks(tab.blocks || []));
      panels.appendChild(panel);
    });

    wrap.appendChild(nav);
    wrap.appendChild(panels);
    return wrap;
  },

  /* ---------- Inline code ---------- */
  'inline-code'(b) {
    const code = el('code', { class: 'inline' }, b.code ?? '');
    return code;
  },

  /* ---------- Horizontal rule ---------- */
  hr() {
    return el('hr');
  },

  /* ---------- Quote ---------- */
  quote(b) {
    const q = el('blockquote');
    q.innerHTML = inlineFormat(b.text ?? '');
    return q;
  },
};

/* ============================================================
   Quiz renderer
   ============================================================ */
function renderQuiz(b) {
  const box = el('div', { class: 'quiz', 'data-quiz': b.id || '' });
  box.appendChild(el('span', { class: 'quiz-tag' }, b.tag || 'کوییز'));
  const q = el('p', { class: 'quiz-q' });
  q.innerHTML = inlineFormat(b.question ?? '');
  box.appendChild(q);

  const options = el('div', { class: 'quiz-options' });
  const inputType = b.multi ? 'checkbox' : 'radio';
  const name = 'quiz-' + (b.id || Math.random().toString(36).slice(2, 8));

  (b.options || []).forEach((opt, i) => {
    const label = el('label', {
      'data-correct': opt.correct ? 'true' : 'false',
      'data-explanation': opt.explanation || '',
    });
    const input = el('input', {
      type: inputType,
      name,
      value: String(i),
      'data-correct': opt.correct ? 'true' : 'false',
      'data-explanation': opt.explanation || '',
    });
    label.appendChild(input);
    const span = el('span');
    span.innerHTML = inlineFormat(opt.text ?? '');
    label.appendChild(span);
    options.appendChild(label);
  });
  box.appendChild(options);

  const actions = el('div', { class: 'quiz-actions' });
  const checkBtn = el('button', { type: 'button', class: 'btn small' }, 'بررسی پاسخ');
  const resetBtn = el('button', { type: 'button', class: 'btn ghost small' }, 'تلاش مجدد');
  actions.appendChild(checkBtn);
  actions.appendChild(resetBtn);
  box.appendChild(actions);

  const result = el('div', { class: 'quiz-result' });
  box.appendChild(result);

  const explanation = el('div', { class: 'quiz-explanation' });
  explanation.hidden = true;
  box.appendChild(explanation);

  checkBtn.addEventListener('click', () => {
    const inputs = box.querySelectorAll('input');
    const selected = Array.from(inputs).filter(i => i.checked);
    if (!selected.length) {
      result.textContent = 'لطفاً یک گزینه انتخاب کنید.';
      result.className = 'quiz-result no';
      return;
    }

    const allCorrect = selected.every(i => i.dataset.correct === 'true');
    const correctCount = selected.filter(i => i.dataset.correct === 'true').length;
    const correctOptions = Array.from(inputs).filter(i => i.dataset.correct === 'true');

    // پاک‌کردن وضعیت قبلی
    box.querySelectorAll('label').forEach(l => l.classList.remove('correct', 'wrong'));

    // علامت‌گذاری
    inputs.forEach(i => {
      const label = i.closest('label');
      if (i.dataset.correct === 'true') label.classList.add('correct');
      else if (i.checked) label.classList.add('wrong');
    });

    if (allCorrect && selected.length === correctOptions.length) {
      result.textContent = 'درست است! ✓';
      result.className = 'quiz-result ok';
    } else {
      result.textContent = `پاسخ درست با رنگ سبز مشخص شد. (${toFa(correctCount)} از ${toFa(selected.length)})`;
      result.className = 'quiz-result no';
    }

    // نمایش توضیح (اگر وجود دارد)
    const explanations = correctOptions
      .map(i => i.dataset.explanation)
      .filter(Boolean);
    if (explanations.length) {
      explanation.innerHTML = explanations.map(e => inlineFormat(e)).join('<br>');
      explanation.hidden = false;
    }

    // ثبت در Progress
    window.dispatchEvent(new CustomEvent('quiz:answered', {
      detail: {
        quizId: b.id,
        correct: allCorrect ? 1 : 0,
        total: 1,
      }
    }));
  });

  resetBtn.addEventListener('click', () => {
    box.querySelectorAll('input').forEach(i => i.checked = false);
    box.querySelectorAll('label').forEach(l => l.classList.remove('correct', 'wrong'));
    result.textContent = '';
    result.className = 'quiz-result';
    explanation.hidden = true;
  });

  return box;
}

/* ============================================================
   Exercise renderer
   ============================================================ */
function renderExercise(b) {
  const details = el('details', { class: 'exercise' });
  details.appendChild(el('summary', {}, b.title || 'تمرین'));

  const body = el('div', { class: 'exercise-body' });
  const problem = el('div');
  problem.innerHTML = inlineFormat(b.problem ?? '');
  body.appendChild(problem);

  // راهنماها
  if (Array.isArray(b.hints) && b.hints.length) {
    const hintsWrap = el('div', { class: 'exercise-hints' });
    b.hints.forEach((hint, i) => {
      const d = el('details', { class: 'sub' });
      d.appendChild(el('summary', {}, `راهنما ${toFa(i + 1)}`));
      const inner = el('div');
      inner.innerHTML = inlineFormat(hint);
      d.appendChild(inner);
      hintsWrap.appendChild(d);
    });
    body.appendChild(hintsWrap);
  }

  // پاسخ
  if (b.solution) {
    const d = el('details', { class: 'sub' });
    d.appendChild(el('summary', {}, 'پاسخ نمونه'));
    const inner = el('div');
    // اگر solution کد markdown دارد، به code block تبدیل کن
    if (typeof b.solution === 'string' && b.solution.includes('```')) {
      inner.appendChild(renderMarkdownCode(b.solution));
    } else {
      inner.innerHTML = inlineFormat(b.solution);
    }
    d.appendChild(inner);
    body.appendChild(d);
  }

  // توضیح
  if (b.explanation) {
    const exp = el('div', { class: 'note tip' });
    const t = el('span', { class: 'note-title' }, 'توضیح');
    exp.appendChild(t);
    const inner = el('div');
    inner.innerHTML = inlineFormat(b.explanation);
    exp.appendChild(inner);
    body.appendChild(exp);
  }

  details.appendChild(body);
  return details;
}

/* ---------- Markdown code extraction (برای solution) ---------- */
function renderMarkdownCode(text) {
  const wrap = document.createDocumentFragment();
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      const before = el('div');
      before.innerHTML = inlineFormat(text.slice(lastIndex, m.index));
      wrap.appendChild(before);
    }
    wrap.appendChild(renderCodeBlock({
      code: m[2],
      lang: m[1] || 'python',
    }));
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    const after = el('div');
    after.innerHTML = inlineFormat(text.slice(lastIndex));
    wrap.appendChild(after);
  }
  return wrap;
}

/* ============================================================
   Lab & Project cards
   ============================================================ */
function renderLabCard(cls, b) {
  const box = el('div', { class: cls });

  const header = el('div', { class: `${cls}-header` });
  header.appendChild(el('div', { class: `${cls}-title` }, b.title ?? ''));
  if (b.level) {
    const badge = el('span', {
      class: 'level-badge',
      'data-level': b.level,
    }, `${'⭐'.repeat(levelStars(b.level))} ${levelFa(b.level)}`);
    header.appendChild(badge);
  }
  box.appendChild(header);

  if (b.objective) {
    const obj = el('div', { class: `${cls}-objective` });
    obj.innerHTML = inlineFormat(b.objective);
    box.appendChild(obj);
  }

  if (Array.isArray(b.tags) && b.tags.length) {
    const chips = el('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' } });
    for (const t of b.tags) chips.appendChild(el('span', { class: 'chip' }, t));
    box.appendChild(chips);
  }

  return box;
}

/* ============================================================
   Bug / Security / Performance labs
   ============================================================ */
function renderSpecialLab(cls, label, b) {
  const box = el('div', { class: cls });
  box.appendChild(el('div', { class: `${cls}-header` }, b.title || label));

  const body = el('div', { class: 'exercise-body' });
  if (b.intro) {
    const p = el('div');
    p.innerHTML = inlineFormat(b.intro);
    body.appendChild(p);
  }

  if (b.code) {
    body.appendChild(renderCodeBlock({
      code: b.code,
      lang: b.lang || 'python',
      filename: b.filename || null,
    }));
  }

  if (b.question) {
    const q = el('div', { class: 'note warn' });
    q.appendChild(el('span', { class: 'note-title' }, 'پرسش'));
    const inner = el('div');
    inner.innerHTML = inlineFormat(b.question);
    q.appendChild(inner);
    body.appendChild(q);
  }

  // راهنماها
  if (Array.isArray(b.hints) && b.hints.length) {
    b.hints.forEach((hint, i) => {
      const d = el('details', { class: 'sub' });
      d.appendChild(el('summary', {}, `راهنما ${toFa(i + 1)}`));
      const inner = el('div');
      inner.innerHTML = inlineFormat(hint);
      d.appendChild(inner);
      body.appendChild(d);
    });
  }

  // پاسخ
  if (b.solution) {
    const d = el('details', { class: 'sub' });
    d.appendChild(el('summary', {}, 'راه‌حل'));
    const inner = el('div');
    inner.innerHTML = inlineFormat(b.solution);
    d.appendChild(inner);
    body.appendChild(d);
  }

  // چرا و چگونه
  if (b.why) {
    const why = el('div', { class: 'note danger' });
    why.appendChild(el('span', { class: 'note-title' }, 'چرا این مشکل رخ داد'));
    const inner = el('div');
    inner.innerHTML = inlineFormat(b.why);
    why.appendChild(inner);
    body.appendChild(why);
  }

  if (b.prevention) {
    const prev = el('div', { class: 'note tip' });
    prev.appendChild(el('span', { class: 'note-title' }, 'چگونه از آن جلوگیری کنیم'));
    const inner = el('div');
    inner.innerHTML = inlineFormat(prev.prevention);
    prev.appendChild(inner);
    body.appendChild(prev);
  }

  box.appendChild(body);
  return box;
}

/* ============================================================
   Inline format — تبدیل ساده markdown درون‌خطی
   پشتیبانی: `code`, **bold**, *italic*, [link](url)
   ============================================================ */
export function inlineFormat(text) {
  if (text === null || text === undefined) return '';
  let s = String(text);

  // escape اولیه — اما markup های خودمان را نگه می‌داریم
  // به‌جای escape کامل، فقط < و > خطرناک را حذف می‌کنیم
  s = s.replace(/<script/gi, '&lt;script');
  s = s.replace(/<iframe/gi, '&lt;iframe');

  // inline code: `...`
  s = s.replace(/`([^`]+)`/g, (_, code) =>
    `<code class="inline">${escapeHtml(code)}</code>`
  );

  // bold: **...**
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // italic: *...*  (اما نه داخل strong)
  s = s.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');

  // links: [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const safeUrl = String(url).replace(/"/g, '&quot;');
    const isExternal = /^https?:\/\//i.test(safeUrl);
    const attrs = isExternal ? ' target="_blank" rel="noopener"' : '';
    return `<a href="${safeUrl}"${attrs}>${text}</a>`;
  });

  return s;
}

/* ============================================================
   Render full chapter
   ============================================================ */
export function renderChapter(chapter, manifest) {
  const frag = document.createDocumentFragment();

  /* --- Head --- */
  const head = el('header', { class: 'chapter-head' });

  if (chapter.kicker) {
    head.appendChild(el('span', { class: 'chapter-kicker' }, chapter.kicker));
  }

  const h1 = el('h1', {}, chapter.title ?? '');
  head.appendChild(h1);

  // Meta row
  const meta = el('div', { class: 'chapter-meta' });
  if (chapter.level) {
    meta.appendChild(el('span', {
      class: 'level-badge',
      'data-level': chapter.level,
    }, `${'⭐'.repeat(levelStars(chapter.level))} ${levelFa(chapter.level)}`));
  }
  if (chapter.estimatedMinutes) {
    meta.appendChild(el('span', { class: 'chapter-meta-item' }, '⏱ ' + formatMinutes(chapter.estimatedMinutes)));
  }
  if (chapter.prerequisites && chapter.prerequisites.length && manifest) {
    const titles = chapter.prerequisites
      .map(id => (manifest.chapters || []).find(c => c.id === id)?.title)
      .filter(Boolean);
    if (titles.length) {
      meta.appendChild(el('span', { class: 'chapter-meta-item' }, '📚 پیش‌نیاز: ' + titles.join('، ')));
    }
  }
  if (meta.children.length) head.appendChild(meta);

  if (chapter.lead) {
    const lead = el('p', { class: 'chapter-lead' });
    lead.innerHTML = inlineFormat(chapter.lead);
    head.appendChild(lead);
  }

  frag.appendChild(head);

  /* --- Body (sections) --- */
  const body = el('div', { class: 'chapter-body' });

  if (Array.isArray(chapter.sections) && chapter.sections.length) {
    for (const section of chapter.sections) {
      if (section.title) {
        const h2 = el('h2', { id: section.id || '' }, section.title);
        body.appendChild(h2);
      }
      body.appendChild(renderBlocks(section.blocks || []));
    }
  } else if (Array.isArray(chapter.blocks)) {
    // در صورتی که فصل ساختار ساده‌تری داشت
    body.appendChild(renderBlocks(chapter.blocks));
  }

  frag.appendChild(body);

  /* --- Quiz --- */
  if (Array.isArray(chapter.quiz) && chapter.quiz.length) {
    const quizHeader = el('h2', { id: 'quiz' }, 'کوییز');
    frag.appendChild(quizHeader);
    const wrap = el('div');
    for (const q of chapter.quiz) {
      wrap.appendChild(renderQuiz(q));
    }
    frag.appendChild(wrap);
  }

  /* --- Exercises --- */
  if (Array.isArray(chapter.exercises) && chapter.exercises.length) {
    const exHeader = el('h2', { id: 'exercises' }, 'تمرین‌ها');
    frag.appendChild(exHeader);
    const wrap = el('div');
    for (const ex of chapter.exercises) {
      wrap.appendChild(renderExercise(ex));
    }
    frag.appendChild(wrap);
  }

  /* --- Summary --- */
  if (Array.isArray(chapter.summary) && chapter.summary.length) {
    frag.appendChild(BLOCK_RENDERERS.summary({ items: chapter.summary }));
  }

  /* --- Resources --- */
  if (Array.isArray(chapter.resources) && chapter.resources.length) {
    const rHeader = el('h2', { id: 'resources' }, 'منابع');
    frag.appendChild(rHeader);
    frag.appendChild(BLOCK_RENDERERS.resources({ items: chapter.resources }));
  }

  return frag;
}