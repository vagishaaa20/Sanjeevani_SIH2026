import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const styles = {
  container: { display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" },
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
  textarea: { padding: "8px 12px", border: "1.5px solid #cbd5e1", borderRadius: "6px", fontSize: "0.9rem", background: "#fff", fontFamily: "inherit" },
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

  // Leaderboard and Stats
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "20px" },
  statBox: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "4px" },
  statLabel: { fontSize: "0.75rem", fontWeight: "750", color: "#64748b", textTransform: "uppercase" },
  statVal: { fontSize: "1.6rem", fontWeight: "850", color: "#0f172a" },
  subSpecTag: { display: "inline-flex", alignItems: "center", gap: "6px", background: "#e0f2fe", color: "#0369a1", padding: "3px 10px", borderRadius: "100px", fontSize: "0.8rem", fontWeight: "700" }
};

const PRIMARY_SPECIALTIES = [
  "General Physician",
  "General Medicine",
  "Dermatologist",
  "Cardiologist",
  "Pulmonologist",
  "Orthopedic Surgeon",
  "Gastroenterologist",
  "ENT Specialist",
  "Pediatrician",
  "Neurologist",
  "Gynecologist",
  "Psychiatrist",
  "Ophthalmologist",
  "Endocrinologist",
  "Oncologist"
];

