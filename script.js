'use strict';

/* ════════════════════════════════════════════════════════════
   ابزارهای کوچک
   ════════════════════════════════════════════════════════════ */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const faNum = n => n.toLocaleString('fa-IR');

/* ════════════════════════════════════════════════════════════
   داده‌ها — برنامه هفتگی را با برنامه واقعی جایگزین کن
   ════════════════════════════════════════════════════════════ */
const SUBJECTS = {
  AI:   { label: 'هوش مصنوعی',  icon: '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.91-3 2.5 2.5 0 0 1-1.11-4.5 2.5 2.5 0 0 1 2.58-4.5A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.91-3 2.5 2.5 0 0 0 1.11-4.5 2.5 2.5 0 0 0-2.58-4.5A2.5 2.5 0 0 0 14.5 2Z"/>' },
  CODE: { label: 'برنامه‌نویسی', icon: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/>' },
  WEB:  { label: 'طراحی سایت',   icon: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/>' },
  LAB:  { label: 'آزمایشگاه',    icon: '<path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/><path d="M6.453 15h11.094M8.5 2h7"/>' },
  AST:  { label: 'نجوم',         icon: '<path d="M12 2a10 10 0 1 0 10 10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>' },
  NANO: { label: 'نانو فناوری',  icon: '<path d="M6 18h8M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/>' },
};

// داده‌ها از data.js می‌آیند (با پنل مدیریت ویرایش می‌شوند)
const D = window.SITE_DATA;
Object.keys(SUBJECTS).forEach(k => { if (D.subjects?.[k]) SUBJECTS[k].label = D.subjects[k]; });

const TIME_SLOTS  = D.timeSlots;
const WEEKLY_PLAN = D.weeklyPlan;      // ایندکس ۰ = شنبه … ۵ = پنجشنبه
const COURSES     = D.courses;
const COMPETITIONS = D.competitions;
const ORDINALS    = ['اول', 'دوم', 'سوم', 'چهارم'];
const teachersOf  = c => (c.instructors || []).map(p => p.name).join('، ');

const CONTACT_PHONE = '0918 215 7378';

/* ════════════════════════════════════════════════════════════
   تاریخ شمسی (بدون کتابخانه)
   ════════════════════════════════════════════════════════════ */
const persian = (date, options) => new Intl.DateTimeFormat('fa-IR-u-ca-persian', options).format(date);

function jalali(date = new Date()) {
  return {
    weekday: persian(date, { weekday: 'long' }),                                   // دوشنبه
    short:   persian(date, { year: 'numeric', month: 'numeric', day: 'numeric' }), // ۱۴۰۵/۷/۶
    long:    persian(date, { day: 'numeric', month: 'long', year: 'numeric' }),    // ۶ مهر ۱۴۰۵
  };
}

// هفته ایرانی: شنبه = ۰ … جمعه = ۶
const todayIndex = (date = new Date()) => (date.getDay() + 1) % 7;

function currentWeek() {
  const now = new Date();
  const saturday = new Date(now);
  saturday.setDate(now.getDate() - todayIndex(now));
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(saturday);
    d.setDate(saturday.getDate() + i);
    return { name: jalali(d).weekday, date: jalali(d).short };
  });
}

const sessionsOf = dayIndex =>
  (WEEKLY_PLAN[dayIndex] ?? [])
    .map((key, i) => (SUBJECTS[key] ? { key, label: SUBJECTS[key].label, time: TIME_SLOTS[i] } : null))
    .filter(Boolean);

// لینک «اطلاعات دوره»: دوره‌ای که آیکونش با درس این جلسه یکی است (اگر نباشد، لینکی نمی‌گذارد)
const courseLink = s => {
  const c = COURSES.find(x => x.icon === s.key);
  return c ? `<a class="link" href="course.html?c=${c.id}">اطلاعات دوره</a>` : '';
};

/* ════════════════════════════════════════════════════════════
   قالب‌های HTML
   ════════════════════════════════════════════════════════════ */
