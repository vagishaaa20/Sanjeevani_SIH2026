import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

/* ─── Shared styles ──────────────────────────────────────────────────────── */
const s = {
  page: {
    display: "flex", justifyContent: "center", alignItems: "flex-start",
    minHeight: "100vh", background: "#f0f2f5", padding: "40px 16px", boxSizing: "border-box",
  },
  card: {
    background: "#fff", borderRadius: "12px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    padding: "36px 32px", width: "100%", maxWidth: "460px",
  },
  title: { fontSize: "1.5rem", fontWeight: "700", color: "#111", marginBottom: "4px", textAlign: "center" },
  subtitle: { fontSize: "0.875rem", color: "#6b7280", textAlign: "center", marginBottom: "24px" },
  fs: { display: "flex", flexDirection: "column", gap: "16px" },
  fg: { display: "flex", flexDirection: "column", gap: "5px" },
  label: { fontSize: "0.8125rem", fontWeight: "600", color: "#374151" },
  req: { color: "#dc2626" },
  input: {
    padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px",
    fontSize: "0.9375rem", color: "#111", width: "100%", boxSizing: "border-box", background: "#fff",
  },
  select: {
    padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px",
    fontSize: "0.9375rem", color: "#111", background: "#fff", width: "100%", boxSizing: "border-box",
  },
  hint: { fontSize: "0.75rem", color: "#9ca3af", marginTop: "2px" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  divider: { borderTop: "1px solid #f3f4f6", margin: "4px 0" },
  secLabel: {
    fontSize: "0.75rem", fontWeight: "700", color: "#9ca3af",
    textTransform: "uppercase", letterSpacing: "0.05em",
  },
  btn: {
    background: "#2563eb", color: "#fff", padding: "11px 20px", borderRadius: "8px",
    border: "none", cursor: "pointer", fontSize: "0.9375rem", fontWeight: "600", width: "100%", marginTop: "4px",
  },
  btnGhost: {
    background: "none", border: "1.5px solid #d1d5db", color: "#374151",
    padding: "11px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "0.9375rem",
    fontWeight: "600", width: "100%",
  },
  btnDisabled: {
    background: "#93c5fd", color: "#fff", padding: "11px 20px", borderRadius: "8px",
    border: "none", cursor: "not-allowed", fontSize: "0.9375rem", fontWeight: "600", width: "100%", marginTop: "4px",
  },
  error: {
    background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca",
    padding: "10px 14px", borderRadius: "8px", fontSize: "0.875rem",
  },
  success: {
    background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0",
    padding: "10px 14px", borderRadius: "8px", fontSize: "0.875rem",
  },
  info: {
    background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px",
    padding: "10px 14px", fontSize: "0.8125rem", color: "#64748b",
  },
  devNote: {
    background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px",
    padding: "10px 14px", fontSize: "0.8125rem", color: "#92400e", fontFamily: "monospace",
  },
  footer: { textAlign: "center", fontSize: "0.875rem", color: "#6b7280", marginTop: "20px" },
  backBtn: { background: "none", border: "none", cursor: "pointer", color: "#2563eb", fontSize: "0.875rem", padding: "0" },
  stepBadge: { fontSize: "0.875rem", fontWeight: "600", color: "#374151" },
  stepHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" },
  // Document upload styles
  docGrid: { display: "flex", flexDirection: "column", gap: "10px" },
  docRow: {
    border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "12px 14px",
    display: "flex", flexDirection: "column", gap: "8px",
  },
  docRowDone: {
    border: "1.5px solid #86efac", borderRadius: "10px", padding: "12px 14px",
    background: "#f0fdf4", display: "flex", flexDirection: "column", gap: "8px",
  },
  docName: { fontWeight: "600", fontSize: "0.875rem", color: "#111" },
  docStatus: { fontSize: "0.8125rem" },
  fileInput: { fontSize: "0.875rem" },
  uploadBtn: {
    background: "#2563eb", color: "#fff", padding: "6px 14px", borderRadius: "6px",
    border: "none", cursor: "pointer", fontSize: "0.8125rem", fontWeight: "600", width: "fit-content",
  },
};

/* ─── Role config ────────────────────────────────────────────────────────── */
const ROLES = [
  { value: "patient", label: "Patient", description: "Access AI health guidance and consultations" },
  { value: "doctor", label: "Doctor", description: "Verified licensed medical practitioner" },
  { value: "medical_reviewer", label: "Medical Reviewer", description: "HITL reviewer — doctor, PG resident, or intern" },
];

/* ─── Document type definitions ─────────────────────────────────────────── */
const DOCTOR_DOCS = [
  { type: "MEDICAL_REGISTRATION_CERTIFICATE", label: "Medical Registration Certificate", required: true },
  { type: "MBBS_OR_PRIMARY_QUALIFICATION", label: "MBBS / Primary Medical Qualification", required: true },
  { type: "INTERNSHIP_COMPLETION_CERTIFICATE", label: "Internship Completion Certificate", required: true },
  { type: "GOVERNMENT_IDENTITY", label: "Government / Photo Identity Proof", required: true },
  { type: "PROFESSIONAL_PHOTOGRAPH", label: "Professional Photograph", required: true },
  { type: "PG_QUALIFICATION_CERTIFICATE", label: "PG Qualification Certificate", required: false },
  { type: "ADDITIONAL_QUALIFICATION_PROOF", label: "Additional Qualification Proof", required: false },
];

const REVIEWER_DOCS = [
  { type: "MEDICAL_REGISTRATION_CERTIFICATE", label: "Professional / Registration Proof", required: true },
  { type: "GOVERNMENT_IDENTITY", label: "Identity Proof", required: true },
  { type: "COLLEGE_OR_INSTITUTION_ID", label: "Institution / College ID", required: true },
  { type: "RESIDENCY_PROOF", label: "Residency / Internship Proof", required: false },
  { type: "MBBS_OR_PRIMARY_QUALIFICATION", label: "Qualification Proof", required: true },
];

/* ─── Role selector ──────────────────────────────────────────────────────── */
function RoleSelector({ selected, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {ROLES.map((r) => (
        <label key={r.value} style={{
          display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px",
          border: `2px solid ${selected === r.value ? "#2563eb" : "#e5e7eb"}`,
          borderRadius: "10px", cursor: "pointer",
          background: selected === r.value ? "#eff6ff" : "#fff",
          transition: "border-color 0.15s, background 0.15s",
        }}>
          <input type="radio" name="role" value={r.value} checked={selected === r.value}
            onChange={() => onChange(r.value)} style={{ accentColor: "#2563eb" }} />
          <div>
            <div style={{ fontWeight: "600", fontSize: "0.9375rem", color: "#111" }}>{r.label}</div>
            <div style={{ fontSize: "0.8125rem", color: "#6b7280", marginTop: "2px" }}>{r.description}</div>
          </div>
        </label>
      ))}
    </div>
  );
}

/* ─── Document upload step ───────────────────────────────────────────────── */
function DocumentUploadStep({ role, accessToken, onComplete }) {
  const docs = role === "doctor" ? DOCTOR_DOCS : REVIEWER_DOCS;
  const [uploaded, setUploaded] = useState({}); // { docType: 'done' | 'uploading' | 'error' }
  const [files, setFiles] = useState({});
  const [globalError, setGlobalError] = useState("");

  const handleFileChange = (docType, file) => {
    setFiles((prev) => ({ ...prev, [docType]: file }));
  };

  const handleUpload = async (docType) => {
    const file = files[docType];
    if (!file) return;
    setUploaded((prev) => ({ ...prev, [docType]: "uploading" }));
    setGlobalError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("documentType", docType);
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploaded((prev) => ({ ...prev, [docType]: "error" }));
        setGlobalError(data.error || "Upload failed");
      } else {
        setUploaded((prev) => ({ ...prev, [docType]: "done" }));
      }
    } catch {
      setUploaded((prev) => ({ ...prev, [docType]: "error" }));
      setGlobalError("Could not reach the server during upload.");
    }
  };

  const requiredDone = docs.filter((d) => d.required).every((d) => uploaded[d.type] === "done");

  return (
    <div style={s.fs}>
      <div style={s.info}>
        ℹ️ Upload your professional documents for verification. Required documents are marked with <span style={{ color: "#dc2626" }}>*</span>.
        You can submit optional documents now or add them later from your profile.
      </div>
      {globalError && <div style={s.error}>{globalError}</div>}

      <div style={s.docGrid}>
        {docs.map((doc) => {
          const status = uploaded[doc.type];
          const isDone = status === "done";
          return (
            <div key={doc.type} style={isDone ? s.docRowDone : s.docRow}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={s.docName}>
                  {doc.label} {doc.required && <span style={s.req}>*</span>}
                </span>
                {isDone && <span style={{ color: "#16a34a", fontWeight: "700", fontSize: "0.9rem" }}>✓ Uploaded</span>}
                {status === "uploading" && <span style={{ color: "#2563eb", fontSize: "0.8125rem" }}>Uploading…</span>}
                {status === "error" && <span style={{ color: "#dc2626", fontSize: "0.8125rem" }}>Failed</span>}
              </div>
              {!isDone && (
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    style={s.fileInput}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleFileChange(doc.type, e.target.files[0])}
                  />
                  {files[doc.type] && (
                    <button
                      style={status === "uploading" ? { ...s.uploadBtn, background: "#93c5fd", cursor: "not-allowed" } : s.uploadBtn}
                      onClick={() => handleUpload(doc.type)}
                      disabled={status === "uploading"}
                      type="button"
                    >
                      {status === "uploading" ? "…" : "Upload"}
                    </button>
                  )}
                </div>
              )}
              <span style={{ ...s.hint, marginTop: 0 }}>PDF, JPG, PNG, WebP — max 5 MB</span>
            </div>
          );
        })}
      </div>

      {requiredDone ? (
        <button
          style={s.btn}
          type="button"
          onClick={onComplete}
        >
          Done — Go to Login
        </button>
      ) : (
        <div style={{ ...s.info, textAlign: "center", background: "#fef2f2", color: "#991b1b", border: "1px solid #fee2e2" }}>
          ⚠️ Please upload all required documents (marked with *) to finish registration.
        </div>
      )}
    </div>
  );
}

