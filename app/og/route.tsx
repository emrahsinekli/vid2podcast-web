import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "Turn YouTube Videos into Podcasts";
  const desc = searchParams.get("desc") || "Instant transcript · AI summary · 50+ languages · Natural audio";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0f 0%, #16102a 50%, #0a0a0f 100%)",
          padding: "72px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Purple glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)",
          }}
        />

        {/* Logo + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "36px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Headphones icon */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M12 3a9 9 0 00-9 9v7c0 1.1.9 2 2 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H5v-2a7 7 0 0114 0v2h-1a2 2 0 00-2 2v3a2 2 0 002 2h1a2 2 0 002-2v-7a9 9 0 00-9-9z"/>
            </svg>
          </div>
          <span style={{ fontSize: "26px", fontWeight: "700", color: "#f0f0f5", letterSpacing: "-0.5px" }}>
            Vid2Podcast
          </span>
          <div
            style={{
              marginLeft: "8px",
              padding: "4px 12px",
              borderRadius: "20px",
              background: "rgba(139,92,246,0.2)",
              border: "1px solid rgba(139,92,246,0.4)",
              fontSize: "13px",
              fontWeight: "600",
              color: "#a78bfa",
            }}
          >
            vid2podcast.com
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "54px",
            fontWeight: "800",
            color: "#f0f0f5",
            lineHeight: "1.1",
            marginBottom: "20px",
            letterSpacing: "-1.5px",
            maxWidth: "900px",
          }}
        >
          {title}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: "22px",
            color: "#a0a0b0",
            lineHeight: "1.5",
            maxWidth: "800px",
            marginBottom: "40px",
          }}
        >
          {desc}
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {["🎙️ Transcript", "🤖 AI Summary", "🌍 50+ Languages", "🔊 Neural TTS", "⚡ Free to Start"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 18px",
                borderRadius: "20px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                fontSize: "16px",
                color: "#e0e0f0",
                fontWeight: "500",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
