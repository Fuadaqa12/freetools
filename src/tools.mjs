// Categories and tools. Names/descriptions live in src/i18n/<lang>.mjs under tools[id] = [name, description, keywords]
export const CATS = [
  { id: 'ai', icon: 'zap', color: '#7c3aed' },
  { id: 'image', icon: 'image', color: '#f97316' },
  { id: 'pdf', icon: 'file', color: '#ef4444' },
  { id: 'text', icon: 'type', color: '#10b981' },
  { id: 'calc', icon: 'calc', color: '#f59e0b' },
  { id: 'convert', icon: 'ruler', color: '#06b6d4' },
  { id: 'dev', icon: 'code', color: '#6366f1' },
  { id: 'gen', icon: 'sparkles', color: '#ec4899' },
  { id: 'time', icon: 'clock', color: '#8b5cf6' },
  { id: 'media', icon: 'video', color: '#14b8a6' },
  { id: 'test', icon: 'test', color: '#0ea5e9' },
];

// kind: file | text | calc | gen  (used for generic how-to and FAQ text)
export const TOOLS = [
  // image
  { id: 'compress-image', cat: 'image', icon: 'compress', engine: 'image', opts: { mode: 'compress' }, kind: 'file', pop: 1 },
  { id: 'resize-image', cat: 'image', icon: 'resize', engine: 'image', opts: { mode: 'resize' }, kind: 'file', pop: 1 },
  { id: 'jpg-to-png', cat: 'image', icon: 'convert', engine: 'image', opts: { mode: 'convert', to: 'image/png' }, kind: 'file' },
  { id: 'png-to-jpg', cat: 'image', icon: 'convert', engine: 'image', opts: { mode: 'convert', to: 'image/jpeg' }, kind: 'file', pop: 1 },
  { id: 'webp-to-jpg', cat: 'image', icon: 'convert', engine: 'image', opts: { mode: 'convert', to: 'image/jpeg' }, kind: 'file' },
  { id: 'image-to-webp', cat: 'image', icon: 'convert', engine: 'image', opts: { mode: 'convert', to: 'image/webp' }, kind: 'file' },
  { id: 'image-converter', cat: 'image', icon: 'convert', engine: 'image', opts: { mode: 'convert', to: 'image/png' }, kind: 'file' },
  { id: 'rotate-image', cat: 'image', icon: 'rotate', engine: 'image', opts: { mode: 'rotate' }, kind: 'file' },
  { id: 'photo-filters', cat: 'image', icon: 'sliders', engine: 'image', opts: { mode: 'filter' }, kind: 'file' },
  { id: 'image-to-base64', cat: 'image', icon: 'binary', engine: 'image', opts: { mode: 'base64' }, kind: 'file' },
  // pdf
  { id: 'merge-pdf', cat: 'pdf', icon: 'layers', engine: 'pdf', opts: { mode: 'merge' }, kind: 'file', pop: 1, vendor: ['pdf-lib.min.js'] },
  { id: 'split-pdf', cat: 'pdf', icon: 'scissors', engine: 'pdf', opts: { mode: 'split' }, kind: 'file', vendor: ['pdf-lib.min.js'] },
  { id: 'jpg-to-pdf', cat: 'pdf', icon: 'image', engine: 'pdf', opts: { mode: 'images' }, kind: 'file', pop: 1, vendor: ['pdf-lib.min.js'] },
  { id: 'rotate-pdf', cat: 'pdf', icon: 'rotate', engine: 'pdf', opts: { mode: 'rotate' }, kind: 'file', vendor: ['pdf-lib.min.js'] },
  { id: 'delete-pdf-pages', cat: 'pdf', icon: 'trash', engine: 'pdf', opts: { mode: 'delete' }, kind: 'file', vendor: ['pdf-lib.min.js'] },
  // text
  { id: 'word-counter', cat: 'text', icon: 'hash', engine: 'text', opts: { mode: 'counter' }, kind: 'text', pop: 1 },
  { id: 'case-converter', cat: 'text', icon: 'case', engine: 'text', opts: { mode: 'case' }, kind: 'text' },
  { id: 'remove-duplicate-lines', cat: 'text', icon: 'list', engine: 'text', opts: { mode: 'dedupe' }, kind: 'text' },
  { id: 'sort-lines', cat: 'text', icon: 'sort', engine: 'text', opts: { mode: 'sort' }, kind: 'text' },
  { id: 'find-and-replace', cat: 'text', icon: 'search', engine: 'text', opts: { mode: 'replace' }, kind: 'text' },
  { id: 'remove-extra-spaces', cat: 'text', icon: 'eraser', engine: 'text', opts: { mode: 'clean' }, kind: 'text' },
  { id: 'text-to-speech', cat: 'text', icon: 'volume', engine: 'text', opts: { mode: 'tts' }, kind: 'text', pop: 1 },
  { id: 'reverse-text', cat: 'text', icon: 'undo', engine: 'text', opts: { mode: 'reverse' }, kind: 'text' },
  { id: 'slug-generator', cat: 'text', icon: 'link', engine: 'text', opts: { mode: 'slug' }, kind: 'text' },
  // calculators
  { id: 'percentage-calculator', cat: 'calc', icon: 'percent', engine: 'calc', opts: { mode: 'percent' }, kind: 'calc', pop: 1 },
  { id: 'bmi-calculator', cat: 'calc', icon: 'heart', engine: 'calc', opts: { mode: 'bmi' }, kind: 'calc', pop: 1 },
  { id: 'age-calculator', cat: 'calc', icon: 'cake', engine: 'calc', opts: { mode: 'age' }, kind: 'calc', pop: 1 },
  { id: 'loan-calculator', cat: 'calc', icon: 'bank', engine: 'calc', opts: { mode: 'loan' }, kind: 'calc', pop: 1 },
  { id: 'compound-interest-calculator', cat: 'calc', icon: 'trend', engine: 'calc', opts: { mode: 'compound' }, kind: 'calc' },
  { id: 'discount-calculator', cat: 'calc', icon: 'tag', engine: 'calc', opts: { mode: 'discount' }, kind: 'calc' },
  { id: 'tip-calculator', cat: 'calc', icon: 'receipt', engine: 'calc', opts: { mode: 'tip' }, kind: 'calc' },
  { id: 'calorie-calculator', cat: 'calc', icon: 'flame', engine: 'calc', opts: { mode: 'calorie' }, kind: 'calc' },
  { id: 'date-difference-calculator', cat: 'calc', icon: 'calendar', engine: 'calc', opts: { mode: 'datediff' }, kind: 'calc' },
  { id: 'average-calculator', cat: 'calc', icon: 'sigma', engine: 'calc', opts: { mode: 'average' }, kind: 'calc' },
  // converters
  { id: 'length-converter', cat: 'convert', icon: 'ruler', engine: 'unit', opts: { cat: 'length' }, kind: 'calc' },
  { id: 'weight-converter', cat: 'convert', icon: 'scale', engine: 'unit', opts: { cat: 'weight' }, kind: 'calc' },
  { id: 'temperature-converter', cat: 'convert', icon: 'thermo', engine: 'unit', opts: { cat: 'temperature' }, kind: 'calc' },
  { id: 'area-converter', cat: 'convert', icon: 'grid', engine: 'unit', opts: { cat: 'area' }, kind: 'calc' },
  { id: 'volume-converter', cat: 'convert', icon: 'beaker', engine: 'unit', opts: { cat: 'volume' }, kind: 'calc' },
  { id: 'speed-converter', cat: 'convert', icon: 'gauge', engine: 'unit', opts: { cat: 'speed' }, kind: 'calc' },
  { id: 'data-size-converter', cat: 'convert', icon: 'db', engine: 'unit', opts: { cat: 'data' }, kind: 'calc' },
  { id: 'color-converter', cat: 'convert', icon: 'palette', engine: 'dev', opts: { mode: 'color' }, kind: 'calc' },
  { id: 'timestamp-converter', cat: 'convert', icon: 'clock', engine: 'dev', opts: { mode: 'timestamp' }, kind: 'calc' },
  // developer
  { id: 'json-formatter', cat: 'dev', icon: 'braces', engine: 'dev', opts: { mode: 'json' }, kind: 'text', pop: 1 },
  { id: 'base64-encode-decode', cat: 'dev', icon: 'binary', engine: 'dev', opts: { mode: 'base64' }, kind: 'text' },
  { id: 'url-encode-decode', cat: 'dev', icon: 'link', engine: 'dev', opts: { mode: 'url' }, kind: 'text' },
  { id: 'hash-generator', cat: 'dev', icon: 'key', engine: 'dev', opts: { mode: 'hash' }, kind: 'text' },
  { id: 'uuid-generator', cat: 'dev', icon: 'id', engine: 'dev', opts: { mode: 'uuid' }, kind: 'gen' },
  // generators
  { id: 'password-generator', cat: 'gen', icon: 'lock', engine: 'dev', opts: { mode: 'password' }, kind: 'gen', pop: 1 },
  { id: 'qr-code-generator', cat: 'gen', icon: 'qr', engine: 'dev', opts: { mode: 'qr' }, kind: 'gen', pop: 1, vendor: ['qrcode.js'] },
  { id: 'random-number-generator', cat: 'gen', icon: 'dice', engine: 'calc', opts: { mode: 'random' }, kind: 'gen' },
  { id: 'spin-the-wheel', cat: 'gen', icon: 'wheel', engine: 'wheel', opts: {}, kind: 'gen', pop: 1 },
  { id: 'coin-flip', cat: 'gen', icon: 'coin', engine: 'calc', opts: { mode: 'random', sub: 'coin' }, kind: 'gen' },
  { id: 'lorem-ipsum-generator', cat: 'gen', icon: 'align', engine: 'text', opts: { mode: 'lorem' }, kind: 'gen' },
  // time
  { id: 'online-stopwatch', cat: 'time', icon: 'timer', engine: 'time', opts: { mode: 'stopwatch' }, kind: 'gen', pop: 1 },
  { id: 'countdown-timer', cat: 'time', icon: 'hourglass', engine: 'time', opts: { mode: 'timer' }, kind: 'gen' },
  // media
  { id: 'screen-recorder', cat: 'media', icon: 'monitor', engine: 'media', opts: { mode: 'screen' }, kind: 'gen', pop: 1 },
  { id: 'voice-recorder', cat: 'media', icon: 'mic', engine: 'media', opts: { mode: 'voice' }, kind: 'gen' },
];

