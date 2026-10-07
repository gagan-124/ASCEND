import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, FileText, CheckCircle2, AlertTriangle, Scale, Lock } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 font-sans select-text">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Back */}
        <div className="flex items-center justify-between border-b border-border/30 pb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to ASCEND Home</span>
          </Link>
          <span className="text-[11px] font-mono text-foreground/50 uppercase tracking-widest">
            Version 1.0 • Effective: Oct 8, 2026
          </span>
        </div>

        {/* Document Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-mono font-semibold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            <span>Terms & Conditions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-stardom uppercase tracking-tight text-foreground">
            Terms of Use & Service Agreement
          </h1>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Please review these Terms & Conditions carefully before using the ASCEND platform. ASCEND is an AI-powered mock interview platform designed to help users practice and evaluate their interview performance. By creating an account or accessing our services, you agree to be bound by this agreement under the governing laws of <strong className="text-foreground">Andhra Pradesh, India</strong>.
          </p>
        </div>

        {/* Document Content Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-foreground/80 leading-relaxed font-sans">
          {/* Section 1: Acceptance & Scope */}
          <section className="p-6 rounded-2xl bg-surface border border-border/40 space-y-3">
            <h2 className="text-base font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              1. Acceptance of Terms & Student Project Notice
            </h2>
            <p>
              ASCEND is an academic and student project developed and operated by <strong className="text-foreground">Gagan</strong>. It is designed solely as an educational practice tool and personal project, not an incorporated corporate entity. By accessing ASCEND, you represent that you are at least 18 years old or the age of legal majority in your jurisdiction. You agree to provide accurate registration information and maintain the security of your account credentials.
            </p>
          </section>

          {/* Section 2: Interview Proctoring & Code of Conduct */}
          <section className="p-6 rounded-2xl bg-surface border border-border/40 space-y-4">
            <h2 className="text-base font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              2. Interview Integrity & Proctoring Rules
            </h2>
            <p>
              ASCEND provides AI-proctored mock interviews to simulate real-world technical and behavioral evaluations. To maintain session integrity, you agree to adhere to the following proctoring rules during an active practice session:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-foreground/70">
              <li><strong>Camera & Microphone Enablement:</strong> Keep your camera and microphone enabled throughout the practice session.</li>
              <li><strong>Single Human Face:</strong> Ensure exactly one visible human face remains centered in the camera frame.</li>
              <li><strong>Fullscreen Mode:</strong> Remain in full-screen mode during the mock interview.</li>
              <li><strong>No Tab Switching:</strong> Do not minimize the window or navigate to other browser tabs.</li>
              <li><strong>No Cheating / Assistance:</strong> Do not receive third-party assistance or use unauthorized aids during proctored sessions.</li>
            </ul>
            <p className="text-xs text-foreground/70">
              Repeated proctoring violations (such as disabling your camera or persistent absence from the frame) may result in automatic session termination.
            </p>
          </section>

          {/* Section 3: AI Disclaimer & Limitations */}
          <section className="p-6 rounded-2xl bg-surface border border-border/40 space-y-3">
            <h2 className="text-base font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              3. AI Evaluation Disclaimer & No Employment Guarantee
            </h2>
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-2">
              <span className="font-mono font-bold uppercase block">
                IMPORTANT LEGAL DISCLAIMER: PRACTICE & PREPARATION TOOL ONLY
              </span>
              <p>
                ASCEND is an educational practice tool. AI-generated feedback, scores, transcripts, and ATS compatibility reports do NOT guarantee job placement, successful hiring outcomes, or professional certification.
              </p>
              <p>
                AI systems may occasionally produce inaccurate, incomplete, or biased outputs. Users should independently review all feedback.
              </p>
            </div>
          </section>

          {/* Section 4: Acceptable Use & Intellectual Property */}
          <section className="p-6 rounded-2xl bg-surface border border-border/40 space-y-3">
            <h2 className="text-base font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-500" />
              4. Acceptable Use & Intellectual Property Rights
            </h2>
            <p>
              All software, UI designs, trademarks, AI prompt architectures, and branding elements associated with ASCEND are the intellectual property of <strong className="text-foreground">Gagan</strong>.
            </p>
            <p className="text-xs text-foreground/70">
              You agree not to reverse engineer, decompile, scrape, automate attacks against, or resell access to the ASCEND platform or its underlying AI APIs.
            </p>
          </section>

          {/* Section 5: Limitation of Liability */}
          <section className="p-6 rounded-2xl bg-surface border border-border/40 space-y-3">
            <h2 className="text-base font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-500" />
              5. Limitation of Liability & Termination
            </h2>
            <p>
              To the maximum extent permitted by law, ASCEND and developer <strong className="text-foreground">Gagan</strong> shall not be liable for any indirect, incidental, or consequential damages resulting from your use or inability to use the platform. We reserve the right to suspend or terminate accounts that violate our acceptable use or proctoring policies.
            </p>
          </section>

          {/* Section 6: Contact */}
          <section className="p-6 rounded-2xl bg-surface border border-border/40 space-y-3">
            <h2 className="text-base font-mono font-bold uppercase tracking-wider text-foreground">
              6. Governing Law & Contact Details
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of <strong className="text-foreground">Andhra Pradesh, India</strong>.
            </p>
            <p className="text-xs text-foreground/70 font-mono">
              For questions regarding these Terms: <a href="mailto:gsram247@gmail.com" className="text-foreground underline font-medium">gsram247@gmail.com</a> • Project Developer: Gagan (ASCEND AI Mock Interviews)
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
