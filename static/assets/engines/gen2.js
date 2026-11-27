/* Generators, batch 2: barcode, name picker, teams, dice, signature, color palette */
TK.register('gen2', function (root, o, K) {
  var t = K.t, el = K.el, esc = K.esc, svg = K.svg, mode = o.mode;
  function rnd(n) { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function names(ta) { return ta.value.split(/\n|,/).map(function (s) { return s.trim(); }).filter(Boolean); }

  if (mode === 'barcode') {
    var P = { v: '5901234123457', fmt: 'EAN13', w: 2, h: 90, text: true, color: '#000000' };
    var g = el('<div class="fields"></div>');
    var vf = K.field(t('barcode_value'), P.v, function (v) { P.v = v; draw(); }, { text: true });
    g.append(vf, K.sel(t('format'), [['CODE128', 'Code 128'], ['EAN13', 'EAN-13'], ['EAN8', 'EAN-8'], ['UPC', 'UPC-A'], ['CODE39', 'Code 39'], ['ITF14', 'ITF-14'], ['codabar', 'Codabar'], ['pharmacode', 'Pharmacode']], P.fmt, function (v) { P.fmt = v; var ex = { CODE128: 'TOOLORA-2026', EAN13: '5901234123457', EAN8: '96385074', UPC: '123456789999', CODE39: 'TOOLORA', ITF14: '15400141288763', codabar: 'A123456A', pharmacode: '1234' }; P.v = ex[v]; vf.input.value = P.v; draw(); }));
    var g2 = el('<div class="fields"></div>');
    g2.append(K.rng(t('bar_width'), 1, 4, P.w, '', function (v) { P.w = v; draw(); }), K.rng(t('height'), 30, 200, P.h, 'px', function (v) { P.h = v; draw(); }));
    var pv = el('<div class="preview" style="background:#fff"><svg id="bc"></svg></div>'), err = el('<p class="err hide"></p>');
    var r = el('<div class="row end"></div>');
    r.append(K.chk(t('show_text'), true, function (v) { P.text = v; draw(); }), K.btn('download', 'SVG', 'sec', function () { var s = new XMLSerializer().serializeToString(pv.querySelector('svg')); K.download(new Blob([s], { type: 'image/svg+xml' }), 'barcode.svg'); }), K.btn('download', 'PNG', 'big', png));
    root.append(g, g2, pv, err, r);
    function draw() {
      err.classList.add('hide');
      try { JsBarcode(pv.querySelector('svg'), P.v, { format: P.fmt, width: P.w, height: P.h, displayValue: P.text, lineColor: P.color, margin: 12, background: '#ffffff', font: 'monospace', fontSize: 18 }); }
      catch (e) { err.textContent = t('barcode_invalid'); err.classList.remove('hide'); }
    }
    function png() { var s = new XMLSerializer().serializeToString(pv.querySelector('svg')), img = new Image(); img.onload = function () { var c = document.createElement('canvas'); c.width = img.width * 3; c.height = img.height * 3; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); K.canvasBlob(c, 'image/png').then(function (b) { K.download(b, 'barcode.png'); }); }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s); }
    if (window.JsBarcode) draw(); else window.addEventListener('load', draw);
  }

  else if (mode === 'picker' || mode === 'teams') {
    var ta = el('<textarea class="inp" style="min-height:170px"></textarea>'); ta.value = t('wheel_default').split(',').join('\n');
    var info = el('<span class="muted"></span>');
    var P2 = { n: mode === 'teams' ? 2 : 1, by: 'teams', unique: true };
    var g3 = el('<div class="fields" style="margin:12px 0"></div>');
    if (mode === 'teams') g3.append(K.sel(t('split_by'), [['teams', t('number_of_teams')], ['size', t('people_per_team')]], 'teams', function (v) { P2.by = v; }), K.field(t('how_many'), 2, function (v) { P2.n = Math.max(1, Math.round(K.pnum(v)) || 1); }));
    else g3.append(K.field(t('how_many_winners'), 1, function (v) { P2.n = Math.max(1, Math.round(K.pnum(v)) || 1); }));
    var res = el('<div class="picked"></div>');
    var go = K.btn(mode === 'teams' ? 'users' : 'sparkles', mode === 'teams' ? t('make_teams') : t('pick_random'), 'big', run);
    var r2 = el('<div class="row" style="margin-bottom:14px"></div>'); r2.append(go, K.btn('dice', t('shuffle'), 'sec', function () { ta.value = shuffle(names(ta)).join('\n'); count(); }), info);
    root.append(el('<span class="lbl" style="display:block;margin-bottom:6px">' + esc(t('wheel_entries')) + '</span>'), ta, g3, r2, res);
    function count() { info.textContent = t('n_names', { n: names(ta).length }); }
    ta.oninput = count; count();
    function run() {
      var list = names(ta); if (!list.length) return;
      if (mode === 'picker') {
        var pool = shuffle(list).slice(0, Math.min(P2.n, list.length)), i = 0;
        res.innerHTML = '<div class="result"><div class="big roll"></div><div class="sub"></div></div>';
        var big = res.querySelector('.big'), sub = res.querySelector('.sub'), tick = setInterval(function () { big.textContent = list[rnd(list.length)]; if (++i > 14) { clearInterval(tick); big.textContent = pool[0]; big.classList.remove('roll'); sub.textContent = pool.length > 1 ? pool.slice(1).join(' · ') : '🎉 ' + t('winner'); } }, 70);
      } else {
        var sh = shuffle(list), k = P2.by === 'teams' ? Math.min(P2.n, sh.length) : Math.ceil(sh.length / P2.n), teams = [];
        for (var j = 0; j < k; j++) teams.push([]); sh.forEach(function (n, x) { teams[x % k].push(n); });
        var colors = ['#5b4cf5', '#e9408f', '#10b981', '#f59e0b', '#06b6d4', '#ef4444', '#8b5cf6', '#14b8a6'];
        res.innerHTML = '<div class="teams">' + teams.map(function (tm, x) { return '<div class="team" style="--c:' + colors[x % colors.length] + '"><b>' + esc(t('team')) + ' ' + (x + 1) + '</b><ol>' + tm.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ol></div>'; }).join('') + '</div>';
        var cp = K.btn('copy', t('copy'), 'sec sm', function () { K.copy(teams.map(function (tm, x) { return t('team') + ' ' + (x + 1) + ': ' + tm.join(', '); }).join('\n')); });
        res.appendChild(cp);
      }
    }
  }

  else if (mode === 'dice') {
    var D = { n: 2, sides: 6 };
    var g4 = el('<div class="fields"></div>');
    g4.append(K.sel(t('number_of_dice'), [1, 2, 3, 4, 5, 6, 8, 10].map(function (x) { return [x, x]; }), 2, function (v) { D.n = +v; roll(); }), K.sel(t('sides'), [4, 6, 8, 10, 12, 20, 100].map(function (x) { return [x, 'd' + x]; }), 6, function (v) { D.sides = +v; roll(); }));
    var box = el('<div class="dice"></div>'), sum = el('<p class="dsum"></p>'), hist = el('<p class="muted" style="text-align:center"></p>'), H = [];
    var btn = K.btn('dice', t('roll'), 'big', roll);
    var r3 = el('<div class="row" style="justify-content:center;margin:16px 0"></div>'); r3.appendChild(btn);
    root.append(g4, box, sum, r3, hist);
    var pips = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
    function face(v) { if (D.sides === 6) return '<div class="die six">' + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(function (i) { return '<i' + (pips[v].indexOf(i) >= 0 ? ' class="on"' : '') + '></i>'; }).join('') + '</div>'; return '<div class="die num">' + v + '</div>'; }
    function roll() {
      var vals = []; for (var i = 0; i < D.n; i++) vals.push(rnd(D.sides) + 1);
      box.innerHTML = vals.map(face).join(''); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
      var s = vals.reduce(function (a, b) { return a + b; }, 0); sum.textContent = D.n > 1 ? t('total') + ': ' + s : '';
      H.unshift(s); H = H.slice(0, 12); hist.textContent = H.length > 1 ? t('history') + ': ' + H.join(' · ') : '';
    }
    document.addEventListener('keydown', function (e) { if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)) { e.preventDefault(); roll(); } });
    roll();
  }

  else if (mode === 'sign') {
    var S = { color: '#14151c', width: 3, mode: 'draw', font: 'Brush', txt: t('sign_sample') };
    var cv = el('<canvas class="signpad" width="1200" height="420"></canvas>'), ctx = cv.getContext('2d');
    var strokes = [], cur = null;
    var draw = el('<div class="stack" style="gap:10px"></div>'), type = el('<div class="stack hide" style="gap:10px"></div>');
    var fonts = { Brush: '"Segoe Script","Brush Script MT","Lucida Handwriting",cursive', Elegant: '"Snell Roundhand","Apple Chancery","Monotype Corsiva",cursive', Simple: '"Bradley Hand","Comic Sans MS","Segoe Print",cursive', Classic: 'Georgia,"Times New Roman",serif' };
    root.append(K.seg([['draw', t('draw')], ['type', t('type_it')]], 'draw', function (v) { S.mode = v; draw.classList.toggle('hide', v !== 'draw'); type.classList.toggle('hide', v !== 'type'); redraw(); }), el('<div style="height:12px"></div>'));
    var col = el('<label class="f"><span>' + esc(t('color')) + '</span><div class="row">' + ['#14151c', '#1d4ed8', '#0f766e', '#b91c1c'].map(function (c) { return '<button type="button" class="dot" data-c="' + c + '" style="background:' + c + '"></button>'; }).join('') + '</div></label>');
    col.onclick = function (e) { var b = e.target.closest('[data-c]'); if (b) { S.color = b.dataset.c; redraw(); } };
    var g5 = el('<div class="fields"></div>'); g5.append(col, K.rng(t('pen_size'), 1, 8, S.width, '', function (v) { S.width = v; redraw(); }));
    draw.append(g5, el('<p class="muted" style="margin:0">' + esc(t('sign_tip')) + '</p>'));
    var g6 = el('<div class="fields"></div>'); g6.append(K.field(t('your_name'), S.txt, function (v) { S.txt = v; redraw(); }, { text: true }), K.sel(t('style'), Object.keys(fonts).map(function (k) { return [k, k]; }), 'Brush', function (v) { S.font = v; redraw(); }));
    type.append(g6);
    var r4 = el('<div class="row end" style="margin-top:12px"></div>');
    r4.append(K.btn('undo', t('undo'), 'sec', function () { strokes.pop(); redraw(); }), K.btn('trash', t('clear'), 'sec', function () { strokes = []; redraw(); }), K.btn('download', t('download') + ' PNG', 'big', save));
    root.append(draw, type, el('<div class="signwrap"></div>'), r4);
    root.querySelector('.signwrap').appendChild(cv);
    function pos(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * cv.width, (e.clientY - r.top) / r.height * cv.height, e.pressure || .5]; }
    cv.addEventListener('pointerdown', function (e) { if (S.mode !== 'draw') return; e.preventDefault(); cv.setPointerCapture(e.pointerId); cur = { c: S.color, w: S.width, p: [pos(e)] }; strokes.push(cur); });
    cv.addEventListener('pointermove', function (e) { if (!cur) return; cur.p.push(pos(e)); redraw(); });
    cv.addEventListener('pointerup', function () { cur = null; });
    function paint(x, w, h, sc) {
      x.clearRect(0, 0, w, h);
      if (S.mode === 'type') { var fs = h * .38; x.font = fs + 'px ' + fonts[S.font]; x.fillStyle = S.color; x.textAlign = 'center'; x.textBaseline = 'middle'; var tw = x.measureText(S.txt).width; if (tw > w * .92) { fs *= w * .92 / tw; x.font = fs + 'px ' + fonts[S.font]; } x.fillText(S.txt, w / 2, h / 2); return; }
      x.lineCap = 'round'; x.lineJoin = 'round';
      strokes.forEach(function (s) {
        x.strokeStyle = s.c; var p = s.p;
        if (p.length === 1) { x.beginPath(); x.arc(p[0][0] * sc, p[0][1] * sc, s.w * 1.5 * sc, 0, 7); x.fillStyle = s.c; x.fill(); return; }
        for (var i = 1; i < p.length; i++) { x.beginPath(); x.lineWidth = s.w * 3 * sc * (.6 + p[i][2] * .8); var a = p[i - 1], b = p[i], m = p[i + 1]; x.moveTo(a[0] * sc, a[1] * sc); if (m) x.quadraticCurveTo(b[0] * sc, b[1] * sc, (b[0] + m[0]) / 2 * sc, (b[1] + m[1]) / 2 * sc); else x.lineTo(b[0] * sc, b[1] * sc); x.stroke(); }
      });
    }
    function redraw() { paint(ctx, cv.width, cv.height, 1); }
    function save() {
      var c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; paint(c.getContext('2d'), c.width, c.height, 1);
      // trim transparent edges
      var x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data, x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
      for (var y = 0; y < c.height; y++) for (var xx = 0; xx < c.width; xx++) if (d[(y * c.width + xx) * 4 + 3] > 8) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 <= x0) return K.toast(t('sign_empty'));
      var pad = 16, o2 = document.createElement('canvas'); o2.width = x1 - x0 + pad * 2; o2.height = y1 - y0 + pad * 2; o2.getContext('2d').drawImage(c, x0 - pad, y0 - pad, o2.width, o2.height, 0, 0, o2.width, o2.height);
      K.canvasBlob(o2, 'image/png').then(function (b) { K.download(b, 'signature.png'); K.toast(t('done_downloaded')); });
    }
    redraw();
  }

  else if (mode === 'palette') {
    var cols = [], locked = [false, false, false, false, false], scheme = 'random';
    function hsl2hex(h, s, l) { h = ((h % 360) + 360) % 360; s /= 100; l /= 100; var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l), f = function (n) { return Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))); }; return '#' + [f(0), f(8), f(4)].map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join('').toUpperCase(); }
    function gen() {
      var h = Math.random() * 360, out = [];
      for (var i = 0; i < 5; i++) {
        var hh = scheme === 'mono' ? h : scheme === 'analog' ? h + (i - 2) * 22 : scheme === 'complement' ? h + (i % 2) * 180 + i * 6 : scheme === 'triad' ? h + (i % 3) * 120 : scheme === 'pastel' ? h + i * 72 : h + Math.random() * 360;
        var s = scheme === 'pastel' ? 55 + Math.random() * 20 : scheme === 'mono' ? 40 + i * 12 : 55 + Math.random() * 35;
        var l = scheme === 'pastel' ? 78 + Math.random() * 10 : scheme === 'mono' ? 22 + i * 15 : 35 + Math.random() * 35;
        out.push(hsl2hex(hh, s, l));
      }
      cols = out.map(function (c, i) { return locked[i] && cols[i] ? cols[i] : c; }); paint();
    }
    var pal = el('<div class="bigpal"></div>');
    function lum(hx) { var r = parseInt(hx.substr(1, 2), 16), g = parseInt(hx.substr(3, 2), 16), b = parseInt(hx.substr(5, 2), 16); return (r * 299 + g * 587 + b * 114) / 1000; }
    function paint() {
      pal.innerHTML = '';
      cols.forEach(function (c, i) {
        var d = el('<div class="pcol" style="background:' + c + ';color:' + (lum(c) > 150 ? '#14151c' : '#fff') + '"><b>' + c + '</b><div><button type="button" data-a="copy" aria-label="copy">' + svg('copy') + '</button><button type="button" data-a="lock" aria-label="lock">' + svg('lock') + '</button></div></div>');
        if (locked[i]) d.classList.add('locked');
        d.onclick = function (e) { var b = e.target.closest('button'); if (b && b.dataset.a === 'lock') { locked[i] = !locked[i]; paint(); } else K.copy(c); };
        pal.appendChild(d);
      });
    }
    var r5 = el('<div class="row" style="margin:14px 0"></div>');
    r5.append(K.btn('sparkles', t('generate'), 'big', gen), K.sel(t('style'), [['random', t('random')], ['analog', t('analogous')], ['mono', t('monochrome')], ['complement', t('complementary')], ['triad', t('triadic')], ['pastel', t('pastel')]], 'random', function (v) { scheme = v; gen(); }),
      K.btn('copy', t('copy_css'), 'sec', function () { K.copy(':root {\n' + cols.map(function (c, i) { return '  --color-' + (i + 1) + ': ' + c + ';'; }).join('\n') + '\n}'); }));
    root.append(pal, r5, el('<p class="muted">' + esc(t('palette_tip')) + '</p>'));
    document.addEventListener('keydown', function (e) { if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)) { e.preventDefault(); gen(); } });
    gen();
  }
});
