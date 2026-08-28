import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, HeartPulse } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) { }
    }
  }, []);

  const getDashboardLink = () => {
    if (!user) return "/";
    if (user.role === "admin") return "/admin/dashboard";
    if (user.role === "doctor") return "/doctor/dashboard";
    if (user.role === "hitl_reviewer") return "/reviewer/dashboard";
    return "/dashboard";
  };

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 20);
      // Hero is ~100vh — switch text color after leaving it
      setIsPastHero(y > window.innerHeight * 0.85);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "For Doctors", href: "#benefits" },
    { label: "For Patients", href: "#benefits" },
    { label: "Security", href: "#security" },
  ];

  // When past hero: white/light glass bg, dark text
  // When in hero: transparent, white text
  const navBg = isPastHero
    ? "bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-sm shadow-black/5"
    : isScrolled
      ? "bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-black/10"
      : "bg-transparent";

  const textColour = isPastHero ? "#083d47" : "rgba(255,255,255,0.85)";
  const textHover = isPastHero ? "#0d7a8a" : "#fff";
  const logoColour = isPastHero ? "#052a30" : "#fff";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group"
          aria-label="Sanjeevani Home"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background: isPastHero ? "#e6f8fa" : "rgba(255,255,255,0.2)",
              border: isPastHero ? "1px solid #b3e9f0" : "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <HeartPulse
              className="w-4 h-4"
              strokeWidth={2.5}
              style={{ color: isPastHero ? "#0d7a8a" : "#fff" }}
            />
          </div>
          <span
            className="font-semibold text-lg tracking-tight transition-colors"
            style={{ color: logoColour }}
          >
            Sanjeevani
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <ul className="hidden md:flex items-center gap-8" role="list">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="text-sm font-medium transition-colors duration-200"
                style={{ color: textColour }}
                onMouseEnter={(e) => (e.target.style.color = textHover)}
                onMouseLeave={(e) => (e.target.style.color = textColour)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link
                to={getDashboardLink()}
                className="bg-[#0d7a8a] text-white hover:bg-[#0a5561] text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-px"
                style={!isPastHero ? { background: "white", color: "#0a7c8a" } : undefined}
              >
                Go to Dashboard
              </Link>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/";
                }}
                className="text-sm font-medium transition-colors px-4 py-2 cursor-pointer"
                style={{ color: textColour }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium transition-colors px-4 py-2"
                style={{ color: textColour }}
              >
                Sign In
              </Link>
              {isPastHero ? (
                <Link
                  to="/register"
                  className="bg-[#0d7a8a] hover:bg-[#0a5561] text-white text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-px"
                >
                  Get Started
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="bg-white text-[#0a7c8a] hover:bg-white/90 text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-px"
                >
                  Get Started
                </Link>
              )}
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg transition-colors"
          style={{
            color: isPastHero ? "#052a30" : "#fff",
            background: isPastHero ? "rgba(13,122,138,0.08)" : "rgba(255,255,255,0.1)",
          }}
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileOpen}
        >
          {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${isMobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        aria-hidden={!isMobileOpen}
      >
        <div
          className="border-t px-6 py-5 flex flex-col gap-4"
          style={{
            background: isPastHero ? "rgba(255,255,255,0.97)" : "rgba(8,61,71,0.96)",
            backdropFilter: "blur(16px)",
            borderColor: isPastHero ? "#e2f5f7" : "rgba(255,255,255,0.15)",
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setIsMobileOpen(false)}
              className="text-base font-medium transition-colors"
              style={{ color: isPastHero ? "#052a30" : "rgba(255,255,255,0.85)" }}
            >
              {link.label}
            </a>
          ))}
          <div
            className="flex flex-col gap-3 pt-3 border-t"
            style={{ borderColor: isPastHero ? "#e2f5f7" : "rgba(255,255,255,0.15)" }}
          >
            {user ? (
              <div
                className="flex flex-col gap-3 pt-3 border-t"
                style={{ borderColor: isPastHero ? "#e2f5f7" : "rgba(255,255,255,0.15)" }}
              >
                <Link
                  to={getDashboardLink()}
                  onClick={() => setIsMobileOpen(false)}
                  className="font-semibold text-sm px-5 py-2.5 rounded-full text-center"
                  style={{ background: "#0d7a8a", color: "#fff" }}
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={() => {
                    localStorage.clear();
                    setIsMobileOpen(false);
                    window.location.href = "/";
                  }}
                  className="text-sm font-medium text-left cursor-pointer"
                  style={{ color: isPastHero ? "#0d7a8a" : "rgba(255,255,255,0.75)", background: "none", border: "none", padding: 0 }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col gap-3 pt-3 border-t"
                style={{ borderColor: isPastHero ? "#e2f5f7" : "rgba(255,255,255,0.15)" }}
              >
                <Link
                  to="/login"
                  onClick={() => setIsMobileOpen(false)}
                  className="text-sm font-medium"
                  style={{ color: isPastHero ? "#0d7a8a" : "rgba(255,255,255,0.75)" }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileOpen(false)}
                  className="font-semibold text-sm px-5 py-2.5 rounded-full text-center"
                  style={{ background: "#0d7a8a", color: "#fff" }}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
