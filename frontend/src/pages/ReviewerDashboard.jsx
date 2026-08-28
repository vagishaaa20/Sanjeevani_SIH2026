import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const s = {
  page: { minHeight: "100vh", background: "#f0f2f5" },
  nav: {
    background: "#0f172a", padding: "0 24px", height: "56px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  navTitle: { fontWeight: "700", fontSize: "1.125rem", color: "#f1f5f9" },
  navRight: { display: "flex", alignItems: "center", gap: "16px" },
  navUser: { fontSize: "0.875rem", color: "#cbd5e1" },
  logoutBtn: {
    background: "none", border: "1.5px solid #475569", borderRadius: "6px",
    padding: "6px 14px", cursor: "pointer", fontSize: "0.875rem", color: "#cbd5e1",
  },
  body: { padding: "28px 24px", maxWidth: "900px", margin: "0 auto" },
  greeting: { fontSize: "1.25rem", fontWeight: "700", color: "#111", marginBottom: "4px" },
  sub: { fontSize: "0.875rem", color: "#6b7280", marginBottom: "24px" },
  pendingBanner: {
    background: "#fef9c3", border: "1px solid #fde68a", borderRadius: "10px",
    padding: "14px 18px", marginBottom: "20px",
  },
  pendingTitle: { fontWeight: "700", color: "#854d0e", marginBottom: "4px", fontSize: "0.9rem" },
  pendingText: { fontSize: "0.875rem", color: "#92400e" },
  verifiedBanner: {
    background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "10px",
    padding: "14px 18px", marginBottom: "20px",
  },
  verifiedText: { fontSize: "0.875rem", color: "#166534", fontWeight: "600" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" },
  card: {
    background: "#fff", borderRadius: "10px", border: "1.5px solid #e5e7eb",
    padding: "20px",
  },
  cardHeader: { fontWeight: "700", fontSize: "1rem", color: "#111", marginBottom: "14px" },
  sectionTitle: { fontWeight: "700", fontSize: "1rem", color: "#111", margin: "24px 0 12px" },
  emptyState: { color: "#9ca3af", fontSize: "0.875rem", textAlign: "center", padding: "24px 0" },
  profileRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" },
  profileLabel: { fontSize: "0.875rem", color: "#6b7280" },
  profileValue: { fontSize: "0.875rem", color: "#111", fontWeight: "500" },
  badge: (color) => ({
    display: "inline-block", padding: "3px 10px", borderRadius: "100px",
    fontSize: "0.75rem", fontWeight: "700", background: color === "green" ? "#dcfce7" : color === "yellow" ? "#fef9c3" : "#fee2e2",
    color: color === "green" ? "#166534" : color === "yellow" ? "#854d0e" : "#b91c1c",
  }),
  docItem: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 12px", background: "#f9fafb", borderRadius: "8px",
    fontSize: "0.875rem",
  },
  docList: { display: "flex", flexDirection: "column", gap: "8px" },
};

const VERIFICATION_BADGE = {
  PENDING_VERIFICATION: { label: "Pending Verification", color: "yellow" },
  UNDER_REVIEW: { label: "Under Review", color: "yellow" },
  VERIFIED: { label: "Verified", color: "green" },
  REJECTED: { label: "Rejected", color: "red" },
  SUSPENDED: { label: "Suspended", color: "red" },
};

export default function ReviewerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
    if (!stored || !token) { navigate("/login"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "hitl_reviewer") { navigate("/login"); return; }
    setUser(u);

    Promise.all([
      fetch("/api/profile/me", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch("/api/documents/my", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ]).then(([profileData, docData]) => {
      setProfile(profileData.profile);
      setDocs(docData.documents || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [navigate]);

  const logout = () => { localStorage.clear(); navigate("/login"); };

  const verificationInfo = profile
    ? VERIFICATION_BADGE[profile.verificationStatus] || { label: profile.verificationStatus, color: "yellow" }
    : null;

  const isVerified = profile?.verificationStatus === "VERIFIED";

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading…</div>;

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <span style={s.navTitle}>🌿 Sanjeevani — Reviewer Portal</span>
        <div style={s.navRight}>
          <span style={s.navUser}>{profile?.fullName || user?.email}</span>
          <button style={s.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </nav>

      <div style={s.body}>
        <div style={s.greeting}>{profile?.fullName || "Reviewer"}</div>
        <div style={s.sub}>{profile?.professionalCategory?.replace(/_/g, " ") || "Medical Reviewer"} · {profile?.city || ""}</div>

        {/* Verification banner */}
        {!isVerified && (
          <div style={s.pendingBanner}>
            <div style={s.pendingTitle}>Account Pending Verification</div>
            <div style={s.pendingText}>
              Your account is <strong>{verificationInfo?.label}</strong>. An admin will verify your profile and submitted credentials.
              {profile?.verificationNotes && (
                <span> Admin Note: <em>"{profile.verificationNotes}"</em></span>
              )}
            </div>
          </div>
        )}
        {isVerified && (
          <div style={s.verifiedBanner}>
            <span style={s.verifiedText}>✓ Verified reviewer account. You can now access and audit triage cases.</span>
          </div>
        )}

        <div style={s.row}>
          {/* Review Stats */}
          <div style={s.card}>
            <div style={s.cardHeader}>Your Activity</div>
            <div style={s.profileRow}>
              <span style={s.profileLabel}>Cases Reviewed</span>
              <span style={s.profileValue}>0</span>
            </div>
            <div style={s.profileRow}>
              <span style={s.profileLabel}>Agreement Rate</span>
              <span style={s.profileValue}>—</span>
            </div>
            <div style={s.profileRow}>
              <span style={s.profileLabel}>Incentives Earned</span>
              <span style={s.profileValue}>₹0.00</span>
            </div>
          </div>

          {/* Reviewer scope info */}
          <div style={s.card}>
            <div style={s.cardHeader}>Review Scope</div>
            <div style={s.profileRow}>
              <span style={s.profileLabel}>Role Level</span>
              <span style={s.profileValue}>{profile?.reviewLevel || "Junior"}</span>
            </div>
            <div style={s.profileRow}>
              <span style={s.profileLabel}>Supervision Required</span>
              <span style={s.profileValue}>{profile?.supervisionRequired ? "Yes" : "No"}</span>
            </div>
            <div style={s.profileRow}>
              <span style={s.profileLabel}>Allowed Actions</span>
              <span style={s.profileValue}>{profile?.allowedActions?.join(", ") || "View, Audit"}</span>
            </div>
          </div>
        </div>

        {/* HITL triage cases placeholder */}
        <div style={s.sectionTitle}>Pending Cases</div>
        <div style={s.card}>
          <div style={s.emptyState}>
            {isVerified
              ? "All caught up! No triage cases pending human-in-the-loop review."
              : "Cases will appear here once your account is verified by the admin."}
          </div>
        </div>

        {/* Documents list */}
        <div style={s.sectionTitle}>Uploaded Verification Documents</div>
        <div style={s.card}>
          {docs.length === 0 ? (
            <div style={s.emptyState}>No documents uploaded yet.</div>
          ) : (
            <div style={s.docList}>
              {docs.map((doc) => (
                <div key={doc.id} style={s.docItem}>
                  <span style={{ color: "#374151", fontWeight: "500" }}>{doc.documentType?.replace(/_/g, " ")}</span>
                  <span style={s.badge(doc.status === "ACCEPTED" ? "green" : doc.status === "PENDING" ? "yellow" : "red")}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
