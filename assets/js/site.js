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
    if (meta) meta.setAttribute('content', t === 'dark' ? '#060D1A' : '#F3F5F8');
  }

  applyTheme(currentTheme());

  var themeBtn = $('#themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function (ev) {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!document.startViewTransition || reduce) { applyTheme(next); return; }
      root.style.setProperty('--vt-x', ev.clientX + 'px');
      root.style.setProperty('--vt-y', ev.clientY + 'px');
      root.classList.add('theme-vt');
      var done = function () { root.classList.remove('theme-vt'); };
      document.startViewTransition(function () { applyTheme(next); }).finished.then(done, done);
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

  /* ======================================================================
     الإضافات الجديدة
     ====================================================================== */

  /* ---------- عدّاد متحرك لأرقام شريط الثقة ---------- */
  var counters = $$('[data-count]');
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var start = performance.now(), dur = 1200;
    (function step(now) {
      var k = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * e) + suffix;
      if (k < 1) requestAnimationFrame(step);
    })(start);
  }
  if ('IntersectionObserver' in window && counters.length) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- إضاءة بتتبع الماوس على الكروت ---------- */
  if (window.matchMedia && matchMedia('(hover:hover)').matches) {
    $$('.card, .contact-card, .step, .hero-card').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- تمييز القسم الحالي في القائمة ---------- */
  var navLinks = $$('.nav-links a');
  if ('IntersectionObserver' in window && navLinks.length) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) { var t = $(a.getAttribute('href')); if (t) spy.observe(t); });
  }

  /* ---------- زرار الرجوع لفوق ---------- */
  var toTop = $('#toTop');
  if (toTop) {
    var onTop = function () { toTop.classList.toggle('show', window.scrollY > 900); };
    window.addEventListener('scroll', onTop, { passive: true });
    onTop();
    toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* ---------- شريط التقدم (للمتصفحات اللي مش بتدعم scroll-timeline) ---------- */
  var bar = $('.progress');
  if (bar && !(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'))) {
    var onProg = function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? window.scrollY / h : 0) + ')';
    };
    window.addEventListener('scroll', onProg, { passive: true });
    onProg();
  }

  /* ---------- مُنشئ طلب واتساب ----------
     مفيش أي بيانات بتتبعت لسيرفر — بنبني رسالة ونفتح واتساب بيها.
     كل النصوص بتتعمل لها encodeURIComponent عشان محدش يقدر يحقن رابط. */
  var form = $('#orderForm');
  if (form) {
    var prod = $('#oProduct'), unit = $('#oUnit'), qtyEl = $('#oQty');
    var syncUnit = function () {
      unit.querySelector('[value="bag"]').disabled = prod.value === 'steel';
      if (prod.value === 'steel') unit.value = 'ton';
    };
    prod.addEventListener('change', syncUnit);
    syncUnit();
    var clean = function (v) { return String(v || '').replace(/\s+/g, ' ').trim().slice(0, 80); };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = T[root.getAttribute('lang')] || T.ar;
      var qty = parseFloat(qtyEl.value);
      if (!(qty > 0)) { qtyEl.setCustomValidity(d['order.err']); qtyEl.reportValidity(); qtyEl.focus(); return; }
      qtyEl.setCustomValidity('');
      var lines = [
        d['order.msgHi'],
        '• ' + d['order.msgP'] + ': ' + d[prod.value === 'steel' ? 'order.steel' : 'order.cement'],
        '• ' + d['order.msgQ'] + ': ' + qty + ' ' + d[unit.value === 'bag' ? 'order.bag' : 'order.ton']
      ];
      var size = clean($('#oSize').value), place = clean($('#oPlace').value);
      if (size) lines.push('• ' + d['order.msgS'] + ': ' + size);
      if (place) lines.push('• ' + d['order.msgL'] + ': ' + place);
      window.open('https://wa.me/201006859418?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
    qtyEl.addEventListener('input', function () { qtyEl.setCustomValidity(''); });
  }
})();
