import type { Metadata } from "next";
import Link from "next/link";
import { ConsentControls } from "@/components/consent/consent-controls";
import { ProsePage, ProseTable } from "@/components/ui/prose";
import { CONSENT_KEY } from "@/lib/consent";
import { LEGAL_UPDATED, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: `What ${site.name} stores in your browser, the cookieless analytics it uses with your consent, and how to change your choice.`,
  alternates: { canonical: "/cookies" },
};

const sections = [
  { id: "summary", label: "Summary" },
  { id: "cookies", label: "Cookies" },
  { id: "storage", label: "What we store on your device" },
  { id: "analytics", label: "Analytics" },
  { id: "your-choices", label: "Your choices" },
  { id: "changes", label: "Changes to this policy" },
  { id: "contact", label: "Contact" },
] as const;

export default function CookiesPage() {
  return (
    <ProsePage
      eyebrow="Legal"
      title="Cookie policy"
      updated={LEGAL_UPDATED}
      intro="What we store in your browser, the analytics we use with your permission, and how to change your choice at any time."
      toc={sections}
    >
      <h2 id="summary">1. Summary</h2>
      <p>
        {site.name} doesn&apos;t use advertising or tracking cookies, and the site itself sets no cookies at all. It saves two small
        preferences in your browser&apos;s local storage and, only if you allow it, uses cookieless analytics from Vercel.
      </p>

      <h2 id="cookies">2. Cookies</h2>
      <p>
        Cookies are small text files that websites store in your browser. We don&apos;t set any. If our hosting provider&apos;s firewall
        needs to check that your browser isn&apos;t an automated attacker, for example while the site is under attack, it shows a
        &ldquo;Vercel Security Checkpoint&rdquo; page. If you pass the check, Vercel keeps a challenge session in your browser for one hour.
        It is strictly necessary for security, isn&apos;t used to track you and doesn&apos;t require consent.
      </p>

      <h2 id="storage">3. What we store on your device</h2>
      <ProseTable caption="Items stored in your browser">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Purpose</th>
            <th scope="col">Type</th>
            <th scope="col">Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>theme</code>
            </td>
            <td>Remembers the light, dark or system theme you chose. Saved only when you change the theme.</td>
            <td>Local storage; functional</td>
            <td>Until you clear it</td>
          </tr>
          <tr>
            <td>
              <code>{CONSENT_KEY}</code>
            </td>
            <td>Remembers whether you allowed analytics, and when, so we don&apos;t ask on every page.</td>
            <td>Local storage; strictly necessary</td>
            <td>12 months, then we ask again</td>
          </tr>
          <tr>
            <td>Vercel security checkpoint</td>
            <td>Proves your browser passed a security check. Only set if a check is shown.</td>
            <td>Set by Vercel; strictly necessary</td>
            <td>1 hour</td>
          </tr>
        </tbody>
      </ProseTable>
      <p>These items stay in your browser. We never read them on our servers.</p>

      <h2 id="analytics">4. Analytics</h2>
      <p>
        With your consent, we use Vercel Web Analytics to count page views and see which pages are useful. Instead of a cookie, it
        recognizes a visit with a hash of the request that is discarded after 24 hours. It doesn&apos;t store your IP address, stores
        nothing on your device, and can&apos;t follow you to other websites. Our <Link href="/privacy#what-we-process">privacy policy</Link>{" "}
        lists exactly what it records. Until you allow it, the analytics script isn&apos;t loaded at all.
      </p>

      <h2 id="your-choices">5. Your choices</h2>
      <ConsentControls />
      <p>
        You can change your choice here at any time, and it takes effect immediately. Declining doesn&apos;t affect any feature of the site.
        If your browser sends a <a href="https://globalprivacycontrol.org">Global Privacy Control</a> signal, we treat it as declining
        analytics unless you switch analytics on here.
      </p>
      <p>
        To remove everything we&apos;ve stored, clear this site&apos;s data in your browser&apos;s settings, usually under privacy or site
        data. We&apos;ll then ask about analytics again on your next visit.
      </p>

      <h2 id="changes">6. Changes to this policy</h2>
      <p>
        If we change what we store or which analytics we use, we&apos;ll update this page and its date, and ask for your consent again where
        needed.
      </p>

      <h2 id="contact">7. Contact</h2>
      <p>
        For questions about this policy, <a href={site.contactUrl}>open an issue on the project&apos;s GitHub repository</a>. Issues are
        public, so please don&apos;t include personal information in them.
      </p>
    </ProsePage>
  );
}
