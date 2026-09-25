import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/ui/prose";
import { formatDay } from "@/lib/format";
import { LEGAL_UPDATED, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Accessibility statement",
  description: `How ${site.name} works to be accessible to everyone, its conformance with WCAG 2.2, known limitations and how to report a problem.`,
  alternates: { canonical: "/accessibility" },
};

const sections = [
  { id: "commitment", label: "Our commitment" },
  { id: "conformance", label: "Conformance status" },
  { id: "features", label: "Accessibility features" },
  { id: "testing", label: "How we test" },
  { id: "limitations", label: "Known limitations" },
  { id: "compatibility", label: "Compatibility" },
  { id: "technology", label: "Technical specifications" },
  { id: "feedback", label: "Feedback" },
  { id: "about", label: "About this statement" },
] as const;

export default function AccessibilityPage() {
  return (
    <ProsePage
      eyebrow="Legal"
      title="Accessibility statement"
      updated={LEGAL_UPDATED}
      intro="We want everyone to be able to explore a codebase's history, whatever device, browser or assistive technology they use."
      toc={sections}
    >
      <h2 id="commitment">1. Our commitment</h2>
      <p>
        {site.name} aims to be usable by people who rely on screen readers, screen magnifiers, voice control, keyboard-only navigation or
        other assistive technology. We treat accessibility problems as bugs and fix the ones that block access first.
      </p>

      <h2 id="conformance">2. Conformance status</h2>
      <p>
        The <a href="https://www.w3.org/TR/WCAG22/">Web Content Accessibility Guidelines (WCAG) 2.2</a> describe how to make web content
        more accessible to people with disabilities, at three levels: A, AA and AAA. {site.name} is <strong>partially conformant</strong>{" "}
        with WCAG 2.2 level AA. This means most of the site meets the standard, but some content, listed under{" "}
        <a href="#limitations">known limitations</a>, doesn&apos;t fully meet it yet.
      </p>

      <h2 id="features">3. Accessibility features</h2>
      <ul>
        <li>A &ldquo;Skip to content&rdquo; link, landmarks and a consistent heading structure on every page.</li>
        <li>Everything works with a keyboard alone, with a clearly visible focus indicator.</li>
        <li>Every form field and button has a text label, and errors are announced to screen readers.</li>
        <li>
          The rock-layers chart has a &ldquo;Show as table&rdquo; view, and each year&apos;s layer can be focused to hear or see its
          details.
        </li>
        <li>
          Folder statuses, bus-factor risks and sort order have text labels or icons, not just colors, and the chart&apos;s colored
          contributor segments are also described in text.
        </li>
        <li>Text and controls meet WCAG contrast requirements in both the light and the dark theme.</li>
        <li>Pages adapt to screens as narrow as 320 pixels and to browser zoom up to 400% without horizontal scrolling.</li>
        <li>Animations are reduced when your system asks for reduced motion.</li>
        <li>
          Paste mode&apos;s drag and drop has a &ldquo;Choose file&rdquo; button, and the cookie banner can be answered with a single click
          or key press either way.
        </li>
      </ul>

      <h2 id="testing">4. How we test</h2>
      <ul>
        <li>
          Automated checks with <a href="https://github.com/dequelabs/axe-core">axe-core</a> against the WCAG 2.2 A and AA rules, on the
          main pages in both themes, run on every change.
        </li>
        <li>Automated keyboard tests of navigation, the skip link, menus and controls.</li>
        <li>Component tests that find every element by its accessible role and name, the way assistive technology does.</li>
        <li>Linting with accessibility rules for React.</li>
      </ul>
      <p>
        This is a self-assessment. The site hasn&apos;t yet been audited by an independent accessibility expert or tested systematically
        with every screen reader.
      </p>

      <h2 id="limitations">5. Known limitations</h2>
      <ul>
        <li>
          <strong>Rock-layers chart.</strong> The chart itself is visual. Each layer&apos;s focusable summary and the table view contain the
          same numbers, but the breakdown of a year by contributor lists only its five most active people.
        </li>
        <li>
          <strong>Repository content.</strong> Repository names, commit messages, file paths and contributor names come from the
          repositories themselves. They can be in any language or contain emoji and unusual characters, and because their language
          isn&apos;t known, screen readers may mispronounce them.
        </li>
        <li>
          <strong>Wide tables.</strong> On narrow screens the folder ownership table scrolls sideways within its box so that its columns
          stay readable.
        </li>
        <li>
          <strong>Link previews.</strong> The images shown when a page is shared on social media contain text; the same information is in
          the page&apos;s title and description.
        </li>
      </ul>

      <h2 id="compatibility">6. Compatibility</h2>
      <p>
        The site is designed for current versions of Chrome, Edge, Firefox and Safari on desktop and mobile, and for the assistive
        technologies that work with them, such as VoiceOver, TalkBack, NVDA and JAWS. It isn&apos;t designed for outdated browsers such as
        Internet Explorer.
      </p>

      <h2 id="technology">7. Technical specifications</h2>
      <p>
        Accessibility relies on HTML, WAI-ARIA, CSS and JavaScript. Report pages and <Link href="/analyze">paste mode</Link> need
        JavaScript; the other pages work without it.
      </p>

      <h2 id="feedback">8. Feedback</h2>
      <p>
        If something on the site is hard to use, or you find a barrier we haven&apos;t listed,{" "}
        <a href={site.contactUrl}>open an issue on the project&apos;s GitHub repository</a>. Please tell us the page, what you were trying
        to do, and the browser and assistive technology you use. Issues are public, so please don&apos;t include personal information in
        them. We read every report and fix problems that block access as a priority.
      </p>

      <h2 id="about">9. About this statement</h2>
      <p>
        This statement was prepared on <time dateTime={LEGAL_UPDATED}>{formatDay(LEGAL_UPDATED)}</time>, based on the self-assessment
        described above. We review it whenever the site changes significantly, and at least once a year.
      </p>
    </ProsePage>
  );
}
