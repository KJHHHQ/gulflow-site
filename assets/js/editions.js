/* ==========================================================================
   湾流智能 GULFLOW —— Editions 交互层脚本
   --------------------------------------------------------------------------
   与 assets/css/editions.css 配套使用，参考来源：Shopify Editions | Winter '26

   设计原则：
   1. 单一 IntersectionObserver 统一驱动所有入场，避免多个观察器抢性能
   2. 所有行为都做「元素存在性 + 能力检测」，缺元素自动跳过，绝不抛错
   3. 不做滚动监听里的重计算；scroll 只用于章节高亮，且 rAF 节流
   4. reduced-motion 下不注册任何动画，内容直接可见
   ========================================================================== */
(function () {
  'use strict';

  /* 通知 HTML 里的保险丝：脚本已就绪，可以保留 .ez-js 的隐藏初态 */
  window.__ezOk = true;

  var doc = document;
  var root = doc.documentElement;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var hasIO = 'IntersectionObserver' in window;

  /* ======================================================================
     1. 入场序号自动编号（原页 animation-delay 步长 40ms）
     ====================================================================== */
  function numberStagger(container, itemSelector) {
    var items = itemSelector
      ? container.querySelectorAll(itemSelector)
      : container.children;
    for (var i = 0; i < items.length; i++) {
      items[i].style.setProperty('--i', i);
    }
  }

  function initStaggerNumbers() {
    var i;

    var staggers = doc.querySelectorAll('.ez-stagger');
    for (i = 0; i < staggers.length; i++) numberStagger(staggers[i], null);

    /* 3D 入场的卡片在各自栅格里单独编号，避免整页串成一条长队 */
    var stages = doc.querySelectorAll('.ez-stage');
    for (i = 0; i < stages.length; i++) numberStagger(stages[i], '.ez-drop');
  }

  /* ======================================================================
     2. 涂鸦上浮层（原 emoji-rise + --random-scale）
     ====================================================================== */
  var DOODLE_ICONS = [
    'ez-ico--spark', 'ez-ico--check', 'ez-ico--plus',
    'ez-ico--arrow', 'ez-ico--diag', 'ez-ico--terminal', 'ez-ico--play'
  ];
  var DOODLE_TONES = ['', 'ez-doodle--brand', 'ez-doodle--violet'];

  function initDoodles() {
    var layers = doc.querySelectorAll('[data-doodles]');
    for (var l = 0; l < layers.length; l++) {
      var layer = layers[l];
      if (layer.getAttribute('data-ez-built')) continue;

      var count = parseInt(layer.getAttribute('data-doodles'), 10) || 10;
      var html = '';

      for (var i = 0; i < count; i++) {
        var x = 4 + Math.random() * 92;              /* 横向散布 */
        var y = 14 + Math.random() * 74;             /* 纵向散布 */
        var size = Math.round(13 + Math.random() * 19);
        var scale = (0.7 + Math.random() * 0.85).toFixed(2);  /* 原 --random-scale */
        var delay = (Math.random() * 2.4).toFixed(2);
        var dur = (3.6 + Math.random() * 3.2).toFixed(2);
        var icon = DOODLE_ICONS[(Math.random() * DOODLE_ICONS.length) | 0];
        var tone = DOODLE_TONES[(Math.random() * DOODLE_TONES.length) | 0];

        html += '<span class="ez-doodle ' + tone + '" aria-hidden="true" style="' +
          '--x:' + x.toFixed(1) + '%;' +
          '--y:' + y.toFixed(1) + '%;' +
          '--s:' + size + 'px;' +
          '--random-scale:' + scale + ';' +
          '--d:' + delay + 's;' +
          '--dur:' + dur + 's">' +
          '<i class="ez-ico ' + icon + '"></i></span>';
      }

      layer.innerHTML = html;
      layer.setAttribute('data-ez-built', '1');
    }
  }

  /* 涂鸦可重复播放：进入视口上浮一次，离开后复位，再次进入再来一次 */
  function watchDoodleLayers() {
    var layers = doc.querySelectorAll('[data-doodles]');
    if (!layers.length || !hasIO) return;

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        var doodles = e.target.children;
        for (var d = 0; d < doodles.length; d++) {
          if (e.isIntersecting) doodles[d].classList.add('is-in');
          else doodles[d].classList.remove('is-in');
        }
      }
    }, { threshold: 0.12 });

    for (var l = 0; l < layers.length; l++) io.observe(layers[l]);
  }

  /* ======================================================================
     3. 统一入场观察器
     ====================================================================== */
  var REVEAL_SELECTOR = '.ez-in, .ez-stagger, .ez-media, .ez-rule, .ez-draw, .ez-drop';

  function revealTarget(el) {
    /* 错峰容器：给每个子元素加 .is-in，让位移各自发生 */
    if (el.classList.contains('ez-stagger')) {
      for (var i = 0; i < el.children.length; i++) {
        el.children[i].classList.add('is-in');
      }
      el.classList.add('is-in');
      return;
    }
    el.classList.add('is-in');
  }

  function initReveal() {
    var targets = doc.querySelectorAll(REVEAL_SELECTOR);
    if (!targets.length) return;

    /* 不支持观察器（或用户要求减弱动效）时，直接全部显示 */
    if (!hasIO || reduce) {
      for (var k = 0; k < targets.length; k++) revealTarget(targets[k]);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        revealTarget(entries[i].target);
        io.unobserve(entries[i].target);   /* 入场只播一次 */
      }
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08
    });

    for (var t = 0; t < targets.length; t++) io.observe(targets[t]);

    /* 动画播完后摘掉 forwards，让 hover 位移完全交给 CSS 过渡 */
    doc.addEventListener('animationend', function (e) {
      if (e.target && e.target.classList && e.target.classList.contains('ez-drop')) {
        e.target.classList.add('is-done');
      }
    }, true);
  }

  /* ======================================================================
     4. 轨道粒子（原 orbit-path）
     ====================================================================== */
  function initOrbits() {
    var hosts = doc.querySelectorAll('[data-orbit]');
    for (var h = 0; h < hosts.length; h++) {
      var host = hosts[h];
      if (host.getAttribute('data-ez-built')) continue;

      var count = parseInt(host.getAttribute('data-orbit'), 10) || 3;
      var dur = parseFloat(host.getAttribute('data-orbit-dur')) || 22;
      var html = '';

      for (var i = 0; i < count; i++) {
        var size = 6 + Math.round(Math.random() * 5);
        /* 每条轨道略微不同的半径与周期，避免同步转动显得机械 */
        var rx = 40 + Math.random() * 8;
        var ry = 34 + Math.random() * 10;
        var d = (dur + Math.random() * 10).toFixed(1);
        var delay = (-Math.random() * d).toFixed(1);

        html += '<span class="ez-orbit-dot" aria-hidden="true" style="' +
          '--dot:' + size + 'px;' +
          '--rx:' + rx.toFixed(1) + '%;' +
          '--ry:' + ry.toFixed(1) + '%;' +
          '--dur:' + d + 's;' +
          '--delay:' + delay + 's"></span>';
      }

      var wrap = doc.createElement('div');
      wrap.className = 'ez-orbit';
      wrap.setAttribute('aria-hidden', 'true');
      wrap.innerHTML = html;
      host.appendChild(wrap);
      host.setAttribute('data-ez-built', '1');
    }
  }

  /* ======================================================================
     5. 章节导航 + 滚动高亮
     参考页每章末尾都有 Back to navigation，说明常驻章节索引是它的核心体感。
     ====================================================================== */
  function initChapters() {
    var sections = doc.querySelectorAll('[data-chapter]');
    if (sections.length < 3) return;

    var rail = doc.createElement('nav');
    rail.className = 'ez-chapters';
    rail.setAttribute('aria-label', '页面章节导航');
    var links = [];

    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i];
      if (!sec.id) sec.id = 'ez-ch-' + (i + 1);

      var a = doc.createElement('a');
      a.href = '#' + sec.id;
      a.innerHTML = '<b>' + sec.getAttribute('data-chapter') + '</b><i></i>';
      rail.appendChild(a);
      links.push({ el: a, target: sec });
    }

    doc.body.appendChild(rail);

    /* 滚动高亮：rAF 节流，只做位置比较，不读样式 */
    var ticking = false;
    function update() {
      ticking = false;
      var probe = window.innerHeight * 0.36;
      var active = 0;
      for (var i = 0; i < links.length; i++) {
        var rect = links[i].target.getBoundingClientRect();
        if (rect.top <= probe) active = i;
      }
      for (var j = 0; j < links.length; j++) {
        links[j].el.classList.toggle('is-active', j === active);
      }
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* ======================================================================
     6. 需求预设 → 跨页带参（把参考页的装饰性 slash 列表改成真实获客入口）
     ====================================================================== */
  function initPresets() {
    var items = doc.querySelectorAll('.ez-slash');
    if (!items.length) return;

    for (var i = 0; i < items.length; i++) {
      items[i].addEventListener('click', function () {
        var text = this.getAttribute('data-preset-text') || '';
        var type = this.getAttribute('data-preset-type') || '';
        var url = 'contact.html?preset=' + encodeURIComponent(text);
        if (type) url += '&type=' + encodeURIComponent(type);
        window.location.href = url;
      });
    }
  }

  /* ======================================================================
     7. 联系页：把预设回填进表单
     ====================================================================== */
  function initPresetPrefill() {
    var form = doc.getElementById('leadForm');
    if (!form) return;

    var params = new URLSearchParams(window.location.search);
    var preset = params.get('preset');
    if (!preset) return;

    var detail = doc.getElementById('detail');
    var type = doc.getElementById('type');

    if (detail && !detail.value.trim()) {
      detail.value = preset;
      detail.classList.add('ez-prefilled');
    }

    if (type && params.get('type')) {
      var wanted = params.get('type');
      for (var i = 0; i < type.options.length; i++) {
        if (type.options[i].text === wanted) { type.selectedIndex = i; break; }
      }
    }

    /* 回填完成后清掉查询参数，刷新不会重复触发 */
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    /* 滚动到表单并给出一次高亮，让用户明确「东西已经填好了」 */
    setTimeout(function () {
      var target = doc.getElementById('leadForm');
      if (!target) return;
      var top = target.getBoundingClientRect().top + window.pageYOffset - 130;
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
      target.classList.add('ez-attract');
      setTimeout(function () { target.classList.remove('ez-attract'); }, 2200);
    }, 260);
  }

  /* ======================================================================
     8. 链接文字穿行（原 nav-item-in）
     参考页的导航项在裁切窗里上下穿行。这里用同一原理做悬停：
     两层文字叠在同一个 overflow:hidden 的格子里，悬停时上下互换。
     由脚本自动包装，避免在 8 个页面里手改十几处链接。
     ====================================================================== */
  function initSwapLinks() {
    if (reduce) return;

    var links = doc.querySelectorAll('.nav-links > a, .site-footer ul a');

    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (a.getAttribute('data-ez-swap')) continue;
      if (a.querySelector('svg, img, use, picture')) continue;   /* 含图标的跳过 */

      var text = a.textContent.replace(/\s+/g, ' ').trim();
      if (!text || text.length > 24) continue;

      var wrap = doc.createElement('span');
      wrap.className = 'ez-swap';
      wrap.innerHTML =
        '<span>' + text + '</span>' +
        '<span aria-hidden="true">' + text + '</span>';

      a.textContent = '';
      a.appendChild(wrap);
      a.setAttribute('data-ez-swap', '1');
    }
  }

  /* ======================================================================
     9. 跑马灯克隆（原页把整段内容复制一份做无缝循环，同一手法）
     ====================================================================== */
  function initMarquee() {
    var tracks = doc.querySelectorAll('.ez-marquee-track');
    for (var i = 0; i < tracks.length; i++) {
      var track = tracks[i];
      if (track.getAttribute('data-ez-cloned')) continue;
      track.innerHTML += track.innerHTML;
      track.setAttribute('data-ez-cloned', '1');
    }
  }

  /* ======================================================================
     启动
     ====================================================================== */
  function boot() {
    initStaggerNumbers();
    initDoodles();
    initOrbits();
    initReveal();
    watchDoodleLayers();
    initChapters();
    initPresets();
    initPresetPrefill();
    initSwapLinks();
    initMarquee();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
