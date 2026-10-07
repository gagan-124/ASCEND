import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock, Camera, Eye, Cpu, Database, FileText } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
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
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-stardom uppercase tracking-tight text-foreground">
            ASCEND Privacy Policy
          </h1>
          <p className="text-sm text-foreground/70 leading-relaxed">
            This Privacy Policy describes how ASCEND collects, uses, processes, and protects your information when you access or use our AI-powered mock interview platform and ATS resume evaluation tools.
          </p>
        </div>

        {/* Document Content Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-foreground/80 leading-relaxed font-sans">
          {/* Section 1: Overview & Entity */}
          <section className="p-6 rounded-2xl bg-surface border border-border/40 space-y-3">
            <h2 className="text-base font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              1. Platform Overview & Project Scope
            </h2>
            <p>
              ASCEND is an academic and student project developed and operated by <strong className="text-foreground">Gagan</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). ASCEND is an AI-powered mock interview platform designed to help users practice and evaluate their interview performance. This platform is a personal educational project and is not an incorporated business entity. This policy applies to all users accessing the ASCEND web application under the governing laws of <strong className="text-foreground">Andhra Pradesh, India</strong>.
            </p>
          </section>

          {/* Section 2: Information Collected */}
          <section className="p-6 rounded-2xl bg-surface border border-border/40 space-y-4">
            <h2 className="text-base font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              2. Information We Collect
            </h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-mono font-bold text-xs uppercase text-foreground">A. Account & Profile Information</h3>
                <p className="text-xs text-foreground/70">
                  When you register for an account, we collect your email address, authentication credentials managed via Supabase Auth, and profile settings (e.g. target job role, experience level, practice preferences).
                </p>
              </div>
              <div>
                <h3 className="font-mono font-bold text-xs uppercase text-foreground">B. Interview Session & Response Data</h3>
                <p className="text-xs text-foreground/70">
                  During practice interviews, we process your verbal responses (transcribed to text via browser Web Speech services), question selections, difficulty settings, and AI-generated performance evaluations.
                </p>
              </div>
              <div>
                <h3 className="font-mono font-bold text-xs uppercase text-foreground">C. Resume & ATS Evaluation Uploads</h3>
                <p className="text-xs text-foreground/70">
                  If you use the ATS Evaluator, we process uploaded PDF or DOCX resume documents to extract work history, skills, and qualifications for role matching analysis.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Camera, Microphone & Local Face Detection */}
          <section className="p-6 rounded-2xl bg-surface border border-border/40 space-y-4">
            <h2 className="text-base font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Camera className="w-4 h-4 text-rose-500" />
              3. Camera, Microphone & Face Proctoring Disclosures
            </h2>
            <div className="space-y-3">
              <p>
                ASCEND requires camera and microphone permissions solely to conduct proctored practice interviews and audio calibration.
              </p>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                <span className="font-mono font-bold uppercase block text-amber-100">
                  CRITICAL PRIVACY DISCLOSURE: LOCAL FACE PRESENCE DETECTION ONLY
                </span>
                <p>
                  ASCEND performs face-presence validation <strong>100% locally in your browser</strong> using Google MediaPipe Tasks Vision (WebAssembly runtime).
                </p>
                <ul className="list-disc list-inside space-y-1 text-amber-200/90">
                  <li><strong>NO Facial Biometrics Stored:</strong> We do NOT create, extract, store, or upload facial recognition embeddings or biometric identities.</li>
                  <li><strong>NO Camera Frame Uploads:</strong> Live camera video streams and raw image frames never leave your local device.</li>
                  <li><strong>Single-Person Check:</strong> The local face detector verifies only that exactly one human face is visible in the camera frame to maintain proctoring integrity.</li>
                  <li><strong>Proctoring Events:</strong> We record only high-level proctoring event metadata (e.g. tab switches, camera state toggles, missing face events).</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4: AI Processing Disclosures */}
          <section className="p-6 rounded-2xl bg-surface border border-border/40 space-y-3">
            <h2 className="text-base font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-500" />
              4. AI Interaction & Evaluation Disclosure
            </h2>
            <p>
              ASCEND utilizes artificial intelligence algorithms for conversational mock interview interactions, transcript evaluations, scoring heuristics, and resume ATS analysis.
            </p>
            <p className="text-xs text-foreground/70">
              <strong>AI Disclaimer:</strong> AI-generated evaluations, scores, and feedback are practice and developmental aids. They do not constitute guaranteed hiring outcomes, official employment decisions, or certified legal advice.
            </p>
          </section>

          {/* Section 5: Third-Party Infrastructure */}
          <section className="p-6 rounded-2xl bg-surface border border-border/40 space-y-3">
            <h2 className="text-base font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              5. Third-Party Service Providers
            </h2>
            <p>
              We integrate trusted third-party cloud infrastructure providers to operate the ASCEND platform:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-foreground/70">
              <li><strong>Supabase:</strong> User authentication, database storage, and session management.</li>
              <li><strong>Vercel:</strong> Static asset hosting, SPA routing, and edge delivery network.</li>
              <li><strong>Google MediaPipe:</strong> Client-side local WebAssembly vision detection library.</li>
              <li><strong>Web Speech API:</strong> Native browser voice synthesis and speech recognition.</li>
            </ul>
          </section>

          {/* Section 6: Data Rights & Account Deletion */}
          <section className="p-6 rounded-2xl bg-surface border border-border/40 space-y-3">
            <h2 className="text-base font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Eye className="w-4 h-4 text-teal-500" />
              6. Data Rights & Deletion Requests
            </h2>
            <p>
              You have the right to request access to your personal data, request correction of inaccurate data, or request deletion of your account and interview history.
            </p>
            <p className="text-xs text-foreground/70">
              To exercise your data rights or request account deletion, please contact <strong className="text-foreground">Gagan</strong> at <a href="mailto:gsram247@gmail.com" className="text-foreground underline font-medium">gsram247@gmail.com</a>.
            </p>
          </section>

          {/* Section 7: Updates & Contact */}
          <section className="p-6 rounded-2xl bg-surface border border-border/40 space-y-3">
            <h2 className="text-base font-mono font-bold uppercase tracking-wider text-foreground">
              7. Contact Information & Policy Updates
            </h2>
            <p>
              We reserve the right to update this Privacy Policy as our project features evolve. Material changes will be posted on this page with an updated effective date.
            </p>
            <p className="text-xs text-foreground/70 font-mono">
              Contact: gsram247@gmail.com • Project Developer: Gagan (Andhra Pradesh, India)
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
