// Web Worker — ALL heavy work here: audio decode + Whisper inference
// Main thread just passes File object and shows progress

let pipelineCache: any = null;
let loadingPromise: Promise<any> | null = null;

async function loadWhisper(onProgress: (msg: string, pct: number) => void): Promise<any> {
  if (pipelineCache) return pipelineCache;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    onProgress("Loading Whisper AI model...", 0);
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowRemoteModels = true;
    env.allowLocalModels = false;

    pipelineCache = await pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-tiny",
      {
        dtype: "fp32",
        progress_callback: (info: any) => {
          if (info.status === "downloading" && info.total) {
            const pct = Math.round((info.loaded / info.total) * 100);
            onProgress(`Downloading model... ${pct}%`, pct);
          } else if (info.status === "initiate") {
            onProgress("Initializing model...", 5);
          }
        },
      }
    );
    return pipelineCache;
  })();

  return loadingPromise;
}

async function decodeAudio(file: File, onProgress: (msg: string) => void): Promise<Float32Array> {
  onProgress("Reading file...");
  const arrayBuffer = await file.arrayBuffer();

  onProgress("Decoding audio...");
  // OfflineAudioContext is available in workers on modern Chrome/Firefox
  const audioCtx = new (self as any).OfflineAudioContext(1, 1, 16000);
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);

  // Resample to 16kHz mono
  onProgress("Preparing audio...");
  const numChannels = decoded.numberOfChannels;
  const length = decoded.length;
  const sampleRate = decoded.sampleRate;

  // If already 16kHz, just use it
  if (sampleRate === 16000) {
    const mono = new Float32Array(length);
    for (let ch = 0; ch < numChannels; ch++) {
      const ch_data = decoded.getChannelData(ch);
      for (let i = 0; i < length; i++) mono[i] += ch_data[i] / numChannels;
    }
    return mono;
  }

  // Resample to 16kHz using OfflineAudioContext
  const targetLength = Math.round(length * 16000 / sampleRate);
  const offlineCtx = new (self as any).OfflineAudioContext(1, targetLength, 16000);
  const source = offlineCtx.createBufferSource();

  // Build a mono AudioBuffer at original sample rate
  const monoBuffer = offlineCtx.createBuffer(1, length, sampleRate);
  const monoData = monoBuffer.getChannelData(0);
  for (let ch = 0; ch < numChannels; ch++) {
    const ch_data = decoded.getChannelData(ch);
    for (let i = 0; i < length; i++) monoData[i] += ch_data[i] / numChannels;
  }

  source.buffer = monoBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);
  const resampled = await offlineCtx.startRendering();
  return resampled.getChannelData(0);
}

self.onmessage = async (e: MessageEvent) => {
  const { file } = e.data as { file: File };

  try {
    // Decode audio entirely in worker — no main thread blocking
    const audio = await decodeAudio(file, (msg) => {
      self.postMessage({ type: "progress", msg, pct: 10 });
    });

    // Load Whisper model (cached after first use)
    const transcriber = await loadWhisper((msg, pct) => {
      self.postMessage({ type: "progress", msg, pct: Math.round(pct * 0.7) });
    });

    const durationSecs = audio.length / 16000;
    self.postMessage({
      type: "progress",
      msg: `Transcribing ${Math.round(durationSecs / 60)}m ${Math.round(durationSecs % 60)}s audio...`,
      pct: 80,
    });

    const result = await transcriber(audio, {
      chunk_length_s: 30,
      stride_length_s: 5,
      language: null,
      task: "transcribe",
      return_timestamps: false,
    });

    const text = (Array.isArray(result) ? result[0]?.text : (result as any)?.text) ?? "";
    self.postMessage({ type: "done", text: text.trim() });
  } catch (err: any) {
    self.postMessage({ type: "error", message: err?.message ?? "Transcription failed" });
  }
};
