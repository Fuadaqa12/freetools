/* Batch 6: remove photo metadata, Wi-Fi QR, New Year countdown, text to handwriting */
TK.register('tools5', function (root, o, K) {
  var t = K.t, el = K.el, esc = K.esc;
  var V = new URL(K.root + 'assets/vendor/', location.href).href;
  function script(src) { return new Promise(function (res, rej) { if (document.querySelector('script[data-s="' + src + '"]')) return res(); var x = document.createElement('script'); x.src = V + src; x.dataset.s = src; x.onload = res; x.onerror = rej; document.head.appendChild(x); }); }
  ({ exif: exif, wifi: wifi, newyear: newyear, hand: hand })[o.mode]();

  /* ---------- remove EXIF / GPS ---------- */
  function exif() {
    var dz = K.dropzone({ accept: 'image/*', multiple: true, hint: t('drop_hint_img'), onFiles: add });
    var list = el('<div class="stack" style="gap:10px;margin-top:12px"></div>'), outs = [];
    var bar = el('<div class="acts hide"></div>');
    bar.append(K.btn('download', t('download_all') + ' (ZIP)', '', function () { Promise.all(outs.map(function (o2) { return K.blobBytes(o2.b).then(function (d) { return { name: o2.n, data: d }; }); })).then(function (fs) { K.download(K.zip(fs), 'clean-photos.zip'); }); }));
    root.append(dz, el('<p class="muted" style="margin:6px 0 0;font-size:13px">' + esc(t('exif_note')) + '</p>'), list, bar);
    function readExif(u8) {
      var info = {}, i = 2;
      if (u8[0] !== 0xFF || u8[1] !== 0xD8) return info;
      while (i < u8.length - 4) {
        if (u8[i] !== 0xFF) break; var mk = u8[i + 1], len = (u8[i + 2] << 8) | u8[i + 3];
        if (mk === 0xE1 && u8[i + 4] === 0x45 && u8[i + 5] === 0x78) {
          var b = i + 10, dv = new DataView(u8.buffer, u8.byteOffset + b), le = dv.getUint16(0) === 0x4949;
          var g16 = function (o3) { return dv.getUint16(o3, le); }, g32 = function (o3) { return dv.getUint32(o3, le); };
          var str = function (o3, n) { var s = ''; for (var k = 0; k < n - 1; k++) { var c = dv.getUint8(o3 + k); if (!c) break; s += String.fromCharCode(c); } return s.trim(); };
          var ifd = function (off, cb) { try { var n = g16(off); for (var k = 0; k < n; k++) { var e = off + 2 + k * 12, tag = g16(e), ty = g16(e + 2), cnt = g32(e + 4), sz = ({ 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 })[ty] || 1, vo = cnt * sz > 4 ? g32(e + 8) : e + 8; cb(tag, cnt, vo, e); } } catch (er) { } };
          ifd(g32(4), function (tag, cnt, vo, e) {
            if (tag === 0x010F) info.make = str(vo, cnt); if (tag === 0x0110) info.model = str(vo, cnt); if (tag === 0x0132) info.date = str(vo, cnt);
            if (tag === 0x8825) { var gp = g32(e + 8), G = {}; ifd(gp, function (t2, c2, v2) { if (t2 === 1 || t2 === 3) G[t2] = String.fromCharCode(dv.getUint8(v2)); if (t2 === 2 || t2 === 4) { var r = function (k) { return g32(v2 + k * 8) / (g32(v2 + k * 8 + 4) || 1); }; G[t2] = r(0) + r(1) / 60 + r(2) / 3600; } }); if (G[2] != null && G[4] != null) info.gps = (G[1] === 'S' ? -G[2] : G[2]).toFixed(5) + ', ' + (G[3] === 'W' ? -G[4] : G[4]).toFixed(5); }
          });
        }
        if (mk === 0xDA) break; i += 2 + len;
      }
      return info;
    }
    function stripJpeg(u8) {
      var parts = [u8.subarray(0, 2)], i = 2, removed = 0;
      while (i < u8.length) {
        if (u8[i] !== 0xFF) { parts.push(u8.subarray(i)); break; }
        var mk = u8[i + 1]; if (mk === 0xDA) { parts.push(u8.subarray(i)); break; }
        var len = (u8[i + 2] << 8) | u8[i + 3], seg = u8.subarray(i, i + 2 + len);
        var icc = mk === 0xE2 && String.fromCharCode.apply(null, u8.subarray(i + 4, i + 15)) === 'ICC_PROFILE';
        if ((mk >= 0xE1 && mk <= 0xEF && !icc) || mk === 0xFE) removed += seg.length; else parts.push(seg);
        i += 2 + len;
      }
      return { b: new Blob(parts, { type: 'image/jpeg' }), removed: removed };
    }
    function add(files) {
      [].slice.call(files).forEach(function (f) {
        var row = el('<div class="panel stack" style="gap:6px"><b></b><div class="muted" style="font-size:14px"></div></div>'); row.querySelector('b').textContent = f.name; list.append(row);
        f.arrayBuffer().then(function (ab) {
          var u8 = new Uint8Array(ab), info = readExif(u8), isJ = u8[0] === 0xFF && u8[1] === 0xD8;
          var p = isJ ? Promise.resolve(stripJpeg(u8)) : K.loadImage(f).then(function (im) { var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); var ty = /png/.test(f.type) ? 'image/png' : /webp/.test(f.type) ? 'image/webp' : 'image/jpeg'; return K.canvasBlob(c, ty, 0.95).then(function (b) { return { b: b, removed: -1 }; }); });
          return p.then(function (r) {
            var found = [];
            if (info.gps) found.push('📍 ' + t('exif_gps') + ': ' + info.gps);
            if (info.make || info.model) found.push('📷 ' + [info.make, info.model].filter(Boolean).join(' '));
            if (info.date) found.push('🕒 ' + info.date);
            var name = K.baseName(f.name) + '-clean.' + (r.b.type.split('/')[1] === 'jpeg' ? 'jpg' : r.b.type.split('/')[1]);
            outs.push({ n: name, b: r.b });
            row.querySelector('.muted').innerHTML = (found.length ? '<span style="color:#dc2626">' + esc(t('exif_found')) + '</span><br>' + found.map(esc).join('<br>') + '<br>' : '') + '<span style="color:#16a34a">✓ ' + esc(t('exif_clean')) + '</span> · ' + K.bytes(r.b.size);
            row.append(K.btn('download', t('download'), 'sm sec', function () { K.download(r.b, name); }));
            bar.classList.remove('hide');
          });
        }).catch(function (e) { console.error(e); row.querySelector('.muted').textContent = t('cannot_read'); });
      });
    }
  }

  /* ---------- Wi-Fi QR ---------- */
  function wifi() {
    var D = { s: '', p: '', e: 'WPA', h: false };
    var g = el('<div class="fields"></div>');
    var ss = el('<label class="f"><span>' + esc(t('wifi_name')) + '</span><input class="inp" autocomplete="off"></label>'), pw = el('<label class="f"><span>' + esc(t('wifi_pass')) + '</span><input class="inp" autocomplete="off"></label>');
    ss.querySelector('input').oninput = function (e) { D.s = e.target.value; draw(); }; pw.querySelector('input').oninput = function (e) { D.p = e.target.value; draw(); };
    g.append(ss, pw);
    var opts = el('<div class="panel stack"></div>');
    opts.append(K.seg([['WPA', 'WPA/WPA2/WPA3'], ['WEP', 'WEP'], ['nopass', t('wifi_open')]], 'WPA', function (v) { D.e = v; draw(); }), K.chk(t('wifi_hidden'), false, function (v) { D.h = v; draw(); }));
    var card = el('<div style="align-self:center;background:#fff;color:#111;border-radius:22px;padding:22px;text-align:center;box-shadow:var(--shadow-lg);width:300px;max-width:100%"><div style="font-size:30px">📶</div><b style="font-size:20px;display:block;margin:4px 0 2px">' + esc(t('wifi_scan')) + '</b><div class="nm" style="font-size:15px;color:#555;word-break:break-all"></div></div>');
    var cv = document.createElement('canvas'); cv.style.cssText = 'width:100%;margin-top:10px;image-rendering:pixelated'; card.insertBefore(cv, card.querySelector('.nm'));
    var bar = el('<div class="acts"></div>');
    bar.append(K.btn('download', 'PNG', 'sec', function () { K.canvasBlob(cv, 'image/png').then(function (b) { K.download(b, 'wifi-qr.png'); }); }), K.btn('download', t('wifi_card'), '', cardPng));
    root.append(g, opts, card, el('<p class="muted" style="margin:0;font-size:13px">' + esc(t('wifi_note')) + '</p>'), bar);
    function q(s) { return s.replace(/([\;,:"])/g, '\\$1'); }
    function data() { return 'WIFI:T:' + D.e + ';S:' + q(D.s) + ';' + (D.e !== 'nopass' ? 'P:' + q(D.p) + ';' : '') + (D.h ? 'H:true;' : '') + ';'; }
    function draw() {
      script('qrcode.js').then(function () {
        var Q = window.qrcode; if (Q.stringToBytesFuncs && Q.stringToBytesFuncs['UTF-8']) Q.stringToBytes = Q.stringToBytesFuncs['UTF-8'];
        var qr = Q(0, 'M'); qr.addData(data(), 'Byte'); qr.make(); var n = qr.getModuleCount(), cell = 12, s = (n + 8) * cell;
        cv.width = cv.height = s; var x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, s, s); x.fillStyle = '#111';
        for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) x.fillRect((c + 4) * cell, (r + 4) * cell, cell, cell);
        card.querySelector('.nm').textContent = D.s ? (t('wifi_name') + ': ' + D.s) : '';
      });
    }
    function cardPng() {
      var W = 1200, H = 1600, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
      var g2 = x.createLinearGradient(0, 0, W, H); g2.addColorStop(0, '#5b4cf5'); g2.addColorStop(1, '#db2777'); x.fillStyle = g2; x.fillRect(0, 0, W, H);
      x.fillStyle = '#fff'; if (x.roundRect) { x.beginPath(); x.roundRect(100, 100, W - 200, H - 200, 60); x.fill(); } else x.fillRect(100, 100, W - 200, H - 200);
      x.fillStyle = '#111'; x.textAlign = 'center'; x.font = '120px sans-serif'; x.fillText('📶', W / 2, 300); x.font = '700 64px sans-serif'; x.fillText(t('wifi_scan'), W / 2, 410);
      x.drawImage(cv, 250, 470, 700, 700); x.font = '44px sans-serif'; x.fillStyle = '#444';
      x.fillText(t('wifi_name') + ': ' + D.s, W / 2, 1270); if (D.e !== 'nopass' && D.p) x.fillText(t('wifi_pass') + ': ' + D.p, W / 2, 1340);
      K.canvasBlob(c, 'image/png').then(function (b) { K.download(b, 'wifi-card.png'); });
    }
    draw();
  }

  /* ---------- New Year countdown ---------- */
  function newyear() {
    var now = new Date(), yr = now.getFullYear() + (now.getMonth() === 0 && now.getDate() === 1 && now.getHours() < 1 ? 0 : 1);
    var box = el('<div style="position:relative;overflow:hidden;border-radius:24px;padding:34px 16px;text-align:center;color:#fff;background:radial-gradient(circle at 30% 0%,#4338ca,#0f172a 70%)"></div>');
    var sn = el('<canvas style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></canvas>');
    var h = el('<div style="position:relative;font-size:18px;opacity:.85"></div>'); h.textContent = t('ny_until', { y: yr });
    var cells = el('<div style="position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;max-width:560px;margin:18px auto 6px"></div>');
    var lab = [t('ny_days'), t('ny_hours'), t('ny_min'), t('ny_sec')], vals = [];
    lab.forEach(function (l2) { var c = el('<div style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:14px 4px;backdrop-filter:blur(4px)"><b style="display:block;font-size:clamp(30px,8vw,56px);font-variant-numeric:tabular-nums;line-height:1.1">0</b><span style="font-size:13px;opacity:.8"></span></div>'); c.querySelector('span').textContent = l2; vals.push(c.querySelector('b')); cells.append(c); });
    var msg = el('<div style="position:relative;font-size:22px;font-weight:700;min-height:30px"></div>');
    box.append(sn, h, cells, msg);
    var share = el('<div class="acts"></div>');
    share.append(K.btn('copy', t('copy'), 'sec', function () { K.copy(text()); }));
    if (navigator.share) share.append(K.btn('arrow', t('share'), '', function () { navigator.share({ text: text(), url: location.href }).catch(function () { }); }));
    root.append(box, share);
    function left() { return Math.max(0, new Date(yr, 0, 1) - new Date()); }
    function text() { var s = Math.floor(left() / 1000); return '🎄 ' + t('ny_until', { y: yr }) + ': ' + Math.floor(s / 86400) + ' ' + t('ny_days') + ' ' + Math.floor(s % 86400 / 3600) + ' ' + t('ny_hours') + ' ✨'; }
    (function tick() { var s = Math.floor(left() / 1000); [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].forEach(function (v, i) { vals[i].textContent = i ? String(v).padStart(2, '0') : v; }); msg.textContent = s ? '' : '🎉 ' + t('ny_happy') + ' 🎉'; setTimeout(tick, 1000 - Date.now() % 1000); })();
    var fl = []; for (var i = 0; i < 70; i++) fl.push({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 2.5, v: 0.0008 + Math.random() * 0.0015, d: Math.random() * 6 });
    (function snow() { if (!sn.isConnected) return; var w = sn.width = box.clientWidth, hh = sn.height = box.clientHeight, x = sn.getContext('2d'); x.fillStyle = 'rgba(255,255,255,.85)';
      fl.forEach(function (f) { f.y += f.v; f.d += 0.01; if (f.y > 1) f.y = 0; x.beginPath(); x.arc((f.x + Math.sin(f.d) * 0.01) * w, f.y * hh, f.r, 0, 7); x.fill(); }); requestAnimationFrame(snow); })();
  }

  /* ---------- text to handwriting ---------- */
  function hand() {
    var P = { font: 'Caveat', ink: '#1e3a8a', paper: 'lines', size: 34 };
    var cssReady = new Promise(function (res) { if (document.getElementById('hwfonts')) return res(); var lk = document.createElement('link'); lk.id = 'hwfonts'; lk.rel = 'stylesheet'; lk.href = V + 'hw/fonts.css'; lk.onload = lk.onerror = res; document.head.appendChild(lk); });
    var ta = el('<textarea class="inp" style="min-height:160px"></textarea>'); ta.value = t('hw_sample');
    var opts = el('<div class="panel stack"></div>');
    var inks = el('<div class="row" style="gap:8px"></div>');
    [['#1e3a8a', 'blue'], ['#111827', 'black'], ['#b91c1c', 'red'], ['#5b21b6', 'violet']].forEach(function (c) { var b = el('<button type="button" aria-label="' + c[1] + '" style="width:32px;height:32px;border-radius:50%;border:2px solid var(--line);cursor:pointer;background:' + c[0] + '"></button>'); b.onclick = function () { P.ink = c[0]; draw(); }; inks.append(b); });
    opts.append(K.seg([['Caveat', 'Caveat'], ['Neucha', 'Neucha'], ['Marck Script', 'Marck']], P.font, function (v) { P.font = v; draw(); }),
      K.seg([['lines', t('hw_lines')], ['grid', t('hw_grid')], ['plain', t('hw_plain')]], P.paper, function (v) { P.paper = v; draw(); }), inks,
      K.rng(t('size'), 24, 48, P.size, 'px', function (v) { P.size = v; draw(); }));
    var pages = el('<div class="stack" style="gap:14px"></div>');
    var bar = el('<div class="acts"></div>');
    bar.append(K.btn('download', 'PNG', 'sec', function () { pages.querySelectorAll('canvas').forEach(function (c, i) { K.canvasBlob(c, 'image/jpeg', 0.92).then(function (b) { K.download(b, 'handwriting-' + (i + 1) + '.jpg'); }); }); }),
      K.btn('download', 'PDF', '', pdf));
    root.append(ta, opts, pages, bar);
    var tm; ta.oninput = function () { clearTimeout(tm); tm = setTimeout(draw, 250); };
    function rnd(seed) { var s = seed; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
    function draw() {
      cssReady.then(function () { return document.fonts && document.fonts.load ? Promise.all([document.fonts.load(P.size + 'px "' + P.font + '"', 'Aa'), document.fonts.load(P.size + 'px "' + P.font + '"', 'Яя')]) : null; }).then(render, render);
    }
    function render() {
      pages.innerHTML = '';
      var W = 1240, H = 1754, sc = 2, lh = Math.round(P.size * sc * 1.55), mL = 170, mR = 80, top = 150, R = rnd(7);
      var newPage = function () { var c = document.createElement('canvas'); c.width = W; c.height = H; c.style.cssText = 'width:100%;max-width:620px;align-self:center;box-shadow:var(--shadow-lg);border-radius:4px'; var x = c.getContext('2d'); x.fillStyle = '#fffdf7'; x.fillRect(0, 0, W, H);
        if (P.paper === 'lines') { x.strokeStyle = '#bfdbfe'; x.lineWidth = 2; for (var y = top + lh * 0.25; y < H - 40; y += lh) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); } x.strokeStyle = '#fca5a5'; x.beginPath(); x.moveTo(mL - 30, 0); x.lineTo(mL - 30, H); x.stroke(); }
        if (P.paper === 'grid') { x.strokeStyle = '#cfe0f5'; x.lineWidth = 1.5; var g = lh / 2; for (var gy = 0; gy < H; gy += g) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); } for (var gx = 0; gx < W; gx += g) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); } }
        x.font = (P.size * sc) + 'px "' + P.font + '",cursive'; x.fillStyle = P.ink; x.textBaseline = 'alphabetic'; pages.append(c); return x; };
      var x = newPage(), y = top;
      ta.value.split('\n').forEach(function (para) {
        var words = para.split(/(\s+)/), line = '';
        var flush = function (s) { if (y > H - 80) { x = newPage(); y = top; } var cx = mL + (R() - 0.5) * 6; for (var i = 0; i < s.length; i++) { var ch = s[i]; x.save(); x.translate(cx, y + (R() - 0.5) * 3); x.rotate((R() - 0.5) * 0.05); x.globalAlpha = 0.82 + R() * 0.18; x.fillText(ch, 0, 0); x.restore(); cx += x.measureText(ch).width + (R() - 0.5) * 1.2; } y += lh; };
        words.forEach(function (w) { var test = line + w; if (x.measureText(test).width > W - mL - mR && line.trim()) { flush(line.trim()); line = w.trim() ? w : ''; } else line = test; });
        flush(line.trim());
      });
    }
    function pdf() {
      script('pdf-lib.min.js').then(function () {
        var L = window.PDFLib; return L.PDFDocument.create().then(function (doc) {
          return Promise.all([].map.call(pages.querySelectorAll('canvas'), function (c) { return K.canvasBlob(c, 'image/jpeg', 0.9).then(function (b) { return b.arrayBuffer(); }); })).then(function (abs) {
            var ch = Promise.resolve(); abs.forEach(function (ab) { ch = ch.then(function () { return doc.embedJpg(ab).then(function (im) { doc.addPage([595.28, 841.89]).drawImage(im, { x: 0, y: 0, width: 595.28, height: 841.89 }); }); }); });
            return ch.then(function () { return doc.save(); });
          });
        });
      }).then(function (bytes) { K.download(new Blob([bytes], { type: 'application/pdf' }), 'handwriting.pdf'); });
    }
    draw();
  }
});
