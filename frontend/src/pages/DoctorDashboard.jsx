import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const styles = {
  container: { display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif" },
  sidebar: { width: "260px", background: "#1e293b", color: "#f8fafc", display: "flex", flexDirection: "column", borderRight: "1px solid #e2e8f0" },
  sidebarHeader: { padding: "24px 20px", borderBottom: "1px solid #334155", display: "flex", flexDirection: "column", gap: "4px" },
  sidebarBrand: { fontSize: "1.25rem", fontWeight: "700", color: "#38bdf8" },
  sidebarUser: { fontSize: "0.875rem", color: "#94a3b8", textOverflow: "ellipsis", overflow: "hidden" },
  sidebarMenu: { padding: "20px 10px", display: "flex", flexDirection: "column", gap: "6px", flex: 1 },
  menuItem: (active) => ({
    display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "8px",
    textDecoration: "none", color: active ? "#fff" : "#cbd5e1", background: active ? "#0284c7" : "transparent",
    fontWeight: active ? "600" : "500", border: "none", cursor: "pointer", width: "100%", textAlign: "left", fontSize: "0.9375rem"
  }),
  logoutBtn: {
    margin: "auto 10px 20px", display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px",
    borderRadius: "8px", color: "#fca5a5", background: "transparent", border: "none", cursor: "pointer",
    textAlign: "left", fontWeight: "600", fontSize: "0.9375rem"
  },
  content: { flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" },
  header: { background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: "1.25rem", fontWeight: "700", color: "#0f172a" },
  body: { padding: "24px", flex: 1, overflowY: "auto" },
  // Alerts
  pendingAlert: { background: "#fef9c3", border: "1px solid #fde68a", borderRadius: "8px", padding: "16px", marginBottom: "20px" },
  alertTitle: { fontWeight: "700", color: "#854d0e", fontSize: "0.9375rem", display: "flex", alignItems: "center", gap: "8px" },
  alertText: { color: "#713f12", fontSize: "0.875rem", marginTop: "4px", lineHeight: "1.5" },
  // Locked screen
  lockScreen: { maxWidth: "600px", margin: "40px auto", padding: "32px", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" },
  lockHeader: { textAlign: "center", marginBottom: "24px" },
  lockIcon: { fontSize: "3rem", display: "block", marginBottom: "12px" },
  lockTitle: { fontSize: "1.5rem", fontWeight: "700", color: "#0f172a" },
  // Dashboard view
  dashboardGrid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" },
  card: { background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", marginBottom: "20px" },
  cardTitle: { fontSize: "1rem", fontWeight: "700", color: "#0f172a", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  // Interactive forms & tables
  formGroup: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" },
  label: { fontSize: "0.8125rem", fontWeight: "600", color: "#475569" },
  input: { padding: "8px 12px", border: "1.5px solid #cbd5e1", borderRadius: "6px", fontSize: "0.9rem", outline: "none", background: "#fff", color: "#0f172a" },
  select: { padding: "8px 12px", border: "1.5px solid #cbd5e1", borderRadius: "6px", fontSize: "0.9rem", background: "#fff" },
  button: { background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", fontWeight: "600", cursor: "pointer", fontSize: "0.875rem" },
  btnSec: { background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px 16px", fontWeight: "600", cursor: "pointer", fontSize: "0.875rem" },
  btnDanger: { background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", fontWeight: "600", cursor: "pointer", fontSize: "0.875rem" },
  // Clinic items
  clinicList: { display: "flex", flexDirection: "column", gap: "12px" },
  clinicItem: { border: "1.5px solid #e2e8f0", borderRadius: "10px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "#fff" },
  clinicMeta: { display: "flex", flexDirection: "column", gap: "4px" },
  clinicName: { fontWeight: "700", color: "#0f172a", fontSize: "0.95rem" },
  clinicDetail: { fontSize: "0.8125rem", color: "#64748b" },
  clinicDays: { display: "flex", gap: "4px", marginTop: "6px" },
  dayBadge: { fontSize: "0.7rem", fontWeight: "700", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", color: "#475569" },
  // Toggle Switch
  switchContainer: { display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" },
  switchLabel: { fontSize: "0.9rem", fontWeight: "600", color: "#1e293b", flex: 1 },
  // Badges
  badge: (color) => ({
    display: "inline-block", padding: "3px 10px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: "700",
    background: color === "green" ? "#dcfce7" : color === "red" ? "#fee2e2" : "#fef9c3",
    color: color === "green" ? "#15803d" : color === "red" ? "#b91c1c" : "#854d0e"
  }),
  error: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", padding: "10px 14px", borderRadius: "6px", fontSize: "0.875rem", marginBottom: "16px" },
  success: { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "6px", fontSize: "0.875rem", marginBottom: "16px" },
  // Table
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: "0.8125rem", fontWeight: "700", color: "#64748b", padding: "8px 12px", borderBottom: "2px solid #e2e8f0" },
  td: { fontSize: "0.875rem", color: "#334155", padding: "10px 12px", borderBottom: "1px solid #f1f5f9" },
  // Document uploading list
  docUploadRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderBottom: "1px solid #e2e8f0" },
  uploadLabel: { fontSize: "0.875rem", fontWeight: "600", color: "#334155" },
  profileRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" },
  profileLabel: { fontSize: "0.875rem", color: "#6b7280" },
  profileValue: { fontSize: "0.875rem", color: "#111", fontWeight: "500" },
  docList: { display: "flex", flexDirection: "column", gap: "8px" },
  docItem: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 12px", background: "#f9fafb", borderRadius: "8px",
    fontSize: "0.875rem",
  },
  docName: { color: "#374151", fontWeight: "500" },
  emptyState: { color: "#9ca3af", fontSize: "0.875rem", textAlign: "center", padding: "20px 0" },
};

const VERIFICATION_BADGE = {
  PENDING_VERIFICATION: { label: "Pending Verification", color: "yellow" },
  UNDER_REVIEW: { label: "Under Review", color: "yellow" },
  VERIFIED: { label: "Verified", color: "green" },
  REJECTED: { label: "Rejected", color: "red" },
  SUSPENDED: { label: "Suspended", color: "red" },
};

const DOC_STATUS_BADGE = {
  PENDING: { label: "Pending", color: "yellow" },
  ACCEPTED: { label: "Accepted", color: "green" },
  REJECTED: { label: "Rejected", color: "red" },
};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [docs, setDocs] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "clinics" | "documents"
  const [loading, setLoading] = useState(true);

  // Form states
  const [teleFee, setTeleFee] = useState("");
  const [bookingDisabled, setBookingDisabled] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [updating, setUpdating] = useState(false);

  // New clinic form state
  const [showClinicForm, setShowClinicForm] = useState(false);
  const [clinicForm, setClinicForm] = useState({ name: "", address: "", fee: "", days: [], start: "09:00", end: "17:00" });

  const loadData = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const [pRes, dRes] = await Promise.all([
        fetch("/api/profile/me", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        fetch("/api/documents/my", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      ]);
      if (pRes.profile) {
        setProfile(pRes.profile);
        const avail = pRes.profile.availability || {};
        setBookingDisabled(avail.bookingDisabled || false);
        setTeleFee(avail.teleconsultationFee || pRes.profile.consultationFee || "");
      }
      setDocs(dRes.documents || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
    if (!stored || !token) { navigate("/login"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "doctor") { navigate("/login"); return; }
    setUser(u);

    loadData().finally(() => setLoading(false));
  }, [navigate, loadData]);

  const logout = () => { localStorage.clear(); navigate("/login"); };

  // Handle document upload for verified/unverified docs
  const [uploadFiles, setUploadFiles] = useState({});
  const [uploadingDoc, setUploadingDoc] = useState(null);

  const handleDocUpload = async (docType) => {
    const file = uploadFiles[docType];
    if (!file) return;
    setUploadingDoc(docType);
    setErrorMsg("");
    setSuccessMsg("");
    const token = localStorage.getItem("accessToken");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("documentType", docType);
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Upload failed.");
      } else {
        setSuccessMsg("Document uploaded successfully.");
        await loadData();
      }
    } catch {
      setErrorMsg("Network error uploading document.");
    } finally {
      setUploadingDoc(null);
    }
  };

  // Update availability settings (Teleconsultation Fee and Booking Toggle)
  const saveAvailabilitySettings = async (disabledVal, feeVal) => {
    setUpdating(true);
    setErrorMsg("");
    setSuccessMsg("");
    const token = localStorage.getItem("accessToken");
    try {
      const currentAvail = profile?.availability || {};
      const newAvail = {
        ...currentAvail,
        bookingDisabled: disabledVal,
        teleconsultationFee: parseFloat(feeVal) || 0,
      };

      const res = await fetch("/api/profile/doctor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ availability: newAvail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update settings.");
      } else {
        setSuccessMsg("Settings updated successfully.");
        setProfile(data.profile);
      }
    } catch {
      setErrorMsg("Network error saving settings.");
    } finally {
      setUpdating(false);
    }
  };

  // Add Clinic/Institution Location
  const handleAddClinic = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    const token = localStorage.getItem("accessToken");
    try {
      const currentAvail = profile?.availability || {};
      const clinicsList = currentAvail.clinics || [];
      const newClinic = {
        id: String(Date.now()),
        name: clinicForm.name,
        address: clinicForm.address,
        fee: parseFloat(clinicForm.fee) || 0,
        days: clinicForm.days,
        timing: `${clinicForm.start} - ${clinicForm.end}`,
      };

      const newAvail = {
        ...currentAvail,
        clinics: [...clinicsList, newClinic],
      };

      const res = await fetch("/api/profile/doctor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ availability: newAvail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to add clinic.");
      } else {
        setSuccessMsg("Clinic added successfully.");
        setProfile(data.profile);
        setClinicForm({ name: "", address: "", fee: "", days: [], start: "09:00", end: "17:00" });
        setShowClinicForm(false);
      }
    } catch {
      setErrorMsg("Network error adding clinic.");
    }
  };

  // Remove Clinic/Institution
  const handleRemoveClinic = async (clinicId) => {
    if (!window.confirm("Remove this clinic location?")) return;
    setErrorMsg("");
    setSuccessMsg("");
    const token = localStorage.getItem("accessToken");
    try {
      const currentAvail = profile?.availability || {};
      const clinicsList = currentAvail.clinics || [];
      const newAvail = {
        ...currentAvail,
        clinics: clinicsList.filter((c) => c.id !== clinicId),
      };

      const res = await fetch("/api/profile/doctor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ availability: newAvail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to remove clinic.");
      } else {
        setSuccessMsg("Clinic removed successfully.");
        setProfile(data.profile);
      }
    } catch {
      setErrorMsg("Network error removing clinic.");
    }
  };

  const toggleDay = (day) => {
    setClinicForm((prev) => {
      const days = prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day];
      return { ...prev, days };
    });
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading doctor profile…</div>;

  const isVerified = profile?.verificationStatus === "VERIFIED";

  /* ──────────────────────────────────────────────────────────────────────────
     LOCKED STATE FOR UNVERIFIED DOCTORS
     ────────────────────────────────────────────────────────────────────────── */
  if (!isVerified) {
    return (
      <div style={styles.container}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarBrand}>🌿 Sanjeevani</span>
            <span style={styles.sidebarUser}>{user?.email}</span>
          </div>
          <div style={styles.sidebarMenu}>
            <button style={styles.menuItem(true)}>Verification Locked</button>
          </div>
          <button style={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
        <div style={styles.content}>
          <header style={styles.header}>
            <span style={styles.headerTitle}>Account Verification Required</span>
            <span style={styles.badge("red")}>{profile?.verificationStatus?.replace(/_/g, " ")}</span>
          </header>
          <div style={styles.body}>
            <div style={styles.lockScreen}>
              <div style={styles.lockHeader}>
                <span style={styles.lockIcon}>🔒</span>
                <h2 style={styles.lockTitle}>Verification Pending</h2>
                <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "8px" }}>
                  Your account is pending professional verification by our medical administration team. 
                  You will gain access to the clinical dashboard and patient queues once your credentials are approved.
                </p>
              </div>

              {errorMsg && <div style={styles.error}>{errorMsg}</div>}
              {successMsg && <div style={styles.success}>{successMsg}</div>}

              {profile?.verificationNotes && (
                <div style={{ ...styles.pendingAlert, background: "#fee2e2", border: "1px solid #fca5a5" }}>
                  <div style={{ ...styles.alertTitle, color: "#991b1b" }}>⚠️ Message from Administrator</div>
                  <div style={{ ...styles.alertText, color: "#7f1d1d" }}>"{profile.verificationNotes}"</div>
                </div>
              )}

              <h4 style={{ fontWeight: "700", color: "#334155", marginBottom: "12px", fontSize: "0.95rem" }}>
                Verification Documents Checklist
              </h4>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", marginBottom: "24px" }}>
                {DOCTOR_DOCS.map((docDef) => {
                  const uploadedDoc = docs.find((d) => d.documentType === docDef.type);
                  return (
                    <div key={docDef.type} style={styles.docUploadRow}>
                      <div>
                        <div style={styles.uploadLabel}>
                          {docDef.label} {docDef.required && <span style={{ color: "#ef4444" }}>*</span>}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          Status: {uploadedDoc ? (
                            <span style={{ fontWeight: "600", color: uploadedDoc.status === "ACCEPTED" ? "#16a34a" : uploadedDoc.status === "PENDING" ? "#d97706" : "#dc2626" }}>
                              {uploadedDoc.status}
                            </span>
                          ) : "Not uploaded"}
                        </div>
                      </div>
                      <div>
                        {uploadedDoc ? (
                          <span style={{ fontSize: "0.875rem", color: "#16a34a", fontWeight: "600" }}>✓ Submitted</span>
                        ) : (
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              style={{ fontSize: "0.75rem" }}
                              onChange={(e) => setUploadFiles((prev) => ({ ...prev, [docDef.type]: e.target.files[0] }))}
                            />
                            {uploadFiles[docDef.type] && (
                              <button
                                style={styles.button}
                                onClick={() => handleDocUpload(docDef.type)}
                                disabled={uploadingDoc === docDef.type}
                              >
                                {uploadingDoc === docDef.type ? "…" : "Upload"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ textAlign: "center" }}>
                <button style={styles.btnSec} onClick={loadData}>
                  🔄 Refresh Verification Status
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────────────────────
     VERIFIED CLINICAL DASHBOARD
     ────────────────────────────────────────────────────────────────────────── */
  const clinicsList = profile?.availability?.clinics || [];

  return (
    <div style={styles.container}>
      {/* Sidebar Navigation */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.sidebarBrand}>🌿 Sanjeevani</span>
          <span style={styles.sidebarUser}>Dr. {profile?.fullName || user?.email}</span>
        </div>
        <div style={styles.sidebarMenu}>
          <button style={styles.menuItem(activeTab === "dashboard")} onClick={() => { setActiveTab("dashboard"); setErrorMsg(""); setSuccessMsg(""); }}>
            🏥 Clinical Dashboard
          </button>
          <button style={styles.menuItem(activeTab === "clinics")} onClick={() => { setActiveTab("clinics"); setErrorMsg(""); setSuccessMsg(""); }}>
            🏢 My Practice Locations
          </button>
          <button style={styles.menuItem(activeTab === "documents")} onClick={() => { setActiveTab("documents"); setErrorMsg(""); setSuccessMsg(""); }}>
            📎 Verification Credentials
          </button>
        </div>
        <button style={styles.logoutBtn} onClick={logout}>Logout</button>
      </div>

      {/* Main Workspace */}
      <div style={styles.content}>
        <header style={styles.header}>
          <span style={styles.headerTitle}>
            {activeTab === "dashboard" && "Clinical Queue & Teleconsultations"}
            {activeTab === "clinics" && "Manage Practice Locations"}
            {activeTab === "documents" && "Verification Credentials"}
          </span>
          <span style={styles.badge("green")}>Active & Verified</span>
        </header>

        <div style={styles.body}>
          {errorMsg && <div style={styles.error}>{errorMsg}</div>}
          {successMsg && <div style={styles.success}>{successMsg}</div>}

          {/* TAB 1: Clinical Dashboard */}
          {activeTab === "dashboard" && (
            <div style={styles.dashboardGrid}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Teleconsultation requests widget */}
                <div style={styles.card}>
                  <div style={styles.cardTitle}>
                    <span>Teleconsultation Requests</span>
                    <span style={styles.badge("blue")}>0 Pending</span>
                  </div>
                  <div style={styles.emptyState}>No virtual teleconsultation requests at the moment.</div>
                </div>

                {/* Today's appointments queue widget */}
                <div style={styles.card}>
                  <div style={styles.cardTitle}>
                    <span>Today's Appointment Queue</span>
                    <span style={styles.badge("green")}>0 Scheduled</span>
                  </div>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Time</th>
                        <th style={styles.th}>Patient</th>
                        <th style={styles.th}>Consultation Type</th>
                        <th style={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center" }}>
                          <div style={styles.emptyState}>No patient appointments scheduled for today.</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sidebar Config widgets */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Today's availability settings */}
                <div style={styles.card}>
                  <div style={styles.cardTitle}>Practice Availability</div>

                  {/* Toggle Button for Disabling Booking Option */}
                  <div style={styles.switchContainer}>
                    <div style={styles.switchLabel}>
                      {bookingDisabled ? "🚨 Booking Disabled" : "✅ Accepting Bookings"}
                      <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "normal", marginTop: "2px" }}>
                        {bookingDisabled ? "Patients cannot schedule new appointments today" : "Patients can schedule visits"}
                      </div>
                    </div>
                    <button
                      style={bookingDisabled ? styles.button : styles.btnDanger}
                      onClick={() => {
                        const newVal = !bookingDisabled;
                        setBookingDisabled(newVal);
                        saveAvailabilitySettings(newVal, teleFee);
                      }}
                      disabled={updating}
                    >
                      {bookingDisabled ? "Enable Booking" : "Disable Booking"}
                    </button>
                  </div>

                  {/* Price Setting for Teleconsultation option */}
                  <div style={{ ...styles.formGroup, marginTop: "20px" }}>
                    <label style={styles.label}>Teleconsultation Fee (₹) *</label>
                    <input
                      style={styles.input}
                      type="number"
                      value={teleFee}
                      onChange={(e) => setTeleFee(e.target.value)}
                      placeholder="e.g. 500"
                    />
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Set pricing for video/voice consults</span>
                  </div>
                  <button
                    style={{ ...styles.button, width: "100%" }}
                    onClick={() => saveAvailabilitySettings(bookingDisabled, teleFee)}
                    disabled={updating}
                  >
                    {updating ? "Saving…" : "Save Practice Pricing"}
                  </button>
                </div>

                {/* Profile Overview */}
                <div style={styles.card}>
                  <div style={styles.cardTitle}>Professional Scope</div>
                  <div style={styles.profileRow}>
                    <span style={styles.profileLabel}>Speciality</span>
                    <span style={styles.profileValue}>{profile?.specialization || "General Medicine"}</span>
                  </div>
                  <div style={styles.profileRow}>
                    <span style={styles.profileLabel}>Exp. Years</span>
                    <span style={styles.profileValue}>{profile?.yearsOfExperience || "0"} years</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Clinics / Practice Locations */}
          {activeTab === "clinics" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <span style={{ fontSize: "1rem", fontWeight: "700", color: "#334155" }}>Your Practice Locations</span>
                <button style={styles.button} onClick={() => setShowClinicForm(!showClinicForm)}>
                  {showClinicForm ? "Close Form" : "+ Add Clinic / Institute"}
                </button>
              </div>

              {showClinicForm && (
                <form onSubmit={handleAddClinic} style={{ ...styles.card, background: "#f8fafc" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "16px", color: "#1e293b" }}>
                    Add a clinic location
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Clinic / Hospital Name *</label>
                    <input
                      style={styles.input}
                      type="text"
                      placeholder="e.g. Sanjeevani Health Center"
                      value={clinicForm.name}
                      onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Address / Locality *</label>
                    <input
                      style={styles.input}
                      type="text"
                      placeholder="e.g. 12 MG Road, near Metro Station, Delhi"
                      value={clinicForm.address}
                      onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                      required
                    />
                  </div>
                  <div style={styles.row}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Consultation Fee (₹) *</label>
                      <input
                        style={styles.input}
                        type="number"
                        placeholder="e.g. 600"
                        value={clinicForm.fee}
                        onChange={(e) => setClinicForm({ ...clinicForm, fee: e.target.value })}
                        required
                      />
                    </div>
                    <div style={styles.row}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Start Time</label>
                        <input
                          style={styles.input}
                          type="time"
                          value={clinicForm.start}
                          onChange={(e) => setClinicForm({ ...clinicForm, start: e.target.value })}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>End Time</label>
                        <input
                          style={styles.input}
                          type="time"
                          value={clinicForm.end}
                          onChange={(e) => setClinicForm({ ...clinicForm, end: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Days of consultation *</label>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                      {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDay(d)}
                          style={{
                            padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1",
                            fontSize: "0.75rem", fontWeight: "700", cursor: "pointer",
                            background: clinicForm.days.includes(d) ? "#0284c7" : "#fff",
                            color: clinicForm.days.includes(d) ? "#fff" : "#475569",
                          }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                    <button style={styles.button} type="submit">
                      Save Clinic Location
                    </button>
                    <button style={styles.btnSec} type="button" onClick={() => setShowClinicForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {clinicsList.length === 0 ? (
                <div style={styles.card}>
                  <div style={styles.emptyState}>No practice locations added. Click "+ Add Clinic / Institute" above.</div>
                </div>
              ) : (
                <div style={styles.clinicList}>
                  {clinicsList.map((c) => (
                    <div key={c.id} style={styles.clinicItem}>
                      <div style={styles.clinicMeta}>
                        <span style={styles.clinicName}>{c.name}</span>
                        <span style={styles.clinicDetail}>📍 {c.address}</span>
                        <span style={styles.clinicDetail}>⏰ {c.timing}</span>
                        <span style={styles.clinicDetail}>💰 Consultation fee: ₹{c.fee}</span>
                        <div style={styles.clinicDays}>
                          {c.days?.map((d) => (
                            <span key={d} style={styles.dayBadge}>{d}</span>
                          ))}
                        </div>
                      </div>
                      <button style={styles.btnDanger} onClick={() => handleRemoveClinic(c.id)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Uploaded Documents */}
          {activeTab === "documents" && (
            <div style={styles.card}>
              <div style={{ marginBottom: "20px" }}>
                <span style={{ fontSize: "1rem", fontWeight: "700", color: "#334155" }}>Your Credentials Checklist</span>
                <p style={{ fontSize: "0.8125rem", color: "#64748b", marginTop: "4px" }}>
                  Below are the credential documents submitted during registration or verification review.
                </p>
              </div>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                {docs.map((doc) => (
                  <div key={doc.id} style={styles.docUploadRow}>
                    <div>
                      <div style={styles.uploadLabel}>{doc.documentType?.replace(/_/g, " ")}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        Submitted: {new Date(doc.createdAt).toLocaleDateString("en-IN")}
                      </div>
                    </div>
                    <span style={styles.badge(doc.status === "ACCEPTED" ? "green" : doc.status === "PENDING" ? "yellow" : "red")}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