/* ─── Patient registration form ──────────────────────────────────────────── */
function PatientForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({ phone: "", fullName: "", dateOfBirth: "", sex: "", preferredLanguage: "", region: "", abhaNumber: "" });
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState(null);
  const [devOtp, setDevOtp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/register/patient", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, fullName: form.fullName, dateOfBirth: form.dateOfBirth, sex: form.sex, preferredLanguage: form.preferredLanguage || undefined, region: form.region || undefined, abhaNumber: form.abhaNumber || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed."); return; }
      setUserId(data.user.id);
      if (data.devOtp) setDevOtp(data.devOtp);
      setStep("otp");
    } catch { setError("Could not reach the server."); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "OTP verification failed."); return; }
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch { setError("Could not reach the server."); }
    finally { setLoading(false); }
  };

  if (step === "otp") {
    return (
      <div style={s.fs}>
        {error && <div style={s.error}>{error}</div>}
        {devOtp && (
          <div style={s.devNote}>
            <strong>Dev mode — OTP:</strong> {devOtp}
            <br /><span style={{ color: "#b45309" }}>Remove in production.</span>
          </div>
        )}
        <p style={{ color: "#374151", fontSize: "0.9375rem", margin: 0 }}>
          Enter the 6-digit OTP sent to <strong>{form.phone}</strong>
        </p>
        <form onSubmit={handleVerifyOtp} style={s.fs}>
          <input style={{ ...s.input, fontSize: "1.5rem", textAlign: "center", letterSpacing: "0.3em" }}
            type="text" inputMode="numeric" maxLength={6} pattern="\d{6}"
            placeholder="------" value={otp} onChange={(e) => setOtp(e.target.value)} required />
          <button style={loading ? s.btnDisabled : s.btn} type="submit" disabled={loading}>
            {loading ? "Verifying…" : "Verify & Activate Account"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleRegister} style={s.fs}>
      {error && <div style={s.error}>{error}</div>}
      <div style={s.fg}>
        <label style={s.label}>Mobile Number <span style={s.req}>*</span></label>
        <input style={s.input} type="tel" name="phone" placeholder="e.g. 9876543210" value={form.phone} onChange={set} required />
        <span style={s.hint}>Used for OTP verification and login</span>
      </div>
      <div style={s.fg}>
        <label style={s.label}>Full Name <span style={s.req}>*</span></label>
        <input style={s.input} type="text" name="fullName" placeholder="As per Aadhaar" value={form.fullName} onChange={set} required />
      </div>
      <div style={s.row}>
        <div style={s.fg}>
          <label style={s.label}>Date of Birth <span style={s.req}>*</span></label>
          <input style={s.input} type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={set} required />
        </div>
        <div style={s.fg}>
          <label style={s.label}>Sex <span style={s.req}>*</span></label>
          <select style={s.select} name="sex" value={form.sex} onChange={set} required>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>
      </div>
      <div style={s.divider} />
      <span style={s.secLabel}>Optional</span>
      <div style={s.row}>
        <div style={s.fg}>
          <label style={s.label}>Language</label>
          <input style={s.input} type="text" name="preferredLanguage" placeholder="Hindi, English…" value={form.preferredLanguage} onChange={set} />
        </div>
        <div style={s.fg}>
          <label style={s.label}>Region / City</label>
          <input style={s.input} type="text" name="region" placeholder="Delhi" value={form.region} onChange={set} />
        </div>
      </div>
      <div style={s.fg}>
        <label style={s.label}>ABHA Number</label>
        <input style={s.input} type="text" name="abhaNumber" placeholder="14-digit ABDM health ID" maxLength={14} value={form.abhaNumber} onChange={set} />
        <span style={s.hint}>Optional — can be linked later</span>
      </div>
      <button style={loading ? s.btnDisabled : s.btn} type="submit" disabled={loading}>
        {loading ? "Sending OTP…" : "Create Account & Send OTP"}
      </button>
    </form>
  );
}

