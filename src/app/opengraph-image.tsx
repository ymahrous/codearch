import { ImageResponse } from "next/og";
import { OgCard } from "@/lib/og";
import { site } from "@/lib/site";

export const alt = `${site.name}: ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <OgCard title={site.tagline} subtitle="Explore any repository's history: eras, ownership, bus factor and fossils." />,
    size,
  );
}
