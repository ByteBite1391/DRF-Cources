/* ============================================================
   DRF فارسی — Code Blocks
   نسخه اصلاح‌شده: highlighting روی متن خام انجام می‌شود
   و فقط در زمان ساخت HTML، escape اعمال می‌گردد.
   ============================================================ */

import { el, escapeHtml, copyToClipboard, toast } from './utils.js';

/* ============================================================
   Public: render یک بلوک کد
   ============================================================ */
export function renderCodeBlock({ code, lang = 'python', filename = null, lines = false, highlight = null }) {
  const pre = el('pre');
  if (lines) pre.classList.add('with-lines');

  /* --- Code bar --- */
  const bar = el('div', { class: 'code-bar' });
  const barLeft = el('div', { class: 'code-bar-left' });
  barLeft.appendChild(el('span', { class: 'code-lang' }, lang));
  if (filename) {
    barLeft.appendChild(el('span', { class: 'code-filename' }, filename));
  }

  const barRight = el('div', { class: 'code-bar-right' });
  const copyBtn = el('button', {
    type: 'button',
    class: 'copy-btn',
    'aria-label': 'کپی کد',
  }, 'کپی');
  barRight.appendChild(copyBtn);

  bar.appendChild(barLeft);
  bar.appendChild(barRight);

  /* --- Code body --- */
  const codeEl = el('code');
  const rawCode = String(code ?? '');

  // Highlighting — این تابع حالا خودش escape را مدیریت می‌کند
  const highlighted = highlightCode(rawCode, lang);

  if (lines) {
    const html = highlighted
      .split('\n')
      .map((line, i) => {
        const n = i + 1;
        const isHl = highlight && (Array.isArray(highlight) ? highlight.includes(n) : false);
        const cls = 'code-line' + (isHl ? ' highlight' : '');
        // line از قبل HTML امن است
        return `<span class="${cls}">${line || '&nbsp;'}</span>`;
      })
      .join('\n');
    codeEl.innerHTML = `<span class="code-lines">${html}</span>`;
  } else {
    codeEl.innerHTML = highlighted;
  }

  pre.appendChild(bar);
  pre.appendChild(codeEl);

  /* --- Copy handler --- */
  copyBtn.addEventListener('click', async () => {
    const ok = await copyToClipboard(rawCode);
    if (ok) {
      copyBtn.textContent = 'کپی شد ✓';
      copyBtn.classList.add('ok');
      setTimeout(() => {
        copyBtn.textContent = 'کپی';
        copyBtn.classList.remove('ok');
      }, 1600);
    } else {
      toast('کپی ناموفق بود', 'danger');
    }
  });

  return pre;
}

/* ============================================================
   Highlighting dispatcher
   ============================================================ */
export function highlightCode(source, lang) {
  const normalizedLang = (lang || 'text').toLowerCase();

  switch (normalizedLang) {
    case 'python':
    case 'py':
      return highlightPython(source);
    case 'json':
      return highlightJSON(source);
    case 'bash':
    case 'shell':
    case 'sh':
    case 'console':
      return highlightBash(source);
    case 'html':
    case 'xml':
      return highlightHTML(source);
    case 'css':
      return highlightCSS(source);
    case 'js':
    case 'javascript':
    case 'ts':
    case 'typescript':
      return highlightJS(source);
    case 'yaml':
    case 'yml':
      return highlightYAML(source);
    case 'sql':
      return highlightSQL(source);
    case 'text':
    case 'txt':
    default:
      return escapeHtml(source);
  }
}

/* ============================================================
   Helper — ساخت یک span امن
   ============================================================ */
function span(cls, text) {
  return `<span class="${cls}">${escapeHtml(text)}</span>`;
}

/* ============================================================
   Python — نسخه بازنویسی‌شده
   ============================================================ */
const PY_KEYWORDS = new Set([
  'False','None','True','and','as','assert','async','await','break','class',
  'continue','def','del','elif','else','except','finally','for','from','global',
  'if','import','in','is','lambda','nonlocal','not','or','pass','raise',
  'return','try','while','with','yield'
]);

