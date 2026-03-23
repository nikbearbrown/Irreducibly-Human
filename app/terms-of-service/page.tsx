import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service - Medhavy LLC',
  description: 'Terms of Service for Medhavy LLC, AI consulting services, and medhavy.com',
}

export default function TermsOfServicePage() {
  return (
    <div className="container px-4 md:px-6 mx-auto py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: March 2026</p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Welcome to <strong>medhavy.com</strong>. By accessing or using this website, you agree to be bound by
              these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, please do not use
              our website.
            </p>
            <ul className="list-none pl-0 mt-4 space-y-1 text-base">
              <li><strong>Company:</strong> Medhavy LLC (Nik Brown, Sole Member)</li>
              <li><strong>Address:</strong> 30 N Gould St Ste N, Sheridan, WY 82801</li>
              <li><strong>Email:</strong>{' '}
                <a href="mailto:medhavy@humanitarians.ai" className="text-primary hover:underline">medhavy@humanitarians.ai</a>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Website Purpose</h2>
            <p>
              Medhavy LLC provides AI consulting services, educational content, newsletter publications, and related
              resources. The medhavy.com website serves as an informational resource, newsletter archive, tool directory,
              and professional contact point. Content on this website is intended to provide general information about our
              organization, services, and activities, and does not constitute professional advice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. AI Consulting Services</h2>
            <p>
              Medhavy LLC offers AI consulting services to organizations, including strategy, implementation, and
              connecting organizations with recent engineering graduates. All consulting engagements are governed by
              separate written agreements between Medhavy LLC and the client. These Terms apply to use of this
              website only and do not supersede any consulting engagement agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
            <p>
              All content on this website, including text, graphics, logos, images, audio, newsletter articles, AI tools,
              and software, is the property of Medhavy LLC or its content suppliers and is protected by United States
              and international copyright laws. The compilation of all content on this website is the exclusive property
              of Medhavy LLC.
            </p>
            <p className="mt-4">
              Newsletter content originally published on Substack is displayed with attribution to its original source.
              Original publication rights and any applicable licenses are noted on individual articles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Use License</h2>
            <p>
              You are granted a limited, non-exclusive, non-transferable license to access and use our website for
              informational purposes. This license does not include:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Modifying or copying the materials for redistribution</li>
              <li>Using the materials for any commercial purpose without written permission</li>
              <li>Attempting to decompile or reverse engineer any software contained on the website</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or &ldquo;mirroring&rdquo; the materials on any other server</li>
              <li>Scraping, crawling, or bulk downloading content beyond what robots.txt permits</li>
            </ul>
            <p className="mt-4">
              This license shall automatically terminate if you violate any of these restrictions and may be terminated
              by Medhavy LLC at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. User Conduct</h2>
            <p>
              When using this website, including any interactive features such as the AI contact assistant, you agree
              not to:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Submit false or misleading information</li>
              <li>Attempt to gain unauthorized access to any part of the website or its systems</li>
              <li>Use the website to transmit harmful code, spam, or malicious content</li>
              <li>Interfere with or disrupt the website&apos;s infrastructure or services</li>
              <li>Use automated tools to access the website beyond normal browser usage</li>
              <li>Attempt to abuse or exploit the AI contact assistant or embedded tools</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Newsletter Content</h2>
            <p>
              Newsletter articles displayed on this website are imported from Substack publications operated by
              Medhavy. These articles are provided for convenient reading and are attributed to their original
              Substack source. For the most current version of any article, refer to the original Substack publication
              linked on each article page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Third-Party Services and Links</h2>
            <p>
              This website integrates with and contains links to third-party services including Substack,
              GitHub, YouTube, Vercel, Neon, and Anthropic. Medhavy LLC does not guarantee the accuracy,
              relevance, timeliness, or completeness of any information on these external services. Please note that
              Medhavy LLC is not responsible for the content, privacy practices, or availability of these external
              services. Your use of third-party services is governed by their respective terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Disclaimer</h2>
            <p>
              The materials on Medhavy LLC&apos;s website are provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo;
              Medhavy LLC makes no warranties, expressed or implied, and hereby disclaims and negates all other
              warranties, including without limitation, implied warranties or conditions of merchantability, fitness for
              a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
            <p className="mt-4">
              AI-related content, tools, and recommendations are provided for informational and educational purposes
              only. They should not be relied upon as the sole basis for business, technical, or professional decisions.
              Medhavy LLC does not warrant that the website will be uninterrupted, error-free, or free of harmful
              components.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Limitations</h2>
            <p>
              In no event shall Medhavy LLC or its sole member be liable for any damages (including, without
              limitation, damages for loss of data or profit, or due to business interruption) arising out of the use
              or inability to use the materials on this website, even if Medhavy LLC or an authorized representative
              has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Medhavy LLC, its sole member, and its affiliates from any
              claims, damages, losses, or expenses (including reasonable attorneys&apos; fees) arising from your use
              of the website or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Revisions and Errata</h2>
            <p>
              The materials appearing on Medhavy LLC&apos;s website could include technical, typographical, or
              photographic errors. Medhavy LLC does not warrant that any of the materials on its website are accurate,
              complete, or current. Medhavy LLC may make changes to the materials contained on its website at any time
              without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the State of Wyoming, without
              regard to its conflict of law provisions. Any disputes relating to these Terms shall be subject to the
              exclusive jurisdiction of the state and federal courts located in Wyoming.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Modifications to Terms of Service</h2>
            <p>
              Medhavy LLC may revise these Terms of Service at any time without notice. By using this website, you
              are agreeing to be bound by the then-current version of these Terms. Changes take effect immediately upon
              posting. We encourage you to review this page periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact Medhavy LLC:
            </p>
            <ul className="list-none pl-0 mt-4 space-y-1 text-base">
              <li><strong>Email:</strong>{' '}
                <a href="mailto:medhavy@humanitarians.ai" className="text-primary hover:underline">medhavy@humanitarians.ai</a>
              </li>
              <li><strong>Address:</strong> 30 N Gould St Ste N, Sheridan, WY 82801</li>
            </ul>
          </section>
        </div>

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Link href="/privacy" className="text-primary hover:underline">
              ← Privacy Policy
            </Link>
            <Link href="/" className="text-primary hover:underline">
              Home →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