const svg = (key, size = 28) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SUBJECTS[key].icon}</svg>`;

const iconBox = (key, size) => `<div class="icon-box">${svg(key, size)}</div>`;
const infoButton = (title, text, cls = 'link') =>
  `<button type="button" class="${cls}" data-info="${title}">${text}</button>`;

/* ════════════════════════════════════════════════════════════
   صفحه خانه
   ════════════════════════════════════════════════════════════ */
function renderHome() {
  const now = jalali();
  $('#today-date').textContent = `${now.weekday} — ${now.long}`;

  const today = sessionsOf(todayIndex());
  $('#today-cards').innerHTML = today.length
    ? today.map(s => `<div class="card">${iconBox(s.key)}<h3>${s.label}</h3><time>${s.time}</time></div>`).join('')
    : '<p class="empty">امروز جلسه‌ای نداریم.</p>';

  $('#goal-cards').innerHTML = [['NANO', 'پژوهش عملی'], ['AST', 'علوم پایه'], ['AI', 'فناوری نوین'], ['LAB', 'آزمایشگاه']]
    .map(([key, label]) => `<div class="card">${iconBox(key)}<h3>${label}</h3></div>`).join('');

  $('#course-cards').innerHTML = COURSES.map(c => `
    <article class="card">${iconBox(c.icon)}<h3>${c.title}</h3>
      ${teachersOf(c) ? `<p>مدرس: ${teachersOf(c)}</p>` : ''}
      <a class="link" href="course.html?c=${c.id}">مشاهده بیشتر ↗</a>
    </article>`).join('');

  $('#competition-cards').innerHTML = COMPETITIONS.map(c => `
    <article class="card card-photo">
      <img src="${c.img}" alt="${c.title}" loading="lazy">
      <div class="body"><h3>${c.title}</h3><p>${c.subtitle}</p><a class="btn" href="competitions.html">اطلاعات بیشتر ↗</a></div>
    </article>`).join('');
}

/* ════════════════════════════════════════════════════════════
   صفحه برنامه هفتگی
   ════════════════════════════════════════════════════════════ */
const week  = currentWeek();
const state = { day: Math.min(todayIndex(), 5), view: 'grid' };

function renderSchedule() {
  const list = sessionsOf(state.day);

  $('#badge-date').textContent = `${jalali().weekday} — ${jalali().short}`;

  $('#day-tabs').innerHTML = week.map((d, i) => `
    <button type="button" role="tab" data-day="${i}" aria-selected="${i === state.day}"
            class="${i === todayIndex() ? 'is-today' : ''}">${d.name}<small>${d.date.slice(5)}</small></button>`).join('');

  $('#day-title').textContent    = week[state.day].name;
  $('#day-subtitle').textContent = `${week[state.day].date} — ${faNum(list.length)} جلسه`;

  const box = $('#session-list');
  box.className = `grid ${state.view === 'grid' ? 'cols-4' : 'is-list'}`;
  box.innerHTML = list.length ? list.map((s, i) => state.view === 'grid'
    ? `<article class="card"><span class="tag">جلسه ${ORDINALS[i]}</span>${iconBox(s.key)}
         <h3>${s.label}</h3><time>${s.time}</time>${courseLink(s)}</article>`
    : `<div class="card"><time>${s.time}</time>${iconBox(s.key, 20)}
         <div class="info"><strong>${s.label}</strong><p>جلسه ${ORDINALS[i]}</p></div>${courseLink(s)}</div>`
  ).join('') : '<p class="empty">این روز جلسه‌ای نداریم.</p>';

  $$('#view-switch button').forEach(b => b.classList.toggle('active', b.dataset.view === state.view));
}

const goToDay = i => { state.day = (i + 6) % 6; renderSchedule(); };

$('#day-tabs').addEventListener('click', e => {
  const tab = e.target.closest('[data-day]');
  if (tab) goToDay(Number(tab.dataset.day));
});
$('#day-prev').addEventListener('click', () => goToDay(state.day - 1));
$('#day-next').addEventListener('click', () => goToDay(state.day + 1));
$('#view-switch').addEventListener('click', e => {
  const btn = e.target.closest('[data-view]');
  if (btn) { state.view = btn.dataset.view; renderSchedule(); }
});

/* ════════════════════════════════════════════════════════════
   مسیریابی با هش: #home ، #home/courses ، #schedule
   (دکمه Back مرورگر هم کار می‌کند)
   ════════════════════════════════════════════════════════════ */
function route() {
  const [name = 'home', section = ''] = location.hash.slice(1).split('/');
  const page = name === 'schedule' ? 'schedule' : 'home';

  $('#page-home').hidden     = page !== 'home';
  $('#page-schedule').hidden = page !== 'schedule';
  $$('#main-nav a[data-page]').forEach(a => a.classList.toggle('active', a.dataset.page === page && !section));

  $('#site-header').classList.remove('menu-open');
  $('#menu-toggle').setAttribute('aria-expanded', 'false');

  const target = section && document.getElementById(section);
  if (target) target.scrollIntoView({ behavior: 'smooth' });
  else window.scrollTo({ top: 0, behavior: 'auto' });
}

window.addEventListener('hashchange', route);

// کلیک روی لینکی که هش‌اش همین حالا فعال است، رویداد hashchange نمی‌سازد
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (link && link.getAttribute('href') === location.hash) { e.preventDefault(); route(); }
});

/* ════════════════════════════════════════════════════════════
   هدر: سایه هنگام اسکرول و منوی موبایل
   ════════════════════════════════════════════════════════════ */
const header = $('#site-header');
window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 40), { passive: true });

$('#menu-toggle').addEventListener('click', () => {
  const open = header.classList.toggle('menu-open');
  $('#menu-toggle').setAttribute('aria-expanded', String(open));
});

/* ════════════════════════════════════════════════════════════
   جستجو
   ════════════════════════════════════════════════════════════ */
const SEARCH_INDEX = [
  ...COURSES.map(c => ({ title: c.title, group: 'دوره‌ها', href: '#home/courses' })),
  ...COMPETITIONS.map(c => ({ title: c.title, group: 'مسابقات', href: '#home/competitions' })),
  { title: 'برنامه هفتگی',   group: 'برنامه',    href: '#schedule' },
  { title: 'اهداف پژوهشسرا', group: 'درباره ما', href: '#home/about' },
];

// «ي» و «ك» عربی و نیم‌فاصله را یکسان می‌کند تا جستجو دقیق‌تر شود
const normalize = s => s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\u200c/g, ' ').trim().toLowerCase();

const searchInput   = $('#search-input');
const searchResults = $('#search-results');
let lastHits = [];

function clearSearch() { searchResults.innerHTML = ''; lastHits = []; }

searchInput.addEventListener('input', () => {
  const q = normalize(searchInput.value);
  lastHits = q.length < 2 ? [] : SEARCH_INDEX
    .filter(item => normalize(`${item.title} ${item.group}`).includes(q)).slice(0, 6);
  searchResults.innerHTML = lastHits
    .map((h, i) => `<li><button type="button" data-hit="${i}">${h.title} <small>— ${h.group}</small></button></li>`).join('');
});

searchResults.addEventListener('click', e => {
  const btn = e.target.closest('[data-hit]');
  if (!btn) return;
  const { href } = lastHits[Number(btn.dataset.hit)];
  searchInput.value = '';
  clearSearch();
  if (href === location.hash) route(); else location.hash = href;
});

searchInput.addEventListener('keydown', e => { if (e.key === 'Escape') { searchInput.value = ''; clearSearch(); } });
document.addEventListener('click', e => { if (!e.target.closest('.search')) clearSearch(); });

/* ════════════════════════════════════════════════════════════
   پنجره جزئیات
   ════════════════════════════════════════════════════════════ */
const dialog = $('#info-dialog');

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-info]');
  if (!btn) return;
  $('#info-title').textContent = btn.dataset.info;
  $('#info-text').textContent  = `جزئیات این بخش به‌زودی اضافه می‌شود. برای ثبت‌نام و اطلاعات بیشتر با شماره ${CONTACT_PHONE} تماس بگیرید.`;
  dialog.showModal();
});
$('#info-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); }); // کلیک روی پس‌زمینه

/* ════════════════════════════════════════════════════════════
   شروع
   ════════════════════════════════════════════════════════════ */
renderHome();
renderSchedule();
route();