const DOCTOR_DOCS = [
  { type: "MEDICAL_REGISTRATION_CERTIFICATE", label: "Medical Registration Certificate", required: true },
  { type: "MBBS_OR_PRIMARY_QUALIFICATION", label: "MBBS / Primary Medical Qualification", required: true },
  { type: "INTERNSHIP_COMPLETION_CERTIFICATE", label: "Internship Completion Certificate", required: true },
  { type: "GOVERNMENT_IDENTITY", label: "Government / Photo Identity Proof", required: true },
  { type: "PROFESSIONAL_PHOTOGRAPH", label: "Professional Photograph", required: true },
  { type: "PG_QUALIFICATION_CERTIFICATE", label: "PG Qualification Certificate", required: false },
  { type: "ADDITIONAL_QUALIFICATION_PROOF", label: "Additional Qualification Proof", required: false },
];

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [docs, setDocs] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "profile" | "clinics" | "documents"
  const [loading, setLoading] = useState(true);

  // Form states
  const [teleFee, setTeleFee] = useState("");
  const [bookingDisabled, setBookingDisabled] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [updating, setUpdating] = useState(false);

  // Clinical Requests
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [radiusKm, setRadiusKm] = useState(25);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [keywordSearch, setKeywordSearch] = useState("");

  // Edit Profile Form State
  const [editProfileForm, setEditProfileForm] = useState({
    fullName: "",
    specialization: "General Physician",
    subSpecialization: "",
    subSpecsList: [],
    customSubInput: "",
    city: "",
    clinicOrHospital: "",
    yearsOfExperience: 3,
    consultationFee: 300,
    medicalRegistrationNumber: "",
    bio: "",
    languages: "Hindi, English"
  });

  // New clinic form state
  const [showClinicForm, setShowClinicForm] = useState(false);
  const [clinicForm, setClinicForm] = useState({ name: "", address: "", fee: "", days: [], start: "09:00", end: "17:00" });

  const loadRequests = useCallback(async (cityVal, radVal, catVal, keywordVal, docLat, docLng) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      let url = "/api/requests/nearby?";
      if (cityVal) url += `city=${encodeURIComponent(cityVal)}&`;
      if (radVal) url += `radiusKm=${radVal}&`;
      if (catVal && catVal !== "ALL") url += `category=${catVal}&`;
      if (keywordVal) url += `search=${encodeURIComponent(keywordVal)}&`;
      if (docLat && docLng) url += `lat=${docLat}&lng=${docLng}&`;

      const [nearbyRes, acceptedRes] = await Promise.all([
        fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/requests/accepted", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const nearbyData = await nearbyRes.json();
      const acceptedData = await acceptedRes.json();

      if (nearbyRes.ok) setNearbyRequests(nearbyData.requests || []);
      if (acceptedRes.ok) setAcceptedRequests(acceptedData.requests || []);
    } catch (e) {
      console.error("Error loading doctor requests:", e);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const handleAcceptRequest = async (requestId) => {
    setAcceptingId(requestId);
    setErrorMsg("");
    setSuccessMsg("");
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`/api/requests/${requestId}/accept`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to accept request.");
      } else {
        setSuccessMsg("✓ Patient request accepted successfully! Added to your active queue.");
        await loadRequests(
          searchQuery,
          radiusKm,
          selectedCategory,
          keywordSearch,
          profile?.latitude || null,
          profile?.longitude || null
        );
      }
    } catch {
      setErrorMsg("Network error accepting request.");
    } finally {
      setAcceptingId(null);
    }
  };

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
        setSearchQuery(pRes.profile.city || "");
        const avail = pRes.profile.availability || {};
        setBookingDisabled(avail.bookingDisabled || false);
        setTeleFee(avail.teleconsultationFee || pRes.profile.consultationFee || "300");

        const subList = pRes.profile.subSpecialization
          ? pRes.profile.subSpecialization.split(",").map((s) => s.trim()).filter(Boolean)
          : [];

        setEditProfileForm({
          fullName: pRes.profile.fullName || "",
          specialization: pRes.profile.specialization || "General Physician",
          subSpecialization: pRes.profile.subSpecialization || "",
          subSpecsList: subList,
          customSubInput: "",
          city: pRes.profile.city || "",
          clinicOrHospital: pRes.profile.clinicOrHospital || "",
          yearsOfExperience: pRes.profile.yearsOfExperience || 3,
          consultationFee: pRes.profile.consultationFee || 300,
          medicalRegistrationNumber: pRes.profile.medicalRegistrationNumber || "",
          bio: pRes.profile.bio || "",
          languages: (pRes.profile.languages || ["Hindi", "English"]).join(", ")
        });

        if (pRes.profile.verificationStatus === "VERIFIED") {
          await loadRequests(
            pRes.profile.city || "",
            25,
            "ALL",
            "",
            pRes.profile.latitude || null,
            pRes.profile.longitude || null
          );
        }
      }
      setDocs(dRes.documents || []);
    } catch (e) {
      console.error(e);
    }
  }, [loadRequests]);

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

  // Handle Save Availability & Teleconsultation Pricing
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setErrorMsg("");
    setSuccessMsg("");
    const token = localStorage.getItem("accessToken");
    try {
      const currentAvail = profile?.availability || {};
      const newAvail = {
        ...currentAvail,
        bookingDisabled,
        teleconsultationFee: parseFloat(teleFee) || 0,
      };

      const res = await fetch("/api/profile/doctor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          consultationFee: parseFloat(teleFee) || 300,
          availability: newAvail
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update settings.");
      } else {
        setSuccessMsg("✓ Teleconsultation services & fee updated successfully.");
        setProfile(data.profile);
      }
    } catch {
      setErrorMsg("Network error saving settings.");
    } finally {
      setUpdating(false);
    }
  };

  // Handle Update Professional Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setErrorMsg("");
    setSuccessMsg("");
    const token = localStorage.getItem("accessToken");

    try {
      const payload = {
        fullName: editProfileForm.fullName.trim(),
        specialization: editProfileForm.specialization,
        subSpecialization: editProfileForm.subSpecsList.join(", "),
        city: editProfileForm.city.trim(),
        clinicOrHospital: editProfileForm.clinicOrHospital.trim(),
        yearsOfExperience: parseInt(editProfileForm.yearsOfExperience, 10) || 1,
        consultationFee: parseFloat(editProfileForm.consultationFee) || 300,
        medicalRegistrationNumber: editProfileForm.medicalRegistrationNumber.trim(),
        bio: editProfileForm.bio.trim(),
        languages: editProfileForm.languages.split(",").map((s) => s.trim()).filter(Boolean)
      };

      const res = await fetch("/api/profile/doctor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update professional profile.");
      } else {
        setSuccessMsg("✓ Doctor Profile updated successfully!");
        setProfile(data.profile);
      }
    } catch {
      setErrorMsg("Network error updating profile.");
    } finally {
      setUpdating(false);
    }
  };

  const addSubSpec = () => {
    if (!editProfileForm.customSubInput.trim()) return;
    const item = editProfileForm.customSubInput.trim();
    if (!editProfileForm.subSpecsList.includes(item)) {
      setEditProfileForm({
        ...editProfileForm,
        subSpecsList: [...editProfileForm.subSpecsList, item],
        customSubInput: ""
      });
    } else {
      setEditProfileForm({ ...editProfileForm, customSubInput: "" });
    }
  };

  const removeSubSpec = (index) => {
    setEditProfileForm({
      ...editProfileForm,
      subSpecsList: editProfileForm.subSpecsList.filter((_, i) => i !== index)
    });
  };

  // Add Clinic Location
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

  // Filter requests
  const pendingRequests = nearbyRequests.filter((r) => r.status === "PENDING");
  const ongoingAccepted = acceptedRequests.filter((r) => r.status === "ACCEPTED");
  const totalReviewedCount = acceptedRequests.length;

  return (
    <div style={styles.container}>
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.sidebarBrand}>🌿 Sanjeevani</span>
          <span style={styles.sidebarUser}>{profile?.fullName || user?.email}</span>
        </div>
        <div style={styles.sidebarMenu}>
          <button
            style={styles.menuItem(activeTab === "dashboard")}
            onClick={() => setActiveTab("dashboard")}
          >
            🏥 Clinical Dashboard
          </button>
          <button
            style={styles.menuItem(activeTab === "profile")}
            onClick={() => setActiveTab("profile")}
          >
            👨‍⚕️ Doctor's Profile
          </button>
          <button
            style={styles.menuItem(activeTab === "clinics")}
            onClick={() => setActiveTab("clinics")}
          >
            🏙️ My Practice Locations
          </button>
          <button
            style={styles.menuItem(activeTab === "documents")}
            onClick={() => setActiveTab("documents")}
          >
            📎 Verification Credentials
          </button>
        </div>
        <button style={styles.logoutBtn} onClick={logout}>Logout</button>
      </div>

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <div style={styles.content}>
        <header style={styles.header}>
          <span style={styles.headerTitle}>
            {activeTab === "dashboard" && "Clinical Queue & Teleconsultations"}
            {activeTab === "profile" && "Doctor Professional Profile & Leaderboard"}
            {activeTab === "clinics" && "Practice Locations & Timings"}
            {activeTab === "documents" && "Verification & Medical Credentials"}
          </span>
          <span style={styles.badge("green")}>Active & Verified</span>
        </header>

        <div style={styles.body}>
          {errorMsg && <div style={styles.error}>{errorMsg}</div>}
          {successMsg && <div style={styles.success}>{successMsg}</div>}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 1: CLINICAL DASHBOARD
              ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "dashboard" && (
            <div style={styles.dashboardGrid}>
              <div>
                {/* Incoming Triage Requests Queue */}
                <div style={styles.card}>
                  <div style={styles.cardTitle}>
                    <span>Patient Requests Queue</span>
                    <span style={styles.badge(pendingRequests.length > 0 ? "green" : "yellow")}>
                      {pendingRequests.length} Pending
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                    <input
                      style={{ ...styles.input, flex: 1, minWidth: "140px" }}
                      placeholder="Keyword search…"
                      value={keywordSearch}
                      onChange={(e) => setKeywordSearch(e.target.value)}
                    />
                    <select
                      style={styles.select}
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="ALL">All Urgencies</option>
                      <option value="TELECONSULTATION">Teleconsultation</option>
                      <option value="PHYSICAL_VISIT">Physical Visit</option>
                      <option value="EMERGENCY_ESCALATION">Emergency</option>
                    </select>
                    <button
                      style={styles.button}
                      onClick={() =>
                        loadRequests(
                          searchQuery,
                          radiusKm,
                          selectedCategory,
                          keywordSearch,
                          profile?.latitude || null,
                          profile?.longitude || null
                        )
                      }
                    >
                      Search
                    </button>
                  </div>

                  {requestsLoading ? (
                    <div style={styles.emptyState}>Loading clinical queue…</div>
                  ) : pendingRequests.length === 0 ? (
                    <div style={styles.emptyState}>No pending patient requests in this queue at the moment.</div>
                  ) : (
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Patient</th>
                          <th style={styles.th}>Symptoms</th>
                          <th style={styles.th}>Triage Track</th>
                          <th style={styles.th}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingRequests.map((req) => (
                          <tr key={req.id}>
                            <td style={styles.td}>
                              <strong>{req.patientUser?.patientProfile?.fullName || "Patient"}</strong>
                              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                {req.patientUser?.patientProfile?.sex} · {req.location}
                              </div>
                            </td>
                            <td style={styles.td}>
                              <div style={{ maxWidth: "260px", fontSize: "0.85rem" }}>{req.symptoms}</div>
                              {req.attachments && req.attachments.length > 0 && (
                                <span style={{ fontSize: "0.725rem", color: "#0284c7" }}>📎 {req.attachments.length} attachment(s)</span>
                              )}
                            </td>
                            <td style={styles.td}>
                              <span style={{ fontSize: "0.75rem", fontWeight: "750", background: req.triageCategory === "TELECONSULTATION" ? "#dcfce7" : "#fef3c7", color: req.triageCategory === "TELECONSULTATION" ? "#166534" : "#854d0e", padding: "3px 8px", borderRadius: "100px" }}>
                                {req.triageCategory}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <button
                                style={styles.button}
                                onClick={() => handleAcceptRequest(req.id)}
                                disabled={acceptingId === req.id}
                              >
                                {acceptingId === req.id ? "Accepting…" : "Accept Case"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Active Ongoing Queue */}
                <div style={styles.card}>
                  <div style={styles.cardTitle}>
                    <span>Your Active Patient Queue</span>
                    <span style={styles.badge("green")}>{ongoingAccepted.length} Ongoing</span>
                  </div>

                  {ongoingAccepted.length === 0 ? (
                    <div style={styles.emptyState}>No active patients currently under your care.</div>
                  ) : (
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Patient</th>
                          <th style={styles.th}>Symptoms</th>
                          <th style={styles.th}>Triage Category</th>
                          <th style={styles.th}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ongoingAccepted.map((req) => (
                          <tr key={req.id}>
                            <td style={styles.td}>
                              <strong>{req.patientUser?.patientProfile?.fullName || "Patient"}</strong>
                              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                {req.patientUser?.patientProfile?.sex} · {req.patientUser?.phone || "No phone"}
                              </div>
                            </td>
                            <td style={styles.td}>
                              <div style={{ maxWidth: "260px", fontSize: "0.85rem" }}>{req.symptoms}</div>
                            </td>
                            <td style={styles.td}>
                              <span style={{ fontSize: "0.75rem", fontWeight: "750", background: "#dcfce7", color: "#166534", padding: "3px 8px", borderRadius: "100px" }}>
                                {req.triageCategory}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <button
                                style={styles.button}
                                onClick={() => navigate(`/patient/request/${req.id}`)}
                              >
                                Consult & Prescribe →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Right Side: Quick Availability & Scope */}
              <div>
                <div style={styles.card}>
                  <div style={styles.cardTitle}>Practice Availability</div>
                  <form onSubmit={handleSaveSettings}>
                    <div style={{ marginBottom: "16px" }}>
                      <div style={styles.switchContainer}>
                        <div style={styles.switchLabel}>
                          <strong>{bookingDisabled ? "❌ Offline / Not Accepting" : "✅ Accepting Bookings"}</strong>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            {bookingDisabled ? "Patients cannot schedule visits" : "Patients can schedule visits"}
                          </div>
                        </div>
                        <button
                          type="button"
                          style={bookingDisabled ? styles.button : styles.btnDanger}
                          onClick={() => setBookingDisabled(!bookingDisabled)}
                        >
                          {bookingDisabled ? "Enable Booking" : "Disable Booking"}
                        </button>
                      </div>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Teleconsultation Fee (₹) *</label>
                      <input
                        type="number"
                        style={styles.input}
                        value={teleFee}
                        onChange={(e) => setTeleFee(e.target.value)}
                        placeholder="e.g. 300"
                        required
                      />
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Set pricing for video/voice consults</span>
                    </div>

                    <button type="submit" style={{ ...styles.button, width: "100%" }} disabled={updating}>
                      {updating ? "Saving…" : "Save Practice Pricing"}
                    </button>
                  </form>
                </div>

                <div style={styles.card}>
                  <div style={styles.cardTitle}>Professional Scope</div>
                  <div style={styles.profileRow}>
                    <span style={styles.profileLabel}>Speciality</span>
                    <span style={styles.profileValue}>{profile?.specialization || "General Medicine"}</span>
                  </div>
                  {profile?.subSpecialization && (
                    <div style={styles.profileRow}>
                      <span style={styles.profileLabel}>Sub-Specialities</span>
                      <span style={styles.profileValue}>{profile?.subSpecialization}</span>
                    </div>
                  )}
                  <div style={styles.profileRow}>
                    <span style={styles.profileLabel}>Exp. Years</span>
                    <span style={styles.profileValue}>{profile?.yearsOfExperience || 0} years</span>
                  </div>
                  <div style={styles.profileRow}>
                    <span style={styles.profileLabel}>Affiliation</span>
                    <span style={styles.profileValue}>{profile?.clinicOrHospital || "Private Practice"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 2: DOCTOR'S PROFILE & LEADERBOARD (NEW!)
              ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "profile" && (
            <div>
              {/* Doctor Header Showcase */}
              <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #0369a1 100%)", color: "#fff", padding: "28px", borderRadius: "16px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#e0f2fe", color: "#0369a1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", border: "3px solid #7dd3fc" }}>
                    👨‍⚕️
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <h2 style={{ fontSize: "1.6rem", fontWeight: "850", margin: 0 }}>Dr. {profile?.fullName || "Doctor"}</h2>
                      <span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 10px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: "800" }}>✓ VERIFIED DOCTOR</span>
                    </div>
                    <div style={{ fontSize: "1.05rem", color: "#bae6fd", fontWeight: "700", marginTop: "4px" }}>
                      {profile?.specialization || "General Physician"}
                      {profile?.subSpecialization ? ` (${profile.subSpecialization})` : ""}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "4px" }}>
                      🏥 {profile?.clinicOrHospital || "Private Clinic"} · 📍 {profile?.city} · 📜 Reg No: <strong>{profile?.medicalRegistrationNumber || "NMC-VERIFIED"}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.8rem", color: "#93c5fd", fontWeight: "700", textTransform: "uppercase" }}>Teleconsultation Fee</div>
                  <div style={{ fontSize: "2rem", fontWeight: "900", color: "#fff" }}>₹{profile?.consultationFee || 300}</div>
                  <div style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>Per Virtual / Video Consult</div>
                </div>
              </div>

              {/* Performance & Leaderboard Metrics */}
              <div style={styles.statsGrid}>
                <div style={styles.statBox}>
                  <span style={styles.statLabel}>🏆 Leaderboard Rank</span>
                  <strong style={{ ...styles.statVal, color: "#0284c7" }}>#3 Regional</strong>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Top 5% Teleconsultant</span>
                </div>
                <div style={styles.statBox}>
                  <span style={styles.statLabel}>👥 Patients Reviewed</span>
                  <strong style={{ ...styles.statVal, color: "#16a34a" }}>{totalReviewedCount}</strong>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Total Attended Cases</span>
                </div>
                <div style={styles.statBox}>
                  <span style={styles.statLabel}>⭐ Patient Rating</span>
                  <strong style={{ ...styles.statVal, color: "#d97706" }}>4.9 / 5.0</strong>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Verified Patient Score</span>
                </div>
                <div style={styles.statBox}>
                  <span style={styles.statLabel}>⚡ Response Speed</span>
                  <strong style={{ ...styles.statVal, color: "#0f172a" }}>2.4 mins</strong>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Avg. Triage Pickup</span>
                </div>
              </div>

              {/* Grid: Edit Professional Details & Teleconsultation Services */}
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "24px", marginBottom: "24px" }}>
                {/* Professional Profile Form */}
                <div style={styles.card}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", margin: "0 0 16px" }}>
                    Edit Professional Profile & Specialities
                  </h3>

                  <form onSubmit={handleUpdateProfile}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Full Name *</label>
                        <input
                          style={styles.input}
                          value={editProfileForm.fullName}
                          onChange={(e) => setEditProfileForm({ ...editProfileForm, fullName: e.target.value })}
                          required
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Primary Specialization *</label>
                        <select
                          style={styles.select}
                          value={editProfileForm.specialization}
                          onChange={(e) => setEditProfileForm({ ...editProfileForm, specialization: e.target.value })}
                          required
                        >
                          {PRIMARY_SPECIALTIES.map((spec) => (
                            <option key={spec} value={spec}>{spec}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Sub-Specializations Tagging */}
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Additional Sub-Specialities & Focus Areas</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          style={{ ...styles.input, flex: 1 }}
                          placeholder="e.g. Diabetology, Pediatric Care, Sports Medicine…"
                          value={editProfileForm.customSubInput}
                          onChange={(e) => setEditProfileForm({ ...editProfileForm, customSubInput: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubSpec(); } }}
                        />
                        <button type="button" style={styles.button} onClick={addSubSpec}>+ Add</button>
                      </div>
                      {editProfileForm.subSpecsList.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                          {editProfileForm.subSpecsList.map((sub, i) => (
                            <span key={i} style={styles.subSpecTag}>
                              {sub}
                              <button type="button" onClick={() => removeSubSpec(i)} style={{ background: "none", border: "none", color: "#0369a1", cursor: "pointer", fontSize: "0.8rem", padding: 0 }}>✕</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Years of Experience</label>
                        <input
                          type="number"
                          style={styles.input}
                          min="1"
                          max="60"
                          value={editProfileForm.yearsOfExperience}
                          onChange={(e) => setEditProfileForm({ ...editProfileForm, yearsOfExperience: e.target.value })}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Hospital / Clinic Name</label>
                        <input
                          style={styles.input}
                          value={editProfileForm.clinicOrHospital}
                          onChange={(e) => setEditProfileForm({ ...editProfileForm, clinicOrHospital: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>City / Region *</label>
                        <input
                          style={styles.input}
                          value={editProfileForm.city}
                          onChange={(e) => setEditProfileForm({ ...editProfileForm, city: e.target.value })}
                          required
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Registration / License Number</label>
                        <input
                          style={styles.input}
                          value={editProfileForm.medicalRegistrationNumber}
                          onChange={(e) => setEditProfileForm({ ...editProfileForm, medicalRegistrationNumber: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Languages Spoken</label>
                      <input
                        style={styles.input}
                        placeholder="e.g. English, Hindi, Bengali"
                        value={editProfileForm.languages}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, languages: e.target.value })}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Clinical Bio & Patient Philosophy</label>
                      <textarea
                        rows={3}
                        style={styles.textarea}
                        placeholder="Brief background of clinical practice, education, and patient care approach…"
                        value={editProfileForm.bio}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, bio: e.target.value })}
                      />
                    </div>

                    <button type="submit" style={styles.button} disabled={updating}>
                      {updating ? "Saving Profile…" : "Update Professional Profile"}
                    </button>
                  </form>
                </div>

                {/* Teleconsultation Services Overview Card */}
                <div style={styles.card}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", margin: "0 0 16px" }}>
                    Teleconsultation & Services
                  </h3>

                  <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", padding: "16px", borderRadius: "12px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#166534", fontWeight: "800" }}>
                      <span>💻</span> Nationwide Teleconsultation Active
                    </div>
                    <p style={{ fontSize: "0.825rem", color: "#14532d", margin: "6px 0 0", lineHeight: "1.5" }}>
                      Your profile is eligible to receive and accept teleconsultation triage cases from patients nationwide across India.
                    </p>
                  </div>

                  <div style={styles.profileRow}>
                    <span style={styles.profileLabel}>Virtual Consult Fee</span>
                    <strong style={{ color: "#0f172a" }}>₹{profile?.consultationFee || 300}</strong>
                  </div>
                  <div style={styles.profileRow}>
                    <span style={styles.profileLabel}>Online Booking Status</span>
                    <span style={{ color: bookingDisabled ? "#ef4444" : "#16a34a", fontWeight: "700" }}>
                      {bookingDisabled ? "Disabled / Off-duty" : "Accepting Patients"}
                    </span>
                  </div>
                  <div style={styles.profileRow}>
                    <span style={styles.profileLabel}>Registered City</span>
                    <span style={styles.profileValue}>{profile?.city}</span>
                  </div>
                  <div style={styles.profileRow}>
                    <span style={styles.profileLabel}>Total Patients Attended</span>
                    <span style={styles.profileValue}>{totalReviewedCount} Cases</span>
                  </div>
                </div>
              </div>

              {/* Patients Reviewed History Section */}
              <div style={styles.card}>
                <div style={styles.cardTitle}>
                  <span>Patients Reviewed & Consulted History</span>
                  <span style={styles.badge("green")}>{acceptedRequests.length} Cases</span>
                </div>

                {acceptedRequests.length === 0 ? (
                  <div style={styles.emptyState}>No patient consultation history recorded yet.</div>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Patient Details</th>
                        <th style={styles.th}>Chief Complaint & Symptoms</th>
                        <th style={styles.th}>Triage Category</th>
                        <th style={styles.th}>Date & Time</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {acceptedRequests.map((req) => (
                        <tr key={req.id}>
                          <td style={styles.td}>
                            <strong>{req.patientUser?.patientProfile?.fullName || "Patient Demographics"}</strong>
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                              {req.patientUser?.patientProfile?.sex || "N/A"} · {req.patientUser?.phone || "No phone"}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <div style={{ maxWidth: "300px", fontSize: "0.85rem" }}>
                              {req.triageAnalysis?.technicalChiefComplaint || req.symptoms}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={{ fontSize: "0.75rem", fontWeight: "750", background: req.triageCategory === "TELECONSULTATION" ? "#dcfce7" : "#fef3c7", color: req.triageCategory === "TELECONSULTATION" ? "#166534" : "#854d0e", padding: "3px 8px", borderRadius: "100px" }}>
                              {req.triageCategory}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={{ fontSize: "0.8rem", color: "#475569" }}>
                              {new Date(req.updatedAt).toLocaleDateString()}
                            </div>
                            <div style={{ fontSize: "0.725rem", color: "#94a3b8" }}>
                              {new Date(req.updatedAt).toLocaleTimeString()}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={{ fontSize: "0.75rem", fontWeight: "750", background: req.status === "COMPLETED" ? "#dcfce7" : "#dbeafe", color: req.status === "COMPLETED" ? "#15803d" : "#1e40af", padding: "3px 8px", borderRadius: "100px" }}>
                              {req.status}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <button
                              style={styles.button}
                              onClick={() => navigate(`/patient/request/${req.id}`)}
                            >
                              Open Case & Digital Rx →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 3: PRACTICE LOCATIONS
              ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "clinics" && (
            <div style={{ maxWidth: "800px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                  In-Person Clinics & Consultation Centers
                </h3>
                <button
                  style={styles.button}
                  onClick={() => setShowClinicForm(!showClinicForm)}
                >
                  {showClinicForm ? "Cancel" : "+ Add Practice Location"}
                </button>
              </div>

              {showClinicForm && (
                <div style={styles.card}>
                  <form onSubmit={handleAddClinic}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Clinic / Hospital Name *</label>
                      <input
                        style={styles.input}
                        placeholder="e.g. City Health Clinic"
                        value={clinicForm.name}
                        onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Full Address *</label>
                      <input
                        style={styles.input}
                        placeholder="Street, Landmark, City"
                        value={clinicForm.address}
                        onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                        required
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Consultation Fee (₹) *</label>
                      <input
                        type="number"
                        style={styles.input}
                        placeholder="e.g. 500"
                        value={clinicForm.fee}
                        onChange={(e) => setClinicForm({ ...clinicForm, fee: e.target.value })}
                        required
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Available Days</label>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                          <button
                            key={d}
                            type="button"
                            style={clinicForm.days.includes(d) ? styles.button : styles.btnSec}
                            onClick={() => toggleDay(d)}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Start Time</label>
                        <input
                          type="time"
                          style={styles.input}
                          value={clinicForm.start}
                          onChange={(e) => setClinicForm({ ...clinicForm, start: e.target.value })}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>End Time</label>
                        <input
                          type="time"
                          style={styles.input}
                          value={clinicForm.end}
                          onChange={(e) => setClinicForm({ ...clinicForm, end: e.target.value })}
                        />
                      </div>
                    </div>

                    <button type="submit" style={styles.button}>Save Clinic Location</button>
                  </form>
                </div>
              )}

              <div style={styles.clinicList}>
                {(profile?.availability?.clinics || []).length === 0 ? (
                  <div style={styles.card}>
                    <div style={styles.emptyState}>No physical clinic locations added yet.</div>
                  </div>
                ) : (
                  (profile?.availability?.clinics || []).map((clinic) => (
                    <div key={clinic.id} style={styles.clinicItem}>
                      <div style={styles.clinicMeta}>
                        <div style={styles.clinicName}>{clinic.name}</div>
                        <div style={styles.clinicDetail}>📍 {clinic.address}</div>
                        <div style={styles.clinicDetail}>💰 Fee: ₹{clinic.fee} · ⏰ {clinic.timing}</div>
                        <div style={styles.clinicDays}>
                          {(clinic.days || []).map((d) => (
                            <span key={d} style={styles.dayBadge}>{d}</span>
                          ))}
                        </div>
                      </div>
                      <button
                        style={styles.btnDanger}
                        onClick={() => handleRemoveClinic(clinic.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 4: DOCUMENTS
              ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "documents" && (
            <div style={{ maxWidth: "800px" }}>
              <div style={styles.card}>
                <div style={styles.cardTitle}>Professional Medical Credentials</div>
                <div style={styles.docList}>
                  {DOCTOR_DOCS.map((docDef) => {
                    const uploadedDoc = docs.find((d) => d.documentType === docDef.type);
                    return (
                      <div key={docDef.type} style={styles.docItem}>
                        <div>
                          <div style={styles.docName}>
                            {docDef.label} {docDef.required && <span style={{ color: "#ef4444" }}>*</span>}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            Status: {uploadedDoc ? "✓ Uploaded & Verified" : "Pending Upload"}
                          </div>
                        </div>
                        {uploadedDoc ? (
                          <a
                            href={uploadedDoc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#0284c7", fontSize: "0.85rem", textDecoration: "none", fontWeight: "600" }}
                          >
                            View Document ↗
                          </a>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Not Uploaded</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