const PY_BUILTINS = new Set([
  'print','len','str','int','float','bool','list','dict','set','tuple',
  'range','enumerate','zip','map','filter','sum','min','max','abs','round',
  'isinstance','issubclass','type','super','hasattr','getattr','setattr',
  'open','sorted','reversed','any','all','id','repr','format','iter','next'
]);

function highlightPython(src) {
  let out = '';
  let i = 0;
  const n = src.length;

  while (i < n) {
    const ch = src[i];

    // Comment
    if (ch === '#') {
      let j = i;
      while (j < n && src[j] !== '\n') j++;
      out += span('c-com', src.slice(i, j));
      i = j;
      continue;
    }

    // Triple-quoted string
    if ((ch === '"' && src.slice(i, i + 3) === '"""') ||
        (ch === "'" && src.slice(i, i + 3) === "'''")) {
      const quote = src.slice(i, i + 3);
      let j = i + 3;
      while (j < n && src.slice(j, j + 3) !== quote) j++;
      j = Math.min(j + 3, n);
      const inner = src.slice(i + 3, Math.max(i + 3, j - 3));
      const cls = inner.includes('\n') ? 'c-doc' : 'c-str';
      out += span(cls, src.slice(i, j));
      i = j;
      continue;
    }

    // String (single line)
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < n && src[j] !== quote && src[j] !== '\n') {
        if (src[j] === '\\') j++;
        j++;
      }
      j = Math.min(j + 1, n);
      out += span('c-str', src.slice(i, j));
      i = j;
      continue;
    }

    // Decorator
    if (ch === '@' && /[A-Za-z_]/.test(src[i + 1] || '')) {
      let j = i + 1;
      while (j < n && /[\w.]/.test(src[j])) j++;
      out += span('c-dec', src.slice(i, j));
      i = j;
      continue;
    }

    // Identifier
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < n && /[\w]/.test(src[j])) j++;
      const word = src.slice(i, j);

      if (PY_KEYWORDS.has(word)) {
        out += span('c-kw', word);
      } else if (word === 'self' || word === 'cls') {
        out += span('c-self', word);
      } else if (PY_BUILTINS.has(word)) {
        out += span('c-builtin', word);
      } else if (/^[A-Z]/.test(word)) {
        const after = src[j];
        if (after === '(') {
          out += span('c-fn', word);
        } else {
          out += span('c-cls', word);
        }
      } else {
        const after = src[j];
        if (after === '(') {
          out += span('c-fn', word);
        } else {
          out += escapeHtml(word);
        }
      }
      i = j;
      continue;
    }

    // Number
    if (/\d/.test(ch)) {
      let j = i;
      while (j < n && /[\d._eExXa-fA-F]/.test(src[j])) j++;
      out += span('c-num', src.slice(i, j));
      i = j;
      continue;
    }

    // Operators / punctuation
    if (/[+\-*/%=<>!&|^~:,.;()[\]{}]/.test(ch)) {
      out += span('c-op', ch);
      i++;
      continue;
    }

    // Whitespace / other — escape
    out += escapeHtml(ch);
    i++;
  }

  return out;
}

/* ============================================================
   JSON
   ============================================================ */
function highlightJSON(src) {
  let out = '';
  let i = 0;
  const n = src.length;

  while (i < n) {
    const ch = src[i];

    // String
    if (ch === '"') {
      let j = i + 1;
      while (j < n && src[j] !== '"') {
        if (src[j] === '\\') j++;
        j++;
      }
      j = Math.min(j + 1, n);
      const str = src.slice(i, j);
      let k = j;
      while (k < n && /\s/.test(src[k])) k++;
      if (src[k] === ':') {
        out += span('c-key', str);
      } else {
        out += span('c-str', str);
      }
      i = j;
      continue;
    }

    // Numbers
    if (/[\d-]/.test(ch)) {
      let j = i;
      if (ch === '-') j++;
      while (j < n && /[\d.eE+]/.test(src[j])) j++;
      out += span('c-num', src.slice(i, j));
      i = j;
      continue;
    }

    // Booleans / null
    const rest = src.slice(i);
    if (rest.startsWith('true') || rest.startsWith('false') || rest.startsWith('null')) {
      const word = rest.startsWith('true') ? 'true' : rest.startsWith('false') ? 'false' : 'null';
      out += span('c-bool', word);
      i += word.length;
      continue;
    }

    out += escapeHtml(ch);
    i++;
  }

  return out;
}

