import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const styles = {
  page: { background: "#f8fafc", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" },

  // Header
  nav: {
    background: "#fff", borderBottom: "1px solid #e2e8f0", height: "64px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 24px", position: "sticky", top: 0, zIndex: 10
  },
  navLeft: { display: "flex", alignItems: "center", gap: "32px" },
  logo: { fontSize: "1.25rem", fontWeight: "800", color: "#0ea5e9", display: "flex", alignItems: "center", gap: "8px" },
  navLinks: { display: "flex", gap: "24px" },
  navLink: (active) => ({
    textDecoration: "none", color: active ? "#0ea5e9" : "#475569",
    fontWeight: "600", fontSize: "0.9rem", cursor: "pointer", background: "none", border: "none"
  }),
  navRight: { display: "flex", alignItems: "center", gap: "16px" },
  phoneBadge: { fontSize: "0.875rem", color: "#64748b", background: "#f1f5f9", padding: "6px 12px", borderRadius: "20px", fontWeight: "500" },
  logoutBtn: {
    background: "none", border: "1.5px solid #cbd5e1", borderRadius: "8px",
    padding: "6px 14px", cursor: "pointer", fontSize: "0.875rem", color: "#334155", fontWeight: "600"
  },

  // Hero section
  hero: { background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)", padding: "60px 24px 80px", color: "#fff", textAlign: "center" },
  heroTitle: { fontSize: "2.25rem", fontWeight: "800", marginBottom: "8px" },
  heroSubtitle: { fontSize: "1.1rem", color: "#93c5fd", marginBottom: "32px" },

  // Practo Dual Search Bar
  searchContainer: {
    display: "flex", maxWidth: "720px", margin: "0 auto 24px", background: "#fff",
    borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", overflow: "hidden"
  },
  searchLoc: {
    width: "200px", padding: "16px", borderRight: "1px solid #e2e8f0",
    display: "flex", alignItems: "center", gap: "8px"
  },
  locSelect: { width: "100%", border: "none", outline: "none", fontSize: "0.95rem", fontWeight: "600", color: "#1e293b", background: "none" },
  searchQuery: { flex: 1, padding: "16px", display: "flex", alignItems: "center", gap: "8px" },
  queryInput: { width: "100%", border: "none", outline: "none", fontSize: "0.95rem", color: "#334155" },
  searchBtn: { background: "#0ea5e9", color: "#fff", border: "none", padding: "0 24px", cursor: "pointer", fontWeight: "700" },

  popularSearches: { display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", fontSize: "0.8125rem" },
  popularTag: { color: "#93c5fd", cursor: "pointer", textDecoration: "underline" },

  // Body container
  body: { maxWidth: "1200px", margin: "-40px auto 40px", padding: "0 24px", boxSizing: "border-box" },

  // Quick Services Row
  servicesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "40px" },
  serviceCard: {
    background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0",
    padding: "24px", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
    display: "flex", gap: "16px", transition: "transform 0.15s, box-shadow 0.15s"
  },
  serviceIcon: { fontSize: "2rem", display: "block" },
  serviceContent: { display: "flex", flexDirection: "column", gap: "4px" },
  serviceTitle: { fontWeight: "700", fontSize: "1rem", color: "#0f172a" },
  serviceDesc: { fontSize: "0.8125rem", color: "#64748b", lineHeight: "1.4" },

  // Sections
  section: { marginBottom: "40px" },
  sectionTitle: { fontSize: "1.25rem", fontWeight: "800", color: "#0f172a", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" },

  // Lab Tests Cards
  labsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" },
  labCard: {
    background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: "10px",
    padding: "20px", display: "flex", flexDirection: "column", justifyBetween: "space-between"
  },
  labTitle: { fontWeight: "700", fontSize: "0.95rem", color: "#0f172a" },
  labDesc: { fontSize: "0.75rem", color: "#64748b", margin: "4px 0 16px" },
  labFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" },
  labPrice: { fontWeight: "800", fontSize: "1.1rem", color: "#0f172a" },
  bookBtn: {
    background: "#0ea5e9", color: "#fff", border: "none", borderRadius: "6px",
    padding: "8px 16px", fontSize: "0.8125rem", fontWeight: "700", cursor: "pointer"
  },

  // Profile Alert
  alertBanner: {
    background: "#fef9c3", border: "1px solid #fde68a", borderRadius: "10px",
    padding: "16px", marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center"
  },
  alertText: { fontSize: "0.875rem", color: "#854d0e", fontWeight: "500" },
  alertLink: { color: "#2563eb", fontWeight: "700", textDecoration: "underline", cursor: "pointer" },

  // Modal / Form overlay
  modalOverlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(15, 23, 42, 0.6)", display: "flex", justifyContent: "center",
    alignItems: "center", zIndex: 100, padding: "16px"
  },
  modalContent: {
    background: "#fff", borderRadius: "16px", padding: "32px",
    width: "100%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
  },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" },
  label: { fontSize: "0.8125rem", fontWeight: "600", color: "#475569" },
  input: { padding: "10px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem" },
  select: { padding: "10px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem", background: "#fff" },

  // Doctor List Items
  docItem: {
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px",
    padding: "24px", display: "flex", gap: "20px", marginBottom: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.01)"
  },
  docAvatar: {
    width: "80px", height: "80px", borderRadius: "50%", background: "#e0f2fe",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem"
  },
  docBody: { flex: 1, display: "flex", flexDirection: "column", gap: "6px" },
  docName: { fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" },
  docSpecs: { fontSize: "0.875rem", color: "#0ea5e9", fontWeight: "600" },
  docMeta: { fontSize: "0.8125rem", color: "#64748b" },
  docBtnCol: { display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center" },

  // General helpers
  emptyState: { textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: "0.9rem" },
  successBadge: { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px", fontSize: "0.875rem", marginBottom: "20px" },
};

const DIAGNOSTIC_TESTS = [
  { id: "t1", title: "Thyroid Profile Total", desc: "Thyroid Profile Total Blood · Report within 24hrs", price: 420 },
  { id: "t2", title: "Complete Blood Count", desc: "CBC Automated Blood · Report within 24hrs", price: 330 },
  { id: "t3", title: "Lipid Profile", desc: "Lipid Profile Blood · Report within 24hrs", price: 620 },
  { id: "t4", title: "Liver Function Test", desc: "LFT Blood · Report within 24hrs", price: 790 },
];

export default function PatientDashboard() {
  const navigate = useNavigate();

  // Authentication & Profile States
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("find-doctors"); // "find-doctors" | "lab-tests" | "records" | "appointments"

  // Search filter states
  const [searchCity, setSearchCity] = useState("Delhi");
  const [searchQuery, setSearchQuery] = useState("");
  const [doctorsList, setDoctorsList] = useState([]);
  const [searching, setSearching] = useState(false);

  // Complete Profile Form states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    medicalConditions: "", allergies: "", currentMedications: "", pastMedicalHistory: "", familyMedicalHistory: "", lifestyle: ""
  });

  // UI Messages
  const [bookingSuccess, setBookingSuccess] = useState("");

  // Triage Request States
  const [requests, setRequests] = useState([]);
  const [reqSymptoms, setReqSymptoms] = useState("");
  const [reqLocation, setReqLocation] = useState("");
  const [reqRequirement, setReqRequirement] = useState("");
  const [submittingReq, setSubmittingReq] = useState(false);
  const [reqError, setReqError] = useState("");
  const [reqSuccess, setReqSuccess] = useState("");

  const loadRequests = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const res = await fetch("/api/requests/my", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setSubmittingReq(true);
    setReqError("");
    setReqSuccess("");
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ symptoms: reqSymptoms, location: reqLocation, requirement: reqRequirement }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReqError(data.error || "Failed to submit request.");
      } else {
        setReqSuccess(`Request submitted successfully! Triage result: ${data.request.triageCategory}`);
        setReqSymptoms("");
        setReqRequirement("");
        await loadRequests();
      }
    } catch {
      setReqError("Network error submitting request.");
    } finally {
      setSubmittingReq(false);
    }
  };

  const loadProfileData = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const res = await fetch("/api/profile/me", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        if (data.profile.region) {
          setSearchCity(data.profile.region);
          setReqLocation(data.profile.region);
        }

        // Prep form values
        setProfileForm({
          medicalConditions: data.profile.medicalConditions?.join(", ") || "",
          allergies: data.profile.allergies?.join(", ") || "",
          currentMedications: data.profile.currentMedications?.join(", ") || "",
          pastMedicalHistory: data.profile.pastMedicalHistory || "",
          familyMedicalHistory: data.profile.familyMedicalHistory || "",
          lifestyle: JSON.stringify(data.profile.lifestyle || {})
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch verified doctors matching search criteria
  const queryDoctors = useCallback(async () => {
    setSearching(true);
    try {
      let url = `/api/doctors?city=${searchCity}`;
      if (searchQuery) {
        url += `&specialization=${searchQuery}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setDoctorsList(data.doctors || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  }, [searchCity, searchQuery]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
    if (!stored || !token) { navigate("/login"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "patient") { navigate("/login"); return; }
    setUser(u);

    Promise.all([loadProfileData(), queryDoctors(), loadRequests()]).finally(() => setLoading(false));
  }, [navigate, loadProfileData, queryDoctors, loadRequests]);

  const logout = () => { localStorage.clear(); navigate("/login"); };

  // Profile completion handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");
    try {
      const payload = {
        medicalConditions: profileForm.medicalConditions.split(",").map((s) => s.trim()).filter(Boolean),
        allergies: profileForm.allergies.split(",").map((s) => s.trim()).filter(Boolean),
        currentMedications: profileForm.currentMedications.split(",").map((s) => s.trim()).filter(Boolean),
        pastMedicalHistory: profileForm.pastMedicalHistory || undefined,
        familyMedicalHistory: profileForm.familyMedicalHistory || undefined,
      };

      try {
        if (profileForm.lifestyle) {
          payload.lifestyle = JSON.parse(profileForm.lifestyle);
        }
      } catch {
        payload.lifestyle = { note: profileForm.lifestyle };
      }

      const res = await fetch("/api/profile/patient", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setBookingSuccess("Profile updated successfully!");
        setShowProfileModal(false);
        await loadProfileData();
        setTimeout(() => setBookingSuccess(""), 4000);
      }
    } catch {
      alert("Error saving profile details.");
    }
  };

  // Lab test booking actions
  const handleBookTest = (testTitle) => {
    setBookingSuccess(`✓ Diagnostic test request registered: "${testTitle}". The lab technician will contact you for home sample collection.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setBookingSuccess(""), 5000);
  };

  // Doctor booking actions
  const handleBookDoctor = (doc) => {
    setBookingSuccess(`✓ Booking request registered with Dr. ${doc.fullName}. We will confirm your consult slot.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setBookingSuccess(""), 5000);
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading Sanjeevani Portal…</div>;

  const isIncomplete = !profile || profile.accountStatus !== "PROFILE_COMPLETE";

  return (
    <div style={styles.page}>
      {/* Navigation Header */}
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <span style={styles.logo}>🌿 Sanjeevani</span>
          <div style={styles.navLinks}>
            <button style={styles.navLink(currentTab === "find-doctors")} onClick={() => setCurrentTab("find-doctors")}>
              Find Doctors
            </button>
            <button style={styles.navLink(currentTab === "triage-request")} onClick={() => setCurrentTab("triage-request")}>
              AI Triage & Requests
            </button>
            <button style={styles.navLink(currentTab === "lab-tests")} onClick={() => setCurrentTab("lab-tests")}>
              Book Lab Tests
            </button>
            <button style={styles.navLink(currentTab === "records")} onClick={() => setCurrentTab("records")}>
              Prescriptions & Records
            </button>
            <button style={styles.navLink(currentTab === "appointments")} onClick={() => setCurrentTab("appointments")}>
              Appointments
            </button>
          </div>
        </div>
        <div style={styles.navRight}>
          <span style={styles.phoneBadge}>📞 {profile?.fullName || user?.phone}</span>
          <button style={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>Your home for health</h1>
        <p style={styles.heroSubtitle}>Find verified doctors, book diagnostics, and consult safely</p>

        {/* Practo-style Search Bar */}
        <div style={styles.searchContainer}>
          <div style={styles.searchLoc}>
            <span style={{ fontSize: "1.1rem" }}>📍</span>
            <input
              style={styles.queryInput}
              type="text"
              placeholder="City / Region"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
            />
          </div>
          <div style={styles.searchQuery}>
            <span style={{ fontSize: "1.1rem" }}>🔍</span>
            <input
              style={styles.queryInput}
              type="text"
              placeholder="Search doctors, specializations (e.g. Cardiologist, Dermatologist)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button style={styles.searchBtn} onClick={queryDoctors}>Search</button>
        </div>

        {/* Popular Tags */}
        <div style={styles.popularSearches}>
          <span>Popular: </span>
          <span style={styles.popularTag} onClick={() => { setSearchQuery("General Physician"); queryDoctors(); }}>General Physician</span>,{" "}
          <span style={styles.popularTag} onClick={() => { setSearchQuery("Dermatologist"); queryDoctors(); }}>Dermatologist</span>,{" "}
          <span style={styles.popularTag} onClick={() => { setSearchQuery("Pediatrician"); queryDoctors(); }}>Pediatrician</span>,{" "}
          <span style={styles.popularTag} onClick={() => { setSearchQuery("Gynecologist"); queryDoctors(); }}>Gynecologist</span>
        </div>
      </div>

      {/* Main Container */}
      <div style={styles.body}>

        {/* Success Notifications */}
        {bookingSuccess && <div style={styles.successBadge}>{bookingSuccess}</div>}

        {/* Complete Profile Warning Banner */}
        {isIncomplete && (
          <div style={styles.alertBanner}>
            <span style={styles.alertText}>
              ⚠️ Complete your medical profile (conditions, allergies, emergency contacts) to enable diagnostic reviews and receive better AI triage logs.
            </span>
            <button style={styles.bookBtn} onClick={() => setShowProfileModal(true)}>
              Complete Profile
            </button>
          </div>
        )}

        {/* 6 Grid Primary Service Shortcuts */}
        <div style={styles.servicesGrid}>
          <div style={styles.serviceCard} onClick={() => setCurrentTab("find-doctors")}>
            <span style={styles.serviceIcon}>🩺</span>
            <div style={styles.serviceContent}>
              <span style={styles.serviceTitle}>Consult with a Doctor</span>
              <span style={styles.serviceDesc}>Schedule appointments with verified medical professionals near you</span>
            </div>
          </div>
          <div style={styles.serviceCard} onClick={() => setCurrentTab("lab-tests")}>
            <span style={styles.serviceIcon}>🧪</span>
            <div style={styles.serviceContent}>
              <span style={styles.serviceTitle}>Book Test / Checkups</span>
              <span style={styles.serviceDesc}>Home sample collection with certified laboratory diagnosis</span>
            </div>
          </div>
          <div style={styles.serviceCard} onClick={() => setCurrentTab("triage-request")}>
            <span style={styles.serviceIcon}>🤖</span>
            <div style={styles.serviceContent}>
              <span style={styles.serviceTitle}>AI Triage Guidance</span>
              <span style={styles.serviceDesc}>Assess symptoms instantly and check triage recommendations</span>
            </div>
          </div>
          <div style={styles.serviceCard} onClick={() => setCurrentTab("records")}>
            <span style={styles.serviceIcon}>📋</span>
            <div style={styles.serviceContent}>
              <span style={styles.serviceTitle}>Medical Records</span>
              <span style={styles.serviceDesc}>View electronic health prescriptions and clinical history logs</span>
            </div>
          </div>
        </div>

        {/* TAB 1: Doctor Discovery */}
        {currentTab === "find-doctors" && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              <span>Verified Practitioners in {searchCity}</span>
              <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "normal" }}>
                Found {doctorsList.length} results
              </span>
            </div>

            {searching ? (
              <div style={styles.emptyState}>Searching verified directory...</div>
            ) : doctorsList.length === 0 ? (
              <div style={styles.card}>
                <div style={styles.emptyState}>
                  No verified doctors matching "{searchQuery || 'all'}" found in {searchCity}.
                  <br />Note: Admin must verify registered doctor accounts before they appear here.
                </div>
              </div>
            ) : (
              <div>
                {doctorsList.map((doc) => {
                  const hasTeleFee = doc.availability && doc.availability.teleconsultationFee;
                  const isBookingBlocked = doc.availability && doc.availability.bookingDisabled;

                  return (
                    <div key={doc.userId} style={styles.docItem}>
                      <div style={styles.docAvatar}>👨‍⚕️</div>
                      <div style={styles.docBody}>
                        <span style={styles.docName}>{doc.fullName}</span>
                        <span style={styles.docSpecs}>{doc.specialization} {doc.subSpecialization ? `· ${doc.subSpecialization}` : ""}</span>
                        <span style={styles.docMeta}>💼 {doc.yearsOfExperience || 0} Years Experience overall</span>
                        <span style={styles.docMeta}>📍 {doc.clinicOrHospital || "Private Clinic"}, {doc.city}</span>
                        <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                          <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "#334155" }}>
                            Visit Fee: ₹{doc.consultationFee || "500"}
                          </span>
                          {hasTeleFee && (
                            <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "#059669" }}>
                              💻 Video Consult Fee: ₹{doc.availability.teleconsultationFee}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={styles.docBtnCol}>
                        {isBookingBlocked ? (
                          <span style={{ ...styles.badge("red"), textAlign: "center", padding: "8px" }}>
                            Fully Occupied Today
                          </span>
                        ) : (
                          <button style={styles.bookBtn} onClick={() => handleBookDoctor(doc)}>
                            Book Appointment
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: Triage Request */}
        {currentTab === "triage-request" && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>AI-Assisted Symptom Triage & Request Submission</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              {/* Submission Form */}
              <div style={styles.card}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", color: "#0f172a" }}>Submit A Health Request</h3>

                {reqError && <div style={{ ...styles.error, marginBottom: "16px" }}>{reqError}</div>}
                {reqSuccess && <div style={{ ...styles.successBadge, marginBottom: "16px" }}>{reqSuccess}</div>}

                <form onSubmit={handleSubmitRequest}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Symptom Description *</label>
                    <textarea
                      style={{ ...styles.input, height: "100px", fontFamily: "inherit", resize: "none", padding: "10px" }}
                      placeholder="Describe your symptoms in detail (e.g., persistent dry cough for 3 days, mild fever 101F, chest heaviness...)"
                      value={reqSymptoms}
                      onChange={(e) => setReqSymptoms(e.target.value)}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Your Location / City *</label>
                    <input
                      style={styles.input}
                      type="text"
                      placeholder="e.g. Delhi"
                      value={reqLocation}
                      onChange={(e) => setReqLocation(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Matched with verified doctors in this city</span>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Requirement / Requested Support *</label>
                    <input
                      style={styles.input}
                      type="text"
                      placeholder="e.g. Need general physician consult, urgent prescription refill"
                      value={reqRequirement}
                      onChange={(e) => setReqRequirement(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    style={{ ...styles.bookBtn, width: "100%", padding: "12px", marginTop: "10px" }}
                    type="submit"
                    disabled={submittingReq}
                  >
                    {submittingReq ? "Submitting to AI Triage..." : "Submit to AI Triage & Doctors"}
                  </button>
                </form>
              </div>

              {/* History & Status */}
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", color: "#0f172a" }}>Your Clinical Requests</h3>
                {requests.length === 0 ? (
                  <div style={{ ...styles.card, textAlign: "center", padding: "40px 20px" }}>
                    <span style={{ fontSize: "2rem", display: "block", marginBottom: "8px" }}>📋</span>
                    <span style={{ color: "#64748b" }}>No requests submitted yet. Use the form to submit your first triage request.</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "500px", overflowY: "auto" }}>
                    {requests.map((req) => (
                      <div key={req.id} style={{ ...styles.card, margin: 0, borderLeft: req.triageCategory === 'EMERGENCY_ESCALATION' ? '4px solid #ef4444' : req.triageCategory === 'PHYSICAL_VISIT' ? '4px solid #f59e0b' : '4px solid #10b981' }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                          <span style={{
                            fontSize: "0.75rem", fontWeight: "800", padding: "2px 8px", borderRadius: "100px",
                            background: req.triageCategory === 'EMERGENCY_ESCALATION' ? '#fee2e2' : req.triageCategory === 'PHYSICAL_VISIT' ? '#fef9c3' : '#dcfce7',
                            color: req.triageCategory === 'EMERGENCY_ESCALATION' ? '#b91c1c' : req.triageCategory === 'PHYSICAL_VISIT' ? '#854d0e' : '#15803d'
                          }}>
                            {req.triageCategory?.replace(/_/g, " ")}
                          </span>
                          <span style={{
                            fontSize: "0.75rem", fontWeight: "800", padding: "2px 8px", borderRadius: "100px",
                            background: req.status === 'ACCEPTED' ? '#dbeafe' : req.status === 'PENDING' ? '#f3f4f6' : '#dcfce7',
                            color: req.status === 'ACCEPTED' ? '#1e40af' : req.status === 'PENDING' ? '#6b7280' : '#15803d'
                          }}>
                            {req.status}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.875rem", color: "#334155", margin: "4px 0" }}><strong>Symptoms:</strong> {req.symptoms}</p>
                        <p style={{ fontSize: "0.875rem", color: "#334155", margin: "4px 0" }}><strong>Requirement:</strong> {req.requirement}</p>
                        <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "4px 0" }}><strong>Location:</strong> {req.location}</p>

                        {req.triageReasoning && (
                          <div style={{ marginTop: "8px", padding: "8px", background: "#f8fafc", borderRadius: "6px", fontSize: "0.75rem", color: "#475569" }}>
                            <strong>AI Triage Reasoning:</strong> {req.triageReasoning}
                          </div>
                        )}

                        {req.status === "ACCEPTED" && req.doctorUser && (
                          <div style={{ marginTop: "10px", borderTop: "1px solid #e2e8f0", paddingTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "1.1rem" }}>👨‍⚕️</span>
                            <div style={{ fontSize: "0.8125rem" }}>
                              <div style={{ fontWeight: "700", color: "#0f172a" }}>Dr. {req.doctorUser.doctorProfile?.fullName || "Verified Doctor"}</div>
                              <div style={{ color: "#64748b" }}>{req.doctorUser.doctorProfile?.specialization} · Phone: {req.doctorUser.phone || "N/A"}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Book Lab Tests */}
        {currentTab === "lab-tests" && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Book Diagnostic Tests Online</div>

            <div style={{ ...styles.card, background: "#f8fafc", marginBottom: "24px" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "4px" }}>🏠 Free Home Sample Collection</div>
              <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: 0 }}>
                Certified lab professionals collect samples right at your doorstep. Verified reports delivered within 24 hours.
              </p>
            </div>

            <div style={styles.labsGrid}>
              {DIAGNOSTIC_TESTS.map((test) => (
                <div key={test.id} style={styles.labCard}>
                  <div style={styles.labTitle}>{test.title}</div>
                  <div style={styles.labDesc}>{test.desc}</div>
                  <div style={styles.labFooter}>
                    <span style={styles.labPrice}>₹{test.price}</span>
                    <button style={styles.bookBtn} onClick={() => handleBookTest(test.title)}>
                      Book Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Records */}
        {currentTab === "records" && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Your Clinical Records</div>
            <div style={styles.card}>
              <div style={styles.emptyState}>No clinical prescriptions, triage reports, or lab results saved yet.</div>
            </div>
          </div>
        )}

        {/* TAB 4: Appointments */}
        {currentTab === "appointments" && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>My Consultation Appointments</div>
            <div style={styles.card}>
              <div style={styles.emptyState}>No scheduled doctor consultations or lab appointments found.</div>
            </div>
          </div>
        )}
      </div>

      {/* Complete Profile Modal Box */}
      {showProfileModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>Complete Health Profile</span>
              <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }} onClick={() => setShowProfileModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Existing Medical Conditions</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="e.g. Diabetes, Hypertension (comma separated)"
                  value={profileForm.medicalConditions}
                  onChange={(e) => setProfileForm({ ...profileForm, medicalConditions: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Known Allergies</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="e.g. Penicillin, Peanuts (comma separated)"
                  value={profileForm.allergies}
                  onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Current Medications</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="e.g. Metformin 500mg (comma separated)"
                  value={profileForm.currentMedications}
                  onChange={(e) => setProfileForm({ ...profileForm, currentMedications: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Past Medical History</label>
                <textarea
                  style={{ ...styles.input, height: "60px", fontFamily: "inherit", resize: "none" }}
                  placeholder="Any surgeries, hospitalizations, or chronic ailments..."
                  value={profileForm.pastMedicalHistory}
                  onChange={(e) => setProfileForm({ ...profileForm, pastMedicalHistory: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Lifestyle Context (JSON Format)</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder='e.g. {"smoking": false, "exercise": "weekly"}'
                  value={profileForm.lifestyle}
                  onChange={(e) => setProfileForm({ ...profileForm, lifestyle: e.target.value })}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button style={styles.bookBtn} type="submit">
                  Save Details
                </button>
                <button style={styles.btnSec} type="button" onClick={() => setShowProfileModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