// ---- batch 2 (isNew) ----
const N = (id, cat, icon, engine, opts, kind, extra = {}) => ({ id, cat, icon, engine, opts, kind, isNew: 1, ...extra });
const PDFJS = { vendor: ['pdf-lib.min.js'] };
TOOLS.push(
  // image
  N('crop-image', 'image', 'crop', 'img2', { mode: 'crop' }, 'file', { pop: 1 }),
  N('circle-crop-image', 'image', 'circle', 'img2', { mode: 'crop', shape: 'circle' }, 'file'),
  N('watermark-image', 'image', 'stamp', 'img2', { mode: 'watermark' }, 'file'),
  N('meme-generator', 'image', 'smile', 'img2', { mode: 'meme' }, 'file', { pop: 1 }),
  N('blur-image', 'image', 'droplet', 'img2', { mode: 'blur' }, 'file'),
  N('black-and-white-image', 'image', 'contrast', 'img2', { mode: 'bw' }, 'file'),
  N('transparent-background', 'image', 'ghost', 'img2', { mode: 'transparent' }, 'file'),
  N('image-color-picker', 'image', 'pipette', 'img2', { mode: 'picker' }, 'file'),
  N('svg-to-png', 'image', 'fileimg', 'img2', { mode: 'svg' }, 'file'),
  N('favicon-generator', 'image', 'star', 'img2', { mode: 'favicon' }, 'file'),
  // pdf
  N('pdf-to-jpg', 'pdf', 'fileimg', 'pdf2', { mode: 'toimg', fmt: 'jpeg' }, 'file', { pop: 1 }),
  N('pdf-to-png', 'pdf', 'fileimg', 'pdf2', { mode: 'toimg', fmt: 'png' }, 'file'),
  N('compress-pdf', 'pdf', 'minimize', 'pdf2', { mode: 'compress' }, 'file', { pop: 1, ...PDFJS }),
  N('pdf-to-text', 'pdf', 'filetext', 'pdf2', { mode: 'text' }, 'file'),
  N('organize-pdf', 'pdf', 'grid2', 'pdf2', { mode: 'organize' }, 'file', PDFJS),
  N('add-page-numbers-pdf', 'pdf', 'numbers', 'pdf2', { mode: 'numbers' }, 'file', PDFJS),
  N('watermark-pdf', 'pdf', 'stamp', 'pdf2', { mode: 'watermark' }, 'file', PDFJS),
  N('png-to-pdf', 'pdf', 'image', 'pdf', { mode: 'images' }, 'file', PDFJS),
  // text
  N('fancy-text-generator', 'text', 'wand', 'text2', { mode: 'fancy' }, 'text', { pop: 1 }),
  N('text-compare', 'text', 'diff', 'text2', { mode: 'diff' }, 'text'),
  N('character-counter', 'text', 'hash', 'text', { mode: 'counter' }, 'text'),
  N('morse-code-translator', 'text', 'radio', 'text2', { mode: 'morse' }, 'text'),
  N('text-to-binary', 'text', 'binary', 'text2', { mode: 'binary' }, 'text'),
  N('text-repeater', 'text', 'repeat', 'text2', { mode: 'repeat' }, 'text'),
  // calculators
  N('scientific-calculator', 'calc', 'func', 'calc2', { mode: 'sci' }, 'calc', { pop: 1 }),
  N('mortgage-calculator', 'calc', 'home', 'calc2', { mode: 'mortgage' }, 'calc'),
  N('gpa-calculator', 'calc', 'grad', 'calc2', { mode: 'gpa' }, 'calc'),
  N('vat-calculator', 'calc', 'receipt', 'calc2', { mode: 'vat' }, 'calc'),
  N('profit-margin-calculator', 'calc', 'chart', 'calc2', { mode: 'margin' }, 'calc'),
  N('salary-calculator', 'calc', 'briefcase', 'calc2', { mode: 'salary' }, 'calc'),
  N('fuel-cost-calculator', 'calc', 'fuel', 'calc2', { mode: 'fuel' }, 'calc'),
  N('fraction-calculator', 'calc', 'fraction', 'calc2', { mode: 'fraction' }, 'calc'),
  N('pregnancy-due-date-calculator', 'calc', 'baby', 'calc2', { mode: 'due' }, 'calc'),
  // converters
  N('currency-converter', 'convert', 'dollar', 'calc2', { mode: 'currency' }, 'calc', { pop: 1 }),
  N('time-zone-converter', 'convert', 'earth', 'calc2', { mode: 'tz' }, 'calc'),
  N('roman-numeral-converter', 'convert', 'roman', 'calc2', { mode: 'roman' }, 'calc'),
  N('number-base-converter', 'convert', 'base', 'calc2', { mode: 'base' }, 'calc'),
  N('pressure-converter', 'convert', 'pressure', 'unit', { cat: 'pressure' }, 'calc'),
  N('energy-converter', 'convert', 'bolt', 'unit', { cat: 'energy' }, 'calc'),
  N('power-converter', 'convert', 'battery', 'unit', { cat: 'power' }, 'calc'),
  N('time-converter', 'convert', 'hourglass', 'unit', { cat: 'time' }, 'calc'),
  // developer
  N('jwt-decoder', 'dev', 'ticket', 'dev2', { mode: 'jwt' }, 'text'),
  N('regex-tester', 'dev', 'regex', 'dev2', { mode: 'regex' }, 'text'),
  N('csv-to-json', 'dev', 'table', 'dev2', { mode: 'csv', dir: 'c2j' }, 'text'),
  N('json-to-csv', 'dev', 'table', 'dev2', { mode: 'csv', dir: 'j2c' }, 'text'),
  N('css-gradient-generator', 'dev', 'gradient', 'dev2', { mode: 'gradient' }, 'gen'),
  // generators
  N('barcode-generator', 'gen', 'barcode', 'gen2', { mode: 'barcode' }, 'gen', { vendor: ['JsBarcode.all.min.js'] }),
  N('random-name-picker', 'gen', 'userpick', 'gen2', { mode: 'picker' }, 'gen'),
  N('random-team-generator', 'gen', 'users', 'gen2', { mode: 'teams' }, 'gen'),
  N('dice-roller', 'gen', 'dice', 'gen2', { mode: 'dice' }, 'gen'),
  N('signature-generator', 'gen', 'pen', 'gen2', { mode: 'sign' }, 'gen', { pop: 1 }),
  N('color-palette-generator', 'gen', 'swatches', 'gen2', { mode: 'palette' }, 'gen'),
  // time
  N('pomodoro-timer', 'time', 'tomato', 'time2', { mode: 'pomodoro' }, 'gen'),
  N('world-clock', 'time', 'globe', 'time2', { mode: 'world' }, 'gen'),
  N('online-alarm-clock', 'time', 'bell', 'time2', { mode: 'alarm' }, 'gen'),
  // media
  N('metronome', 'media', 'metronome', 'time2', { mode: 'metronome' }, 'gen'),
  // tests
  N('typing-speed-test', 'test', 'keyboard', 'test', { mode: 'typing' }, 'gen', { pop: 1 }),
  N('click-speed-test', 'test', 'pointer', 'test', { mode: 'cps' }, 'gen'),
  N('reaction-time-test', 'test', 'zap', 'test', { mode: 'reaction' }, 'gen'),
  N('mic-test', 'test', 'mic', 'test', { mode: 'mic' }, 'gen'),
  N('webcam-test', 'test', 'camera', 'test', { mode: 'webcam' }, 'gen'),
  N('keyboard-tester', 'test', 'keyboard', 'test', { mode: 'keys' }, 'gen'),
  N('screen-resolution-checker', 'test', 'maximize', 'test', { mode: 'screen' }, 'gen'),
);

// ---- batch 3: AI & media (run fully in the browser) ----
TOOLS.push(
  N('remove-background', 'ai', 'eraser', 'ai', { mode: 'bg' }, 'file', { pop: 1 }),
  N('upscale-image', 'ai', 'maximize', 'ai', { mode: 'up' }, 'file', { pop: 1 }),
  N('passport-photo-maker', 'ai', 'id', 'ai', { mode: 'passport' }, 'file', { pop: 1 }),
  N('blur-background', 'ai', 'droplet', 'ai', { mode: 'blurbg' }, 'file'),
  N('sticker-maker', 'ai', 'smile', 'ai', { mode: 'sticker' }, 'file', { pop: 1 }),
  N('auto-blur-faces', 'ai', 'nouser', 'ai', { mode: 'faces' }, 'file'),
  N('image-to-text', 'ai', 'filetext', 'ai', { mode: 'ocr' }, 'file', { pop: 1, vendor: ['ocr/tesseract.min.js'] }),
  N('video-to-mp3', 'media', 'music', 'media2', { mode: 'mp3' }, 'file', { pop: 1 }),
);
