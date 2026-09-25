import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const bands: Array<[string, number]> = [
    ["#c68a2e", 26],
    ["#4f7196", 34],
    ["#6f8d4f", 18],
    ["#a95a44", 20],
  ];
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#1c1b19",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 28px",
        gap: 6,
      }}
    >
      {bands.map(([c, h]) => (
        <div key={c} style={{ height: h, background: c, borderRadius: 4, display: "flex" }} />
      ))}
    </div>,
    size,
  );
}
