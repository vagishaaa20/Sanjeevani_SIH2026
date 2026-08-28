import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";
import DNAHelix from "./DNAHelix";

const stats = [
  {
    value: "98%",
    label: "Triage Accuracy",
    description: "AI triage validated by certified medical reviewers",
    icon: <ShieldCheck className="w-4 h-4 text-teal-300" />,
  },
  {
    value: "< 60s",
    label: "First Response",
    description: "Average time to triage result from symptom submission",
    icon: <Zap className="w-4 h-4 text-teal-300" />,
  },
];

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #052a30 0%, #083d47 30%, #0d7a8a 65%, #0fa3b8 100%)",
      }}
    >
      {/* Ambient background orbs */}
      <div
        className="absolute top-[-10%] right-[-5%] w-[520px] h-[520px] rounded-full pointer-events-none animate-orb-1"
        style={{
          background: "radial-gradient(circle, rgba(15,163,184,0.22) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-15%] left-[-8%] w-[420px] h-[420px] rounded-full pointer-events-none animate-orb-2"
        style={{
          background: "radial-gradient(circle, rgba(93,220,238,0.15) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-6 items-center min-h-[80vh]">
          {/* Left — Text */}
          <div className="flex flex-col gap-8 animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 w-fit">
              <span
                className="flex items-center gap-2 text-sm font-medium text-white/90 px-4 py-1.5 rounded-full border border-white/20"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
              >
                <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse" />
                AI-Assisted Healthcare Platform
              </span>
            </div>

            {/* Headline */}
            <div>
              <h1
                className="text-white text-5xl lg:text-6xl xl:text-7xl leading-[1.05] font-bold"
                style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.03em" }}
              >
                Healing,
                <br />
                Guided by
                <br />
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage: "linear-gradient(90deg, #5ddcee, #a5eef7)",
                  }}
                >
                  Intelligence.
                </span>
              </h1>
            </div>

            {/* Subheadline */}
            <p className="text-white/70 text-lg lg:text-xl max-w-md leading-relaxed">
              Sanjeevani connects patients with qualified doctors through AI-powered triage — with every decision reviewed by certified medical professionals.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                id="hero-get-started"
                className="flex items-center justify-center gap-2 bg-white text-[#0a5561] hover:bg-white/95 font-semibold text-base px-7 py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                id="hero-how-it-works"
                className="flex items-center justify-center gap-2 text-white/85 hover:text-white border border-white/30 hover:border-white/50 font-medium text-base px-7 py-3.5 rounded-full transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}
              >
                How It Works
              </a>
            </div>

            {/* Floating stat cards */}
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={`glass-card p-4 flex gap-3 items-start flex-1 ${
                    i === 0 ? "animate-float-card" : "animate-float-card-2"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(15,163,184,0.25)" }}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-white font-bold text-2xl leading-none mb-0.5">{stat.value}</p>
                    <p className="text-teal-200 font-semibold text-xs uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-white/55 text-xs leading-snug">{stat.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — DNA Helix */}
          <div
            className="relative h-[480px] lg:h-[620px] flex items-center justify-center"
            aria-hidden="true"
          >
            {/* Glow behind DNA */}
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(15,163,184,0.18) 0%, transparent 70%)",
              }}
            />
            <div className="w-full h-full max-w-sm mx-auto">
              <DNAHelix />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 lg:h-20">
          <path d="M0 80L1440 80L1440 30C1200 70 960 10 720 40C480 70 240 10 0 30L0 80Z" fill="#f0fafb" />
        </svg>
      </div>
    </section>
  );
}
