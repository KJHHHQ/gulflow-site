/* ==========================================================================
   湾流智能 GULFLOW —— 全站交互脚本
   零依赖、零外部请求，可直接用 file:// 打开
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- 1. 顶部导航：滚动收起 + 进度条 ---------------------------- */
  var header = document.querySelector('.site-header');
  var progress = document.getElementById('progress');
  var toTop = document.getElementById('toTop');

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle('is-stuck', y > 24);
    if (toTop) toTop.classList.toggle('is-show', y > 620);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? Math.min(y / h, 1) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 2. 移动端抽屉菜单 ---------------------------------------- */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');

  function closeDrawer() {
    if (!drawer || !burger) return;
    drawer.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
  }
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = drawer.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('is-locked', open);
    });
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeDrawer);
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  /* ---------- 3. 滚动揭示动画（带子元素错峰） -------------------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        // 同组子元素自动错峰
        var kids = el.parentElement ? Array.prototype.slice.call(el.parentElement.children) : [];
        var idx = kids.indexOf(el);
        el.style.setProperty('--d', Math.min(idx, 5) * 0.09 + 's');
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- 4. 数字滚动 ------------------------------------------------- */
  var counters = document.querySelectorAll('[data-count]');
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var dec = (el.getAttribute('data-dec') | 0);
    var dur = 1500;
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(dec);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && !reduceMotion) {
    var ioNum = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        runCount(en.target);
        ioNum.unobserve(en.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { ioNum.observe(el); });
  } else {
    counters.forEach(function (el) {
      el.textContent = parseFloat(el.getAttribute('data-count')).toFixed(el.getAttribute('data-dec') | 0);
    });
  }

  /* ---------- 5. 卡片光晕跟随 + 3D 倾斜 ---------------------------------- */
  if (isFine && !reduceMotion) {
    document.querySelectorAll('.card, .plan, .case-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width) * 100;
        var y = ((e.clientY - r.top) / r.height) * 100;
        card.style.setProperty('--mx', x + '%');
        card.style.setProperty('--my', y + '%');
        if (card.classList.contains('tilt')) {
          var rx = ((y - 50) / 50) * -3.4;
          var ry = ((x - 50) / 50) * 3.4;
          card.style.transform = 'translateY(-6px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
        }
      });
      card.addEventListener('mouseleave', function () {
        if (card.classList.contains('tilt')) card.style.transform = '';
      });
    });
  }

  /* ---------- 6. 磁吸按钮 ------------------------------------------------- */
  if (isFine && !reduceMotion) {
    document.querySelectorAll('[data-magnet]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var mx = (e.clientX - r.left - r.width / 2) / r.width;
        var my = (e.clientY - r.top - r.height / 2) / r.height;
        el.style.transform = 'translate(' + mx * 9 + 'px,' + (my * 9 - 2) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- 7. 自定义光标 + 聚光层 ------------------------------------- */
  if (isFine && !reduceMotion) {
    var dot = document.createElement('div');
    var ring = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.classList.add('has-cursor');

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;
    var spot = document.getElementById('spotlight');

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      if (spot) {
        spot.style.opacity = '1';
        spot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      }
    });
    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      requestAnimationFrame(loop);
    })();

    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest('a, button, .card, input, textarea, select, .stack-item');
      ring.classList.toggle('is-hover', !!t);
    });
    document.addEventListener('mouseleave', function () {
      dot.style.opacity = '0'; ring.style.opacity = '0';
      if (spot) spot.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function () {
      dot.style.opacity = '1'; ring.style.opacity = '1';
    });
  }

  /* ---------- 8. Hero 粒子星链 ------------------------------------------- */
  var canvas = document.getElementById('heroCanvas');
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext('2d');
    var dots = [];
    var mouse = { x: null, y: null };
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;

    function sizeCanvas() {
      var box = canvas.parentElement.getBoundingClientRect();
      W = box.width; H = box.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }
    function build() {
      var count = Math.round(Math.min(W / 16, 96));
      count = Math.max(count, 26);
      dots = [];
      for (var i = 0; i < count; i++) {
        dots.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.34,
          vy: (Math.random() - 0.5) * 0.34,
          r: Math.random() * 1.5 + 0.7
        });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > W) d.vx *= -1;
        if (d.y < 0 || d.y > H) d.vy *= -1;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245,241,230,0.72)';
        ctx.fill();

        for (var j = i + 1; j < dots.length; j++) {
          var o = dots[j];
          var dx = d.x - o.x, dy = d.y - o.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 138) {
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(o.x, o.y);
            ctx.strokeStyle = 'rgba(211,175,55,' + (0.24 * (1 - dist / 138)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        if (mouse.x !== null) {
          var mdx = d.x - mouse.x, mdy = d.y - mouse.y;
          var md = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md < 190) {
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = 'rgba(247,232,191,' + (0.32 * (1 - md / 190)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    window.addEventListener('resize', sizeCanvas);
    window.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    document.addEventListener('mouseleave', function () { mouse.x = null; });
    sizeCanvas();
    draw();
  }

  /* ---------- 9. Hero 终端打字机 ----------------------------------------- */
  var term = document.getElementById('terminalBody');
  if (term) {
    var lines = [
      '<span class="tk-c">$</span> <span class="tk-f">gulflow</span> init --project=your-idea',
      '<span class="tk-k">✔</span> 需求拆解 …… <span class="tk-s">done</span>',
      '<span class="tk-k">✔</span> 架构设计 …… <span class="tk-s">done</span>',
      '<span class="tk-k">✔</span> 敏捷迭代 …… <span class="tk-s">sprint 03/06</span>',
      '<span class="tk-k">●</span> 正在部署 <span class="tk-s">production</span>',
      '<span class="tk-c">// 平均 6 周上线首个可用版本</span>'
    ];
    var li = 0;
    var caret = '<span class="caret"></span>';
    var out = '';

    // 按「可见字符」逐字截断 HTML：跳过标签，保留样式
    function sliceByChars(html, n) {
      var shown = '';
      var k = 0;
      for (var i = 0; i < html.length; i++) {
        if (k >= n) break;
        if (html[i] === '<') {
          var close = html.indexOf('>', i);
          if (close === -1) break;
          shown += html.slice(i, close + 1);
          i = close;
        } else {
          shown += html[i];
          k++;
        }
      }
      // 补齐未闭合的 span，避免样式外溢
      var opens = (shown.match(/<span/g) || []).length;
      var closes = (shown.match(/<\/span>/g) || []).length;
      for (var c = 0; c < opens - closes; c++) shown += '</span>';
      return shown;
    }

    function typeLine() {
      if (li >= lines.length) {
        setTimeout(function () { term.innerHTML = ''; out = ''; li = 0; typeLine(); }, 3600);
        return;
      }
      var html = lines[li];
      var total = html.replace(/<[^>]+>/g, '').length;
      var n = 0;
      var timer = setInterval(function () {
        n++;
        term.innerHTML = out + sliceByChars(html, n) + caret;
        if (n >= total) {
          clearInterval(timer);
          out += html + '\n';
          li++;
          setTimeout(typeLine, 380);
        }
      }, 20);
    }
    setTimeout(typeLine, 1400);
  }

  /* ---------- 10. FAQ 手风琴 ---------------------------------------------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', function () {
      var open = item.classList.contains('is-open');
      item.parentElement.querySelectorAll('.faq-item').forEach(function (o) {
        o.classList.remove('is-open');
        var oa = o.querySelector('.faq-a');
        if (oa) oa.style.maxHeight = '0px';
      });
      if (!open) {
        item.classList.add('is-open');
        a.style.maxHeight = a.scrollHeight + 40 + 'px';
      }
    });
  });

  /* ---------- 11. 案例筛选 ----------------------------------------------- */
  var filters = document.querySelectorAll('.filter');
  var caseItems = document.querySelectorAll('.case-item');
  if (filters.length && caseItems.length) {
    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filters.forEach(function (b) { b.classList.remove('is-on'); });
        btn.classList.add('is-on');
        var key = btn.getAttribute('data-filter');
        caseItems.forEach(function (item) {
          var match = key === 'all' || (item.getAttribute('data-cat') || '').indexOf(key) > -1;
          item.classList.toggle('is-hide', !match);
          if (match) {
            item.classList.remove('is-in');
            void item.offsetWidth;
            item.classList.add('is-in');
          }
        });
      });
    });
  }

  /* ---------- 12. 表单校验（纯前端演示，未接后端） ----------------------- */
  var form = document.getElementById('leadForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.getElementById('formMsg');
      var name = form.querySelector('[name="name"]');
      var phone = form.querySelector('[name="phone"]');
      var valid = true;

      [name, phone].forEach(function (f) {
        if (!f) return;
        var bad = !f.value.trim() || (f === phone && !/^1[3-9]\d{9}$/.test(f.value.replace(/\s|-/g, '')));
        f.style.borderColor = bad ? 'rgba(255,107,74,.85)' : '';
        if (bad) valid = false;
      });

      if (!valid) {
        if (msg) {
          msg.className = 'form-msg';
          msg.textContent = '';
        }
        return;
      }
      if (msg) {
        msg.className = 'form-msg ok';
        msg.textContent = '提交成功（演示环境，未发送到服务器）。正式上线时把 action 指到你的表单服务即可。';
      }
      form.reset();
    });

    // 手机号只允许数字
    var phoneInput = form.querySelector('[name="phone"]');
    if (phoneInput) {
      phoneInput.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').slice(0, 11);
      });
    }
  }

  /* ---------- 13. 跑马灯内容克隆（无缝循环） ----------------------------- */
  document.querySelectorAll('.marquee-track').forEach(function (track) {
    if (track.getAttribute('data-cloned')) return;
    track.innerHTML += track.innerHTML;
    track.setAttribute('data-cloned', '1');
  });

  /* ---------- 14. 当前页导航高亮 ----------------------------------------- */
  var path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .drawer a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === path) a.classList.add('is-active');
  });

  /* ---------- 15. 年份自动填充 ------------------------------------------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
