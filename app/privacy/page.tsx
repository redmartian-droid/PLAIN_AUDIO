"use client";

import { Header } from "@/components/Header";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-[#111] antialiased selection:bg-[#f5f5f5]">
      <Header />

      <div className="max-w-3xl mx-auto px-6 pt-24 pb-40">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#aaa] mb-6">
          Legal
        </p>
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-normal tracking-tight leading-[1.1] mb-12">
          Privacy Policy
        </h1>

        <div className="text-sm text-[#999] leading-[1.8] space-y-10">
          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              1. Overview
            </h2>
            <p>
              This Privacy Policy describes how PLAIN ("we", "us", or "our"),
              operated by [YOUR_FULL_LEGAL_NAME], a sole proprietor based in
              South Africa, collects, uses, and protects your personal data when
              you use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              2. Data We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-[#555]">Account data:</strong> email
                address, authentication credentials (managed by Supabase Auth),
                user ID, plan tier, and daily usage counters.
              </li>
              <li>
                <strong className="text-[#555]">Content data:</strong> audio and
                video files you upload, URLs you submit, generated transcripts
                (raw and cleaned), speaker labels, timestamps, detected
                language, duration, word count, and file metadata (original
                filename, MIME type, size).
              </li>
              <li>
                <strong className="text-[#555]">Technical data:</strong> IP
                address, request timestamps, and essential session cookies
                required for authentication.
              </li>
              <li>
                <strong className="text-[#555]">Payment data:</strong> we do not
                store credit card numbers. Payment processing is handled by
                Polar.sh, which receives your plan selection and billing details
                directly.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              3. How We Use Your Data
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                To transcribe, store, and display your audio and transcripts.
              </li>
              <li>
                To enforce plan limits (e.g., 3 free transcriptions per day,
                file size caps).
              </li>
              <li>
                To repair and normalize raw transcription output for the
                "accurate" model.
              </li>
              <li>To maintain account security and prevent abuse.</li>
              <li>
                To communicate essential service updates (no marketing emails).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              4. Legal Basis
            </h2>
            <p className="mb-3">
              We process personal data on the following legal bases:
              <strong className="text-[#555]">
                {" "}
                Contractual necessity
              </strong>{" "}
              (to provide the Service),{" "}
              <strong className="text-[#555]">legitimate interest</strong>{" "}
              (security, fraud prevention), and{" "}
              <strong className="text-[#555]">consent</strong> (where explicitly
              requested).
            </p>
            <p>
              Where applicable, we also process personal information in
              accordance with the South African{" "}
              <strong className="text-[#555]">
                Protection of Personal Information Act (POPIA)
              </strong>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              5. Third-Party Processors
            </h2>
            <p className="mb-3">
              We share only the minimum data necessary with the following
              subprocessors:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-[#555]">Supabase, Inc. (EU):</strong>{" "}
                database hosting, authentication, and object storage in the{" "}
                <code>eu-west-1</code> region. All data is encrypted at rest
                (AES-256) and in transit (TLS 1.2+).
              </li>
              <li>
                <strong className="text-[#555]">Deepgram, Inc. (USA):</strong>{" "}
                speech-to-text processing for the "accurate" model. Audio bytes
                or URLs are transmitted with speaker-count settings. Deepgram
                processes audio data for transcription purposes in accordance
                with its privacy and data processing policies.
              </li>
              <li>
                <strong className="text-[#555]">Google LLC (USA):</strong>{" "}
                transcription and repair via the Gemini API for the "balanced"
                model. Uploaded Gemini File API assets are scheduled for
                deletion after processing. Transcript text is sent for
                repair/normalization.
              </li>
              <li>
                <strong className="text-[#555]">
                  Polar.sh (Sweden / USA):
                </strong>{" "}
                subscription billing and checkout. We receive only your
                subscription status and plan tier, never payment instrument
                details.
              </li>
              <li>
                <strong className="text-[#555]">YouTube:</strong> when you
                provide a YouTube URL, we fetch publicly available caption
                tracks directly from YouTube's servers. No account linkage or
                data sharing occurs.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              6. Data Retention
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-[#555]">Free plan:</strong> audio files
                and transcripts are retained for 7 days from upload, then
                removed from production systems.
              </li>
              <li>
                <strong className="text-[#555]">Pro plan:</strong> retained
                until you manually delete them or delete your account.
              </li>
              <li>
                <strong className="text-[#555]">Account deletion:</strong>{" "}
                invoking the account-deletion endpoint schedules all
                transcriptions, folders, profile data, and auth records for
                removal from production systems. This action is irreversible.
              </li>
              <li>
                Deleted data may persist temporarily in encrypted backups before
                permanent removal.
              </li>
              <li>
                Anonymized usage statistics (e.g., aggregate transcription
                counts) may be retained indefinitely for capacity planning.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              7. Your Rights
            </h2>
            <p className="mb-3">
              Depending on your jurisdiction, you may have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate or incomplete data.</li>
              <li>
                Delete your data (via account deletion or by contacting us).
              </li>
              <li>Export your data in a machine-readable format.</li>
              <li>Restrict or object to certain processing activities.</li>
              <li>Withdraw consent where applicable.</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at{" "}
              <a
                href="mailto:[CONTACT_EMAIL]"
                className="text-[#111] underline underline-offset-4 decoration-[#ddd] hover:decoration-[#111] transition-colors"
              >
                [CONTACT_EMAIL]
              </a>
              . We respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              8. Security
            </h2>
            <p>
              We implement Row Level Security (RLS) on all database tables,
              enforce TLS for all network traffic, and store audio files in
              private Supabase Storage buckets accessible only to authorized
              authenticated users through Row Level Security policies and
              private storage controls. Authentication credentials are securely
              managed by Supabase Auth using industry-standard encryption and
              hashing mechanisms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              9. Cookies & Tracking
            </h2>
            <p>
              We use only essential authentication cookies (Supabase). We do not
              use advertising trackers, behavioral profiling systems, or
              third-party analytics platforms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              10. International Transfers
            </h2>
            <p>
              Your data is primarily stored in the European Economic Area (EEA)
              via Supabase infrastructure hosted in the <code>eu-west-1</code>{" "}
              region. Certain subprocessors, including Google and Deepgram, may
              process data in the United States. We rely on Standard Contractual
              Clauses (SCCs) and adequacy decisions to ensure lawful transfers
              from the EEA, UK, and Switzerland.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              11. Content Ownership
            </h2>
            <p>
              You retain ownership of the audio, video, and transcript content
              you upload to the Service. We do not claim any license to your
              content beyond what is strictly necessary to operate the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              12. Changes
            </h2>
            <p>
              We may update this policy to reflect changes in our practices or
              legal obligations. Material changes will be notified via email or
              in-app notice at least 30 days before taking effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-[#111] mb-4">
              13. Contact
            </h2>
            <p>
              Questions or data subject requests:{" "}
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
