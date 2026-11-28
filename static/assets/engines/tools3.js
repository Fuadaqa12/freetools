/* Batch 4: HEIC→JPG, QR scanner, audio cutter, photo collage */
TK.register('tools3', function (root, o, K) {
  var t = K.t, el = K.el, esc = K.esc;
  var V = new URL(K.root + 'assets/vendor/', location.href).href;
  function script(src) { return new Promise(function (res, rej) { if (document.querySelector('script[data-s="' + src + '"]')) return res(); var x = document.createElement('script'); x.src = V + src; x.dataset.s = src; x.onload = res; x.onerror = rej; document.head.appendChild(x); }); }
  function fmt(s) { var m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1); }
  ({ heic: heic, qrscan: qrscan, audiocut: audiocut, collage: collage })[o.mode]();

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
      K.zip(ok.map(function (i) { return { name: i.name, blob: i.out }; })).then(function (z) { K.download(z, 'photos.zip'); });
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
});
