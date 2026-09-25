import { PasteAnalyzer } from "@/components/paste/paste-analyzer";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { PASTE_STEPS } from "@/lib/content";
import { breadcrumbNode, graph, howToNode, pageMetadata, webPageNode } from "@/lib/seo";

const title = "Analyze a private git repository";
const description =
  "Analyze a private git repository from its log: run one command, then paste or drop the output. The report is built in your browser; nothing is uploaded.";

export const metadata = pageMetadata({ title, description, path: "/analyze" });

export default function AnalyzePage() {
  return (
    <Container className="py-12 sm:py-16">
      <JsonLd
        data={graph(
          webPageNode({ path: "/analyze", title, description }),
          howToNode({ path: "/analyze", name: "Analyze a private repository from its git log", description, steps: [...PASTE_STEPS] }),
          breadcrumbNode([
            ["Home", "/"],
            ["Paste mode", "/analyze"],
          ]),
        )}
      />
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-accent">Paste mode</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Analyze any repository from its git log</h1>
        <p className="mt-3 text-fg-muted">
          For private repos, internal monorepos, or anything too large for the online analyzer. Export the history with one command and drop
          it in.
        </p>
      </div>
      <div className="mt-10">
        <PasteAnalyzer />
      </div>
    </Container>
  );
}
