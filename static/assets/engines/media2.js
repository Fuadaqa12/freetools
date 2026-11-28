/* Media tools, batch 2: video → MP3 (WebAudio + lamejs) */
TK.register('media2', function (root, o, K) {
  var t = K.t, el = K.el, esc = K.esc;
  var V = new URL(K.root + 'assets/vendor/', location.href).href;

  function progress() {
    var w = el('<div class="stack hide" style="gap:8px;padding:18px 0"><div class="row" style="justify-content:space-between"><span class="muted pl"></span><b class="pv">0%</b></div><div style="height:8px;border-radius:99px;background:var(--line);overflow:hidden"><div class="pb" style="height:100%;width:0;background:linear-gradient(90deg,#14b8a6,#5b4cf5);transition:width .2s"></div></div></div>');
    w.set = function (label, p) { w.classList.remove('hide'); w.querySelector('.pl').textContent = label; var v = Math.max(0, Math.min(100, Math.round(p * 100))); w.querySelector('.pv').textContent = v + '%'; w.querySelector('.pb').style.width = v + '%'; };
    w.hide = function () { w.classList.add('hide'); };
    return w;
  }
  function script(src) { return new Promise(function (res, rej) { if (document.querySelector('script[data-s="' + src + '"]')) return res(); var x = document.createElement('script'); x.src = V + src; x.dataset.s = src; x.onload = res; x.onerror = rej; document.head.appendChild(x); }); }
  function fmtTime(s) { s = Math.round(s); var m = Math.floor(s / 60); return m + ':' + String(s % 60).padStart(2, '0'); }

  ({ mp3: mp3, vcompress: vcompress, gif: gif })[o.mode]();

  /* ---------- video / audio → MP3 ---------- */
  function mp3() {
    var file = null, buf = null, kbps = 192, out = null;
    var dz = K.dropzone({ accept: 'video/*,audio/*,.mkv,.mov,.m4a,.ogg,.webm', hint: t('drop_hint_video'), onFiles: function (f) { load(f[0]); } });
    var top = el('<div class="panel stack"></div>');
    top.append(K.sel(t('quality'), [['128', '128 kbps'], ['192', '192 kbps — ' + t('recommended')], ['256', '256 kbps'], ['320', '320 kbps']], '192', function (v) { kbps = +v; if (buf) encode(); }));
    var prog = progress();
    var view = el('<div class="stack hide" style="margin-top:14px"></div>');
    var head = el('<div class="file"></div>');
    var player = el('<audio controls style="width:100%"></audio>');
    var bar = el('<div class="acts"></div>');
    bar.append(
      K.btn('upload', t('start_over'), 'sec', function () { file = buf = out = null; view.classList.add('hide'); dz.classList.remove('hide'); }),
      K.btn('download', t('download') + ' MP3', '', function () { if (out) K.download(out, K.baseName(file.name) + '.mp3'); })
    );
    view.append(head, player, bar);
    root.append(top, dz, prog, view);

    function load(f) {
      file = f; dz.classList.add('hide'); view.classList.add('hide'); prog.set(t('reading_file'), 0.05);
      f.arrayBuffer().then(function (ab) {
        prog.set(t('reading_file'), 0.3);
        var AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
        return new Promise(function (res, rej) { ac.decodeAudioData(ab, res, rej); }).then(function (b) { try { ac.close(); } catch (e) { } return b; });
      }).then(function (b) { buf = b; return encode(); })
        .catch(function (e) { console.error(e); prog.hide(); K.toast(t('no_audio_track')); dz.classList.remove('hide'); });
    }
    function encode() {
      view.classList.add('hide');
      return script('media/lame.js').then(function () {
        var ch = Math.min(2, buf.numberOfChannels), sr = buf.sampleRate, enc = new lamejs.Mp3Encoder(ch, sr, kbps);
        var L = buf.getChannelData(0), R = ch > 1 ? buf.getChannelData(1) : null, n = L.length, block = 1152 * 64, parts = [], i = 0;
        function conv(a, s, e) { var o2 = new Int16Array(e - s); for (var k = s; k < e; k++) { var v = Math.max(-1, Math.min(1, a[k])); o2[k - s] = v < 0 ? v * 0x8000 : v * 0x7fff; } return o2; }
        return new Promise(function (res) {
          (function step() {
            var stop = Math.min(n, i + block * 4);
            for (; i < stop; i += block) {
              var e = Math.min(n, i + block), l = conv(L, i, e), d = R ? enc.encodeBuffer(l, conv(R, i, e)) : enc.encodeBuffer(l);
              if (d.length) parts.push(new Uint8Array(d));
            }
            prog.set(t('converting'), i / n);
            if (i < n) setTimeout(step, 0); else { var f2 = enc.flush(); if (f2.length) parts.push(new Uint8Array(f2)); res(new Blob(parts, { type: 'audio/mpeg' })); }
          })();
        });
      }).then(function (b) {
        out = b; prog.hide();
        head.innerHTML = '<div class="th">MP3</div><div class="meta"><div class="nm">' + esc(K.baseName(file.name)) + '.mp3</div><div class="sz"><bdi>' + K.bytes(b.size) + '</bdi> · ' + fmtTime(buf.duration) + ' · ' + kbps + ' kbps</div></div>';
        if (player.src) URL.revokeObjectURL(player.src); player.src = URL.createObjectURL(b);
        view.classList.remove('hide');
      });
    }
  }

  function loadVideo(f) {
    return new Promise(function (res, rej) {
      var v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = URL.createObjectURL(f);
      v.onloadedmetadata = function () { if (!v.videoWidth) return rej(new Error('no video')); res(v); }; v.onerror = rej;
    });
  }
  function seek(v, tm) { return new Promise(function (r) { if (Math.abs(v.currentTime - tm) < 0.001 && v.readyState >= 2) return r(); v.onseeked = function () { v.onseeked = null; r(); }; v.currentTime = tm; }); }
  function fileHead(name, size, extra) { return '<div class="th">' + esc(name.split('.').pop().toUpperCase()) + '</div><div class="meta"><div class="nm">' + esc(name) + '</div><div class="sz"><bdi>' + K.bytes(size) + '</bdi>' + (extra ? ' · ' + extra : '') + '</div></div>'; }

  /* ---------- video compressor (canvas + MediaRecorder) ---------- */
  function vcompress() {
    var file = null, vid = null, q = 'med', res = '720', out = null, ext = 'mp4';
    var dz = K.dropzone({ accept: 'video/*,.mkv,.mov', hint: t('drop_hint_video'), onFiles: function (f) { load(f[0]); } });
    var top = el('<div class="panel stack"></div>');
    top.append(K.seg([['high', t('vq_small')], ['med', t('vq_balanced')], ['low', t('vq_best')]], q, function (v) { q = v; }),
      K.sel(t('resolution'), [['1080', '1080p'], ['720', '720p — ' + t('recommended')], ['480', '480p'], ['orig', t('original')]], res, function (v) { res = v; }));
    var prog = progress();
    var src = el('<div class="file hide"></div>');
    var go = el('<div class="acts hide"></div>');
    go.append(K.btn('zap', t('compress_video'), 'big', run));
    var view = el('<div class="stack hide" style="margin-top:14px"></div>');
    var head = el('<div class="file"></div>'), player = el('<video controls playsinline style="width:100%;max-height:420px;border-radius:12px;background:#000"></video>');
    var bar = el('<div class="acts"></div>');
    bar.append(K.btn('upload', t('start_over'), 'sec', function () { file = vid = out = null; view.classList.add('hide'); src.classList.add('hide'); go.classList.add('hide'); dz.classList.remove('hide'); }),
      K.btn('download', t('download'), '', function () { if (out) K.download(out, K.baseName(file.name) + '-small.' + ext); }));
    view.append(head, player, bar);
    root.append(top, dz, src, go, prog, view, el('<p class="muted" style="margin:8px 0 0;font-size:13px">' + esc(t('vc_note')) + '</p>'));
    function load(f) {
      if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) { K.toast(t('error')); return; }
      file = f; dz.classList.add('hide');
      loadVideo(f).then(function (v) { vid = v; src.innerHTML = fileHead(f.name, f.size, v.videoWidth + '×' + v.videoHeight + ' · ' + fmtTime(v.duration)); src.classList.remove('hide'); go.classList.remove('hide'); })
        .catch(function () { K.toast(t('cannot_read')); dz.classList.remove('hide'); });
    }
    function run() {
      go.classList.add('hide'); view.classList.add('hide'); prog.set(t('compressing'), 0);
      var v = vid, W = v.videoWidth, H = v.videoHeight, m = res === 'orig' ? 1e9 : +res, k = Math.min(1, m / Math.min(W, H));
      var w = Math.round(W * k / 2) * 2, h = Math.round(H * k / 2) * 2;
      var bpp = { high: 0.05, med: 0.09, low: 0.15 }[q], vbr = Math.round(w * h * 30 * bpp);
      var cv = document.createElement('canvas'); cv.width = w; cv.height = h; var x = cv.getContext('2d');
      var stream = cv.captureStream(30);
      v.muted = false; v.volume = 0;
      try { var as = (v.captureStream || v.mozCaptureStream).call(v); as.getAudioTracks().forEach(function (tr) { stream.addTrack(tr); }); } catch (e) { }
      var types = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'], mt = types.filter(function (z) { return MediaRecorder.isTypeSupported(z); })[0] || '';
      ext = /mp4/.test(mt) ? 'mp4' : 'webm';
      var rec = new MediaRecorder(stream, { mimeType: mt, videoBitsPerSecond: vbr, audioBitsPerSecond: 96000 }), parts = [];
      rec.ondataavailable = function (e) { if (e.data.size) parts.push(e.data); };
      rec.onstop = function () {
        out = new Blob(parts, { type: mt.split(';')[0] || 'video/webm' }); prog.hide();
        var pc = Math.round((1 - out.size / file.size) * 100);
        head.innerHTML = fileHead(K.baseName(file.name) + '-small.' + ext, out.size, w + '×' + h + (pc > 0 ? ' · <b style="color:#16a34a">−' + pc + '%</b>' : ''));
        if (player.src) URL.revokeObjectURL(player.src); player.src = URL.createObjectURL(out); view.classList.remove('hide');
        if (pc <= 0) K.toast(t('vc_bigger'));
      };
      var raf = ('requestVideoFrameCallback' in v) ? function (f) { v.requestVideoFrameCallback(f); } : requestAnimationFrame;
      function draw() { x.drawImage(v, 0, 0, w, h); prog.set(t('compressing') + ' ' + fmtTime(v.currentTime) + ' / ' + fmtTime(v.duration), v.currentTime / v.duration); if (!v.ended && rec.state === 'recording') raf(draw); }
      seek(v, 0).then(function () { x.drawImage(v, 0, 0, w, h); rec.start(1000); v.onended = function () { setTimeout(function () { rec.stop(); }, 200); }; return v.play(); })
        .then(function () { raf(draw); }).catch(function (e) { console.error(e); prog.hide(); K.toast(t('error')); go.classList.remove('hide'); });
    }
  }

  /* ---------- video → GIF (gifenc) ---------- */
  function gif() {
    var file = null, vid = null, fps = 10, width = 480, from = 0, len = 5, out = null;
    var dz = K.dropzone({ accept: 'video/*,.mkv,.mov', hint: t('drop_hint_video'), onFiles: function (f) { load(f[0]); } });
    var prog = progress();
    var edit = el('<div class="stack hide"></div>');
    var prev = el('<video controls muted playsinline style="width:100%;max-height:360px;border-radius:12px;background:#000"></video>');
    var opts = el('<div class="panel stack"></div>');
    var rFrom, rLen;
    var go = el('<div class="acts"></div>'); go.append(K.btn('zap', t('make_gif'), 'big', run));
    edit.append(prev, opts, go);
    var view = el('<div class="stack hide" style="margin-top:14px"></div>');
    var head = el('<div class="file"></div>'), im = el('<img alt="" style="max-width:100%;border-radius:12px;align-self:center">');
    var bar = el('<div class="acts"></div>');
    bar.append(K.btn('upload', t('start_over'), 'sec', function () { view.classList.add('hide'); edit.classList.add('hide'); dz.classList.remove('hide'); }),
      K.btn('download', t('download') + ' GIF', '', function () { if (out) K.download(out, K.baseName(file.name) + '.gif'); }));
    view.append(head, im, bar);
    root.append(dz, edit, prog, view);
    function load(f) {
      file = f; dz.classList.add('hide');
      loadVideo(f).then(function (v) {
        vid = v; if (prev.src) URL.revokeObjectURL(prev.src); prev.src = URL.createObjectURL(f);
        var d = Math.floor(v.duration * 10) / 10; from = 0; len = Math.min(5, d);
        opts.innerHTML = '';
        opts.append(K.rng(t('start_sec'), 0, Math.max(0, Math.floor(d - 0.5)), 0, 's', function (z) { from = z; prev.currentTime = z; }),
          K.rng(t('length_sec'), 1, Math.max(1, Math.min(20, Math.ceil(d))), Math.max(1, Math.round(len)), 's', function (z) { len = z; }),
          K.seg([['320', '320px'], ['480', '480px'], ['640', '640px']], '480', function (z) { width = +z; }),
          K.seg([['8', '8 fps'], ['10', '10 fps'], ['15', '15 fps']], '10', function (z) { fps = +z; }));
        edit.classList.remove('hide');
      }).catch(function () { K.toast(t('cannot_read')); dz.classList.remove('hide'); });
    }
    function run() {
      edit.classList.add('hide'); view.classList.add('hide'); prog.set(t('converting'), 0);
      script('media/gifenc.js').then(function () {
        var v = vid, k = Math.min(1, width / v.videoWidth), w = Math.round(v.videoWidth * k), h = Math.round(v.videoHeight * k);
        var cv = document.createElement('canvas'); cv.width = w; cv.height = h; var x = cv.getContext('2d', { willReadFrequently: true });
        var end = Math.min(v.duration, from + len), n = Math.max(1, Math.round((end - from) * fps)), enc = gifenc.GIFEncoder(), i = 0, delay = Math.round(1000 / fps);
        return new Promise(function (res, rej) {
          (function next() {
            if (i >= n) { enc.finish(); return res(new Blob([enc.bytes()], { type: 'image/gif' })); }
            seek(v, Math.min(v.duration - 0.01, from + i / fps)).then(function () {
              x.drawImage(v, 0, 0, w, h); var d = x.getImageData(0, 0, w, h).data;
              var pal = gifenc.quantize(d, 256), idx = gifenc.applyPalette(d, pal);
              enc.writeFrame(idx, w, h, { palette: pal, delay: delay }); i++; prog.set(t('converting'), i / n); next();
            }).catch(rej);
          })();
        });
      }).then(function (b) {
        out = b; prog.hide(); head.innerHTML = fileHead(K.baseName(file.name) + '.gif', b.size, len + 's · ' + fps + ' fps');
        if (im.src) URL.revokeObjectURL(im.src); im.src = URL.createObjectURL(b); view.classList.remove('hide');
      }).catch(function (e) { console.error(e); prog.hide(); K.toast(t('error')); edit.classList.remove('hide'); });
    }
  }
});
