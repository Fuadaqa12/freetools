// Toolora Telegram bot — Cloudflare Worker (free plan).
// Secrets (Cloudflare → Worker → Settings → Variables and Secrets):
//   BOT_TOKEN       — token from @BotFather
//   WEBHOOK_SECRET  — any random string, protects the webhook and /setup
// After deploying, open once:  https://<your-worker>.workers.dev/setup?key=<WEBHOOK_SECRET>

const SITE = 'https://toolorakit.com/';
const SITE_LANGS = ['en', 'ru', 'es', 'pt', 'fr', 'de', 'tr', 'az', 'ar', 'hi', 'it', 'pl'];

const T = {
  en: {
    hi: n => `👋 Hi${n ? ', ' + n : ''}! I'm <b>Toolora</b> — 120+ free tools right inside Telegram.\n\n🪄 Remove background · 📝 Text from photo · 🔍 Upscale photos with AI\n🗜 Compress images & PDF · 🔄 Convert files · 🧮 Calculators\n\n📎 <b>Send me a photo or a PDF</b> and I'll show what I can do with it, or pick a tool below.\nEverything runs on your device — files are never uploaded.`,
    all: '🧰 All tools', ai: '✨ AI tools', photo: '📷 What should I do with this photo?', pdf: '📄 What should I do with this PDF?', file: '📎 Pick a tool for your file:',
    reopen: 'Tip: the tool opens inside Telegram — choose the same file there once more.', help: 'Send a photo or a PDF, or use the buttons below. /tools — all tools, /ai — AI tools, /lang — change language.',
    langPick: '🌐 Choose language:', langSet: '✅ Language changed.', site: '🌐 Open website',
    cmd: { start: 'Start', tools: 'All tools', ai: 'AI tools', lang: 'Language', help: 'Help' },
    t: { 'remove-background': '🪄 Remove background', 'image-to-text': '📝 Text from photo', 'upscale-image': '🔍 Upscale 2×–4×', 'passport-photo-maker': '🪪 Passport photo', 'blur-background': '💧 Blur background', 'compress-image': '🗜 Compress', 'image-converter': '🔄 Convert', 'crop-image': '✂️ Crop', 'resize-image': '📐 Resize', 'jpg-to-pdf': '📄 To PDF', 'compress-pdf': '🗜 Compress PDF', 'pdf-to-jpg': '🖼 PDF to JPG', 'pdf-to-text': '📝 PDF to text', 'merge-pdf': '➕ Merge PDF', 'split-pdf': '✂️ Split PDF', 'organize-pdf': '🔀 Reorder pages', 'qr-code-generator': '🔳 QR code', 'password-generator': '🔐 Password', 'currency-converter': '💱 Currency', 'word-counter': '🔤 Word counter' },
  },
  ru: {
    hi: n => `👋 Привет${n ? ', ' + n : ''}! Я <b>Toolora</b> — 120+ бесплатных инструментов прямо в Telegram.\n\n🪄 Удалить фон · 📝 Текст с фото · 🔍 Увеличить фото с ИИ\n🗜 Сжать фото и PDF · 🔄 Конвертировать файлы · 🧮 Калькуляторы\n\n📎 <b>Пришли мне фото или PDF</b> — покажу, что с ним можно сделать. Или выбери инструмент ниже.\nВсё работает на твоём устройстве — файлы никуда не загружаются.`,
    all: '🧰 Все инструменты', ai: '✨ ИИ-инструменты', photo: '📷 Что сделать с этим фото?', pdf: '📄 Что сделать с этим PDF?', file: '📎 Выбери инструмент для файла:',
    reopen: 'Подсказка: инструмент откроется внутри Telegram — выбери там этот же файл ещё раз.', help: 'Пришли фото или PDF, либо жми кнопки ниже. /tools — все инструменты, /ai — ИИ-инструменты, /lang — язык.',
    langPick: '🌐 Выбери язык:', langSet: '✅ Язык изменён.', site: '🌐 Открыть сайт',
    cmd: { start: 'Начать', tools: 'Все инструменты', ai: 'ИИ-инструменты', lang: 'Язык', help: 'Помощь' },
    t: { 'remove-background': '🪄 Удалить фон', 'image-to-text': '📝 Текст с фото', 'upscale-image': '🔍 Увеличить 2×–4×', 'passport-photo-maker': '🪪 Фото на документы', 'blur-background': '💧 Размыть фон', 'compress-image': '🗜 Сжать', 'image-converter': '🔄 Конвертировать', 'crop-image': '✂️ Обрезать', 'resize-image': '📐 Изменить размер', 'jpg-to-pdf': '📄 В PDF', 'compress-pdf': '🗜 Сжать PDF', 'pdf-to-jpg': '🖼 PDF в JPG', 'pdf-to-text': '📝 PDF в текст', 'merge-pdf': '➕ Объединить PDF', 'split-pdf': '✂️ Разделить PDF', 'organize-pdf': '🔀 Порядок страниц', 'qr-code-generator': '🔳 QR-код', 'password-generator': '🔐 Пароль', 'currency-converter': '💱 Валюты', 'word-counter': '🔤 Счётчик слов' },
  },
  az: {
    hi: n => `👋 Salam${n ? ', ' + n : ''}! Mən <b>Toolora</b>-yam — Telegram-da 120+ pulsuz alət.\n\n🪄 Fonu sil · 📝 Şəkildən mətn · 🔍 Sİ ilə şəkli böyüt\n🗜 Şəkil və PDF sıxışdır · 🔄 Faylları çevir · 🧮 Kalkulyatorlar\n\n📎 <b>Mənə şəkil və ya PDF göndər</b> — nə edə biləcəyimi göstərim. Və ya aşağıdan alət seç.\nHər şey cihazında işləyir — fayllar heç yerə yüklənmir.`,
    all: '🧰 Bütün alətlər', ai: '✨ Sİ alətləri', photo: '📷 Bu şəkillə nə edək?', pdf: '📄 Bu PDF ilə nə edək?', file: '📎 Fayl üçün alət seç:',
    reopen: 'Məsləhət: alət Telegram daxilində açılacaq — orada eyni faylı bir daha seç.', help: 'Şəkil və ya PDF göndər, ya da düymələrdən istifadə et. /tools — bütün alətlər, /ai — Sİ alətləri, /lang — dil.',
    langPick: '🌐 Dili seç:', langSet: '✅ Dil dəyişdi.', site: '🌐 Sayta keç',
    cmd: { start: 'Başla', tools: 'Bütün alətlər', ai: 'Sİ alətləri', lang: 'Dil', help: 'Kömək' },
    t: { 'remove-background': '🪄 Fonu sil', 'image-to-text': '📝 Şəkildən mətn', 'upscale-image': '🔍 Böyüt 2×–4×', 'passport-photo-maker': '🪪 Sənəd fotosu', 'blur-background': '💧 Fonu bulanıqlaşdır', 'compress-image': '🗜 Sıxışdır', 'image-converter': '🔄 Çevir', 'crop-image': '✂️ Kəs', 'resize-image': '📐 Ölçünü dəyiş', 'jpg-to-pdf': '📄 PDF-ə', 'compress-pdf': '🗜 PDF sıxışdır', 'pdf-to-jpg': '🖼 PDF-dən JPG', 'pdf-to-text': '📝 PDF-dən mətn', 'merge-pdf': '➕ PDF birləşdir', 'split-pdf': '✂️ PDF böl', 'organize-pdf': '🔀 Səhifə sırası', 'qr-code-generator': '🔳 QR kod', 'password-generator': '🔐 Parol', 'currency-converter': '💱 Valyuta', 'word-counter': '🔤 Söz sayğacı' },
  },
  tr: {
    hi: n => `👋 Merhaba${n ? ', ' + n : ''}! Ben <b>Toolora</b> — Telegram içinde 120+ ücretsiz araç.\n\n🪄 Arka planı sil · 📝 Fotoğraftan metin · 🔍 YZ ile fotoğraf büyüt\n🗜 Fotoğraf ve PDF sıkıştır · 🔄 Dosya dönüştür · 🧮 Hesaplayıcılar\n\n📎 <b>Bana bir fotoğraf veya PDF gönder</b>, neler yapabileceğimi göstereyim. Ya da aşağıdan bir araç seç.\nHer şey cihazında çalışır — dosyalar asla yüklenmez.`,
    all: '🧰 Tüm araçlar', ai: '✨ YZ araçları', photo: '📷 Bu fotoğrafla ne yapalım?', pdf: '📄 Bu PDF ile ne yapalım?', file: '📎 Dosyan için bir araç seç:',
    reopen: 'İpucu: araç Telegram içinde açılır — aynı dosyayı orada bir kez daha seç.', help: 'Fotoğraf veya PDF gönder ya da aşağıdaki düğmeleri kullan. /tools — tüm araçlar, /ai — YZ araçları, /lang — dil.',
    langPick: '🌐 Dil seç:', langSet: '✅ Dil değiştirildi.', site: '🌐 Siteyi aç',
    cmd: { start: 'Başla', tools: 'Tüm araçlar', ai: 'YZ araçları', lang: 'Dil', help: 'Yardım' },
    t: { 'remove-background': '🪄 Arka planı sil', 'image-to-text': '📝 Fotoğraftan metin', 'upscale-image': '🔍 Büyüt 2×–4×', 'passport-photo-maker': '🪪 Vesikalık', 'blur-background': '💧 Arka planı bulanıklaştır', 'compress-image': '🗜 Sıkıştır', 'image-converter': '🔄 Dönüştür', 'crop-image': '✂️ Kırp', 'resize-image': '📐 Boyutlandır', 'jpg-to-pdf': '📄 PDF’e', 'compress-pdf': '🗜 PDF sıkıştır', 'pdf-to-jpg': '🖼 PDF’den JPG', 'pdf-to-text': '📝 PDF’den metin', 'merge-pdf': '➕ PDF birleştir', 'split-pdf': '✂️ PDF böl', 'organize-pdf': '🔀 Sayfa sırası', 'qr-code-generator': '🔳 QR kod', 'password-generator': '🔐 Şifre', 'currency-converter': '💱 Döviz', 'word-counter': '🔤 Kelime sayacı' },
  },
  es: {
    hi: n => `👋 ¡Hola${n ? ', ' + n : ''}! Soy <b>Toolora</b>: más de 120 herramientas gratis dentro de Telegram.\n\n🪄 Quitar fondo · 📝 Texto de una foto · 🔍 Ampliar fotos con IA\n🗜 Comprimir imágenes y PDF · 🔄 Convertir archivos · 🧮 Calculadoras\n\n📎 <b>Envíame una foto o un PDF</b> y te muestro qué puedo hacer, o elige una herramienta abajo.\nTodo funciona en tu dispositivo: los archivos nunca se suben.`,
    all: '🧰 Todas las herramientas', ai: '✨ Herramientas IA', photo: '📷 ¿Qué hago con esta foto?', pdf: '📄 ¿Qué hago con este PDF?', file: '📎 Elige una herramienta para tu archivo:',
    reopen: 'Consejo: la herramienta se abre dentro de Telegram; elige allí el mismo archivo otra vez.', help: 'Envía una foto o un PDF, o usa los botones. /tools — todas, /ai — IA, /lang — idioma.',
    langPick: '🌐 Elige idioma:', langSet: '✅ Idioma cambiado.', site: '🌐 Abrir la web',
    cmd: { start: 'Inicio', tools: 'Todas las herramientas', ai: 'Herramientas IA', lang: 'Idioma', help: 'Ayuda' },
    t: { 'remove-background': '🪄 Quitar fondo', 'image-to-text': '📝 Texto de foto', 'upscale-image': '🔍 Ampliar 2×–4×', 'passport-photo-maker': '🪪 Foto carnet', 'blur-background': '💧 Desenfocar fondo', 'compress-image': '🗜 Comprimir', 'image-converter': '🔄 Convertir', 'crop-image': '✂️ Recortar', 'resize-image': '📐 Redimensionar', 'jpg-to-pdf': '📄 A PDF', 'compress-pdf': '🗜 Comprimir PDF', 'pdf-to-jpg': '🖼 PDF a JPG', 'pdf-to-text': '📝 PDF a texto', 'merge-pdf': '➕ Unir PDF', 'split-pdf': '✂️ Dividir PDF', 'organize-pdf': '🔀 Ordenar páginas', 'qr-code-generator': '🔳 Código QR', 'password-generator': '🔐 Contraseña', 'currency-converter': '💱 Divisas', 'word-counter': '🔤 Contador de palabras' },
  },
};
const LANG_NAMES = [['en', 'English'], ['ru', 'Русский'], ['az', 'Azərbaycan'], ['tr', 'Türkçe'], ['es', 'Español']];

