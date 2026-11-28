/* Batch 5: screenshot beautifier, Instagram splitter, YouTube thumbnails, text summarizer */
TK.register('tools4', function (root, o, K) {
  var t = K.t, el = K.el, esc = K.esc;
  ({ shot: shot, igsplit: igsplit, ytthumb: ytthumb, summary: summary })[o.mode]();

  function colorRow(label, val, on) { var i = el('<input type="color" style="width:44px;height:36px;border:0;background:none;cursor:pointer">'); i.value = val; i.oninput = function () { on(i.value); }; var r = el('<label class="f" style="flex-direction:row;align-items:center;gap:10px"><span>' + esc(label) + '</span></label>'); r.append(i); return r; }

  /* ---------- screenshot beautifier ---------- */
  function shot() {
    var img = null, file = null, G = [['#a78bfa', '#f472b6'], ['#22d3ee', '#6366f1'], ['#fbbf24', '#f43f5e'], ['#34d399', '#3b82f6'], ['#0f172a', '#334155'], ['#fdf2f8', '#e0e7ff']], gi = 0;
    var P = { pad: 8, rad: 14, frame: 'mac', shadow: true, ratio: 'auto' };
    var dz = K.dropzone({ accept: 'image/*', hint: t('shot_hint'), paste: true, onFiles: function (f) { file = f[0]; K.loadImage(file).then(function (im) { img = im; dz.classList.add('hide'); view.classList.remove('hide'); draw(); }); } });
    var view = el('<div class="stack hide"></div>'), cv = el('<canvas style="width:100%;max-height:520px;object-fit:contain;border-radius:10px"></canvas>');
    var sw = el('<div class="row" style="gap:8px;flex-wrap:wrap"></div>');
    G.forEach(function (g, i) { var b = el('<button type="button" aria-label="bg" style="width:36px;height:36px;border-radius:50%;cursor:pointer;border:2px solid var(--line);background:linear-gradient(135deg,' + g[0] + ',' + g[1] + ')"></button>'); b.onclick = function () { gi = i; draw(); }; sw.append(b); });
    var opts = el('<div class="panel stack"></div>');
    opts.append(sw, K.seg([['mac', 'macOS'], ['win', 'Windows'], ['none', t('shot_noframe')]], P.frame, function (v) { P.frame = v; draw(); }),
      K.seg([['auto', 'Auto'], ['1', '1:1'], ['1.7778', '16:9'], ['0.8', '4:5']], 'auto', function (v) { P.ratio = v; draw(); }),
      K.rng(t('collage_gap'), 0, 20, P.pad, '%', function (v) { P.pad = v; draw(); }), K.rng(t('collage_round'), 0, 40, P.rad, 'px', function (v) { P.rad = v; draw(); }),
      K.chk(t('shadow'), true, function (v) { P.shadow = v; draw(); }));
    var bar = el('<div class="acts"></div>');
    bar.append(K.btn('upload', t('start_over'), 'sec', function () { view.classList.add('hide'); dz.classList.remove('hide'); }),
      K.btn('copy', t('copy'), 'sec', function () { K.canvasBlob(cv, 'image/png').then(function (b) { try { navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]).then(function () { K.toast(t('copied')); }); } catch (e) { K.toast(t('error')); } }); }),
      K.btn('download', 'PNG', '', function () { K.canvasBlob(cv, 'image/png').then(function (b) { K.download(b, K.baseName(file.name) + '-pretty.png'); }); }));
    view.append(cv, opts, bar); root.append(dz, view);
    function rr(x, X, Y, W, H, r) { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, W, H, r); else x.rect(X, Y, W, H); }
    function draw() {
      var s = Math.min(1, 2400 / img.naturalWidth), iw = img.naturalWidth * s, ih = img.naturalHeight * s, bar2 = P.frame === 'none' ? 0 : Math.round(Math.max(28, iw * 0.035));
      var ww = iw, wh = ih + bar2, pad = Math.round(Math.max(ww, wh) * P.pad / 100), W = ww + pad * 2, H = wh + pad * 2;
      if (P.ratio !== 'auto') { var R = +P.ratio; if (W / H > R) H = W / R; else W = H * R; }
      W = Math.round(W); H = Math.round(H); cv.width = W; cv.height = H; var x = cv.getContext('2d'), g = G[gi], gr = x.createLinearGradient(0, 0, W, H);
      gr.addColorStop(0, g[0]); gr.addColorStop(1, g[1]); x.fillStyle = gr; x.fillRect(0, 0, W, H);
      var X = (W - ww) / 2, Y = (H - wh) / 2, r = P.rad * s * 2;
      if (P.shadow) { x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = Math.max(20, ww * 0.04); x.shadowOffsetY = ww * 0.015; x.fillStyle = '#fff'; rr(x, X, Y, ww, wh, r); x.fill(); x.restore(); }
      x.save(); rr(x, X, Y, ww, wh, r); x.clip();
      if (bar2) { x.fillStyle = P.frame === 'mac' ? '#e9e9ee' : '#f3f3f3'; x.fillRect(X, Y, ww, bar2); var d = bar2 * 0.24;
        if (P.frame === 'mac') ['#ff5f57', '#febc2e', '#28c840'].forEach(function (c, i) { x.fillStyle = c; x.beginPath(); x.arc(X + bar2 * 0.6 + i * d * 3, Y + bar2 / 2, d, 0, 7); x.fill(); });
        else { x.strokeStyle = '#555'; x.lineWidth = Math.max(1.5, bar2 / 18); var cx = X + ww - bar2 * 0.6, cy = Y + bar2 / 2, q = bar2 * 0.16; x.beginPath(); x.moveTo(cx - q, cy - q); x.lineTo(cx + q, cy + q); x.moveTo(cx + q, cy - q); x.lineTo(cx - q, cy + q); x.stroke(); x.strokeRect(cx - bar2 * 1.1 - q, cy - q, q * 2, q * 2); x.beginPath(); x.moveTo(cx - bar2 * 2.2 - q, cy); x.lineTo(cx - bar2 * 2.2 + q, cy); x.stroke(); } }
      x.drawImage(img, X, Y + bar2, iw, ih); x.restore();
    }
  }

  /* ---------- Instagram carousel / grid splitter ---------- */
  function igsplit() {
    var img = null, file = null, mode = 'carousel', n = 3, rows = 3, ratio = 0.8;
    var dz = K.dropzone({ accept: 'image/*', hint: t('drop_hint_img'), paste: true, onFiles: function (f) { file = f[0]; K.loadImage(file).then(function (im) { img = im; dz.classList.add('hide'); view.classList.remove('hide'); draw(); }); } });
    var view = el('<div class="stack hide"></div>'), prev = el('<div style="display:grid;gap:4px;align-self:center;width:100%;max-width:560px"></div>');
    var opts = el('<div class="panel stack"></div>'), nW = el('<div></div>');
    opts.append(K.seg([['carousel', t('ig_carousel')], ['grid', t('ig_grid')]], mode, function (v) { mode = v; opts2(); draw(); }), nW);
    function opts2() { nW.innerHTML = ''; if (mode === 'carousel') nW.append(K.seg([['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6']], String(n), function (v) { n = +v; draw(); }), K.seg([['0.8', '4:5'], ['1', '1:1']], String(ratio), function (v) { ratio = +v; draw(); })); else nW.append(K.seg([['1', '3×1'], ['2', '3×2'], ['3', '3×3'], ['4', '3×4']], String(rows), function (v) { rows = +v; draw(); })); }
    opts2();
    var bar = el('<div class="acts"></div>'), parts = [];
    bar.append(K.btn('upload', t('start_over'), 'sec', function () { view.classList.add('hide'); dz.classList.remove('hide'); }),
      K.btn('download', t('download_all') + ' (ZIP)', '', function () { Promise.all(parts.map(function (c, i) { return K.canvasBlob(c, 'image/jpeg', 0.95).then(K.blobBytes).then(function (d) { return { name: K.baseName(file.name) + '-' + String(i + 1).padStart(2, '0') + '.jpg', data: d }; }); })).then(function (fs) { K.download(K.zip(fs), K.baseName(file.name) + '-instagram.zip'); }); }));
    view.append(prev, opts, el('<p class="muted" style="margin:0;font-size:13px">' + esc(t('ig_tip')) + '</p>'), bar); root.append(dz, view);
    function draw() {
      var cols = mode === 'carousel' ? n : 3, rws = mode === 'carousel' ? 1 : rows, cr = mode === 'carousel' ? ratio : 0.8;
      var tw = 1080, th = Math.round(1080 / cr), TW = tw * cols, TH = th * rws, s = Math.max(TW / img.naturalWidth, TH / img.naturalHeight), sw = TW / s, sh = TH / s, sx = (img.naturalWidth - sw) / 2, sy = (img.naturalHeight - sh) / 2;
      parts = []; prev.innerHTML = ''; prev.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
      for (var r = 0; r < rws; r++) for (var c = 0; c < cols; c++) {
        var cv = document.createElement('canvas'); cv.width = tw; cv.height = th; cv.getContext('2d').drawImage(img, sx + c * sw / cols, sy + r * sh / rws, sw / cols, sh / rws, 0, 0, tw, th);
        cv.style.cssText = 'width:100%;border-radius:4px'; parts.push(cv); prev.appendChild(cv);
      }
    }
  }

  /* ---------- YouTube thumbnail downloader ---------- */
  function ytthumb() {
    var inp = el('<input class="inp" type="url" inputmode="url" placeholder="https://www.youtube.com/watch?v=…">');
    var out = el('<div class="stack" style="margin-top:12px"></div>');
    var row = el('<div class="row" style="gap:8px;flex-wrap:nowrap"></div>'); row.append(inp, K.btn('search', t('yt_get'), '', go));
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); }); inp.addEventListener('paste', function () { setTimeout(go, 30); });
    root.append(row, out);
    function vid(u) { var m = String(u).trim().match(/(?:youtu\.be\/|v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/) || String(u).trim().match(/^([\w-]{11})$/); return m && m[1]; }
    function go() {
      var id = vid(inp.value); out.innerHTML = '';
      if (!id) { if (inp.value.trim()) K.toast(t('yt_bad')); return; }
      [['maxresdefault', 'HD 1280×720'], ['sddefault', 'SD 640×480'], ['hqdefault', 'HQ 480×360'], ['mqdefault', 'MQ 320×180']].forEach(function (q) {
        var u = 'https://i.ytimg.com/vi/' + id + '/' + q[0] + '.jpg';
        var card = el('<div class="panel stack" style="gap:10px"><img alt="" loading="lazy" style="width:100%;border-radius:10px;background:var(--soft)"><div class="row" style="justify-content:space-between;align-items:center"><b></b></div></div>');
        card.querySelector('img').src = u; card.querySelector('b').textContent = q[1];
        card.querySelector('img').onload = function () { if (this.naturalWidth <= 120) card.remove(); };
        card.querySelector('img').onerror = function () { card.remove(); };
        card.querySelector('.row').append(K.btn('download', t('download'), 'sm', function () {
          fetch(u).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (b) { K.download(b, 'youtube-' + id + '-' + q[0] + '.jpg'); }).catch(function () { window.open(u, '_blank', 'noopener'); });
        }));
        out.append(card);
      });
    }
  }

  /* ---------- text summarizer (extractive) ---------- */
  function summary() {
    var ta = el('<textarea class="inp" style="min-height:220px" placeholder="' + esc(t('sum_ph')) + '"></textarea>'), pct = 30, bullets = false;
    var opts = el('<div class="panel stack"></div>');
    opts.append(K.seg([['20', t('sum_short')], ['30', t('sum_medium')], ['50', t('sum_long')]], '30', function (v) { pct = +v; run(); }), K.chk(t('sum_bullets'), false, function (v) { bullets = v; run(); }));
    var res = el('<div class="panel stack hide"></div>'), outT = el('<div style="white-space:pre-wrap;line-height:1.65;font-size:16px"></div>'), info = el('<p class="muted" style="margin:0;font-size:13px"></p>');
    var bar = el('<div class="acts"></div>'); bar.append(K.btn('copy', t('copy'), 'sec', function () { K.copy(outT.textContent); }));
    res.append(info, outT, bar);
    root.append(ta, opts, res);
    var tm; ta.oninput = function () { clearTimeout(tm); tm = setTimeout(run, 300); };
    function sents(x) { return (x.replace(/\s+/g, ' ').match(/[^.!?。！？…]+(?:[.!?。！？…]+["»”')\]]*|$)/g) || []).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 2; }); }
    function words(s) { return (s.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []); }
    function run() {
      var x = ta.value.trim(); if (!x) { res.classList.add('hide'); return; }
      var S = sents(x); if (S.length < 3) { res.classList.add('hide'); return; }
      var f = {}, W = S.map(words); W.forEach(function (ws) { ws.forEach(function (w) { if (w.length > 3) f[w] = (f[w] || 0) + 1; }); });
      var mx = Math.max.apply(null, Object.keys(f).map(function (k) { return f[k]; }).concat([1]));
      var sc = W.map(function (ws, i) { var s = 0, c = 0; ws.forEach(function (w) { if (f[w]) { s += f[w] / mx; c++; } }); var v = c ? s / Math.sqrt(ws.length + 2) : 0; if (i === 0) v *= 1.3; if (ws.length < 5) v *= 0.6; return [v, i]; });
      var k = Math.max(1, Math.round(S.length * pct / 100)), pick = sc.slice().sort(function (a, b) { return b[0] - a[0]; }).slice(0, k).map(function (a) { return a[1]; }).sort(function (a, b) { return a - b; });
      var outS = pick.map(function (i) { return S[i]; });
      outT.textContent = bullets ? outS.map(function (s) { return '• ' + s; }).join('\n') : outS.join(' ');
      var a = words(x).length, b = words(outT.textContent).length;
      info.textContent = t('sum_info', { a: a, b: b, p: Math.round((1 - b / a) * 100) });
      res.classList.remove('hide');
    }
  }
});