/* ============================================================
   Bash / Shell
   ============================================================ */
function highlightBash(src) {
  const lines = src.split('\n');
  return lines.map(line => {
    if (/^\s*#/.test(line)) {
      return span('c-com', line);
    }

    let out = escapeHtml(line);

    // Strings (بعد از escape، " به &quot; تبدیل شده)
    out = out.replace(/(&quot;(?:[^&]|&(?!quot;))*&quot;|'[^']*')/g, (m) =>
      `<span class="c-str">${m}</span>`
    );

    // Flags
    out = out.replace(/(\s)(--?[A-Za-z][\w-]*)/g, '$1<span class="c-flag">$2</span>');

    // Commands در ابتدای خط یا بعد از |
    out = out.replace(/^(\s*)([a-zA-Z][\w-]*)/, (_, ws, cmd) =>
      `${ws}<span class="c-cmd">${cmd}</span>`
    );
    out = out.replace(/(\|\s*)([a-zA-Z][\w-]*)/g, (_, sep, cmd) =>
      `${sep}<span class="c-cmd">${cmd}</span>`
    );

    return out;
  }).join('\n');
}

/* ============================================================
   HTML — روی متن خام کار می‌کنیم
   ============================================================ */
function highlightHTML(src) {
  let out = '';

  // کامنت‌ها را اول جدا می‌کنیم
  const commentRe = /<!--[\s\S]*?-->/g;
  let lastIndex = 0;
  let match;

  while ((match = commentRe.exec(src)) !== null) {
    out += highlightHTMLNoComments(src.slice(lastIndex, match.index));
    out += span('c-com', match[0]);
    lastIndex = match.index + match[0].length;
  }
  out += highlightHTMLNoComments(src.slice(lastIndex));

  return out;
}

function highlightHTMLNoComments(src) {
  // تطبیق با tag ها روی متن خام
  return src.replace(/(<\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?>)/g,
    (_, open, tag, attrs, close) => {
      let attrOut = '';
      // پردازش attributes
      const attrRe = /([a-zA-Z_:][\w:-]*)(=)("[^"]*"|'[^']*')?/g;
      let lastA = 0;
      let m;
      while ((m = attrRe.exec(attrs)) !== null) {
        attrOut += escapeHtml(attrs.slice(lastA, m.index));
        attrOut += `<span class="c-attr">${escapeHtml(m[1])}</span>`;
        attrOut += escapeHtml(m[2]);
        if (m[3]) attrOut += span('c-str', m[3]);
        lastA = m.index + m[0].length;
      }
      attrOut += escapeHtml(attrs.slice(lastA));

      return `<span class="c-punc">${escapeHtml(open)}</span>` +
             `<span class="c-tag">${escapeHtml(tag)}</span>` +
             attrOut +
             `<span class="c-punc">${escapeHtml(close)}</span>`;
    });
}

/* ============================================================
   CSS
   ============================================================ */
function highlightCSS(src) {
  let out = '';

  // کامنت‌ها
  const commentRe = /\/\*[\s\S]*?\*\//g;
  let lastIndex = 0;
  let match;

  while ((match = commentRe.exec(src)) !== null) {
    out += highlightCSSNoComments(src.slice(lastIndex, match.index));
    out += span('c-com', match[0]);
    lastIndex = match.index + match[0].length;
  }
  out += highlightCSSNoComments(src.slice(lastIndex));

  return out;
}

function highlightCSSNoComments(src) {
  let out = escapeHtml(src);

  // Selectors قبل از {
  out = out.replace(/(^|\n)([^{}\n]+)(\{)/g, (_, nl, sel, brace) =>
    `${nl}<span class="c-cls">${sel.trim()}</span> ${brace}`
  );

  // Properties
  out = out.replace(/([a-zA-Z-]+)(\s*:\s*)([^;}\n]+)(;?)/g,
    (_, prop, sep, val, semi) =>
      `<span class="c-prop">${prop}</span>${sep}<span class="c-str">${val}</span>${semi}`
  );

  return out;
}

