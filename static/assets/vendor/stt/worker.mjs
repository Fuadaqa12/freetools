import { pipeline, env } from './transformers.min.js';
env.allowLocalModels = false;
env.backends.onnx.wasm.wasmPaths = new URL('./', import.meta.url).href;
env.backends.onnx.wasm.numThreads = 1;
let asr = null, cur = null;
async function get(model) {
  if (asr && cur === model) return asr;
  const files = {};
  asr = await pipeline('automatic-speech-recognition', model, {
    dtype: { encoder_model: 'fp32', decoder_model_merged: 'q4' }, device: 'wasm',
    progress_callback: (p) => { if (p.status === 'progress' && p.total) { files[p.file] = [p.loaded, p.total]; let l = 0, t = 0; for (const k in files) { l += files[k][0]; t += files[k][1]; } postMessage({ type: 'load', p: l / t }); } }
  });
  cur = model; return asr;
}
onmessage = async (e) => {
  const { audio, lang, model } = e.data;
  try {
    const p = await get(model);
    postMessage({ type: 'run' });
    const out = await p(audio, { language: lang === 'auto' ? null : lang, task: 'transcribe', chunk_length_s: 30, stride_length_s: 5, return_timestamps: true,
      callback_function: undefined });
    postMessage({ type: 'done', text: out.text, chunks: out.chunks || [] });
  } catch (err) { postMessage({ type: 'error', msg: String(err && err.message || err) }); }
};
