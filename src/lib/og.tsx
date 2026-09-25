/** Shared layout for generated Open Graph images (rendered by next/og, so inline styles only). */
export function OgCard({ title, subtitle, mono = false }: { title: string; subtitle: string; mono?: boolean }) {
  const bands: Array<[string, number]> = [
    ["#c68a2e", 38],
    ["#4f7196", 64],
    ["#6f8d4f", 30],
    ["#a95a44", 48],
    ["#7fa39b", 22],
    ["#cfae6c", 56],
    ["#5d5b56", 26],
  ];
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#fafaf9", color: "#1c1b19" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 600 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, width: 36 }}>
            <div style={{ height: 7, background: "#c68a2e", display: "flex" }} />
            <div style={{ height: 10, background: "#4f7196", display: "flex" }} />
            <div style={{ height: 6, background: "#6f8d4f", display: "flex" }} />
            <div style={{ height: 6, background: "#a95a44", display: "flex" }} />
          </div>
          <span>Codebase</span>
          <span style={{ color: "#b45309" }}>Archaeology</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: mono ? 64 : 72,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.05,
              maxWidth: 700,
              ...(mono ? { fontFamily: "monospace" } : {}),
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 28, color: "#6b675e", maxWidth: 640, lineHeight: 1.35 }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ width: 360, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 64px 0 0", gap: 4 }}>
        {bands.map(([c, h], i) => (
          <div key={i} style={{ height: h, background: c, display: "flex" }} />
        ))}
      </div>
    </div>
  );
}
