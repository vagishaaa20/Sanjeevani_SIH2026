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
};

const ACTIONS = [
  { key: "approve", label: "Approve", color: "green" },
  { key: "reject", label: "Reject", color: "red" },
  { key: "request_resubmission", label: "Request Resubmission", color: "blue" },
  { key: "suspend", label: "Suspend", color: "red" },
];

function PendingTable({ items, type, token, onRefresh }) {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [processing, setProcessing] = useState(null);

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
                  <td style={s.td}>{profile.fullName || "—"}</td>
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
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pending, setPending] = useState({ doctors: [], reviewers: [] });
  const [stats, setStats] = useState({ total: 0, patients: 0, doctors: 0, reviewers: 0 });
  const [activeTab, setActiveTab] = useState("doctors");
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const t = localStorage.getItem("accessToken");
    if (!stored || !t) { navigate("/login"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "admin") { navigate("/login"); return; }
    setUser(u);
    setToken(t);
    fetchData(t);
  }, [navigate, fetchData]);

  const logout = () => { localStorage.clear(); navigate("/login"); };

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading…</div>;

  const totalPending = pending.doctors.length + pending.reviewers.length;

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
        <div style={s.title}>Admin Dashboard</div>
        <div style={s.sub}>Platform overview and verification management</div>

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
    </div>
  );
}
