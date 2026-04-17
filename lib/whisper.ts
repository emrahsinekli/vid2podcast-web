// Browser-based audio/video transcription using Whisper
// Runs 100% in the browser — no server, no API key, no cost
// Model: whisper-tiny (downloads once, cached in browser)

"use client";

let pipelineCache: any = null;
let loadingPromise: Promise<any> | null = null;

export type WhisperProgress = (msg: string, pct?: number) => void;

async function loadWhisper(onProgress?: WhisperProgress): Promise<any> {
  if (pipelineCache) return pipelineCache;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    onProgress?.("Loading Whisper AI model (cached after first use)...", 0);

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
            onProgress?.(`Downloading Whisper model... ${pct}%`, pct);
          } else if (info.status === "initiate") {
            onProgress?.("Initializing model...", 5);
          } else if (info.status === "ready") {
            onProgress?.("Model ready!", 100);
          }
        },
      }
    );

    return pipelineCache;
  })();

  return loadingPromise;
}

// Decode any audio/video file → 16kHz mono Float32Array (Whisper's expected format)
async function decodeAudioFile(file: File, onProgress?: WhisperProgress): Promise<Float32Array> {
  onProgress?.("Reading audio from file...", 2);
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.("Decoding audio...", 5);
  const audioCtx = new AudioContext({ sampleRate: 16000 });

  try {
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    // Mix all channels down to mono
    const numChannels = decoded.numberOfChannels;
    const length = decoded.length;
    const mono = new Float32Array(length);
    for (let ch = 0; ch < numChannels; ch++) {
      const channelData = decoded.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        mono[i] += channelData[i] / numChannels;
      }
    }
    return mono;
  } finally {
    await audioCtx.close();
  }
}

export async function transcribeFile(
  file: File,
  onProgress?: WhisperProgress
): Promise<string> {
  // 1. Decode audio
  const audioData = await decodeAudioFile(file, onProgress);

  // 2. Load model (cached after first download)
  const transcriber = await loadWhisper(onProgress);

  // 3. Transcribe
  const durationSecs = audioData.length / 16000;
  onProgress?.(
    `Transcribing ${Math.round(durationSecs / 60)} min audio... (may take ${Math.round(durationSecs / 10)}–${Math.round(durationSecs / 5)} seconds)`,
    50
  );

  const result = await transcriber(audioData, {
    chunk_length_s: 30,
    stride_length_s: 5,
    language: null,
    task: "transcribe",
    return_timestamps: false,
    callback_function: (beams: any[]) => {
      const text = beams?.[0]?.output_token_ids?.length ?? 0;
      if (text > 0) onProgress?.("Transcribing...", 60);
    },
  });

  const text = (Array.isArray(result) ? result[0]?.text : (result as any)?.text) ?? "";
  return text.trim();
}

// Pre-warm: start model download in background (call on page load)
export function prewarmWhisper(): void {
  if (typeof window === "undefined") return;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) return;
  setTimeout(() => {
    loadWhisper().catch(() => {});
  }, 5000);
}