/* ─── Doctor / Medical Reviewer form ─────────────────────────────────────── */
function ProfessionalForm({ role }) {
  const navigate = useNavigate();
  const [step, setStep] = useState("form"); // form | docs
  const [form, setForm] = useState({ fullName: "", email: "", password: "", city: "", professionalCategory: "" });
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const endpoint = role === "doctor" ? "/api/auth/register/doctor" : "/api/auth/register/hitl";

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const body = { fullName: form.fullName, email: form.email, password: form.password, city: form.city };
      if (role === "medical_reviewer" && form.professionalCategory) body.professionalCategory = form.professionalCategory;
      const res = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed."); return; }
      // Store token temporarily for document upload — will be refreshed on login
      if (data.accessToken) {
        setAccessToken(data.accessToken);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      setStep("docs");
    } catch { setError("Could not reach the server."); }
    finally { setLoading(false); }
  };

  if (step === "docs") {
    return <DocumentUploadStep role={role} accessToken={accessToken} onComplete={() => navigate("/login")} />;
  }

  return (
    <form onSubmit={handleSubmit} style={s.fs}>
      {error && <div style={s.error}>{error}</div>}
      <div style={s.fg}>
        <label style={s.label}>Full Name <span style={s.req}>*</span></label>
        <input style={s.input} type="text" name="fullName"
          placeholder={role === "doctor" ? "Dr. Firstname Lastname" : "Firstname Lastname"}
          value={form.fullName} onChange={set} required />
      </div>
      <div style={s.fg}>
        <label style={s.label}>Email <span style={s.req}>*</span></label>
        <input style={s.input} type="email" name="email" placeholder="you@hospital.com" value={form.email} onChange={set} required />
      </div>
      <div style={s.fg}>
        <label style={s.label}>Password <span style={s.req}>*</span></label>
        <input style={s.input} type="password" name="password" placeholder="Minimum 8 characters" value={form.password} onChange={set} minLength={8} required />
      </div>
      <div style={s.fg}>
        <label style={s.label}>City / Region <span style={s.req}>*</span></label>
        <input style={s.input} type="text" name="city" placeholder="e.g. Delhi, Mumbai" value={form.city} onChange={set} required />
      </div>
      {role === "medical_reviewer" && (
        <div style={s.fg}>
          <label style={s.label}>Professional Category</label>
          <select style={s.select} name="professionalCategory" value={form.professionalCategory} onChange={set}>
            <option value="">Select (optional)</option>
            <option value="REGISTERED_MEDICAL_PRACTITIONER">Registered Medical Practitioner</option>
            <option value="POSTGRADUATE_RESIDENT">Postgraduate Resident</option>
            <option value="MEDICAL_INTERN">Medical Intern</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      )}
      <div style={s.info}>
        ℹ️ Your account will be <strong>pending verification</strong>. You'll upload professional documents in the next step.
      </div>
      <button style={loading ? s.btnDisabled : s.btn} type="submit" disabled={loading}>
        {loading ? "Creating account…" : "Create Account & Continue →"}
      </button>
    </form>
  );
}

