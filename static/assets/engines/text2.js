/* Text tools, batch 2: fancy text, compare, morse, binary, repeater */
TK.register('text2', function (root, o, K) {
  var t = K.t, el = K.el, esc = K.esc, svg = K.svg, mode = o.mode;
  function area(ph, val, h) { var a = el('<textarea class="inp" placeholder="' + esc(ph || t('paste_text')) + '"' + (h ? ' style="min-height:' + h + 'px"' : '') + '></textarea>'); if (val) a.value = val; return a; }
  function copyBtn(get) { return K.btn('copy', t('copy'), 'sec sm', function () { K.copy(get()); }); }

  if (mode === 'fancy') {
    var A = 'abcdefghijklmnopqrstuvwxyz', U = A.toUpperCase(), D = '0123456789';
    function cp(s) { return Array.from(s); }
    function mapRange(lo, up, dg, ex) {
      var l = cp(lo), u = cp(up), d = dg ? cp(dg) : null;
      return function (s) { return Array.from(s).map(function (ch) { if (ex && ex[ch]) return ex[ch]; var i = A.indexOf(ch); if (i >= 0) return l[i] || ch; i = U.indexOf(ch); if (i >= 0) return u[i] || ch; i = D.indexOf(ch); if (i >= 0 && d) return d[i]; return ch; }).join(''); };
    }
    function off(base, dbase) { var l = '', u = ''; for (var i = 0; i < 26; i++) { u += String.fromCodePoint(base + i); l += String.fromCodePoint(base + 26 + i); } var d = ''; if (dbase) for (var j = 0; j < 10; j++) d += String.fromCodePoint(dbase + j); return mapRange(l, u, d || null); }
    function comb(mark) { return function (s) { return Array.from(s).map(function (c) { return /\s/.test(c) ? c : c + mark; }).join(''); }; }
    var styles = [
      ['Bold', off(0x1D400, 0x1D7CE)], ['Italic', mapRange('𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧', '𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍')], ['Bold Italic', off(0x1D468)],
      ['Script', mapRange('𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏', '𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵')], ['Bold Script', off(0x1D4D0)],
      ['Fraktur', mapRange('𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷', '𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ')], ['Bold Fraktur', off(0x1D56C)],
      ['Double-struck', mapRange('𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫', '𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ', '𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡')],
      ['Sans', off(0x1D5A0, 0x1D7E2)], ['Sans Bold', off(0x1D5D4, 0x1D7EC)], ['Sans Italic', off(0x1D608)], ['Monospace', off(0x1D670, 0x1D7F6)],
      ['Circled', mapRange('ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ', 'ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ', '⓪①②③④⑤⑥⑦⑧⑨')],
      ['Negative circled', mapRange('🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩', '🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩', '⓿❶❷❸❹❺❻❼❽❾')],
      ['Squared', mapRange('🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉', '🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉')],
      ['Negative squared', mapRange('🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉', '🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉')],
      ['Fullwidth', mapRange('ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ', 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ', '０１２３４５６７８９')],
      ['Small caps', mapRange('ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ', 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ')],
      ['Superscript', mapRange('ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖqʳˢᵗᵘᵛʷˣʸᶻ', 'ᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾQᴿˢᵀᵁⱽᵂˣʸᶻ', '⁰¹²³⁴⁵⁶⁷⁸⁹')],
      ['Strikethrough', comb('̶')], ['Underline', comb('̲')], ['Slash', comb('̸')], ['Wavy', comb('̰')],
      ['Bubbles', function (s) { return Array.from(s).map(function (c) { return /\s/.test(c) ? c : c + '⃝'; }).join(''); }],
      ['Upside down', function (s) { var m = { a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ', i: 'ᴉ', j: 'ɾ', k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd', q: 'b', r: 'ɹ', s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x', y: 'ʎ', z: 'z', '.': '˙', ',': '\'', '?': '¿', '!': '¡', '(': ')', ')': '(', '[': ']', ']': '[', '<': '>', '>': '<', '_': '‾', '"': '„', '\'': ',' }; return Array.from(s.toLowerCase()).reverse().map(function (c) { return m[c] || c; }).join(''); }],
      ['Spaced', function (s) { return Array.from(s).join(' '); }],
      ['Sparkles', function (s) { return '✨ ' + s + ' ✨'; }], ['Stars', function (s) { return '★ ' + s + ' ★'; }], ['Hearts', function (s) { return '♡ ' + s + ' ♡'; }],
      ['Brackets', function (s) { return '『' + s + '』'; }], ['Wings', function (s) { return '꧁ ' + s + ' ꧂'; }]
    ];
    var inp = el('<input class="inp" style="height:56px;font-size:18px" maxlength="300">'); inp.value = t('fancy_sample');
    var list = el('<div class="fancy"></div>');
    function run() {
      var v = inp.value || t('fancy_sample'); list.innerHTML = '';
      styles.forEach(function (s) {
        var out = s[1](v), r = el('<button type="button" class="fancy-row"><small>' + esc(s[0]) + '</small><span></span>' + svg('copy') + '</button>');
        r.querySelector('span').textContent = out; r.onclick = function () { K.copy(out); }; list.appendChild(r);
      });
    }
    inp.oninput = K.debounce(run, 80);
    root.append(el('<label class="f"><span>' + esc(t('your_text')) + '</span></label>'), inp, el('<p class="muted">' + esc(t('fancy_tip')) + '</p>'), list);
    root.firstChild.appendChild(inp); run();
  }

  else if (mode === 'diff') {
    var a = area(t('original_text'), t('diff_a'), 180), b = area(t('changed_text'), t('diff_b'), 180);
    var g = el('<div class="fields" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))"></div>');
    var fa = el('<label class="f"><span>' + esc(t('original_text')) + '</span></label>'), fb = el('<label class="f"><span>' + esc(t('changed_text')) + '</span></label>');
    fa.appendChild(a); fb.appendChild(b); g.append(fa, fb);
    var by = 'word', ign = false;
    var bar = el('<div class="row" style="margin:14px 0"></div>');
    bar.append(K.seg([['word', t('by_words')], ['line', t('by_lines')], ['char', t('by_chars')]], 'word', function (v) { by = v; run(); }), K.chk(t('ignore_case'), false, function (v) { ign = v; run(); }));
    var stats = el('<div class="row" style="gap:16px;margin-bottom:10px"></div>');
    var out = el('<div class="diffout"></div>');
    root.append(g, bar, stats, out);
    function tok(s) { return by === 'line' ? s.split(/(\n)/) : by === 'char' ? Array.from(s) : s.split(/(\s+)/); }
    function run() {
      var x = tok(a.value), y = tok(b.value);
      if (x.length * y.length > 4e6) { out.textContent = t('too_long'); return; }
      var n = x.length, m = y.length, eq = function (p, q) { return ign ? p.toLowerCase() === q.toLowerCase() : p === q; };
      var dp = new Array(n + 1); for (var i = 0; i <= n; i++) dp[i] = new Uint32Array(m + 1);
      for (i = n - 1; i >= 0; i--) for (var j = m - 1; j >= 0; j--) dp[i][j] = eq(x[i], y[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      var html = '', add = 0, del = 0; i = 0; j = 0;
      while (i < n || j < m) {
        if (i < n && j < m && eq(x[i], y[j])) { html += esc(y[j]); i++; j++; }
        else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) { html += '<ins>' + esc(y[j]) + '</ins>'; if (/\S/.test(y[j])) add++; j++; }
        else { html += '<del>' + esc(x[i]) + '</del>'; if (/\S/.test(x[i])) del++; i++; }
      }
      out.innerHTML = html || '<span class="muted">—</span>';
      stats.innerHTML = (add || del) ? '<span class="tag add">+' + add + ' ' + esc(t('added')) + '</span><span class="tag del">−' + del + ' ' + esc(t('removed')) + '</span>' : '<span class="okmsg">' + esc(t('texts_identical')) + '</span>';
    }
    a.oninput = b.oninput = K.debounce(run, 200); run();
  }

  else if (mode === 'morse') {
    var M = { a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..',
      0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..', '\'': '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
      'а': '.-', 'б': '-...', 'в': '.--', 'г': '--.', 'д': '-..', 'е': '.', 'ё': '.', 'ж': '...-', 'з': '--..', 'и': '..', 'й': '.---', 'к': '-.-', 'л': '.-..', 'м': '--', 'н': '-.', 'о': '---', 'п': '.--.', 'р': '.-.', 'с': '...', 'т': '-', 'у': '..-', 'ф': '..-.', 'х': '....', 'ц': '-.-.', 'ч': '---.', 'ш': '----', 'щ': '--.-', 'ъ': '--.--', 'ы': '-.--', 'ь': '-..-', 'э': '..-..', 'ю': '..--', 'я': '.-.-' };
    var R = {}; for (var k in M) if (!/[а-яё]/.test(k) && !R[M[k]]) R[M[k]] = k;
    var dir = 'enc';
    var src = area('', 'SOS Hello World', 130), dst = area('', '', 130); dst.readOnly = true;
    var bar2 = el('<div class="row" style="margin:12px 0"></div>');
    bar2.append(K.seg([['enc', t('text_to_morse')], ['dec', t('morse_to_text')]], 'enc', function (v) { dir = v; src.value = dst.value; run(); }), K.btn('play', t('play_sound'), 'sec sm', play), copyBtn(function () { return dst.value; }));
    root.append(src, bar2, dst);
    function run() {
      if (dir === 'enc') dst.value = Array.from(src.value.toLowerCase()).map(function (c) { return c === ' ' || c === '\n' ? '/' : M[c] || ''; }).filter(Boolean).join(' ').replace(/ ?\/ ?/g, ' / ');
      else dst.value = src.value.trim().split(/\s*\/\s*|\s{3,}/).map(function (w) { return w.split(/\s+/).map(function (c) { return R[c.replace(/[·•]/g, '.').replace(/[−–—_]/g, '-')] || ''; }).join(''); }).join(' ').toUpperCase();
    }
    var ac;
    function play() {
      var code = dir === 'enc' ? dst.value : src.value; if (!code.trim()) return;
      ac = ac || new (window.AudioContext || window.webkitAudioContext)(); var tm = ac.currentTime + .05, u = .08;
      Array.from(code).forEach(function (c) {
        if (c === '.' || c === '-') { var os = ac.createOscillator(), g = ac.createGain(); os.frequency.value = 650; g.gain.setValueAtTime(0, tm); g.gain.linearRampToValueAtTime(.3, tm + .005); var d = c === '.' ? u : u * 3; g.gain.setValueAtTime(.3, tm + d - .005); g.gain.linearRampToValueAtTime(0, tm + d); os.connect(g).connect(ac.destination); os.start(tm); os.stop(tm + d + .01); tm += d + u; }
        else if (c === ' ') tm += u * 2; else if (c === '/') tm += u * 4;
      });
    }
    src.oninput = run; run();
  }

  else if (mode === 'binary') {
    var fmt = 'bin', dir2 = 'enc';
    var s1 = area('', 'Hello', 130), s2 = area('', '', 130); s2.readOnly = true;
    var b3 = el('<div class="row" style="margin:12px 0"></div>');
    b3.append(K.seg([['enc', t('text_to_code')], ['dec', t('code_to_text')]], 'enc', function (v) { dir2 = v; s1.value = s2.value; run(); }),
      K.seg([['bin', 'Binary'], ['hex', 'HEX'], ['oct', 'Octal'], ['dec', 'Decimal']], 'bin', function (v) { fmt = v; if (dir2 === 'dec') s1.value = ''; run(); }), copyBtn(function () { return s2.value; }));
    var err = el('<p class="err hide"></p>');
    root.append(s1, b3, s2, err);
    var base = { bin: [2, 8], hex: [16, 2], oct: [8, 3], dec: [10, 0] };
    function run() {
      err.classList.add('hide');
      try {
        var B = base[fmt];
        if (dir2 === 'enc') s2.value = Array.from(new TextEncoder().encode(s1.value)).map(function (b) { var v = b.toString(B[0]); return B[1] ? ('00000000' + v).slice(-B[1]) : v; }).join(' ').toUpperCase();
        else {
          var parts = s1.value.trim().split(/[\s,]+/).filter(Boolean), arr = parts.map(function (p) { var v = parseInt(p, B[0]); if (isNaN(v) || v > 255) throw 0; return v; });
          s2.value = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(arr));
        }
      } catch (e) { s2.value = ''; err.textContent = t('invalid_input'); err.classList.remove('hide'); }
    }
    s1.oninput = run; run();
  }

  else if (mode === 'repeat') {
    var P = { n: 10, sep: 'nl', num: false };
    var s = area('', t('repeat_sample'), 100);
    var g2 = el('<div class="fields" style="margin:12px 0"></div>');
    g2.append(K.field(t('times'), 10, function (v) { P.n = Math.min(100000, Math.max(1, Math.round(K.pnum(v)) || 1)); run(); }),
      K.sel(t('separator'), [['nl', t('new_line')], ['sp', t('space')], ['none', t('none')], ['comma', ', '], ['custom', t('custom')]], 'nl', function (v) { P.sep = v; cust.classList.toggle('hide', v !== 'custom'); run(); }));
    var cust = K.field(t('custom'), ' | ', function () { run(); }, { text: true }); cust.classList.add('hide'); g2.appendChild(cust);
    var out = area('', '', 200); out.readOnly = true;
    var info = el('<span class="muted"></span>');
    var r = el('<div class="row" style="margin:10px 0"></div>');
    r.append(K.chk(t('add_numbers'), false, function (v) { P.num = v; run(); }), info, copyBtn(function () { return out.value; }), K.btn('download', t('download'), 'sec sm', function () { K.download(new Blob([out.value], { type: 'text/plain;charset=utf-8' }), 'repeated.txt'); }));
    root.append(s, g2, r, out);
    function run() {
      var sep = { nl: '\n', sp: ' ', none: '', comma: ', ', custom: cust.input.value }[P.sep], arr = [];
      for (var i = 0; i < P.n; i++) arr.push((P.num ? (i + 1) + '. ' : '') + s.value);
      var v = arr.join(sep); if (v.length > 5e6) { v = v.slice(0, 5e6); }
      out.value = v; info.textContent = t('characters') + ': ' + K.num(v.length, 0);
    }
    s.oninput = run; run();
  }
});
