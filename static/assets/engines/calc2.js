/* Calculators & converters, batch 2 */
TK.register('calc2', function (root, o, K) {
  var t = K.t, el = K.el, esc = K.esc, svg = K.svg, N = K.num, mode = o.mode;
  function ok(v) { return typeof v === 'number' && isFinite(v); }
  function P(v) { return K.pnum(v); }
  function result(big, sub) { return '<div class="result"><div class="big">' + big + '</div>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div>'; }
  function stats(arr) { return '<div class="stats" style="margin-top:12px">' + arr.map(function (a) { return '<div class="stat"><b>' + a[1] + '</b><span>' + esc(a[0]) + '</span></div>'; }).join('') + '</div>'; }
  function grid(items) { var g = el('<div class="fields"></div>'); items.forEach(function (x) { g.appendChild(x); }); return g; }
  function today(off) { var d = new Date(); d.setDate(d.getDate() + (off || 0)); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dateField(label, val, on) { var f = el('<label class="f"><span>' + esc(label) + '</span><input class="inp" type="date"></label>'); var i = f.querySelector('input'); i.value = val; i.oninput = function () { on(i.value); }; return f; }
  function fmtDate(d) { return d.toLocaleDateString(K.lang, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
  var out = el('<div class="out" style="margin-top:16px"></div>');
  var V = {};
  function f(key, label, val, unit) { V[key] = val; return K.field(label, val, function (v) { V[key] = v; go(); }, { unit: unit }); }
  function s(key, label, items, val) { V[key] = val; return K.sel(label, items, val, function (v) { V[key] = v; go(); }); }
  var go = function () { };

  if (mode === 'sci') return sci();
  if (mode === 'currency') return currency();
  if (mode === 'tz') return tz();
  if (mode === 'gpa') return gpa();

  if (mode === 'mortgage') {
    root.append(grid([f('price', t('home_price'), 300000), f('down', t('down_payment'), 20, '%'), f('rate', t('interest_rate'), 6.5, '%'), f('years', t('term_years'), 30, t('yrs')), f('tax', t('property_tax'), 1.1, '%'), f('ins', t('home_insurance'), 1200, '/' + t('yr'))]), out);
    go = function () {
      var pr = P(V.price), dp = P(V.down), r = P(V.rate) / 1200, n = P(V.years) * 12, loan = pr * (1 - dp / 100);
      if (!(pr > 0 && n > 0 && loan >= 0)) { out.innerHTML = ''; return; }
      var m = r ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n, tax = pr * (P(V.tax) || 0) / 100 / 12, ins = (P(V.ins) || 0) / 12, tot = m + tax + ins;
      var rows = '', bal = loan;
      for (var y = 1; y <= P(V.years); y++) { var ip = 0, pp = 0; for (var k = 0; k < 12 && bal > 0; k++) { var i = bal * r, p = Math.min(m - i, bal); ip += i; pp += p; bal -= p; } rows += '<tr><td>' + y + '</td><td>' + N(pp, 0) + '</td><td>' + N(ip, 0) + '</td><td>' + N(Math.max(0, bal), 0) + '</td></tr>'; }
      out.innerHTML = result(N(tot, 2), t('monthly_payment_total')) + stats([[t('principal_interest'), N(m, 2)], [t('property_tax'), N(tax, 2)], [t('home_insurance'), N(ins, 2)], [t('loan_amount'), N(loan, 0)], [t('total_interest'), N(m * n - loan, 0)], [t('down_payment'), N(pr - loan, 0)]]) +
        '<div class="scroll" style="margin-top:16px"><table class="table"><thead><tr><th>' + esc(t('years')) + '</th><th>' + esc(t('principal')) + '</th><th>' + esc(t('interest')) + '</th><th>' + esc(t('balance')) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    };
  }
  else if (mode === 'vat') {
    var how = 'add';
    root.append(K.seg([['add', t('add_vat')], ['remove', t('remove_vat')]], 'add', function (v) { how = v; go(); }), el('<div style="height:14px"></div>'), grid([f('amt', t('amount'), 100), f('rate', t('vat_rate'), 20, '%')]), out);
    go = function () {
      var a = P(V.amt), r = P(V.rate) / 100; if (!ok(a) || !ok(r)) { out.innerHTML = ''; return; }
      var net = how === 'add' ? a : a / (1 + r), vat = net * r, gross = net + vat;
      out.innerHTML = result(N(how === 'add' ? gross : net, 2), how === 'add' ? t('gross_amount') : t('net_amount')) + stats([[t('net_amount'), N(net, 2)], [t('vat_amount'), N(vat, 2)], [t('gross_amount'), N(gross, 2)]]);
    };
  }
  else if (mode === 'margin') {
    var how2 = 'price';
    var a1 = grid([f('cost', t('cost'), 50), f('price', t('selling_price'), 80)]), a2 = grid([f('cost2', t('cost'), 50), f('mg', t('desired_margin'), 30, '%')]); a2.classList.add('hide');
    root.append(K.seg([['price', t('by_price')], ['margin', t('by_margin')]], 'price', function (v) { how2 = v; a1.classList.toggle('hide', v !== 'price'); a2.classList.toggle('hide', v === 'price'); go(); }), el('<div style="height:14px"></div>'), a1, a2, out);
    go = function () {
      var c = how2 === 'price' ? P(V.cost) : P(V.cost2), pr = how2 === 'price' ? P(V.price) : P(V.cost2) / (1 - P(V.mg) / 100);
      if (!ok(c) || !ok(pr) || pr <= 0) { out.innerHTML = ''; return; }
      var profit = pr - c;
      out.innerHTML = result(N(profit / pr * 100, 2) + '%', t('gross_margin')) + stats([[t('selling_price'), N(pr, 2)], [t('profit'), N(profit, 2)], [t('markup'), c ? N(profit / c * 100, 2) + '%' : '—'], [t('cost'), N(c, 2)]]);
    };
  }
  else if (mode === 'salary') {
    var per = [['hour', t('per_hour')], ['day', t('per_day')], ['week', t('per_week')], ['month', t('per_month')], ['year', t('per_year')]];
    root.append(grid([f('amt', t('salary'), 25), s('per', t('period'), per, 'hour'), f('hpw', t('hours_per_week'), 40), f('dpw', t('days_per_week'), 5), f('vac', t('unpaid_weeks'), 0)]), out);
    go = function () {
      var a = P(V.amt), h = P(V.hpw), d = P(V.dpw), wk = 52 - (P(V.vac) || 0); if (!ok(a) || !(h > 0) || !(d > 0)) { out.innerHTML = ''; return; }
      var yr = { hour: a * h * wk, day: a * d * wk, week: a * wk, month: a * 12, year: a }[V.per];
      var r = { hour: yr / wk / h, day: yr / wk / d, week: yr / wk, month: yr / 12, year: yr };
      out.innerHTML = result(N(yr, 0), t('per_year')) + stats(per.map(function (p) { return [p[1], N(r[p[0]], 2)]; }));
    };
  }
  else if (mode === 'fuel') {
    var sys = 'metric', g1 = el('<div></div>');
    root.append(K.seg([['metric', t('metric') + ' (km, L)'], ['us', t('imperial') + ' (mi, gal)']], 'metric', function (v) { sys = v; build(); }), el('<div style="height:14px"></div>'), g1, out);
    function build() {
      g1.innerHTML = ''; V = {};
      g1.appendChild(sys === 'metric' ? grid([f('dist', t('distance'), 300, 'km'), f('cons', t('consumption'), 7.5, 'L/100km'), f('price', t('fuel_price'), 1.6, '/L'), f('ppl', t('people'), 1)]) : grid([f('dist', t('distance'), 200, 'mi'), f('cons', t('fuel_economy'), 30, 'mpg'), f('price', t('fuel_price'), 3.5, '/gal'), f('ppl', t('people'), 1)]));
      go();
    }
    go = function () {
      var d = P(V.dist), c = P(V.cons), p = P(V.price), n = P(V.ppl) || 1; if (!(d > 0 && c > 0 && p >= 0)) { out.innerHTML = ''; return; }
      var fuel = sys === 'metric' ? d * c / 100 : d / c, cost = fuel * p;
      out.innerHTML = result(N(cost, 2), t('trip_cost')) + stats([[t('fuel_needed'), N(fuel, 2) + (sys === 'metric' ? ' L' : ' gal')], [t('per_person'), N(cost / n, 2)], [t('cost_per') + (sys === 'metric' ? ' 100 km' : ' 100 mi'), N(cost / d * 100, 2)]]);
    };
    build(); return;
  }
  else if (mode === 'fraction') {
    function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var x = b; b = a % b; a = x; } return a || 1; }
    var op = '+';
    var fr = el('<div class="fracrow"></div>');
    function frac(k, n, d) { V[k + 'n'] = n; V[k + 'd'] = d; var w = el('<div class="frac"><input class="inp" inputmode="numeric" value="' + n + '"><i></i><input class="inp" inputmode="numeric" value="' + d + '"></div>'); var ins = w.querySelectorAll('input'); ins[0].oninput = function () { V[k + 'n'] = ins[0].value; go(); }; ins[1].oninput = function () { V[k + 'd'] = ins[1].value; go(); }; return w; }
    var ops = K.seg([['+', '+'], ['-', '−'], ['*', '×'], ['/', '÷']], '+', function (v) { op = v; go(); });
    fr.append(frac('a', 1, 2), ops, frac('b', 1, 3));
    root.append(fr, out);
    go = function () {
      var an = Math.round(P(V.an)), ad = Math.round(P(V.ad)), bn = Math.round(P(V.bn)), bd = Math.round(P(V.bd));
      if (![an, ad, bn, bd].every(ok) || !ad || !bd) { out.innerHTML = ''; return; }
      var n, d;
      if (op === '+') { n = an * bd + bn * ad; d = ad * bd; } else if (op === '-') { n = an * bd - bn * ad; d = ad * bd; } else if (op === '*') { n = an * bn; d = ad * bd; } else { n = an * bd; d = ad * bn; }
      if (!d) { out.innerHTML = result('—', t('division_by_zero')); return; }
      if (d < 0) { n = -n; d = -d; } var g = gcd(n, d); n /= g; d /= g;
      var whole = Math.trunc(n / d), rem = Math.abs(n % d);
      var mixed = d === 1 ? String(n) : whole ? whole + ' ' + rem + '/' + d : n + '/' + d;
      out.innerHTML = result(d === 1 ? String(n) : '<span class="fr"><sup>' + n + '</sup>⁄<sub>' + d + '</sub></span>', t('simplified')) + stats([[t('mixed_number'), mixed], [t('decimal'), N(n / d, 6)], [t('percent'), N(n / d * 100, 4) + '%']]);
    };
  }
  else if (mode === 'due') {
    var how3 = 'lmp';
    root.append(K.seg([['lmp', t('last_period')], ['conc', t('conception_date')]], 'lmp', function (v) { how3 = v; go(); }), el('<div style="height:14px"></div>'),
      grid([dateField(t('date'), today(-70), function (v) { V.d = v; go(); }), f('cycle', t('cycle_length'), 28, t('days'))]), out);
    V.d = today(-70);
    go = function () {
      if (!V.d) return; var d = new Date(V.d + 'T12:00:00'), c = P(V.cycle) || 28;
      var lmp = how3 === 'lmp' ? d : new Date(d.getTime() - 14 * 864e5); if (how3 === 'lmp') lmp = new Date(lmp.getTime() + (c - 28) * 864e5);
      var due = new Date(lmp.getTime() + 280 * 864e5), now = new Date(), days = Math.floor((now - lmp) / 864e5), wk = Math.floor(days / 7), dd = days % 7;
      var tri = wk < 14 ? 1 : wk < 28 ? 2 : 3, left = Math.ceil((due - now) / 864e5);
      out.innerHTML = result(esc(fmtDate(due)), t('estimated_due_date')) + stats([
        [t('current_week'), days >= 0 && days < 300 ? t('weeks_days', { w: wk, d: dd }) : '—'], [t('trimester'), days >= 0 && days < 300 ? tri : '—'],
        [t('days_left'), left > 0 ? left : '—'], [t('conception_date'), new Date(lmp.getTime() + 14 * 864e5).toLocaleDateString(K.lang)]]) +
        '<p class="muted" style="margin-top:12px">' + esc(t('medical_note')) + '</p>';
    };
  }
  else if (mode === 'roman') {
    var r = el('<div class="fields"></div>'), A = K.field(t('number'), 2026, function () { conv('a'); }), B = K.field(t('roman_numeral'), '', function () { conv('b'); }, { text: true });
    r.append(A, B); root.append(r, out);
    var map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    function toR(n) { var s2 = ''; map.forEach(function (m) { while (n >= m[0]) { s2 += m[1]; n -= m[0]; } }); return s2; }
    function fromR(s2) { s2 = s2.toUpperCase().trim(); if (!/^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(s2) || !s2) return NaN; var n = 0, i = 0; map.forEach(function (m) { while (s2.substr(i, m[1].length) === m[1]) { n += m[0]; i += m[1].length; } }); return n; }
    function conv(w) {
      var n;
      if (w === 'a') { n = Math.round(P(A.input.value)); B.input.value = n >= 1 && n <= 3999 ? toR(n) : ''; }
      else { n = fromR(B.input.value); A.input.value = ok(n) ? n : ''; }
      out.innerHTML = ok(n) && n >= 1 && n <= 3999 ? result(toR(n), N(n, 0)) + '<p class="muted" style="text-align:center">' + esc(t('roman_range')) + '</p>' : '<p class="err">' + esc(t('roman_range')) + '</p>';
    }
    conv('a'); return;
  }
  else if (mode === 'base') {
    var bases = [[2, t('binary')], [8, t('octal')], [10, t('decimal')], [16, t('hexadecimal')]], inputs = {};
    var g2 = el('<div class="stack"></div>');
    var err = el('<p class="err hide"></p>');
    function parse(str, b) { str = str.trim().toLowerCase().replace(/^0[xbo]/, '').replace(/[\s_]/g, ''); if (!str) return null; var neg = str[0] === '-'; if (neg) str = str.slice(1); var digits = '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, b), v = 0n, B = BigInt(b); for (var i = 0; i < str.length; i++) { var d = digits.indexOf(str[i]); if (d < 0) throw 0; v = v * B + BigInt(d); } return neg ? -v : v; }
    function update(from) {
      err.classList.add('hide');
      try { var v = parse(inputs[from].input.value, from); for (var b in inputs) if (+b !== from) inputs[b].input.value = v == null ? '' : (from === 'c' ? '' : v.toString(+b).toUpperCase()); custOut(v); }
      catch (e) { err.textContent = t('invalid_input'); err.classList.remove('hide'); }
    }
    bases.forEach(function (b) { var fl = K.field(b[1] + ' (' + b[0] + ')', '', function () { update(b[0]); }, { text: true }); fl.querySelector('input').classList.add('mono'); inputs[b[0]] = fl; g2.appendChild(fl); });
    var cb = 36, cf = K.field(t('custom_base') + ' (2–36)', 36, function (v) { cb = Math.min(36, Math.max(2, Math.round(P(v)) || 36)); update(10); });
    var co = el('<div class="pw" style="font-size:18px"></div>');
    function custOut(v) { co.textContent = v == null ? '—' : v.toString(cb).toUpperCase(); }
    root.append(g2, err, el('<div style="height:10px"></div>'), cf, co);
    inputs[10].input.value = '255'; update(10); return;
  }
  go();

  /* ---------- scientific calculator ---------- */
  function sci() {
    var deg = true, expr = '', ans = 0, hist = [];
    var disp = el('<div class="calc-disp"><div class="calc-expr"></div><div class="calc-res">0</div></div>');
    var keys = el('<div class="calc-keys"></div>');
    var L = [['deg', 'DEG'], ['sin(', 'sin'], ['cos(', 'cos'], ['tan(', 'tan'], ['C', 'AC', 'fn'], ['⌫', '⌫', 'fn'],
      ['asin(', 'sin⁻¹'], ['acos(', 'cos⁻¹'], ['atan(', 'tan⁻¹'], ['ln(', 'ln'], ['log(', 'log'], ['√(', '√'],
      ['^', 'xʸ'], ['^2', 'x²'], ['!', 'n!'], ['π', 'π'], ['e', 'e'], ['%', '%'],
      ['(', '('], [')', ')'], ['7', '7', 'n'], ['8', '8', 'n'], ['9', '9', 'n'], ['÷', '÷', 'op'],
      ['1/(', '1/x'], ['ans', 'Ans'], ['4', '4', 'n'], ['5', '5', 'n'], ['6', '6', 'n'], ['×', '×', 'op'],
      ['exp', 'EXP'], ['rnd', 'Rand'], ['1', '1', 'n'], ['2', '2', 'n'], ['3', '3', 'n'], ['−', '−', 'op'],
      ['abs(', '|x|'], ['±', '±'], ['0', '0', 'n'], ['.', '.', 'n'], ['=', '=', 'eq'], ['+', '+', 'op']];
    L.forEach(function (k) { var b = el('<button type="button" class="ck ' + (k[2] || '') + '">' + esc(k[1]) + '</button>'); b.onclick = function () { press(k[0], b); }; keys.appendChild(b); });
    var hl = el('<div class="calc-hist"></div>');
    var wrap = el('<div class="calc"></div>'); wrap.append(disp, keys);
    root.append(wrap, hl);
    var ex = disp.firstChild, rs = disp.lastChild;
    function show(live) { ex.textContent = expr || ''; if (live) { var v = safe(expr); rs.textContent = v == null ? (expr ? rs.textContent : '0') : fmt(v); rs.classList.add('live'); } }
    function fmt(v) { if (!isFinite(v)) return t('error_short'); var a = Math.abs(v); if (a && (a >= 1e15 || a < 1e-9)) return v.toExponential(10).replace(/\.?0+e/, 'e'); return String(+v.toPrecision(14)); }
    function safe(e) { try { var v = evaluate(e); return isFinite(v) ? v : null; } catch (x) { return null; } }
    function press(k, b) {
      if (k === 'deg') { deg = !deg; b.textContent = deg ? 'DEG' : 'RAD'; show(true); return; }
      if (k === 'C') { expr = ''; rs.textContent = '0'; show(); return; }
      if (k === '⌫') { expr = expr.replace(/(asin\(|acos\(|atan\(|sin\(|cos\(|tan\(|ln\(|log\(|abs\(|√\(|1\/\(|Ans|.)$/, ''); show(true); return; }
      if (k === '=') {
        try { var v = evaluate(expr); if (!isFinite(v)) throw 0; hist.unshift([expr, fmt(v)]); hist = hist.slice(0, 8); ans = v; rs.textContent = fmt(v); rs.classList.remove('live'); ex.textContent = expr + ' ='; expr = ''; renderHist(); }
        catch (e) { rs.textContent = t('error_short'); }
        return;
      }
      if (k === 'ans') k = 'Ans'; if (k === 'exp') k = '×10^'; if (k === 'rnd') k = String(+Math.random().toFixed(6));
      if (k === '±') { expr = expr ? '−(' + expr + ')' : '−'; show(true); return; }
      if (!expr && /^[×÷+^%!]|^−$/.test(k) && rs.textContent !== '0' && !rs.classList.contains('live')) expr = 'Ans';
      expr += k; show(true);
    }
    function renderHist() { hl.innerHTML = hist.map(function (h) { return '<button type="button"><span>' + esc(h[0]) + ' =</span><b>' + esc(h[1]) + '</b></button>'; }).join(''); K.$$('button', hl).forEach(function (b, i) { b.onclick = function () { expr += hist[i][1]; show(true); }; }); }
    document.addEventListener('keydown', function (e) {
      if (e.target.closest && e.target.closest('input,textarea,select')) return;
      var m = { '*': '×', '/': '÷', '-': '−', Enter: '=', '=': '=', Backspace: '⌫', Escape: 'C', 'Delete': 'C' }, k = m[e.key] || e.key;
      if (/^[0-9.+()^%!]$/.test(k) || ['×', '÷', '−', '=', '⌫', 'C'].indexOf(k) >= 0) { e.preventDefault(); press(k); }
    });
    // recursive-descent parser (no eval)
    function evaluate(src) {
      var s2 = src.replace(/Ans/g, '(' + ans + ')').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/π/g, '(π)').replace(/√/g, 'sqrt').replace(/\s+/g, '');
      var depth = 0; for (var i = 0; i < s2.length; i++) { if (s2[i] === '(') depth++; if (s2[i] === ')') depth--; } while (depth-- > 0) s2 += ')';
      var p = 0;
      function peek() { return s2[p]; }
      function num() { var m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s2.slice(p)); if (!m) throw 0; p += m[0].length; return parseFloat(m[0]); }
      var fns = { sin: function (x) { return Math.sin(deg ? x * Math.PI / 180 : x); }, cos: function (x) { return Math.cos(deg ? x * Math.PI / 180 : x); }, tan: function (x) { if (deg && Math.abs(x % 180) === 90) return NaN; return Math.tan(deg ? x * Math.PI / 180 : x); },
        asin: function (x) { var r = Math.asin(x); return deg ? r * 180 / Math.PI : r; }, acos: function (x) { var r = Math.acos(x); return deg ? r * 180 / Math.PI : r; }, atan: function (x) { var r = Math.atan(x); return deg ? r * 180 / Math.PI : r; },
        ln: Math.log, log: Math.log10, sqrt: Math.sqrt, abs: Math.abs };
      function fact(n) { if (n < 0 || n !== Math.floor(n) || n > 170) return NaN; var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; }
      function atom() {
        var c = peek();
        if (c === '(') { p++; var v = expr0(); if (peek() === ')') p++; return v; }
        if (c === '-') { p++; return -power(); }
        if (c === '+') { p++; return power(); }
        if (c === 'π') { p++; return Math.PI; }
        var m = /^[a-z]+/.exec(s2.slice(p));
        if (m) { if (m[0] === 'e' && s2[p + 1] !== 'x') { p++; return Math.E; } var fn = fns[m[0]]; if (!fn) throw 0; p += m[0].length; if (peek() !== '(') throw 0; p++; var a = expr0(); if (peek() === ')') p++; return fn(a); }
        return num();
      }
      function postfix() { var v = atom(); for (;;) { if (peek() === '!') { p++; v = fact(v); } else if (peek() === '%') { p++; v = v / 100; } else break; } return v; }
      function power() { var b = postfix(); if (peek() === '^') { p++; var e = power(); return Math.pow(b, e); } return b; }
      function implicit() { var v = power(); while (p < s2.length && /[\d(πa-z.]/.test(peek())) v *= power(); return v; }
      function term() { var v = implicit(); for (;;) { var c = peek(); if (c === '*') { p++; v *= implicit(); } else if (c === '/') { p++; v /= implicit(); } else return v; } }
      function expr0() { var v = term(); for (;;) { var c = peek(); if (c === '+') { p++; v += term(); } else if (c === '-') { p++; v -= term(); } else return v; } }
      var r = expr0(); if (p < s2.length) throw 0; return r;
    }
  }

  /* ---------- currency ---------- */
  function currency() {
    var FALLBACK = { USD: 1, EUR: .92, GBP: .79, RUB: 92, TRY: 34, AZN: 1.7, UAH: 41, KZT: 480, GEL: 2.7, UZS: 12700, AED: 3.6725, SAR: 3.75, INR: 84, CNY: 7.2, JPY: 150, KRW: 1380, CAD: 1.37, AUD: 1.52, CHF: .88, PLN: 4, BRL: 5.6, MXN: 19.5, EGP: 49, PKR: 278, BDT: 120, IDR: 15800, ZAR: 18, SEK: 10.6, NOK: 10.9, CZK: 23, HUF: 360, ILS: 3.7, THB: 34, VND: 25300, MYR: 4.5, PHP: 58, NGN: 1650, ARS: 1000, CLP: 950, COP: 4300, KGS: 86, TJS: 10.7, BYN: 3.3, AMD: 390, MDL: 18 };
    var rates = null, updated = null, src = '';
    var amt = K.field(t('amount'), 100, conv);
    var cur = { USD: 'US Dollar', EUR: 'Euro' };
    var dn = window.Intl && Intl.DisplayNames ? new Intl.DisplayNames([K.lang], { type: 'currency' }) : null;
    function name(c) { try { return dn ? dn.of(c) : c; } catch (e) { return c; } }
    var defFrom = { ru: 'RUB', tr: 'TRY', az: 'AZN', hi: 'INR', ar: 'SAR', pt: 'BRL', es: 'EUR', de: 'EUR', fr: 'EUR' }[K.lang] || 'USD';
    var defTo = defFrom === 'USD' ? 'EUR' : 'USD';
    var fromS = el('<label class="f"><span>' + esc(t('from')) + '</span><select class="sel"></select></label>'), toS = el('<label class="f"><span>' + esc(t('to')) + '</span><select class="sel"></select></label>');
    var sw = el('<button class="ibtn" type="button" style="width:46px;height:46px;align-self:end" aria-label="swap">' + svg('convert') + '</button>');
    var g = el('<div class="fields" style="grid-template-columns:1fr 1fr auto 1fr;align-items:end"></div>'); g.append(amt, fromS, sw, toS);
    if (window.matchMedia('(max-width:620px)').matches) g.style.gridTemplateColumns = '1fr 1fr';
    var info = el('<p class="muted" style="margin:12px 0 0"></p>');
    var popular = el('<div class="scroll" style="margin-top:16px;max-height:none"></div>');
    root.append(g, out, info, popular);
    function fill(list) {
      var opts = list.map(function (c) { return '<option value="' + c + '">' + c + ' — ' + esc(name(c)) + '</option>'; }).join('');
      fromS.querySelector('select').innerHTML = opts; toS.querySelector('select').innerHTML = opts;
      fromS.querySelector('select').value = defFrom; toS.querySelector('select').value = defTo;
    }
    fromS.querySelector('select').onchange = toS.querySelector('select').onchange = conv;
    sw.onclick = function () { var a = fromS.querySelector('select'), b = toS.querySelector('select'), x = a.value; a.value = b.value; b.value = x; conv(); };
    function conv() {
      if (!rates) return; var a = P(amt.input.value), f1 = fromS.querySelector('select').value, t1 = toS.querySelector('select').value;
      if (!ok(a) || !rates[f1] || !rates[t1]) { out.innerHTML = ''; return; }
      var r = rates[t1] / rates[f1];
      out.innerHTML = result(N(a * r, r * a < 1 ? 6 : 2) + ' ' + t1, N(a, 2) + ' ' + f1 + ' · 1 ' + f1 + ' = ' + N(r, 6) + ' ' + t1);
      var list = ['USD', 'EUR', 'GBP', 'RUB', 'TRY', 'AZN', 'INR', 'CNY', 'JPY', 'AED', 'BRL', 'KZT'].filter(function (c) { return c !== f1 && rates[c]; });
      popular.innerHTML = '<table class="table"><tbody>' + list.map(function (c) { return '<tr><td>' + c + ' — ' + esc(name(c)) + '</td><td style="text-align:end"><b>' + N(a * rates[c] / rates[f1], 4) + '</b></td></tr>'; }).join('') + '</tbody></table>';
    }
    function ready(r, when, from) {
      rates = r; updated = when; src = from; fill(Object.keys(r).sort());
      info.innerHTML = esc(t('rates_updated')) + ': ' + (when ? esc(new Date(when).toLocaleString(K.lang)) : '—') + (from ? ' · ' + from : '');
      conv();
    }
    var cached = null; try { cached = JSON.parse(localStorage.getItem('fx') || 'null'); } catch (e) { }
    if (cached && Date.now() - cached.at < 6 * 3600e3) return ready(cached.r, cached.u, cached.s);
    out.innerHTML = '<p class="muted">' + esc(t('loading_rates')) + '</p>';
    fetch('https://open.er-api.com/v6/latest/USD').then(function (r) { return r.json(); }).then(function (j) {
      if (j.result !== 'success') throw 0;
      var u = j.time_last_update_unix * 1000; try { localStorage.setItem('fx', JSON.stringify({ at: Date.now(), r: j.rates, u: u, s: '<a href="https://www.exchangerate-api.com" rel="nofollow noopener" target="_blank">ExchangeRate-API</a>' })); } catch (e) { }
      ready(j.rates, u, '<a href="https://www.exchangerate-api.com" rel="nofollow noopener" target="_blank">ExchangeRate-API</a>');
    }).catch(function () {
      fetch('https://api.frankfurter.app/latest?from=USD').then(function (r) { return r.json(); }).then(function (j) { j.rates.USD = 1; for (var k in FALLBACK) if (!j.rates[k]) j.rates[k] = FALLBACK[k]; ready(j.rates, j.date, 'ECB'); })
        .catch(function () { ready(FALLBACK, null, t('offline_rates')); });
    });
  }

  /* ---------- time zones ---------- */
  function tz() {
    var zones = [];
    try { zones = Intl.supportedValuesOf('timeZone'); } catch (e) { zones = ['UTC', 'Europe/London', 'Europe/Berlin', 'Europe/Moscow', 'Europe/Istanbul', 'Asia/Baku', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Tokyo', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'America/Sao_Paulo', 'Australia/Sydney']; }
    if (zones.indexOf('UTC') < 0) zones.unshift('UTC');
    var here = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    var targets = ['UTC', 'Europe/London', 'America/New_York', 'Asia/Dubai', 'Asia/Tokyo'].filter(function (z) { return z !== here; });
    function offset(ts, zone) {
      var p = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(ts)), o2 = {};
      p.forEach(function (x) { o2[x.type] = x.value; });
      return Date.UTC(+o2.year, +o2.month - 1, +o2.day, +o2.hour % 24, +o2.minute, +o2.second) - Math.floor(ts / 1000) * 1000;
    }
    function zoned(dateStr, zone) { var m = /^(\d+)-(\d+)-(\d+)T(\d+):(\d+)/.exec(dateStr); if (!m) return NaN; var g2 = Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5]); var o1 = offset(g2, zone), ts = g2 - o1, o2 = offset(ts, zone); return o1 === o2 ? ts : g2 - o2; }
    function off(ts, zone) { var m = Math.round(offset(ts, zone) / 60000), s2 = m < 0 ? '−' : '+'; m = Math.abs(m); return 'UTC' + s2 + ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + m % 60).slice(-2); }
    var opts = zones.map(function (z) { return '<option value="' + z + '">' + z.replace(/_/g, ' ') + '</option>'; }).join('');
    var now = new Date(), loc = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    var dt = el('<label class="f"><span>' + esc(t('date_time')) + '</span><input class="inp" type="datetime-local"></label>'); dt.querySelector('input').value = loc;
    var fz = el('<label class="f"><span>' + esc(t('from_zone')) + '</span><select class="sel">' + opts + '</select></label>'); fz.querySelector('select').value = here;
    var g = el('<div class="fields"></div>'); g.append(dt, fz);
    var list = el('<div class="tzlist"></div>');
    var addS = el('<select class="sel" style="max-width:320px"><option value="">+ ' + esc(t('add_zone')) + '</option>' + opts + '</select>');
    addS.onchange = function () { if (addS.value && targets.indexOf(addS.value) < 0) targets.push(addS.value); addS.value = ''; run(); };
    var nowB = K.btn('clock', t('now'), 'sec sm', function () { var n = new Date(); dt.querySelector('input').value = new Date(n.getTime() - n.getTimezoneOffset() * 60000).toISOString().slice(0, 16); run(); });
    var r = el('<div class="row" style="margin:14px 0"></div>'); r.append(addS, nowB);
    root.append(g, r, list);
    dt.querySelector('input').oninput = fz.querySelector('select').onchange = run;
    function run() {
      var ts = zoned(dt.querySelector('input').value, fz.querySelector('select').value); if (!ok(ts)) { list.innerHTML = ''; return; }
      list.innerHTML = '';
      targets.forEach(function (z, i) {
        var d = new Date(ts), tm = d.toLocaleTimeString(K.lang, { timeZone: z, hour: '2-digit', minute: '2-digit' }), dd = d.toLocaleDateString(K.lang, { timeZone: z, weekday: 'short', day: 'numeric', month: 'short' });
        var row = el('<div class="tzrow"><div><b>' + esc(z.split('/').pop().replace(/_/g, ' ')) + '</b><small>' + esc(z) + ' · ' + off(ts, z) + '</small></div><div class="tzt"><b>' + esc(tm) + '</b><small>' + esc(dd) + '</small></div><button class="ibtn" type="button" aria-label="remove">' + svg('x') + '</button></div>');
        row.querySelector('button').onclick = function () { targets.splice(i, 1); run(); };
        list.appendChild(row);
      });
    }
    run();
  }

  /* ---------- GPA ---------- */
  function gpa() {
    var G = [['A+', 4], ['A', 4], ['A-', 3.7], ['B+', 3.3], ['B', 3], ['B-', 2.7], ['C+', 2.3], ['C', 2], ['C-', 1.7], ['D+', 1.3], ['D', 1], ['D-', .7], ['F', 0]];
    var rows = [['', 'A', 3], ['', 'B+', 4], ['', 'A-', 3], ['', 'B', 2]];
    var tb = el('<div class="gpa"></div>');
    var add = K.btn('plus', t('add_course'), 'sec sm', function () { rows.push(['', 'A', 3]); draw(); });
    root.append(tb, el('<div class="row" style="margin-top:10px"></div>'), out);
    root.children[1].appendChild(add);
    function draw() {
      tb.innerHTML = '<div class="gpa-h"><span>' + esc(t('course')) + '</span><span>' + esc(t('grade')) + '</span><span>' + esc(t('credits')) + '</span><span></span></div>';
      rows.forEach(function (r, i) {
        var line = el('<div class="gpa-r"><input class="inp" placeholder="' + esc(t('course')) + ' ' + (i + 1) + '"><select class="sel">' + G.map(function (g) { return '<option' + (g[0] === r[1] ? ' selected' : '') + '>' + g[0] + '</option>'; }).join('') + '</select><input class="inp" inputmode="decimal"><button class="ibtn" type="button" aria-label="remove">' + svg('x') + '</button></div>');
        var ins = line.querySelectorAll('input'); ins[0].value = r[0]; ins[1].value = r[2];
        ins[0].oninput = function () { r[0] = ins[0].value; }; ins[1].oninput = function () { r[2] = ins[1].value; calc(); };
        line.querySelector('select').onchange = function (e) { r[1] = e.target.value; calc(); };
        line.querySelector('button').onclick = function () { rows.splice(i, 1); draw(); };
        tb.appendChild(line);
      });
      calc();
    }
    function calc() {
      var pts = 0, cr = 0; rows.forEach(function (r) { var c = P(r[2]); if (!(c > 0)) return; var g = G.filter(function (x) { return x[0] === r[1]; })[0]; pts += g[1] * c; cr += c; });
      out.innerHTML = cr ? result(N(pts / cr, 2), t('your_gpa')) + stats([[t('total_credits'), N(cr, 1)], [t('grade_points'), N(pts, 2)]]) : '';
    }
    draw();
  }
});
