import {
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowUpRight,
  User,
  Bot,
  ClipboardCheck,
  Stethoscope,
  Search,
} from "lucide-react";

const flowSteps = [
  { label: "Patient", icon: <User className="w-6 h-6" />, sub: "Submits symptoms" },
  { label: "AI Triage", icon: <Bot className="w-6 h-6" />, sub: "Analyses & scores" },
  { label: "HITL Reviewer", icon: <ClipboardCheck className="w-6 h-6" />, sub: "Validates & decides" },
  { label: "Doctor", icon: <Stethoscope className="w-6 h-6" />, sub: "Receives case" },
];

const reviewerActions = [
  {
    icon: <CheckCircle2 className="w-5 h-5" />,
    label: "Accept",
    desc: "AI result is accurate — passed forward as-is.",
    colour: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.2)",
  },
  {
    icon: <RotateCcw className="w-5 h-5" />,
    label: "Correct",
    desc: "Reviewer adjusts the AI output before forwarding.",
    colour: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.2)",
  },
  {
    icon: <AlertCircle className="w-5 h-5" />,
    label: "Reject",
    desc: "AI result is rejected; reviewer re-triages manually.",
    colour: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.2)",
  },
  {
    icon: <ArrowUpRight className="w-5 h-5" />,
    label: "Escalate",
    desc: "Case is critical — escalated for immediate attention.",
    colour: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
    border: "rgba(139,92,246,0.2)",
  },
];

export default function HITLSection() {
  return (
    <section
      id="hitl"
      className="section-padding"
      style={{
        background: "linear-gradient(160deg, #052a30 0%, #083d47 50%, #0a5561 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Label */}
        <div className="flex items-center gap-3 mb-5">
          <span className="w-8 h-0.5 rounded-full bg-teal-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-teal-300">
            Human-in-the-Loop
          </span>
        </div>

        {/* Heading */}
        <div className="grid lg:grid-cols-2 gap-10 items-start mb-16">
          <h2
            className="text-4xl lg:text-5xl font-bold text-white leading-tight"
            style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.025em" }}
          >
            Every AI result
            <br />
            is human-verified.
          </h2>
          <p className="text-white/65 text-lg leading-relaxed pt-1">
            Our HITL reviewers — certified medical professionals — independently evaluate every AI triage output before it reaches a patient or doctor. Their decision is final, auditable, and legally accountable.
          </p>
        </div>

        {/* Flow Diagram — glassmorphism nodes */}
        <div className="flex flex-wrap justify-center items-center gap-0 mb-14">
          {flowSteps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-2 px-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#5ddcee",
                  }}
                >
                  {step.icon}
                </div>
                <span className="text-white font-semibold text-sm text-center">{step.label}</span>
                <span className="text-white/45 text-xs text-center">{step.sub}</span>
              </div>
              {i < flowSteps.length - 1 && (
                <div className="flex items-center gap-0.5 mb-6">
                  <div className="w-8 h-0.5 bg-teal-400/40" />
                  <div className="w-0 h-0 border-y-4 border-y-transparent border-l-8 border-l-teal-400/40" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reviewer action cards — glassmorphism */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reviewerActions.map((action) => (
            <div
              key={action.label}
              className="p-5 rounded-2xl hover:-translate-y-0.5 transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.07)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: `1px solid ${action.border}`,
                boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: action.bg, color: action.colour }}
              >
                {action.icon}
              </div>
              <h3 className="text-white font-bold text-base mb-1.5">{action.label}</h3>
              <p className="text-white/55 text-sm leading-snug">{action.desc}</p>
            </div>
          ))}
        </div>

        {/* Audit note — glassmorphism, no emoji */}
        <div
          className="mt-10 flex items-start gap-4 p-5 rounded-2xl"
          style={{
            background: "rgba(15,163,184,0.1)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(15,163,184,0.25)",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: "rgba(93,220,238,0.15)", color: "#5ddcee" }}
          >
            <Search className="w-4 h-4" />
          </div>
          <p className="text-white/70 text-sm leading-relaxed">
            All reviewer actions — acceptance, corrections, rejections, and escalations — are immutably logged for compliance, accountability, and continuous AI model improvement. AI output and human review always remain separate and traceable.
          </p>
        </div>
      </div>
    </section>
  );
}
