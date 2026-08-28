import { Lock, ClipboardCheck, Users, ShieldCheck, Eye, KeyRound } from "lucide-react";

const trustItems = [
  {
    icon: <Lock className="w-6 h-6" />,
    title: "End-to-End Encryption",
    description:
      "All data in transit and at rest is encrypted. Patient records, triage data, and prescriptions are never exposed.",
  },
  {
    icon: <ClipboardCheck className="w-6 h-6" />,
    title: "Immutable Audit Logs",
    description:
      "Every action on the platform — AI output, reviewer decisions, record edits — is permanently logged and cannot be altered.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Role-Based Access Control",
    description:
      "Patients, doctors, reviewers, and admins each see only what their role permits. Zero cross-role data leakage.",
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Human-Verified Decisions",
    description:
      "No AI output reaches a patient without human review. Our HITL layer is mandatory, not optional.",
  },
  {
    icon: <Eye className="w-6 h-6" />,
    title: "Transparent AI",
    description:
      "AI triage results are always presented alongside confidence scores and are clearly labelled as AI-generated.",
  },
  {
    icon: <KeyRound className="w-6 h-6" />,
    title: "Secure Authentication",
    description:
      "Role-specific authentication with session management. All credentials are hashed and never stored in plain text.",
  },
];

const badges = [
  "Data Encrypted at Rest",
  "AI + Human Review Separation",
  "No Shared Records Across Roles",
  "Audit Trail on Every Action",
];

export default function TrustSecuritySection() {
  return (
    <section
      id="security"
      className="section-padding"
      style={{ background: "#f8fdfe" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Label */}
        <div className="flex items-center gap-3 mb-5">
          <span className="w-8 h-0.5 rounded-full" style={{ background: "#0d7a8a" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#0d7a8a" }}>
            Trust & Security
          </span>
        </div>

        {/* Heading */}
        <div className="grid lg:grid-cols-2 gap-8 items-end mb-16">
          <h2
            className="text-4xl lg:text-5xl font-bold leading-tight"
            style={{ color: "#052a30", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.025em" }}
          >
            Security isn't
            <br />
            an afterthought.
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "#4a6670" }}>
            Healthcare demands the highest standard of data protection. Sanjeevani is built with security and accountability at every layer.
          </p>
        </div>

        {/* Security grid — glassmorphism */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustItems.map((item) => (
            <div
              key={item.title}
              className="group p-7 rounded-2xl hover:-translate-y-1 transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.65)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1px solid rgba(13,122,138,0.13)",
                boxShadow: "0 2px 20px rgba(13,122,138,0.06), 0 1px 0 rgba(255,255,255,0.95) inset",
              }}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{
                  background: "rgba(13,122,138,0.1)",
                  backdropFilter: "blur(8px)",
                  color: "#0d7a8a",
                }}
              >
                {item.icon}
              </div>

              <h3
                className="text-base font-bold mb-2.5"
                style={{ color: "#052a30", fontFamily: "'DM Sans', sans-serif" }}
              >
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#5a7a84" }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom badge strip — glassmorphism pills */}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          {badges.map((badge) => (
            <span
              key={badge}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                color: "#0a5561",
                border: "1px solid rgba(13,122,138,0.2)",
                boxShadow: "0 1px 8px rgba(13,122,138,0.06)",
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
