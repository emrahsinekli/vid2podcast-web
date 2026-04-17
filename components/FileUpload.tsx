"use client";
import { useRef, useState } from "react";

const ACCEPTED_EXT = ".mp3,.wav,.m4a,.ogg,.webm,.aac,.flac,.mp4,.mov,.mkv";

export interface FileUploadProps {
  onTranscript: (text: string, title: string) => void;
  disabled?: boolean;
}

// Decode audio file → 16kHz mono Float32Array on the main thread
async function decodeAudioFile(file: File, onProgress: (msg: string) => void): Promise<Float32Array> {
  onProgress("Reading audio from file...");
  const arrayBuffer = await file.arrayBuffer();
  onProgress("Decoding audio...");
  const audioCtx = new AudioContext({ sampleRate: 16000 });
  try {
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    const numChannels = decoded.numberOfChannels;
    const length = decoded.length;
    const mono = new Float32Array(length);
    for (let ch = 0; ch < numChannels; ch++) {
      const ch_data = decoded.getChannelData(ch);
      for (let i = 0; i < length; i++) mono[i] += ch_data[i] / numChannels;
    }
    return mono;
  } finally {
    await audioCtx.close();
  }
}

let workerInstance: Worker | null = null;

function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(
      new URL("../lib/whisper-worker", import.meta.url),
      { type: "module" }
    );
  }
  return workerInstance;
}

export default function FileUpload({ onTranscript, disabled }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFile = async (file: File) => {
    setError("");
    setFileName(file.name);
    setPhase("processing");
    setProgress("Starting...");

    try {
      // Step 1: decode audio on main thread (fast, non-blocking UI)
      const audio = await decodeAudioFile(file, setProgress);

      // Step 2: send Float32Array to Web Worker — inference runs off main thread
      const worker = getWorker();

      await new Promise<void>((resolve, reject) => {
        worker.onmessage = (e) => {
          const { type, msg, text, message } = e.data;
          if (type === "progress") {
            setProgress(msg);
          } else if (type === "done") {
            if (!text) {
              reject(new Error("Could not extract speech from this file."));
            } else {
              const title = file.name.replace(/\.[^.]+$/, "");
              setPhase("done");
              onTranscript(text, title);
              resolve();
            }
          } else if (type === "error") {
            reject(new Error(message || "Transcription failed."));
          }
        };
        worker.onerror = (e) => reject(new Error(e.message || "Worker error"));

        // Transfer buffer ownership — zero-copy
        worker.postMessage({ audio }, [audio.buffer]);
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transcription failed. Please try again.");
      setPhase("error");
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const reset = () => {
    setPhase("idle");
    setFileName("");
    setError("");
    setProgress("");
  };

  if (phase === "processing") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 text-center" style={{ borderColor: "rgba(139,92,246,0.4)", background: "rgba(139,92,246,0.04)" }}>
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: "#8b5cf6" }} />
          <div className="absolute inset-2 rounded-full animate-pulse" style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }} />
          <div className="absolute inset-[14px] rounded-full animate-spin" style={{ border: "2px solid transparent", borderTopColor: "#a78bfa" }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text)] mb-1">{fileName}</p>
          <p className="text-xs text-[#a78bfa] animate-pulse max-w-xs">{progress || "Processing..."}</p>
          <p className="text-[10px] text-[var(--text3)] mt-2">Running Whisper AI in your browser — no data sent to servers</p>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3" style={{ background: "rgba(34,197,94,0.05)", borderColor: "rgba(34,197,94,0.2)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)" }}>
            <svg className="w-4 h-4 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text)] truncate max-w-xs">{fileName}</p>
            <p className="text-xs text-[#22c55e]">Transcribed successfully</p>
          </div>
        </div>
        <button onClick={reset} className="text-xs text-[var(--text3)] hover:text-[var(--text)] transition-colors px-2 py-1 rounded-lg" style={{ background: "var(--bg3)" }}>
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-150 ${
          dragging ? "border-[#8b5cf6] bg-[rgba(139,92,246,0.08)]" : "border-[var(--border)] hover:border-[rgba(139,92,246,0.4)] hover:bg-[rgba(139,92,246,0.03)]"
        } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input ref={inputRef} type="file" accept={ACCEPTED_EXT} className="hidden" onChange={onInputChange} disabled={disabled} />
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--bg3)" }}>
          <svg className="w-5 h-5 text-[var(--text3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text)]">Drop audio or video file here</p>
          <p className="text-xs text-[var(--text3)] mt-1">MP3, WAV, MP4, M4A, MOV, MKV, OGG — any size</p>
          <p className="text-xs mt-1" style={{ color: "#a78bfa" }}>Powered by Whisper AI — runs in your browser, 100% private</p>
        </div>
        <div className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#a78bfa]" style={{ background: "rgba(139,92,246,0.12)" }}>
          Browse Files
        </div>
      </div>

      {phase === "error" && (
        <p className="text-xs text-red-400 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
