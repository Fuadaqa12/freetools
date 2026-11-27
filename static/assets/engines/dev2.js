/* Developer tools, batch 2: JWT decoder, regex tester, CSV⇄JSON, CSS gradient */
TK.register('dev2', function (root, o, K) {
  var t = K.t, el = K.el, esc = K.esc, svg = K.svg, mode = o.mode;
  function area(val, h, ro) { var a = el('<textarea class="inp mono" spellcheck="false"' + (h ? ' style="min-height:' + h + 'px"' : '') + '></textarea>'); a.value = val || ''; if (ro) a.readOnly = true; return a; }
  function lbl(s) { return el('<span class="lbl" style="display:block;margin:14px 0 6px">' + esc(s) + '</span>'); }

  if (mode === 'jwt') {
    var sample = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ';
    var inp = area(sample, 120), h = area('', 110, true), p = area('', 200, true), info = el('<div class="row" style="gap:8px;margin-top:10px"></div>'), err = el('<p class="err hide"></p>');
    root.append(lbl(t('jwt_token')), inp, err, info, lbl('Header'), h, lbl('Payload'), p, el('<p class="muted">' + esc(t('jwt_note')) + '</p>'));
    function dec(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return new TextDecoder().decode(Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); })); }
    function run() {
      err.classList.add('hide'); info.innerHTML = '';
      try {
        var parts = inp.value.trim().replace(/^Bearer\s+/i, '').split('.'); if (parts.length < 2) throw 0;
        var hd = JSON.parse(dec(parts[0])), pl = JSON.parse(dec(parts[1]));
        h.value = JSON.stringify(hd, null, 2); p.value = JSON.stringify(pl, null, 2);
        var tags = [];
        if (hd.alg) tags.push('<span class="tag">alg: ' + esc(hd.alg) + '</span>');
        ['iat', 'nbf', 'exp'].forEach(function (k) { if (typeof pl[k] === 'number') tags.push('<span class="tag">' + k + ': ' + esc(new Date(pl[k] * 1000).toLocaleString(K.lang)) + '</span>'); });
        if (typeof pl.exp === 'number') tags.push(pl.exp * 1000 < Date.now() ? '<span class="tag del">' + esc(t('jwt_expired')) + '</span>' : '<span class="tag add">' + esc(t('jwt_valid_time')) + '</span>');
        info.innerHTML = tags.join('');
      } catch (e) { h.value = p.value = ''; err.textContent = t('jwt_invalid'); err.classList.remove('hide'); }
    }
    inp.oninput = run; run();
  }

  else if (mode === 'regex') {
    var pat = K.field(t('pattern'), '\\b(\\w+)@(\\w+)\\.com\\b', run, { text: true }); pat.input.classList.add('mono');
    var flags = { g: true, i: true, m: false, s: false, u: false };
    var fr = el('<div class="row" style="margin:10px 0"></div>');
    Object.keys(flags).forEach(function (k) { fr.appendChild(K.chk(k + ' · ' + t('flag_' + k), flags[k], function (v) { flags[k] = v; run(); })); });
    var txt = area(t('regex_sample'), 150);
    var hl = el('<div class="diffout mono" style="min-height:60px"></div>');
    var cnt = el('<p class="muted" style="margin:8px 0"></p>'), err2 = el('<p class="err hide"></p>');
    var tbl = el('<div class="scroll" style="margin-top:10px"></div>');
    var rep = K.field(t('replace_with'), '$1 [at] $2', run, { text: true }); rep.input.classList.add('mono');
    var repOut = area('', 90, true);
    root.append(pat, fr, lbl(t('test_string')), txt, err2, cnt, hl, tbl, el('<div style="height:10px"></div>'), rep, repOut);
    txt.oninput = run;
    function run() {
      err2.classList.add('hide');
      var f = Object.keys(flags).filter(function (k) { return flags[k]; }).join(''), re;
      try { re = new RegExp(pat.input.value, f.indexOf('g') < 0 ? f + 'g' : f); } catch (e) { err2.textContent = t('invalid_regex') + ': ' + e.message; err2.classList.remove('hide'); hl.textContent = txt.value; cnt.textContent = ''; tbl.innerHTML = ''; repOut.value = ''; return; }
      var s = txt.value, html = '', last = 0, n = 0, rows = '', m;
      if (pat.input.value) while ((m = re.exec(s)) && n < 5000) {
        if (m[0] === '') { re.lastIndex++; continue; }
        html += esc(s.slice(last, m.index)) + '<mark>' + esc(m[0]) + '</mark>'; last = m.index + m[0].length; n++;
        if (n <= 200) rows += '<tr><td>' + n + '</td><td>' + m.index + '</td><td><code>' + esc(m[0]) + '</code></td><td>' + m.slice(1).map(function (g, i) { return '<code>$' + (i + 1) + ': ' + esc(g == null ? '' : g) + '</code>'; }).join(' ') + '</td></tr>';
        if (!flags.g) break;
      }
      html += esc(s.slice(last)); hl.innerHTML = html;
      cnt.textContent = t('n_matches', { n: n });
      tbl.innerHTML = n ? '<table class="table"><thead><tr><th>#</th><th>' + esc(t('index')) + '</th><th>' + esc(t('match')) + '</th><th>' + esc(t('groups')) + '</th></tr></thead><tbody>' + rows + '</tbody></table>' : '';
      try { repOut.value = s.replace(new RegExp(pat.input.value, f), rep.input.value); } catch (e) { repOut.value = ''; }
    }
    run();
  }

  else if (mode === 'csv') {
    var c2j = o.dir === 'c2j', delim = 'auto', header = true;
    var sampleCsv = 'name,age,city\nAnna,28,Baku\nBen,34,"New York, NY"\nChloe,22,Paris';
    var sampleJson = '[\n  {"name": "Anna", "age": 28, "city": "Baku"},\n  {"name": "Ben", "age": 34, "city": "New York, NY"}\n]';
    var src = area(c2j ? sampleCsv : sampleJson, 180), dst = area('', 220, true), err3 = el('<p class="err hide"></p>');
    var bar = el('<div class="row" style="margin:12px 0"></div>');
    bar.append(K.sel(t('delimiter'), [['auto', t('auto')], [',', ', (comma)'], [';', '; (semicolon)'], ['\t', 'Tab'], ['|', '|']], 'auto', function (v) { delim = v; run(); }));
    if (c2j) bar.append(K.chk(t('first_row_header'), true, function (v) { header = v; run(); }));
    bar.append(K.btn('copy', t('copy'), 'sec sm', function () { K.copy(dst.value); }), K.btn('download', t('download'), 'sec sm', function () { K.download(new Blob([dst.value], { type: c2j ? 'application/json' : 'text/csv' }), c2j ? 'data.json' : 'data.csv'); }));
    var up = K.dropzone({ accept: c2j ? '.csv,text/csv,text/plain' : '.json,application/json', mini: true, label: t('choose_file'), onFiles: function (f) { f[0].text().then(function (x) { src.value = x; run(); }); } });
    root.append(up, el('<div style="height:10px"></div>'), src, bar, err3, dst);
    function parseCsv(s, d) {
      if (d === 'auto') { var first = s.split('\n')[0]; d = [',', ';', '\t', '|'].sort(function (a, b) { return first.split(b).length - first.split(a).length; })[0]; }
      var rows = [], row = [], cur = '', q = false;
      for (var i = 0; i < s.length; i++) {
        var c = s[i];
        if (q) { if (c === '"') { if (s[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
        else if (c === '"') q = true; else if (c === d) { row.push(cur); cur = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; } else cur += c;
      }
      if (cur || row.length) { row.push(cur); rows.push(row); }
      return rows.filter(function (r) { return r.length > 1 || r[0] !== ''; });
    }
    function val(v) { if (/^-?\d+(\.\d+)?$/.test(v) && v.length < 16) return +v; if (v === 'true') return true; if (v === 'false') return false; if (v === '') return null; return v; }
    function run() {
      err3.classList.add('hide');
      try {
        if (c2j) {
          var rows = parseCsv(src.value, delim), res;
          if (header) { var h = rows.shift() || []; res = rows.map(function (r) { var o2 = {}; h.forEach(function (k, i) { o2[k || 'col' + (i + 1)] = val(r[i] == null ? '' : r[i]); }); return o2; }); }
          else res = rows.map(function (r) { return r.map(val); });
          dst.value = JSON.stringify(res, null, 2);
        } else {
          var data = JSON.parse(src.value); if (!Array.isArray(data)) data = [data];
          var keys = []; data.forEach(function (r) { if (r && typeof r === 'object' && !Array.isArray(r)) Object.keys(r).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); }); });
          var d = delim === 'auto' ? ',' : delim;
          var cell = function (v) { if (v == null) return ''; if (typeof v === 'object') v = JSON.stringify(v); v = String(v); return /["\n\r]/.test(v) || v.indexOf(d) >= 0 ? '"' + v.replace(/"/g, '""') + '"' : v; };
          dst.value = keys.length ? [keys.map(cell).join(d)].concat(data.map(function (r) { return keys.map(function (k) { return cell(r[k]); }).join(d); })).join('\n') : data.map(function (r) { return (Array.isArray(r) ? r : [r]).map(cell).join(d); }).join('\n');
        }
      } catch (e) { dst.value = ''; err3.textContent = c2j ? t('invalid_input') : t('invalid_json') + ': ' + e.message; err3.classList.remove('hide'); }
    }
    src.oninput = K.debounce(run, 150); run();
  }

  else if (mode === 'gradient') {
    var G = { type: 'linear', angle: 135, stops: [['#5b4cf5', 0], ['#e9408f', 100]] };
    var pv = el('<div class="gradprev"></div>');
    var css = area('', 70, true);
    var stopsBox = el('<div class="stack" style="gap:8px"></div>');
    var ang = K.rng(t('angle'), 0, 360, G.angle, '°', function (v) { G.angle = v; draw(); });
    var bar2 = el('<div class="row"></div>');
    bar2.append(K.seg([['linear', t('linear')], ['radial', t('radial')], ['conic', t('conic')]], 'linear', function (v) { G.type = v; ang.classList.toggle('hide', v === 'radial'); draw(); }),
      K.btn('plus', t('add_color'), 'sec sm', function () { G.stops.push(['#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'), 50]); G.stops.sort(function (a, b) { return a[1] - b[1]; }); stops(); draw(); }),
      K.btn('dice', t('random'), 'sec sm', function () { var h = Math.random() * 360; G.stops = [[hsl(h, 85, 60), 0], [hsl(h + 40 + Math.random() * 120, 85, 55), 100]]; G.angle = Math.round(Math.random() * 360); ang.set(G.angle); stops(); draw(); }));
    var presets = el('<div class="palette"></div>');
    [['#ff9a9e', '#fad0c4'], ['#a18cd1', '#fbc2eb'], ['#84fab0', '#8fd3f4'], ['#f6d365', '#fda085'], ['#4facfe', '#00f2fe'], ['#43e97b', '#38f9d7'], ['#fa709a', '#fee140'], ['#30cfd0', '#330867'], ['#667eea', '#764ba2'], ['#ff0844', '#ffb199'], ['#0ba360', '#3cba92'], ['#000000', '#434343']].forEach(function (p) {
      var b = el('<button type="button" style="background:linear-gradient(135deg,' + p[0] + ',' + p[1] + ')"></button>'); b.onclick = function () { G.stops = [[p[0], 0], [p[1], 100]]; stops(); draw(); }; presets.appendChild(b);
    });
    function hsl(h, s, l) { h = ((h % 360) + 360) % 360; s /= 100; l /= 100; var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l), f = function (n) { return Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))); }; return '#' + [f(0), f(8), f(4)].map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
    function str() { var s = G.stops.map(function (x) { return x[0] + ' ' + x[1] + '%'; }).join(', '); return G.type === 'linear' ? 'linear-gradient(' + G.angle + 'deg, ' + s + ')' : G.type === 'radial' ? 'radial-gradient(circle, ' + s + ')' : 'conic-gradient(from ' + G.angle + 'deg, ' + s + ')'; }
    function draw() { var v = str(); pv.style.background = v; css.value = 'background: ' + G.stops[0][0] + ';\nbackground: ' + v + ';'; }
    function stops() {
      stopsBox.innerHTML = '';
      G.stops.forEach(function (st, i) {
        var r = el('<div class="row" style="flex-wrap:nowrap"><input type="color" class="inp" style="width:56px;padding:4px;flex-shrink:0"><input type="range" min="0" max="100" style="flex:1"><output style="width:44px;text-align:end;font-weight:600"></output><button class="ibtn" type="button" aria-label="remove">' + svg('x') + '</button></div>');
        var c = r.querySelector('input[type=color]'), rg = r.querySelector('input[type=range]'), op = r.querySelector('output');
        c.value = st[0]; rg.value = st[1]; op.textContent = st[1] + '%';
        c.oninput = function () { st[0] = c.value; draw(); }; rg.oninput = function () { st[1] = +rg.value; op.textContent = rg.value + '%'; draw(); };
        r.querySelector('button').onclick = function () { if (G.stops.length > 2) { G.stops.splice(i, 1); stops(); draw(); } };
        stopsBox.appendChild(r);
      });
    }
    var cb = K.btn('copy', t('copy_css'), '', function () { K.copy(css.value); });
    root.append(pv, el('<div style="height:14px"></div>'), bar2, el('<div style="height:12px"></div>'), ang, lbl(t('colors')), stopsBox, lbl(t('presets')), presets, lbl('CSS'), css, el('<div class="row end" style="margin-top:10px"></div>'));
    root.lastChild.appendChild(cb);
    stops(); draw();
  }
});
