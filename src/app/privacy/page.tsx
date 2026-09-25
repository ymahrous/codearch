import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage, ProseTable } from "@/components/ui/prose";
import { LEGAL_UPDATED, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `What personal data ${site.name} processes, why, for how long, and the rights you have.`,
  alternates: { canonical: "/privacy" },
};

const sections = [
  { id: "who-we-are", label: "Who we are" },
  { id: "what-we-process", label: "What we process" },
  { id: "legal-bases", label: "Why we use it" },
  { id: "sharing", label: "Service providers and sharing" },
  { id: "retention", label: "How long we keep it" },
  { id: "transfers", label: "International transfers" },
  { id: "your-rights", label: "Your rights and choices" },
  { id: "contributors", label: "People named in repositories" },
  { id: "security", label: "Security" },
  { id: "children", label: "Children" },
  { id: "changes", label: "Changes to this policy" },
  { id: "contact", label: "Contact" },
] as const;

export default function PrivacyPage() {
  return (
    <ProsePage
      eyebrow="Legal"
      title="Privacy policy"
      updated={LEGAL_UPDATED}
      intro="What personal data Codebase Archaeology processes when you use it, why, for how long, and the choices you have."
      toc={sections}
    >
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="font-semibold text-fg">At a glance</p>
        <ul className="mt-2">
          <li>No accounts, no advertising, and we never sell your data.</li>
          <li>Logs you use in paste mode are analyzed in your browser and never uploaded.</li>
          <li>Analytics runs only if you allow it, and it uses no cookies.</li>
          <li>We use IP addresses briefly to prevent abuse, not to identify you.</li>
        </ul>
      </div>

      <h2 id="who-we-are">1. Who we are</h2>
      <p>
        {site.name} (the &ldquo;Service&rdquo;) is a free tool operated by {site.author}, an individual developer (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;). We are the controller of the personal data described in this policy. See <a href="#contact">Contact</a> for how
        to reach us.
      </p>

      <h2 id="what-we-process">2. What we process</h2>
      <h3>Repositories you look up</h3>
      <p>
        When you enter a repository, your browser sends its name to our server, which then downloads that repository&apos;s public history
        from its git host (GitHub, GitLab or Codeberg). From each commit we keep the author&apos;s name, the commit time, the first line of
        the commit message and the paths of the files it changed. We never download file contents, and we discard commit email addresses as
        soon as each commit is read. For GitHub repositories we also ask the GitHub API whether the repository exists, is public and is
        within our size limit.
      </p>
      <p>
        The finished report is cached so that repeat visits are fast, and anyone who opens the same repository address sees the same report.
        The git hosts receive these requests from our server, not from your browser, so they don&apos;t learn your IP address from them.
      </p>
      <h3>Paste mode</h3>
      <p>
        Logs you paste or open in <Link href="/analyze">paste mode</Link> are read and analyzed entirely in your browser. They are never
        uploaded to us or to anyone else.
      </p>
      <h3>Technical and security data</h3>
      <p>
        Like any website, our servers receive your IP address, your browser&apos;s user agent, the address you request, the referring page
        and the time of each request. Our hosting provider uses this information to deliver pages and to protect the Service, for example
        against denial-of-service attacks, and may keep it briefly in logs. To stop any one visitor from starting too many new analyses, we
        also keep a counter for each IP address that expires within 15 minutes.
      </p>
      <h3>Analytics, only with your consent</h3>
      <p>
        If you choose <strong>Allow analytics</strong>, we use Vercel Web Analytics to learn which pages are used. For each page view it
        records the page address (such as <code>/expressjs/express</code>), the referring site, your approximate location (country, region
        and city, derived from your IP address), your browser, operating system and device type, and the time. It sets no cookies: a visit
        is recognized by a hash of the request that is discarded after 24 hours, your IP address isn&apos;t stored, and you can&apos;t be
        tracked across other websites. We see only aggregated statistics. If you decline, or never choose, the analytics script isn&apos;t
        loaded at all. You can change your choice at any time in our <Link href="/cookies">cookie policy</Link>.
      </p>
      <h3>Information stored on your device</h3>
      <p>
        Your theme choice and your analytics choice are saved in your browser&apos;s local storage and never leave your device. Our{" "}
        <Link href="/cookies">cookie policy</Link> lists everything we store.
      </p>
      <h3>Information you send us</h3>
      <p>
        If you contact us through the project&apos;s issue tracker on GitHub, we receive what you write and your GitHub username. GitHub
        issues are public.
      </p>

      <h2 id="legal-bases">3. Why we use it</h2>
      <p>
        We use personal data only for the purposes below. Where the EU or UK General Data Protection Regulation (GDPR) applies, these are
        our legal bases:
      </p>
      <ProseTable caption="Purposes and legal bases">
        <thead>
          <tr>
            <th scope="col">Purpose</th>
            <th scope="col">Data</th>
            <th scope="col">Legal basis</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Analyzing the repositories you ask for and showing the reports</td>
            <td>Repository names; public commit data, including contributors&apos; names</td>
            <td>Legitimate interests: providing a free tool about public projects, at your request</td>
          </tr>
          <tr>
            <td>Delivering and securing the Service and preventing abuse</td>
            <td>IP address, user agent, request details, rate-limit counters</td>
            <td>Legitimate interests: keeping the Service available and secure</td>
          </tr>
          <tr>
            <td>Understanding how the Service is used</td>
            <td>The analytics data described above</td>
            <td>Your consent, which you can withdraw at any time</td>
          </tr>
          <tr>
            <td>Answering your questions and requests</td>
            <td>Your message and GitHub username</td>
            <td>Legitimate interests: responding to you</td>
          </tr>
          <tr>
            <td>Complying with the law</td>
            <td>Any of the above, only as needed</td>
            <td>Legal obligation</td>
          </tr>
        </tbody>
      </ProseTable>
      <p>
        We don&apos;t use personal data for advertising or profiling, or to make automated decisions that have legal or similarly
        significant effects on anyone.
      </p>

      <h2 id="sharing">4. Service providers and sharing</h2>
      <ul>
        <li>
          <strong>Vercel Inc.</strong> hosts the Service, delivers it through its content delivery network, protects it and, if you allow
          it, provides Web Analytics. See <a href="https://vercel.com/legal/privacy-policy">Vercel&apos;s privacy policy</a>.
        </li>
        <li>
          <strong>Upstash, Inc.</strong> may store cached reports and rate-limit counters when we use its Redis database instead of our
          servers&apos; own memory. See <a href="https://upstash.com/trust/privacy.pdf">Upstash&apos;s privacy policy</a>.
        </li>
        <li>
          <strong>GitHub, GitLab and Codeberg</strong> are where repository data comes from. Links such as &ldquo;Source code&rdquo; and
          &ldquo;View source&rdquo; take you to their sites, where their own privacy policies apply.
        </li>
      </ul>
      <p>
        We don&apos;t sell personal information, and we don&apos;t share it for cross-context behavioral advertising. We may disclose
        information if the law requires it, or where necessary to protect the Service and its users from fraud, abuse or security threats.
      </p>

      <h2 id="retention">5. How long we keep it</h2>
      <ProseTable caption="Retention periods">
        <thead>
          <tr>
            <th scope="col">Data</th>
            <th scope="col">How long</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cached reports</td>
            <td>Up to 6 hours in our cache. Our content delivery network may serve a copy for up to about an hour longer.</td>
          </tr>
          <tr>
            <td>Rate-limit counters</td>
            <td>Up to 15 minutes</td>
          </tr>
          <tr>
            <td>Hosting and security logs</td>
            <td>A short period set by our hosting provider, after which they are deleted</td>
          </tr>
          <tr>
            <td>Analytics</td>
            <td>
              The visit hash is discarded after 24 hours. Vercel keeps the aggregated statistics, which don&apos;t identify you, for the
              retention period of our plan.
            </td>
          </tr>
          <tr>
            <td>Theme and analytics choice, in your browser</td>
            <td>Until you clear them. We ask about analytics again after 12 months.</td>
          </tr>
          <tr>
            <td>Issues you open on GitHub</td>
            <td>Until you or we delete them</td>
          </tr>
        </tbody>
      </ProseTable>

      <h2 id="transfers">6. International transfers</h2>
      <p>
        We and our service providers may process data in the United States and other countries whose data protection laws differ from those
        where you live. Where the GDPR applies, these transfers rely on appropriate safeguards offered by our providers, such as the
        European Commission&apos;s Standard Contractual Clauses or the EU&ndash;U.S. Data Privacy Framework.
      </p>

      <h2 id="your-rights">7. Your rights and choices</h2>
      <p>
        Depending on where you live, including the European Economic Area, the United Kingdom, Switzerland, California and other U.S.
        states, you may have the right to:
      </p>
      <ul>
        <li>access the personal data we hold about you and receive a copy of it;</li>
        <li>have inaccurate data corrected, or have your data deleted;</li>
        <li>restrict or object to our processing, including processing based on legitimate interests;</li>
        <li>receive your data in a portable format;</li>
        <li>
          withdraw your consent to analytics at any time on our <Link href="/cookies">cookie policy</Link> page, without affecting
          processing that already took place;
        </li>
        <li>not be treated differently for exercising any of these rights; and</li>
        <li>lodge a complaint with your local data protection authority.</li>
      </ul>
      <p>
        To exercise a right, contact us as described below. Because the Service has no accounts and keeps little data for long, we may not
        be able to find data that relates to you, for example a rate-limit counter that has already expired. If so, we&apos;ll tell you. We
        may need to verify a request before acting on it, and we&apos;ll respond within the time the law requires (one month under the
        GDPR).
      </p>
      <p>
        <strong>California residents.</strong> We collect the categories of personal information described in section 2: identifiers (IP
        addresses), internet or other electronic network activity (pages viewed, with your consent) and approximate geolocation (with your
        consent), for the purposes in section 3. We don&apos;t sell or share personal information, including that of consumers under 16, and
        we don&apos;t collect sensitive personal information. We treat a{" "}
        <a href="https://globalprivacycontrol.org">Global Privacy Control</a> signal from your browser as a request to opt out of analytics.
      </p>

      <h2 id="contributors">8. People named in repositories</h2>
      <p>
        Reports show information that contributors have published in public repositories: their names as recorded in git, the first line of
        their commit messages, the dates of their commits, and statistics such as commit counts, folder ownership and bus factor. We
        don&apos;t collect contributors&apos; email addresses, and we don&apos;t use reports to make decisions about anyone.
      </p>
      <p>
        If you are named in a report and object to this, contact us. We&apos;ll assess your request and, where the law requires it, stop
        processing the data about you.
      </p>

      <h2 id="security">9. Security</h2>
      <p>
        We use HTTPS throughout, strict security headers, validated input and limits on what our servers download, and we keep as little
        personal data as we can for as short a time as we can. No online service is perfectly secure, however. If you find a vulnerability,
        please report it privately through <a href={site.securityUrl}>GitHub&apos;s private vulnerability reporting</a>, not in a public
        issue.
      </p>

      <h2 id="children">10. Children</h2>
      <p>
        The Service is a developer tool that isn&apos;t directed at children. We don&apos;t knowingly collect personal data from children
        under 13, or under 16 where local law sets a higher age. If you believe a child has sent us personal data, contact us and we&apos;ll
        delete it.
      </p>

      <h2 id="changes">11. Changes to this policy</h2>
      <p>
        We&apos;ll update this policy when the Service or the law changes. The date at the top shows when it last changed, and we&apos;ll
        announce significant changes on the site. Earlier versions are available in the project&apos;s public source repository.
      </p>

      <h2 id="contact">12. Contact</h2>
      <p>
        For questions or requests about privacy, <a href={site.contactUrl}>open an issue on the project&apos;s GitHub repository</a>. Issues
        are public, so please don&apos;t include personal information in them: just say that you have a privacy request, and we&apos;ll
        reply with a private way to share the details.
      </p>
    </ProsePage>
  );
}
