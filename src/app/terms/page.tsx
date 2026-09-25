import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/ui/prose";
import { LEGAL_UPDATED, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: `The terms and conditions for using ${site.name}.`,
  alternates: { canonical: "/terms" },
};

const sections = [
  { id: "agreement", label: "Agreement to these terms" },
  { id: "service", label: "The Service" },
  { id: "acceptable-use", label: "Acceptable use" },
  { id: "api", label: "API and automated access" },
  { id: "content", label: "Repository data and third-party content" },
  { id: "accuracy", label: "Reports are estimates" },
  { id: "license", label: "Open-source license" },
  { id: "privacy", label: "Privacy" },
  { id: "availability", label: "Availability and changes" },
  { id: "disclaimer", label: "Disclaimer of warranties" },
  { id: "liability", label: "Limitation of liability" },
  { id: "indemnity", label: "Indemnity" },
  { id: "termination", label: "Suspension and termination" },
  { id: "changes", label: "Changes to these terms" },
  { id: "general", label: "General" },
  { id: "contact", label: "Contact" },
] as const;

export default function TermsPage() {
  return (
    <ProsePage
      eyebrow="Legal"
      title="Terms and conditions"
      updated={LEGAL_UPDATED}
      intro="The rules for using Codebase Archaeology. Please read them: by using the Service, you agree to them."
      toc={sections}
    >
      <h2 id="agreement">1. Agreement to these terms</h2>
      <p>
        These terms and conditions (&ldquo;Terms&rdquo;) govern your use of {site.name}, including the website, its report pages and its API
        (together, the &ldquo;Service&rdquo;), which is operated by {site.author} (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By using the Service
        you agree to these Terms. If you don&apos;t agree, please don&apos;t use the Service.
      </p>

      <h2 id="service">2. The Service</h2>
      <p>
        The Service analyzes the history of public git repositories hosted on GitHub, GitLab and Codeberg, and of git logs you provide in
        paste mode, and presents statistics about them. It is free, requires no account, and is provided for general information only.
      </p>

      <h2 id="acceptable-use">3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use the Service in a way that breaks the law or infringes anyone&apos;s rights;</li>
        <li>
          send excessive requests, use the Service to overload us or any git host, or try to get around our rate limits, size limits or
          other protections, for example by rotating IP addresses;
        </li>
        <li>
          probe, scan or test the Service for vulnerabilities, except to report them responsibly through{" "}
          <a href={site.securityUrl}>GitHub&apos;s private vulnerability reporting</a>;
        </li>
        <li>use reports to harass, stalk, shame or discriminate against anyone, or to build profiles of individuals;</li>
        <li>present reports as endorsed by us or by a git host, or alter them in a misleading way; or</li>
        <li>interfere with anyone else&apos;s use of the Service.</li>
      </ul>

      <h2 id="api">4. API and automated access</h2>
      <p>
        The JSON API described in <Link href="/how-it-works#api">How it works</Link> is offered for reasonable, non-abusive use and is
        subject to the same rate limits as the website. Please cache results where you can. We may limit or block automated access that
        affects the Service or other users.
      </p>

      <h2 id="content">5. Repository data and third-party content</h2>
      <p>
        Reports are built from information published in public repositories and by their hosts, including repository names,
        contributors&apos; names, commit messages and file paths. That content belongs to its authors and owners, and your use of it may be
        subject to each repository&apos;s license and each host&apos;s terms. We are not affiliated with or endorsed by GitHub, GitLab or
        Codeberg, whose names are trademarks of their respective owners.
      </p>
      <p>
        In paste mode, you are responsible for having the right to analyze the logs you provide. They are processed only in your browser.
      </p>

      <h2 id="accuracy">6. Reports are estimates</h2>
      <p>
        Reports are generated automatically and may be incomplete or inaccurate. For example, renamed files count as deleted and re-added,
        authors are grouped by name, and only the default branch is analyzed; <Link href="/how-it-works#limits">How it works</Link> lists
        these limits. Measures such as folder ownership and bus factor describe a repository&apos;s history. They are not measures of
        anyone&apos;s skill, effort or value.
      </p>
      <p>
        <strong>
          Don&apos;t use the Service as the basis for decisions about individuals, such as hiring, promotion, pay or performance reviews.
        </strong>{" "}
        Nothing in the Service is legal, financial or other professional advice.
      </p>

      <h2 id="license">7. Open-source license</h2>
      <p>
        The Service&apos;s source code is available under the MIT License in the <a href={site.repoUrl}>project&apos;s repository</a>. That
        license governs the code; these Terms govern your use of the Service we host. You&apos;re welcome to share reports, for example by
        linking to them or sharing screenshots.
      </p>

      <h2 id="privacy">8. Privacy</h2>
      <p>
        Our <Link href="/privacy">privacy policy</Link> and <Link href="/cookies">cookie policy</Link> explain how we handle personal data
        and what we store on your device.
      </p>

      <h2 id="availability">9. Availability and changes</h2>
      <p>
        We may change, suspend or discontinue any part of the Service at any time, including its features, limits and API, without notice.
        We don&apos;t guarantee that the Service will be available, uninterrupted or error-free, or that any particular repository can be
        analyzed.
      </p>

      <h2 id="disclaimer">10. Disclaimer of warranties</h2>
      <p>
        <strong>
          To the fullest extent permitted by law, the Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without
          warranties of any kind, whether express, implied or statutory, including any warranties of merchantability, fitness for a
          particular purpose, accuracy and non-infringement.
        </strong>
      </p>

      <h2 id="liability">11. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, we will not be liable for any indirect, incidental, special, consequential or punitive
        damages, or for any loss of data, profits, revenue or goodwill, arising out of or relating to your use of, or inability to use, the
        Service. Because the Service is free, our total liability for all claims relating to it is limited to 50 U.S. dollars.
      </p>
      <p>
        Nothing in these Terms excludes or limits liability that cannot be excluded or limited by law, such as liability for fraud or for
        death or personal injury caused by negligence, and nothing in these Terms affects your statutory rights as a consumer.
      </p>

      <h2 id="indemnity">12. Indemnity</h2>
      <p>
        To the extent permitted by law, you agree to indemnify us against claims, losses and costs, including reasonable legal fees, that
        arise from your misuse of the Service or your breach of these Terms.
      </p>

      <h2 id="termination">13. Suspension and termination</h2>
      <p>
        We may restrict or block access to the Service for anyone who breaches these Terms, or whose use puts the Service or other users at
        risk. You may stop using the Service at any time. Sections that by their nature should continue to apply, such as the disclaimer and
        limitation of liability, survive termination.
      </p>

      <h2 id="changes">14. Changes to these terms</h2>
      <p>
        We may update these Terms. The date at the top shows when they last changed, and we&apos;ll announce significant changes on the
        site. If you continue to use the Service after changes take effect, you accept the updated Terms.
      </p>

      <h2 id="general">15. General</h2>
      <p>
        If any part of these Terms is found unenforceable, the rest remains in effect. If we don&apos;t enforce a provision, that
        doesn&apos;t waive our right to do so later. These Terms, together with our privacy policy and cookie policy, are the entire
        agreement between you and us about the Service. You may not transfer your rights under these Terms; we may transfer ours as part of
        a transfer of the Service.
      </p>

      <h2 id="contact">16. Contact</h2>
      <p>
        For questions about these Terms, <a href={site.contactUrl}>open an issue on the project&apos;s GitHub repository</a>. Issues are
        public, so please don&apos;t include personal information in them.
      </p>
    </ProsePage>
  );
}
