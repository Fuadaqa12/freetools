/* Core: helpers shared by all tools, theme, language menu, search */
(function () {
  'use strict';
  var L = window.L || {}, IC = window.ICONS || {};
  var LANG = document.documentElement.lang || 'en';
  var ROOT = (document.querySelector('meta[name=root]') || {}).content || './';

  function t(k, v) {
    var s = L[k] != null ? L[k] : k;
    if (v) for (var x in v) s = s.split('{' + x + '}').join(v[x]);
    return s;
  }
  function svg(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  var nf = {};
  function num(n, d) {
    if (n == null || !isFinite(n)) return '—';
    d = d == null ? 2 : d;
    var k = d;
    if (!nf[k]) nf[k] = new Intl.NumberFormat(LANG, { maximumFractionDigits: d });
    return nf[k].format(n);
  }
  function money(n) { return num(n, 2); }
  function bytes(b) {
    if (!isFinite(b)) return '—';
    var u = ['B', 'KB', 'MB', 'GB', 'TB'], i = 0;
    while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
    return num(b, i ? (b < 10 ? 2 : 1) : 0) + ' ' + u[i];
  }
  function pnum(v) { if (typeof v === 'number') return v; v = String(v || '').replace(/\s/g, '').replace(',', '.'); return v === '' ? NaN : parseFloat(v); }
  function download(blob, name) {
    var a = document.createElement('a');
    a.href = typeof blob === 'string' ? blob : URL.createObjectURL(blob);
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); if (typeof blob !== 'string') URL.revokeObjectURL(a.href); }, 4000);
  }
  var toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = el('<div class="toast" role="status"></div>'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 1800);
  }
  function copy(text) {
    var done = function () { toast(t('copied')); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() { var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { } ta.remove(); }
  }
  function baseName(n) { return n.replace(/\.[^.]+$/, ''); }
  function debounce(f, ms) { var to; return function () { var a = arguments, s = this; clearTimeout(to); to = setTimeout(function () { f.apply(s, a); }, ms || 200); }; }

  /* file drop zone */
  function dropzone(opts) {
    var mini = opts.mini ? ' mini' : '';
    var z = el('<label class="drop' + mini + '"><input type="file"' + (opts.accept ? ' accept="' + opts.accept + '"' : '') + (opts.multiple ? ' multiple' : '') + '>' +
      '<div class="dic">' + svg(opts.mini ? 'plus' : 'upload') + '</div><div><b>' + esc(opts.label || t(opts.multiple ? 'choose_files' : 'choose_file')) + '</b>' +
      (opts.mini ? '' : '<small>' + esc(opts.hint || t('drop_hint')) + '</small>') + '</div></label>');
    var inp = z.querySelector('input');
    function give(list) {
      var files = Array.prototype.slice.call(list || []);
      if (opts.filter) files = files.filter(opts.filter);
      if (files.length) opts.onFiles(opts.multiple ? files : [files[0]]);
    }
    inp.addEventListener('change', function () { give(inp.files); inp.value = ''; });
    ['dragenter', 'dragover'].forEach(function (e) { z.addEventListener(e, function (ev) { ev.preventDefault(); z.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (e) { z.addEventListener(e, function (ev) { ev.preventDefault(); z.classList.remove('over'); }); });
    z.addEventListener('drop', function (ev) { give(ev.dataTransfer.files); });
    if (opts.paste) document.addEventListener('paste', function (ev) { var it = ev.clipboardData && ev.clipboardData.files; if (it && it.length) give(it); });
    return z;
  }
  function seg(items, val, onChange) {
    var s = el('<div class="seg" role="tablist"></div>');
    items.forEach(function (it) {
      var b = el('<button type="button">' + esc(it[1]) + '</button>');
      if (it[0] === val) b.classList.add('on');
      b.onclick = function () { $$('button', s).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); onChange(it[0]); };
      s.appendChild(b);
    });
    return s;
  }
  function loadImage(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { res(img); };
      img.onerror = function () { rej(new Error('img')); };
      img.src = url;
    });
  }
  function canvasBlob(c, type, q) { return new Promise(function (r) { c.toBlob(r, type, q); }); }


  /* shared UI helpers (batch 2) */
  function rng(label, min, max, val, unit, onIn, step) {
    var r = el('<label class="range"><div><span>' + esc(label) + '</span><output>' + val + (unit || '') + '</output></div><input type="range" min="' + min + '" max="' + max + '" step="' + (step || 1) + '" value="' + val + '"></label>');
    var i = r.querySelector('input'), out = r.querySelector('output');
    i.oninput = function () { out.textContent = i.value + (unit || ''); onIn(+i.value); };
    r.set = function (v) { i.value = v; out.textContent = v + (unit || ''); };
    return r;
  }
  function sel(label, items, val, onChange) {
    var f = el('<label class="f"><span>' + esc(label) + '</span><select class="sel">' + items.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (String(x[0]) === String(val) ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select></label>');
    var s = f.querySelector('select'); s.onchange = function () { onChange(s.value); }; f.input = s; return f;
  }
  function field(label, val, onIn, o) {
    o = o || {};
    var f = el('<label class="f"><span>' + esc(label) + '</span><div class="inp-u"><input class="inp" ' + (o.type ? 'type="' + o.type + '"' : 'inputmode="' + (o.text ? 'text' : 'decimal') + '"') + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + '>' + (o.unit ? '<em>' + esc(o.unit) + '</em>' : '') + '</div></label>');
    var i = f.querySelector('input'); i.value = val == null ? '' : val; i.oninput = function () { onIn(i.value); }; f.input = i; return f;
  }
  function chk(label, val, onChange) {
    var c = el('<label class="chk"><input type="checkbox"' + (val ? ' checked' : '') + '> ' + esc(label) + '</label>');
    c.querySelector('input').onchange = function (e) { onChange(e.target.checked); }; return c;
  }
  function btn(icon, label, cls, onClick) {
    var b = el('<button class="btn ' + (cls || '') + '" type="button">' + (icon ? svg(icon) : '') + '<span>' + esc(label) + '</span></button>');
    b.onclick = onClick; return b;
  }
  /* minimal ZIP (store) */
  var CRC;
  function crc32(u) {
    if (!CRC) { CRC = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
    var x = 0xFFFFFFFF; for (var i = 0; i < u.length; i++) x = CRC[(x ^ u[i]) & 255] ^ (x >>> 8); return (x ^ 0xFFFFFFFF) >>> 0;
  }
  function zip(files) {
    var enc = new TextEncoder(), parts = [], cd = [], off = 0;
    var now = new Date(), dt = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)), dd = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate());
    files.forEach(function (f) {
      var nm = enc.encode(f.name), d = f.data, c = crc32(d);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true); h.setUint32(14, c, true); h.setUint32(18, d.length, true); h.setUint32(22, d.length, true); h.setUint16(26, nm.length, true);
      parts.push(h.buffer, nm, d);
      var e = new DataView(new ArrayBuffer(46));
      e.setUint32(0, 0x02014b50, true); e.setUint16(4, 20, true); e.setUint16(6, 20, true); e.setUint16(8, 0x0800, true); e.setUint16(12, dt, true); e.setUint16(14, dd, true); e.setUint32(16, c, true); e.setUint32(20, d.length, true); e.setUint32(24, d.length, true); e.setUint16(28, nm.length, true); e.setUint32(42, off, true);
      cd.push(e.buffer, nm); off += 30 + nm.length + d.length;
    });
    var size = cd.reduce(function (a, b) { return a + b.byteLength; }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, size, true); end.setUint32(16, off, true);
    return new Blob(parts.concat(cd, [end.buffer]), { type: 'application/zip' });
  }
  function blobBytes(b) { return b.arrayBuffer().then(function (a) { return new Uint8Array(a); }); }
  var pdfjsP;
  function pdfjs() {
    if (!pdfjsP) pdfjsP = import(new URL(ROOT + 'assets/vendor/pdf.min.js', location.href).href).then(function (m) {
      m.GlobalWorkerOptions.workerSrc = new URL(ROOT + 'assets/vendor/pdf.worker.min.js', location.href).href; return m;
    });
    return pdfjsP;
  }

  var TK = window.TK = {
    t: t, svg: svg, esc: esc, el: el, $: $, $$: $$, num: num, money: money, bytes: bytes, pnum: pnum, download: download, toast: toast, copy: copy,
    baseName: baseName, debounce: debounce, rng: rng, sel: sel, field: field, chk: chk, btn: btn, zip: zip, blobBytes: blobBytes, pdfjs: pdfjs, dropzone: dropzone, seg: seg, loadImage: loadImage, canvasBlob: canvasBlob, lang: LANG, root: ROOT,
    engines: {}, register: function (n, f) { this.engines[n] = f; }
  };

  /* theme */
  function applyTheme(th) { document.documentElement.setAttribute('data-theme', th); var b = $('#themeBtn'); if (b) b.innerHTML = svg(th === 'dark' ? 'sun' : 'moon'); }
  var saved; try { saved = localStorage.getItem('theme'); } catch (e) { }
  applyTheme(saved || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

  /* search */
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i'); }
  function searchIdx(q) {
    q = norm(q.trim()); if (!q) return [];
    var parts = q.split(/\s+/), idx = window.IDX || [], out = [];
    idx.forEach(function (it) {
      var hay = norm(it.n + ' ' + it.k + ' ' + it.d), score = 0, ok = true;
      parts.forEach(function (p) { var i = hay.indexOf(p); if (i < 0) ok = false; else score += i === 0 ? 3 : (norm(it.n).indexOf(p) >= 0 ? 2 : 1); });
      if (ok) out.push([score, it]);
    });
    return out.sort(function (a, b) { return b[0] - a[0]; }).map(function (x) { return x[1]; });
  }
  function bindSearch(input, box) {
    var act = -1;
    function render() {
      var r = searchIdx(input.value).slice(0, 8);
      if (!input.value.trim()) { box.classList.remove('on'); return; }
      box.innerHTML = r.length ? r.map(function (it, i) {
        return '<a href="' + ROOT + it.u + '"' + (i === act ? ' class="act"' : '') + '><span class="ic" style="--c:' + it.c + '">' + svg(it.i) + '</span>' + esc(it.n) + '</a>';
      }).join('') : '<div class="empty">' + esc(t('no_results')) + '</div>';
      box.classList.add('on');
    }
    input.addEventListener('input', function () { act = -1; render(); });
    input.addEventListener('keydown', function (e) {
      var links = $$('a', box);
      if (e.key === 'ArrowDown') { act = Math.min(act + 1, links.length - 1); render(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { act = Math.max(act - 1, 0); render(); e.preventDefault(); }
      else if (e.key === 'Enter') { var l = links[act < 0 ? 0 : act]; if (l) location.href = l.href; }
      else if (e.key === 'Escape') { box.classList.remove('on'); input.blur(); }
    });
    document.addEventListener('click', function (e) { if (!box.contains(e.target) && e.target !== input) box.classList.remove('on'); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(document.documentElement.getAttribute('data-theme'));
    var tb = $('#themeBtn');
    if (tb) tb.onclick = function () { var n = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; applyTheme(n); try { localStorage.setItem('theme', n); } catch (e) { } };
    var lg = $('.lang');
    if (lg) {
      $('button', lg).onclick = function (e) { e.stopPropagation(); lg.classList.toggle('on'); };
      document.addEventListener('click', function () { lg.classList.remove('on'); });
      $$('.lang-menu a').forEach(function (a) { a.addEventListener('click', function () { try { localStorage.setItem('lang', a.getAttribute('hreflang')); } catch (e) { } }); });
    }
    /* suggest the visitor's language once (no auto-redirect, good for SEO) */
    try {
      if (!localStorage.getItem('lang')) {
        var want = (navigator.languages || [navigator.language || '']).map(function (x) { return String(x).slice(0, 2).toLowerCase(); });
        var alt = null;
        for (var i = 0; i < want.length && !alt; i++) { if (want[i] === LANG) break; var a = $('.lang-menu a[hreflang="' + want[i] + '"]'); if (a) alt = a; }
        if (alt) {
          var bar = el('<div style="background:var(--brand);color:#fff;font-size:14.5px"><div class="wrap" style="display:flex;gap:12px;align-items:center;justify-content:center;padding:8px 16px;flex-wrap:wrap"><span>🌐</span><a href="' + alt.getAttribute('href') + '" style="color:#fff;font-weight:700">' + esc(alt.firstChild.textContent) + ' →</a><button type="button" aria-label="close" style="background:none;border:0;color:#fff;font-size:18px;cursor:pointer;line-height:1">×</button></div></div>');
          $('button', bar).onclick = function () { bar.remove(); try { localStorage.setItem('lang', LANG); } catch (e) { } };
          document.body.insertBefore(bar, document.body.firstChild);
        }
      }
    } catch (e) { }
    var hs = $('#hsearch'); if (hs) bindSearch(hs, $('#hsres'));
    /* all-tools mega menu */
    var mg = $('.mega');
    if (mg) {
      var mb = $('.mbtn', mg);
      mb.onclick = function (e) { e.stopPropagation(); var on = !mg.classList.contains('on'); mg.classList.toggle('on', on); mb.setAttribute('aria-expanded', on); };
      document.addEventListener('click', function (e) { if (!$('.mega-menu', mg).contains(e.target)) { mg.classList.remove('on'); mb.setAttribute('aria-expanded', 'false'); } });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') mg.classList.remove('on'); });
    }
    /* "/" focuses search */
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable) return;
      var hsx = $('.hsearch'), s = $('#bigsearch') || (hsx && getComputedStyle(hsx).display !== 'none' && $('#hsearch'));
      if (s) { e.preventDefault(); s.focus(); }
    });
    /* recently used tools */
    var RK = 'recentTools', rec = [];
    try { rec = JSON.parse(localStorage.getItem(RK) || '[]'); } catch (e) { }
    var th = $('#tool');
    if (th && th.dataset.id) { rec = [th.dataset.id].concat(rec.filter(function (x) { return x !== th.dataset.id; })).slice(0, 8); try { localStorage.setItem(RK, JSON.stringify(rec)); } catch (e) { } }
    var rg = $('#recentGrid');
    if (rg && rec.length && window.IDX) {
      var html = rec.map(function (id) { var it = (window.IDX || []).filter(function (x) { return x.id === id; })[0]; return it ? '<a class="card mini" href="' + ROOT + it.u + '" style="--c:' + it.c + '"><span class="ic">' + svg(it.i) + '</span><div><b>' + esc(it.n) + '</b></div></a>' : ''; }).join('');
      if (html) { rg.innerHTML = html; $('#recent').classList.remove('hide'); }
    }
    /* favorites */
    var FK = 'favTools', fav = [];
    try { fav = JSON.parse(localStorage.getItem(FK) || '[]'); } catch (e) { }
    function cardHtml(id) { var it = (window.IDX || []).filter(function (x) { return x.id === id; })[0]; return it ? '<a class="card mini" href="' + ROOT + it.u + '" style="--c:' + it.c + '"><span class="ic">' + svg(it.i) + '</span><div><b>' + esc(it.n) + '</b></div></a>' : ''; }
    var fb = $('.favbtn');
    if (fb && th && th.dataset.id) {
      var fid = th.dataset.id;
      var fset = function () { var on = fav.indexOf(fid) >= 0; fb.classList.toggle('on', on); fb.querySelector('b').textContent = on ? fb.dataset.on : fb.dataset.off; fb.setAttribute('aria-pressed', on); };
      fb.onclick = function () { var i = fav.indexOf(fid); if (i >= 0) fav.splice(i, 1); else fav.unshift(fid); fav = fav.slice(0, 12); try { localStorage.setItem(FK, JSON.stringify(fav)); } catch (e) { } fset(); };
      fset();
    }
    var fg = $('#favGrid');
    if (fg && fav.length && window.IDX) { var fh = fav.map(cardHtml).join(''); if (fh) { fg.innerHTML = fh; $('#favs').classList.remove('hide'); } }
    /* reveal on scroll */
    if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -40px 0px' });
      $$('.tiles .tile,.hiw-i,.cta').forEach(function (x) { x.classList.add('rv'); io.observe(x); });
    }

    /* home: filter grid */
    var big = $('#bigsearch');
    if (big) {
      var cards = $$('[data-q]'), secs = $$('.sec[data-cat]'), empty = $('#noRes');
      big.addEventListener('input', function () {
        var q = norm(big.value.trim()), any = false;
        secs.forEach(function (s) {
          var vis = 0;
          $$('[data-q]', s).forEach(function (c) { var ok = !q || q.split(/\s+/).every(function (p) { return norm(c.getAttribute('data-q')).indexOf(p) >= 0; }); c.classList.toggle('hide', !ok); if (ok) vis++; });
          s.classList.toggle('hide', !vis); if (vis) any = true;
        });
        ['#popular', '#fresh', '#cats', '#favs'].forEach(function (id) { var x = $(id); if (x) x.classList.toggle('hide', !!q); });
        var rc = $('#recent'); if (rc && q) rc.classList.add('hide');
        if (empty) empty.classList.toggle('hide', any);
      });
    }

    /* mount tool */
    var host = $('#tool');
    if (host) {
      var name = host.getAttribute('data-engine'), opts = {};
      try { opts = JSON.parse(host.getAttribute('data-opts') || '{}'); } catch (e) { }
      var f = TK.engines[name];
      if (f) { host.innerHTML = ''; try { f(host, opts, TK); } catch (e) { host.innerHTML = '<p class="err">' + esc(t('error')) + '</p>'; console.error(e); } }
    }

    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('/sw.js').catch(function () { });
    /* ads */
    if (window.ADS_CLIENT) $$('ins.adsbygoogle').forEach(function () { try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { } });
  });
})();