/* ─── Main Register page ─────────────────────────────────────────────────── */
export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryRole = searchParams.get("role");

  const [role, setRole] = useState(queryRole || "patient");
  const [showForm, setShowForm] = useState(!!queryRole);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(null);

  const selectedRole = ROLES.find((r) => r.value === role);

  useEffect(() => {
    const r = searchParams.get("role");
    if (r) {
      setRole(r);
      setShowForm(true);
    }
  }, [searchParams]);

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

  if (alreadyLoggedIn) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <h1 style={s.title}>Already Signed In</h1>
          <p style={s.subtitle}>You are currently logged in as {alreadyLoggedIn.email}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
            <button
              style={s.btn}
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
              style={s.btnGhost}
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
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Create an account</h1>
        <p style={s.subtitle}>Sanjeevani — AI-Assisted Health Platform</p>

        {!showForm ? (
          <>
            <RoleSelector selected={role} onChange={setRole} />
            <button style={{ ...s.btn, marginTop: "20px" }} onClick={() => setShowForm(true)}>
              Continue as {selectedRole?.label} →
            </button>
          </>
        ) : (
          <>
            <div style={s.stepHeader}>
              <button style={s.backBtn} onClick={() => setShowForm(false)}>← Back</button>
              <span style={s.stepBadge}>
                Registering as: <span style={{ color: "#2563eb" }}>{selectedRole?.label}</span>
              </span>
            </div>
            {role === "patient" ? <PatientForm /> : <ProfessionalForm role={role} />}
          </>
        )}

        <p style={s.footer}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#2563eb", fontWeight: "600" }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}