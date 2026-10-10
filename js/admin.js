'use strict';

/* ════════════════════════════════════════════════════════════
   پنل مدیریت — ویرایش دوره‌ها، برنامه هفتگی و مسابقات
   جریان کار: ویرایش → ذخیره خودکار در مرورگر → «دانلود data.js» → جایگزینی data.js روی هاست
   ════════════════════════════════════════════════════════════ */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const KEY  = 'site-draft';
const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'];
const esc  = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));

/* ── وضعیت: پیش‌نویس ذخیره‌شده، وگرنه نسخه منتشرشده (data.js) ── */
let draft = null;
try { draft = JSON.parse(localStorage.getItem(KEY)); } catch { draft = null; }
let data = Object.assign(clone(window.SITE_DATA), draft && Array.isArray(draft.courses) ? draft : {});
let tab = 'courses';
const opened = new Set();   // حالت باز/بسته‌ی آیتم‌ها بعد از رندر دوباره حفظ شود

const get = path => path.split('.').reduce((o, k) => o?.[k], data);
const set = (path, value) => {
  const keys = path.split('.'), last = keys.pop();
  keys.reduce((o, k) => (o[k] ??= {}), data)[last] = value;
};

/* ── پاک‌سازی: مقدارهای خالی حذف شوند تا سایت بخش خالی نشان ندهد ── */
const isEmpty = v => v == null || v === '' || (Array.isArray(v) && !v.length);
const prune = o => Object.fromEntries(Object.entries(o).filter(([, v]) => !isEmpty(v)));

function clean(d) {
  const x = clone(d);
  // مورد بدون عنوان (مثلاً «دوره جدید» که هنوز پر نشده) در پیش‌نمایش و خروجی نمی‌آید
  x.courses = x.courses.filter(c => c.title?.trim()).map(c => {
    const o = prune(c);
    if (o.instructors) {
      o.instructors = o.instructors.filter(p => p.name?.trim()).map(prune);
      if (!o.instructors.length) delete o.instructors;
    }
    if (o.registration) {
      o.registration = prune(o.registration);
      if (!Object.keys(o.registration).length) delete o.registration;
    }
    return o;
  });
  x.competitions = x.competitions.filter(c => c.title?.trim()).map(c => ({ ...prune(c), date: c.date || null }));
  return x;
}

let statusTimer;
function save() {
  localStorage.setItem(KEY, JSON.stringify(clean(data)));
  const s = $('#status');
  s.textContent = 'پیش‌نویس ذخیره شد ✓';
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { s.textContent = ''; }, 1500);
}

/* ════════════════════════════════════════════════════════════
   سازنده‌های فرم
   kind: text | long | lines (هر خط یک مورد) | pairs (هر خط: الف | ب) | datetime
   ════════════════════════════════════════════════════════════ */
const shamsi = iso => iso
  ? 'شمسی: ' + new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
  : 'خالی = «به‌زودی اعلام می‌شود»';

function f(label, path, kind = 'text', hint = '') {
  const raw = get(path);
  const attr = `data-path="${path}" data-kind="${kind}"`;
  let el;
  if (kind === 'text') el = `<input ${attr} value="${esc(raw)}">`;
  else if (kind === 'datetime') { el = `<input type="datetime-local" ${attr} value="${esc((raw || '').slice(0, 16))}">`; hint = shamsi(raw); }
  else {
    const v = kind === 'lines' ? (raw || []).join('\n')
            : kind === 'pairs' ? (raw || []).map(p => p.join(' | ')).join('\n')
            : raw ?? '';
    el = `<textarea ${attr} rows="${kind === 'long' ? 4 : 5}">${esc(v)}</textarea>`;
  }
  return `<label class="fld"><span>${label}</span>${el}<small>${hint}</small></label>`;
}

