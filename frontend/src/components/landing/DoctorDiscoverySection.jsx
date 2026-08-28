import { Link } from "react-router-dom";
import {
  Target,
  MapPin,
  CalendarClock,
  BadgeCheck,
  ArrowRight,
  Layers,
} from "lucide-react";

const matchingPillars = [
  {
    icon: <Target className="w-6 h-6" />,
    title: "Speciality Alignment",
    description:
      "Your triage result maps to the most clinically relevant medical specialities, so you only see doctors equipped to help with your specific condition.",
  },
  {
    icon: <MapPin className="w-6 h-6" />,
    title: "Geographic Proximity",
    description:
      "Sanjeevani filters doctors by your location, surfacing practitioners near you — minimising travel time for in-person consultations.",
  },
  {
    icon: <CalendarClock className="w-6 h-6" />,
    title: "Real-Time Availability",
    description:
      "Only doctors with open appointment slots are shown. No chasing — if they appear, they can see you.",
  },
  {
    icon: <BadgeCheck className="w-6 h-6" />,
    title: "Verified Credentials",
    description:
      "Every doctor on Sanjeevani is admin-verified. Profile, speciality, and registration details are reviewed before they appear in search.",
  },
];

export default function DoctorDiscoverySection() {
  return (
    <section
      id="doctor-discovery"
      className="section-padding"
      style={{ background: "#fff" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Label */}
        <div className="flex items-center gap-3 mb-5">
          <span className="w-8 h-0.5 rounded-full" style={{ background: "#0d7a8a" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#0d7a8a" }}>
            Smart Doctor Matching
          </span>
        </div>

        {/* Heading */}
        <div className="grid lg:grid-cols-2 gap-8 items-end mb-16">
          <h2
            className="text-4xl lg:text-5xl font-bold leading-tight"
            style={{ color: "#052a30", fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.025em" }}
          >
            Not a directory.
            <br />
            A precise match.
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "#4a6670" }}>
            Doctor discovery only unlocks after your triage is reviewed — ensuring every match is clinically relevant, not just geographically convenient.
          </p>
        </div>

        {/* Matching criteria cards — glassmorphism */}
        <div className="grid sm:grid-cols-2 gap-6 mb-14">
          {matchingPillars.map((pillar) => (
            <div
              key={pillar.title}
              className="group flex gap-5 p-7 rounded-2xl hover:-translate-y-0.5 transition-all duration-300"
              style={{
                background: "rgba(240,250,251,0.75)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1px solid rgba(13,122,138,0.14)",
                boxShadow: "0 2px 20px rgba(13,122,138,0.06), 0 1px 0 rgba(255,255,255,0.95) inset",
              }}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(13,122,138,0.1)",
                  backdropFilter: "blur(8px)",
                  color: "#0d7a8a",
                }}
              >
                {pillar.icon}
              </div>
              <div>
                <h3
                  className="text-base font-bold mb-2"
                  style={{ color: "#052a30", fontFamily: "'DM Sans', sans-serif" }}
                >
                  {pillar.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#5a7a84" }}>
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* How the flow works — visual pipeline */}
        <div
          className="p-8 rounded-3xl mb-10"
          style={{
            background: "rgba(240,250,251,0.65)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(13,122,138,0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Layers className="w-4 h-4" style={{ color: "#0d7a8a" }} />
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#0d7a8a" }}
            >
              Discovery is triage-gated
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {[
              "Symptom Submission",
              "AI Triage",
              "HITL Review",
              "Triage Result",
              "Doctor Match",
              "Appointment",
            ].map((label, i, arr) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={{
                    background: i >= 4
                      ? "#0d7a8a"
                      : "rgba(255,255,255,0.7)",
                    color: i >= 4 ? "#fff" : "#052a30",
                    border: i >= 4
                      ? "1px solid #0d7a8a"
                      : "1px solid rgba(13,122,138,0.2)",
                  }}
                >
                  {label}
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9cb8be" }} />
                )}
              </div>
            ))}
          </div>

          <p className="mt-5 text-sm" style={{ color: "#5a7a84" }}>
            Doctor matching is activated only after a HITL reviewer has issued a final triage result. This ensures patients are matched to clinically appropriate specialists — not just whoever is nearby.
          </p>
        </div>

        {/* CTA strip */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 rounded-3xl"
          style={{
            background: "linear-gradient(135deg, rgba(230,248,250,0.9) 0%, rgba(214,248,252,0.85) 100%)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(13,122,138,0.18)",
          }}
        >
          <div>
            <p
              className="text-xl font-bold mb-1"
              style={{ color: "#052a30", fontFamily: "'DM Sans', sans-serif" }}
            >
              Get triaged first, then find your doctor.
            </p>
            <p className="text-sm" style={{ color: "#4a6670" }}>
              Doctor discovery is unlocked after your triage review — ensuring you see exactly the right specialists.
            </p>
          </div>
          <Link
            to="/register"
            id="discovery-cta"
            className="flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold text-sm flex-shrink-0 hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg"
            style={{ background: "#0d7a8a" }}
          >
            Start as a Patient
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
