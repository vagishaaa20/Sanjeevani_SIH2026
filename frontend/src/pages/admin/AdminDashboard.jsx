import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const s = {
  page: { minHeight: "100vh", background: "#f0f2f5" },
  nav: {
    background: "#1e293b", padding: "0 24px", height: "56px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  navTitle: { fontWeight: "700", fontSize: "1.125rem", color: "#f1f5f9" },
  navRight: { display: "flex", alignItems: "center", gap: "16px" },
  navUser: { fontSize: "0.875rem", color: "#94a3b8" },
  logoutBtn: {
    background: "none", border: "1.5px solid #475569", borderRadius: "6px",
    padding: "6px 14px", cursor: "pointer", fontSize: "0.875rem", color: "#cbd5e1",
  },
  body: { padding: "28px 24px", maxWidth: "1000px", margin: "0 auto" },
  title: { fontSize: "1.25rem", fontWeight: "700", color: "#111", marginBottom: "4px" },
  sub: { fontSize: "0.875rem", color: "#6b7280", marginBottom: "24px" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px", marginBottom: "28px" },
  statCard: {
    background: "#fff", borderRadius: "10px", border: "1.5px solid #e5e7eb",
    padding: "18px 20px",
  },
  statNum: { fontSize: "1.75rem", fontWeight: "800", color: "#111", lineHeight: 1 },
  statLabel: { fontSize: "0.8125rem", color: "#6b7280", marginTop: "4px" },
  sectionTitle: { fontWeight: "700", fontSize: "1rem", color: "#111", margin: "0 0 12px" },
  card: {
    background: "#fff", borderRadius: "10px", border: "1.5px solid #e5e7eb",
    padding: "20px", marginBottom: "20px",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: "0.8125rem", fontWeight: "700", color: "#6b7280", padding: "8px 12px", borderBottom: "2px solid #f3f4f6" },
  td: { fontSize: "0.875rem", color: "#374151", padding: "10px 12px", borderBottom: "1px solid #f9fafb", verticalAlign: "middle" },
  badge: (color) => ({
    display: "inline-block", padding: "3px 10px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: "700",
    background: color === "green" ? "#dcfce7" : color === "yellow" ? "#fef9c3" : color === "blue" ? "#dbeafe" : "#fee2e2",
    color: color === "green" ? "#166534" : color === "yellow" ? "#854d0e" : color === "blue" ? "#1e40af" : "#b91c1c",
  }),
  actionRow: { display: "flex", gap: "6px", flexWrap: "wrap" },
  actionBtn: (color) => ({
    padding: "5px 12px", borderRadius: "6px", border: "none", cursor: "pointer",
    fontSize: "0.8125rem", fontWeight: "600",
    background: color === "green" ? "#dcfce7" : color === "red" ? "#fee2e2" : color === "blue" ? "#dbeafe" : "#f3f4f6",
    color: color === "green" ? "#166534" : color === "red" ? "#b91c1c" : color === "blue" ? "#1e40af" : "#374151",
  }),
  emptyState: { color: "#9ca3af", fontSize: "0.875rem", textAlign: "center", padding: "24px 0" },
  tabs: { display: "flex", gap: "0", borderBottom: "2px solid #e5e7eb", marginBottom: "20px" },
  tab: (active) => ({
    padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
    fontSize: "0.9rem", fontWeight: active ? "700" : "500",
    color: active ? "#2563eb" : "#6b7280",
    borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
    marginBottom: "-2px",
  }),
  error: { background: "#fef2f2", color: "#b91c1c", padding: "10px 14px", borderRadius: "8px", fontSize: "0.875rem", marginBottom: "16px" },
  successMsg: { background: "#f0fdf4", color: "#166534", padding: "10px 14px", borderRadius: "8px", fontSize: "0.875rem", marginBottom: "16px" },
  modalOverlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
  },
  modalContent: {
    background: "#fff", padding: "28px", borderRadius: "12px", width: "100%", maxWidth: "600px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    maxHeight: "90vh", overflowY: "auto", position: "relative"
  },
  modalTitle: { fontSize: "1.25rem", fontWeight: "700", marginBottom: "16px", color: "#111" },
  modalClose: {
    position: "absolute", top: "16px", right: "20px", background: "none", border: "none",
    fontSize: "1.5rem", cursor: "pointer", color: "#9ca3af"
  },
  profileRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" },
  profileLabel: { fontSize: "0.875rem", color: "#6b7280" },
  metaHeader: { fontSize: "0.75rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" },
};

const ACTIONS = [
  { key: "approve", label: "Approve", color: "green" },
  { key: "reject", label: "Reject", color: "red" },
  { key: "request_resubmission", label: "Request Resubmission", color: "blue" },
  { key: "suspend", label: "Suspend", color: "red" },
];

function UserDetailModal({ userId, token, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (active) {
          if (!res.ok) setError(json.error || "Failed to load details");
          else setData(json);
        }
      } catch {
        if (active) setError("Network error loading details.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [userId, token]);

  if (loading) return (
    <div style={s.modalOverlay}>
      <div style={s.modalContent}>
        <div style={{ textAlign: "center", padding: "20px" }}>Loading credentials details...</div>
      </div>
    </div>
  );

  if (error || !data) return (
    <div style={s.modalOverlay}>
      <div style={s.modalContent}>
        <button style={s.modalClose} onClick={onClose}>×</button>
        <div style={{ color: "#b91c1c", padding: "10px" }}>{error || "Could not retrieve user credentials."}</div>
      </div>
    </div>
  );

  const { user, profile, documents } = data;

  return (
    <div style={s.modalOverlay}>
      <div style={s.modalContent}>
        <button style={s.modalClose} onClick={onClose}>×</button>
        <h3 style={s.modalTitle}>Verification Professional Credentials</h3>

        <div style={{ ...s.card, margin: "0 0 16px" }}>
          <div style={s.metaHeader}>Profile Information</div>
          <div style={s.profileRow}><span style={s.profileLabel}>Name:</span><span>{profile?.fullName || "—"}</span></div>
          <div style={s.profileRow}><span style={s.profileLabel}>Role:</span><span>{user?.role?.toUpperCase()}</span></div>
          <div style={s.profileRow}><span style={s.profileLabel}>Email:</span><span>{user?.email || "—"}</span></div>
          <div style={s.profileRow}><span style={s.profileLabel}>Phone:</span><span>{user?.phone || "—"}</span></div>
          <div style={s.profileRow}><span style={s.profileLabel}>City:</span><span>{profile?.city || "—"}</span></div>
        </div>

        {user?.role === "doctor" && (
          <div style={{ ...s.card, margin: "0 0 16px" }}>
            <div style={s.metaHeader}>Medical Board / Council Registration</div>
            <div style={s.profileRow}><span style={s.profileLabel}>NMC Registration Number:</span><strong>{profile?.registrationNumber || "—"}</strong></div>
            <div style={s.profileRow}><span style={s.profileLabel}>State Medical Council:</span><span>{profile?.stateMedicalCouncil || "—"}</span></div>
            <div style={s.profileRow}><span style={s.profileLabel}>Medical College/College:</span><span>{profile?.medicalCollege || "—"}</span></div>
            <div style={s.profileRow}><span style={s.profileLabel}>Primary Qualification:</span><span>{profile?.primaryQualification || "—"}</span></div>
            <div style={s.profileRow}><span style={s.profileLabel}>Graduation Year:</span><span>{profile?.graduationYear || "—"}</span></div>
            <div style={s.profileRow}><span style={s.profileLabel}>Years of Experience:</span><span>{profile?.yearsOfExperience || "0"} Years</span></div>
            <div style={s.profileRow}><span style={s.profileLabel}>Specialization:</span><span>{profile?.specialization || "—"}</span></div>
          </div>
        )}

        <div style={{ ...s.card, margin: "0" }}>
          <div style={s.metaHeader}>Uploaded Verification Docs ({documents?.length || 0})</div>
          {(!documents || documents.length === 0) ? (
            <div style={{ color: "#64748b", fontSize: "0.85rem", padding: "10px 0" }}>No documents uploaded.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
              {documents.map((d) => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>{d.documentType?.replace(/_/g, " ")}</span>
                    <span style={{ display: "block", fontSize: "0.7rem", color: "#64748b" }}>
                      Uploaded: {new Date(d.uploadedAt || d.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <a
                    href={`/api/documents/${d.id}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: "700", textDecoration: "none" }}
                  >
                    👁 View / Download File
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PendingTable({ items, type, token, onRefresh }) {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [processing, setProcessing] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const handleAction = async (userId, action) => {
    setMsg(""); setErr(""); setProcessing(userId + action);
    try {
      const res = await fetch(`/api/admin/verify/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Action failed"); }
      else { setMsg(`${action} applied to user.`); onRefresh(); }
    } catch { setErr("Could not reach server."); }
    finally { setProcessing(null); }
  };

  return (
    <div>
      {err && <div style={s.error}>{err}</div>}
      {msg && <div style={s.successMsg}>✓ {msg}</div>}
      {items.length === 0 ? (
        <div style={s.emptyState}>No pending {type}s — queue is clear ✓</div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Name</th>
              <th style={s.th}>Email</th>
              <th style={s.th}>City</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Submitted</th>
              <th style={s.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const profile = item;
              const user = item.user;
              return (
                <tr key={profile.userId}>
                  <td style={s.td}>
                    <button
                      style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "700", textDecoration: "underline", cursor: "pointer", padding: 0 }}
                      onClick={() => setSelectedUserId(profile.userId)}
                    >
                      {profile.fullName || "—"}
                    </button>
                  </td>
                  <td style={s.td}>{user?.email || "—"}</td>
                  <td style={s.td}>{profile.city || "—"}</td>
                  <td style={s.td}>
                    <span style={s.badge("yellow")}>
                      {profile.verificationStatus?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td style={s.td}>{new Date(profile.createdAt).toLocaleDateString("en-IN")}</td>
                  <td style={s.td}>
                    <div style={s.actionRow}>
                      {ACTIONS.map((a) => (
                        <button
                          key={a.key}
                          style={s.actionBtn(a.color)}
                          disabled={!!processing}
                          onClick={() => handleAction(profile.userId, a.key)}
                        >
                          {processing === profile.userId + a.key ? "…" : a.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {selectedUserId && (
        <UserDetailModal userId={selectedUserId} token={token} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pending, setPending] = useState({ doctors: [], reviewers: [] });
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, patients: 0, doctors: 0, reviewers: 0 });
  const [activeTab, setActiveTab] = useState("doctors");
  const [currentSection, setCurrentSection] = useState("verification"); // "verification" | "cases"
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [token, setToken] = useState("");

  const fetchData = useCallback(async (t) => {
    try {
      const [pendingRes, usersRes] = await Promise.all([
        fetch("/api/admin/pending", { headers: { Authorization: `Bearer ${t}` } }),
        fetch("/api/admin/users?limit=1", { headers: { Authorization: `Bearer ${t}` } }),
      ]);
      const pendingData = await pendingRes.json();
      const usersData = await usersRes.json();

      if (pendingRes.ok) setPending(pendingData);

      // Fetch counts per role
      const [pRes, dRes, rRes] = await Promise.all([
        fetch("/api/admin/users?role=patient&limit=1", { headers: { Authorization: `Bearer ${t}` } }),
        fetch("/api/admin/users?role=doctor&limit=1", { headers: { Authorization: `Bearer ${t}` } }),
        fetch("/api/admin/users?role=hitl_reviewer&limit=1", { headers: { Authorization: `Bearer ${t}` } }),
      ]);
      const [pd, dd, rd] = await Promise.all([pRes.json(), dRes.json(), rRes.json()]);
      setStats({
        total: usersData.total || 0,
        patients: pd.total || 0,
        doctors: dd.total || 0,
        reviewers: rd.total || 0,
      });
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const fetchRequests = useCallback(async (t) => {
    setRequestsLoading(true);
    try {
      const res = await fetch("/api/admin/requests", {
        headers: { Authorization: `Bearer ${t}` }
      });
      const data = await res.json();
      if (res.ok) setRequests(data.requests || []);
    } catch { /* silent */ }
    finally { setRequestsLoading(false); }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const t = localStorage.getItem("accessToken");
    if (!stored || !t) { navigate("/login"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "admin") { navigate("/login"); return; }
    setUser(u);
    setToken(t);
    fetchData(t);
    fetchRequests(t);
  }, [navigate, fetchData, fetchRequests]);

  const logout = () => { localStorage.clear(); navigate("/login"); };

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading…</div>;

  const totalPending = pending.doctors.length + pending.reviewers.length;

  // Aggregate request statuses
  const requestsSummary = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "PENDING").length,
    accepted: requests.filter((r) => r.status === "ACCEPTED").length,
    emergency: requests.filter((r) => r.triageCategory === "EMERGENCY_ESCALATION").length,
    physical: requests.filter((r) => r.triageCategory === "PHYSICAL_VISIT").length,
    tele: requests.filter((r) => r.triageCategory === "TELECONSULTATION").length,
  };

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <span style={s.navTitle}>🌿 Sanjeevani — Admin</span>
        <div style={s.navRight}>
          <span style={s.navUser}>{user?.email}</span>
          <button style={s.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </nav>

      <div style={s.body}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <div style={s.title}>Admin Control Center</div>
            <div style={s.sub}>Platform monitoring and credentials verification dashboard</div>
          </div>
          {/* Main Dashboard Navigation Switcher */}
          <div style={{ display: "flex", background: "#e2e8f0", padding: "4px", borderRadius: "8px" }}>
            <button
              onClick={() => setCurrentSection("verification")}
              style={{
                padding: "8px 16px", border: "none", cursor: "pointer", borderRadius: "6px", fontSize: "0.875rem", fontWeight: "600",
                background: currentSection === "verification" ? "#fff" : "none",
                color: currentSection === "verification" ? "#2563eb" : "#475569",
              }}
            >
              Verification Queue ({totalPending})
            </button>
            <button
              onClick={() => setCurrentSection("cases")}
              style={{
                padding: "8px 16px", border: "none", cursor: "pointer", borderRadius: "6px", fontSize: "0.875rem", fontWeight: "600",
                background: currentSection === "cases" ? "#fff" : "none",
                color: currentSection === "cases" ? "#2563eb" : "#475569",
              }}
            >
              Patient Cases ({requests.length})
            </button>
          </div>
        </div>

        {currentSection === "verification" ? (
          <div>
            {/* Stats */}
            <div style={s.statsRow}>
              {[
                { num: stats.total, label: "Total Users" },
                { num: stats.patients, label: "Patients" },
                { num: stats.doctors, label: "Doctors" },
                { num: stats.reviewers, label: "Medical Reviewers" },
                { num: totalPending, label: "Pending Verifications" },
              ].map((stat) => (
                <div key={stat.label} style={s.statCard}>
                  <div style={{ ...s.statNum, color: stat.label === "Pending Verifications" && stat.num > 0 ? "#dc2626" : "#111" }}>
                    {stat.num}
                  </div>
                  <div style={s.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Verification queue */}
            <div style={s.sectionTitle}>Verification Queue</div>
            <div style={s.card}>
              <div style={s.tabs}>
                <button style={s.tab(activeTab === "doctors")} onClick={() => setActiveTab("doctors")}>
                  Doctors ({pending.doctors.length})
                </button>
                <button style={s.tab(activeTab === "reviewers")} onClick={() => setActiveTab("reviewers")}>
                  Medical Reviewers ({pending.reviewers.length})
                </button>
              </div>

              {activeTab === "doctors" && (
                <PendingTable items={pending.doctors} type="doctor" token={token} onRefresh={() => fetchData(token)} />
              )}
              {activeTab === "reviewers" && (
                <PendingTable items={pending.reviewers} type="reviewer" token={token} onRefresh={() => fetchData(token)} />
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* Clinical stats card */}
            <div style={s.statsRow}>
              {[
                { num: requestsSummary.total, label: "Total Audited Cases" },
                { num: requestsSummary.pending, label: "Unassigned Requests" },
                { num: requestsSummary.accepted, label: "Active Treatments" },
                { num: requestsSummary.emergency, label: "🚨 Emergencies", color: "#dc2626" },
                { num: requestsSummary.physical, label: "🏥 Physical Visits", color: "#d97706" },
                { num: requestsSummary.tele, label: "💻 Teleconsultation", color: "#059669" },
              ].map((stat) => (
                <div key={stat.label} style={s.statCard}>
                  <div style={{ ...s.statNum, color: stat.color || "#111" }}>
                    {stat.num}
                  </div>
                  <div style={s.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 0 12px" }}>
              <div style={{ ...s.sectionTitle, margin: "0" }}>Active Patient Requests & Clinical Audits</div>
              <button
                style={{ ...s.logoutBtn, borderColor: "#cbd5e1", color: "#475569" }}
                onClick={() => fetchRequests(token)}
                disabled={requestsLoading}
              >
                {requestsLoading ? "Refreshing…" : "🔄 Refresh Log"}
              </button>
            </div>

            <div style={s.card}>
              {requestsLoading ? (
                <div style={s.emptyState}>Loading patient cases list...</div>
              ) : requests.length === 0 ? (
                <div style={s.emptyState}>No patient requests have been submitted on Sanjeevani yet.</div>
              ) : (
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Patient</th>
                      <th style={s.th}>Symptoms</th>
                      <th style={s.th}>Triage Category</th>
                      <th style={s.th}>Region / Location</th>
                      <th style={s.th}>Status</th>
                      <th style={s.th}>Assigned Attending Doctor</th>
                      <th style={s.th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.id}>
                        <td style={s.td}>
                          <div style={{ fontWeight: "700" }}>{r.patientUser?.patientProfile?.fullName || "Patient"}</div>
                          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{r.patientUser?.email || "No email"}</div>
                        </td>
                        <td style={s.td}>
                          <div style={{ fontWeight: "500", color: "#374151" }}>{r.symptoms}</div>
                          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Req: {r.requirement}</div>
                        </td>
                        <td style={s.td}>
                          <span style={s.badge(
                            r.triageCategory === 'EMERGENCY_ESCALATION' ? 'red' : r.triageCategory === 'PHYSICAL_VISIT' ? 'yellow' : 'green'
                          )}>
                            {r.triageCategory?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td style={s.td}>{r.location}</td>
                        <td style={s.td}>
                          <span style={s.badge(r.status === 'ACCEPTED' ? 'green' : 'blue')}>
                            {r.status}
                          </span>
                        </td>
                        <td style={s.td}>
                          {r.doctorUser?.doctorProfile?.fullName ? (
                            <span style={{ color: "#047857", fontWeight: "700" }}>
                              👨‍⚕️ Dr. {r.doctorUser.doctorProfile.fullName}
                            </span>
                          ) : (
                            <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td style={s.td}>{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
