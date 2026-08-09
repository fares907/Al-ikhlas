/* ==========================================================================
   site.js — تفاعلات الموقع
   سكربت عادي بسيط، من غير أي مكتبات خارجية.
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* من هنا بس بنسمح للـ CSS يخفي عناصر الحركة.
     لو السكربت ده مجاش أصلاً، الصفحة بتفضل ظاهرة عادي. */
  document.documentElement.classList.add('js');

  var root = document.documentElement;

  /* ======================================================================
     الوضع الليلي / النهاري
     ====================================================================== */
  var THEME_KEY = 'ikhlas_theme';

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function currentTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (saved === 'dark' || saved === 'light') return saved;
    return systemPrefersDark() ? 'dark' : 'light';
  }
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    // لون شريط المتصفح على الموبايل يمشي مع الوضع
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#15110D' : '#F5F2EA');
  }

  applyTheme(currentTheme());

  var themeBtn = $('#themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  }

  // لو المستخدم غيّر إعداد النظام ولسه مختارش يدوياً، نمشي معاه
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onSys = function (e) {
      var saved = null;
      try { saved = localStorage.getItem(THEME_KEY); } catch (err) {}
      if (!saved) applyTheme(e.matches ? 'dark' : 'light');
    };
    if (mq.addEventListener) mq.addEventListener('change', onSys);
    else if (mq.addListener) mq.addListener(onSys);
  }

  /* ======================================================================
     اللغة: عربي / إنجليزي
     ====================================================================== */
  var LANG_KEY = 'ikhlas_lang';
  var T = window.I18N || { ar: {}, en: {} };

  function currentLang() {
    var saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
    if (saved === 'ar' || saved === 'en') return saved;
    // الافتراضي عربي — شركة محلية وأغلب زوارها عرب
    return 'ar';
  }

  function applyLang(lang) {
    var dict = T[lang] || T.ar;

    root.setAttribute('lang', lang);
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    root.classList.toggle('lang-en', lang === 'en');

    // النصوص
    $$('[data-t]').forEach(function (el) {
      var v = dict[el.getAttribute('data-t')];
      if (v !== undefined) el.innerHTML = v;
    });

    // الخصائص: data-ta="aria-label|key"
    $$('[data-ta]').forEach(function (el) {
      el.getAttribute('data-ta').split(',').forEach(function (pair) {
        var bits = pair.split('|');
        var v = dict[bits[1]];
        if (bits[0] && v !== undefined) el.setAttribute(bits[0], v);
      });
    });

    // عنوان الصفحة ووصفها
    if (dict['doc.title']) document.title = dict['doc.title'];
    var desc = $('meta[name="description"]');
    if (desc && dict['doc.desc']) desc.setAttribute('content', dict['doc.desc']);

    // الزرار بيعرض اللغة اللي هتتحول ليها
    var lb = $('#langBtn');
    if (lb) lb.textContent = lang === 'ar' ? 'EN' : 'ع';

    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  }

  applyLang(currentLang());

  var langBtn = $('#langBtn');
  if (langBtn) {
    langBtn.addEventListener('click', function () {
      applyLang(root.getAttribute('lang') === 'ar' ? 'en' : 'ar');
    });
  }

  /* ---------- الهيدر: خط فاصل يظهر بعد التمرير ---------- */
  var header = $('#header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('stuck', window.scrollY > 12);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- قائمة الموبايل ---------- */
  var burger = $('#burger');
  var menu = $('#mobileMenu');

  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }

  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // تقفل لما تدوس على أي لينك جواها
    $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });

    // تقفل بـ Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    // تقفل لو الشاشة كبرت وبقت الروابط ظاهرة فوق
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1000) closeMenu();
    });
  }

  /* ---------- زرار الاتصال في الهيدر يظهر على الشاشات الكبيرة بس ---------- */
  var navCta = $('.nav-cta');
  function syncCta() {
    if (!navCta) return;
    navCta.style.display = window.innerWidth >= 1000 ? 'inline-flex' : 'none';
  }
  window.addEventListener('resize', syncCta);
  syncCta();

  /* ---------- الظهور التدريجي عند التمرير ---------- */
  var items = $$('.reveal');
  function revealAll() { items.forEach(function (el) { el.classList.add('in'); }); }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    items.forEach(function (el) { io.observe(el); });

    /* شبكة أمان: لو المراقب ما اشتغلش لأي سبب (متصفح غريب، تبويب في
       الخلفية، إعداد أمان) بنظهّر كل حاجة بعد ثانية ونص. أحسن من
       إن الزاير يشوف صفحة فاضية. */
    setTimeout(function () {
      if (!document.querySelector('.reveal.in')) revealAll();
    }, 1500);
  } else {
    revealAll();
  }

  /* ---------- الشريط المتحرك: بنكرر المحتوى عشان اللف يبقى متصل ---------- */
  var track = $('#marqueeTrack');
  if (track) {
    track.innerHTML += track.innerHTML;
  }

  /* ---------- تمرير ناعم مع مراعاة ارتفاع الهيدر ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY -
                ((header ? header.offsetHeight : 0) + 12);
      window.scrollTo({ top: top, behavior: 'smooth' });
      history.replaceState(null, '', id);
    });
  });
})();
