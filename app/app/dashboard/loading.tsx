export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 w-32 rounded-xl animate-pulse mb-2" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-4 w-64 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border p-6 animate-pulse" style={{ background: "#111118", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="h-5 w-32 rounded-lg mb-5" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
          <div className="rounded-2xl border animate-pulse" style={{ background: "#111118", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="h-5 w-40 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <div className="w-16 h-11 rounded-lg flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="flex-1">
                  <div className="h-4 w-3/4 rounded mb-2" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <div className="h-3 w-24 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border p-6 animate-pulse" style={{ background: "#111118", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="h-5 w-28 rounded-lg mb-4" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-10 w-full rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