const AI = ['remove-background', 'image-to-text', 'upscale-image', 'passport-photo-maker', 'blur-background'];
const PHOTO = ['remove-background', 'image-to-text', 'upscale-image', 'passport-photo-maker', 'blur-background', 'compress-image', 'image-converter', 'crop-image', 'resize-image', 'jpg-to-pdf'];
const PDF = ['compress-pdf', 'pdf-to-jpg', 'pdf-to-text', 'merge-pdf', 'split-pdf', 'organize-pdf'];
const POPULAR = ['remove-background', 'image-to-text', 'upscale-image', 'passport-photo-maker', 'compress-image', 'compress-pdf', 'merge-pdf', 'qr-code-generator', 'currency-converter', 'password-generator'];

const pageUrl = (l, id = '') => SITE + (SITE_LANGS.includes(l) && l !== 'en' ? l + '/' : '') + (id ? id + '/' : '');
const pick = code => { const c = (code || 'en').slice(0, 2).toLowerCase(); return T[c] ? c : 'en'; };
const tr = l => T[l] || T.en;

function grid(l, ids, cols = 2) {
  const rows = [];
  ids.forEach((id, i) => { if (i % cols === 0) rows.push([]); rows[rows.length - 1].push({ text: tr(l).t[id] || T.en.t[id] || id, web_app: { url: pageUrl(l, id) } }); });
  return rows;
}
const homeKb = l => ({ inline_keyboard: [...grid(l, POPULAR), [{ text: tr(l).all, web_app: { url: pageUrl(l) } }], [{ text: tr(l).site, url: pageUrl(l) }]] });

