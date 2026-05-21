"use client";

import { Header } from "@/components/Header";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-[#111] antialiased selection:bg-[#f5f5f5]">
      <Header />

      <div className="max-w-3xl mx-auto px-6 pt-24 pb-40">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#aaa] mb-6">
          Legal
        </p>
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-normal tracking-tight leading-[1.1] mb-12">
          Terms of Service
        </h1>

        <div className="text-sm text-[#999] leading-[1.8] space-y-10">
          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              1. Agreement
            </h2>
            <p>
              By accessing or using PLAIN ("the Service"), you agree to be bound
              by these Terms of Service ("Terms"). If you do not agree, do not
              use the Service. These Terms constitute a binding legal agreement
              between you and PLAIN, operated by [YOUR_FULL_LEGAL_NAME], a sole
              proprietor based in South Africa.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              2. Service Description
            </h2>
            <p>
              PLAIN is an AI-powered transcription platform. We convert audio
              and video input into structured text output, including speaker
              labels, timestamps, and exportable formats. We offer two
              transcription models:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong className="text-[#555]">Accurate:</strong> Deepgram
                speech-to-text with Gemini-powered repair and normalization.
              </li>
              <li>
                <strong className="text-[#555]">Balanced:</strong> Direct
                transcription via Gemini, optimized for speed.
              </li>
            </ul>
            <p className="mt-2">
              Features and limits vary by plan. Free users receive 3
              transcriptions per day, a 25 MB file limit, TXT export, and 7-day
              storage. Pro users receive unlimited transcriptions, a 500 MB file
              limit, all export formats (TXT, SRT, PDF), speaker diarization, AI
              summaries, permanent storage, and priority processing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              3. Accounts
            </h2>
            <p>
              You must create an account via Supabase Auth using a valid email
              address. You are responsible for maintaining the confidentiality
              of your credentials and for all activity under your account. You
              must be at least 16 years old, or the legal age of digital consent
              in your jurisdiction, whichever is higher.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              4. Acceptable Use
            </h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Upload content you do not have the legal right to transcribe,
                store, or process.
              </li>
              <li>
                Use the Service for unlawful, harmful, threatening, defamatory,
                or rights-infringing purposes.
              </li>
              <li>
                Circumvent rate limits, abuse the free tier, reverse-engineer
                the platform, or interfere with our infrastructure.
              </li>
              <li>
                Upload malware, viruses, or non-audio files disguised as media.
              </li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate
              these rules without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              5. Payment & Billing
            </h2>
            <p>
              Pro plan subscriptions are billed through Polar.sh. Fees are
              charged in advance on a monthly ($12/month) or annual ($99/year)
              basis. Subscriptions automatically renew unless cancelled before
              the renewal date. You may cancel at any time; cancellation takes
              effect at the end of the current billing period. Downgrading from
              Pro to Free does not entitle you to a prorated refund for the
              current period unless otherwise required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              6. Refund Policy
            </h2>
            <p>
              If you experience a technical issue or believe you were charged
              incorrectly, contact us at{" "}
              <a
                href="mailto:[CONTACT_EMAIL]"
                className="text-[#111] underline underline-offset-4 decoration-[#ddd] hover:decoration-[#111] transition-colors"
              >
                [CONTACT_EMAIL]
              </a>{" "}
              within 14 days of purchase. Approved refunds are issued at our
              discretion and subject to applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              7. Content & Intellectual Property
            </h2>
            <p className="mb-3">
              <strong className="text-[#555]">Your content:</strong> You retain
              all ownership rights to the audio, video, and transcripts you
              create. We do not claim any license to your content beyond what is
              strictly necessary to operate the Service (store, process,
              display, and export your files).
            </p>
            <p>
              <strong className="text-[#555]">Our IP:</strong> The PLAIN name,
              logo, software, code, and UI are owned by PLAIN and its operator.
              You may not copy, modify, distribute, or create derivative works
              from our platform without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              8. Accuracy & Disclaimer
            </h2>
            <p>
              AI transcription is inherently probabilistic and may contain
              errors, omissions, or misattributions — particularly with accented
              speech, overlapping voices, background noise, or low-quality
              audio. The "balanced" model trades accuracy for speed. You are
              solely responsible for verifying transcripts before relying on
              them for legal, medical, financial, or safety-critical purposes.
              The Service is provided{" "}
              <strong className="text-[#555]">"AS IS"</strong> and{" "}
              <strong className="text-[#555]">"AS AVAILABLE"</strong> without
              warranties of any kind, express or implied, including
              merchantability, fitness for a particular purpose, or
              non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              9. Service Availability
            </h2>
            <p>
              We do not guarantee uninterrupted or error-free operation of the
              Service. Features may change, be suspended, or be discontinued at
              any time. We are not liable for outages, delays, or failures
              caused by third-party APIs (including Deepgram, Gemini, or
              Supabase), network issues, or force majeure events.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              10. Termination
            </h2>
            <p className="mb-3">
              <strong className="text-[#555]">By you:</strong> You may delete
              your account at any time via the account-deletion endpoint. Your
              active account data and stored content will be scheduled for
              deletion and removed from production systems. This action is
              irreversible.
            </p>
            <p>
              <strong className="text-[#555]">By us:</strong> We may suspend or
              terminate your access for non-payment, violation of these Terms,
              or if required by law. Termination does not affect accrued rights
              or obligations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              11. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, PLAIN and its operator
              shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages, including lost profits, data
              loss, or business interruption, arising out of or related to your
              use of the Service. Our total aggregate liability shall not exceed
              the greater of (a) the amount you paid us in the 12 months
              preceding the claim, or (b) if you are using the free tier, the
              maximum extent permitted by law. Some jurisdictions do not allow
              the exclusion or limitation of liability, so the above may not
              apply to you.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              12. Indemnification
            </h2>
            <p>
              You agree to indemnify and hold harmless PLAIN and its operator
              from any claims, damages, losses, or expenses (including
              reasonable legal fees) arising out of your use of the Service,
              your content, or your violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              13. Governing Law
            </h2>
            <p>
              These Terms are governed by the laws of the Republic of South
              Africa, without regard to its conflict-of-law provisions. Any
              dispute arising from these Terms shall be resolved exclusively in
              the courts of Gauteng, South Africa. If you are a consumer in the
              European Union, you retain any mandatory statutory protections
              under your local law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              14. Export Compliance
            </h2>
            <p>
              You may not use the Service where prohibited by applicable law or
              sanctions regulations. You are responsible for ensuring your use
              complies with all local laws in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              15. Changes
            </h2>
            <p>
              We may modify these Terms from time to time. Material changes will
              be posted on this page with an updated "Last updated" date and,
              where significant, notified by email at least 30 days before
              taking effect. Continued use of the Service after changes
              constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              16. Severability
            </h2>
            <p>
              If any provision of these Terms is found unenforceable or invalid,
              that provision will be limited or eliminated to the minimum extent
              necessary, and the remaining provisions will remain in full force
              and effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              17. Contact
            </h2>
            <p>
              For legal notices, questions, or disputes:{" "}
              <a
                href="mailto:[CONTACT_EMAIL]"
                className="text-[#111] underline underline-offset-4 decoration-[#ddd] hover:decoration-[#111] transition-colors"
              >
                [CONTACT_EMAIL]
              </a>
            </p>
          </section>

          <p className="font-mono text-[10px] text-[#ccc] tracking-wider pt-10 border-t border-[#f5f5f5]">
            Last updated: May 2026
          </p>
        </div>
      </div>
    </div>
  );
}
