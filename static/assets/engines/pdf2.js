/* PDF tools, batch 2 (pdf.js + pdf-lib): PDF→JPG/PNG, compress, to text, organize, page numbers, watermark */
TK.register('pdf2', function (root, o, K) {
  var t = K.t, el = K.el, esc = K.esc, svg = K.svg, mode = o.mode;
  var file = null, bytes = null, doc = null;
  var dz = K.dropzone({ accept: 'application/pdf,.pdf', hint: t('drop_hint_pdf'), onFiles: function (f) { open(f[0]); } });
  var status = el('<div class="row hide" style="justify-content:center;padding:30px"><span class="spin dark"></span><span class="muted">' + esc(t('processing')) + '</span></div>');
  var work = el('<div class="stack hide"></div>');
  var head = el('<div class="file"></div>');
  var settings = el('<div class="panel stack"></div>');
  var body = el('<div></div>');
  var actions = el('<div class="row end"></div>');
  work.append(head, settings, body, actions);
  root.append(dz, status, work);

  function busy(on) { status.classList.toggle('hide', !on); }
  function reset() { file = bytes = doc = null; work.classList.add('hide'); dz.classList.remove('hide'); settings.innerHTML = body.innerHTML = actions.innerHTML = ''; }
  function fail(e) {
    busy(false); console.error(e);
    var msg = e && (e.name === 'PasswordException' || /password|encrypt/i.test(e.message || '')) ? t('pdf_protected') : t('error');
    K.toast(msg); reset();
  }
  function open(f) {
    if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)) { K.toast(t('cannot_read')); return; }
    file = f; dz.classList.add('hide'); busy(true);
    f.arrayBuffer().then(function (ab) {
      bytes = new Uint8Array(ab);
      return K.pdfjs().then(function (pdfjs) { return pdfjs.getDocument({ data: bytes.slice(), isEvalSupported: false }).promise; });
    }).then(function (d) {
      doc = d; busy(false); work.classList.remove('hide');
      head.innerHTML = '<div class="th">PDF</div><div class="meta"><div class="nm">' + esc(f.name) + '</div><div class="sz"><bdi>' + K.bytes(f.size) + '</bdi> · ' + esc(t('n_pages', { n: d.numPages })) + '</div></div>';
      var x = el('<button class="ibtn" type="button" aria-label="remove">' + svg('x') + '</button>'); x.onclick = reset; head.appendChild(x);
      ({ toimg: setupImg, compress: setupCompress, text: setupText, organize: setupOrganize, numbers: setupNumbers, watermark: setupWatermark })[mode]();
    }).catch(fail);
  }
  function renderPage(n, scale, type, q) {
    return doc.getPage(n).then(function (p) {
      var vp = p.getViewport({ scale: scale }), c = document.createElement('canvas');
      c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
      var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      return p.render({ canvasContext: ctx, viewport: vp }).promise.then(function () {
        var base = p.getViewport({ scale: 1 });
        if (!type) return { canvas: c, w: base.width, h: base.height };
        return K.canvasBlob(c, type, q).then(function (b) { return { blob: b, canvas: c, w: base.width, h: base.height }; });
      });
    });
  }
  function progress(btn, i, n) { btn.querySelector('span').textContent = t('processing') + ' ' + i + '/' + n; }
  function lib() { return window.PDFLib; }
  function savePdf(pdf, suffix) {
    return pdf.save().then(function (out) {
      var b = new Blob([out], { type: 'application/pdf' }); K.download(b, K.baseName(file.name) + suffix + '.pdf'); K.toast(t('done_downloaded')); return b;
    });
  }

  /* ---------- PDF → images ---------- */
  function setupImg() {
    var P = { dpi: 150, q: 90 }, type = o.fmt === 'png' ? 'image/png' : 'image/jpeg', ext = o.fmt === 'png' ? 'png' : 'jpg';
    var g = el('<div class="fields"></div>');
    g.append(K.sel(t('resolution'), [[72, '72 DPI · ' + t('small')], [150, '150 DPI · ' + t('recommended')], [220, '220 DPI'], [300, '300 DPI · ' + t('print_quality')]], 150, function (v) { P.dpi = +v; }));
    if (ext === 'jpg') g.append(K.sel(t('quality'), [[95, '95%'], [90, '90%'], [80, '80%'], [70, '70%']], 90, function (v) { P.q = +v; }));
    settings.appendChild(g);
    var grid = el('<div class="thumbs"></div>'); body.appendChild(grid);
    var go = K.btn('download', t('download_zip'), 'big', function () {
      go.disabled = true; var files = [], i = 0, n = doc.numPages;
      (function next() {
        i++; if (i > n) { K.download(K.zip(files), K.baseName(file.name) + '-' + ext + '.zip'); go.disabled = false; go.querySelector('span').textContent = t('download_zip'); K.toast(t('done_downloaded')); return; }
        progress(go, i, n);
        renderPage(i, P.dpi / 72, type, P.q / 100).then(function (r) { return K.blobBytes(r.blob); }).then(function (u) { files.push({ name: K.baseName(file.name) + '-' + i + '.' + ext, data: u }); next(); }).catch(fail);
      })();
    });
    actions.appendChild(go);
    // thumbnails with single-page download
    var n = Math.min(doc.numPages, 60);
    (function th(i) {
      if (i > n) return;
      renderPage(i, .35).then(function (r) {
        var f = el('<figure class="thumb"></figure>'); f.appendChild(r.canvas);
        var b = el('<button class="btn sec sm" type="button">' + svg('download') + i + '</button>');
        b.onclick = function () { renderPage(i, P.dpi / 72, type, P.q / 100).then(function (x) { K.download(x.blob, K.baseName(file.name) + '-' + i + '.' + ext); }); };
        f.appendChild(b); grid.appendChild(f); th(i + 1);
      });
    })(1);
  }

  /* ---------- compress ---------- */
  function setupCompress() {
    var P = { lvl: 'rec' }, L = { max: [.9, .45], rec: [1.35, .6], low: [2, .78] };
    settings.append(el('<span class="lbl">' + esc(t('compression_level')) + '</span>'), K.seg([['max', t('lvl_max')], ['rec', t('lvl_rec')], ['low', t('lvl_low')]], 'rec', function (v) { P.lvl = v; }),
      el('<p class="muted" style="margin:0">' + esc(t('compress_pdf_tip')) + '</p>'));
    var res = el('<div></div>'); body.appendChild(res);
    var go = K.btn('minimize', t('compress_btn'), 'big', function () {
      go.disabled = true; var PDF = lib().PDFDocument, out, n = doc.numPages, i = 0, lv = L[P.lvl];
      PDF.create().then(function (pdf) {
        out = pdf;
        (function next() {
          i++;
          if (i > n) {
            return out.save().then(function (u8) {
              go.disabled = false; go.querySelector('span').textContent = t('compress_btn');
              var b = new Blob([u8], { type: 'application/pdf' }), saved = 1 - b.size / file.size;
              if (b.size >= file.size) { res.innerHTML = '<div class="result" style="margin-top:6px"><div class="sub">' + esc(t('already_small')) + '</div></div>'; return; }
              res.innerHTML = '<div class="result" style="margin-top:6px"><div class="big">−' + Math.round(saved * 100) + '%</div><div class="sub">' + K.bytes(file.size) + ' → <b>' + K.bytes(b.size) + '</b></div></div>';
              var d = K.btn('download', t('download'), 'big', function () { K.download(b, K.baseName(file.name) + '-compressed.pdf'); });
              var r = el('<div class="row" style="justify-content:center;margin-top:14px"></div>'); r.appendChild(d); res.appendChild(r);
              K.download(b, K.baseName(file.name) + '-compressed.pdf');
            });
          }
          progress(go, i, n);
          renderPage(i, lv[0], 'image/jpeg', lv[1]).then(function (r) { return K.blobBytes(r.blob).then(function (u) { return out.embedJpg(u).then(function (img) { var pg = out.addPage([r.w, r.h]); pg.drawImage(img, { x: 0, y: 0, width: r.w, height: r.h }); next(); }); }); }).catch(fail);
        })();
      }).catch(fail);
    });
    actions.appendChild(go);
  }

  /* ---------- text ---------- */
  function setupText() {
    var ta = el('<textarea class="inp" readonly style="min-height:320px"></textarea>');
    var info = el('<p class="muted" style="margin:0"></p>');
    settings.append(info); body.appendChild(ta);
    var parts = [], i = 0, n = doc.numPages;
    (function next() {
      i++;
      if (i > n) {
        ta.value = parts.join('\n\n').trim();
        info.textContent = ta.value ? t('words') + ': ' + (ta.value.match(/\S+/g) || []).length + ' · ' + t('characters') + ': ' + ta.value.length : t('no_text_found');
        return;
      }
      doc.getPage(i).then(function (p) { return p.getTextContent(); }).then(function (tc) {
        var s = ''; tc.items.forEach(function (it) { s += it.str + (it.hasEOL ? '\n' : (it.str && !/\s$/.test(it.str) ? ' ' : '')); });
        parts.push(s.replace(/[ \t]+\n/g, '\n').replace(/ {2,}/g, ' ')); info.textContent = t('processing') + ' ' + i + '/' + n; next();
      }).catch(fail);
    })();
    actions.append(K.btn('copy', t('copy'), 'sec', function () { K.copy(ta.value); }), K.btn('download', t('download') + ' .txt', 'big', function () { K.download(new Blob([ta.value], { type: 'text/plain;charset=utf-8' }), K.baseName(file.name) + '.txt'); }));
  }

  /* ---------- organize ---------- */
  function setupOrganize() {
    var pages = [], grid = el('<div class="thumbs org"></div>');
    settings.append(el('<p class="muted" style="margin:0">' + esc(t('organize_tip')) + '</p>'));
    body.appendChild(grid);
    var dragI = null;
    function draw() {
      grid.innerHTML = '';
      pages.forEach(function (p, idx) {
        var f = el('<figure class="thumb" draggable="true"></figure>');
        p.cv.style.transform = 'rotate(' + p.rot + 'deg)'; f.appendChild(p.cv);
        var bar = el('<div class="tbar"><button class="ibtn" data-a="l" aria-label="left">' + svg('up') + '</button><button class="ibtn" data-a="r" aria-label="rotate">' + svg('rotate') + '</button><button class="ibtn" data-a="d" aria-label="delete">' + svg('trash') + '</button><button class="ibtn" data-a="n" aria-label="right">' + svg('down') + '</button></div>');
        K.$('[data-a=l]', bar).firstChild.style.transform = 'rotate(-90deg)'; K.$('[data-a=n]', bar).firstChild.style.transform = 'rotate(-90deg)';
        bar.onclick = function (e) {
          var b = e.target.closest('button'); if (!b) return; var a = b.dataset.a;
          if (a === 'r') p.rot = (p.rot + 90) % 360;
          if (a === 'd') { if (pages.length < 2) return K.toast(t('cant_delete_all')); pages.splice(idx, 1); }
          if (a === 'l' && idx > 0) pages.splice(idx - 1, 0, pages.splice(idx, 1)[0]);
          if (a === 'n' && idx < pages.length - 1) pages.splice(idx + 1, 0, pages.splice(idx, 1)[0]);
          draw();
        };
        f.appendChild(el('<figcaption>' + (p.n) + '</figcaption>')); f.appendChild(bar);
        f.addEventListener('dragstart', function () { dragI = idx; f.classList.add('dragging'); });
        f.addEventListener('dragend', function () { f.classList.remove('dragging'); });
        f.addEventListener('dragover', function (e) { e.preventDefault(); });
        f.addEventListener('drop', function (e) { e.preventDefault(); if (dragI == null || dragI === idx) return; pages.splice(idx, 0, pages.splice(dragI, 1)[0]); dragI = null; draw(); });
        grid.appendChild(f);
      });
    }
    var n = doc.numPages;
    (function th(i) {
      if (i > n) return draw();
      renderPage(i, .3).then(function (r) { pages.push({ n: i, rot: 0, cv: r.canvas }); if (i % 6 === 0 || i === n) draw(); th(i + 1); }).catch(fail);
    })(1);
    actions.append(K.btn('download', t('save_pdf'), 'big', function () {
      var PL = lib();
      PL.PDFDocument.load(bytes, { ignoreEncryption: true }).then(function (src) {
        return PL.PDFDocument.create().then(function (out) {
          return out.copyPages(src, pages.map(function (p) { return p.n - 1; })).then(function (cp) {
            cp.forEach(function (pg, i) { var r = pages[i].rot; if (r) pg.setRotation(PL.degrees((pg.getRotation().angle + r) % 360)); out.addPage(pg); });
            return savePdf(out, '-organized');
          });
        });
      }).catch(fail);
    }));
  }

  /* ---------- page numbers ---------- */
  function setupNumbers() {
    var P = { pos: 'bc', fmt: '{n}', size: 11, start: 1, margin: 28, skip: false };
    var g = el('<div class="fields"></div>');
    g.append(
      K.sel(t('position'), [['bc', t('pos_bc')], ['br', t('pos_br')], ['bl', t('pos_bl')], ['tc', t('pos_tc')], ['tr', t('pos_tr')], ['tl', t('pos_tl')]], 'bc', function (v) { P.pos = v; }),
      K.sel(t('format'), [['{n}', '1'], ['{n} / {N}', '1 / 9'], ['- {n} -', '- 1 -'], ['Page {n} of {N}', 'Page 1 of 9'], ['[{n}]', '[1]']], '{n}', function (v) { P.fmt = v; }),
      K.field(t('font_size'), P.size, function (v) { P.size = K.pnum(v) || 11; }, { unit: 'pt' }),
      K.field(t('start_number'), 1, function (v) { P.start = Math.round(K.pnum(v)) || 1; })
    );
    settings.append(g, K.chk(t('skip_first'), false, function (v) { P.skip = v; }));
    actions.append(K.btn('numbers', t('add_numbers_btn'), 'big', function () {
      var PL = lib();
      PL.PDFDocument.load(bytes, { ignoreEncryption: true }).then(function (pdf) {
        return pdf.embedFont(PL.StandardFonts.Helvetica).then(function (font) {
          var pgs = pdf.getPages(), N = pgs.length;
          pgs.forEach(function (pg, i) {
            if (P.skip && i === 0) return;
            var num = P.start + i - (P.skip ? 1 : 0), txt = P.fmt.replace('{n}', num).replace('{N}', N - (P.skip ? 1 : 0) + P.start - 1);
            var sz = pg.getSize(), w = font.widthOfTextAtSize(txt, P.size), m = P.margin;
            var x = P.pos[1] === 'l' ? m : P.pos[1] === 'r' ? sz.width - m - w : (sz.width - w) / 2;
            var y = P.pos[0] === 'b' ? m - P.size / 2 + 4 : sz.height - m;
            pg.drawText(txt, { x: x, y: y, size: P.size, font: font, color: PL.rgb(.2, .2, .25) });
          });
          return savePdf(pdf, '-numbered');
        });
      }).catch(fail);
    }));
  }

  /* ---------- watermark (rendered as image → any language works) ---------- */
  function setupWatermark() {
    var P = { text: t('wm_pdf_default'), color: '#e03e52', op: 25, size: 60, rot: 45, pos: 'cc' };
    var g = el('<div class="fields"></div>');
    var col = el('<label class="f"><span>' + esc(t('color')) + '</span><input type="color" class="inp" value="#e03e52" style="padding:4px"></label>');
    col.querySelector('input').oninput = function (e) { P.color = e.target.value; prev(); };
    g.append(K.field(t('wm_text'), P.text, function (v) { P.text = v; prev(); }, { text: true }), col,
      K.sel(t('position'), [['cc', t('pos_center')], ['tile', t('pos_tile')]], 'cc', function (v) { P.pos = v; prev(); }));
    var g2 = el('<div class="fields"></div>');
    g2.append(K.rng(t('opacity'), 5, 100, P.op, '%', function (v) { P.op = v; prev(); }), K.rng(t('font_size'), 16, 140, P.size, 'pt', function (v) { P.size = v; prev(); }), K.rng(t('rotation'), -90, 90, P.rot, '°', function (v) { P.rot = v; prev(); }));
    settings.append(g, g2);
    var pv = el('<div class="preview" style="background:var(--bg2)"></div>'); body.appendChild(pv);
    var base = null;
    renderPage(1, .8).then(function (r) { base = r; prev(); });
    function textImg(scale) {
      var c = document.createElement('canvas'), x = c.getContext('2d'), fs = P.size * scale;
      x.font = '700 ' + fs + 'px system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif';
      var w = Math.ceil(x.measureText(P.text || ' ').width) + 4; c.width = w; c.height = Math.ceil(fs * 1.3);
      x.font = '700 ' + fs + 'px system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif'; x.fillStyle = P.color; x.textBaseline = 'middle'; x.fillText(P.text, 2, c.height / 2);
      return c;
    }
    function spots(w, h, tw) { if (P.pos !== 'tile') return [[w / 2, h / 2]]; var out = [], sx = tw * 1.1 + 60, sy = P.size * 4; for (var y = sy / 2; y < h + sy; y += sy) for (var x = ((y / sy | 0) % 2 ? sx / 2 : 0); x < w + sx; x += sx) out.push([x, y]); return out; }
    function prev() {
      if (!base) return;
      var c = document.createElement('canvas'); c.width = base.canvas.width; c.height = base.canvas.height;
      var x = c.getContext('2d'), sc = c.width / base.w; x.drawImage(base.canvas, 0, 0);
      var ti = textImg(sc); x.globalAlpha = P.op / 100;
      spots(c.width / sc, c.height / sc, ti.width / sc).forEach(function (s) { x.save(); x.translate(s[0] * sc, s[1] * sc); x.rotate(-P.rot * Math.PI / 180); x.drawImage(ti, -ti.width / 2, -ti.height / 2); x.restore(); });
      pv.innerHTML = ''; pv.appendChild(c);
    }
    actions.append(K.btn('stamp', t('add_watermark_btn'), 'big', function () {
      var PL = lib(), ti = textImg(3);
      K.canvasBlob(ti, 'image/png').then(K.blobBytes).then(function (png) {
        return PL.PDFDocument.load(bytes, { ignoreEncryption: true }).then(function (pdf) {
          return pdf.embedPng(png).then(function (im) {
            var iw = ti.width / 3, ih = ti.height / 3, a = P.rot * Math.PI / 180;
            pdf.getPages().forEach(function (pg) {
              var sz = pg.getSize();
              spots(sz.width, sz.height, iw).forEach(function (s) {
                // rotate around the centre: pdf-lib rotates around the bottom-left corner
                var cx = s[0], cy = sz.height - s[1];
                var x = cx - (iw / 2) * Math.cos(a) + (ih / 2) * Math.sin(a), y = cy - (iw / 2) * Math.sin(a) - (ih / 2) * Math.cos(a);
                pg.drawImage(im, { x: x, y: y, width: iw, height: ih, rotate: PL.degrees(P.rot), opacity: P.op / 100 });
              });
            });
            return savePdf(pdf, '-watermarked');
          });
        });
      }).catch(fail);
    }));
  }
});
