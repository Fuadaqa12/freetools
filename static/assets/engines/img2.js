/* Image tools, batch 2: crop, circle crop, watermark, meme, blur, B&W, transparent bg, color picker, SVG→PNG, favicon */
TK.register('img2', function (root, o, K) {
  var t = K.t, el = K.el, esc = K.esc, svg = K.svg, mode = o.mode;
  var EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  var img = null, file = null, W = 0, H = 0;
  var isSvg = mode === 'svg';
  var dz = K.dropzone({ accept: isSvg ? '.svg,image/svg+xml' : 'image/*', paste: true, hint: isSvg ? 'SVG' : t('drop_hint_img'), onFiles: function (f) { load(f[0]); } });
  var work = el('<div class="stack hide"></div>');
  var settings = el('<div class="panel stack"></div>');
  var stage = el('<div class="preview stage"></div>');
  var actions = el('<div class="row end"></div>');
  var again = K.btn('upload', t('start_over'), 'sec', function () { img = null; work.classList.add('hide'); dz.classList.remove('hide'); stage.innerHTML = ''; });
  var dl = K.btn('download', t('download'), 'big', function () { save(); });
  actions.append(again, dl);
  work.append(stage, settings, actions);
  root.append(dz, work);
  if (isSvg) {
    var paste = el('<div class="stack" style="margin-top:14px"><textarea class="inp mono" rows="5" placeholder="&lt;svg ...&gt;...&lt;/svg&gt;" style="min-height:110px"></textarea></div>');
    var pb = K.btn('convert', t('convert_btn'), 'sec', function () { var v = paste.querySelector('textarea').value.trim(); if (v) load(new File([v], 'image.svg', { type: 'image/svg+xml' })); });
    paste.appendChild(pb); root.insertBefore(paste, work);
  }

  function load(f) {
    file = f;
    K.loadImage(f).then(function (i) {
      img = i; W = i.naturalWidth || 512; H = i.naturalHeight || 512;
      if (isSvg && (!i.naturalWidth || !i.naturalHeight)) { W = 512; H = 512; }
      dz.classList.add('hide'); work.classList.remove('hide');
      if (paste) paste.classList.add('hide');
      setup();
    }, function () { K.toast(t('cannot_read')); });
  }
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function outName(ext, suffix) { return K.baseName(file ? file.name : 'image') + (suffix || '') + '.' + ext; }
  function fmtPick(def, allowSame) {
    var items = (allowSame ? [['same', t('same_format')]] : []).concat([['image/png', 'PNG'], ['image/jpeg', 'JPG'], ['image/webp', 'WEBP']]);
    return K.sel(t('output_format'), items, def, function (v) { S.fmt = v; });
  }
  function typeOf() { var f = S.fmt === 'same' ? (EXT[file.type] ? file.type : 'image/png') : S.fmt; return f; }
  function exportCanvas(c, type, name) {
    if (type === 'image/jpeg') { var w = canvas(c.width, c.height), x = w.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w.width, w.height); x.drawImage(c, 0, 0); c = w; }
    K.canvasBlob(c, type, .92).then(function (b) { K.download(b, name || outName(EXT[type])); K.toast(t('done_downloaded')); });
  }
  var S = { fmt: 'same' };
  var view, sel, ctxV, save = function () { };

  /* preview canvas fitting into stage */
  function makeView(w, h) {
    stage.innerHTML = '';
    view = canvas(w, h); view.className = 'vcanvas';
    var box = el('<div class="cropbox"></div>'); box.appendChild(view); stage.appendChild(box);
    ctxV = view.getContext('2d');
    return box;
  }
  /* selection rectangle over an element */
  function selector(box, opts) {
    var r = { x: .1, y: .1, w: .8, h: .8 }, aspect = opts.aspect || 0;
    var s = el('<div class="selr' + (opts.circle ? ' round' : '') + '"><i data-h="nw"></i><i data-h="ne"></i><i data-h="sw"></i><i data-h="se"></i></div>');
    box.appendChild(s);
    function fix() {
      if (aspect) {
        var bw = box.clientWidth || 1, bh = box.clientHeight || 1, want = aspect * bh / bw;
        if (r.w / r.h > want) r.w = r.h * want; else r.h = r.w / want;
        if (r.w > 1) { r.w = 1; r.h = r.w / want; } if (r.h > 1) { r.h = 1; r.w = r.h * want; }
      }
      r.x = Math.min(Math.max(0, r.x), 1 - r.w); r.y = Math.min(Math.max(0, r.y), 1 - r.h);
      s.style.left = r.x * 100 + '%'; s.style.top = r.y * 100 + '%'; s.style.width = r.w * 100 + '%'; s.style.height = r.h * 100 + '%';
      if (opts.onChange) opts.onChange();
    }
    var drag = null;
    s.addEventListener('pointerdown', function (e) {
      e.preventDefault(); s.setPointerCapture(e.pointerId);
      drag = { h: e.target.dataset.h || 'move', sx: e.clientX, sy: e.clientY, r: { x: r.x, y: r.y, w: r.w, h: r.h } };
    });
    s.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var bw = box.clientWidth, bh = box.clientHeight, dx = (e.clientX - drag.sx) / bw, dy = (e.clientY - drag.sy) / bh, o0 = drag.r, m = .03;
      if (drag.h === 'move') { r.x = o0.x + dx; r.y = o0.y + dy; }
      else {
        var x1 = o0.x, y1 = o0.y, x2 = o0.x + o0.w, y2 = o0.y + o0.h;
        if (drag.h[1] === 'w') x1 = Math.min(Math.max(0, x1 + dx), x2 - m); else x2 = Math.max(Math.min(1, x2 + dx), x1 + m);
        if (drag.h[0] === 'n') y1 = Math.min(Math.max(0, y1 + dy), y2 - m); else y2 = Math.max(Math.min(1, y2 + dy), y1 + m);
        r = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
        if (aspect) { var want = aspect * bh / bw; if (drag.h[0] === 'n') { r.h = r.w / want; r.y = y2 - r.h; } else r.h = r.w / want; if (r.y < 0) { r.y = 0; r.h = y2; r.w = r.h * want; if (drag.h[1] === 'w') r.x = x2 - r.w; } if (r.y + r.h > 1) { r.h = 1 - r.y; r.w = r.h * want; if (drag.h[1] === 'w') r.x = x2 - r.w; } }
      }
      fix();
    });
    s.addEventListener('pointerup', function () { drag = null; });
    requestAnimationFrame(fix);
    window.addEventListener('resize', fix);
    return {
      el: s,
      get: function () { return { x: Math.round(r.x * W), y: Math.round(r.y * H), w: Math.round(r.w * W), h: Math.round(r.h * H) }; },
      aspect: function (a) { aspect = a; if (a) { r = { x: .1, y: .1, w: .8, h: .8 }; } fix(); },
      reset: function () { r = { x: .1, y: .1, w: .8, h: .8 }; fix(); },
      all: function () { r = { x: 0, y: 0, w: 1, h: 1 }; fix(); }
    };
  }

  function setup() {
    settings.innerHTML = ''; S = { fmt: 'same' };
    ({ crop: setupCrop, watermark: setupWatermark, meme: setupMeme, blur: setupBlur, bw: setupBw, transparent: setupTransparent, picker: setupPicker, svg: setupSvg, favicon: setupFavicon })[mode]();
  }

  /* ---------- crop ---------- */
  function setupCrop() {
    var circle = o.shape === 'circle';
    var box = makeView(W, H); ctxV.drawImage(img, 0, 0);
    var info = el('<span class="muted"></span>');
    sel = selector(box, { aspect: circle ? 1 : 0, circle: circle, onChange: function () { var g = sel.get(); info.textContent = g.w + ' × ' + g.h + ' px'; } });
    if (!circle) {
      var ratios = [['0', t('free')], ['1', '1:1'], ['1.3333', '4:3'], ['0.75', '3:4'], ['1.7778', '16:9'], ['0.5625', '9:16'], ['1.5', '3:2'], ['0.8', '4:5']];
      settings.append(el('<span class="lbl">' + esc(t('aspect_ratio')) + '</span>'), K.seg(ratios, '0', function (v) { sel.aspect(+v); }));
      var fs = el('<div class="fields"></div>'); fs.append(fmtPick('same', true)); settings.append(fs);
    } else {
      S.fmt = 'image/png'; S.size = 512;
      var fs2 = el('<div class="fields"></div>');
      fs2.append(K.sel(t('size'), [[0, t('original_size')], [1024, '1024 px'], [512, '512 px'], [400, '400 px'], [256, '256 px'], [128, '128 px']], 0, function (v) { S.size = +v; }));
      S.size = 0; settings.append(fs2, el('<p class="muted" style="margin:0">' + esc(t('circle_tip')) + '</p>'));
    }
    settings.append(info);
    save = function () {
      var g = sel.get();
      if (circle) {
        var size = S.size || g.w, c = canvas(size, size), x = c.getContext('2d');
        x.beginPath(); x.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); x.closePath(); x.clip();
        x.imageSmoothingQuality = 'high'; x.drawImage(img, g.x, g.y, g.w, g.h, 0, 0, size, size);
        return exportCanvas(c, 'image/png', outName('png', '-circle'));
      }
      var c2 = canvas(g.w, g.h); c2.getContext('2d').drawImage(img, g.x, g.y, g.w, g.h, 0, 0, g.w, g.h);
      var ty = typeOf(); exportCanvas(c2, ty, outName(EXT[ty], '-cropped'));
    };
  }

  /* ---------- watermark ---------- */
  function setupWatermark() {
    makeView(W, H);
    var P = { text: '© ' + (t('wm_default')), size: 6, op: 50, color: '#ffffff', pos: 'br', rot: 0, logo: null, lsize: 20 };
    function draw(ctx) {
      ctx.clearRect(0, 0, W, H); ctx.drawImage(img, 0, 0);
      ctx.save(); ctx.globalAlpha = P.op / 100;
      var fs = Math.max(8, Math.round(Math.min(W, H) * P.size / 100)), pad = Math.round(Math.min(W, H) * .03);
      ctx.font = '700 ' + fs + 'px system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif';
      ctx.fillStyle = P.color; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = fs / 8;
      var tw = ctx.measureText(P.text).width, lw = 0, lh = 0;
      if (P.logo) { lw = Math.min(W, H) * P.lsize / 100; lh = lw * P.logo.naturalHeight / P.logo.naturalWidth; }
      var bw = P.logo ? lw : tw, bh = P.logo ? lh : fs;
      function one(cx, cy) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(P.rot * Math.PI / 180);
        if (P.logo) ctx.drawImage(P.logo, -lw / 2, -lh / 2, lw, lh); else { ctx.textAlign = 'center'; ctx.fillText(P.text, 0, 0); }
        ctx.restore();
      }
      if (P.pos === 'tile') {
        var sx = bw * 1.6 + fs, sy = bh * 3 + fs;
        for (var y = sy / 2, row = 0; y < H + sy; y += sy, row++) for (var x = (row % 2 ? sx / 2 : 0); x < W + sx; x += sx) one(x, y);
      } else {
        var cx = P.pos[1] === 'l' ? pad + bw / 2 : P.pos[1] === 'r' ? W - pad - bw / 2 : W / 2;
        var cy = P.pos[0] === 't' ? pad + bh / 2 : P.pos[0] === 'b' ? H - pad - bh / 2 : H / 2;
        one(cx, cy);
      }
      ctx.restore();
    }
    var redraw = function () { draw(ctxV); };
    var txt = K.field(t('wm_text'), P.text, function (v) { P.text = v; redraw(); }, { text: true });
    var g = el('<div class="fields"></div>');
    var col = el('<label class="f"><span>' + esc(t('color')) + '</span><input type="color" class="inp" value="#ffffff" style="padding:4px"></label>');
    col.querySelector('input').oninput = function (e) { P.color = e.target.value; redraw(); };
    var pos = K.sel(t('position'), [['br', t('pos_br')], ['bl', t('pos_bl')], ['tr', t('pos_tr')], ['tl', t('pos_tl')], ['cc', t('pos_center')], ['tile', t('pos_tile')]], 'br', function (v) { P.pos = v; redraw(); });
    g.append(txt, col, pos);
    var g2 = el('<div class="fields"></div>');
    g2.append(K.rng(t('size'), 1, 30, P.size, '%', function (v) { P.size = v; P.lsize = v * 3; redraw(); }), K.rng(t('opacity'), 5, 100, P.op, '%', function (v) { P.op = v; redraw(); }), K.rng(t('rotation'), -90, 90, 0, '°', function (v) { P.rot = v; redraw(); }));
    var logo = K.dropzone({ accept: 'image/*', mini: true, label: t('wm_logo'), onFiles: function (f) { K.loadImage(f[0]).then(function (i) { P.logo = i; redraw(); }); } });
    settings.append(g, g2, logo, el('<div class="fields"></div>'));
    settings.lastChild.appendChild(fmtPick('same', true));
    redraw();
    save = function () { var c = canvas(W, H); draw(c.getContext('2d')); var ty = typeOf(); exportCanvas(c, ty, outName(EXT[ty], '-watermark')); };
  }

  /* ---------- meme ---------- */
  function setupMeme() {
    var mw = Math.min(W, 1600), mh = Math.round(H * mw / W);
    makeView(mw, mh);
    var P = { top: t('meme_top'), bottom: t('meme_bottom'), size: 8, color: '#ffffff', stroke: '#000000', caps: true };
    function wrap(ctx, text, maxW) {
      var words = text.split(/\s+/), lines = [], cur = '';
      words.forEach(function (w) { var test = cur ? cur + ' ' + w : w; if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; });
      if (cur) lines.push(cur); return lines;
    }
    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
      var fs = Math.round(w * P.size / 100);
      ctx.font = '900 ' + fs + 'px Impact,"Anton","Arial Black","Segoe UI Black",system-ui,sans-serif';
      ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, fs / 7); ctx.strokeStyle = P.stroke; ctx.fillStyle = P.color;
      function block(text, top) {
        if (!text) return; if (P.caps) text = text.toLocaleUpperCase();
        var lines = wrap(ctx, text, w * .92), lh = fs * 1.08;
        lines.forEach(function (l, i) {
          var y = top ? fs * .15 + lh * (i + 1) - fs * .12 : h - fs * .25 - lh * (lines.length - 1 - i);
          ctx.textBaseline = 'alphabetic'; ctx.strokeText(l, w / 2, y); ctx.fillText(l, w / 2, y);
        });
      }
      block(P.top, true); block(P.bottom, false);
    }
    var redraw = function () { draw(ctxV, mw, mh); };
    var g = el('<div class="fields"></div>');
    g.append(K.field(t('top_text'), P.top, function (v) { P.top = v; redraw(); }, { text: true }), K.field(t('bottom_text'), P.bottom, function (v) { P.bottom = v; redraw(); }, { text: true }));
    var g2 = el('<div class="fields"></div>');
    var col = el('<label class="f"><span>' + esc(t('color')) + '</span><input type="color" class="inp" value="#ffffff" style="padding:4px"></label>');
    col.querySelector('input').oninput = function (e) { P.color = e.target.value; P.stroke = e.target.value.toLowerCase() === '#000000' ? '#ffffff' : '#000000'; redraw(); };
    g2.append(K.rng(t('size'), 3, 16, P.size, '%', function (v) { P.size = v; redraw(); }), col);
    settings.append(g, g2, K.chk(t('all_caps'), true, function (v) { P.caps = v; redraw(); }));
    redraw();
    save = function () { var c = canvas(mw, mh); draw(c.getContext('2d'), mw, mh); exportCanvas(c, 'image/jpeg', outName('jpg', '-meme')); };
  }

  /* ---------- blur / pixelate ---------- */
  function setupBlur() {
    var box = makeView(W, H); ctxV.drawImage(img, 0, 0);
    var P = { kind: 'blur', strength: 12, scope: 'area' };
    var hist = [];
    sel = selector(box, {});
    function apply(all) {
      hist.push(ctxV.getImageData(0, 0, W, H));
      var g = all ? { x: 0, y: 0, w: W, h: H } : sel.get();
      if (g.w < 2 || g.h < 2) return;
      var k = Math.max(1, Math.round(Math.max(W, H) * P.strength / 400));
      if (P.kind === 'pixel') {
        var cell = Math.max(2, k * 2), sw = Math.max(1, Math.round(g.w / cell)), sh = Math.max(1, Math.round(g.h / cell));
        var small = canvas(sw, sh), sx = small.getContext('2d'); sx.drawImage(view, g.x, g.y, g.w, g.h, 0, 0, sw, sh);
        ctxV.save(); ctxV.imageSmoothingEnabled = false; ctxV.drawImage(small, 0, 0, sw, sh, g.x, g.y, g.w, g.h); ctxV.restore();
      } else {
        var tmp = canvas(g.w, g.h), tx = tmp.getContext('2d'); tx.drawImage(view, g.x, g.y, g.w, g.h, 0, 0, g.w, g.h);
        var pad = k * 3, big = canvas(g.w + pad * 2, g.h + pad * 2), bx = big.getContext('2d');
        bx.drawImage(view, g.x - pad, g.y - pad, g.w + pad * 2, g.h + pad * 2, 0, 0, g.w + pad * 2, g.h + pad * 2);
        var out = canvas(g.w, g.h), ox = out.getContext('2d'); ox.filter = 'blur(' + k + 'px)'; ox.drawImage(big, -pad, -pad);
        if (ox.filter === 'none' || ox.filter == null) { /* fallback: pixel-ish downscale */ var s2 = canvas(Math.max(1, g.w / k), Math.max(1, g.h / k)); s2.getContext('2d').drawImage(tmp, 0, 0, s2.width, s2.height); ox.drawImage(s2, 0, 0, g.w, g.h); }
        ctxV.drawImage(out, g.x, g.y);
      }
    }
    settings.append(
      K.seg([['blur', t('blur')], ['pixel', t('pixelate')]], 'blur', function (v) { P.kind = v; }),
      K.rng(t('strength'), 1, 40, P.strength, '', function (v) { P.strength = v; }),
      el('<p class="muted" style="margin:0">' + esc(t('blur_tip')) + '</p>')
    );
    var r = el('<div class="row"></div>');
    r.append(K.btn('droplet', t('apply_area'), '', function () { apply(false); }), K.btn('maximize', t('apply_all'), 'sec', function () { apply(true); }), K.btn('undo', t('undo'), 'sec', function () { var h = hist.pop(); if (h) ctxV.putImageData(h, 0, 0); }));
    settings.append(r);
    var fs = el('<div class="fields"></div>'); fs.append(fmtPick('same', true)); settings.append(fs);
    save = function () { var ty = typeOf(); exportCanvas(view, ty, outName(EXT[ty], '-blurred')); };
  }

  /* ---------- black & white ---------- */
  function setupBw() {
    makeView(W, H);
    var src = canvas(W, H), sx = src.getContext('2d'); sx.drawImage(img, 0, 0);
    var data = sx.getImageData(0, 0, W, H);
    var P = { kind: 'gray', th: 128, contrast: 0, bright: 0 };
    function draw() {
      var out = ctxV.createImageData(W, H), d = data.data, q = out.data, c = (P.contrast + 100) / 100, cf = c * c;
      for (var i = 0; i < d.length; i += 4) {
        var y = .299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2];
        y = (y - 128) * cf + 128 + P.bright * 1.28;
        if (P.kind === 'bw') y = y >= P.th ? 255 : 0;
        else if (P.kind === 'sepia') { var r = Math.min(255, y * 1.07 + 20), gg = Math.min(255, y * .95 + 8), b = Math.min(255, y * .78); q[i] = r; q[i + 1] = gg; q[i + 2] = b; q[i + 3] = d[i + 3]; continue; }
        y = y < 0 ? 0 : y > 255 ? 255 : y; q[i] = q[i + 1] = q[i + 2] = y; q[i + 3] = d[i + 3];
      }
      ctxV.putImageData(out, 0, 0);
    }
    var thr = K.rng(t('threshold'), 1, 254, P.th, '', function (v) { P.th = v; draw(); }); thr.classList.add('hide');
    settings.append(
      K.seg([['gray', t('grayscale_mode')], ['bw', t('bw_mode')], ['sepia', t('f_sepia')]], 'gray', function (v) { P.kind = v; thr.classList.toggle('hide', v !== 'bw'); draw(); }),
      thr, K.rng(t('f_contrast'), -60, 100, 0, '', function (v) { P.contrast = v; draw(); }), K.rng(t('f_brightness'), -50, 50, 0, '', function (v) { P.bright = v; draw(); })
    );
    var fs = el('<div class="fields"></div>'); fs.append(fmtPick('same', true)); settings.append(fs);
    draw();
    save = function () { var ty = typeOf(); exportCanvas(view, ty, outName(EXT[ty], '-bw')); };
  }

  /* ---------- transparent background ---------- */
  function setupTransparent() {
    makeView(W, H);
    var src = canvas(W, H), sx = src.getContext('2d'); sx.drawImage(img, 0, 0);
    var data = sx.getImageData(0, 0, W, H), d = data.data;
    var P = { color: [d[0], d[1], d[2]], tol: 18, flood: true, soft: true };
    var sw = el('<span class="sw" style="display:inline-block;width:28px;height:28px;border-radius:8px;border:1px solid var(--line2);vertical-align:middle"></span>');
    function hex(c) { return '#' + c.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join(''); }
    function draw() {
      sw.style.background = hex(P.color);
      var out = ctxV.createImageData(W, H), q = out.data; q.set(d);
      var T = P.tol * 4.42, cr = P.color[0], cg = P.color[1], cb = P.color[2];
      function dist(i) { var a = d[i] - cr, b = d[i + 1] - cg, c = d[i + 2] - cb; return Math.sqrt(a * a + b * b + c * c); }
      if (P.flood) {
        var seen = new Uint8Array(W * H), st = [];
        for (var x = 0; x < W; x++) { st.push(x, (H - 1) * W + x); }
        for (var y = 0; y < H; y++) { st.push(y * W, y * W + W - 1); }
        while (st.length) {
          var p = st.pop(); if (seen[p]) continue; seen[p] = 1;
          var di = dist(p * 4); if (di > T) continue;
          q[p * 4 + 3] = P.soft ? Math.min(d[p * 4 + 3], Math.round(255 * Math.max(0, di / T - .6) / .4)) : 0;
          var px = p % W;
          if (px > 0) st.push(p - 1); if (px < W - 1) st.push(p + 1); if (p >= W) st.push(p - W); if (p < W * (H - 1)) st.push(p + W);
        }
      } else {
        for (var i = 0; i < d.length; i += 4) { var dd = dist(i); if (dd <= T) q[i + 3] = P.soft ? Math.min(d[i + 3], Math.round(255 * Math.max(0, dd / T - .6) / .4)) : 0; }
      }
      ctxV.putImageData(out, 0, 0);
    }
    view.style.cursor = 'crosshair';
    view.addEventListener('click', function (e) {
      var r = view.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / r.width * W), y = Math.floor((e.clientY - r.top) / r.height * H), i = (y * W + x) * 4;
      P.color = [d[i], d[i + 1], d[i + 2]]; draw();
    });
    var pick = el('<div class="row"><span class="lbl">' + esc(t('bg_color')) + '</span></div>'); pick.appendChild(sw);
    settings.append(el('<p class="muted" style="margin:0">' + esc(t('transparent_tip')) + '</p>'), pick,
      K.rng(t('tolerance'), 0, 100, P.tol, '', K.debounce(function (v) { P.tol = v; draw(); }, 120)),
      K.chk(t('only_edges'), true, function (v) { P.flood = v; draw(); }), K.chk(t('smooth_edges'), true, function (v) { P.soft = v; draw(); }));
    draw();
    save = function () { exportCanvas(view, 'image/png', outName('png', '-transparent')); };
  }

  /* ---------- color picker ---------- */
  function setupPicker() {
    var mw = Math.min(W, 2000), mh = Math.round(H * mw / W);
    makeView(mw, mh); ctxV.drawImage(img, 0, 0, mw, mh);
    var data = ctxV.getImageData(0, 0, mw, mh).data;
    dl.classList.add('hide');
    var cur = el('<div class="pickres"></div>');
    var pal = el('<div class="palette"></div>');
    function hsl(r, g, b) { r /= 255; g /= 255; b /= 255; var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s = 0, l = (mx + mn) / 2; if (mx !== mn) { var dd = mx - mn; s = l > .5 ? dd / (2 - mx - mn) : dd / (mx + mn); h = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h *= 60; } return 'hsl(' + Math.round(h) + ', ' + Math.round(s * 100) + '%, ' + Math.round(l * 100) + '%)'; }
    function hex(r, g, b) { return '#' + [r, g, b].map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('').toUpperCase(); }
    function show(r, g, b) {
      var H1 = hex(r, g, b), R = 'rgb(' + r + ', ' + g + ', ' + b + ')', L = hsl(r, g, b);
      cur.innerHTML = '<div class="swatch" style="height:84px;background:' + H1 + '"></div>';
      var rows = el('<div class="stack" style="gap:6px;margin-top:10px"></div>');
      [H1, R, L].forEach(function (v) { var b2 = el('<button type="button" class="copyrow"><code>' + v + '</code>' + svg('copy') + '</button>'); b2.onclick = function () { K.copy(v); }; rows.appendChild(b2); });
      cur.appendChild(rows);
    }
    view.style.cursor = 'crosshair';
    function at(e) { var r = view.getBoundingClientRect(), x = Math.min(mw - 1, Math.floor((e.clientX - r.left) / r.width * mw)), y = Math.min(mh - 1, Math.floor((e.clientY - r.top) / r.height * mh)), i = (y * mw + x) * 4; return [data[i], data[i + 1], data[i + 2]]; }
    view.addEventListener('click', function (e) { var c = at(e); show(c[0], c[1], c[2]); });
    // dominant colors (simple 4-bit bucket quantization)
    var buckets = {}, step = Math.max(1, Math.floor(data.length / 4 / 40000));
    for (var i = 0; i < data.length; i += 4 * step) { if (data[i + 3] < 128) continue; var k = (data[i] >> 4) + ',' + (data[i + 1] >> 4) + ',' + (data[i + 2] >> 4); var b = buckets[k] || (buckets[k] = [0, 0, 0, 0]); b[0] += data[i]; b[1] += data[i + 1]; b[2] += data[i + 2]; b[3]++; }
    var top = Object.keys(buckets).map(function (k) { var b = buckets[k]; return [Math.round(b[0] / b[3]), Math.round(b[1] / b[3]), Math.round(b[2] / b[3]), b[3]]; }).sort(function (a, b) { return b[3] - a[3]; });
    var picked = [];
    top.forEach(function (c) { if (picked.length >= 8) return; if (picked.every(function (p) { return Math.abs(p[0] - c[0]) + Math.abs(p[1] - c[1]) + Math.abs(p[2] - c[2]) > 60; })) picked.push(c); });
    picked.forEach(function (c) { var h = hex(c[0], c[1], c[2]); var s = el('<button type="button" title="' + h + '" style="background:' + h + '"><span>' + h + '</span></button>'); s.onclick = function () { show(c[0], c[1], c[2]); K.copy(h); }; pal.appendChild(s); });
    settings.append(el('<p class="muted" style="margin:0">' + esc(t('picker_tip')) + '</p>'), cur, el('<span class="lbl">' + esc(t('dominant_colors')) + '</span>'), pal);
    if (picked[0]) show(picked[0][0], picked[0][1], picked[0][2]);
  }

  /* ---------- SVG to PNG ---------- */
  function setupSvg() {
    var P = { scale: 1, w: W, bg: 'transparent' };
    makeView(W, H);
    function size() { return [Math.round(P.w), Math.round(P.w * H / W)]; }
    function draw(ctx, w, h) { ctx.clearRect(0, 0, w, h); if (P.bg !== 'transparent') { ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h); } ctx.drawImage(img, 0, 0, w, h); }
    var info = el('<span class="muted"></span>');
    function redraw() { var s = size(); view.width = s[0]; view.height = s[1]; draw(ctxV, s[0], s[1]); info.textContent = s[0] + ' × ' + s[1] + ' px'; }
    var wf = K.field(t('width'), W, function (v) { var n = K.pnum(v); if (n > 0 && n <= 8000) { P.w = n; redraw(); } }, { unit: 'px' });
    var g = el('<div class="fields"></div>');
    g.append(wf, K.sel(t('background'), [['transparent', t('transparent')], ['#ffffff', t('white')], ['#000000', t('black')]], 'transparent', function (v) { P.bg = v; redraw(); }), fmtPick('image/png', false));
    S.fmt = 'image/png';
    var quick = el('<div class="row"></div>');
    [1, 2, 4].forEach(function (m) { var b = el('<button class="btn sec sm" type="button">' + m + '×</button>'); b.onclick = function () { P.w = W * m; wf.input.value = P.w; redraw(); }; quick.appendChild(b); });
    settings.append(g, quick, info);
    redraw();
    save = function () { var s = size(), c = canvas(s[0], s[1]); draw(c.getContext('2d'), s[0], s[1]); exportCanvas(c, S.fmt, outName(EXT[S.fmt])); };
  }

  /* ---------- favicon ---------- */
  function setupFavicon() {
    var P = { fit: 'cover', bg: 'transparent', radius: 0 };
    var sizes = [16, 32, 48, 180, 192, 512];
    stage.innerHTML = '';
    var row = el('<div class="favrow"></div>'); stage.appendChild(row);
    function render(size) {
      var c = canvas(size, size), x = c.getContext('2d');
      var r = P.radius / 100 * size / 2;
      if (r) { x.beginPath(); x.moveTo(r, 0); x.arcTo(size, 0, size, size, r); x.arcTo(size, size, 0, size, r); x.arcTo(0, size, 0, 0, r); x.arcTo(0, 0, size, 0, r); x.closePath(); x.clip(); }
      if (P.bg !== 'transparent') { x.fillStyle = P.bg; x.fillRect(0, 0, size, size); }
      var s = P.fit === 'cover' ? Math.max(size / W, size / H) : Math.min(size / W, size / H), w = W * s, h = H * s;
      x.imageSmoothingQuality = 'high'; x.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      return c;
    }
    function redraw() { row.innerHTML = ''; sizes.forEach(function (s) { var c = render(s); c.style.width = Math.min(96, Math.max(32, s)) + 'px'; c.style.imageRendering = s < 64 ? 'pixelated' : 'auto'; var f = el('<figure></figure>'); f.append(c, el('<figcaption>' + s + '×' + s + '</figcaption>')); row.appendChild(f); }); }
    var g = el('<div class="fields"></div>');
    g.append(K.sel(t('fit'), [['cover', t('fit_cover')], ['contain', t('fit_contain')]], 'cover', function (v) { P.fit = v; redraw(); }),
      K.sel(t('background'), [['transparent', t('transparent')], ['#ffffff', t('white')], ['#000000', t('black')], ['#5b4cf5', t('purple')]], 'transparent', function (v) { P.bg = v; redraw(); }));
    settings.append(g, K.rng(t('corner_radius'), 0, 100, 0, '%', function (v) { P.radius = v; redraw(); }));
    var code = '<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n<link rel="manifest" href="/site.webmanifest">';
    var pre = el('<div class="stack" style="gap:6px"><span class="lbl">' + esc(t('html_code')) + '</span><textarea class="inp mono" readonly style="min-height:96px">' + esc(code) + '</textarea></div>');
    settings.append(pre);
    dl.querySelector('span').textContent = t('download_zip');
    redraw();
    function png(size) { return K.canvasBlob(render(size), 'image/png').then(K.blobBytes); }
    save = function () {
      Promise.all(sizes.map(png)).then(function (bufs) {
        // ICO with 16, 32, 48 PNG entries
        var ico = [bufs[0], bufs[1], bufs[2]], n = ico.length, head = new DataView(new ArrayBuffer(6 + 16 * n)), off = 6 + 16 * n;
        head.setUint16(2, 1, true); head.setUint16(4, n, true);
        ico.forEach(function (b, i) { var s = [16, 32, 48][i]; head.setUint8(6 + i * 16, s); head.setUint8(7 + i * 16, s); head.setUint16(10 + i * 16, 1, true); head.setUint16(12 + i * 16, 32, true); head.setUint32(14 + i * 16, b.length, true); head.setUint32(18 + i * 16, off, true); off += b.length; });
        var icoBytes = new Uint8Array(off); icoBytes.set(new Uint8Array(head.buffer), 0); var p = 6 + 16 * n; ico.forEach(function (b) { icoBytes.set(b, p); p += b.length; });
        var man = JSON.stringify({ name: '', short_name: '', icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' }, { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }], theme_color: '#ffffff', background_color: '#ffffff', display: 'standalone' }, null, 2);
        var enc = new TextEncoder();
        var z = K.zip([
          { name: 'favicon.ico', data: icoBytes }, { name: 'favicon-16x16.png', data: bufs[0] }, { name: 'favicon-32x32.png', data: bufs[1] }, { name: 'favicon-48x48.png', data: bufs[2] },
          { name: 'apple-touch-icon.png', data: bufs[3] }, { name: 'android-chrome-192x192.png', data: bufs[4] }, { name: 'android-chrome-512x512.png', data: bufs[5] },
          { name: 'site.webmanifest', data: enc.encode(man) }, { name: 'README.txt', data: enc.encode(code + '\n') }
        ]);
        K.download(z, 'favicon.zip'); K.toast(t('done_downloaded'));
      });
    };
  }
});