const sel = (label, path, options) => `<label class="fld">${label ? `<span>${label}</span>` : ''}
  <select data-path="${path}" data-kind="text">${options.map(([v, t]) =>
    `<option value="${esc(v)}" ${(get(path) ?? '') === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;

const acts = (list, i) => `<span class="acts">${[['up', '▲'], ['down', '▼'], ['del', 'حذف']].map(([a, t]) =>
  `<button type="button" data-act="${a}" data-list="${list}" data-i="${i}">${t}</button>`).join('')}</span>`;

const addBtn = (list, text) => `<button type="button" class="btn add" data-act="add" data-list="${list}">${text}</button>`;

/* ════════════════════════════════════════════════════════════
   پنل‌ها
   ════════════════════════════════════════════════════════════ */
function panelCourses() {
  const icons = Object.entries(data.subjects);
  return data.courses.map((c, i) => {
    const p = `courses.${i}`;
    const instructors = (c.instructors || []).map((_, j) => `<div class="sub-item">${acts(`${p}.instructors`, j)}
        <div class="row2">${f('نام مدرس', `${p}.instructors.${j}.name`)}${f('عنوان / تخصص', `${p}.instructors.${j}.role`)}</div>
        ${f('امتیاز', `${p}.instructors.${j}.rating`, 'text', 'مثلاً ۵.۰ از ۵')}
        ${f('درباره مدرس', `${p}.instructors.${j}.bio`, 'long')}</div>`).join('');
    return `<details class="item" data-id="${esc(c.id)}" ${opened.has(c.id) ? 'open' : ''}>
      <summary><span>${esc(c.title || 'دوره جدید')}</span>${acts('courses', i)}</summary>
      <div class="form">
        <div class="row2">${f('عنوان دوره', `${p}.title`)}${sel('آیکون (و درس مرتبط در برنامه هفتگی)', `${p}.icon`, icons)}</div>
        <div class="row2">${f('دسته‌بندی', `${p}.category`, 'text', 'مثلاً فناوری')}${f('شعار زیر عنوان', `${p}.tagline`)}</div>
        ${f('کادرهای مشخصات', `${p}.facts`, 'pairs', 'هر خط: عنوان | مقدار — مثال: مدت دوره | ۱۲ هفته')}
        ${f('درباره این دوره', `${p}.about`, 'long')}
        ${f('نکات برجسته', `${p}.highlights`, 'lines', 'هر خط یک مورد')}
        ${f('سرفصل‌ها', `${p}.syllabus`, 'pairs', 'هر خط: بازه | موضوع — مثال: هفته ۱–۳ | پایه‌های Python')}
        <h4>مدرسین</h4>${instructors}${addBtn(`${p}.instructors`, '+ افزودن مدرس')}
        <div class="row2">${f('پیش‌نیازها', `${p}.prerequisites`, 'lines', 'هر خط یک مورد')}${f('آنچه یاد می‌گیرید', `${p}.outcomes`, 'lines', 'هر خط یک مورد')}</div>
        <h4>ثبت‌نام</h4>
        ${f('پیام کادر ثبت‌نام', `${p}.registration.note`)}
        ${f('ساعت کلاس‌ها', `${p}.registration.slots`, 'pairs', 'هر خط: روز | ساعت — مثال: شنبه | ۸:۰۰ – ۹:۳۰')}
        ${f('متن گواهینامه', `${p}.registration.certificate`)}
        <p class="idnote">آدرس صفحه این دوره: course.html?c=${esc(c.id)}</p>
      </div></details>`;
  }).join('') + addBtn('courses', '+ دوره جدید');
}

function panelSchedule() {
  const options = [['', '— بدون جلسه —'], ...Object.entries(data.subjects)];
  const cols = [0, 1, 2, 3];
  return `<div class="box"><h3>ساعت جلسه‌ها</h3><div class="row4">${cols.map(i => f(`جلسه ${i + 1}`, `timeSlots.${i}`)).join('')}</div></div>
    <div class="box"><h3>برنامه هر روز</h3><div class="tablewrap"><table>
      <thead><tr><th>روز</th>${cols.map(i => `<th>جلسه ${i + 1}</th>`).join('')}</tr></thead>
      <tbody>${DAYS.map((d, r) => `<tr><th>${d}</th>${cols.map(i => `<td>${sel('', `weeklyPlan.${r}.${i}`, options)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div></div>
    <div class="box"><h3>نام درس‌ها</h3><div class="row3">${Object.keys(data.subjects).map(k => f(k, `subjects.${k}`)).join('')}</div></div>`;
}

function panelCompetitions() {
  return data.competitions.map((c, i) => {
    const p = `competitions.${i}`;
    return `<details class="item" data-id="${esc(c.id)}" ${opened.has(c.id) ? 'open' : ''}>
      <summary><span>${esc(c.title || 'مسابقه جدید')}</span>${acts('competitions', i)}</summary>
      <div class="form">
        <div class="row2">${f('عنوان مسابقه', `${p}.title`)}${f('زیرعنوان', `${p}.subtitle`)}</div>
        ${f('آدرس عکس', `${p}.img`, 'text', 'مثلاً pic/nojoom.jpg (نسبت به صفحه مسابقات) یا آدرس اینترنتی')}
        <div class="row2">${f('زمان برگزاری', `${p}.date`, 'datetime')}${f('مکان', `${p}.place`)}</div>
        ${f('توضیحات', `${p}.details`, 'long')}
      </div></details>`;
  }).join('') + addBtn('competitions', '+ مسابقه جدید');
}

const PANELS = { courses: panelCourses, schedule: panelSchedule, competitions: panelCompetitions };

function render() {
  $$('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  $('#panel').innerHTML = PANELS[tab]();
}

/* ════════════════════════════════════════════════════════════
   رویدادها
   ════════════════════════════════════════════════════════════ */
function onInput(e) {
  const t = e.target, path = t.dataset?.path;
  if (!path) return;
  const kind = t.dataset.kind;
  let v = t.value;
  const lines = () => v.split('\n').map(s => s.trim()).filter(Boolean);
  if (kind === 'lines') v = lines();
  else if (kind === 'pairs') v = lines().map(l => { const [a, ...r] = l.split('|'); return [a.trim(), r.join('|').trim()]; });
  else if (kind === 'datetime') v = v ? `${v}:00+03:30` : null;   // ساعت ایران
  set(path, v);

  if (path.endsWith('.title')) { const s = t.closest('details')?.querySelector('summary > span'); if (s) s.textContent = v || 'بدون عنوان'; }
  if (kind === 'datetime') t.closest('label').querySelector('small').textContent = shamsi(v);
  save();
}

const NEW_ITEM = {
  courses:      () => ({ id: 'c' + Date.now().toString(36), icon: Object.keys(data.subjects)[0], title: '', category: '' }),
  competitions: () => ({ id: 'm' + Date.now().toString(36), title: '', subtitle: '', img: '', date: null }),
  instructors:  () => ({ name: '' }),
};
const MOVE = {
  up:   (arr, i) => { if (i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; },
  down: (arr, i) => { if (i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; },
  del:  (arr, i) => { if (confirm('این مورد حذف شود؟')) arr.splice(i, 1); },
};

function onClick(e) {
  const b = e.target.closest?.('[data-act]');
  if (!b) return;
  e.preventDefault();                       // دکمه داخل summary نباید آیتم را باز/بسته کند
  const { act, list } = b.dataset;
  if (act === 'add') {
    let arr = get(list);
    if (!arr) { set(list, []); arr = get(list); }
    const item = NEW_ITEM[list.split('.').pop()]();
    arr.push(item);
    if (item.id) opened.add(item.id);
  } else if (MOVE[act]) {
    MOVE[act](get(list), Number(b.dataset.i));
  }
  save();
  render();
}

document.addEventListener('input', onInput);
document.addEventListener('click', onClick);
document.addEventListener('toggle', e => {
  const d = e.target;
  if (d.matches?.('details[data-id]')) (d.open ? opened.add(d.dataset.id) : opened.delete(d.dataset.id));
}, true);

$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-tab]');
  if (b) { tab = b.dataset.tab; render(); }
});

/* ── دکمه‌های بالای صفحه ── */
$('#btn-preview').addEventListener('click', () => { save(); window.open('index.html?preview=1', '_blank'); });

$('#btn-download').addEventListener('click', () => {
  if ([...data.courses, ...data.competitions].some(c => !c.title?.trim())) {
    alert('عنوان یکی از دوره‌ها یا مسابقات خالی است؛ اول عنوانش را وارد کن.');
    return;
  }
  const text = 'window.SITE_DATA = ' + JSON.stringify(clean(data), null, 2) + ';\n';
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([text], { type: 'text/javascript' })), download: 'data.js',
  });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
});

$('#btn-reset').addEventListener('click', () => {
  if (!confirm('پیش‌نویس پاک شود و به نسخه‌ی منتشرشده (data.js) برگردیم؟')) return;
  localStorage.removeItem(KEY);
  data = clone(window.SITE_DATA);
  render();
});

$('#btn-import').addEventListener('click', () => $('#file').click());
$('#file').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const d = JSON.parse(text.match(/window\.SITE_DATA\s*=\s*(\{[\s\S]*\})\s*;?\s*$/)[1]);
    if (!Array.isArray(d.courses) || !Array.isArray(d.competitions)) throw new Error('bad');
    data = Object.assign(clone(window.SITE_DATA), d);
    save();
    render();
  } catch { alert('این فایل، یک data.js معتبر نیست.'); }
  e.target.value = '';
});

render();
