/* AI tools that run fully in the browser: OCR (tesseract.js), more modes added below */
TK.register('ai', function (root, o, K) {
  var t = K.t, el = K.el, esc = K.esc, svg = K.svg;
  var V = new URL(K.root + 'assets/vendor/', location.href).href;

  function progress() {
    var w = el('<div class="stack hide" style="gap:8px;padding:18px 0"><div class="row" style="justify-content:space-between"><span class="muted pl"></span><b class="pv">0%</b></div><div style="height:8px;border-radius:99px;background:var(--line);overflow:hidden"><div class="pb" style="height:100%;width:0;background:linear-gradient(90deg,#5b4cf5,#ec4899);transition:width .2s"></div></div></div>');
    w.set = function (label, p) { w.classList.remove('hide'); w.querySelector('.pl').textContent = label; var v = Math.max(0, Math.min(100, Math.round(p * 100))); w.querySelector('.pv').textContent = v + '%'; w.querySelector('.pb').style.width = v + '%'; };
    w.hide = function () { w.classList.add('hide'); };
    return w;
  }

  ({ ocr: ocr })[o.mode]();

  /* ---------- OCR ---------- */
  function ocr() {
    var LANGS = [['eng', 'English'], ['rus', 'Русский'], ['spa', 'Español'], ['por', 'Português'], ['fra', 'Français'], ['deu', 'Deutsch'], ['tur', 'Türkçe'], ['aze', 'Azərbaycan'], ['ara', 'العربية'], ['hin', 'हिन्दी'], ['ita', 'Italiano'], ['pol', 'Polski'], ['ukr', 'Українська'], ['nld', 'Nederlands'], ['ind', 'Indonesia'], ['vie', 'Tiếng Việt'], ['kaz', 'Қазақ'], ['jpn', '日本語'], ['chi_sim', '中文 (简体)'], ['chi_tra', '中文 (繁體)'], ['kor', '한국어']];
    var MAP = { en: 'eng', ru: 'rus', es: 'spa', pt: 'por', fr: 'fra', de: 'deu', tr: 'tur', az: 'aze', ar: 'ara', hi: 'hin', it: 'ita', pl: 'pol', uk: 'ukr', nl: 'nld', id: 'ind', vi: 'vie', kk: 'kaz', ja: 'jpn', zh: 'chi_sim', ko: 'kor' };
    var LOCAL = { eng: 1, rus: 1 };
    var lang = MAP[K.lang] || 'eng', worker = null, wLang = null, file = null;
    var dz = K.dropzone({ accept: 'image/*', hint: t('drop_hint_img'), paste: true, onFiles: function (f) { load(f[0]); } });
    var top = el('<div class="panel stack"></div>');
    top.append(K.sel(t('ocr_lang'), LANGS, lang, function (v) { lang = v; if (file) run(); }));
    top.append(el('<p class="muted" style="margin:0;font-size:13px">' + esc(t('ai_local_note')) + '</p>'));
    var prog = progress();
    var view = el('<div class="stack hide"></div>');
    var prev = el('<img alt="" style="max-width:100%;max-height:320px;border-radius:12px;object-fit:contain;align-self:center;background:var(--soft)">');
    var out = el('<textarea class="inp" rows="12" dir="auto" style="width:100%"></textarea>');
    var bar = el('<div class="row end"></div>');
    bar.append(
      K.btn('copy', t('copy'), 'sec', function () { K.copy(out.value); }),
      K.btn('download', t('download') + ' TXT', '', function () { K.download(new Blob([out.value], { type: 'text/plain;charset=utf-8' }), K.baseName(file ? file.name : 'text') + '.txt'); }),
      K.btn('upload', t('start_over'), 'sec', function () { file = null; view.classList.add('hide'); dz.classList.remove('hide'); })
    );
    view.append(prev, el('<b>' + esc(t('result')) + '</b>'), out, bar);
    root.append(top, dz, prog, view);

    function load(f) {
      if (!/^image\//.test(f.type)) { K.toast(t('cannot_read')); return; }
      file = f; prev.src = URL.createObjectURL(f); dz.classList.add('hide'); run();
    }
    function getWorker() {
      if (worker && wLang === lang) return Promise.resolve(worker);
      var old = worker; worker = null; if (old) old.terminate();
      var lp = LOCAL[lang] ? V + 'ocr/lang' : 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/' + lang + '/4.0.0_best_int';
      return Tesseract.createWorker(lang === 'eng' ? 'eng' : lang + '+eng', 1, {
        workerPath: V + 'ocr/worker.min.js', corePath: V + 'ocr/', langPath: lp, workerBlobURL: false,
        logger: function (m) { if (m.status === 'recognizing text') prog.set(t('ocr_reading'), m.progress); else prog.set(t('ai_loading_model'), m.progress || 0); }
      }).then(function (w) { worker = w; wLang = lang; return w; });
    }
    function run() {
      view.classList.add('hide'); prog.set(t('ai_loading_model'), 0);
      getWorker().then(function (w) { return w.recognize(file); }).then(function (r) {
        prog.hide(); out.value = (r.data.text || '').trim();
        if (!out.value) out.value = t('ocr_nothing');
        view.classList.remove('hide');
      }).catch(function (e) { console.error(e); prog.hide(); K.toast(t('error')); dz.classList.remove('hide'); });
    }
  }
});
