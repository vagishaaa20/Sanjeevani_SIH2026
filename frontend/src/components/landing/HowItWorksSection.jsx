import {
  ClipboardList,
  Bot,
  UserCheck,
  Search,
  CalendarCheck,
  FileText,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: <ClipboardList className="w-6 h-6" />,
    title: "Submit Symptoms",
    description:
      "Patients describe their symptoms through a guided, structured intake form designed to capture the right clinical signals.",
  },
  {
    number: "02",
    icon: <Bot className="w-6 h-6" />,
    title: "AI Triage",
    description:
      "Our AI system analyses symptoms and generates a preliminary triage result — including urgency level and possible condition flags.",
  },
  {
    number: "03",
    icon: <UserCheck className="w-6 h-6" />,
    title: "HITL Review",
    description:
      "A certified HITL reviewer evaluates the AI output, makes corrections if necessary, and issues the final reviewed triage result.",
  },
  {
    number: "04",
    icon: <Search className="w-6 h-6" />,
    title: "Doctor Discovery",
    description:
      "Based on the triage outcome, Sanjeevani surfaces relevant doctors filtered by speciality, location, and real-time availability.",
  },
  {
    number: "05",
    icon: <CalendarCheck className="w-6 h-6" />,
    title: "Book & Consult",
    description:
      "Patients book an appointment with their chosen doctor and conduct the consultation within the platform.",
  },
  {
    number: "06",
    icon: <FileText className="w-6 h-6" />,
    title: "Medical Record",
    description:
      "Post-consultation, the doctor creates a medical record with diagnosis and prescriptions — stored securely in the patient's profile.",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="section-padding"
      style={{ background: "#fff" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Label */}
        <div className="flex items-center gap-3 mb-5">
          <span className="w-8 h-0.5 rounded-full" style={{ background: "#0d7a8a" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#0d7a8a" }}>
            The Workflow
          </span>
        </div>

        {/* Heading */}
        <div className="grid lg:grid-cols-2 gap-8 items-end mb-16">
          <h2
            className="text-4xl lg:text-5xl font-bold leading-tight"
            style={{ color: "#052a30", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.025em" }}
          >
            How Sanjeevani
            <br />
            works.
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "#4a6670" }}>
            Six clear steps from symptom submission to a complete medical record — designed for transparency, safety, and speed.
          </p>
        </div>

        {/* Steps grid — glassmorphism cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <div
              key={step.number}
              className="group relative p-7 rounded-2xl hover:-translate-y-1 transition-all duration-300"
              style={{
                background: "rgba(240,250,251,0.8)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(13,122,138,0.12)",
                boxShadow: "0 2px 20px rgba(13,122,138,0.06), 0 1px 0 rgba(255,255,255,0.95) inset",
              }}
            >
              {/* Step number watermark */}
              <span
                className="absolute top-5 right-6 text-5xl font-black leading-none select-none"
                style={{ color: "rgba(13,122,138,0.08)", fontFamily: "'DM Sans', sans-serif" }}
              >
                {step.number}
              </span>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{
                  background: "rgba(13,122,138,0.1)",
                  backdropFilter: "blur(8px)",
                  color: "#0d7a8a",
                }}
              >
                {step.icon}
              </div>

              {/* Content */}
              <h3
                className="text-base font-bold mb-3"
                style={{ color: "#052a30", fontFamily: "'DM Sans', sans-serif" }}
              >
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#5a7a84" }}>
                {step.description}
              </p>

              {/* Connector dot */}
              {idx < steps.length - 1 && (
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-teal-100 bg-white z-10 hidden lg:flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-teal-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
