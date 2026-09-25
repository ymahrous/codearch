/**
 * Renders schema.org structured data. "<" is escaped so text from repositories (commit
 * messages, names) can never close the script tag.
 */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
