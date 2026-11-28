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

  ({ ocr: ocr, bg: bg, up: up, blurbg: blurbg, passport: passport, faces: faces, sticker: sticker, stt: stt, pfp: pfp, ageemo: ageemo })[o.mode]();

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
    var view = el('<div class="stack hide" style="margin-top:14px"></div>');
    var prev = el('<img alt="" style="max-width:100%;max-height:320px;border-radius:12px;object-fit:contain;align-self:center;background:var(--soft)">');
    var out = el('<textarea class="inp" rows="12" dir="auto" style="width:100%"></textarea>');
    var bar = el('<div class="acts"></div>');
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
    var view = el('<div class="stack hide" style="margin-top:14px"></div>');
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
    var bar = el('<div class="acts"></div>');
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
    var view = el('<div class="stack hide" style="margin-top:14px"></div>');
    var info = el('<div class="row" style="gap:10px;flex-wrap:wrap"></div>');
    var box = el('<div style="overflow:auto;max-height:520px;border-radius:12px;background:var(--soft)"></div>');
    var bar = el('<div class="acts"></div>');
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
    var view = el('<div class="stack hide" style="margin-top:14px"></div>');
    var out = imgBox(t('result'));
    var opts = el('<div class="panel stack"></div>');
    opts.append(K.rng(t('strength'), 2, 40, amt, 'px', function (v) { amt = v; draw(); }));
    var bar = el('<div class="acts"></div>');
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
    var view = el('<div class="stack hide" style="margin-top:14px"></div>');
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
    var bar = el('<div class="acts"></div>');
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

  /* ---------- auto face blur (SSD MobileNet, face-api) ---------- */
  function faces() {
    var file = null, img = null, boxes = [], mode = 'blur', amt = 60, ready = null;
    var dz = K.dropzone({ accept: 'image/*', hint: t('drop_hint_img'), paste: true, onFiles: function (f) { load(f[0]); } });
    var note = el('<p class="muted" style="margin:0 0 4px;font-size:13px">' + esc(t('ai_local_note')) + '</p>');
    var prog = progress();
    var view = el('<div class="stack hide" style="margin-top:14px"></div>');
    var info = el('<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"></div>');
    var cv = el('<canvas style="width:100%;max-height:560px;object-fit:contain;border-radius:12px;background:var(--soft);cursor:crosshair;touch-action:manipulation"></canvas>');
    var opts = el('<div class="panel stack"></div>');
    opts.append(K.seg([['blur', t('blur')], ['pixel', t('pixelate')], ['black', t('black')], ['emoji', '😀 Emoji']], 'blur', function (v) { mode = v; draw(); }),
      K.rng(t('strength'), 10, 100, amt, '%', function (v) { amt = v; draw(); }),
      el('<p class="muted" style="margin:0;font-size:13px">' + esc(t('faces_tip')) + '</p>'));
    var bar = el('<div class="acts"></div>');
    bar.append(
      K.btn('upload', t('start_over'), 'sec', function () { file = img = null; view.classList.add('hide'); dz.classList.remove('hide'); }),
      K.btn('download', t('download'), '', function () { draw(true); K.canvasBlob(cv, 'image/jpeg', 0.93).then(function (b) { K.download(b, K.baseName(file.name) + '-blurred.jpg'); draw(); }); })
    );
    view.append(info, cv, opts, bar);
    root.append(note, dz, prog, view);

    cv.addEventListener('click', function (e) {
      var r = cv.getBoundingClientRect(), sc = Math.min(r.width / cv.width, r.height / cv.height), ox = (r.width - cv.width * sc) / 2, oy = (r.height - cv.height * sc) / 2;
      var x = (e.clientX - r.left - ox) / sc, y = (e.clientY - r.top - oy) / sc;
      for (var i = 0; i < boxes.length; i++) { var b = boxes[i]; if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { b.on = !b.on; draw(); count(); return; } }
      var avg = boxes.length ? boxes.reduce(function (a, b) { return a + b.w; }, 0) / boxes.length : Math.min(cv.width, cv.height) * 0.18;
      boxes.push({ x: x - avg / 2, y: y - avg * 0.6, w: avg, h: avg * 1.2, on: true, manual: true }); draw(); count();
    });
    function count() { var n = boxes.filter(function (b) { return b.on; }).length; info.innerHTML = '<span class="chip" style="font-weight:700">' + esc(t('faces_found', { n: n })) + '</span>'; }
    function draw(final) {
      if (!img) return;
      var w = img.naturalWidth, h = img.naturalHeight; cv.width = w; cv.height = h;
      var x = cv.getContext('2d'); x.drawImage(img, 0, 0);
      boxes.forEach(function (b) {
        if (!b.on) { if (!final) { x.save(); x.setLineDash([8, 6]); x.lineWidth = Math.max(2, w / 400); x.strokeStyle = 'rgba(255,255,255,.9)'; x.strokeRect(b.x, b.y, b.w, b.h); x.restore(); } return; }
        x.save(); x.beginPath(); x.ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, b.h / 2, 0, 0, Math.PI * 2); x.clip();
        if (mode === 'blur') { x.filter = 'blur(' + Math.max(4, b.w * amt / 400) + 'px)'; x.drawImage(img, b.x - b.w * .3, b.y - b.h * .3, b.w * 1.6, b.h * 1.6, b.x - b.w * .3, b.y - b.h * .3, b.w * 1.6, b.h * 1.6); x.filter = 'none'; }
        else if (mode === 'pixel') { var n = Math.max(3, Math.round(22 - amt / 5)), t2 = document.createElement('canvas'); t2.width = n; t2.height = Math.max(3, Math.round(n * b.h / b.w)); t2.getContext('2d').drawImage(img, b.x, b.y, b.w, b.h, 0, 0, t2.width, t2.height); x.imageSmoothingEnabled = false; x.drawImage(t2, b.x, b.y, b.w, b.h); }
        else if (mode === 'black') { x.fillStyle = '#111'; x.fillRect(b.x, b.y, b.w, b.h); }
        else { x.restore(); x.save(); x.font = Math.round(b.h * 1.05) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('😀', b.x + b.w / 2, b.y + b.h / 2 + b.h * .05); }
        x.restore();
      });
    }
    function load(f) {
      if (!/^image\//.test(f.type)) { K.toast(t('cannot_read')); return; }
      file = f; dz.classList.add('hide'); view.classList.add('hide'); prog.set(t('ai_loading_model'), 0.1);
      if (!ready) ready = scripts(['face/face-api.js']).then(function () { prog.set(t('ai_loading_model'), 0.5); return faceapi.nets.ssdMobilenetv1.loadFromUri(V + 'face/'); });
      Promise.all([ready, K.loadImage(f)]).then(function (r) {
        img = r[1]; prog.set(t('ai_working'), 0.8);
        var c = document.createElement('canvas'), k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight)); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        return faceapi.detectAllFaces(c, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 })).then(function (d) {
          boxes = d.map(function (q) { var b = q.box, pw = b.width * 0.18, ph = b.height * 0.2; return { x: (b.x - pw) / k, y: (b.y - ph * 1.3) / k, w: (b.width + 2 * pw) / k, h: (b.height + 2 * ph) / k, on: true }; });
        });
      }).then(function () { prog.hide(); draw(); count(); view.classList.remove('hide'); if (!boxes.length) K.toast(t('faces_none')); })
        .catch(function (e) { console.error(e); prog.hide(); K.toast(t('error')); dz.classList.remove('hide'); });
    }
  }

  /* ---------- sticker maker (cut-out + outline, 512 px WEBP/PNG) ---------- */
  function sticker() {
    var file = null, cut = null, outline = 14, oc = '#ffffff', shadow = true;
    var dz = K.dropzone({ accept: 'image/*', hint: t('drop_hint_img'), paste: true, onFiles: function (f) { load(f[0]); } });
    var note = el('<p class="muted" style="margin:0 0 4px;font-size:13px">' + esc(t('ai_local_note')) + '</p>');
    var prog = progress();
    var view = el('<div class="stack hide" style="margin-top:14px"></div>');
    var wrap = el('<div class="row" style="gap:16px;align-items:center;flex-wrap:wrap;justify-content:center"></div>');
    var cv = el('<canvas width="512" height="512" style="width:280px;max-width:100%;border-radius:16px;background:repeating-conic-gradient(#e5e7eb 0 25%,#fff 0 50%) 0 0/20px 20px"></canvas>');
    var cv2 = el('<div style="width:280px;max-width:100%;border-radius:16px;padding:18px;background:#7ba7c9;display:flex;justify-content:flex-end"><canvas width="512" height="512" style="width:160px;height:160px"></canvas></div>');
    wrap.append(cv, cv2);
    var opts = el('<div class="panel stack"></div>');
    var colIn = el('<input type="color" value="#ffffff" style="width:44px;height:36px;border:0;background:none;cursor:pointer">'); colIn.oninput = function () { oc = colIn.value; draw(); };
    var crow = el('<label class="f" style="flex-direction:row;align-items:center;gap:10px"><span>' + esc(t('outline_color')) + '</span></label>'); crow.append(colIn);
    opts.append(K.rng(t('outline'), 0, 30, outline, 'px', function (v) { outline = v; draw(); }), crow, K.chk(t('shadow'), shadow, function (v) { shadow = v; draw(); }));
    var bar = el('<div class="acts"></div>');
    bar.append(
      K.btn('upload', t('start_over'), 'sec', function () { file = cut = null; view.classList.add('hide'); dz.classList.remove('hide'); }),
      K.btn('download', 'PNG', 'sec', function () { K.canvasBlob(cv, 'image/png').then(function (b) { K.download(b, K.baseName(file.name) + '-sticker.png'); }); }),
      K.btn('download', 'WEBP — Telegram / WhatsApp', '', function () { webp().then(function (b) { K.download(b, K.baseName(file.name) + '-sticker.webp'); }); })
    );
    view.append(wrap, opts, el('<p class="muted" style="margin:0;font-size:13px">' + esc(t('sticker_tip')) + '</p>'), bar);
    root.append(note, dz, prog, view);

    function webp() {
      var q = 0.9;
      return (function tryQ() { return K.canvasBlob(cv, 'image/webp', q).then(function (b) { if (b && b.size > 100 * 1024 && q > 0.3) { q -= 0.15; return tryQ(); } return b || K.canvasBlob(cv, 'image/png'); }); })();
    }
    function bbox(c) {
      var x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data, x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
      for (var y = 0; y < c.height; y++) for (var i = 0; i < c.width; i++) if (d[(y * c.width + i) * 4 + 3] > 24) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      return x1 < x0 ? { x: 0, y: 0, w: c.width, h: c.height } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    }
    function draw() {
      if (!cut) return;
      var S = 512, pad = outline + (shadow ? 14 : 4), b = cut.box, k = Math.min((S - 2 * pad) / b.w, (S - 2 * pad) / b.h);
      var w = b.w * k, h = b.h * k, ox = (S - w) / 2, oy = (S - h) / 2;
      var x = cv.getContext('2d'); x.clearRect(0, 0, S, S);
      // silhouette for outline
      var sil = document.createElement('canvas'); sil.width = S; sil.height = S; var sx = sil.getContext('2d');
      sx.drawImage(cut.c, b.x, b.y, b.w, b.h, ox, oy, w, h); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = oc; sx.fillRect(0, 0, S, S);
      if (shadow) { x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 12; x.shadowOffsetY = 4; x.drawImage(sil, 0, 0); x.restore(); }
      if (outline > 0) { var steps = Math.max(16, outline * 3); for (var i = 0; i < steps; i++) { var a = i / steps * Math.PI * 2; x.drawImage(sil, Math.cos(a) * outline, Math.sin(a) * outline); } }
      x.drawImage(cut.c, b.x, b.y, b.w, b.h, ox, oy, w, h);
      var c2 = cv2.querySelector('canvas'), x2 = c2.getContext('2d'); x2.clearRect(0, 0, S, S); x2.drawImage(cv, 0, 0);
    }
    function load(f) {
      if (!/^image\//.test(f.type)) { K.toast(t('cannot_read')); return; }
      file = f; dz.classList.add('hide'); view.classList.add('hide');
      segment(f, prog).then(function (bmp) {
        var c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height; c.getContext('2d').drawImage(bmp, 0, 0);
        cut = { c: c, box: bbox(c) }; prog.hide(); draw(); view.classList.remove('hide');
      }).catch(function (e) { console.error(e); prog.hide(); K.toast(t('error')); dz.classList.remove('hide'); });
    }
  }

  /* ---------- speech to text (Whisper via transformers.js, in a worker) ---------- */
  function stt() {
    var file = null, lang = 'auto', model = 'onnx-community/whisper-base', out = null, w = null;
    var LG = [['auto', t('auto_detect')], ['en', 'English'], ['ru', 'Русский'], ['es', 'Español'], ['pt', 'Português'], ['fr', 'Français'], ['de', 'Deutsch'], ['tr', 'Türkçe'], ['az', 'Azərbaycanca'], ['ar', 'العربية'], ['hi', 'हिन्दी'], ['it', 'Italiano'], ['pl', 'Polski'], ['uk', 'Українська'], ['kk', 'Қазақша'], ['uz', 'Oʻzbekcha'], ['zh', '中文'], ['ja', '日本語'], ['ko', '한국어'], ['id', 'Indonesia'], ['nl', 'Nederlands']];
    var cur = (K.lang || 'en').slice(0, 2); if (LG.some(function (x) { return x[0] === cur; })) lang = cur;
    var top = el('<div class="panel stack"></div>');
    top.append(K.sel(t('ocr_lang'), LG, lang, function (v) { lang = v; }),
      K.seg([['onnx-community/whisper-base', t('stt_fast')], ['onnx-community/whisper-small', t('stt_accurate')]], model, function (v) { model = v; }));
    var note = el('<p class="muted" style="margin:0 0 4px;font-size:13px">' + esc(t('ai_local_note')) + ' ' + esc(t('stt_note')) + '</p>');
    var dz = K.dropzone({ accept: 'audio/*,video/*,.m4a,.ogg,.opus,.oga,.wav,.mp3,.mp4,.webm', hint: t('drop_hint_audio'), onFiles: function (f) { run(f[0]); } });
    var prog = progress();
    var view = el('<div class="stack hide" style="margin-top:14px"></div>');
    var ta = el('<textarea class="inp" style="min-height:240px"></textarea>');
    var bar = el('<div class="acts"></div>');
    bar.append(K.btn('upload', t('start_over'), 'sec', function () { view.classList.add('hide'); dz.classList.remove('hide'); }),
      K.btn('copy', t('copy'), 'sec', function () { K.copy(ta.value); }),
      K.btn('download', 'TXT', 'sec', function () { K.download(new Blob([ta.value], { type: 'text/plain' }), K.baseName(file.name) + '.txt'); }),
      K.btn('download', 'SRT', '', function () { K.download(new Blob([srt()], { type: 'text/plain' }), K.baseName(file.name) + '.srt'); }));
    view.append(ta, bar);
    root.append(note, top, dz, prog, view);
    function ts(s) { s = Math.max(0, s || 0); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = Math.floor(s % 60), ms = Math.round((s % 1) * 1000); function z(n, l) { return String(n).padStart(l || 2, '0'); } return z(h) + ':' + z(m) + ':' + z(x) + ',' + z(ms, 3); }
    function srt() { return (out.chunks || []).map(function (c, i) { var a = c.timestamp || [0, 0]; return (i + 1) + '\n' + ts(a[0]) + ' --> ' + ts(a[1] == null ? a[0] + 3 : a[1]) + '\n' + c.text.trim() + '\n'; }).join('\n'); }
    function decode(f) {
      return f.arrayBuffer().then(function (ab) {
        var C = window.AudioContext || window.webkitAudioContext, ac = new C({ sampleRate: 16000 });
        return new Promise(function (r, j) { ac.decodeAudioData(ab, r, j); }).then(function (b) {
          try { ac.close(); } catch (e) { }
          if (b.sampleRate === 16000 && b.numberOfChannels === 1) return b.getChannelData(0);
          var oc = new OfflineAudioContext(1, Math.ceil(b.duration * 16000), 16000), s = oc.createBufferSource(); s.buffer = b; s.connect(oc.destination); s.start();
          return oc.startRendering().then(function (r) { return r.getChannelData(0); });
        });
      });
    }
    function run(f) {
      file = f; dz.classList.add('hide'); view.classList.add('hide'); prog.set(t('reading_file'), 0.02);
      decode(f).then(function (audio) {
        if (!w) w = new Worker(V + 'stt/worker.mjs', { type: 'module' });
        var t0 = 0, dur = audio.length / 16000, tick = null;
        prog.set(t('ai_loading_model'), 0.05);
        w.onmessage = function (e) {
          var d = e.data;
          if (d.type === 'load') prog.set(t('ai_loading_model'), 0.05 + d.p * 0.45);
          else if (d.type === 'run') { t0 = Date.now(); var est = Math.max(8, dur * (model.indexOf('small') > 0 ? 0.9 : 0.35)); tick = setInterval(function () { prog.set(t('stt_working'), Math.min(0.97, 0.5 + (Date.now() - t0) / 1000 / est * 0.5)); }, 400); }
          else if (d.type === 'done') { clearInterval(tick); out = d; prog.hide(); ta.value = (d.text || '').trim(); view.classList.remove('hide'); if (!ta.value) K.toast(t('stt_nothing')); }
          else if (d.type === 'error') { clearInterval(tick); console.error(d.msg); prog.hide(); K.toast(t('error')); dz.classList.remove('hide'); }
        };
        w.postMessage({ audio: audio, lang: lang, model: model }, [audio.buffer]);
      }).catch(function (e) { console.error(e); prog.hide(); K.toast(t('no_audio_track')); dz.classList.remove('hide'); });
    }
  }

  /* ---------- AI profile picture maker ---------- */
  function pfp() {
    var file = null, cut = null, bgi = 0, shape = 'circle', zoom = 100, ring = true, oy = 0;
    var BG = [['#8b5cf6', '#ec4899'], ['#06b6d4', '#3b82f6'], ['#f59e0b', '#ef4444'], ['#10b981', '#84cc16'], ['#111827', '#4b5563'], ['#fde68a', '#fca5a5'], ['#e0e7ff', '#c7d2fe'], ['#ffffff', '#ffffff']];
    var dz = K.dropzone({ accept: 'image/*', hint: t('drop_hint_img'), paste: true, onFiles: function (f) { load(f[0]); } });
    var note = el('<p class="muted" style="margin:0 0 4px;font-size:13px">' + esc(t('ai_local_note')) + '</p>');
    var prog = progress();
    var view = el('<div class="stack hide" style="margin-top:14px"></div>');
    var cv = el('<canvas width="1024" height="1024" style="width:300px;max-width:100%;align-self:center"></canvas>');
    var sw = el('<div class="row" style="gap:8px;flex-wrap:wrap;justify-content:center"></div>');
    BG.forEach(function (g, i) { var b = el('<button type="button" aria-label="bg" style="width:38px;height:38px;border-radius:50%;cursor:pointer;border:2px solid var(--line);background:linear-gradient(135deg,' + g[0] + ',' + g[1] + ')"></button>'); b.onclick = function () { bgi = i; draw(); }; sw.append(b); });
    var opts = el('<div class="panel stack"></div>');
    opts.append(sw, K.seg([['circle', t('pfp_circle')], ['square', t('pfp_square')]], shape, function (v) { shape = v; draw(); }),
      K.rng(t('zoom'), 60, 180, zoom, '%', function (v) { zoom = v; draw(); }), K.rng(t('move_v'), -40, 40, 0, '', function (v) { oy = v; draw(); }), K.chk(t('pfp_ring'), ring, function (v) { ring = v; draw(); }));
    var bar = el('<div class="acts"></div>');
    bar.append(K.btn('upload', t('start_over'), 'sec', function () { cut = null; view.classList.add('hide'); dz.classList.remove('hide'); }),
      K.btn('download', 'PNG', '', function () { K.canvasBlob(cv, 'image/png').then(function (b) { K.download(b, K.baseName(file.name) + '-avatar.png'); }); }));
    view.append(cv, opts, bar); root.append(note, dz, prog, view);
    function draw() {
      if (!cut) return; var S = 1024, x = cv.getContext('2d'), g = BG[bgi]; x.clearRect(0, 0, S, S);
      x.save(); x.beginPath(); if (shape === 'circle') x.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); else if (x.roundRect) x.roundRect(0, 0, S, S, 90); else x.rect(0, 0, S, S); x.clip();
      var gr = x.createLinearGradient(0, 0, S, S); gr.addColorStop(0, g[0]); gr.addColorStop(1, g[1]); x.fillStyle = gr; x.fillRect(0, 0, S, S);
      var b = cut.box, k = (S * 0.86 / Math.max(b.w, b.h * 0.85)) * zoom / 100, w = b.w * k, h = b.h * k;
      x.drawImage(cut.c, b.x, b.y, b.w, b.h, (S - w) / 2, S - h + h * 0.04 + oy * S / 100, w, h); x.restore();
      if (ring) { x.lineWidth = 22; x.strokeStyle = 'rgba(255,255,255,.9)'; x.beginPath(); if (shape === 'circle') x.arc(S / 2, S / 2, S / 2 - 11, 0, Math.PI * 2); else if (x.roundRect) x.roundRect(11, 11, S - 22, S - 22, 80); x.stroke(); }
    }
    function load(f) {
      if (!/^image\//.test(f.type)) { K.toast(t('cannot_read')); return; }
      file = f; dz.classList.add('hide');
      segment(f, prog).then(function (bmp) {
        var c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height; var x = c.getContext('2d'); x.drawImage(bmp, 0, 0);
        var d = x.getImageData(0, 0, c.width, c.height).data, x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
        for (var y = 0; y < c.height; y += 2) for (var i = 0; i < c.width; i += 2) if (d[(y * c.width + i) * 4 + 3] > 30) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        cut = { c: c, box: x1 > x0 ? { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 } : { x: 0, y: 0, w: c.width, h: c.height } };
        prog.hide(); draw(); view.classList.remove('hide');
      }).catch(function (e) { console.error(e); prog.hide(); K.toast(t('error')); dz.classList.remove('hide'); });
    }
  }

  /* ---------- AI age, gender & emotion ---------- */
  function ageemo() {
    var EM = { neutral: '😐', happy: '😄', sad: '😢', angry: '😠', fearful: '😨', disgusted: '🤢', surprised: '😲' }, ready = null;
    var dz = K.dropzone({ accept: 'image/*', hint: t('drop_hint_img'), paste: true, onFiles: function (f) { load(f[0]); } });
    var note = el('<p class="muted" style="margin:0 0 4px;font-size:13px">' + esc(t('ai_local_note')) + '</p>');
    var prog = progress(), view = el('<div class="stack hide" style="margin-top:14px"></div>');
    var cv = el('<canvas style="width:100%;max-height:520px;object-fit:contain;border-radius:12px;background:var(--soft)"></canvas>'), list = el('<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))"></div>');
    var bar = el('<div class="acts"></div>'), file = null;
    bar.append(K.btn('upload', t('start_over'), 'sec', function () { view.classList.add('hide'); dz.classList.remove('hide'); }), K.btn('download', t('download'), '', function () { K.canvasBlob(cv, 'image/jpeg', 0.92).then(function (b) { K.download(b, K.baseName(file.name) + '-ai.jpg'); }); }));
    view.append(cv, list, el('<p class="muted" style="margin:0;font-size:13px">' + esc(t('age_note')) + '</p>'), bar); root.append(note, dz, prog, view);
    function load(f) {
      if (!/^image\//.test(f.type)) { K.toast(t('cannot_read')); return; }
      file = f; dz.classList.add('hide'); prog.set(t('ai_loading_model'), 0.1);
      if (!ready) ready = scripts(['face/face-api.js']).then(function () { prog.set(t('ai_loading_model'), 0.4); return Promise.all([faceapi.nets.ssdMobilenetv1.loadFromUri(V + 'face/'), faceapi.nets.ageGenderNet.loadFromUri(V + 'face/'), faceapi.nets.faceExpressionNet.loadFromUri(V + 'face/')]); });
      Promise.all([ready, K.loadImage(f)]).then(function (r) {
        var img = r[1]; prog.set(t('ai_working'), 0.8);
        var k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        return faceapi.detectAllFaces(c, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 })).withAgeAndGender().withFaceExpressions().then(function (res) {
          cv.width = c.width; cv.height = c.height; var x = cv.getContext('2d'); x.drawImage(c, 0, 0); list.innerHTML = '';
          res.sort(function (a, b) { return a.detection.box.x - b.detection.box.x; }).forEach(function (d, i) {
            var b = d.detection.box, ex = Object.keys(d.expressions).sort(function (p, q) { return d.expressions[q] - d.expressions[p]; })[0], lw = Math.max(3, c.width / 300);
            x.strokeStyle = '#a78bfa'; x.lineWidth = lw; x.strokeRect(b.x, b.y, b.width, b.height);
            var fs = Math.max(16, b.width / 5); x.font = '700 ' + fs + 'px sans-serif'; var lab = (i + 1) + ' ' + EM[ex]; var tw = x.measureText(lab).width;
            x.fillStyle = '#7c3aed'; x.fillRect(b.x, b.y - fs * 1.3, tw + fs * 0.6, fs * 1.3); x.fillStyle = '#fff'; x.fillText(lab, b.x + fs * 0.3, b.y - fs * 0.3);
            var g = d.gender === 'male' ? t('male') : t('female');
            list.append(el('<div class="panel" style="display:flex;gap:12px;align-items:center"><span style="font-size:40px">' + EM[ex] + '</span><div><b>#' + (i + 1) + ' · ' + esc(t('age_years', { n: Math.round(d.age) })) + '</b><div class="muted" style="font-size:14px">' + esc(g) + ' · ' + esc(t('emo_' + ex)) + ' ' + Math.round(d.expressions[ex] * 100) + '%</div></div></div>'));
          });
          prog.hide(); view.classList.remove('hide'); if (!res.length) K.toast(t('faces_none').split('.')[0] + '.');
        });
      }).catch(function (e) { console.error(e); prog.hide(); K.toast(t('error')); dz.classList.remove('hide'); });
    }
  }
});
