'use strict';

/* ════════════════════════════════════════════════════════════
   داده‌ها از data.js می‌آیند (با پنل مدیریت ویرایش می‌شوند)
   ════════════════════════════════════════════════════════════ */
const PHONE = '0918 215 7378';
const PHONE_LINK = 'tel:09182157378';

const COURSES = Object.fromEntries(window.SITE_DATA.courses.map(c => [c.id, c]));
const ORDER = window.SITE_DATA.courses.map(c => c.id);   // ترتیب «دوره قبلی / بعدی»

/* ════════════════════════════════════════════════════════════
   ابزارها
   ════════════════════════════════════════════════════════════ */
const $ = (sel, root = document) => root.querySelector(sel);
const list = (items, cls = 'checks') => `<ul class="${cls}">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;

/* ════════════════════════════════════════════════════════════
   بخش‌های صفحه
   ════════════════════════════════════════════════════════════ */
function hero(c) {
  return `
  <section class="course-hero"><div class="container">
    <p class="crumbs"><a href="index.html#home">خانه</a> ‹ <a href="index.html#home/courses">دوره‌ها</a> ‹ ${c.title}</p>
    ${c.category ? `<span class="chip">${c.category}</span>` : ''}
    <h1>${c.title}</h1>
    ${c.tagline ? `<p class="tagline">${c.tagline}</p>` : ''}
    ${c.facts ? `<div class="facts">${c.facts.map(([k, v]) => `<div><small>${k}</small><strong>${v}</strong></div>`).join('')}</div>` : ''}
  </div></section>`;
}

function mainColumn(c) {
  const blocks = [];
  if (c.about) blocks.push(`<section class="block"><h2>درباره این دوره</h2><p>${c.about}</p>${c.highlights ? list(c.highlights, 'checks highlights') : ''}</section>`);
  if (c.syllabus) blocks.push(`<section class="block"><h2>سرفصل دوره</h2><ol class="syllabus">${c.syllabus.map(([w, t]) => `<li><small>${w}</small>${t}</li>`).join('')}</ol></section>`);
  if (c.instructors) blocks.push(`<section class="block"><h2>${c.instructors.length > 1 ? 'مدرسین دوره' : 'مدرس دوره'}</h2>${c.instructors.map(p => `
    <div class="person"><div class="avatar" aria-hidden="true">${p.name.replace(/^(مهندس|دکتر)\s*/, '').charAt(0)}</div>
      <div><h3>${p.name}</h3>${p.role ? `<div class="role">${p.role}</div>` : ''}${p.bio ? `<p>${p.bio}</p>` : ''}${p.rating ? `<span class="rating">★ ${p.rating}</span>` : ''}</div>
    </div>`).join('')}</section>`);
  if (c.prerequisites || c.outcomes) blocks.push(`<div class="two-cols">
    ${c.prerequisites ? `<div class="card"><h2>پیش‌نیازها</h2>${list(c.prerequisites)}</div>` : ''}
    ${c.outcomes ? `<div class="card"><h2>آنچه یاد می‌گیرید</h2>${list(c.outcomes)}</div>` : ''}</div>`);
  if (!c.about) blocks.unshift('<div class="notice">اطلاعات کامل این دوره (توضیحات، سرفصل‌ها و زمان‌بندی) به‌زودی اضافه می‌شود. برای اطلاعات بیشتر با ما تماس بگیرید.</div>');
  return `<div class="course-main">${blocks.join('')}</div>`;
}

function aside(id, c) {
  const r = c.registration;
  const others = ORDER.filter(k => k !== id).map(k => `<li><a href="course.html?c=${k}">${COURSES[k].title}<small>${COURSES[k].category}</small></a></li>`).join('');
  return `<aside class="course-aside">
    <div class="card"><h2>ثبت‌نام</h2>
      ${r?.note ? `<p class="aside-note">${r.note}</p>` : ''}
      ${r?.slots?.length ? `<ul class="slots">${r.slots.map(([d, t]) => `<li>${d}<span>${t}</span></li>`).join('')}</ul>` : ''}
      <button type="button" class="btn" data-info="ثبت‌نام در دوره ${c.title}">ثبت‌نام در دوره</button>
      <a class="btn btn-ghost" href="${PHONE_LINK}">تماس برای اطلاعات بیشتر</a>
      ${r?.certificate ? `<p class="cert">${r.certificate}</p>` : ''}
    </div>
    <div class="card"><h2>سایر دوره‌ها</h2><ul class="other-list">${others}</ul></div>
  </aside>`;
}

function pager(id) {
  const i = ORDER.indexOf(id);
  const prev = ORDER[(i - 1 + ORDER.length) % ORDER.length], next = ORDER[(i + 1) % ORDER.length];
  return `<nav class="container pager" aria-label="پیمایش بین دوره‌ها">
    <a href="course.html?c=${prev}"><small>دوره قبلی</small><strong>${COURSES[prev].title}</strong></a>
    <a class="next" href="course.html?c=${next}"><small>دوره بعدی</small><strong>${COURSES[next].title}</strong></a>
  </nav>`;
}

/* ════════════════════════════════════════════════════════════
   رندر صفحه بر اساس ?c=ai
   ════════════════════════════════════════════════════════════ */
const root = $('#course-root');
const id = (new URLSearchParams(location.search).get('c') || '').toLowerCase();

if (COURSES[id]) {
  const c = COURSES[id];
  document.title = `${c.title} | پژوهشسرا شهید احدی`;
  root.innerHTML = hero(c) + `<div class="container course-layout">${mainColumn(c)}${aside(id, c)}</div>` + pager(id);
} else {
  document.title = 'دوره پیدا نشد | پژوهشسرا شهید احدی';
  root.innerHTML = `<section class="container" style="padding-top:140px;text-align:center">
    <h1 style="font-size:32px">این دوره پیدا نشد</h1>
    <p class="sub">آدرس دوره درست نیست.</p><a class="btn" href="index.html#home/courses">بازگشت به دوره‌ها</a></section>`;
}

/* ════════════════════════════════════════════════════════════
   منوی موبایل و پنجره اطلاعات
   ════════════════════════════════════════════════════════════ */
$('#menu-toggle').addEventListener('click', () => {
  const open = $('#site-header').classList.toggle('menu-open');
  $('#menu-toggle').setAttribute('aria-expanded', String(open));
});

const dialog = $('#info-dialog');
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-info]');
  if (!btn) return;
  $('#info-title').textContent = btn.dataset.info;
  $('#info-text').textContent = `برای ثبت‌نام با شماره ${PHONE} تماس بگیرید.`;
  dialog.showModal();
});
$('#info-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
