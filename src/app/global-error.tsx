"use client";

/** Last-resort boundary for errors in the root layout. Renders its own document. */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          padding: 16,
          background: "#fafaf9",
          color: "#1c1b19",
        }}
      >
        <title>Something went wrong · Codebase Archaeology</title>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <h1 style={{ fontSize: 24 }}>Something went wrong</h1>
          <p style={{ color: "#6b675e" }}>The site hit an unexpected error. Please try again.</p>
          {error.digest && <p style={{ fontFamily: "monospace", fontSize: 12, color: "#8f8a80" }}>Reference: {error.digest}</p>}
          <button
            onClick={() => retry()}
            style={{
              marginTop: 16,
              padding: "10px 16px",
              borderRadius: 8,
              border: 0,
              background: "#b45309",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
