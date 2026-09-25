import { ImageResponse } from "next/og";
import { OgCard } from "@/lib/og";

export const alt = "Repository history on Codebase Archaeology";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  const slug = decodeURIComponent(`${owner}/${repo}`).slice(0, 80);
  return new ImageResponse(
    <OgCard title={slug} mono subtitle="Commit history as rock layers: eras, ownership, bus factor and the oldest surviving files." />,
    size,
  );
}
