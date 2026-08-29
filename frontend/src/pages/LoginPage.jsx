import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dashboardPathForRole } from "../config/roleRoutes";

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#f0f2f5",
    padding: "20px 16px",
    boxSizing: "border-box",
  },
  card: {
    background: "white",
    padding: "36px 32px",
    borderRadius: "12px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    width: "100%",
    maxWidth: "420px",
  },
  heading: { marginBottom: "4px", textAlign: "center", fontSize: "1.5rem", fontWeight: "700", color: "#111" },
  subtitle: { fontSize: "0.875rem", color: "#6b7280", textAlign: "center", marginBottom: "24px" },
  tabs: { display: "flex", borderBottom: "2px solid #e5e7eb", marginBottom: "20px" },
  tab: (active) => ({
    flex: 1,
    padding: "10px 0",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "0.8125rem",
    fontWeight: active ? "700" : "500",
    color: active ? "#2563eb" : "#6b7280",
    borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
    marginBottom: "-2px",
    textAlign: "center",
  }),
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  label: { fontSize: "0.8125rem", fontWeight: "600", color: "#374151" },
  input: {
    padding: "10px 12px",
    border: "1.5px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "0.9375rem",
    color: "#111",
    width: "100%",
    boxSizing: "border-box",
  },
  btnPrimary: {
    background: "#2563eb",
    color: "white",
    padding: "11px 20px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.9375rem",
    fontWeight: "600",
    width: "100%",
    marginTop: "4px",
  },
  btnDisabled: {
    background: "#93c5fd",
    color: "white",
    padding: "11px 20px",
    borderRadius: "8px",
    border: "none",
    cursor: "not-allowed",
    fontSize: "0.9375rem",
    fontWeight: "600",
    width: "100%",
    marginTop: "4px",
  },
  btnSecondary: {
    background: "none",
    border: "1.5px solid #d1d5db",
    color: "#374151",
    padding: "11px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.9375rem",
    fontWeight: "600",
    width: "100%",
    marginTop: "4px",
  },
  footerText: { textAlign: "center", fontSize: "0.875rem", color: "#6b7280", marginTop: "20px" },
  error: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "0.875rem",
    lineHeight: "1.4",
  },
  devNote: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "0.8125rem",
    color: "#92400e",
    fontFamily: "monospace",
  },
  adminHelper: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "0.8125rem",
    color: "#1e40af",
    marginBottom: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  quickLoginBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "4px 8px",
    fontSize: "0.75rem",
    fontWeight: "700",
    cursor: "pointer",
    width: "fit-content",
  },
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginMethod, setLoginMethod] = useState("doctor"); // "doctor" | "admin" | "patient"
  const [emailForm, setEmailForm] = useState({ email: "", password: "" });

  // Phone login states
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [userId, setUserId] = useState(null);
  const [devOtp, setDevOtp] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
    if (stored && token) {
      try {
        setAlreadyLoggedIn(JSON.parse(stored));
      } catch (e) {
        // ignore
      }
    } else {
      setAlreadyLoggedIn(null);
    }
  }, []);

  const handleEmailChange = (e) =>
    setEmailForm({ ...emailForm, [e.target.name]: e.target.value });

  // Handle Email / Password Login (Doctor, Reviewer, Admin)
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForm.email, password: emailForm.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Check your credentials.");
      } else {
        login(data); // stores user + tokens in context (and localStorage)
        navigate(dashboardPathForRole(data.user?.role));
      }
    } catch {
      setError("Could not connect to the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  // Quick Auto-fill & Login as Admin
  const handleQuickAdminLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@sanjeevani.gov.in", password: "admin1234" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed.");
      } else {
        login(data);
        navigate(dashboardPathForRole(data.user?.role));
      }
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // Step 1 of Phone Login: Request OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setDevOtp(null);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send OTP.");
      } else {
        setUserId(data.userId);
        if (data.devOtp) {
          setDevOtp(data.devOtp);
        }
        setOtpSent(true);
      }
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 of Phone Login: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid or expired OTP.");
      } else {
        login(data);
        navigate(dashboardPathForRole(data.user?.role)); // patients -> "/dashboard"
      }
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  if (alreadyLoggedIn) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.heading}>Already Signed In</h2>
          <p style={styles.subtitle}>You are currently logged in as {alreadyLoggedIn.email}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
            <button
              style={styles.btnPrimary}
              onClick={() => {
                if (alreadyLoggedIn.role === "admin") navigate("/admin/dashboard");
                else if (alreadyLoggedIn.role === "doctor") navigate("/doctor/dashboard");
                else if (alreadyLoggedIn.role === "hitl_reviewer") navigate("/reviewer/dashboard");
                else navigate("/dashboard");
              }}
            >
              Go to Dashboard →
            </button>
            <button
              style={styles.btnSecondary}
              onClick={() => {
                localStorage.clear();
                setAlreadyLoggedIn(null);
                window.location.reload();
              }}
            >
              Logout & Switch Accounts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Login</h2>
        <p style={styles.subtitle}>Sanjeevani Portal</p>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.tabs}>
          <button style={styles.tab(loginMethod === "doctor")} onClick={() => { setLoginMethod("doctor"); setError(""); }}>
            Doctor
          </button>
          <button style={styles.tab(loginMethod === "reviewer")} onClick={() => { setLoginMethod("reviewer"); setError(""); }}>
            Reviewer (HITL)
          </button>
          <button style={styles.tab(loginMethod === "admin")} onClick={() => { setLoginMethod("admin"); setError(""); }}>
            Admin
          </button>
          <button style={styles.tab(loginMethod === "patient")} onClick={() => { setLoginMethod("patient"); setError(""); }}>
            Patient
          </button>
        </div>

        {loginMethod === "reviewer" && (
          <div style={{ ...styles.adminHelper, background: "#f0fdf4", borderColor: "#86efac", color: "#166534" }}>
            <div>
              <strong>Seeded HITL Reviewer Credentials:</strong>
              <div style={{ marginTop: "4px", fontSize: "0.75rem", fontFamily: "monospace" }}>
                User: reviewer@sanjeevani.gov.in
                <br />Pass: reviewer1234
              </div>
            </div>
            <button
              style={{ ...styles.quickLoginBtn, background: "#16a34a" }}
              onClick={async () => {
                setError("");
                setLoading(true);
                try {
                  const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: "reviewer@sanjeevani.gov.in", password: "reviewer1234" }),
                  });
                  const data = await res.json();
                  if (!res.ok) setError(data.error || "Login failed.");
                  else {
                    login(data);
                    navigate(dashboardPathForRole(data.user?.role));
                  }
                } catch {
                  setError("Could not connect to the server.");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              {loading ? "Logging in..." : "⚡ Quick Login as HITL Reviewer"}
            </button>
          </div>
        )}

        {loginMethod === "admin" && (
          <div style={styles.adminHelper}>
            <div>
              <strong>Seeded Administrator Credentials:</strong>
              <div style={{ marginTop: "4px", fontSize: "0.75rem", fontFamily: "monospace" }}>
                User: admin@sanjeevani.gov.in
                <br />Pass: admin1234
              </div>
            </div>
            <button style={styles.quickLoginBtn} onClick={handleQuickAdminLogin} disabled={loading}>
              {loading ? "Logging in..." : "⚡ Quick Login as Admin"}
            </button>
          </div>
        )}

        {loginMethod === "doctor" || loginMethod === "reviewer" || loginMethod === "admin" ? (
          <form style={styles.form} onSubmit={handleEmailSubmit}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                style={styles.input}
                type="email"
                name="email"
                placeholder={loginMethod === "admin" ? "admin@sanjeevani.gov.in" : loginMethod === "reviewer" ? "reviewer@sanjeevani.gov.in" : "you@hospital.com"}
                value={emailForm.email}
                onChange={handleEmailChange}
                required
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                name="password"
                placeholder="Enter password"
                value={emailForm.password}
                onChange={handleEmailChange}
                required
              />
            </div>
            <button
              style={loading ? styles.btnDisabled : styles.btnPrimary}
              type="submit"
              disabled={loading}
            >
              {loading ? "Logging in…" : "Login"}
            </button>
          </form>
        ) : (
          <div>
            {!otpSent ? (
              <form style={styles.form} onSubmit={handleSendOtp}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Mobile Number</label>
                  <input
                    style={styles.input}
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Enter your registered patient phone number</span>
                </div>
                <button
                  style={loading ? styles.btnDisabled : styles.btnPrimary}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Sending OTP…" : "Send OTP"}
                </button>
              </form>
            ) : (
              <form style={styles.form} onSubmit={handleVerifyOtp}>
                {devOtp && (
                  <div style={styles.devNote}>
                    <strong>Dev mode — OTP:</strong> {devOtp}
                    <br /><span style={{ color: "#b45309" }}>Enter this code below.</span>
                  </div>
                )}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Enter 6-digit OTP sent to {phone}</label>
                  <input
                    style={{ ...styles.input, fontSize: "1.25rem", textAlign: "center", letterSpacing: "0.3em" }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="\d{6}"
                    placeholder="------"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
                <button
                  style={loading ? styles.btnDisabled : styles.btnPrimary}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Verifying…" : "Verify & Login"}
                </button>
                <button
                  style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "0.875rem", padding: "0", textAlign: "center" }}
                  type="button"
                  onClick={() => setOtpSent(false)}
                >
                  ← Change phone number
                </button>
              </form>
            )}
          </div>
        )}

        <p style={styles.footerText}>
          Don't have an account? <Link to="/register" style={{ color: "#2563eb", fontWeight: "600" }}>Register</Link>
        </p>
      </div>
    </div>
  );
}