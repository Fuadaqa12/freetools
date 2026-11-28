/* Batch 6: remove photo metadata, Wi-Fi QR, New Year countdown, text to handwriting */
TK.register('tools5', function (root, o, K) {
  var t = K.t, el = K.el, esc = K.esc;
  var V = new URL(K.root + 'assets/vendor/', location.href).href;
  function script(src) { return new Promise(function (res, rej) { if (document.querySelector('script[data-s="' + src + '"]')) return res(); var x = document.createElement('script'); x.src = V + src; x.dataset.s = src; x.onload = res; x.onerror = rej; document.head.appendChild(x); }); }
  ({ exif: exif, wifi: wifi, newyear: newyear, hand: hand, social: social, word2pdf: word2pdf, vtrim: vtrim, cv: cv })[o.mode]();

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

  /* ---------- social media image resizer ---------- */
  function social() {
    var PRE = [
      ['Instagram', [['ig_post', 'Post 1:1', 1080, 1080], ['ig_portrait', 'Post 4:5', 1080, 1350], ['ig_story', 'Story / Reels 9:16', 1080, 1920]]],
      ['TikTok', [['tt', 'Video cover 9:16', 1080, 1920]]],
      ['YouTube', [['yt_thumb', 'Thumbnail 16:9', 1280, 720], ['yt_banner', 'Channel banner', 2560, 1440]]],
      ['Facebook', [['fb_post', 'Post', 1200, 630], ['fb_cover', 'Cover', 1640, 624]]],
      ['X / Twitter', [['x_post', 'Post 16:9', 1600, 900], ['x_header', 'Header', 1500, 500]]],
      ['LinkedIn', [['li_post', 'Post', 1200, 627], ['li_banner', 'Banner', 1584, 396]]],
      ['Telegram / WhatsApp', [['tg_avatar', 'Avatar', 640, 640], ['wa_status', 'Status 9:16', 1080, 1920]]]];
    var img = null, file = null, sel = PRE[0][1][0], fit = 'fill', bg = '#ffffff';
    var dz = K.dropzone({ accept: 'image/*', hint: t('drop_hint_img'), paste: true, onFiles: function (f) { file = f[0]; K.loadImage(file).then(function (im) { img = im; dz.classList.add('hide'); view.classList.remove('hide'); draw(); }); } });
    var view = el('<div class="stack hide"></div>'), list = el('<div class="stack" style="gap:10px"></div>');
    PRE.forEach(function (g) { var row = el('<div><b style="font-size:14px">' + esc(g[0]) + '</b><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px"></div></div>'); g[1].forEach(function (p) { var b = el('<button type="button" class="chip" style="cursor:pointer"></button>'); b.textContent = p[1] + ' · ' + p[2] + '×' + p[3]; b.onclick = function () { sel = p; list.querySelectorAll('.chip').forEach(function (c) { c.style.outline = ''; }); b.style.outline = '2px solid var(--brand)'; draw(); }; row.querySelector('.row').append(b); }); list.append(row); });
    var cv = el('<canvas style="width:100%;max-height:460px;object-fit:contain;border-radius:10px;background:repeating-conic-gradient(#e5e7eb 0 25%,#fff 0 50%) 0 0/20px 20px"></canvas>');
    var opts = el('<div class="panel stack"></div>');
    opts.append(list, K.seg([['fill', t('soc_fill')], ['fit', t('soc_fit')], ['blur', t('soc_blur')]], fit, function (v) { fit = v; draw(); }));
    var bar = el('<div class="acts"></div>');
    bar.append(K.btn('upload', t('start_over'), 'sec', function () { view.classList.add('hide'); dz.classList.remove('hide'); }), K.btn('download', 'JPG', '', function () { K.canvasBlob(cv, 'image/jpeg', 0.92).then(function (b) { K.download(b, K.baseName(file.name) + '-' + sel[0] + '.jpg'); }); }));
    view.append(cv, opts, bar); root.append(dz, view);
    setTimeout(function () { var f = list.querySelector('.chip'); if (f) f.style.outline = '2px solid var(--brand)'; });
    function draw() {
      var W = sel[2], H = sel[3]; cv.width = W; cv.height = H; var x = cv.getContext('2d'), iw = img.naturalWidth, ih = img.naturalHeight;
      var cover = Math.max(W / iw, H / ih), contain = Math.min(W / iw, H / ih);
      if (fit === 'fill') { x.drawImage(img, (W - iw * cover) / 2, (H - ih * cover) / 2, iw * cover, ih * cover); return; }
      if (fit === 'blur') { x.filter = 'blur(' + Math.round(W / 30) + 'px) brightness(.85)'; x.drawImage(img, (W - iw * cover) / 2 - 40, (H - ih * cover) / 2 - 40, iw * cover + 80, ih * cover + 80); x.filter = 'none'; }
      else { x.fillStyle = bg; x.fillRect(0, 0, W, H); }
      x.drawImage(img, (W - iw * contain) / 2, (H - ih * contain) / 2, iw * contain, ih * contain);
    }
  }

  /* ---------- Word (DOCX) → PDF ---------- */
  function word2pdf() {
    var dz = K.dropzone({ accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document', hint: t('drop_hint_docx'), onFiles: function (f) { go(f[0]); } });
    var view = el('<div class="stack hide"></div>'), frame = el('<iframe title="preview" style="width:100%;height:520px;border:1px solid var(--line);border-radius:12px;background:#fff"></iframe>');
    var bar = el('<div class="acts"></div>'), name = 'document';
    bar.append(K.btn('upload', t('start_over'), 'sec', function () { view.classList.add('hide'); dz.classList.remove('hide'); }), K.btn('download', t('w2p_save'), '', function () { frame.contentWindow.focus(); frame.contentWindow.print(); }));
    view.append(frame, el('<p class="muted" style="margin:0;font-size:13px">' + esc(t('w2p_note')) + '</p>'), bar); root.append(dz, view);
    function go(f) {
      if (!/\.docx$/i.test(f.name)) { K.toast(t('w2p_only')); return; }
      name = K.baseName(f.name); dz.classList.add('hide');
      script('mammoth.min.js').then(function () { return f.arrayBuffer(); }).then(function (ab) { return mammoth.convertToHtml({ arrayBuffer: ab }, { convertImage: mammoth.images.imgElement(function (im) { return im.read('base64').then(function (b) { return { src: 'data:' + im.contentType + ';base64,' + b }; }); }) }); })
        .then(function (r) {
          var css = '@page{size:A4;margin:20mm}body{font-family:Calibri,Carlito,Arial,sans-serif;font-size:11.5pt;line-height:1.5;color:#111;margin:20mm auto;max-width:170mm}h1,h2,h3{line-height:1.25}img{max-width:100%}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:4px 6px;vertical-align:top}@media print{body{margin:0}}';
          var html = '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(name) + '</title><style>' + css + '</style></head><body>' + r.value + '</body></html>';
          frame.srcdoc = html; view.classList.remove('hide');
        }).catch(function (e) { console.error(e); K.toast(t('cannot_read')); dz.classList.remove('hide'); });
    }
  }

  /* ---------- video trimmer ---------- */
  function vtrim() {
    var file = null, a = 0, b = 0, vid = el('<video controls playsinline style="width:100%;max-height:400px;border-radius:12px;background:#000"></video>');
    var dz = K.dropzone({ accept: 'video/*,.mov,.mkv', hint: t('drop_hint_video'), onFiles: function (f) { load(f[0]); } });
    var view = el('<div class="stack hide"></div>'), opts = el('<div class="panel stack"></div>'), info = el('<b style="text-align:center"></b>');
    var prog = el('<p class="muted hide" style="text-align:center;margin:0"></p>');
    var bar = el('<div class="acts"></div>'), out = el('<video controls playsinline class="hide" style="width:100%;max-height:400px;border-radius:12px;background:#000"></video>'), blob = null, ext = 'webm';
    bar.append(K.btn('upload', t('start_over'), 'sec', function () { view.classList.add('hide'); dz.classList.remove('hide'); }), K.btn('scissors', t('vt_cut'), '', cut));
    var dlb = K.btn('download', t('download'), '', function () { K.download(blob, K.baseName(file.name) + '-trim.' + ext); }); dlb.classList.add('hide');
    view.append(vid, opts, info, prog, bar, out, dlb); root.append(dz, view);
    function fmt(s) { var m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1); }
    function upd() { info.textContent = fmt(a) + ' → ' + fmt(b) + ' (' + (b - a).toFixed(1) + 's)'; }
    function load(f) {
      file = f; dz.classList.add('hide'); if (vid.src) URL.revokeObjectURL(vid.src); vid.src = URL.createObjectURL(f);
      vid.onloadedmetadata = function () { var D = Math.floor(vid.duration * 10) / 10; a = 0; b = D; opts.innerHTML = '';
        opts.append(K.rng(t('start_sec'), 0, D, 0, 's', function (v) { a = Math.min(v, b - 0.5); vid.currentTime = a; upd(); }, 0.1), K.rng(t('end_sec'), 0, D, D, 's', function (v) { b = Math.max(v, a + 0.5); vid.currentTime = b; upd(); }, 0.1));
        upd(); view.classList.remove('hide'); out.classList.add('hide'); dlb.classList.add('hide'); };
      vid.onerror = function () { K.toast(t('cannot_read')); dz.classList.remove('hide'); };
    }
    function cut() {
      if (!vid.captureStream && !vid.mozCaptureStream) { K.toast(t('error')); return; }
      var st = (vid.captureStream || vid.mozCaptureStream).call(vid), types = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'], mt = types.filter(function (z) { return MediaRecorder.isTypeSupported(z); })[0] || '';
      ext = /mp4/.test(mt) ? 'mp4' : 'webm';
      var rec = new MediaRecorder(st, { mimeType: mt, videoBitsPerSecond: 6e6 }), parts = [];
      rec.ondataavailable = function (e) { if (e.data.size) parts.push(e.data); };
      rec.onstop = function () { blob = new Blob(parts, { type: mt.split(';')[0] || 'video/webm' }); prog.classList.add('hide'); if (out.src) URL.revokeObjectURL(out.src); out.src = URL.createObjectURL(blob); out.classList.remove('hide'); dlb.classList.remove('hide'); dlb.querySelector('span').textContent = t('download') + ' · ' + K.bytes(blob.size); };
      vid.pause(); vid.currentTime = a;
      vid.onseeked = function () { vid.onseeked = null; rec.start(500); vid.play(); prog.classList.remove('hide');
        (function chk() { prog.textContent = t('vt_working') + ' ' + fmt(vid.currentTime) + ' / ' + fmt(b); if (vid.currentTime >= b || vid.ended) { vid.pause(); rec.stop(); } else requestAnimationFrame(chk); })(); };
    }
  }

  /* ---------- resume / CV builder ---------- */
  function cv() {
    var LS = 'tk_cv', D;
    try { D = JSON.parse(localStorage.getItem(LS)); } catch (e) { }
    D = D || { name: '', title: '', email: '', phone: '', city: '', link: '', about: '', skills: '', langs: '', photo: '', tpl: 'side', color: '#4f46e5',
      exp: [{ a: '', b: '', c: '', d: '' }], edu: [{ a: '', b: '', c: '' }] };
    var form = el('<div class="stack"></div>'), photoImg = null;
    function save() { try { localStorage.setItem(LS, JSON.stringify(D)); } catch (e) { } redraw(); }
    function inp(label, obj, key, ta) { var w = el('<label class="f"><span>' + esc(label) + '</span></label>'), i = el(ta ? '<textarea class="inp" style="min-height:80px"></textarea>' : '<input class="inp">'); i.value = obj[key] || ''; i.oninput = function () { obj[key] = i.value; save(); }; w.append(i); return w; }
    var g1 = el('<div class="fields"></div>');
    g1.append(inp(t('cv_name'), D, 'name'), inp(t('cv_title'), D, 'title'), inp('Email', D, 'email'), inp(t('cv_phone'), D, 'phone'), inp(t('cv_city'), D, 'city'), inp(t('cv_link'), D, 'link'));
    var ph = K.dropzone({ accept: 'image/*', mini: true, label: t('cv_photo'), onFiles: function (f) { K.loadImage(f[0]).then(function (im) { var c = document.createElement('canvas'), s2 = Math.min(im.naturalWidth, im.naturalHeight); c.width = c.height = 400; c.getContext('2d').drawImage(im, (im.naturalWidth - s2) / 2, (im.naturalHeight - s2) / 3, s2, s2, 0, 0, 400, 400); D.photo = c.toDataURL('image/jpeg', 0.85); loadPhoto(); save(); }); } });
    function list(key, fields, title) {
      var box = el('<div class="stack" style="gap:10px"><b>' + esc(title) + '</b></div>'), wrap = el('<div class="stack" style="gap:10px"></div>');
      function render() { wrap.innerHTML = ''; D[key].forEach(function (it, i) { var c = el('<div class="panel stack" style="gap:8px"></div>'), g = el('<div class="fields"></div>'); fields.forEach(function (f) { g.append(inp(f[1], it, f[0], f[2])); }); var x = K.btn('trash', t('cv_del'), 'sm sec', function () { D[key].splice(i, 1); render(); save(); }); c.append(g, x); wrap.append(c); }); }
      render(); box.append(wrap, K.btn('plus', t('cv_add'), 'sm sec', function () { var o2 = {}; fields.forEach(function (f) { o2[f[0]] = ''; }); D[key].push(o2); render(); save(); })); return box;
    }
    var cols = el('<div class="row" style="gap:8px;align-items:center"></div>');
    ['#4f46e5', '#0f766e', '#be123c', '#1e293b', '#b45309', '#7c3aed'].forEach(function (c) { var b = el('<button type="button" aria-label="color" style="width:32px;height:32px;border-radius:50%;border:2px solid var(--line);cursor:pointer;background:' + c + '"></button>'); b.onclick = function () { D.color = c; save(); }; cols.append(b); });
    form.append(K.seg([['side', t('cv_tpl_side')], ['classic', t('cv_tpl_classic')]], D.tpl, function (v) { D.tpl = v; save(); }), cols, g1, ph,
      inp(t('cv_about'), D, 'about', 1),
      list('exp', [['a', t('cv_role')], ['b', t('cv_company')], ['c', t('cv_period')], ['d', t('cv_duties'), 1]], t('cv_exp')),
      list('edu', [['a', t('cv_school')], ['b', t('cv_degree')], ['c', t('cv_period')]], t('cv_edu')),
      inp(t('cv_skills'), D, 'skills'), inp(t('cv_langs'), D, 'langs'));
    var pv = el('<div class="stack" style="gap:12px;margin-top:12px"></div>');
    var bar = el('<div class="acts"></div>');
    bar.append(K.btn('trash', t('clear'), 'sec', function () { try { localStorage.removeItem(LS); } catch (e) { } location.reload(); }), K.btn('download', t('download') + ' PDF', 'big', pdf));
    root.append(form, pv, bar);
    function loadPhoto() { if (!D.photo) { photoImg = null; return; } var im = new Image(); im.onload = function () { photoImg = im; redraw(); }; im.src = D.photo; }
    var pages = [], tm;
    function redraw() { clearTimeout(tm); tm = setTimeout(render, 150); }
    function render() {
      var W = 1240, H = 1754, F = '"Inter","Segoe UI",Roboto,Arial,sans-serif', C = D.color, side = D.tpl === 'side', SW = side ? 420 : 0, M = 70;
      pages = []; pv.innerHTML = '';
      var x, y, X0 = SW + M, XW = W - SW - 2 * M;
      function page() { var c = document.createElement('canvas'); c.width = W; c.height = H; c.style.cssText = 'width:100%;max-width:620px;align-self:center;box-shadow:var(--shadow-lg);border-radius:4px'; x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); if (side) { x.fillStyle = C; x.fillRect(0, 0, SW, H); } pages.push(c); pv.append(c); y = M; }
      function font(sz, w) { x.font = (w || 400) + ' ' + sz + 'px ' + F; }
      function wrap(txt, X, maxW, sz, col, w, lh) { font(sz, w); x.fillStyle = col; var out = [], lines = String(txt || '').split('\n'); lines.forEach(function (ln) { var words = ln.split(' '), cur = ''; words.forEach(function (wd) { var tt = cur ? cur + ' ' + wd : wd; if (x.measureText(tt).width > maxW && cur) { out.push(cur); cur = wd; } else cur = tt; }); out.push(cur); }); return { lines: out, h: out.length * sz * (lh || 1.45), sz: sz, X: X, w: w, col: col, lh: lh || 1.45 }; }
      function put(b) { if (y + b.h > H - M) { page(); if (side) sidebar(false); } font(b.sz, b.w); x.fillStyle = b.col; b.lines.forEach(function (l2, i) { x.fillText(l2, b.X, y + b.sz + i * b.sz * b.lh); }); y += b.h; }
      function head(txt) { y += 26; if (y > H - M - 80) { page(); if (side) sidebar(false); } font(30, 700); x.fillStyle = C; x.fillText(txt.toUpperCase(), X0, y + 30); y += 44; x.fillStyle = C; x.globalAlpha = .25; x.fillRect(X0, y, XW, 3); x.globalAlpha = 1; y += 18; }
      function sidebar(first) {
        var sy = M; x.fillStyle = '#fff';
        if (first && photoImg) { x.save(); x.beginPath(); x.arc(SW / 2, sy + 130, 130, 0, 7); x.clip(); x.drawImage(photoImg, SW / 2 - 130, sy, 260, 260); x.restore(); sy += 300; }
        if (!first) return;
        function blk(title, txt) { if (!txt) return; font(26, 700); x.fillStyle = '#fff'; x.fillText(title.toUpperCase(), 50, sy + 26); sy += 46; var b = wrap(txt, 50, SW - 100, 25, 'rgba(255,255,255,.92)', 400, 1.5); b.lines.forEach(function (l2, i) { x.fillText(l2, 50, sy + 25 + i * 37.5); }); sy += b.h + 30; }
        blk(t('cv_contacts'), [D.email, D.phone, D.city, D.link].filter(Boolean).join('\n'));
        blk(t('cv_skills_h'), (D.skills || '').split(',').map(function (s2) { return s2.trim(); }).filter(Boolean).map(function (s2) { return '• ' + s2; }).join('\n'));
        blk(t('cv_langs'), (D.langs || '').split(',').map(function (s2) { return s2.trim(); }).filter(Boolean).join('\n'));
      }
      page(); if (side) sidebar(true);
      if (!side && photoImg) { x.save(); x.beginPath(); x.arc(W - M - 110, M + 110, 110, 0, 7); x.clip(); x.drawImage(photoImg, W - M - 220, M, 220, 220); x.restore(); }
      var nw = side ? XW : XW - (photoImg ? 260 : 0);
      put(wrap(D.name || t('cv_name'), X0, nw, 64, '#111', 800, 1.15));
      put(wrap(D.title, X0, nw, 32, C, 600)); y += 6;
      if (!side) { put(wrap([D.email, D.phone, D.city, D.link].filter(Boolean).join('  ·  '), X0, nw, 24, '#555')); if (photoImg && y < M + 240) y = M + 240; }
      if (D.about) { head(t('cv_about')); put(wrap(D.about, X0, XW, 25, '#333')); }
      var ex = D.exp.filter(function (e) { return e.a || e.b; }); if (ex.length) { head(t('cv_exp')); ex.forEach(function (e) { put(wrap(e.a, X0, XW - 220, 28, '#111', 700)); font(23); x.fillStyle = '#777'; x.textAlign = 'right'; x.fillText(e.c || '', X0 + XW, y - 8); x.textAlign = 'left'; put(wrap(e.b, X0, XW, 25, C, 600)); if (e.d) put(wrap(e.d, X0, XW, 24, '#444')); y += 18; }); }
      var ed = D.edu.filter(function (e) { return e.a || e.b; }); if (ed.length) { head(t('cv_edu')); ed.forEach(function (e) { put(wrap(e.a, X0, XW - 220, 27, '#111', 700)); font(23); x.fillStyle = '#777'; x.textAlign = 'right'; x.fillText(e.c || '', X0 + XW, y - 8); x.textAlign = 'left'; if (e.b) put(wrap(e.b, X0, XW, 24, '#444')); y += 14; }); }
      if (!side) { if (D.skills) { head(t('cv_skills_h')); put(wrap(D.skills, X0, XW, 24, '#333')); } if (D.langs) { head(t('cv_langs')); put(wrap(D.langs, X0, XW, 24, '#333')); } }
    }
    function pdf() {
      script('pdf-lib.min.js').then(function () {
        var L = window.PDFLib; return L.PDFDocument.create().then(function (doc) {
          return Promise.all(pages.map(function (c) { return K.canvasBlob(c, 'image/jpeg', 0.93).then(function (b) { return b.arrayBuffer(); }); })).then(function (abs) {
            var ch = Promise.resolve(); abs.forEach(function (ab) { ch = ch.then(function () { return doc.embedJpg(ab).then(function (im) { doc.addPage([595.28, 841.89]).drawImage(im, { x: 0, y: 0, width: 595.28, height: 841.89 }); }); }); });
            return ch.then(function () { doc.setTitle('CV ' + (D.name || '')); return doc.save(); });
          });
        });
      }).then(function (bytes) { K.download(new Blob([bytes], { type: 'application/pdf' }), 'CV-' + (((D.name || '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '')) || 'resume') + '.pdf'); });
    }
    loadPhoto(); render();
  }
});
