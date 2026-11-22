/* boot.js — بيظبط الوضع واللغة قبل ما الصفحة ترسم (عشان الشاشة ما ترفرفش).
   كان سكربت مكتوب جوه الصفحة؛ اتنقل لملف عشان سياسة الأمان (CSP) تمنع
   أي سكربت مكتوب جوه الصفحة. */
(function () {
  try {
    var t = localStorage.getItem('ikhlas_theme');
    if (t !== 'dark' && t !== 'light') t = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    var l = localStorage.getItem('ikhlas_lang');
    if (l !== 'ar' && l !== 'en') l = 'ar';
    document.documentElement.setAttribute('lang', l);
    document.documentElement.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr');
    if (l === 'en') document.documentElement.classList.add('lang-en');
  } catch (e) {}
  document.documentElement.classList.add('js');
})();
