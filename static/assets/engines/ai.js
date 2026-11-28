/* AI tools that run fully in the browser: OCR (tesseract.js), more modes added below */
TK.register('ai', function (root, o, K) {
  var t = K.t, el = K.el, esc = K.esc, svg = K.svg;
  var V = new URL(K.root + 'assets/vendor/', location.href).href;

  function progress() {
    var w = el('<div class="stack hide" style="gap:8px;padding:18px 0"><div class="row" style="justify-content:space-between"><span class="muted pl"></span><b class="pv">0%</b></div><div style="height:8px;border-radius:99px;background:var(--line);overflow:hidden"><div class="pb" style="height:100%;width:0;background:linear-gradient(90deg,#5b4cf5,#ec4899);transition:width .2s"></div></div></div>');
    w.set = function (label, p) { w.classList.remove('hide'); w.querySelector('.pl').textContent = label; var v = Math.max(0, Math.min(100, Math.round(p * 100))); w.querySelector('.pv').textContent = v + '%'; w.querySelector('.pb').style.width = v + '%'; };
    w.hide = function () { w.classList.add('hide'); };
    return w;
  }

  function scripts(list) { return list.reduce(function (p, src) { return p.then(function () { return new Promise(function (res, rej) { if (document.querySelector('script[data-s="' + src + '"]')) return res(); var x = document.createElement('script'); x.src = V + src; x.dataset.s = src; x.onload = res; x.onerror = rej; document.head.appendChild(x); }); }); }, Promise.resolve()); }

  var bgLib = null;
  function segment(f, prog) {
    prog.set(t('ai_loading_model'), 0);
    return (bgLib ? Promise.resolve(bgLib) : import(V + 'bg/bgr.js').then(function (m) { bgLib = m; return m; })).then(function (m) {
      return m.removeBackground(f, {
        publicPath: V + 'bg/', model: 'isnet_quint8', output: { format: 'image/png' },
        progress: function (key, cur, total) { if (/fetch/.test(key)) prog.set(t('ai_loading_model'), total ? cur / total : 0); else prog.set(t('ai_working'), total ? cur / total : 0.5); }
      });
    }).then(function (blob) { return createImageBitmap(blob); });
  }
  function imgBox(label, checker) {
    return el('<figure style="flex:1 1 240px;margin:0"><figcaption class="muted" style="font-size:13px;margin-bottom:6px">' + esc(label) + '</figcaption><canvas style="width:100%;max-height:440px;object-fit:contain;border-radius:12px;' + (checker ? 'background:repeating-conic-gradient(#e5e7eb 0 25%,#fff 0 50%) 0 0/20px 20px' : 'background:var(--soft)') + '"></canvas></figure>');
  }

  ({ ocr: ocr, bg: bg, up: up, blurbg: blurbg, passport: passport })[o.mode]();

  /* ---------- OCR ---------- */
  function ocr() {
    var LANGS = [['eng', 'English'], ['rus', 'Русский'], ['spa', 'Español'], ['por', 'Português'], ['fra', 'Français'], ['deu', 'Deutsch'], ['tur', 'Türkçe'], ['aze', 'Azərbaycan'], ['ara', 'العربية'], ['hin', 'हिन्दी'], ['ita', 'Italiano'], ['pol', 'Polski'], ['ukr', 'Українська'], ['nld', 'Nederlands'], ['ind', 'Indonesia'], ['vie', 'Tiếng Việt'], ['kaz', 'Қазақ'], ['jpn', '日本語'], ['chi_sim', '中文 (简体)'], ['chi_tra', '中文 (繁體)'], ['kor', '한국어']];
    var MAP = { en: 'eng', ru: 'rus', es: 'spa', pt: 'por', fr: 'fra', de: 'deu', tr: 'tur', az: 'aze', ar: 'ara', hi: 'hin', it: 'ita', pl: 'pol', uk: 'ukr', nl: 'nld', id: 'ind', vi: 'vie', kk: 'kaz', ja: 'jpn', zh: 'chi_sim', ko: 'kor' };
    var LOCAL = { eng: 1, rus: 1 };
    var lang = MAP[K.lang] || 'eng', worker = null, wLang = null, file = null;
    var dz = K.dropzone({ accept: 'image/*', hint: t('drop_hint_img'), paste: true, onFiles: function (f) { load(f[0]); } });
    var top = el('<div class="panel stack"></div>');
    top.append(K.sel(t('ocr_lang'), LANGS, lang, function (v) { lang = v; if (file) run(); }));
    top.append(el('<p class="muted" style="margin:0;font-size:13px">' + esc(t('ai_local_note')) + '</p>'));
    var prog = progress();
    var view = el('<div class="stack hide"></div>');
    var prev = el('<img alt="" style="max-width:100%;max-height:320px;border-radius:12px;object-fit:contain;align-self:center;background:var(--soft)">');
    var out = el('<textarea class="inp" rows="12" dir="auto" style="width:100%"></textarea>');
    var bar = el('<div class="row end"></div>');
    bar.append(
      K.btn('copy', t('copy'), 'sec', function () { K.copy(out.value); }),
      K.btn('download', t('download') + ' TXT', '', function () { K.download(new Blob([out.value], { type: 'text/plain;charset=utf-8' }), K.baseName(file ? file.name : 'text') + '.txt'); }),
      K.btn('upload', t('start_over'), 'sec', function () { file = null; view.classList.add('hide'); dz.classList.remove('hide'); })
    );
    view.append(prev, el('<b>' + esc(t('result')) + '</b>'), out, bar);
    root.append(top, dz, prog, view);

    function load(f) {
      if (!/^image\//.test(f.type)) { K.toast(t('cannot_read')); return; }
      file = f; prev.src = URL.createObjectURL(f); dz.classList.add('hide'); run();
    }
    function getWorker() {
      if (worker && wLang === lang) return Promise.resolve(worker);
      var old = worker; worker = null; if (old) old.terminate();
      var lp = LOCAL[lang] ? V + 'ocr/lang' : 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/' + lang + '/4.0.0_best_int';
      return Tesseract.createWorker(lang === 'eng' ? 'eng' : lang + '+eng', 1, {
        workerPath: V + 'ocr/worker.min.js', corePath: V + 'ocr/', langPath: lp, workerBlobURL: false,
        logger: function (m) { if (m.status === 'recognizing text') prog.set(t('ocr_reading'), m.progress); else prog.set(t('ai_loading_model'), m.progress || 0); }
      }).then(function (w) { worker = w; wLang = lang; return w; });
    }
    function run() {
      view.classList.add('hide'); prog.set(t('ai_loading_model'), 0);
      getWorker().then(function (w) { return w.recognize(file); }).then(function (r) {
        prog.hide(); out.value = (r.data.text || '').trim();
        if (!out.value) out.value = t('ocr_nothing');
        view.classList.remove('hide');
      }).catch(function (e) { console.error(e); prog.hide(); K.toast(t('error')); dz.classList.remove('hide'); });
    }
  }

  /* ---------- background removal (IS-Net, onnxruntime-web) ---------- */
  function bg() {
    var lib = null, file = null, cut = null, bgMode = 'none', bgCol = '#ffffff';
    var dz = K.dropzone({ accept: 'image/*', hint: t('drop_hint_img'), paste: true, onFiles: function (f) { load(f[0]); } });
    var note = el('<p class="muted" style="margin:0 0 4px;font-size:13px">' + esc(t('ai_local_note')) + '</p>');
    var prog = progress();
    var view = el('<div class="stack hide"></div>');
    var cmp = el('<div class="row" style="gap:12px;align-items:stretch;flex-wrap:wrap"></div>');
    var a = el('<figure style="flex:1 1 240px;margin:0"><figcaption class="muted" style="font-size:13px;margin-bottom:6px"></figcaption><img alt="" style="width:100%;max-height:420px;object-fit:contain;border-radius:12px;background:var(--soft)"></figure>');
    var b = el('<figure style="flex:1 1 240px;margin:0"><figcaption class="muted" style="font-size:13px;margin-bottom:6px"></figcaption><canvas style="width:100%;max-height:420px;object-fit:contain;border-radius:12px;background:repeating-conic-gradient(#e5e7eb 0 25%,#fff 0 50%) 0 0/20px 20px"></canvas></figure>');
    a.querySelector('figcaption').textContent = t('f_original');
    b.querySelector('figcaption').textContent = t('result');
    cmp.append(a, b);
    var opts = el('<div class="panel stack"></div>');
    var colIn = el('<input type="color" value="#ffffff" style="width:44px;height:36px;border:0;background:none;cursor:pointer">');
    var colWrap = el('<div class="row hide" style="gap:8px;align-items:center"></div>'); colWrap.append(colIn);
    opts.append(K.seg([['none', t('transparent')], ['white', t('white')], ['color', t('bg_color')]], 'none', function (v) { bgMode = v; colWrap.classList.toggle('hide', v !== 'color'); draw(); }), colWrap);
    colIn.oninput = function () { bgCol = colIn.value; draw(); };
    var bar = el('<div class="row end"></div>');
    bar.append(
      K.btn('upload', t('start_over'), 'sec', function () { file = cut = null; view.classList.add('hide'); dz.classList.remove('hide'); }),
      K.btn('download', t('download') + ' PNG', '', function () { var c = b.querySelector('canvas'); K.canvasBlob(c, 'image/png').then(function (bl) { K.download(bl, K.baseName(file.name) + '-no-bg.png'); }); })
    );
    view.append(cmp, opts, bar);
    root.append(note, dz, prog, view);

    function draw() {
      if (!cut) return;
      var c = b.querySelector('canvas'); c.width = cut.width; c.height = cut.height;
      var x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height);
      if (bgMode !== 'none') { x.fillStyle = bgMode === 'white' ? '#ffffff' : bgCol; x.fillRect(0, 0, c.width, c.height); }
      x.drawImage(cut, 0, 0);
    }
    function load(f) {
      if (!/^image\//.test(f.type)) { K.toast(t('cannot_read')); return; }
      file = f; dz.classList.add('hide'); view.classList.add('hide'); a.querySelector('img').src = URL.createObjectURL(f);
      prog.set(t('ai_loading_model'), 0);
      (lib ? Promise.resolve(lib) : import(V + 'bg/bgr.js').then(function (m) { lib = m; return m; })).then(function (m) {
        return m.removeBackground(f, {
          publicPath: V + 'bg/', model: 'isnet_quint8', output: { format: 'image/png' },
          progress: function (key, cur, total) { if (/fetch/.test(key)) prog.set(t('ai_loading_model'), total ? cur / total : 0); else prog.set(t('ai_working'), total ? cur / total : 0.5); }
        });
      }).then(function (blob) {
        return createImageBitmap(blob);
      }).then(function (bmp) {
        cut = bmp; prog.hide(); draw(); view.classList.remove('hide');
      }).catch(function (e) { console.error(e); prog.hide(); K.toast(t('error')); dz.classList.remove('hide'); });
    }
  }

  /* ---------- photo upscaler (ESRGAN slim, TensorFlow.js) ---------- */
  function up() {
    var file = null, img = null, scale = 2, ups = {}, outC = null;
    var dz = K.dropzone({ accept: 'image/*', hint: t('drop_hint_img'), paste: true, onFiles: function (f) { load(f[0]); } });
    var top = el('<div class="panel stack"></div>');
    top.append(K.seg([['2', '2×'], ['4', '4×']], '2', function (v) { scale = +v; if (img) run(); }), el('<p class="muted" style="margin:0;font-size:13px">' + esc(t('ai_local_note')) + '</p>'));
    var prog = progress();
    var view = el('<div class="stack hide"></div>');
    var info = el('<div class="row" style="gap:10px;flex-wrap:wrap"></div>');
    var box = el('<div style="overflow:auto;max-height:520px;border-radius:12px;background:var(--soft)"></div>');
    var bar = el('<div class="row end"></div>');
    bar.append(
      K.btn('upload', t('start_over'), 'sec', function () { file = img = outC = null; view.classList.add('hide'); dz.classList.remove('hide'); }),
      K.btn('download', t('download') + ' PNG', '', function () { K.canvasBlob(outC, 'image/png').then(function (b) { K.download(b, K.baseName(file.name) + '-' + scale + 'x.png'); }); })
    );
    view.append(info, box, bar);
    root.append(top, dz, prog, view);

    function load(f) {
      if (!/^image\//.test(f.type)) { K.toast(t('cannot_read')); return; }
      file = f; dz.classList.add('hide');
      K.loadImage(f).then(function (i) { img = i; run(); }).catch(function () { K.toast(t('cannot_read')); dz.classList.remove('hide'); });
    }
    function getUp() {
      if (ups[scale]) return Promise.resolve(ups[scale]);
      return scripts(['up/tf.min.js', 'up/upscaler.min.js', 'up/m' + scale + '.js']).then(function () {
        var def = window['ESRGANSlim' + scale + 'x']; def = Object.assign({}, def, { path: V + 'up/x' + scale + '/model.json' }); delete def._internals;
        ups[scale] = new window.Upscaler({ model: def }); return ups[scale];
      });
    }
    function run() {
      view.classList.add('hide'); prog.set(t('ai_loading_model'), 0);
      var max = scale === 4 ? 700 : 1400, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, max / Math.max(w, h));
      var src = document.createElement('canvas'); src.width = Math.round(w * k); src.height = Math.round(h * k);
      src.getContext('2d').drawImage(img, 0, 0, src.width, src.height);
      getUp().then(function (u) {
        prog.set(t('ai_working'), 0);
        return u.execute(src, { patchSize: 64, padding: 4, output: 'tensor', progress: function (p) { prog.set(t('ai_working'), p); } });
      }).then(function (tensor) {
        outC = document.createElement('canvas');
        return window.tf.browser.toPixels(tensor.div(255).clipByValue(0, 1), outC).then(function () { tensor.dispose(); });
      }).then(function () {
        prog.hide(); box.innerHTML = ''; outC.style.cssText = 'display:block;max-width:100%;height:auto;margin:auto'; box.append(outC);
        info.innerHTML = '<span class="chip">' + w + '×' + h + ' px</span><span class="chip">→</span><span class="chip" style="font-weight:700">' + outC.width + '×' + outC.height + ' px</span>';
        view.classList.remove('hide');
      }).catch(function (e) { console.error(e); prog.hide(); K.toast(t('error')); dz.classList.remove('hide'); });
    }
  }

  /* ---------- portrait mode: blur the background ---------- */
  function blurbg() {
    var file = null, src = null, cut = null, amt = 12;
    var dz = K.dropzone({ accept: 'image/*', hint: t('drop_hint_img'), paste: true, onFiles: function (f) { load(f[0]); } });
    var note = el('<p class="muted" style="margin:0 0 4px;font-size:13px">' + esc(t('ai_local_note')) + '</p>');
    var prog = progress();
    var view = el('<div class="stack hide"></div>');
    var out = imgBox(t('result'));
    var opts = el('<div class="panel stack"></div>');
    opts.append(K.rng(t('strength'), 2, 40, amt, 'px', function (v) { amt = v; draw(); }));
    var bar = el('<div class="row end"></div>');
    bar.append(
      K.btn('upload', t('start_over'), 'sec', function () { file = cut = null; view.classList.add('hide'); dz.classList.remove('hide'); }),
      K.btn('download', t('download') + ' JPG', '', function () { K.canvasBlob(out.querySelector('canvas'), 'image/jpeg', 0.92).then(function (b) { K.download(b, K.baseName(file.name) + '-portrait.jpg'); }); })
    );
    view.append(out, opts, bar);
    root.append(note, dz, prog, view);
    function draw() {
      var c = out.querySelector('canvas'), w = src.naturalWidth, h = src.naturalHeight; c.width = w; c.height = h;
      var x = c.getContext('2d'), k = Math.max(w, h) / 1000;
      x.filter = 'blur(' + Math.round(amt * k) + 'px)'; x.drawImage(src, -amt * k, -amt * k, w + 2 * amt * k, h + 2 * amt * k); x.filter = 'none';
      x.drawImage(cut, 0, 0, w, h);
    }
    function load(f) {
      if (!/^image\//.test(f.type)) { K.toast(t('cannot_read')); return; }
      file = f; dz.classList.add('hide'); view.classList.add('hide');
      K.loadImage(f).then(function (i) { src = i; return segment(f, prog); }).then(function (bmp) { cut = bmp; prog.hide(); draw(); view.classList.remove('hide'); })
        .catch(function (e) { console.error(e); prog.hide(); K.toast(t('error')); dz.classList.remove('hide'); });
    }
  }

  /* ---------- passport / ID photo ---------- */
  function passport() {
    var SIZES = [['35x45', '35×45 mm — EU, UK, AZ, TR, IN'], ['30x40', '30×40 mm (3×4) — RU, AZ, KZ'], ['51x51', '2×2 in (51×51 mm) — USA, IN visa'], ['33x48', '33×48 mm — China'], ['50x70', '50×70 mm — Canada']];
    var file = null, cut = null, size = '35x45', bgc = '#ffffff', zoom = 1, dy = 0, dx = 0, auto = null;
    var dz = K.dropzone({ accept: 'image/*', hint: t('drop_hint_img'), paste: true, onFiles: function (f) { load(f[0]); } });
    var note = el('<p class="muted" style="margin:0 0 4px;font-size:13px">' + esc(t('passport_tip')) + '</p>');
    var prog = progress();
    var view = el('<div class="stack hide"></div>');
    var wrap = el('<div class="row" style="gap:16px;align-items:flex-start;flex-wrap:wrap"></div>');
    var pc = el('<canvas style="width:220px;max-width:100%;border-radius:6px;box-shadow:0 4px 18px rgba(0,0,0,.15)"></canvas>');
    var opts = el('<div class="stack" style="flex:1 1 260px"></div>');
    var colIn = el('<input type="color" value="#ffffff" style="width:44px;height:36px;border:0;background:none;cursor:pointer">');
    var bgRow = el('<div class="row" style="gap:8px;align-items:center;flex-wrap:wrap"></div>');
    [['#ffffff', t('white')], ['#e8eef7', t('light_blue')], ['#d9dde3', t('light_gray')]].forEach(function (c) {
      var b = el('<button type="button" class="btn sec sm" style="gap:6px"><i style="display:inline-block;width:14px;height:14px;border-radius:4px;border:1px solid #ccc;background:' + c[0] + '"></i>' + esc(c[1]) + '</button>');
      b.onclick = function () { bgc = c[0]; colIn.value = c[0]; draw(); }; bgRow.append(b);
    });
    bgRow.append(colIn); colIn.oninput = function () { bgc = colIn.value; draw(); };
    var zr = K.rng(t('zoom'), 70, 140, 100, '%', function (v) { zoom = v / 100; draw(); });
    var yr = K.rng(t('move_v'), -20, 20, 0, '', function (v) { dy = v / 100; draw(); });
    var xr = K.rng(t('move_h'), -20, 20, 0, '', function (v) { dx = v / 100; draw(); });
    opts.append(K.sel(t('photo_size'), SIZES, size, function (v) { size = v; draw(); }), el('<b style="font-size:14px">' + esc(t('bg_color')) + '</b>'), bgRow, zr, yr, xr);
    wrap.append(pc, opts);
    var bar = el('<div class="row end"></div>');
    bar.append(
      K.btn('upload', t('start_over'), 'sec', function () { file = cut = null; view.classList.add('hide'); dz.classList.remove('hide'); }),
      K.btn('grid2', t('print_sheet'), 'sec', function () { sheet().then(function (b) { K.download(b, 'passport-photos-10x15.jpg'); }); }),
      K.btn('download', t('download') + ' JPG', '', function () { K.canvasBlob(pc, 'image/jpeg', 0.95).then(function (b) { K.download(b, 'passport-photo-' + size + 'mm.jpg'); }); })
    );
    view.append(wrap, bar);
    root.append(note, dz, prog, view);

    function harden(bmp) {
      var c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height; var x = c.getContext('2d'); x.drawImage(bmp, 0, 0);
      var im = x.getImageData(0, 0, c.width, c.height), d = im.data;
      for (var i = 3; i < d.length; i += 4) d[i] = Math.max(0, Math.min(255, (d[i] - 90) * 2.2));
      // keep only the largest connected blob (removes stray specks)
      var W = c.width, H = c.height, lab = new Int32Array(W * H), best = 0, bestN = 0, id = 0, st = [];
      for (var p0 = 0; p0 < W * H; p0++) {
        if (lab[p0] || d[p0 * 4 + 3] < 128) continue;
        id++; var n = 0; st.push(p0); lab[p0] = id;
        while (st.length) { var q = st.pop(); n++; var qx = q % W, qy = (q - qx) / W;
          if (qx > 0 && !lab[q - 1] && d[(q - 1) * 4 + 3] >= 128) { lab[q - 1] = id; st.push(q - 1); }
          if (qx < W - 1 && !lab[q + 1] && d[(q + 1) * 4 + 3] >= 128) { lab[q + 1] = id; st.push(q + 1); }
          if (qy > 0 && !lab[q - W] && d[(q - W) * 4 + 3] >= 128) { lab[q - W] = id; st.push(q - W); }
          if (qy < H - 1 && !lab[q + W] && d[(q + W) * 4 + 3] >= 128) { lab[q + W] = id; st.push(q + W); } }
        if (n > bestN) { bestN = n; best = id; }
      }
      // pixels not near the main blob are cleared (keep soft edge within 3px)
      var keep = new Uint8Array(W * H);
      for (var y = 0; y < H; y++) for (var xx = 0; xx < W; xx++) if (lab[y * W + xx] === best) for (var oy = -3; oy <= 3; oy += 3) for (var ox = -3; ox <= 3; ox += 3) { var yy = y + oy, x2 = xx + ox; if (yy >= 0 && yy < H && x2 >= 0 && x2 < W) keep[yy * W + x2] = 1; }
      for (var k2 = 0; k2 < W * H; k2++) if (!keep[k2] && lab[k2] !== best) d[k2 * 4 + 3] = 0;
      x.putImageData(im, 0, 0); return c;
    }
    function dims() { var p = size.split('x'); return [+p[0], +p[1]]; }
    function analyse() {
      var w = cut.width, h = cut.height, c = document.createElement('canvas'), sc = Math.min(1, 400 / Math.max(w, h));
      c.width = Math.round(w * sc); c.height = Math.round(h * sc); var x = c.getContext('2d'); x.drawImage(cut, 0, 0, c.width, c.height);
      var d = x.getImageData(0, 0, c.width, c.height).data, rows = [];
      for (var y = 0; y < c.height; y++) { var l = -1, r = -1; for (var i = 0; i < c.width; i++) if (d[(y * c.width + i) * 4 + 3] > 128) { if (l < 0) l = i; r = i; } rows.push([l, r]); }
      var top = rows.findIndex(function (q) { return q[0] >= 0; }); if (top < 0) return null;
      // head width: median of widths in the band 10%..30% of the remaining height
      var span = c.height - top, ws = [], cx = [];
      for (var yy = top + Math.round(span * 0.06); yy < top + Math.round(span * 0.22); yy++) if (rows[yy] && rows[yy][0] >= 0) { ws.push(rows[yy][1] - rows[yy][0]); cx.push((rows[yy][1] + rows[yy][0]) / 2); }
      ws.sort(function (a, b) { return a - b; }); cx.sort(function (a, b) { return a - b; });
      var hw = ws[Math.floor(ws.length * 0.7)] || c.width * 0.3, mid = cx[Math.floor(cx.length / 2)] || c.width / 2;
      return { top: top / sc, hw: hw / sc, cx: mid / sc };
    }
    function draw(target, pw, ph) {
      var md = dims(), W = pw || Math.round(md[0] / 25.4 * 600), H = ph || Math.round(md[1] / 25.4 * 600);
      var c = target || pc; c.width = W; c.height = H; var x = c.getContext('2d');
      x.fillStyle = bgc; x.fillRect(0, 0, W, H);
      var a = auto || { top: 0, hw: cut.width * 0.4, cx: cut.width / 2 };
      var headH = a.hw * 1.45, cropH = headH / 0.72 / zoom, cropW = cropH * W / H;
      var sx = a.cx - cropW / 2 - dx * cropW, sy = a.top - cropH * 0.07 - dy * cropH;
      x.drawImage(cut, sx, sy, cropW, cropH, 0, 0, W, H);
    }
    function sheet() {
      var md = dims(), dpi = 300, SW = Math.round(152.4 / 25.4 * dpi), SH = Math.round(101.6 / 25.4 * dpi), pw = Math.round(md[0] / 25.4 * dpi), ph = Math.round(md[1] / 25.4 * dpi), gap = Math.round(dpi * 0.12);
      var s = document.createElement('canvas'); s.width = SW; s.height = SH; var x = s.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, SW, SH);
      var one = document.createElement('canvas'); draw(one, pw, ph);
      var cols = Math.floor((SW - gap) / (pw + gap)), rws = Math.floor((SH - gap) / (ph + gap));
      var ox = (SW - cols * (pw + gap) + gap) / 2, oy = (SH - rws * (ph + gap) + gap) / 2;
      x.strokeStyle = '#bbb'; x.lineWidth = 1;
      for (var r = 0; r < rws; r++) for (var q = 0; q < cols; q++) { var px = ox + q * (pw + gap), py = oy + r * (ph + gap); x.drawImage(one, px, py); x.strokeRect(px - 0.5, py - 0.5, pw + 1, ph + 1); }
      return K.canvasBlob(s, 'image/jpeg', 0.95);
    }
    function load(f) {
      if (!/^image\//.test(f.type)) { K.toast(t('cannot_read')); return; }
      file = f; dz.classList.add('hide'); view.classList.add('hide'); zoom = 1; dx = dy = 0; zr.set(100); yr.set(0); xr.set(0);
      segment(f, prog).then(function (bmp) { cut = harden(bmp); auto = analyse(); prog.hide(); draw(); view.classList.remove('hide'); })
        .catch(function (e) { console.error(e); prog.hide(); K.toast(t('error')); dz.classList.remove('hide'); });
    }
  }
});
