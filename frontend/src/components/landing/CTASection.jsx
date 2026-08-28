import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section
      id="cta"
      className="section-padding"
      style={{
        background: "linear-gradient(135deg, #052a30 0%, #083d47 40%, #0d7a8a 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto text-center">
        {/* Decorative circles */}
        <div className="relative">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(15,163,184,0.15) 0%, transparent 70%)",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10">
            {/* Label */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="w-8 h-0.5 rounded-full bg-teal-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-teal-300">
                Join Sanjeevani
              </span>
              <span className="w-8 h-0.5 rounded-full bg-teal-400" />
            </div>

            {/* Headline */}
            <h2
              className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight mx-auto max-w-3xl"
              style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.03em" }}
            >
              Better healthcare
              <br />
              starts here.
            </h2>

            <p className="text-white/65 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
              Whether you're a patient looking for expert care or a doctor ready to serve more effectively — Sanjeevani is built for you.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register?role=patient"
                id="cta-patient"
                className="flex items-center gap-2 bg-white text-[#0a5561] hover:bg-white/95 font-semibold text-base px-8 py-4 rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200"
              >
                I'm a Patient
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register?role=doctor"
                id="cta-doctor"
                className="flex items-center gap-2 text-white border border-white/30 hover:border-white/60 font-semibold text-base px-8 py-4 rounded-full transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
              >
                I'm a Doctor
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
