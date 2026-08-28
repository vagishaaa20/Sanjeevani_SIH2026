import { Brain, UserCheck, Stethoscope, ShieldAlert } from "lucide-react";

const features = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: "Symptom Analysis",
    description:
      "Our AI processes your submitted symptoms against a curated medical knowledge base to identify patterns and flag potential conditions — instantly.",
    colour: "#0d7a8a",
    accentBorder: "rgba(13,122,138,0.25)",
  },
  {
    icon: <UserCheck className="w-6 h-6" />,
    title: "Triage Prediction",
    description:
      "Based on symptom severity and urgency indicators, the system generates a preliminary triage recommendation — but never a final diagnosis.",
    colour: "#0a5561",
    accentBorder: "rgba(10,85,97,0.2)",
  },
  {
    icon: <Stethoscope className="w-6 h-6" />,
    title: "Smart Doctor Matching",
    description:
      "After triage is confirmed by a human reviewer, Sanjeevani surfaces the most relevant available doctors by speciality, proximity, and availability.",
    colour: "#0fa3b8",
    accentBorder: "rgba(15,163,184,0.25)",
  },
];

export default function AIExplanationSection() {
  return (
    <section
      id="ai-explanation"
      className="section-padding"
      style={{ background: "#f0fafb" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Label */}
        <div className="flex items-center gap-3 mb-5">
          <span className="w-8 h-0.5 rounded-full" style={{ background: "#0d7a8a" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#0d7a8a" }}>
            AI-Assisted Care
          </span>
        </div>

        {/* Heading + Sub */}
        <div className="grid lg:grid-cols-2 gap-8 items-end mb-16">
          <h2
            className="text-4xl lg:text-5xl font-bold leading-tight"
            style={{ color: "#052a30", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.025em" }}
          >
            AI assists.
            <br />
            Humans decide.
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "#4a6670" }}>
            Sanjeevani uses AI as a powerful first-line tool — not the final word. Every AI output is traceable, auditable, and reviewed by a certified medical professional before it reaches you.
          </p>
        </div>

        {/* Feature Cards — glassmorphism on tinted bg */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative p-7 rounded-2xl hover:-translate-y-1 transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.65)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: `1px solid ${f.accentBorder}`,
                boxShadow: "0 4px 24px rgba(13,122,138,0.08), 0 1px 0 rgba(255,255,255,0.9) inset",
              }}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{
                  background: "rgba(13,122,138,0.1)",
                  backdropFilter: "blur(8px)",
                  color: f.colour,
                }}
              >
                {f.icon}
              </div>

              {/* Accent line */}
              <div
                className="w-8 h-0.5 rounded mb-4 transition-all duration-300 group-hover:w-16"
                style={{ background: f.colour }}
              />

              <h3
                className="text-lg font-bold mb-3"
                style={{ color: "#052a30", fontFamily: "'DM Sans', sans-serif" }}
              >
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#5a7a84" }}>
                {f.description}
              </p>
            </div>
          ))}
        </div>

        {/* Disclaimer strip — glassmorphism, no emoji */}
        <div
          className="mt-10 px-6 py-4 rounded-2xl flex items-start gap-4"
          style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(13,122,138,0.18)",
            boxShadow: "0 2px 12px rgba(13,122,138,0.06)",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: "rgba(13,122,138,0.1)", color: "#0d7a8a" }}
          >
            <ShieldAlert className="w-4 h-4" />
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#0a5561" }}>
            <strong>Important:</strong> Sanjeevani is not a substitute for professional medical care. AI triage results are preliminary and must be reviewed by a Human-in-the-Loop reviewer before being presented to patients.
          </p>
        </div>
      </div>
    </section>
  );
}
