/* حالت پیش‌نمایش: وقتی از پنل «پیش‌نمایش سایت» را بزنی، سایت پیش‌نویس ذخیره‌شده را نشان می‌دهد */
(() => {
  try {
    if (location.search.includes('preview=1')) sessionStorage.setItem('site-preview', '1');
    if (sessionStorage.getItem('site-preview') !== '1') return;
    const draft = localStorage.getItem('site-draft');
    if (!draft) return;
    window.SITE_DATA = JSON.parse(draft);

    const bar = document.createElement('div');
    const exit = document.createElement('a');
    exit.href = '#'; exit.textContent = 'خروج از پیش‌نمایش';
    exit.style.cssText = 'color:#fff;text-decoration:underline;margin-inline-start:12px';
    exit.onclick = e => { e.preventDefault(); sessionStorage.removeItem('site-preview'); location.reload(); };
    bar.textContent = 'حالت پیش‌نمایش — این تغییرات هنوز منتشر نشده‌اند.';
    bar.append(exit);
    bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:999;background:#c4561a;color:#fff;text-align:center;padding:6px;font-size:14px';
    document.body.append(bar);
  } catch (e) { /* اگر حافظه مرورگر در دسترس نبود، نسخه منتشرشده نشان داده می‌شود */ }
})();
