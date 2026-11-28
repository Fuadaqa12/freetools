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

  ({ mp3: mp3 })[o.mode]();

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
});
