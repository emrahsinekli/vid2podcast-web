// Web Worker — runs Whisper inference off the main thread
// Audio is decoded on the main thread and passed here as Float32Array

let pipelineCache: any = null;
let loadingPromise: Promise<any> | null = null;

async function loadWhisper(onProgress: (msg: string, pct: number) => void): Promise<any> {
  if (pipelineCache) return pipelineCache;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    onProgress("Loading Whisper AI model (cached after first use)...", 0);

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
          } else if (info.status === "ready") {
            onProgress("Model ready!", 100);
          }
        },
      }
    );
    return pipelineCache;
  })();

  return loadingPromise;
}

self.onmessage = async (e: MessageEvent) => {
  const { audio } = e.data as { audio: Float32Array };

  try {
    const transcriber = await loadWhisper((msg, pct) => {
      self.postMessage({ type: "progress", msg, pct });
    });

    const durationSecs = audio.length / 16000;
    self.postMessage({
      type: "progress",
      msg: `Transcribing ${Math.round(durationSecs / 60)} min audio...`,
      pct: 50,
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
