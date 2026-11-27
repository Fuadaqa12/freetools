/* Online tests: typing speed, CPS, reaction time, mic, webcam, keyboard, screen */
TK.register('test', function (root, o, K) {
  var t = K.t, el = K.el, esc = K.esc, svg = K.svg, mode = o.mode, N = K.num;
  function stats(arr) { return '<div class="stats">' + arr.map(function (a) { return '<div class="stat"><b>' + a[1] + '</b><span>' + esc(a[0]) + '</span></div>'; }).join('') + '</div>'; }
  function best(key, v, higher) { try { var b = +localStorage.getItem(key) || 0; if (!b || (higher ? v > b : v < b)) { localStorage.setItem(key, v); return v; } return b; } catch (e) { return v; } }

  if (mode === 'typing') {
    var words = (t('typing_words') || '').split(/\s+/).filter(Boolean);
    if (words.length < 20) words = 'the of and to in is you that it he was for on are as with his they at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will up other about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find long down day did get come made may part'.split(' ');
    var D = { dur: 60 }, text = [], pos = 0, typed = [], start = 0, timer = null, done = false;
    var bar = el('<div class="row" style="justify-content:space-between;margin-bottom:12px"></div>');
    var live = el('<div class="row" style="gap:18px;font-weight:700"><span data-k="time"></span><span data-k="wpm"></span><span data-k="acc"></span></div>');
    bar.append(K.seg([[15, '15 s'], [30, '30 s'], [60, '60 s'], [120, '2 min']], 60, function (v) { D.dur = +v; reset(); }), live);
    var box = el('<div class="typebox" tabindex="0"></div>');
    var inp = el('<input class="typeinp" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="type here">');
    var hint = el('<p class="muted" style="text-align:center;margin:10px 0"></p>');
    var res = el('<div></div>');
    var again = K.btn('undo', t('restart'), 'sec', reset);
    var r = el('<div class="row" style="justify-content:center"></div>'); r.appendChild(again);
    root.append(bar, box, inp, hint, res, r);
    function gen() { var a = []; for (var i = 0; i < 300; i++) a.push(words[Math.floor(Math.random() * words.length)]); return a.join(' '); }
    function reset() { clearInterval(timer); text = Array.from(gen()); pos = 0; typed = []; start = 0; done = false; res.innerHTML = ''; inp.value = ''; render(); upd(); hint.textContent = t('typing_hint'); setTimeout(function () { inp.focus({ preventScroll: true }); }, 50); }
    function render() {
      var from = Math.max(0, pos - 60), html = '';
      for (var i = from; i < Math.min(text.length, pos + 220); i++) {
        var c = text[i], cls = i < pos ? (typed[i] === c ? 'ok' : 'bad') : i === pos ? 'cur' : '';
        html += '<span class="' + cls + '">' + (c === ' ' ? (cls === 'bad' ? '·' : ' ') : esc(c)) + '</span>';
      }
      box.innerHTML = html;
    }
    function calc() { var el2 = start ? (Date.now() - start) / 1000 : 0, correct = 0; for (var i = 0; i < pos; i++) if (typed[i] === text[i]) correct++; return { s: el2, wpm: el2 ? correct / 5 / (el2 / 60) : 0, acc: pos ? correct / pos * 100 : 100, correct: correct }; }
    function upd() { var c = calc(), left = Math.max(0, D.dur - c.s); live.querySelector('[data-k=time]').textContent = '⏱ ' + Math.ceil(left) + 's'; live.querySelector('[data-k=wpm]').textContent = Math.round(c.wpm) + ' ' + t('wpm'); live.querySelector('[data-k=acc]').textContent = Math.round(c.acc) + '%'; if (start && left <= 0) finish(); }
    function finish() {
      if (done) return; done = true; clearInterval(timer); inp.blur();
      var c = calc(), b = best('best_wpm', Math.round(c.wpm), true), w = Math.round(c.wpm);
      var lvl = w < 25 ? t('lvl_beginner') : w < 40 ? t('lvl_average') : w < 60 ? t('lvl_good') : w < 80 ? t('lvl_fast') : t('lvl_pro');
      res.innerHTML = '<div class="result" style="margin:8px 0 14px"><div class="big">' + w + ' ' + esc(t('wpm')) + '</div><div class="sub">' + esc(lvl) + '</div></div>' + stats([[t('accuracy'), Math.round(c.acc) + '%'], [t('cpm'), Math.round(c.correct / (D.dur / 60))], [t('characters'), pos], [t('best_result'), b + ' ' + t('wpm')]]);
      hint.textContent = '';
    }
    box.onclick = function () { inp.focus({ preventScroll: true }); };
    inp.addEventListener('keydown', function (e) {
      if (done) return;
      if (e.key === 'Backspace') { e.preventDefault(); if (pos > 0) { pos--; typed.length = pos; render(); upd(); } return; }
    });
    inp.addEventListener('input', function () {
      if (done) { inp.value = ''; return; }
      var v = inp.value; inp.value = '';
      if (!start && v) { start = Date.now(); timer = setInterval(upd, 200); hint.textContent = ''; }
      Array.from(v).forEach(function (ch) { if (pos < text.length) { typed[pos] = ch; pos++; } });
      render(); upd();
    });
    reset();
  }

  else if (mode === 'cps') {
    var C = { dur: 5 }, n = 0, st = 0, tmr = null, over = false;
    var seg = K.seg([[1, '1 s'], [5, '5 s'], [10, '10 s'], [30, '30 s'], [60, '60 s']], 5, function (v) { C.dur = +v; reset(); });
    var pad = el('<button type="button" class="clickpad"><b></b><small></small></button>');
    var res = el('<div style="margin-top:14px"></div>');
    root.append(el('<div class="row" style="justify-content:center;margin-bottom:14px"></div>'), pad, res);
    root.firstChild.appendChild(seg);
    function reset() { clearInterval(tmr); n = 0; st = 0; over = false; pad.disabled = false; pad.querySelector('b').textContent = t('click_to_start'); pad.querySelector('small').textContent = t('cps_hint', { n: C.dur }); res.innerHTML = ''; }
    pad.addEventListener('pointerdown', function (e) {
      e.preventDefault(); if (over) return;
      if (!st) { st = performance.now(); tmr = setInterval(tick, 50); }
      n++; tick();
      var r2 = el('<span class="ripple"></span>'), rc = pad.getBoundingClientRect(); r2.style.left = (e.clientX - rc.left) + 'px'; r2.style.top = (e.clientY - rc.top) + 'px'; pad.appendChild(r2); setTimeout(function () { r2.remove(); }, 500);
    });
    function tick() {
      var s = (performance.now() - st) / 1000, left = Math.max(0, C.dur - s);
      pad.querySelector('b').textContent = n; pad.querySelector('small').textContent = left.toFixed(1) + ' s · ' + N(s > .2 ? n / s : 0, 1) + ' CPS';
      if (left <= 0) {
        clearInterval(tmr); over = true; pad.disabled = true; var cps = n / C.dur, b = best('best_cps_' + C.dur, +cps.toFixed(2), true);
        var rank = cps < 4 ? t('cps_r1') : cps < 6 ? t('cps_r2') : cps < 8 ? t('cps_r3') : cps < 10 ? t('cps_r4') : t('cps_r5');
        res.innerHTML = '<div class="result"><div class="big">' + N(cps, 2) + ' CPS</div><div class="sub">' + esc(rank) + '</div></div>' + '<div style="height:12px"></div>' + stats([[t('clicks'), n], [t('time'), C.dur + ' s'], [t('best_result'), N(b, 2) + ' CPS']]);
        var ag = K.btn('undo', t('restart'), 'big', reset); var rr = el('<div class="row" style="justify-content:center;margin-top:14px"></div>'); rr.appendChild(ag); res.appendChild(rr);
      }
    }
    reset();
  }

  else if (mode === 'reaction') {
    var state = 'idle', go = 0, to = null, R = [];
    var pad2 = el('<button type="button" class="reactpad"><b></b><small></small></button>');
    var res2 = el('<div style="margin-top:14px"></div>');
    root.append(pad2, res2);
    function set(s, big, small) { state = s; pad2.dataset.s = s; pad2.querySelector('b').textContent = big; pad2.querySelector('small').textContent = small || ''; }
    function idle() { set('idle', t('react_start'), t('react_hint')); }
    pad2.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (state === 'idle' || state === 'result' || state === 'early') { set('wait', t('react_wait'), ''); to = setTimeout(function () { go = performance.now(); set('go', t('react_click'), ''); }, 1500 + Math.random() * 3500); }
      else if (state === 'wait') { clearTimeout(to); set('early', t('react_early'), t('react_again')); }
      else if (state === 'go') {
        var ms = Math.round(performance.now() - go); R.push(ms); if (R.length > 5) R.shift();
        set('result', ms + ' ms', t('react_again'));
        var avg = Math.round(R.reduce(function (a, b) { return a + b; }, 0) / R.length), b = best('best_react', ms, false);
        res2.innerHTML = stats([[t('last'), ms + ' ms'], [t('average_of', { n: R.length }), avg + ' ms'], [t('best_result'), b + ' ms'], [t('rating'), ms < 200 ? t('react_r1') : ms < 260 ? t('react_r2') : ms < 330 ? t('react_r3') : t('react_r4')]]);
      }
    });
    idle();
  }

  else if (mode === 'mic') {
    var stream = null, raf = 0, actx, an;
    var startB = K.btn('mic', t('start_mic_test'), 'big', start);
    var cv = el('<canvas class="wave" width="1000" height="220"></canvas>');
    var meter = el('<div class="meter big"><i></i></div>');
    var info = el('<div class="stats" style="margin-top:12px"></div>');
    var sel = el('<select class="sel hide" style="max-width:420px"></select>');
    var recB = K.btn('play', t('record_5s'), 'sec hide', rec5);
    var player = el('<audio controls class="hide" style="width:100%;margin-top:10px"></audio>');
    var r = el('<div class="row" style="justify-content:center;margin-bottom:14px"></div>'); r.append(startB, sel, recB);
    var stat = el('<p class="muted" style="text-align:center"></p>'); stat.textContent = t('mic_intro');
    root.append(r, stat, cv, meter, info, player);
    function start(id) {
      if (!navigator.mediaDevices) { stat.textContent = t('not_supported'); return; }
      if (stream) stream.getTracks().forEach(function (x) { x.stop(); });
      navigator.mediaDevices.getUserMedia({ audio: id && typeof id === 'string' ? { deviceId: { exact: id } } : true }).then(function (s) {
        stream = s; startB.classList.add('hide'); recB.classList.remove('hide');
        actx = actx || new (window.AudioContext || window.webkitAudioContext)(); an = actx.createAnalyser(); an.fftSize = 2048; actx.createMediaStreamSource(s).connect(an);
        var tr = s.getAudioTracks()[0]; stat.innerHTML = '✅ <b>' + esc(t('mic_works')) + '</b> · ' + esc(tr.label || '');
        navigator.mediaDevices.enumerateDevices().then(function (ds) { var m = ds.filter(function (d) { return d.kind === 'audioinput'; }); if (m.length > 1) { sel.innerHTML = m.map(function (d, i) { return '<option value="' + d.deviceId + '">' + esc(d.label || 'Mic ' + (i + 1)) + '</option>'; }).join(''); sel.value = tr.getSettings().deviceId || ''; sel.classList.remove('hide'); } });
        var st2 = tr.getSettings ? tr.getSettings() : {};
        info.innerHTML = [[t('sample_rate'), (st2.sampleRate || actx.sampleRate) + ' Hz'], [t('channels'), st2.channelCount || 1], [t('echo_cancel'), st2.echoCancellation ? '✓' : '—'], [t('noise_suppr'), st2.noiseSuppression ? '✓' : '—']].map(function (a) { return '<div class="stat"><b>' + a[1] + '</b><span>' + esc(a[0]) + '</span></div>'; }).join('');
        loop();
      }, function () { stat.innerHTML = '❌ ' + esc(t('mic_denied')); });
    }
    sel.onchange = function () { cancelAnimationFrame(raf); start(sel.value); };
    function loop() {
      var x = cv.getContext('2d'), d = new Uint8Array(an.fftSize); an.getByteTimeDomainData(d);
      var w = cv.width, h = cv.height, peak = 0; x.clearRect(0, 0, w, h); x.lineWidth = 3; x.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--brand') || '#5b4cf5'; x.beginPath();
      for (var i = 0; i < d.length; i++) { var v = (d[i] - 128) / 128; peak = Math.max(peak, Math.abs(v)); var X = i / d.length * w, Y = h / 2 + v * h / 2; i ? x.lineTo(X, Y) : x.moveTo(X, Y); }
      x.stroke(); meter.firstChild.style.width = Math.min(100, peak * 140) + '%'; meter.firstChild.style.background = peak > .9 ? 'var(--err)' : 'var(--ok)';
      raf = requestAnimationFrame(loop);
    }
    function rec5() {
      if (!stream || !window.MediaRecorder) return; var mr = new MediaRecorder(stream), ch = [], n = 5; recB.disabled = true;
      mr.ondataavailable = function (e) { ch.push(e.data); }; mr.onstop = function () { player.src = URL.createObjectURL(new Blob(ch, { type: mr.mimeType })); player.classList.remove('hide'); player.play(); recB.disabled = false; recB.querySelector('span').textContent = t('record_5s'); };
      mr.start(); var iv = setInterval(function () { recB.querySelector('span').textContent = t('recording') + ' ' + n--; if (n < 0) { clearInterval(iv); mr.stop(); } }, 1000);
    }
  }

  else if (mode === 'webcam') {
    var vs = null;
    var vid = el('<video class="vid" autoplay playsinline muted style="transform:scaleX(-1)"></video>');
    var b1 = K.btn('camera', t('start_cam_test'), 'big', go1), snap = K.btn('download', t('take_photo'), 'sec hide', shot), mir = K.btn('flip', t('mirror'), 'sec hide', function () { vid.style.transform = vid.style.transform ? '' : 'scaleX(-1)'; });
    var csel = el('<select class="sel hide" style="max-width:420px"></select>');
    var info2 = el('<div class="stats" style="margin-top:12px"></div>'), st3 = el('<p class="muted" style="text-align:center"></p>'); st3.textContent = t('cam_intro');
    var r4 = el('<div class="row" style="justify-content:center;margin-bottom:14px"></div>'); r4.append(b1, csel, mir, snap);
    root.append(r4, st3, vid, info2);
    function go1(id) {
      if (!navigator.mediaDevices) { st3.textContent = t('not_supported'); return; }
      if (vs) vs.getTracks().forEach(function (x) { x.stop(); });
      navigator.mediaDevices.getUserMedia({ video: id && typeof id === 'string' ? { deviceId: { exact: id }, width: { ideal: 1920 } } : { width: { ideal: 1920 }, height: { ideal: 1080 } } }).then(function (s) {
        vs = s; vid.srcObject = s; b1.classList.add('hide'); snap.classList.remove('hide'); mir.classList.remove('hide');
        var tr = s.getVideoTracks()[0], set = tr.getSettings ? tr.getSettings() : {};
        st3.innerHTML = '✅ <b>' + esc(t('cam_works')) + '</b> · ' + esc(tr.label || '');
        var fps = 0, frames = 0, t0 = performance.now();
        function cnt() { frames++; var now = performance.now(); if (now - t0 >= 1000) { fps = frames; frames = 0; t0 = now; upd(); } if (vid.requestVideoFrameCallback) vid.requestVideoFrameCallback(cnt); }
        if (vid.requestVideoFrameCallback) vid.requestVideoFrameCallback(cnt);
        function upd() { var w = vid.videoWidth || set.width, h = vid.videoHeight || set.height; info2.innerHTML = [[t('resolution'), w + ' × ' + h], ['MP', N(w * h / 1e6, 1)], ['FPS', fps || set.frameRate && Math.round(set.frameRate) || '—'], [t('aspect_ratio'), h ? N(w / h, 2) + ':1' : '—']].map(function (a) { return '<div class="stat"><b>' + a[1] + '</b><span>' + esc(a[0]) + '</span></div>'; }).join(''); }
        vid.onloadedmetadata = upd; upd();
        navigator.mediaDevices.enumerateDevices().then(function (ds) { var m = ds.filter(function (d) { return d.kind === 'videoinput'; }); if (m.length > 1) { csel.innerHTML = m.map(function (d, i) { return '<option value="' + d.deviceId + '">' + esc(d.label || 'Camera ' + (i + 1)) + '</option>'; }).join(''); csel.value = set.deviceId || ''; csel.classList.remove('hide'); } });
      }, function () { st3.innerHTML = '❌ ' + esc(t('cam_denied')); });
    }
    csel.onchange = function () { go1(csel.value); };
    function shot() { var c = document.createElement('canvas'); c.width = vid.videoWidth; c.height = vid.videoHeight; var x = c.getContext('2d'); if (vid.style.transform) { x.translate(c.width, 0); x.scale(-1, 1); } x.drawImage(vid, 0, 0); K.canvasBlob(c, 'image/jpeg', .92).then(function (b) { K.download(b, 'webcam-photo.jpg'); }); }
  }

  else if (mode === 'keys') {
    var rows = [['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
      ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'Backspace'],
      ['Tab', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'],
      ['CapsLock', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter'],
      ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ShiftRight'],
      ['ControlLeft', 'MetaLeft', 'AltLeft', 'Space', 'AltRight', 'MetaRight', 'ContextMenu', 'ControlRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight']];
    var lab = { Escape: 'Esc', Backquote: '`', Minus: '-', Equal: '=', Backspace: '⌫', Tab: 'Tab', BracketLeft: '[', BracketRight: ']', Backslash: '\\', CapsLock: 'Caps', Semicolon: ';', Quote: '\'', Enter: 'Enter', ShiftLeft: 'Shift', ShiftRight: 'Shift', Comma: ',', Period: '.', Slash: '/', ControlLeft: 'Ctrl', ControlRight: 'Ctrl', MetaLeft: 'Win', MetaRight: 'Win', AltLeft: 'Alt', AltRight: 'Alt', Space: '', ContextMenu: '☰', ArrowLeft: '←', ArrowUp: '↑', ArrowDown: '↓', ArrowRight: '→' };
    var wide = { Backspace: 2, Tab: 1.5, Backslash: 1.5, CapsLock: 1.8, Enter: 2.2, ShiftLeft: 2.4, ShiftRight: 2.6, Space: 6, ControlLeft: 1.3, ControlRight: 1.3 };
    var kb = el('<div class="kb"></div>'), last = el('<div class="result" style="margin-top:14px"><div class="big" style="font-size:28px">' + esc(t('press_any_key')) + '</div><div class="sub"></div></div>'), cnt2 = el('<p class="muted" style="text-align:center"></p>'), seen = {};
    rows.forEach(function (r) { var row = el('<div class="kbr"></div>'); r.forEach(function (c) { var k = el('<span data-c="' + c + '">' + esc(lab[c] != null ? lab[c] : c.replace(/^Key|^Digit/, '')) + '</span>'); k.style.flex = wide[c] || 1; row.appendChild(k); }); kb.appendChild(row); });
    var rst = K.btn('undo', t('reset'), 'sec sm', function () { seen = {}; K.$$('span', kb).forEach(function (s) { s.className = ''; }); cnt2.textContent = ''; });
    root.append(el('<p class="muted" style="text-align:center;margin-top:0">' + esc(t('keys_intro')) + '</p>'), kb, last, cnt2, el('<div class="row" style="justify-content:center"></div>'));
    root.lastChild.appendChild(rst);
    function on(e) {
      if (!/^F5$|^F12$/.test(e.code) && !(e.ctrlKey && /KeyR|KeyW|KeyT/.test(e.code))) e.preventDefault();
      var k = kb.querySelector('[data-c="' + e.code + '"]'); if (k) k.classList.add('down', 'seen');
      seen[e.code] = 1; cnt2.textContent = t('keys_tested', { n: Object.keys(seen).length });
      last.querySelector('.big').textContent = e.key === ' ' ? 'Space' : e.key; last.querySelector('.sub').textContent = 'code: ' + e.code + ' · keyCode: ' + e.keyCode + (e.location ? ' · location: ' + e.location : '');
    }
    document.addEventListener('keydown', on);
    document.addEventListener('keyup', function (e) { var k = kb.querySelector('[data-c="' + e.code + '"]'); if (k) k.classList.remove('down'); });
  }

  else if (mode === 'screen') {
    var box2 = el('<div></div>');
    root.append(box2);
    function ua() {
      var u = navigator.userAgent, os = /Windows NT 10/.test(u) ? 'Windows 10/11' : /Windows/.test(u) ? 'Windows' : /Android ([\d.]+)/.test(u) ? 'Android ' + RegExp.$1 : /iPhone|iPad/.test(u) ? 'iOS' : /Mac OS X/.test(u) ? 'macOS' : /CrOS/.test(u) ? 'ChromeOS' : /Linux/.test(u) ? 'Linux' : '—';
      var br = /Edg\/([\d]+)/.test(u) ? 'Edge ' + RegExp.$1 : /OPR\/([\d]+)/.test(u) ? 'Opera ' + RegExp.$1 : /YaBrowser\/([\d]+)/.test(u) ? 'Yandex ' + RegExp.$1 : /Firefox\/([\d]+)/.test(u) ? 'Firefox ' + RegExp.$1 : /Chrome\/([\d]+)/.test(u) ? 'Chrome ' + RegExp.$1 : /Version\/([\d.]+).*Safari/.test(u) ? 'Safari ' + RegExp.$1 : '—';
      return [os, br];
    }
    function draw() {
      var s = screen, dpr = window.devicePixelRatio || 1, u = ua(), real = Math.round(s.width * dpr) + ' × ' + Math.round(s.height * dpr);
      box2.innerHTML = '<div class="result"><div class="big">' + s.width + ' × ' + s.height + '</div><div class="sub">' + esc(t('screen_resolution')) + ' · ' + esc(t('physical')) + ': ' + real + '</div></div><div style="height:12px"></div>' +
        stats([[t('viewport_size'), innerWidth + ' × ' + innerHeight], [t('pixel_ratio'), N(dpr, 2) + 'x'], [t('available_screen'), s.availWidth + ' × ' + s.availHeight], [t('color_depth'), s.colorDepth + '-bit'], [t('aspect_ratio'), N(s.width / s.height, 3) + ':1'], [t('orientation'), (s.orientation && s.orientation.type || (innerWidth > innerHeight ? 'landscape' : 'portrait')).replace(/-primary|-secondary/, '')], [t('os'), u[0]], [t('browser'), u[1]], [t('language'), navigator.language], [t('cpu_cores'), navigator.hardwareConcurrency || '—'], [t('touch'), navigator.maxTouchPoints > 0 ? '✓ (' + navigator.maxTouchPoints + ')' : '—'], [t('time_zone'), Intl.DateTimeFormat().resolvedOptions().timeZone]]);
      var cp = K.btn('copy', t('copy'), 'sec sm', function () { K.copy(box2.innerText.replace(/\n+/g, '\n')); }); var r = el('<div class="row end" style="margin-top:12px"></div>'); r.appendChild(cp); box2.appendChild(r);
    }
    draw(); window.addEventListener('resize', K.debounce(draw, 150));
  }
});