async function api(env, method, body) {
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}
async function getLang(env, from) {
  if (env.KV) { const s = await env.KV.get('lang:' + from.id); if (s) return s; }
  return pick(from.language_code);
}

async function onMessage(env, m) {
  const chat = m.chat.id, l = await getLang(env, m.from || {}), L = tr(l), text = (m.text || '').trim();
  const send = (t, kb) => api(env, 'sendMessage', { chat_id: chat, text: t, parse_mode: 'HTML', reply_markup: kb, disable_web_page_preview: true });
  if (/^\/start/.test(text)) return send(L.hi(m.from && m.from.first_name), homeKb(l));
  if (/^\/(tools|all)/.test(text)) return send(L.all, homeKb(l));
  if (/^\/ai/.test(text)) return send(L.ai, { inline_keyboard: grid(l, AI, 1) });
  if (/^\/lang/.test(text)) return send(L.langPick, { inline_keyboard: [LANG_NAMES.map(([c, n]) => ({ text: n, callback_data: 'lang:' + c }))] });
  const doc = m.document, mime = doc && doc.mime_type || '';
  if (m.photo || /^image\//.test(mime)) return send(L.photo + '\n\n<i>' + L.reopen + '</i>', { inline_keyboard: grid(l, PHOTO) });
  if (/pdf$/.test(mime) || (doc && /\.pdf$/i.test(doc.file_name || ''))) return send(L.pdf + '\n\n<i>' + L.reopen + '</i>', { inline_keyboard: grid(l, PDF) });
  if (doc) return send(L.file, homeKb(l));
  return send(L.help, homeKb(l));
}

async function onCallback(env, q) {
  const [k, v] = (q.data || '').split(':');
  if (k === 'lang' && T[v]) {
    if (env.KV) await env.KV.put('lang:' + q.from.id, v);
    await api(env, 'answerCallbackQuery', { callback_query_id: q.id, text: T[v].langSet });
    return api(env, 'sendMessage', { chat_id: q.message.chat.id, text: T[v].hi(q.from.first_name), parse_mode: 'HTML', reply_markup: homeKb(v) });
  }
  return api(env, 'answerCallbackQuery', { callback_query_id: q.id });
}

async function setup(env, origin) {
  const out = {};
  out.webhook = await api(env, 'setWebhook', { url: origin + '/webhook', secret_token: env.WEBHOOK_SECRET, allowed_updates: ['message', 'callback_query'], drop_pending_updates: true });
  for (const l of Object.keys(T)) {
    const c = T[l].cmd, commands = Object.entries(c).map(([command, description]) => ({ command, description }));
    out['cmd_' + l] = await api(env, 'setMyCommands', l === 'en' ? { commands } : { commands, language_code: l });
  }
  out.menu = await api(env, 'setChatMenuButton', { menu_button: { type: 'web_app', text: 'Toolora', web_app: { url: SITE } } });
  return out;
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname === '/setup') {
      if (!env.WEBHOOK_SECRET || u.searchParams.get('key') !== env.WEBHOOK_SECRET) return new Response('forbidden', { status: 403 });
      return Response.json(await setup(env, u.origin));
    }
    if (u.pathname === '/webhook' && req.method === 'POST') {
      if (req.headers.get('x-telegram-bot-api-secret-token') !== env.WEBHOOK_SECRET) return new Response('forbidden', { status: 403 });
      const up = await req.json();
      try { if (up.message) await onMessage(env, up.message); else if (up.callback_query) await onCallback(env, up.callback_query); } catch (e) { console.log(e && e.stack); }
      return new Response('ok');
    }
    return Response.redirect(SITE, 302);
  },
};
