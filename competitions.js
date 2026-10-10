'use strict';

/* ════════════════════════════════════════════════════════════
   داده‌ها از data.js می‌آیند (با پنل مدیریت ویرایش می‌شوند)
   date: تاریخ میلادی ISO با ساعت ایران یا null ؛ place و details اختیاری
   ════════════════════════════════════════════════════════════ */
const PHONE = '0918 215 7378';
const COMPETITIONS = window.SITE_DATA.competitions;

/* ════════════════════════════════════════════════════════════
   ابزارها
   ════════════════════════════════════════════════════════════ */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const faNum = n => Number(n).toLocaleString('fa-IR');

const time = c => (c.date ? new Date(c.date).getTime() : null);
const jalaliDate = c => new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(c.date));

// soon = تاریخ هنوز اعلام نشده ، upcoming = در آینده ، past = گذشته
function statusOf(c, now = Date.now()) {
  const t = time(c);
  if (t === null || Number.isNaN(t)) return 'soon';
  return t > now ? 'upcoming' : 'past';
}
const STATUS_LABEL = { soon: 'به‌زودی', upcoming: 'پیش‌رو', past: 'برگزار شد' };

/* ════════════════════════════════════════════════════════════
   نزدیک‌ترین مسابقه + شمارش معکوس
   ════════════════════════════════════════════════════════════ */
let timer = null;

function renderNext() {
  const box = $('#next-comp');
  clearInterval(timer);

  const next = COMPETITIONS.filter(c => statusOf(c) === 'upcoming').sort((a, b) => time(a) - time(b))[0];
  if (!next) {
    box.innerHTML = '<div class="notice">زمان مسابقه‌ی بعدی به‌زودی اعلام می‌شود. برای اطلاع از آخرین خبرها با پژوهشسرا تماس بگیرید.</div>';
    return;
  }

  box.innerHTML = `
    <article class="next-card">
      <img src="${next.img}" alt="${next.title}">
      <div class="next-body">
        <h3>${next.title}</h3>
        <p>${next.subtitle}</p>
        <p class="when">${jalaliDate(next)}${next.place ? ` — ${next.place}` : ''}</p>
        <div class="countdown" role="timer" aria-live="off">
          <div><strong id="cd-d">۰</strong><small>روز</small></div>
          <div><strong id="cd-h">۰</strong><small>ساعت</small></div>
          <div><strong id="cd-m">۰</strong><small>دقیقه</small></div>
          <div><strong id="cd-s">۰</strong><small>ثانیه</small></div>
        </div>
        <div><button type="button" class="btn" data-info="${next.id}">اطلاعات و ثبت‌نام</button></div>
      </div>
    </article>`;

  const tick = () => {
    const left = Math.max(0, Math.floor((time(next) - Date.now()) / 1000));
    if (left === 0) { renderAll(); return; }            // مسابقه شروع شد → لیست دوباره حساب شود
    $('#cd-d').textContent = faNum(Math.floor(left / 86400));
    $('#cd-h').textContent = faNum(Math.floor(left % 86400 / 3600));
    $('#cd-m').textContent = faNum(Math.floor(left % 3600 / 60));
    $('#cd-s').textContent = faNum(left % 60);
  };
  tick();
  timer = setInterval(tick, 1000);
}

/* ════════════════════════════════════════════════════════════
   لیست مسابقات با فیلتر
   ════════════════════════════════════════════════════════════ */
let filter = 'all';

function renderGrid() {
  const shown = COMPETITIONS.filter(c => {
    const s = statusOf(c);
    return filter === 'all' || (filter === 'past' ? s === 'past' : s !== 'past');
  });

  $('#comp-grid').innerHTML = shown.length ? shown.map(c => {
    const s = statusOf(c);
    return `
    <article class="card card-photo">
      <span class="status ${s}">${STATUS_LABEL[s]}</span>
      <img src="${c.img}" alt="${c.title}" loading="lazy">
      <div class="body">
        <h3>${c.title}</h3>
        <p>${c.subtitle}</p>
        <p class="when">${s === 'soon' ? 'زمان برگزاری به‌زودی اعلام می‌شود' : jalaliDate(c)}</p>
        <div class="card-actions"><button type="button" class="btn" data-info="${c.id}">اطلاعات بیشتر</button></div>
      </div>
    </article>`;
  }).join('') : '<p class="notice" style="grid-column:1/-1">مسابقه‌ای در این دسته نداریم.</p>';

  $$('#filters button').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
}

$('#filters').addEventListener('click', e => {
  const b = e.target.closest('[data-filter]');
  if (b) { filter = b.dataset.filter; renderGrid(); }
});

function renderAll() { renderNext(); renderGrid(); }

/* ════════════════════════════════════════════════════════════
   پنجره اطلاعات
   ════════════════════════════════════════════════════════════ */
const dialog = $('#info-dialog');

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-info]');
  if (!btn) return;
  const c = COMPETITIONS.find(x => x.id === btn.dataset.info);
  if (!c) return;
  const rows = [
    `<p>${c.subtitle}</p>`,
    c.date ? `<p><strong>زمان:</strong> ${jalaliDate(c)}</p>` : '',
    c.place ? `<p><strong>مکان:</strong> ${c.place}</p>` : '',
    c.details ? `<p>${c.details}</p>` : '',
    `<p>برای ثبت‌نام و اطلاعات بیشتر با شماره <bdi dir="ltr">${PHONE}</bdi> تماس بگیرید.</p>`,
  ];
  $('#info-title').textContent = c.title;
  $('#info-body').innerHTML = rows.join('');
  dialog.showModal();
});
$('#info-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

/* ════════════════════════════════════════════════════════════
   منوی موبایل + شروع
   ════════════════════════════════════════════════════════════ */
$('#menu-toggle').addEventListener('click', () => {
  const open = $('#site-header').classList.toggle('menu-open');
  $('#menu-toggle').setAttribute('aria-expanded', String(open));
});

renderAll();
