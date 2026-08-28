import { useState } from "react";
import { Check, User, Stethoscope, ClipboardCheck } from "lucide-react";

const roles = [
  {
    id: "patient",
    label: "For Patients",
    icon: <User className="w-5 h-5" />,
    tagline: "Your health, prioritised.",
    benefits: [
      "Guided symptom intake — no medical jargon required",
      "AI triage result reviewed by a certified professional",
      "Matched with the most relevant available doctor",
      "Easy appointment booking within the platform",
      "Secure access to your consultation records",
      "Prescription history in one place",
    ],
    colour: "#0d7a8a",
    cardBg: "linear-gradient(135deg, rgba(230,248,250,0.85) 0%, rgba(214,248,252,0.75) 100%)",
    cardBorder: "rgba(13,122,138,0.18)",
    accent: "#0fa3b8",
  },
  {
    id: "doctor",
    label: "For Doctors",
    icon: <Stethoscope className="w-5 h-5" />,
    tagline: "Focus on what matters — care.",
    benefits: [
      "Verified professional profile and speciality listing",
      "Receive pre-triaged, reviewed patient cases",
      "Manage availability and appointment schedule",
      "Conduct consultations within the platform",
      "Create structured diagnosis and prescriptions",
      "Access full patient history in context",
    ],
    colour: "#0a5561",
    cardBg: "linear-gradient(135deg, rgba(220,245,248,0.85) 0%, rgba(205,240,246,0.75) 100%)",
    cardBorder: "rgba(10,85,97,0.18)",
    accent: "#0d7a8a",
  },
  {
    id: "reviewer",
    label: "For Reviewers",
    icon: <ClipboardCheck className="w-5 h-5" />,
    tagline: "The safety layer between AI and care.",
    benefits: [
      "Review AI triage outputs with full context",
      "Accept, correct, reject, or escalate each case",
      "Your decision is final and audit-logged",
      "Structured review interface — no guesswork",
      "Contribute to AI model feedback loop",
      "Clear escalation path for critical cases",
    ],
    colour: "#083d47",
    cardBg: "linear-gradient(135deg, rgba(215,242,246,0.85) 0%, rgba(202,238,245,0.75) 100%)",
    cardBorder: "rgba(8,61,71,0.18)",
    accent: "#0a5561",
  },
];

export default function BenefitsSection() {
  const [activeRole, setActiveRole] = useState("patient");
  const current = roles.find((r) => r.id === activeRole);

  return (
    <section
      id="benefits"
      className="section-padding"
      style={{ background: "#f8fdfe" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Label */}
        <div className="flex items-center gap-3 mb-5">
          <span className="w-8 h-0.5 rounded-full" style={{ background: "#0d7a8a" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#0d7a8a" }}>
            Built for Everyone
          </span>
        </div>

        {/* Heading */}
        <div className="mb-12">
          <h2
            className="text-4xl lg:text-5xl font-bold leading-tight mb-4"
            style={{ color: "#052a30", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.025em" }}
          >
            Designed for every
            <br />
            role in the journey.
          </h2>
          <p className="text-lg max-w-xl" style={{ color: "#4a6670" }}>
            Sanjeevani is built around three distinct roles — each with a purpose-designed experience.
          </p>
        </div>

        {/* Role Tabs */}
        <div
          className="inline-flex gap-1 p-1 rounded-full mb-12"
          role="tablist"
          style={{
            background: "rgba(230,248,250,0.7)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(13,122,138,0.12)",
          }}
        >
          {roles.map((role) => (
            <button
              key={role.id}
              id={`tab-${role.id}`}
              role="tab"
              aria-selected={activeRole === role.id}
              aria-controls={`panel-${role.id}`}
              onClick={() => setActiveRole(role.id)}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
              style={{
                background: activeRole === role.id ? current.colour : "transparent",
                color: activeRole === role.id ? "#fff" : "#4a6670",
                boxShadow: activeRole === role.id ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
              }}
            >
              <span
                style={{ color: activeRole === role.id ? "rgba(255,255,255,0.8)" : "#0d7a8a" }}
              >
                {role.icon}
              </span>
              {role.label}
            </button>
          ))}
        </div>

        {/* Active Panel */}
        <div
          id={`panel-${current.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${current.id}`}
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          {/* Left — Tagline + benefits */}
          <div>
            <p
              className="text-2xl font-bold mb-8"
              style={{ color: current.colour, fontFamily: "'DM Sans', sans-serif" }}
            >
              {current.tagline}
            </p>
            <ul className="flex flex-col gap-4">
              {current.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: current.accent, color: "#fff" }}
                  >
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </div>
                  <span className="text-base" style={{ color: "#1a3540" }}>
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — Glassmorphism visual card (no emoji watermark) */}
          <div
            className="rounded-3xl p-10 flex flex-col justify-between min-h-[340px] relative overflow-hidden"
            style={{
              background: current.cardBg,
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: `1px solid ${current.cardBorder}`,
              boxShadow: "0 8px 40px rgba(13,122,138,0.1), 0 1px 0 rgba(255,255,255,0.9) inset",
            }}
          >
            {/* Abstract geometric backdrop — no emoji */}
            <div
              className="absolute bottom-0 right-0 w-48 h-48 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${current.colour}18 0%, transparent 70%)`,
                transform: "translate(30%, 30%)",
              }}
              aria-hidden="true"
            />
            <div
              className="absolute top-4 right-4 w-24 h-24 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${current.colour}10 0%, transparent 70%)`,
              }}
              aria-hidden="true"
            />

            <div>
              {/* Role icon badge */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                style={{
                  background: "rgba(255,255,255,0.65)",
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${current.cardBorder}`,
                  color: current.colour,
                }}
              >
                <div className="scale-125">{current.icon}</div>
              </div>
              <p
                className="text-3xl font-bold leading-snug"
                style={{ color: current.colour, fontFamily: "'DM Sans', sans-serif" }}
              >
                {current.label.replace("For ", "")}
                <br />
                experience.
              </p>
            </div>

            <p className="text-sm leading-relaxed mt-6" style={{ color: "#2a5560" }}>
              {current.tagline}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
