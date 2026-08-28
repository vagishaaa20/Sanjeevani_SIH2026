import { Link } from "react-router-dom";
import { HeartPulse } from "lucide-react";

const footerLinks = [
  {
    heading: "Platform",
    links: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "AI Triage", href: "#ai-explanation" },
      { label: "HITL Review", href: "#hitl" },
      { label: "Trust & Security", href: "#security" },
    ],
  },
  {
    heading: "For Patients",
    links: [
      { label: "Submit Symptoms", href: "/register" },
      { label: "Find a Doctor", href: "/register" },
      { label: "Book Appointment", href: "/register" },
      { label: "Medical Records", href: "/register" },
    ],
  },
  {
    heading: "For Doctors",
    links: [
      { label: "Join as a Doctor", href: "/register" },
      { label: "Manage Availability", href: "/register" },
      { label: "Patient Cases", href: "/register" },
      { label: "Consultations", href: "/register" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Sign In", href: "/login" },
      { label: "Register", href: "/register" },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="pt-16 pb-8 px-6 lg:px-8"
      style={{ background: "#052a30" }}
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto">
        {/* Top row — Logo + Links */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link
              to="/"
              className="flex items-center gap-2.5 group mb-4"
              aria-label="Sanjeevani Home"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(15,163,184,0.2)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                <HeartPulse className="w-4 h-4 text-teal-300" strokeWidth={2.5} />
              </div>
              <span className="text-white font-semibold text-base tracking-tight">Sanjeevani</span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              AI-assisted healthcare with human oversight — trusted, transparent, and built for India.
            </p>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.heading}>
              <h3
                className="text-xs font-bold uppercase tracking-widest mb-5"
                style={{ color: "#5ddcee" }}
              >
                {col.heading}
              </h3>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link
                        to={link.href}
                        className="text-sm transition-colors duration-200 hover:text-white"
                        style={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm transition-colors duration-200 hover:text-white"
                        style={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t mb-8" style={{ borderColor: "rgba(255,255,255,0.08)" }} />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            © {year} Sanjeevani. Built for SIH 2026. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            AI triage results are preliminary and subject to mandatory human review.
          </p>
        </div>
      </div>
    </footer>
  );
}