/* ============================================================
   JavaScript / TypeScript
   ============================================================ */
const JS_KEYWORDS = [
  'const','let','var','function','return','if','else','for','while','do',
  'switch','case','break','continue','new','typeof','instanceof','in','of',
  'class','extends','super','this','try','catch','finally','throw','async',
  'await','yield','import','from','export','default','null','undefined',
  'true','false','void','delete','static','get','set'
];

function highlightJS(src) {
  let out = '';

  // کامنت‌ها را با یک تکنیک ساده جدا می‌کنیم
  const lines = src.split('\n');
  for (const line of lines) {
    // خط کامنت
    if (/^\s*\/\//.test(line)) {
      out += span('c-com', line) + '\n';
      continue;
    }

    let escaped = escapeHtml(line);

    // strings
    escaped = escaped.replace(/(&quot;(?:[^&]|&(?!quot;))*&quot;|'[^']*'|`[^`]*`)/g,
      m => `<span class="c-str">${m}</span>`);

    // keywords
    for (const kw of JS_KEYWORDS) {
      const re = new RegExp(`\\b${kw}\\b`, 'g');
      escaped = escaped.replace(re, `<span class="c-kw">${kw}</span>`);
    }

    // numbers
    escaped = escaped.replace(/\b(\d+\.?\d*)\b/g, '<span class="c-num">$1</span>');

    out += escaped + '\n';
  }

  return out.replace(/\n$/, '');
}

/* ============================================================
   YAML
   ============================================================ */
function highlightYAML(src) {
  const lines = src.split('\n');
  return lines.map(line => {
    if (/^\s*#/.test(line)) {
      return span('c-com', line);
    }

    const m = line.match(/^(\s*)([\w.-]+)(\s*:\s*)(.*)$/);
    if (m) {
      const [, indent, key, sep, value] = m;
      let valOut;
      if (/^".*"$/.test(value) || /^'.*'$/.test(value)) {
        valOut = span('c-str', value);
      } else if (/^(true|false|null|~)$/i.test(value.trim())) {
        valOut = span('c-bool', value);
      } else if (/^-?\d+(\.\d+)?$/.test(value.trim())) {
        valOut = span('c-num', value);
      } else {
        valOut = escapeHtml(value);
      }
      return escapeHtml(indent) + span('c-key', key) + escapeHtml(sep) + valOut;
    }

    const li = line.match(/^(\s*)(-)(\s+)(.*)$/);
    if (li) {
      const [, indent, dash, sp, value] = li;
      return escapeHtml(indent) + span('c-op', dash) + escapeHtml(sp) + escapeHtml(value);
    }

    return escapeHtml(line);
  }).join('\n');
}

/* ============================================================
   SQL
   ============================================================ */
const SQL_KEYWORDS = [
  'SELECT','FROM','WHERE','INSERT','INTO','VALUES','UPDATE','SET','DELETE',
  'CREATE','TABLE','ALTER','DROP','INDEX','JOIN','LEFT','RIGHT','INNER','OUTER',
  'ON','AS','AND','OR','NOT','NULL','PRIMARY','KEY','FOREIGN','REFERENCES',
  'ORDER','BY','GROUP','HAVING','LIMIT','OFFSET','DISTINCT','UNION','CASE',
  'WHEN','THEN','ELSE','END','IN','LIKE','BETWEEN','IS'
];

function highlightSQL(src) {
  let out = escapeHtml(src);

  // Comments
  out = out.replace(/(--[^\n]*)/g, '<span class="c-com">$1</span>');

  // Strings
  out = out.replace(/('[^']*')/g, '<span class="c-str">$1</span>');

  // Keywords
  for (const kw of SQL_KEYWORDS) {
    const re = new RegExp(`\\b${kw}\\b`, 'gi');
    out = out.replace(re, m => `<span class="c-kw">${m}</span>`);
  }

  // Numbers
  out = out.replace(/\b(\d+)\b/g, '<span class="c-num">$1</span>');

  return out;
}