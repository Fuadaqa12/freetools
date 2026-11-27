/* Time & sound, batch 2: pomodoro, world clock, alarm clock, metronome */
TK.register('time2', function (root, o, K) {
  var t = K.t, el = K.el, esc = K.esc, svg = K.svg, mode = o.mode;
  var ac;
  function audio() { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; }
  function beep(freq, dur, when, vol) { var a = audio(), os = a.createOscillator(), g = a.createGain(), tm = when || a.currentTime; os.frequency.value = freq; g.gain.setValueAtTime(0, tm); g.gain.linearRampToValueAtTime(vol || .3, tm + .005); g.gain.exponentialRampToValueAtTime(.001, tm + dur); os.connect(g).connect(a.destination); os.start(tm); os.stop(tm + dur + .02); }
  function chime() { var a = audio(), n = a.currentTime; [0, .25, .5, 1, 1.25, 1.5].forEach(function (d, i) { beep(i % 3 === 2 ? 1320 : 880, .22, n + d, .35); }); }
  function notify(msg) { try { if (window.Notification && Notification.permission === 'granted') new Notification(msg); } catch (e) { } }
  function askNotify() { try { if (window.Notification && Notification.permission === 'default') Notification.requestPermission(); } catch (e) { } }
  function pad(n) { return ('0' + n).slice(-2); }
  var baseTitle = document.title;

  if (mode === 'pomodoro') {
    var C = { work: 25, short: 5, long: 15, every: 4 }, phase = 'work', left = C.work * 60, run = false, done = 0, timer = null, end = 0;
    var tabs = K.seg([['work', t('focus')], ['short', t('short_break')], ['long', t('long_break')]], 'work', function (v) { set(v); });
    var ring = el('<div class="ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" class="bg"/><circle cx="60" cy="60" r="54" class="fg"/></svg><div><div class="big-time" style="margin:0"></div><small class="muted"></small></div></div>');
    var startB = K.btn('play', t('start'), 'big', toggle), skip = K.btn('down', t('skip'), 'sec', function () { next(); }), rst = K.btn('undo', t('reset'), 'sec', function () { set(phase); });
    skip.firstChild.style.transform = 'rotate(-90deg)';
    var r = el('<div class="row" style="justify-content:center;margin:18px 0"></div>'); r.append(rst, startB, skip);
    var g = el('<div class="fields"></div>');
    [['work', t('focus')], ['short', t('short_break')], ['long', t('long_break')]].forEach(function (x) { g.appendChild(K.field(x[1], C[x[0]], function (v) { var n = K.pnum(v); if (n > 0 && n <= 180) { C[x[0]] = n; if (!run && phase === x[0]) set(phase); } }, { unit: t('min') })); });
    var cnt = el('<p class="muted" style="text-align:center"></p>');
    root.append(el('<div class="row" style="justify-content:center"></div>'), ring, r, cnt, el('<details class="opts"><summary>' + esc(t('settings')) + '</summary></details>'));
    root.firstChild.appendChild(tabs); root.lastChild.appendChild(g);
    var fg = ring.querySelector('.fg'), big = ring.querySelector('.big-time'), small = ring.querySelector('small'), L = 2 * Math.PI * 54;
    fg.style.strokeDasharray = L;
    function draw() {
      var m = Math.floor(left / 60), s = Math.floor(left % 60); big.textContent = pad(m) + ':' + pad(s);
      small.textContent = { work: t('focus'), short: t('short_break'), long: t('long_break') }[phase];
      fg.style.strokeDashoffset = L * (1 - left / (C[phase] * 60)); ring.dataset.p = phase;
      cnt.textContent = t('pomodoros_done', { n: done });
      document.title = run ? pad(m) + ':' + pad(s) + ' · ' + small.textContent : baseTitle;
    }
    function set(p) { phase = p; stop(); left = C[p] * 60; K.$$('button', tabs).forEach(function (b, i) { b.classList.toggle('on', ['work', 'short', 'long'][i] === p); }); draw(); }
    function stop() { run = false; clearInterval(timer); startB.querySelector('span').textContent = t('start'); startB.firstChild.outerHTML = svg('play'); }
    function toggle() {
      audio(); askNotify();
      if (run) { stop(); draw(); return; }
      run = true; end = Date.now() + left * 1000; startB.querySelector('span').textContent = t('pause'); startB.firstChild.outerHTML = svg('pause');
      timer = setInterval(function () { left = Math.max(0, (end - Date.now()) / 1000); if (left <= 0) { chime(); notify(t('times_up')); if (phase === 'work') done++; next(true); } draw(); }, 250);
    }
    function next(auto) { var n = phase === 'work' ? ((done % C.every === 0 && done) ? 'long' : 'short') : 'work'; set(n); if (auto) toggle(); }
    set('work');
  }

  else if (mode === 'world') {
    var here = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    var def = [here, 'UTC', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Europe/Moscow', 'Europe/Istanbul', 'Asia/Baku', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Tokyo', 'Australia/Sydney'];
    var list = def.filter(function (z, i) { return def.indexOf(z) === i; });
    try { var sv = JSON.parse(localStorage.getItem('wclock') || 'null'); if (sv && sv.length) list = sv; } catch (e) { }
    var zones = []; try { zones = Intl.supportedValuesOf('timeZone'); } catch (e) { zones = def; }
    var addS = el('<select class="sel" style="max-width:320px"><option value="">+ ' + esc(t('add_zone')) + '</option>' + zones.map(function (z) { return '<option value="' + z + '">' + z.replace(/_/g, ' ') + '</option>'; }).join('') + '</select>');
    addS.onchange = function () { if (addS.value && list.indexOf(addS.value) < 0) { list.push(addS.value); save(); } addS.value = ''; draw(); };
    var gridc = el('<div class="clocks"></div>');
    root.append(el('<div class="row" style="margin-bottom:14px"></div>'), gridc);
    root.firstChild.appendChild(addS);
    function save() { try { localStorage.setItem('wclock', JSON.stringify(list)); } catch (e) { } }
    function draw() {
      var now = new Date(); gridc.innerHTML = '';
      list.forEach(function (z, i) {
        var h = +now.toLocaleString('en-US', { timeZone: z, hour: 'numeric', hourCycle: 'h23' }), day = h >= 7 && h < 19;
        var c = el('<div class="clock' + (z === here ? ' here' : '') + '"><div class="ct"><b>' + esc(z === 'UTC' ? 'UTC' : z.split('/').pop().replace(/_/g, ' ')) + '</b><button class="ibtn" type="button" aria-label="remove">' + svg('x') + '</button></div><div class="cv">' + esc(now.toLocaleTimeString(K.lang, { timeZone: z, hour: '2-digit', minute: '2-digit', second: '2-digit' })) + '</div><small>' + (day ? '☀️ ' : '🌙 ') + esc(now.toLocaleDateString(K.lang, { timeZone: z, weekday: 'long', day: 'numeric', month: 'long' })) + '</small></div>');
        c.querySelector('button').onclick = function () { list.splice(i, 1); save(); draw(); };
        gridc.appendChild(c);
      });
    }
    draw(); setInterval(draw, 1000);
  }

  else if (mode === 'alarm') {
    var now0 = new Date(); now0.setMinutes(now0.getMinutes() + 5);
    var A = { time: pad(now0.getHours()) + ':' + pad(now0.getMinutes()), on: false, sound: 'beep', label: '' }, fired = false, loop = null;
    var clock = el('<div class="big-time"></div>');
    var tf = el('<label class="f"><span>' + esc(t('alarm_time')) + '</span><input class="inp" type="time" style="height:58px;font-size:24px;font-weight:700"></label>'); tf.querySelector('input').value = A.time;
    tf.querySelector('input').oninput = function (e) { A.time = e.target.value; fired = false; status(); };
    var g2 = el('<div class="fields"></div>');
    g2.append(tf, K.sel(t('sound'), [['beep', t('sound_beep')], ['chime', t('sound_chime')], ['siren', t('sound_siren')]], 'beep', function (v) { A.sound = v; }), K.field(t('label'), '', function (v) { A.label = v; }, { text: true, ph: t('wake_up') }));
    var setB = K.btn('bell', t('set_alarm'), 'big', function () { audio(); askNotify(); A.on = !A.on; fired = false; status(); });
    var test = K.btn('volume', t('test_sound'), 'sec', function () { ring(1); });
    var stopB = K.btn('stop', t('stop'), 'big', function () { clearInterval(loop); loop = null; stopB.classList.add('hide'); A.on = false; status(); }); stopB.classList.add('hide'); stopB.style.background = 'var(--err)';
    var st = el('<div class="result" style="margin-top:16px"><div class="sub"></div></div>');
    var r2 = el('<div class="row" style="justify-content:center;margin-top:16px"></div>'); r2.append(test, setB, stopB);
    root.append(clock, g2, r2, st, el('<p class="muted" style="text-align:center">' + esc(t('alarm_tip')) + '</p>'));
    function ring(once) {
      var a = audio(), n = a.currentTime;
      if (A.sound === 'chime') chime(); else if (A.sound === 'siren') { var os = a.createOscillator(), g = a.createGain(); os.type = 'sawtooth'; os.frequency.setValueAtTime(600, n); os.frequency.linearRampToValueAtTime(1200, n + .5); os.frequency.linearRampToValueAtTime(600, n + 1); g.gain.value = .15; os.connect(g).connect(a.destination); os.start(n); os.stop(n + 1); }
      else for (var i = 0; i < 4; i++) beep(1000, .12, n + i * .2, .4);
    }
    function status() {
      setB.querySelector('span').textContent = A.on ? t('cancel_alarm') : t('set_alarm');
      if (!A.on) { st.querySelector('.sub').textContent = t('alarm_off'); st.classList.remove('on'); return; }
      var now = new Date(), p = A.time.split(':'), d = new Date(); d.setHours(+p[0], +p[1], 0, 0); if (d <= now) d.setDate(d.getDate() + 1);
      var m = Math.round((d - now) / 60000);
      st.querySelector('.sub').innerHTML = '🔔 <b>' + esc(A.time) + '</b> · ' + esc(t('rings_in', { h: Math.floor(m / 60), m: m % 60 }));
    }
    setInterval(function () {
      var n = new Date(); clock.textContent = n.toLocaleTimeString(K.lang, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (A.on && !fired && pad(n.getHours()) + ':' + pad(n.getMinutes()) === A.time) {
        fired = true; ring(); loop = setInterval(ring, 1500); stopB.classList.remove('hide');
        st.querySelector('.sub').innerHTML = '⏰ <b>' + esc(A.label || t('wake_up')) + '</b>'; notify(A.label || t('wake_up'));
      }
      if (A.on && !fired && n.getSeconds() === 0) status();
    }, 500);
    status();
  }

  else if (mode === 'metronome') {
    var M = { bpm: 100, beats: 4, on: false, sub: 1 }, nextT = 0, beat = 0, sched = null, taps = [];
    var bpmEl = el('<div class="big-time" style="margin:8px 0 0">100</div>');
    var lbl2 = el('<p class="muted" style="text-align:center;margin:0 0 10px">BPM</p>');
    var dots = el('<div class="beats"></div>');
    var slider = K.rng(t('tempo'), 30, 260, M.bpm, ' BPM', function (v) { M.bpm = v; bpmEl.textContent = v; });
    var minus = K.btn('', '−', 'sec', function () { setBpm(M.bpm - 1); }), plus = K.btn('', '+', 'sec', function () { setBpm(M.bpm + 1); });
    var play = K.btn('play', t('start'), 'big', toggle), tap = K.btn('pointer', t('tap_tempo'), 'sec', function () { var n = performance.now(); taps = taps.filter(function (x) { return n - x < 2500; }); taps.push(n); if (taps.length > 1) { var avg = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); setBpm(Math.round(60000 / avg)); } });
    var r3 = el('<div class="row" style="justify-content:center;margin:14px 0"></div>'); r3.append(minus, play, plus, tap);
    var g3 = el('<div class="fields"></div>'); g3.append(K.sel(t('time_signature'), [[2, '2/4'], [3, '3/4'], [4, '4/4'], [5, '5/4'], [6, '6/8'], [7, '7/8']], 4, function (v) { M.beats = +v; beat = 0; drawDots(); }), K.sel(t('subdivision'), [[1, '♩'], [2, '♫ ×2'], [3, '×3'], [4, '♬ ×4']], 1, function (v) { M.sub = +v; }));
    root.append(bpmEl, lbl2, dots, slider, r3, g3);
    function setBpm(v) { M.bpm = Math.min(260, Math.max(30, v)); bpmEl.textContent = M.bpm; slider.set(M.bpm); }
    function drawDots() { dots.innerHTML = ''; for (var i = 0; i < M.beats; i++) dots.appendChild(el('<i></i>')); }
    function tick(time, b, s) {
      var a = audio(), os = a.createOscillator(), g = a.createGain(); os.frequency.value = s ? 600 : b === 0 ? 1500 : 1000;
      g.gain.setValueAtTime(s ? .25 : .5, time); g.gain.exponentialRampToValueAtTime(.001, time + .05); os.connect(g).connect(a.destination); os.start(time); os.stop(time + .06);
      if (!s) setTimeout(function () { K.$$('i', dots).forEach(function (d, i) { d.classList.toggle('on', i === b); d.classList.toggle('acc', i === 0 && b === 0); }); }, Math.max(0, (time - a.currentTime) * 1000));
    }
    var subI = 0;
    function scheduler() {
      var a = audio();
      while (nextT < a.currentTime + .12) { tick(nextT, beat, subI !== 0); subI++; if (subI >= M.sub) { subI = 0; beat = (beat + 1) % M.beats; } nextT += 60 / M.bpm / M.sub; }
    }
    function toggle() {
      M.on = !M.on;
      if (M.on) { var a = audio(); beat = 0; subI = 0; nextT = a.currentTime + .06; sched = setInterval(scheduler, 25); play.querySelector('span').textContent = t('stop'); play.firstChild.outerHTML = svg('stop'); }
      else { clearInterval(sched); play.querySelector('span').textContent = t('start'); play.firstChild.outerHTML = svg('play'); K.$$('i', dots).forEach(function (d) { d.className = ''; }); }
    }
    document.addEventListener('keydown', function (e) { if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)) { e.preventDefault(); toggle(); } });
    drawDots();
  }
});
