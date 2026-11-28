/* Batch 4: HEIC→JPG, QR scanner, audio cutter, photo collage */
TK.register('tools3', function (root, o, K) {
  var t = K.t, el = K.el, esc = K.esc;
  var V = new URL(K.root + 'assets/vendor/', location.href).href;
  function script(src) { return new Promise(function (res, rej) { if (document.querySelector('script[data-s="' + src + '"]')) return res(); var x = document.createElement('script'); x.src = V + src; x.dataset.s = src; x.onload = res; x.onerror = rej; document.head.appendChild(x); }); }
  function fmt(s) { var m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1); }
  ({ heic: heic, qrscan: qrscan, audiocut: audiocut, collage: collage, kb: kb, pdfword: pdfword, invoice: invoice, sketch: sketch })[o.mode]();

  /* ---------- HEIC → JPG/PNG ---------- */
  function heic() {
    var fmtOut = 'image/jpeg', q = 0.92, items = [];
    var top = el('<div class="panel stack"></div>');
    top.append(K.seg([['image/jpeg', 'JPG'], ['image/png', 'PNG']], fmtOut, function (v) { fmtOut = v; }));
    var dz = K.dropzone({ accept: '.heic,.heif,image/heic,image/heif', multiple: true, hint: t('drop_hint_heic'), onFiles: add });
    var list = el('<div class="stack" style="gap:8px;margin-top:12px"></div>');
    var bar = el('<div class="acts hide"></div>');
    bar.append(K.btn('download', t('download_all') + ' (ZIP)', '', function () {
      var ok = items.filter(function (i) { return i.out; }); if (!ok.length) return;
      if (ok.length === 1) return K.download(ok[0].out, ok[0].name);
      Promise.all(ok.map(function (i) { return K.blobBytes(i.out).then(function (d) { return { name: i.name, data: d }; }); })).then(function (fs) { K.download(K.zip(fs), 'photos.zip'); });
    }));
    root.append(top, dz, list, bar);
    function add(files) {
      script('media/heic2any.min.js').then(function () {
        var chain = Promise.resolve();
        [].slice.call(files).forEach(function (f) {
          var row = el('<div class="file"><div class="th">HEIC</div><div class="meta"><div class="nm">' + esc(f.name) + '</div><div class="sz"><span class="spin dark"></span> ' + esc(t('converting')) + '</div></div></div>');
          list.appendChild(row); var it = { name: K.baseName(f.name) + (fmtOut === 'image/png' ? '.png' : '.jpg') }; items.push(it);
          chain = chain.then(function () {
            return heic2any({ blob: f, toType: fmtOut, quality: q }).then(function (b) {
              b = Array.isArray(b) ? b[0] : b; it.out = b;
              row.querySelector('.th').outerHTML = '<img class="th" style="object-fit:cover" src="' + URL.createObjectURL(b) + '">';
              row.querySelector('.sz').innerHTML = '<bdi>' + K.bytes(f.size) + '</bdi> → <b>' + K.bytes(b.size) + '</b>';
              var d = K.btn('download', '', 'sm sec', function () { K.download(b, it.name); }); row.appendChild(d); bar.classList.remove('hide');
            }).catch(function (e) { console.error(e); row.querySelector('.sz').textContent = t('cannot_read'); });
          });
        });
      });
    }
  }

  /* ---------- QR scanner (camera + image) ---------- */
  function qrscan() {
    var stream = null, raf = 0;
    var bar = el('<div class="acts"></div>');
    var vid = el('<video playsinline muted style="width:100%;max-height:420px;border-radius:14px;background:#000;object-fit:cover" class="hide"></video>');
    var res = el('<div class="panel stack hide"></div>');
    var dz = K.dropzone({ accept: 'image/*', hint: t('drop_hint_img'), paste: true, onFiles: function (f) { stop(); K.loadImage(f[0]).then(function (im) { scan(im, im.naturalWidth, im.naturalHeight, true); }); } });
    bar.append(K.btn('camera', t('qr_camera'), 'big', start));
    root.append(bar, vid, dz, res);
    var cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
    function start() {
      script('media/jsqr.js').then(function () { return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); })
        .then(function (s) { stream = s; vid.srcObject = s; vid.classList.remove('hide'); res.classList.add('hide'); return vid.play(); })
        .then(function () { (function loop() { if (!stream) return; if (vid.videoWidth && !scan(vid, vid.videoWidth, vid.videoHeight)) raf = requestAnimationFrame(loop); })(); })
        .catch(function () { K.toast(t('cam_denied')); });
    }
    function stop() { if (stream) stream.getTracks().forEach(function (x) { x.stop(); }); stream = null; cancelAnimationFrame(raf); vid.classList.add('hide'); }
    function scan(src, w, h, once) {
      if (!window.jsQR) { script('media/jsqr.js').then(function () { scan(src, w, h, once); }); return false; }
      var k = Math.min(1, 1200 / Math.max(w, h)); cv.width = Math.round(w * k); cv.height = Math.round(h * k); cx.drawImage(src, 0, 0, cv.width, cv.height);
      var d = cx.getImageData(0, 0, cv.width, cv.height), r = jsQR(d.data, d.width, d.height, { inversionAttempts: once ? 'attemptBoth' : 'dontInvert' });
      if (!r) { if (once) K.toast(t('qr_none')); return false; }
      stop(); show(r.data); if (navigator.vibrate) navigator.vibrate(60); return true;
    }
    function show(txt) {
      var isUrl = /^https?:\/\//i.test(txt);
      res.innerHTML = '<b>' + esc(t('qr_result')) + '</b>';
      var box = el('<div style="word-break:break-all;font-size:16px;padding:12px;border-radius:12px;background:var(--soft)"></div>'); box.textContent = txt;
      var acts = el('<div class="acts"></div>');
      acts.append(K.btn('copy', t('copy'), 'sec', function () { K.copy(txt); }));
      if (isUrl) { var a = el('<a class="btn" target="_blank" rel="noopener nofollow"></a>'); a.href = txt; a.innerHTML = K.svg('link') + '<span>' + esc(t('qr_open')) + '</span>'; acts.append(a); }
      acts.append(K.btn('camera', t('qr_again'), 'sec', start));
      res.append(box, acts); if (isUrl) res.append(el('<p class="muted" style="margin:0;font-size:13px">' + esc(t('qr_warn')) + '</p>'));
      res.classList.remove('hide');
    }
  }

  /* ---------- audio cutter / ringtone ---------- */
  function audiocut() {
    var file = null, buf = null, a = 0, b = 0, fade = true, outFmt = 'mp3', src = null, ac = null;
    var dz = K.dropzone({ accept: 'audio/*,video/*,.m4a,.ogg,.flac,.wav', hint: t('drop_hint_audio'), onFiles: function (f) { load(f[0]); } });
    var view = el('<div class="stack hide"></div>');
    var wave = el('<canvas height="140" style="width:100%;height:140px;border-radius:12px;background:var(--soft);touch-action:none;cursor:pointer"></canvas>');
    var info = el('<div class="row" style="justify-content:space-between;font-variant-numeric:tabular-nums"></div>');
    var opts = el('<div class="panel stack"></div>'), rA, rB;
    var bar = el('<div class="acts"></div>');
    bar.append(K.btn('play', t('play'), 'sec', play), K.btn('upload', t('start_over'), 'sec', function () { stopP(); view.classList.add('hide'); dz.classList.remove('hide'); }),
      K.btn('download', t('download'), '', save));
    view.append(wave, info, opts, bar);
    root.append(dz, view);
    var peaks = null;
    function load(f) {
      file = f; dz.classList.add('hide');
      f.arrayBuffer().then(function (ab) { var C = window.AudioContext || window.webkitAudioContext; ac = ac || new C(); return new Promise(function (r, j) { ac.decodeAudioData(ab, r, j); }); })
        .then(function (bb) {
          buf = bb; a = 0; b = Math.min(buf.duration, 30); var D = Math.floor(buf.duration * 10) / 10;
          opts.innerHTML = '';
          opts.append(K.rng(t('start_sec'), 0, D, 0, 's', function (v) { a = Math.min(v, b - 0.5); draw(); }, 0.1),
            K.rng(t('end_sec'), 0, D, b, 's', function (v) { b = Math.max(v, a + 0.5); draw(); }, 0.1),
            K.chk(t('fade'), fade, function (v) { fade = v; }),
            K.seg([['mp3', 'MP3'], ['m4r', 'iPhone M4R/WAV'], ['wav', 'WAV']], 'mp3', function (v) { outFmt = v; }));
          var d = buf.getChannelData(0), N = 600; peaks = new Float32Array(N); var step = Math.floor(d.length / N) || 1;
          for (var i = 0; i < N; i++) { var m = 0; for (var j = i * step; j < (i + 1) * step && j < d.length; j += 16) { var v = Math.abs(d[j]); if (v > m) m = v; } peaks[i] = m; }
          view.classList.remove('hide'); draw();
        }).catch(function (e) { console.error(e); K.toast(t('no_audio_track')); dz.classList.remove('hide'); });
    }
    function draw() {
      var w = wave.clientWidth * 2 || 1200, h = 280; wave.width = w; wave.height = h; var x = wave.getContext('2d'), D = buf.duration;
      var cs = getComputedStyle(document.documentElement);
      for (var i = 0; i < peaks.length; i++) { var px = i / peaks.length * w, tm = i / peaks.length * D, ph = Math.max(2, peaks[i] * h * 0.9);
        x.fillStyle = tm >= a && tm <= b ? '#5b4cf5' : 'rgba(120,120,140,.35)'; x.fillRect(px, (h - ph) / 2, Math.max(1, w / peaks.length - 1), ph); }
      x.fillStyle = '#ec4899'; x.fillRect(a / D * w - 2, 0, 4, h); x.fillRect(b / D * w - 2, 0, 4, h);
      info.innerHTML = '<span>' + fmt(a) + '</span><b>' + esc(t('length_sec')) + ': ' + (b - a).toFixed(1) + 's</b><span>' + fmt(b) + '</span>';
    }
    wave.addEventListener('pointerdown', function (e) {
      var r = wave.getBoundingClientRect(), tm = (e.clientX - r.left) / r.width * buf.duration;
      if (Math.abs(tm - a) < Math.abs(tm - b)) a = Math.max(0, Math.min(tm, b - 0.5)); else b = Math.min(buf.duration, Math.max(tm, a + 0.5));
      var ins = opts.querySelectorAll('input[type=range]'); ins[0].value = a; ins[0].dispatchEvent(new Event('input')); ins[1].value = b; ins[1].dispatchEvent(new Event('input')); draw();
    });
    function stopP() { if (src) { try { src.stop(); } catch (e) { } src = null; } }
    function play() { stopP(); if (ac.state === 'suspended') ac.resume(); src = ac.createBufferSource(); src.buffer = cut(); src.connect(ac.destination); src.start(); }
    function cut() {
      var sr = buf.sampleRate, s0 = Math.floor(a * sr), s1 = Math.floor(b * sr), n = s1 - s0, ch = Math.min(2, buf.numberOfChannels);
      var out = ac.createBuffer(ch, n, sr), F = fade ? Math.min(n / 4, sr * 1.5) : 0;
      for (var c = 0; c < ch; c++) { var src2 = buf.getChannelData(c).subarray(s0, s1), dst = out.getChannelData(c); dst.set(src2);
        for (var i = 0; i < F; i++) { var g = i / F; dst[i] *= g; dst[n - 1 - i] *= g; } }
      return out;
    }
    function wav(bf) {
      var ch = bf.numberOfChannels, n = bf.length, sr = bf.sampleRate, dv = new DataView(new ArrayBuffer(44 + n * ch * 2));
      function S(o2, s) { for (var i = 0; i < s.length; i++) dv.setUint8(o2 + i, s.charCodeAt(i)); }
      S(0, 'RIFF'); dv.setUint32(4, 36 + n * ch * 2, true); S(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, ch, true); dv.setUint32(24, sr, true); dv.setUint32(28, sr * ch * 2, true); dv.setUint16(32, ch * 2, true); dv.setUint16(34, 16, true); S(36, 'data'); dv.setUint32(40, n * ch * 2, true);
      var data = []; for (var c = 0; c < ch; c++) data.push(bf.getChannelData(c)); var p = 44;
      for (var i = 0; i < n; i++) for (c = 0; c < ch; c++) { var v = Math.max(-1, Math.min(1, data[c][i])); dv.setInt16(p, v < 0 ? v * 0x8000 : v * 0x7fff, true); p += 2; }
      return new Blob([dv], { type: 'audio/wav' });
    }
    function save() {
      var bf = cut(), name = K.baseName(file.name) + '-cut';
      if (outFmt !== 'mp3') return K.download(wav(bf), name + '.wav');
      script('media/lame.js').then(function () {
        var ch = bf.numberOfChannels, enc = new lamejs.Mp3Encoder(ch, bf.sampleRate, 192), parts = [], L = bf.getChannelData(0), R = ch > 1 ? bf.getChannelData(1) : null, B = 1152 * 32;
        function cv(x2, s, e) { var o2 = new Int16Array(e - s); for (var k = s; k < e; k++) { var v = Math.max(-1, Math.min(1, x2[k])); o2[k - s] = v < 0 ? v * 0x8000 : v * 0x7fff; } return o2; }
        for (var i = 0; i < L.length; i += B) { var e = Math.min(L.length, i + B), d = R ? enc.encodeBuffer(cv(L, i, e), cv(R, i, e)) : enc.encodeBuffer(cv(L, i, e)); if (d.length) parts.push(new Uint8Array(d)); }
        var f2 = enc.flush(); if (f2.length) parts.push(new Uint8Array(f2));
        K.download(new Blob(parts, { type: 'audio/mpeg' }), name + '.mp3');
      });
    }
  }

  /* ---------- photo collage ---------- */
  function collage() {
    var imgs = [], layout = 'auto', gap = 12, radius = 12, bg = '#ffffff', ratio = '1';
    var dz = K.dropzone({ accept: 'image/*', multiple: true, hint: t('drop_hint_img'), paste: true, onFiles: add, label: t('collage_add') });
    var opts = el('<div class="panel stack hide"></div>');
    var colIn = el('<input type="color" value="#ffffff" style="width:44px;height:36px;border:0;background:none;cursor:pointer">'); colIn.oninput = function () { bg = colIn.value; draw(); };
    var crow = el('<label class="f" style="flex-direction:row;align-items:center;gap:10px"><span>' + esc(t('background')) + '</span></label>'); crow.append(colIn);
    opts.append(K.seg([['1', '1:1'], ['0.8', '4:5'], ['0.5625', '9:16'], ['1.7778', '16:9']], ratio, function (v) { ratio = v; draw(); }),
      K.seg([['auto', t('collage_grid')], ['rows', t('collage_rows')], ['cols', t('collage_cols')]], 'auto', function (v) { layout = v; draw(); }),
      K.rng(t('collage_gap'), 0, 40, gap, 'px', function (v) { gap = v; draw(); }), K.rng(t('collage_round'), 0, 40, radius, 'px', function (v) { radius = v; draw(); }), crow);
    var cv = el('<canvas class="hide" style="width:100%;max-width:560px;align-self:center;border-radius:10px;box-shadow:var(--shadow-lg)"></canvas>');
    var thumbs = el('<div class="row" style="gap:8px;flex-wrap:wrap"></div>');
    var bar = el('<div class="acts hide"></div>');
    bar.append(K.btn('x', t('clear'), 'sec', function () { imgs = []; thumbs.innerHTML = ''; cv.classList.add('hide'); opts.classList.add('hide'); bar.classList.add('hide'); }),
      K.btn('download', 'JPG', '', function () { K.canvasBlob(cv, 'image/jpeg', 0.92).then(function (b) { K.download(b, 'collage.jpg'); }); }));
    var wrap = el('<div class="stack" style="margin-top:12px"></div>'); wrap.append(thumbs, cv, opts, bar);
    root.append(dz, wrap);
    function add(files) {
      Promise.all([].slice.call(files).filter(function (f) { return /^image\//.test(f.type); }).map(K.loadImage)).then(function (list) {
        imgs = imgs.concat(list).slice(0, 12); thumbs.innerHTML = '';
        imgs.forEach(function (im, i) { var tb = el('<button type="button" title="✕" style="position:relative;width:52px;height:52px;border-radius:10px;overflow:hidden;border:1px solid var(--line);padding:0;cursor:pointer;background:none"></button>'); var c2 = im.cloneNode(); c2.style.cssText = 'width:100%;height:100%;object-fit:cover'; tb.appendChild(c2); tb.onclick = function () { imgs.splice(i, 1); add([]); }; thumbs.appendChild(tb); });
        var on = imgs.length > 0; [cv, opts, bar].forEach(function (e) { e.classList.toggle('hide', !on); }); draw();
      });
    }
    function cells(n, W, H) {
      var r = [], cols, rows, i;
      if (layout === 'rows') { for (i = 0; i < n; i++) r.push([0, i / n, 1, 1 / n]); return r; }
      if (layout === 'cols') { for (i = 0; i < n; i++) r.push([i / n, 0, 1 / n, 1]); return r; }
      if (n === 3) return [[0, 0, .5, 1], [.5, 0, .5, .5], [.5, .5, .5, .5]];
      if (n === 5) return [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, 1 / 3, .5], [1 / 3, .5, 1 / 3, .5], [2 / 3, .5, 1 / 3, .5]];
      cols = Math.ceil(Math.sqrt(n * W / H)); rows = Math.ceil(n / cols);
      for (i = 0; i < n; i++) { var rr = Math.floor(i / cols), inRow = rr === rows - 1 ? n - cols * (rows - 1) : cols, cc = i - rr * cols; r.push([cc / inRow, rr / rows, 1 / inRow, 1 / rows]); }
      return r;
    }
    function draw() {
      if (!imgs.length) return;
      var W = 2000, H = Math.round(W / +ratio); cv.width = W; cv.height = H; var x = cv.getContext('2d'), g = gap * 2;
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      cells(imgs.length, W, H).forEach(function (c, i) {
        var im = imgs[i], cx = c[0] * (W - g) + g, cy = c[1] * (H - g) + g, cw = c[2] * (W - g) - g, ch = c[3] * (H - g) - g;
        var s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight), sw = cw / s, sh = ch / s;
        x.save(); x.beginPath(); if (x.roundRect) x.roundRect(cx, cy, cw, ch, radius * 2); else x.rect(cx, cy, cw, ch); x.clip();
        x.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - sh) / 2, sw, sh, cx, cy, cw, ch); x.restore();
      });
    }
  }

  /* ---------- compress image to exact KB ---------- */
  function kb() {
    var target = 50, file = null, img = null, out = null, custom = null;
    var top = el('<div class="panel stack"></div>');
    var inp = el('<input type="number" class="inp" min="5" max="5000" placeholder="KB" style="max-width:140px">');
    inp.oninput = function () { var v = +inp.value; if (v >= 5) { target = v; if (img) run(); } };
    var segW = K.seg([['20', '20 KB'], ['50', '50 KB'], ['100', '100 KB'], ['200', '200 KB'], ['500', '500 KB']], '50', function (v) { target = +v; inp.value = ''; if (img) run(); });
    var row = el('<label class="f" style="flex-direction:row;align-items:center;gap:10px"><span>' + esc(t('kb_custom')) + '</span></label>'); row.append(inp);
    top.append(segW, row);
    var dz = K.dropzone({ accept: 'image/*', hint: t('drop_hint_img'), paste: true, onFiles: function (f) { file = f[0]; K.loadImage(file).then(function (im) { img = im; run(); }); } });
    var view = el('<div class="stack hide" style="margin-top:12px"></div>'), head = el('<div class="file"></div>'), pic = el('<img alt="" style="max-width:100%;max-height:420px;border-radius:12px;align-self:center">');
    var bar = el('<div class="acts"></div>');
    bar.append(K.btn('upload', t('start_over'), 'sec', function () { img = null; view.classList.add('hide'); dz.classList.remove('hide'); }), K.btn('download', t('download'), '', function () { if (out) K.download(out, K.baseName(file.name) + '-' + target + 'kb.jpg'); }));
    view.append(head, pic, bar); root.append(top, dz, view);
    function enc(scale, q) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.naturalWidth * scale)); c.height = Math.max(1, Math.round(img.naturalHeight * scale)); var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); return K.canvasBlob(c, 'image/jpeg', q).then(function (b) { return { b: b, w: c.width, h: c.height }; }); }
    function run() {
      dz.classList.add('hide'); var lim = target * 1024 * 0.98, scale = Math.min(1, 4000 / Math.max(img.naturalWidth, img.naturalHeight));
      function tryScale(sc, n) {
        var lo = 0.05, hi = 0.95, best = null, i = 0;
        return (function bs() { var q = (lo + hi) / 2; return enc(sc, q).then(function (r) { if (r.b.size <= lim) { best = r; lo = q; } else hi = q; if (++i < 7) return bs(); return best ? best : (n < 12 ? tryScale(sc * 0.8, n + 1) : r); }); })();
      }
      tryScale(scale, 0).then(function (r) {
        out = r.b; if (pic.src) URL.revokeObjectURL(pic.src); pic.src = URL.createObjectURL(out);
        head.innerHTML = '<div class="th">JPG</div><div class="meta"><div class="nm">' + esc(K.baseName(file.name)) + '.jpg</div><div class="sz"><bdi>' + K.bytes(file.size) + '</bdi> → <b style="color:#16a34a">' + K.bytes(out.size) + '</b> · ' + r.w + '×' + r.h + '</div></div>';
        view.classList.remove('hide');
      });
    }
  }

  /* ---------- PDF → Word (.docx, text + paragraphs) ---------- */
  function pdfword() {
    var dz = K.dropzone({ accept: 'application/pdf,.pdf', hint: t('drop_hint_pdf'), onFiles: function (f) { go(f[0]); } });
    var st = el('<div class="row hide" style="justify-content:center;padding:30px;gap:10px"><span class="spin dark"></span><span class="muted"></span></div>');
    var view = el('<div class="stack hide"></div>'), head = el('<div class="file"></div>'), pre = el('<textarea class="inp" readonly style="min-height:220px"></textarea>');
    var bar = el('<div class="acts"></div>'), out = null, name = '';
    bar.append(K.btn('upload', t('start_over'), 'sec', function () { view.classList.add('hide'); dz.classList.remove('hide'); }), K.btn('download', t('download') + ' DOCX', '', function () { K.download(out, name + '.docx'); }));
    view.append(head, pre, bar, el('<p class="muted" style="margin:0;font-size:13px">' + esc(t('pdfword_note')) + '</p>'));
    root.append(dz, st, view);
    function X(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); }
    function go(f) {
      name = K.baseName(f.name); dz.classList.add('hide'); st.classList.remove('hide'); st.querySelector('.muted').textContent = t('processing');
      f.arrayBuffer().then(function (ab) { return K.pdfjs().then(function (pj) { return pj.getDocument({ data: new Uint8Array(ab), isEvalSupported: false }).promise; }); })
        .then(function (doc) {
          var pages = [], ch = Promise.resolve();
          for (var n = 1; n <= doc.numPages; n++) (function (n) { ch = ch.then(function () { st.querySelector('.muted').textContent = t('processing') + ' ' + n + '/' + doc.numPages; return doc.getPage(n).then(function (p) { return p.getTextContent(); }).then(function (tc) {
            var lines = [], last = null, cur = null;
            tc.items.forEach(function (it) { if (!it.str && !it.hasEOL) return; var y = it.transform[5], h = Math.abs(it.transform[3]) || 10;
              if (!cur || Math.abs(y - cur.y) > h * 0.5) { cur = { y: y, h: h, t: '', gap: last ? last.y - y : 0 }; lines.push(cur); last = cur; }
              cur.t += it.str; if (it.hasEOL) cur = null; });
            var paras = [], P = null;
            lines.forEach(function (l) { var txt = l.t.replace(/\s+/g, ' ').trim(); if (!txt) { P = null; return; } if (!P || l.gap > l.h * 1.8 || Math.abs(l.h - P.h) > 1.5) { P = { h: l.h, t: txt }; paras.push(P); } else P.t += (/-$/.test(P.t) ? '' : ' ') + txt.replace(/^/, ''); });
            pages.push(paras); }); }); })(n);
          return ch.then(function () { return pages; });
        }).then(function (pages) {
          var body = '', txt = [], sizes = []; pages.forEach(function (ps) { ps.forEach(function (p) { sizes.push(p.h); }); }); sizes.sort(function (a, b) { return a - b; }); var base = sizes[Math.floor(sizes.length / 2)] || 11;
          pages.forEach(function (ps, i) {
            ps.forEach(function (p) { var big = p.h > base * 1.25, sz = Math.round(Math.min(48, Math.max(9, p.h)) * 2);
              body += '<w:p>' + (big ? '<w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>' : '<w:pPr><w:spacing w:after="120"/></w:pPr>') + '<w:r><w:rPr>' + (big ? '<w:b/>' : '') + '<w:sz w:val="' + sz + '"/></w:rPr><w:t xml:space="preserve">' + X(p.t) + '</w:t></w:r></w:p>'; txt.push(p.t); });
            if (i < pages.length - 1) body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
          });
          var E = new TextEncoder();
          var files = [
            ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
            ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
            ['word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>']];
          out = new Blob([K.zip(files.map(function (f) { return { name: f[0], data: E.encode(f[1]) }; }))], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          st.classList.add('hide');
          if (!txt.length) { K.toast(t('pdfword_scan')); dz.classList.remove('hide'); return; }
          head.innerHTML = '<div class="th">DOCX</div><div class="meta"><div class="nm">' + esc(name) + '.docx</div><div class="sz"><bdi>' + K.bytes(out.size) + '</bdi> · ' + esc(t('n_pages', { n: pages.length })) + '</div></div>';
          pre.value = txt.join('\n\n'); view.classList.remove('hide');
        }).catch(function (e) { console.error(e); st.classList.add('hide'); K.toast(t('error')); dz.classList.remove('hide'); });
    }
  }

  /* ---------- invoice generator ---------- */
  function invoice() {
    var LS = 'tk_invoice', D;
    try { D = JSON.parse(localStorage.getItem(LS)); } catch (e) { }
    var today = new Date().toISOString().slice(0, 10);
    D = D || { from: '', to: '', num: 'INV-001', date: today, due: '', cur: '$', tax: 0, note: '', items: [{ d: '', q: 1, p: 0 }] };
    D.date = D.date || today;
    var form = el('<div class="stack"></div>');
    function fld(label, key, ta, type) { var w = el('<label class="f"><span>' + esc(label) + '</span></label>'), i = el(ta ? '<textarea class="inp" style="min-height:90px"></textarea>' : '<input class="inp" type="' + (type || 'text') + '">'); i.value = D[key]; i.oninput = function () { D[key] = type === 'number' ? +i.value : i.value; save(); }; w.append(i); return w; }
    var g1 = el('<div class="fields"></div>'); g1.append(fld(t('inv_from'), 'from', 1), fld(t('inv_to'), 'to', 1));
    var g2 = el('<div class="fields"></div>'); g2.append(fld(t('inv_num'), 'num'), fld(t('inv_date'), 'date', 0, 'date'), fld(t('inv_due'), 'due', 0, 'date'), fld(t('inv_cur'), 'cur'), fld(t('inv_tax') + ' %', 'tax', 0, 'number'));
    var tbl = el('<div class="stack" style="gap:8px"></div>'), tot = el('<div style="text-align:end;font-size:18px"></div>');
    form.append(g1, g2, el('<b>' + esc(t('inv_items')) + '</b>'), tbl, K.btn('plus', t('inv_add'), 'sec sm', function () { D.items.push({ d: '', q: 1, p: 0 }); rows(); save(); }), tot, fld(t('inv_note'), 'note', 1));
    var bar = el('<div class="acts"></div>'); bar.append(K.btn('download', t('download') + ' PDF', 'big', pdf));
    root.append(form, bar);
    function money(v) { return D.cur + ' ' + (Math.round(v * 100) / 100).toLocaleString(K.lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function sums() { var s = D.items.reduce(function (a, i) { return a + (+i.q || 0) * (+i.p || 0); }, 0), tx = s * (+D.tax || 0) / 100; return [s, tx, s + tx]; }
    function save() { try { localStorage.setItem(LS, JSON.stringify(D)); } catch (e) { } var s = sums(); tot.innerHTML = esc(t('inv_sub')) + ': ' + esc(money(s[0])) + (D.tax ? '<br>' + esc(t('inv_tax')) + ': ' + esc(money(s[1])) : '') + '<br><b>' + esc(t('inv_total')) + ': ' + esc(money(s[2])) + '</b>'; }
    function rows() {
      tbl.innerHTML = '';
      D.items.forEach(function (it, i) {
        var r = el('<div style="display:grid;grid-template-columns:minmax(0,1fr) 64px 96px 40px;gap:6px"></div>');
        var d = el('<input class="inp" placeholder="' + esc(t('inv_desc')) + '">'), q = el('<input class="inp" type="number" min="0" step="any">'), p = el('<input class="inp" type="number" min="0" step="any" placeholder="0">');
        d.value = it.d; q.value = it.q; p.value = it.p || '';
        d.oninput = function () { it.d = d.value; save(); }; q.oninput = function () { it.q = +q.value; save(); }; p.oninput = function () { it.p = +p.value; save(); };
        var x = el('<button class="ibtn" type="button" aria-label="remove">' + K.svg('x') + '</button>'); x.onclick = function () { D.items.splice(i, 1); if (!D.items.length) D.items.push({ d: '', q: 1, p: 0 }); rows(); save(); };
        r.append(d, q, p, x); tbl.append(r);
      });
    }
    rows(); save();
    function pdf() {
      var W = 1654, H = 2339, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'), F = '"Inter","Segoe UI",Roboto,Arial,sans-serif', m = 120, y = 150;
      x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = '#5b4cf5'; x.fillRect(0, 0, W, 18);
      function txt(s, X, Y, sz, b, col, al) { x.font = (b ? '700 ' : '400 ') + sz + 'px ' + F; x.fillStyle = col || '#111'; x.textAlign = al || 'left'; x.fillText(s, X, Y); }
      function multi(s, X, Y, sz, col) { (s || '').split('\n').forEach(function (l, i) { txt(l, X, Y + i * sz * 1.4, sz, 0, col); }); return Y + (s || '').split('\n').length * sz * 1.4; }
      txt(t('inv_title').toUpperCase(), m, y, 64, 1, '#5b4cf5'); txt(D.num, W - m, y - 10, 34, 1, '#111', 'right');
      txt(t('inv_date') + ': ' + D.date, W - m, y + 40, 28, 0, '#555', 'right'); if (D.due) txt(t('inv_due') + ': ' + D.due, W - m, y + 80, 28, 0, '#555', 'right');
      y += 170; txt(t('inv_from'), m, y, 24, 1, '#888'); txt(t('inv_to'), W / 2 + 20, y, 24, 1, '#888');
      var y1 = multi(D.from, m, y + 44, 30), y2 = multi(D.to, W / 2 + 20, y + 44, 30); y = Math.max(y1, y2) + 60;
      x.fillStyle = '#f3f2ff'; x.fillRect(m, y, W - 2 * m, 64); var cq = W - m - 520, cp = W - m - 300, ct = W - m - 24;
      txt(t('inv_desc'), m + 24, y + 42, 26, 1); txt(t('inv_qty'), cq, y + 42, 26, 1, '#111', 'right'); txt(t('inv_price'), cp, y + 42, 26, 1, '#111', 'right'); txt(t('inv_total'), ct, y + 42, 26, 1, '#111', 'right');
      y += 64;
      D.items.forEach(function (it) { if (!it.d && !it.p) return; y += 58; txt(it.d, m + 24, y, 28); txt(String(it.q), cq, y, 28, 0, '#111', 'right'); txt(money(+it.p || 0), cp, y, 28, 0, '#111', 'right'); txt(money((+it.q || 0) * (+it.p || 0)), ct, y, 28, 0, '#111', 'right'); x.fillStyle = '#eee'; x.fillRect(m, y + 22, W - 2 * m, 2); });
      var s = sums(); y += 90;
      txt(t('inv_sub'), cp, y, 28, 0, '#555', 'right'); txt(money(s[0]), ct, y, 28, 0, '#111', 'right');
      if (D.tax) { y += 50; txt(t('inv_tax') + ' ' + D.tax + '%', cp, y, 28, 0, '#555', 'right'); txt(money(s[1]), ct, y, 28, 0, '#111', 'right'); }
      y += 70; x.fillStyle = '#5b4cf5'; x.fillRect(cp - 260, y - 50, ct - cp + 284, 74); txt(t('inv_total'), cp, y, 32, 1, '#fff', 'right'); txt(money(s[2]), ct, y, 32, 1, '#fff', 'right');
      if (D.note) multi(D.note, m, y + 140, 26, '#555');
      script('pdf-lib.min.js').then(function () { return K.canvasBlob(c, 'image/jpeg', 0.92); }).then(function (b) { return b.arrayBuffer(); }).then(function (ab) {
        var L = window.PDFLib; return L.PDFDocument.create().then(function (doc) { return doc.embedJpg(ab).then(function (im) { var pg = doc.addPage([595.28, 841.89]); pg.drawImage(im, { x: 0, y: 0, width: 595.28, height: 841.89 }); doc.setTitle(t('inv_title') + ' ' + D.num); return doc.save(); }); });
      }).then(function (bytes) { K.download(new Blob([bytes], { type: 'application/pdf' }), (D.num || 'invoice').replace(/[^\w.-]+/g, '_') + '.pdf'); });
    }
  }

  /* ---------- photo to pencil sketch ---------- */
  function sketch() {
    var img = null, file = null, depth = 70, col = false;
    var dz = K.dropzone({ accept: 'image/*', hint: t('drop_hint_img'), paste: true, onFiles: function (f) { file = f[0]; K.loadImage(file).then(function (im) { img = im; dz.classList.add('hide'); view.classList.remove('hide'); draw(); }); } });
    var view = el('<div class="stack hide"></div>'), cv = el('<canvas style="width:100%;max-height:520px;object-fit:contain;border-radius:12px;background:#fff"></canvas>');
    var opts = el('<div class="panel stack"></div>');
    opts.append(K.rng(t('strength'), 20, 100, depth, '%', function (v) { depth = v; draw(); }), K.chk(t('sketch_color'), col, function (v) { col = v; draw(); }));
    var bar = el('<div class="acts"></div>'); bar.append(K.btn('upload', t('start_over'), 'sec', function () { view.classList.add('hide'); dz.classList.remove('hide'); }), K.btn('download', t('download'), '', function () { K.canvasBlob(cv, 'image/jpeg', 0.93).then(function (b) { K.download(b, K.baseName(file.name) + '-sketch.jpg'); }); }));
    view.append(cv, opts, bar); root.append(dz, view);
    var tm = 0; function draw() { clearTimeout(tm); tm = setTimeout(render, 60); }
    function render() {
      var k = Math.min(1, 1800 / Math.max(img.naturalWidth, img.naturalHeight)), w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
      cv.width = w; cv.height = h; var x = cv.getContext('2d', { willReadFrequently: true });
      x.filter = 'grayscale(1)'; x.drawImage(img, 0, 0, w, h); x.filter = 'none'; var g = x.getImageData(0, 0, w, h);
      var b = document.createElement('canvas'); b.width = w; b.height = h; var bx = b.getContext('2d'); bx.filter = 'grayscale(1) invert(1) blur(' + Math.max(2, w / 220) + 'px)'; bx.drawImage(img, 0, 0, w, h); var bl = bx.getImageData(0, 0, w, h).data;
      var c0 = null; if (col) { x.drawImage(img, 0, 0, w, h); c0 = x.getImageData(0, 0, w, h).data; }
      var d = g.data, gam = 0.4 + depth / 90;
      for (var i = 0; i < d.length; i += 4) { var a = d[i], bb = bl[i], v = bb >= 255 ? 255 : Math.min(255, a * 255 / (255 - bb)); v = 255 * Math.pow(v / 255, gam);
        if (c0) { var f = v / 255; d[i] = 255 - (255 - c0[i]) * 0.55 * (1 - f * 0.4); d[i + 1] = 255 - (255 - c0[i + 1]) * 0.55 * (1 - f * 0.4); d[i + 2] = 255 - (255 - c0[i + 2]) * 0.55 * (1 - f * 0.4); d[i] *= f; d[i + 1] *= f; d[i + 2] *= f; }
        else d[i] = d[i + 1] = d[i + 2] = v; }
      x.putImageData(g, 0, 0);
    }
  }
});
