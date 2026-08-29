import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentLocation } from "../../hooks/useCurrentLocation";

const COMMON_CONDITIONS = ["Diabetes", "Hypertension", "Asthma", "Thyroid Disorder", "Heart Disease", "Acid Reflux / GERD", "None"];
const COMMON_ALLERGIES = ["Penicillin", "Sulfa Drugs", "Aspirin", "Peanuts", "Dust / Pollen", "Latex", "Dairy", "None"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const SYMPTOM_PRESETS = [
  { name: "Fever & Chills", icon: "🌡️" },
  { name: "Persistent Cough", icon: "🗣️" },
  { name: "Skin Rash / Lesion", icon: "🩹" },
  { name: "Sore Throat", icon: "🧣" },
  { name: "Chest Discomfort", icon: "🫀" },
  { name: "Shortness of Breath", icon: "🫁" },
  { name: "Abdominal Pain", icon: "🤢" },
  { name: "Severe Headache", icon: "🤕" },
  { name: "Joint / Back Pain", icon: "🦴" },
  { name: "Eye Redness / Irritation", icon: "👁️" },
  { name: "Dizziness / Fatigue", icon: "💫" },
  { name: "Diarrhea / Nausea", icon: "🚰" }
];

const DIAGNOSTIC_TESTS = [
  { id: "t1", title: "Thyroid Profile Total", desc: "T3, T4, TSH Blood Panel · Report within 24hrs", price: 420 },
  { id: "t2", title: "Complete Blood Count (CBC)", desc: "Automated CBC & Platelets · Report within 24hrs", price: 330 },
  { id: "t3", title: "Lipid Profile Comprehensive", desc: "Cholesterol, Triglycerides, HDL, LDL · Fasting", price: 620 },
  { id: "t4", title: "Liver Function Test (LFT)", desc: "Bilirubin, SGOT, SGPT, Protein · 24hr delivery", price: 790 },
  { id: "t5", title: "HbA1c Diabetes Screen", desc: "3-Month Blood Sugar Average · Home Sample", price: 499 },
  { id: "t6", title: "Kidney Function Test (KFT)", desc: "Creatinine, Urea, Uric Acid, Electrolytes", price: 680 },
];

export default function PatientDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("triage-mvp"); // "triage-mvp" is default MVP tab

  // Location & Doctors
  const [searchCity, setSearchCity] = useState("Delhi");
  const [searchQuery, setSearchQuery] = useState("");
  const [doctorsList, setDoctorsList] = useState([]);
  const [searchingDoctors, setSearchingDoctors] = useState(false);
  const { location, error: geoError, loading: geoLoading, getLocation } = useCurrentLocation();
  const [useGps, setUseGps] = useState(true);
  const [radiusKm, setRadiusKm] = useState(15);
  const hasRequestedLocation = useRef(false);

  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    dateOfBirth: "",
    sex: "male",
    bloodGroup: "O+",
    region: "",
    preferredLanguage: "English",
    medicalConditions: [],
    customCondition: "",
    allergies: [],
    customAllergy: "",
    currentMedications: "",
    pastMedicalHistory: "",
    smoking: "Non-Smoker",
    alcohol: "None",
    exercise: "Moderate (3-4 days/week)",
    diet: "Vegetarian",
    sleep: "6-8 Hours",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelationship: "Parent"
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // AI Triage State (The MVP!)
  const [selectedPresetSymptoms, setSelectedPresetSymptoms] = useState([]);
  const [symptomDescription, setSymptomDescription] = useState("");
  const [symptomDuration, setSymptomDuration] = useState("2-3 Days");
  const [painScale, setPainScale] = useState(3);
  const [affectedBodyArea, setAffectedBodyArea] = useState("Skin / Arms / Legs");
  const [triageLocation, setTriageLocation] = useState("");
  const [consultRequirement, setConsultRequirement] = useState("General Clinical Advice & Consult");

  // File Attachments for Triage
  const [uploadedAttachments, setUploadedAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const affectedFileInputRef = useRef(null);
  const prescriptionFileInputRef = useRef(null);

  // AI Triage Analysis & Active Case Tracking
  const [aiTriageRunning, setAiTriageRunning] = useState(false);
  const [activeCase, setActiveCase] = useState(null); // Active PatientRequest
  const [liveTriageResult, setLiveTriageResult] = useState(null);
  const [triageError, setTriageError] = useState("");

  // 15-Minute HITL Countdown Timer (Persistent!)
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(null);

  // Requests History
  const [myRequests, setMyRequests] = useState([]);

  // Toast / General Feedback
  const [globalBannerMsg, setGlobalBannerMsg] = useState("");

  // ── Load Requests & Resume Persistent Timer ────────────────────────────────
  const loadRequests = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const res = await fetch("/api/requests/my", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        const requests = data.requests || [];
        setMyRequests(requests);

        // Find the most recent active or pending request
        const latestPending = requests.find((r) => r.status === "PENDING");
        if (latestPending) {
          setActiveCase(latestPending);

          if (latestPending.hitlStatus === "PENDING") {
            if (latestPending.hitlTimerExpiresAt) {
              const diffSec = Math.max(0, Math.floor((new Date(latestPending.hitlTimerExpiresAt).getTime() - Date.now()) / 1000));
              setTimerSecondsLeft(diffSec);
            } else {
              setTimerSecondsLeft(15 * 60);
            }
            // Keep triage result HIDDEN while under review so patient only sees timer & active status
            setLiveTriageResult(null);
          } else {
            // Once approved / overridden / timeout fallback, reveal the verified result!
            setLiveTriageResult(latestPending.triageAnalysis || latestPending.originalAiAnalysis);
            setTimerSecondsLeft(0);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load requests:", e);
    }
  }, []);

  // ── Load Profile ───────────────────────────────────────────────────────────
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
          setTriageLocation(data.profile.region);
        }
        const life = data.profile.lifestyle || {};
        const em = data.profile.emergencyContact || {};

        setProfileForm({
          fullName: data.profile.fullName || "",
          dateOfBirth: data.profile.dateOfBirth || "",
          sex: data.profile.sex || "male",
          bloodGroup: data.profile.bloodGroup || life.bloodGroup || "O+",
          region: data.profile.region || "",
          preferredLanguage: data.profile.preferredLanguage || "English",
          medicalConditions: data.profile.medicalConditions || [],
          customCondition: "",
          allergies: data.profile.allergies || [],
          customAllergy: "",
          currentMedications: data.profile.currentMedications?.join(", ") || "",
          pastMedicalHistory: data.profile.pastMedicalHistory || "",
          smoking: life.smoking || "Non-Smoker",
          alcohol: life.alcohol || "None",
          exercise: life.exercise || "Moderate (3-4 days/week)",
          diet: life.diet || "Vegetarian",
          sleep: life.sleep || "6-8 Hours",
          emergencyName: em.name || "",
          emergencyPhone: em.phone || "",
          emergencyRelationship: em.relationship || "Parent"
        });
      }
    } catch (e) {
      console.error("Failed to load profile:", e);
    }
  }, []);

  // ── Query Doctors ──────────────────────────────────────────────────────────
  const queryDoctors = useCallback(async (customSpec = null, forceNearby = false) => {
    setSearchingDoctors(true);
    try {
      let url;
      if ((useGps && location) || forceNearby) {
        url = `/api/doctors/public?lat=${location?.lat || 28.6139}&lng=${location?.lng || 77.2090}&radiusKm=${radiusKm}`;
      } else {
        url = `/api/doctors/public?city=${encodeURIComponent(searchCity)}`;
      }
      const specToUse = customSpec !== null ? customSpec : searchQuery;
      if (specToUse) {
        url += `&specialization=${encodeURIComponent(specToUse)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setDoctorsList(data.doctors || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSearchingDoctors(false);
    }
  }, [searchCity, searchQuery, useGps, location, radiusKm]);

  // ── 15-Minute Countdown Timer Effect ───────────────────────────────────────
  useEffect(() => {
    if (timerSecondsLeft === null || timerSecondsLeft <= 0) return;

    const interval = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          loadRequests();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerSecondsLeft, loadRequests]);

  // ── Poll for HITL Status Updates while active case is pending ──────────────
  useEffect(() => {
    if (!activeCase || activeCase.hitlStatus === "APPROVED" || activeCase.hitlStatus === "OVERRIDDEN") return;

    const pollInterval = setInterval(loadRequests, 4000);
    return () => clearInterval(pollInterval);
  }, [activeCase, loadRequests]);

  // ── Geolocation & Initial Load ─────────────────────────────────────────────
  useEffect(() => {
    if (!hasRequestedLocation.current) {
      hasRequestedLocation.current = true;
      getLocation();
    }
  }, [getLocation]);

  useEffect(() => {
    if (useGps && location) {
      queryDoctors();
    }
  }, [location, radiusKm, useGps, queryDoctors]);

  useEffect(() => {
    if (geoError && useGps) {
      setUseGps(false);
    }
  }, [geoError, useGps]);

  useEffect(() => {
    if (!useGps && !geoLoading) {
      queryDoctors();
    }
  }, [useGps, geoLoading, queryDoctors]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
    if (!stored || !token) { navigate("/login"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "patient") { navigate("/login"); return; }
    setUser(u);

    Promise.all([loadProfileData(), loadRequests()]).finally(() => setLoading(false));
  }, [navigate, loadProfileData, loadRequests]);

  const logout = () => { localStorage.clear(); navigate("/login"); };

  // ── File Upload Handler ────────────────────────────────────────────────────
  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadError("");
    const token = localStorage.getItem("accessToken");

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("attachmentType", type);

      const res = await fetch("/api/requests/upload-attachment", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "File upload failed.");
      } else {
        setUploadedAttachments((prev) => [...prev, data.attachment]);
      }
    } catch {
      setUploadError("Network error while uploading document.");
    } finally {
      setUploadingFile(false);
      e.target.value = null;
    }
  };

  const removeAttachment = (indexToRemove) => {
    setUploadedAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // ── Run AI Triage & Queue for HITL (Single Action) ─────────────────────────
  const handleRunAiTriage = async () => {
    const allSymptoms = [
      ...selectedPresetSymptoms,
      symptomDescription.trim()
    ].filter(Boolean).join(". ");

    if (!allSymptoms) {
      setTriageError("Please select preset symptoms or describe your current condition.");
      return;
    }

    setAiTriageRunning(true);
    setTriageError("");
    const token = localStorage.getItem("accessToken");
    const loc = triageLocation.trim() || profile?.region || searchCity || "Delhi";

    try {
      const res = await fetch("/api/requests/ai-triage-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          symptoms: allSymptoms,
          duration: symptomDuration,
          painLevel: painScale,
          affectedArea: affectedBodyArea,
          requirement: consultRequirement,
          location: loc,
          attachments: uploadedAttachments,
          latitude: location?.lat || null,
          longitude: location?.lng || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setTriageError(data.error || "AI Triage analysis could not be completed.");
      } else {
        setActiveCase(data.request);
        // Start 15-minute countdown (900 seconds)
        setTimerSecondsLeft(15 * 60);
        // Keep suggested track HIDDEN until reviewer approval
        setLiveTriageResult(null);

        await loadRequests();
      }
    } catch {
      setTriageError("Network error connecting to AI Triage engine.");
    } finally {
      setAiTriageRunning(false);
    }
  };

  const togglePresetSymptom = (name) => {
    setSelectedPresetSymptoms((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  // ── Profile Save Handler ──────────────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    const token = localStorage.getItem("accessToken");

    const payload = {
      fullName: profileForm.fullName.trim() || undefined,
      dateOfBirth: profileForm.dateOfBirth || undefined,
      sex: profileForm.sex,
      bloodGroup: profileForm.bloodGroup,
      region: profileForm.region.trim() || undefined,
      preferredLanguage: profileForm.preferredLanguage,
      medicalConditions: profileForm.medicalConditions,
      allergies: profileForm.allergies,
      currentMedications: profileForm.currentMedications.split(",").map((s) => s.trim()).filter(Boolean),
      pastMedicalHistory: profileForm.pastMedicalHistory.trim() || undefined,
      lifestyle: {
        smoking: profileForm.smoking,
        alcohol: profileForm.alcohol,
        exercise: profileForm.exercise,
        diet: profileForm.diet,
        sleep: profileForm.sleep,
        bloodGroup: profileForm.bloodGroup
      },
      emergencyContact: {
        name: profileForm.emergencyName.trim(),
        phone: profileForm.emergencyPhone.trim(),
        relationship: profileForm.emergencyRelationship
      }
    };

    try {
      const res = await fetch("/api/profile/patient", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update profile.");
      } else {
        setProfile(data.profile);
        setShowProfileModal(false);
        setGlobalBannerMsg("✓ Medical Profile updated & verified in Sanjeevani database!");
        setTimeout(() => setGlobalBannerMsg(""), 5000);
      }
    } catch {
      alert("Error saving profile details.");
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleConditionChip = (item) => {
    if (item === "None") {
      setProfileForm((prev) => ({ ...prev, medicalConditions: ["None"] }));
      return;
    }
    setProfileForm((prev) => {
      const cleaned = prev.medicalConditions.filter((c) => c !== "None");
      return cleaned.includes(item)
        ? { ...prev, medicalConditions: cleaned.filter((c) => c !== item) }
        : { ...prev, medicalConditions: [...cleaned, item] };
    });
  };

  const addCustomCondition = () => {
    if (!profileForm.customCondition.trim()) return;
    setProfileForm((prev) => ({
      ...prev,
      medicalConditions: [...prev.medicalConditions.filter((c) => c !== "None"), prev.customCondition.trim()],
      customCondition: ""
    }));
  };

  const toggleAllergyChip = (item) => {
    if (item === "None") {
      setProfileForm((prev) => ({ ...prev, allergies: ["None"] }));
      return;
    }
    setProfileForm((prev) => {
      const cleaned = prev.allergies.filter((a) => a !== "None");
      return cleaned.includes(item)
        ? { ...prev, allergies: cleaned.filter((a) => a !== item) }
        : { ...prev, allergies: [...cleaned, item] };
    });
  };

  const addCustomAllergy = () => {
    if (!profileForm.customAllergy.trim()) return;
    setProfileForm((prev) => ({
      ...prev,
      allergies: [...prev.allergies.filter((a) => a !== "None"), prev.customAllergy.trim()],
      customAllergy: ""
    }));
  };

  const isProfileIncomplete = !profile || profile.accountStatus !== "PROFILE_COMPLETE";

  // Format timer MM:SS
  const formatTimer = (secs) => {
    if (secs === null || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ width: "40px", height: "40px", border: "4px solid #e2e8f0", borderTop: "4px solid #0ea5e9", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <p style={{ marginTop: "16px", color: "#64748b", fontWeight: "600" }}>Loading Sanjeevani AI Health Platform…</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isPendingReview = activeCase && activeCase.hitlStatus === "PENDING" && (timerSecondsLeft === null || timerSecondsLeft > 0);

  return (
    <div style={ui.page}>
      {/* ── Top Navigation Bar ─────────────────────────────────────────────── */}
      <nav style={ui.nav}>
        <div style={ui.navLeft}>
          <span style={ui.logo} onClick={() => setCurrentTab("triage-mvp")}>
            🌿 Sanjeevani <span style={ui.mvpTag}>AI TRIAGE MVP</span>
          </span>
          <div style={ui.navLinks}>
            <button
              style={ui.navLink(currentTab === "triage-mvp")}
              onClick={() => setCurrentTab("triage-mvp")}
            >
              🤖 AI Symptom Triage (MVP)
            </button>
            <button
              style={ui.navLink(currentTab === "find-doctors")}
              onClick={() => setCurrentTab("find-doctors")}
            >
              👨‍⚕️ Verified Doctors
            </button>
            <button
              style={ui.navLink(currentTab === "lab-tests")}
              onClick={() => setCurrentTab("lab-tests")}
            >
              🧪 Book Lab Tests
            </button>
            <button
              style={ui.navLink(currentTab === "records")}
              onClick={() => setCurrentTab("records")}
            >
              📋 Prescriptions & Records
            </button>
            <button
              style={ui.navLink(currentTab === "my-requests")}
              onClick={() => setCurrentTab("my-requests")}
            >
              📂 Case Requests ({myRequests.length})
            </button>
          </div>
        </div>

        <div style={ui.navRight}>
          <button style={ui.profileBtn} onClick={() => setShowProfileModal(true)}>
            👤 {profile?.fullName || user?.phone || "My Health Profile"}
          </button>
          <button style={ui.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </nav>

      {/* ── Global Notification Bar ───────────────────────────────────────── */}
      {globalBannerMsg && (
        <div style={ui.successTopBar}>{globalBannerMsg}</div>
      )}

      {/* ── Hero Banner (Clean & Focused) ─────────────────────────────────── */}
      <div style={ui.hero}>
        <div style={{ maxWidth: "880px", margin: "0 auto" }}>
          <div style={ui.heroBadge}>✨ NEXT-GEN AI CLINICAL TRIAGE & TELEHEALTH</div>
          <h1 style={ui.heroTitle}>AI-Assisted Medical Triage & Care Gateway</h1>
          <p style={ui.heroSubtitle}>
            Describe symptoms, upload affected area photos, and receive instantaneous clinical triage, specialist routing, and verified clinician review.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "20px" }}>
            <button
              style={ui.heroCtaPrimary}
              onClick={() => { setCurrentTab("triage-mvp"); window.scrollTo({ top: 380, behavior: "smooth" }); }}
            >
              🚀 Launch AI Symptom Triage MVP
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Body Container ───────────────────────────────────────────── */}
      <div style={ui.body}>
        {/* Profile Incomplete Notification Banner (one-time alert) */}
        {isProfileIncomplete && (
          <div style={ui.alertBanner}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.5rem" }}>⚠️</span>
              <div>
                <strong style={{ color: "#92400e", fontSize: "0.95rem" }}>Health Profile Incomplete</strong>
                <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "#b45309" }}>
                  Add your allergies, conditions, and emergency contacts to unlock enhanced AI triage diagnostics.
                </p>
              </div>
            </div>
            <button style={ui.completeProfileBtn} onClick={() => setShowProfileModal(true)}>
              Complete Profile →
            </button>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            TAB 1: AI SYMPTOM TRIAGE CENTER (THE MVP!)
            ═════════════════════════════════════════════════════════════════════ */}
        {currentTab === "triage-mvp" && (
          <div style={ui.section}>
            <div style={ui.sectionHeaderRow}>
              <div>
                <h2 style={ui.sectionTitle}>AI Symptom Triage & Clinical Intake Station</h2>
                <p style={ui.sectionDesc}>
                  Clinical triage engine powered by Groq Llama 3.3 and Human-in-the-Loop review.
                </p>
              </div>
              <span style={ui.aiPoweredBadge}>⚡ Groq LLM + HITL Review Active</span>
            </div>

            <div style={ui.triageGridLayout}>
              {/* Left Column: Triage Input Form */}
              <div style={ui.card}>
                <h3 style={ui.cardHeader}>1. Chief Complaints & Symptoms</h3>

                {/* Preset quick symptom chips */}
                <label style={ui.fieldLabel}>Quick-Select Common Symptoms</label>
                <div style={ui.symptomChipsGrid}>
                  {SYMPTOM_PRESETS.map((item) => {
                    const isSelected = selectedPresetSymptoms.includes(item.name);
                    return (
                      <button
                        key={item.name}
                        type="button"
                        style={ui.symptomChip(isSelected)}
                        onClick={() => togglePresetSymptom(item.name)}
                      >
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Detailed Symptom Description */}
                <div style={{ marginTop: "16px" }}>
                  <label style={ui.fieldLabel}>Detailed Symptom Description *</label>
                  <textarea
                    rows={4}
                    style={ui.textarea}
                    placeholder="Describe your symptoms in detail (e.g. Red itchy rash on left forearm started 2 days ago, mild burning sensation after shower, no fever...)"
                    value={symptomDescription}
                    onChange={(e) => setSymptomDescription(e.target.value)}
                  />
                </div>

                {/* Duration & Pain Level */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                  <div>
                    <label style={ui.fieldLabel}>Symptom Duration</label>
                    <select
                      style={ui.select}
                      value={symptomDuration}
                      onChange={(e) => setSymptomDuration(e.target.value)}
                    >
                      <option value="< 24 Hours">Less than 24 Hours</option>
                      <option value="2-3 Days">2 to 3 Days</option>
                      <option value="1-2 Weeks">1 to 2 Weeks</option>
                      <option value="1 Month+">More than a Month (Chronic)</option>
                    </select>
                  </div>
                  <div>
                    <label style={ui.fieldLabel}>Pain / Discomfort Scale: <strong>{painScale} / 10</strong></label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={painScale}
                      onChange={(e) => setPainScale(parseInt(e.target.value, 10))}
                      style={{ width: "100%", accentColor: painScale >= 7 ? "#ef4444" : painScale >= 4 ? "#f59e0b" : "#10b981", cursor: "pointer", marginTop: "8px" }}
                    />
                  </div>
                </div>

                {/* Affected Body Area & City Location */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                  <div>
                    <label style={ui.fieldLabel}>Affected Body Region</label>
                    <select
                      style={ui.select}
                      value={affectedBodyArea}
                      onChange={(e) => setAffectedBodyArea(e.target.value)}
                    >
                      <option value="Skin / Arms / Legs">Skin / Arms / Legs</option>
                      <option value="Head / Face / Eyes">Head / Face / Eyes</option>
                      <option value="Throat / Neck / Chest">Throat / Neck / Chest</option>
                      <option value="Stomach / Abdomen">Stomach / Abdomen</option>
                      <option value="Spine / Lower Back">Spine / Lower Back</option>
                      <option value="General Body / Systemic">General Body / Systemic</option>
                    </select>
                  </div>
                  <div>
                    <label style={ui.fieldLabel}>Your Location / City</label>
                    <input
                      type="text"
                      style={ui.input}
                      placeholder="e.g. Delhi, Ranchi, Mumbai"
                      value={triageLocation}
                      onChange={(e) => setTriageLocation(e.target.value)}
                    />
                  </div>
                </div>

                {/* ═════════════════════════════════════════════════════════════
                    SECTION 2: UPLOAD PICTURES & OLD PRESCRIPTIONS
                    ═════════════════════════════════════════════════════════════ */}
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #e2e8f0" }}>
                  <h3 style={ui.cardHeader}>2. Visual & Diagnostic Evidence (Optional)</h3>
                  <p style={{ fontSize: "0.8125rem", color: "#64748b", marginTop: "-8px", marginBottom: "14px" }}>
                    Upload photos of the affected area and old prescriptions for higher diagnostic accuracy.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    {/* Upload Affected Area Photo */}
                    <div style={ui.uploadDropzone}>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        ref={affectedFileInputRef}
                        style={{ display: "none" }}
                        onChange={(e) => handleFileUpload(e, "affected_area")}
                      />
                      <span style={{ fontSize: "1.75rem" }}>📸</span>
                      <strong style={{ fontSize: "0.85rem", color: "#0f172a" }}>Photo of Affected Area</strong>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Skin rash, eye, wound, swelling (JPEG/PNG)</span>
                      <button
                        type="button"
                        style={ui.uploadBtn}
                        onClick={() => affectedFileInputRef.current?.click()}
                        disabled={uploadingFile}
                      >
                        {uploadingFile ? "Uploading…" : "+ Upload Photo"}
                      </button>
                    </div>

                    {/* Upload Old Prescription / Report */}
                    <div style={ui.uploadDropzone}>
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png"
                        ref={prescriptionFileInputRef}
                        style={{ display: "none" }}
                        onChange={(e) => handleFileUpload(e, "old_prescription")}
                      />
                      <span style={{ fontSize: "1.75rem" }}>📄</span>
                      <strong style={{ fontSize: "0.85rem", color: "#0f172a" }}>Old Prescription / Report</strong>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Past Rx, lab records (PDF/Image)</span>
                      <button
                        type="button"
                        style={ui.uploadBtn}
                        onClick={() => prescriptionFileInputRef.current?.click()}
                        disabled={uploadingFile}
                      >
                        {uploadingFile ? "Uploading…" : "+ Upload Document"}
                      </button>
                    </div>
                  </div>

                  {uploadError && <div style={ui.errorText}>{uploadError}</div>}

                  {/* Attachment Previews List */}
                  {uploadedAttachments.length > 0 && (
                    <div style={{ marginTop: "16px" }}>
                      <label style={ui.fieldLabel}>Uploaded Attachments ({uploadedAttachments.length})</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {uploadedAttachments.map((att, idx) => (
                          <div key={idx} style={ui.attachmentItem}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              {att.mimetype?.includes("image") ? (
                                <img src={att.url} alt="thumbnail" style={ui.thumbImg} />
                              ) : (
                                <span style={{ fontSize: "1.5rem" }}>📄</span>
                              )}
                              <div>
                                <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#0f172a" }}>{att.filename}</div>
                                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                  {att.type === "affected_area" ? "📸 Affected Area Photo" : "📄 Prior Prescription"} · {(att.sizeBytes / 1024).toFixed(0)} KB
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              style={ui.removeAttBtn}
                              onClick={() => removeAttachment(idx)}
                            >
                              ✕ Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Single Primary Action: Run AI Clinical Triage */}
                <div style={{ marginTop: "24px" }}>
                  <button
                    type="button"
                    style={{ ...ui.btnPrimary, width: "100%", padding: "14px", fontSize: "1rem" }}
                    onClick={handleRunAiTriage}
                    disabled={aiTriageRunning}
                  >
                    {aiTriageRunning ? "⚡ Running AI Triage & Queuing for Clinician Review…" : "⚡ Run AI Clinical Triage"}
                  </button>
                </div>

                {triageError && <div style={{ ...ui.errorText, marginTop: "12px" }}>{triageError}</div>}
              </div>

              {/* Right Column: Active HITL Review & Verified Triage Path */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* CASE 1: PENDING HITL REVIEW - Keep track hidden, only show timer & active message */}
                {isPendingReview ? (
                  <div style={ui.reviewPendingCard}>
                    <div style={ui.timerBigBadge}>
                      <span style={{ fontSize: "1.75rem" }}>⏱️</span>
                      <div>
                        <div style={{ fontSize: "0.75rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", color: "#0369a1" }}>
                          Clinical Intake Active & Under Review
                        </div>
                        <div style={{ fontSize: "1.85rem", fontWeight: "900", color: "#0c4a6e", fontFamily: "monospace" }}>
                          {formatTimer(timerSecondsLeft)}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: "16px", background: "#fff", padding: "16px", borderRadius: "12px", border: "1px solid #bae6fd" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0369a1", fontWeight: "750", fontSize: "0.95rem" }}>
                        <span style={{ animation: "pulse 1.5s infinite" }}>🩺</span>
                        Medical Reviewer Audit in Progress
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "#334155", lineHeight: "1.6", margin: "8px 0 0" }}>
                        Your symptoms, pain score, and attached evidence have been logged and securely queued for audit by our on-duty clinical team.
                      </p>
                      <div style={{ marginTop: "12px", fontSize: "0.75rem", color: "#64748b", background: "#f0f9ff", padding: "8px 12px", borderRadius: "6px" }}>
                        🔒 <strong>Safety Protocol:</strong> Recommendations and specialist paths will unlock once validated by a certified clinician (or auto-fallback after 15 minutes).
                      </div>
                    </div>

                    <div style={{ marginTop: "14px", fontSize: "0.8rem", color: "#0369a1", textAlign: "center", fontWeight: "600" }}>
                      🔄 Live Syncing with Clinical Station…
                    </div>
                  </div>
                ) : liveTriageResult ? (
                  /* CASE 2: APPROVED / OVERRIDDEN / TIMEOUT - Reveal Verified Path */
                  <div style={ui.card}>
                    {/* Status Badge */}
                    {activeCase && (
                      <div style={ui.timerBanner(activeCase.hitlStatus)}>
                        <div style={{ fontSize: "0.85rem", fontWeight: "750" }}>
                          {activeCase.hitlStatus === "APPROVED" && `✓ Validated by Clinician (${activeCase.hitlReviewerName || "Medical Reviewer"})`}
                          {activeCase.hitlStatus === "OVERRIDDEN" && `⚠️ Path Adjusted by Clinician (${activeCase.hitlReviewerName || "Medical Reviewer"})`}
                          {activeCase.hitlStatus === "TIMEOUT_FALLBACK" && "⏱️ 15-Min Window Elapsed — Instant Teleconsultation Active"}
                        </div>

                        {activeCase.hitlStatus === "OVERRIDDEN" && activeCase.hitlOverrideNotes && (
                          <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>
                            <strong>Clinician's Note:</strong> {activeCase.hitlOverrideNotes}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Triage Category Banner */}
                    <div style={ui.triageCategoryBanner(liveTriageResult.triageCategory)}>
                      <span style={{ fontSize: "2rem" }}>
                        {liveTriageResult.triageCategory === "EMERGENCY_ESCALATION" ? "🚨" : liveTriageResult.triageCategory === "PHYSICAL_VISIT" ? "🏥" : "💻"}
                      </span>
                      <div>
                        <div style={{ fontSize: "0.75rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Validated Triage Path
                        </div>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "800", margin: "2px 0" }}>
                          {liveTriageResult.triageCategory?.replace(/_/g, " ")}
                        </h3>
                        <div style={{ fontSize: "0.8125rem", opacity: 0.9 }}>
                          Urgency Level: <strong>{liveTriageResult.urgencyLevel || "ASSESSED"}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Recommended Specialist */}
                    <div style={ui.specialistBox}>
                      <span style={{ fontSize: "1.5rem" }}>👨‍⚕️</span>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600" }}>RECOMMENDED SPECIALIST ROUTING</div>
                        <strong style={{ fontSize: "1.05rem", color: "#0ea5e9" }}>{liveTriageResult.recommendedSpecialization || "General Physician"}</strong>
                      </div>
                    </div>

                    {/* Suspected Conditions */}
                    <div style={{ marginTop: "16px" }}>
                      <label style={ui.fieldLabel}>Suspected Clinical Indications</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                        {(liveTriageResult.suspectedConditions || []).map((cond, idx) => (
                          <span key={idx} style={ui.suspectedChip}>
                            🔍 {cond}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Clinical Reasoning */}
                    <div style={{ marginTop: "16px" }}>
                      <label style={ui.fieldLabel}>Clinical Assessment Reasoning</label>
                      <div style={ui.reasoningCard}>
                        {liveTriageResult.clinicalReasoning}
                      </div>
                    </div>

                    {/* Red Flags & Precautions */}
                    {liveTriageResult.redFlags && liveTriageResult.redFlags.length > 0 && (
                      <div style={{ marginTop: "16px" }}>
                        <label style={{ ...ui.fieldLabel, color: "#b91c1c" }}>⚠️ Red-Flag Warnings to Watch</label>
                        <ul style={{ margin: "6px 0 0", paddingLeft: "18px", fontSize: "0.8125rem", color: "#991b1b" }}>
                          {liveTriageResult.redFlags.map((rf, idx) => (
                            <li key={idx} style={{ marginBottom: "4px" }}>{rf}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Immediate Home Precautions */}
                    {liveTriageResult.immediatePrecautions && liveTriageResult.immediatePrecautions.length > 0 && (
                      <div style={{ marginTop: "16px" }}>
                        <label style={{ ...ui.fieldLabel, color: "#15803d" }}>🌿 Immediate Precautionary Guidance</label>
                        <ul style={{ margin: "6px 0 0", paddingLeft: "18px", fontSize: "0.8125rem", color: "#166534" }}>
                          {liveTriageResult.immediatePrecautions.map((p, idx) => (
                            <li key={idx} style={{ marginBottom: "4px" }}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Button to Find Matching Doctors */}
                    <button
                      type="button"
                      style={{ ...ui.btnPrimary, width: "100%", marginTop: "20px" }}
                      onClick={() => {
                        const isPhys = liveTriageResult.triageCategory === "PHYSICAL_VISIT";
                        setSearchQuery(liveTriageResult.recommendedSpecialization || "");
                        setCurrentTab("find-doctors");
                        queryDoctors(liveTriageResult.recommendedSpecialization, isPhys);
                      }}
                    >
                      {liveTriageResult.triageCategory === "PHYSICAL_VISIT"
                        ? `Find Verified Nearby ${liveTriageResult.recommendedSpecialization || "Doctors"} →`
                        : `Consult Verified ${liveTriageResult.recommendedSpecialization || "Doctors"} Online →`}
                    </button>
                  </div>
                ) : (
                  /* CASE 3: Initial Empty State */
                  <div style={{ ...ui.card, textAlign: "center", padding: "48px 24px" }}>
                    <span style={{ fontSize: "3rem", display: "block", marginBottom: "12px" }}>🤖</span>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>
                      AI Clinical Triage Ready
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "#64748b", lineHeight: "1.5" }}>
                      Select symptoms on the left, add duration and photos, then click <strong>Run AI Clinical Triage</strong> to begin clinical intake and 15-minute clinician review.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            TAB 2: VERIFIED DOCTORS (PHYSICAL VS TELECONSULTATION)
            ═════════════════════════════════════════════════════════════════════ */}
        {currentTab === "find-doctors" && (
          <div style={ui.section}>
            <div style={ui.sectionHeaderRow}>
              <div>
                <h2 style={ui.sectionTitle}>Verified Medical Practitioners</h2>
                <p style={ui.sectionDesc}>
                  {liveTriageResult?.triageCategory === "PHYSICAL_VISIT"
                    ? "📍 In-Person Physical Visit: Showing verified practitioners available in your local vicinity."
                    : "💻 Teleconsultation Safe: Showing verified practitioners available nationwide across India."}
                </p>
              </div>
            </div>

            {/* Search Filter Bar */}
            <div style={ui.doctorSearchBar}>
              <div style={{ flex: 1, display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Specialization (e.g. Dermatologist, Cardiologist, Physician)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={ui.input}
                />
                <input
                  type="text"
                  placeholder="City / Region"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  style={{ ...ui.input, maxWidth: "160px" }}
                />
              </div>
              <button style={ui.btnPrimary} onClick={() => queryDoctors()}>Search Directory</button>
            </div>

            {searchingDoctors ? (
              <div style={ui.emptyState}>Searching verified practitioners…</div>
            ) : doctorsList.length === 0 ? (
              <div style={{ ...ui.card, textAlign: "center", padding: "40px 20px" }}>
                <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "8px" }}>🩺</span>
                <strong style={{ fontSize: "1.05rem", color: "#0f172a" }}>No verified doctors matching "{searchQuery || 'all'}" found</strong>
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "6px 0 0" }}>
                  Try broadening your search query or city location.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {doctorsList.map((doc) => (
                  <div key={doc.userId} style={ui.doctorCard}>
                    <div style={ui.doctorAvatar}>👨‍⚕️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h4 style={ui.doctorName}>{doc.fullName}</h4>
                        <span style={ui.verifiedBadge}>✓ Verified Practitioner</span>
                      </div>
                      <div style={ui.doctorSpecialty}>{doc.specialization} {doc.subSpecialization ? `· ${doc.subSpecialization}` : ""}</div>
                      <div style={ui.doctorMeta}>
                        <span>💼 {doc.yearsOfExperience || 1}+ Yrs Exp</span>
                        <span>📍 {doc.clinicOrHospital || "Private Clinic"}, {doc.city}</span>
                        {doc.distanceKm !== undefined && <span style={{ color: "#10b981", fontWeight: "700" }}>📍 {doc.distanceKm} km away</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
                        ₹{doc.consultationFee || 500}
                      </div>
                      <button
                        style={ui.btnPrimary}
                        onClick={() => {
                          setGlobalBannerMsg(`✓ Consultation appointment request queued for Dr. ${doc.fullName}. We will notify you when accepted!`);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                          setTimeout(() => setGlobalBannerMsg(""), 5000);
                        }}
                      >
                        Book Consult
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            TAB 3: BOOK LAB TESTS
            ═════════════════════════════════════════════════════════════════════ */}
        {currentTab === "lab-tests" && (
          <div style={ui.section}>
            <div style={ui.sectionHeaderRow}>
              <div>
                <h2 style={ui.sectionTitle}>Certified Laboratory Diagnostics</h2>
                <p style={ui.sectionDesc}>Doorstep home sample collection with digital reports in 24 hours.</p>
              </div>
            </div>

            <div style={ui.labsGrid}>
              {DIAGNOSTIC_TESTS.map((test) => (
                <div key={test.id} style={ui.labCard}>
                  <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>{test.title}</div>
                  <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "6px 0 16px" }}>{test.desc}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                    <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>₹{test.price}</span>
                    <button
                      style={ui.btnPrimary}
                      onClick={() => {
                        setGlobalBannerMsg(`✓ Diagnostic booking registered for ${test.title}. Lab technician will contact you for home collection.`);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                        setTimeout(() => setGlobalBannerMsg(""), 5000);
                      }}
                    >
                      Book Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            TAB 4: PRESCRIPTIONS & CLINICAL RECORDS
            ═════════════════════════════════════════════════════════════════════ */}
        {currentTab === "records" && (
          <div style={ui.section}>
            <div style={ui.sectionHeaderRow}>
              <div>
                <h2 style={ui.sectionTitle}>Digital Clinical Records & Prescriptions</h2>
                <p style={ui.sectionDesc}>Access issued e-prescriptions and triage case summaries.</p>
              </div>
            </div>

            {myRequests.filter((r) => r.prescription).length === 0 ? (
              <div style={{ ...ui.card, textAlign: "center", padding: "40px 20px" }}>
                <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "8px" }}>📋</span>
                <strong style={{ fontSize: "1.05rem", color: "#0f172a" }}>No Digital Prescriptions Issued Yet</strong>
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "6px 0 0" }}>
                  Prescriptions issued by attending doctors upon consultation completion will automatically appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {myRequests.filter((r) => r.prescription).map((req) => (
                  <div key={req.id} style={ui.doctorCard}>
                    <span style={{ fontSize: "2rem" }}>💊</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "700", color: "#0f172a" }}>Prescription #{req.id.slice(0, 8).toUpperCase()}</div>
                      <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                        Dr. {req.doctorUser?.doctorProfile?.fullName || "Attending Physician"} · {new Date(req.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      style={ui.btnPrimary}
                      onClick={() => navigate(`/patient/request/${req.id}`)}
                    >
                      View & Print Prescription →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            TAB 5: MY CASE REQUESTS
            ═════════════════════════════════════════════════════════════════════ */}
        {currentTab === "my-requests" && (
          <div style={ui.section}>
            <div style={ui.sectionHeaderRow}>
              <div>
                <h2 style={ui.sectionTitle}>My Triage & Clinical Consult Requests</h2>
                <p style={ui.sectionDesc}>Track status of submitted symptoms and attending medical staff.</p>
              </div>
            </div>

            {myRequests.length === 0 ? (
              <div style={{ ...ui.card, textAlign: "center", padding: "40px 20px" }}>
                <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "8px" }}>📋</span>
                <strong style={{ fontSize: "1.05rem", color: "#0f172a" }}>No case requests submitted yet</strong>
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "6px 0 16px" }}>
                  Use the AI Triage MVP tab to submit your symptom log.
                </p>
                <button style={ui.btnPrimary} onClick={() => setCurrentTab("triage-mvp")}>
                  Start AI Symptom Triage →
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {myRequests.map((req) => (
                  <div key={req.id} style={ui.caseCard(req.triageCategory)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {req.hitlStatus === "PENDING" ? (
                          <span style={ui.hitlPill("PENDING")}>
                            ⏱️ Under Clinical Review
                          </span>
                        ) : (
                          <>
                            <span style={ui.triageBadge(req.triageCategory)}>
                              {req.triageCategory?.replace(/_/g, " ")}
                            </span>
                            <span style={ui.hitlPill(req.hitlStatus)}>
                              HITL: {req.hitlStatus}
                            </span>
                          </>
                        )}
                      </div>
                      <span style={ui.statusBadge(req.status)}>
                        {req.status}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.95rem", color: "#0f172a", fontWeight: "600", marginBottom: "4px" }}>
                      {req.symptoms}
                    </div>

                    <div style={{ fontSize: "0.8125rem", color: "#64748b", display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "6px" }}>
                      <span>📍 {req.location}</span>
                      <span>📅 {new Date(req.createdAt).toLocaleString()}</span>
                      {req.attachments && req.attachments.length > 0 && (
                        <span>📎 {req.attachments.length} attachment(s)</span>
                      )}
                    </div>

                    {req.hitlStatus !== "PENDING" && req.triageReasoning && (
                      <div style={ui.caseReasoningBox}>
                        <strong>Clinical Note:</strong> {req.triageReasoning}
                      </div>
                    )}

                    {req.doctorUser && req.doctorUser.doctorProfile && (
                      <div style={ui.assignedDocBox}>
                        <span>👨‍⚕️</span>
                        <div>
                          <strong style={{ color: "#0f172a" }}>Dr. {req.doctorUser.doctorProfile.fullName}</strong>
                          <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>
                            {req.doctorUser.doctorProfile.specialization} · {req.doctorUser.doctorProfile.clinicOrHospital || "Consulting Clinic"}
                          </span>
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                      <button
                        style={ui.btnSecondary}
                        onClick={() => navigate(`/patient/request/${req.id}`)}
                      >
                        View Full Case & Timeline →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════
          HEALTH PROFILE MODAL
          ═════════════════════════════════════════════════════════════════════════ */}
      {showProfileModal && (
        <div style={ui.modalOverlay}>
          <div style={ui.modalContent}>
            <div style={ui.modalHeader}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                  Patient Health & Vitals Profile
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "2px 0 0" }}>
                  Accurate details enable tailored AI triage logs and safe clinical consultations.
                </p>
              </div>
              <button style={ui.closeModalBtn} onClick={() => setShowProfileModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ maxHeight: "72vh", overflowY: "auto", paddingRight: "4px" }}>
              {/* Section 1: Demographics & Blood Group */}
              <div style={ui.formSection}>
                <h4 style={ui.formSectionTitle}>1. Personal Demographics & Vitals</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={ui.fieldLabel}>Full Name *</label>
                    <input
                      type="text"
                      style={ui.input}
                      placeholder="e.g. John Doe"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={ui.fieldLabel}>Date of Birth</label>
                    <input
                      type="date"
                      style={ui.input}
                      value={profileForm.dateOfBirth}
                      onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "10px" }}>
                  <div>
                    <label style={ui.fieldLabel}>Gender / Sex</label>
                    <select
                      style={ui.select}
                      value={profileForm.sex}
                      onChange={(e) => setProfileForm({ ...profileForm, sex: e.target.value })}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label style={ui.fieldLabel}>City / Region</label>
                    <input
                      type="text"
                      style={ui.input}
                      placeholder="e.g. Delhi, Ranchi"
                      value={profileForm.region}
                      onChange={(e) => setProfileForm({ ...profileForm, region: e.target.value })}
                    />
                  </div>
                </div>

                {/* Blood Group Selectable Pills */}
                <div style={{ marginTop: "12px" }}>
                  <label style={ui.fieldLabel}>Blood Group</label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                    {BLOOD_GROUPS.map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        style={ui.pillBtn(profileForm.bloodGroup === bg)}
                        onClick={() => setProfileForm({ ...profileForm, bloodGroup: bg })}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 2: Medical Conditions & Allergies */}
              <div style={ui.formSection}>
                <h4 style={ui.formSectionTitle}>2. Existing Health Conditions & Allergies</h4>

                {/* Conditions */}
                <div>
                  <label style={ui.fieldLabel}>Existing Medical Conditions</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "6px 0 8px" }}>
                    {COMMON_CONDITIONS.map((cond) => {
                      const isSel = profileForm.medicalConditions.includes(cond);
                      return (
                        <button
                          key={cond}
                          type="button"
                          style={ui.pillBtn(isSel)}
                          onClick={() => toggleConditionChip(cond)}
                        >
                          {isSel ? "✓ " : "+ "}{cond}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      style={ui.input}
                      placeholder="Add other medical condition…"
                      value={profileForm.customCondition}
                      onChange={(e) => setProfileForm({ ...profileForm, customCondition: e.target.value })}
                    />
                    <button type="button" style={ui.btnSecondary} onClick={addCustomCondition}>Add</button>
                  </div>
                </div>

                {/* Allergies */}
                <div style={{ marginTop: "14px" }}>
                  <label style={ui.fieldLabel}>Known Allergies (Medications / Food / Environmental)</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "6px 0 8px" }}>
                    {COMMON_ALLERGIES.map((allg) => {
                      const isSel = profileForm.allergies.includes(allg);
                      return (
                        <button
                          key={allg}
                          type="button"
                          style={ui.pillBtn(isSel)}
                          onClick={() => toggleAllergyChip(allg)}
                        >
                          {isSel ? "✓ " : "+ "}{allg}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      style={ui.input}
                      placeholder="Add other allergy (e.g. Iodine, NSAIDs)…"
                      value={profileForm.customAllergy}
                      onChange={(e) => setProfileForm({ ...profileForm, customAllergy: e.target.value })}
                    />
                    <button type="button" style={ui.btnSecondary} onClick={addCustomAllergy}>Add</button>
                  </div>
                </div>

                {/* Current Medications & History */}
                <div style={{ marginTop: "14px" }}>
                  <label style={ui.fieldLabel}>Current Regular Medications</label>
                  <input
                    type="text"
                    style={ui.input}
                    placeholder="e.g. Metformin 500mg, Thyroxine 50mcg (comma separated)"
                    value={profileForm.currentMedications}
                    onChange={(e) => setProfileForm({ ...profileForm, currentMedications: e.target.value })}
                  />
                </div>
                <div style={{ marginTop: "10px" }}>
                  <label style={ui.fieldLabel}>Past Surgeries / Major Illness History</label>
                  <textarea
                    rows={2}
                    style={ui.textarea}
                    placeholder="Any previous surgeries, hospitalizations, or chronic ailments…"
                    value={profileForm.pastMedicalHistory}
                    onChange={(e) => setProfileForm({ ...profileForm, pastMedicalHistory: e.target.value })}
                  />
                </div>
              </div>

              {/* Section 3: Lifestyle Habits */}
              <div style={ui.formSection}>
                <h4 style={ui.formSectionTitle}>3. Lifestyle & Wellness Habits</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={ui.fieldLabel}>Smoking Status</label>
                    <select
                      style={ui.select}
                      value={profileForm.smoking}
                      onChange={(e) => setProfileForm({ ...profileForm, smoking: e.target.value })}
                    >
                      <option value="Non-Smoker">Non-Smoker</option>
                      <option value="Occasional">Occasional</option>
                      <option value="Regular">Regular</option>
                      <option value="Former Smoker">Former Smoker</option>
                    </select>
                  </div>
                  <div>
                    <label style={ui.fieldLabel}>Alcohol Consumption</label>
                    <select
                      style={ui.select}
                      value={profileForm.alcohol}
                      onChange={(e) => setProfileForm({ ...profileForm, alcohol: e.target.value })}
                    >
                      <option value="None">None / Non-Drinker</option>
                      <option value="Socially">Social Drinker</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Regular">Regular</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "10px" }}>
                  <div>
                    <label style={ui.fieldLabel}>Physical Activity / Exercise</label>
                    <select
                      style={ui.select}
                      value={profileForm.exercise}
                      onChange={(e) => setProfileForm({ ...profileForm, exercise: e.target.value })}
                    >
                      <option value="Sedentary">Sedentary (Little to none)</option>
                      <option value="Light (1-2 days/week)">Light (1-2 days/week)</option>
                      <option value="Moderate (3-4 days/week)">Moderate (3-4 days/week)</option>
                      <option value="Active (5+ days/week)">Active (5+ days/week)</option>
                    </select>
                  </div>
                  <div>
                    <label style={ui.fieldLabel}>Dietary Preference</label>
                    <select
                      style={ui.select}
                      value={profileForm.diet}
                      onChange={(e) => setProfileForm({ ...profileForm, diet: e.target.value })}
                    >
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Non-Vegetarian">Non-Vegetarian</option>
                      <option value="Eggetarian">Eggetarian</option>
                      <option value="Vegan">Vegan</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Emergency Contact */}
              <div style={ui.formSection}>
                <h4 style={ui.formSectionTitle}>4. Emergency Contact</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={ui.fieldLabel}>Contact Name</label>
                    <input
                      type="text"
                      style={ui.input}
                      placeholder="e.g. Jane Doe"
                      value={profileForm.emergencyName}
                      onChange={(e) => setProfileForm({ ...profileForm, emergencyName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={ui.fieldLabel}>Relationship</label>
                    <select
                      style={ui.select}
                      value={profileForm.emergencyRelationship}
                      onChange={(e) => setProfileForm({ ...profileForm, emergencyRelationship: e.target.value })}
                    >
                      <option value="Parent">Parent</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Child">Child</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={ui.fieldLabel}>Phone Number</label>
                    <input
                      type="tel"
                      style={ui.input}
                      placeholder="e.g. 9876543210"
                      value={profileForm.emergencyPhone}
                      onChange={(e) => setProfileForm({ ...profileForm, emergencyPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  style={ui.btnSecondary}
                  onClick={() => setShowProfileModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={ui.btnPrimary}
                  disabled={savingProfile}
                >
                  {savingProfile ? "Saving Details…" : "Save Health Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Design Tokens & Styles ───────────────────────────────────────────────────
const ui = {
  page: { background: "#f8fafc", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" },

  nav: {
    background: "#fff", borderBottom: "1px solid #e2e8f0", height: "64px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 24px", position: "sticky", top: 0, zIndex: 10
  },
  navLeft: { display: "flex", alignItems: "center", gap: "28px" },
  logo: { fontSize: "1.2rem", fontWeight: "850", color: "#0284c7", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  mvpTag: { fontSize: "0.65rem", fontWeight: "800", background: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: "4px" },
  navLinks: { display: "flex", gap: "8px" },
  navLink: (active) => ({
    textDecoration: "none",
    color: active ? "#0284c7" : "#475569",
    background: active ? "#f0f9ff" : "transparent",
    fontWeight: active ? "750" : "600",
    fontSize: "0.875rem",
    cursor: "pointer",
    border: active ? "1px solid #bae6fd" : "1px solid transparent",
    borderRadius: "8px",
    padding: "6px 12px",
    transition: "all 0.15s"
  }),
  navRight: { display: "flex", alignItems: "center", gap: "12px" },
  profileBtn: {
    fontSize: "0.85rem", color: "#0369a1", background: "#e0f2fe", border: "1px solid #bae6fd",
    padding: "6px 14px", borderRadius: "8px", fontWeight: "600", cursor: "pointer"
  },
  logoutBtn: {
    background: "none", border: "1.5px solid #cbd5e1", borderRadius: "8px",
    padding: "6px 12px", cursor: "pointer", fontSize: "0.85rem", color: "#475569", fontWeight: "600"
  },

  hero: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0369a1 100%)",
    padding: "50px 24px 70px", color: "#fff", textAlign: "center"
  },
  heroBadge: {
    display: "inline-block", fontSize: "0.75rem", fontWeight: "800", color: "#7dd3fc",
    background: "rgba(14, 165, 233, 0.2)", border: "1px solid rgba(14, 165, 233, 0.4)",
    padding: "4px 12px", borderRadius: "100px", marginBottom: "14px"
  },
  heroTitle: { fontSize: "2.35rem", fontWeight: "850", marginBottom: "10px", letterSpacing: "-0.02em" },
  heroSubtitle: { fontSize: "1.05rem", color: "#bae6fd", maxWidth: "700px", margin: "0 auto", lineHeight: "1.6" },
  heroCtaPrimary: {
    background: "#0ea5e9", color: "#fff", border: "none", padding: "12px 24px",
    borderRadius: "10px", fontWeight: "750", fontSize: "0.95rem", cursor: "pointer",
    boxShadow: "0 10px 20px rgba(14, 165, 233, 0.3)"
  },

  body: { maxWidth: "1200px", margin: "-30px auto 50px", padding: "0 24px", boxSizing: "border-box" },

  alertBanner: {
    background: "#fef9c3", border: "1.5px solid #fde68a", borderRadius: "12px",
    padding: "16px 20px", marginBottom: "28px", display: "flex", justifyContent: "space-between",
    alignItems: "center", boxShadow: "0 4px 12px rgba(251, 191, 36, 0.15)"
  },
  completeProfileBtn: {
    background: "#d97706", color: "#fff", border: "none", borderRadius: "8px",
    padding: "8px 16px", fontSize: "0.85rem", fontWeight: "750", cursor: "pointer"
  },
  successTopBar: {
    background: "#dcfce7", borderBottom: "1px solid #bbf7d0", color: "#166534",
    padding: "10px 24px", textAlign: "center", fontSize: "0.875rem", fontWeight: "700"
  },

  section: { marginBottom: "40px" },
  sectionHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" },
  sectionTitle: { fontSize: "1.4rem", fontWeight: "850", color: "#0f172a", margin: 0 },
  sectionDesc: { fontSize: "0.875rem", color: "#64748b", margin: "4px 0 0" },
  aiPoweredBadge: {
    fontSize: "0.75rem", fontWeight: "800", color: "#0284c7", background: "#e0f2fe",
    border: "1px solid #bae6fd", padding: "4px 10px", borderRadius: "100px"
  },

  triageGridLayout: { display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "24px" },
  card: { background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" },
  cardHeader: { fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", margin: "0 0 14px 0" },

  reviewPendingCard: {
    background: "#f0f9ff", borderRadius: "16px", border: "2px solid #bae6fd", padding: "24px",
    boxShadow: "0 8px 24px rgba(14, 165, 233, 0.08)"
  },
  timerBigBadge: {
    display: "flex", alignItems: "center", gap: "16px", padding: "14px 18px",
    background: "#e0f2fe", border: "1.5px solid #7dd3fc", borderRadius: "12px"
  },

  fieldLabel: { fontSize: "0.8125rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" },
  input: { width: "100%", padding: "10px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem", boxSizing: "border-box" },
  select: { width: "100%", padding: "10px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem", background: "#fff", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "10px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" },

  symptomChipsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px" },
  symptomChip: (active) => ({
    display: "flex", alignItems: "center", gap: "6px", padding: "8px 10px",
    borderRadius: "8px", border: active ? "1.5px solid #0284c7" : "1.5px solid #e2e8f0",
    background: active ? "#e0f2fe" : "#f8fafc", color: active ? "#0369a1" : "#334155",
    fontWeight: active ? "750" : "500", fontSize: "0.8rem", cursor: "pointer", textAlign: "left"
  }),

  uploadDropzone: {
    border: "2px dashed #cbd5e1", borderRadius: "10px", padding: "16px 12px",
    display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
    gap: "4px", background: "#f8fafc"
  },
  uploadBtn: {
    background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px",
    padding: "6px 12px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer", marginTop: "6px"
  },
  attachmentItem: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "8px 12px", background: "#f1f5f9", borderRadius: "8px", border: "1px solid #e2e8f0"
  },
  thumbImg: { width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover" },
  removeAttBtn: { background: "none", border: "none", color: "#ef4444", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" },

  btnPrimary: {
    background: "#0284c7", color: "#fff", border: "none", borderRadius: "8px",
    padding: "10px 18px", fontWeight: "750", fontSize: "0.9rem", cursor: "pointer",
    transition: "background 0.15s"
  },
  btnSecondary: {
    background: "#f1f5f9", color: "#1e293b", border: "1.5px solid #cbd5e1", borderRadius: "8px",
    padding: "10px 18px", fontWeight: "750", fontSize: "0.9rem", cursor: "pointer"
  },
  pillBtn: (active) => ({
    padding: "6px 12px", borderRadius: "100px", fontSize: "0.8rem", fontWeight: active ? "750" : "500",
    border: active ? "1.5px solid #0284c7" : "1.5px solid #cbd5e1",
    background: active ? "#0284c7" : "#fff", color: active ? "#fff" : "#334155",
    cursor: "pointer"
  }),

  errorText: { color: "#dc2626", fontSize: "0.8125rem", fontWeight: "600" },

  timerBanner: (hitlStatus) => {
    const isOver = hitlStatus === "OVERRIDDEN";
    const isApp = hitlStatus === "APPROVED";
    return {
      padding: "12px 16px", borderRadius: "10px", marginBottom: "14px",
      background: isApp ? "#dcfce7" : isOver ? "#ffedd5" : "#e0f2fe",
      border: isApp ? "1.5px solid #86efac" : isOver ? "1.5px solid #fdba74" : "1.5px solid #7dd3fc",
      color: isApp ? "#166534" : isOver ? "#c2410c" : "#0369a1"
    };
  },

  triageCategoryBanner: (cat) => {
    const isEmerg = cat === "EMERGENCY_ESCALATION";
    const isPhys = cat === "PHYSICAL_VISIT";
    return {
      padding: "16px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "14px",
      background: isEmerg ? "#fee2e2" : isPhys ? "#fef3c7" : "#ccfbf1",
      color: isEmerg ? "#991b1b" : isPhys ? "#92400e" : "#115e59",
      border: isEmerg ? "2px solid #ef4444" : isPhys ? "2px solid #f59e0b" : "2px solid #0d9488"
    };
  },
  specialistBox: {
    display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px",
    background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "10px", marginTop: "14px"
  },
  suspectedChip: {
    background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px",
    padding: "4px 8px", fontSize: "0.75rem", fontWeight: "700", color: "#334155"
  },
  reasoningCard: {
    background: "#f8fafc", border: "1px solid #e2e8f0", borderLeft: "4px solid #0284c7",
    padding: "12px", borderRadius: "6px", fontSize: "0.85rem", color: "#334155", lineHeight: "1.5"
  },

  // Doctors View
  doctorSearchBar: {
    display: "flex", gap: "12px", background: "#fff", padding: "14px", borderRadius: "12px",
    border: "1px solid #e2e8f0", marginBottom: "20px", boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
  },
  doctorCard: {
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px",
    display: "flex", gap: "16px", alignItems: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
  },
  doctorAvatar: {
    width: "64px", height: "64px", borderRadius: "50%", background: "#e0f2fe",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem"
  },
  doctorName: { fontSize: "1.05rem", fontWeight: "750", color: "#0f172a", margin: 0 },
  verifiedBadge: { fontSize: "0.7rem", fontWeight: "800", color: "#166534", background: "#dcfce7", padding: "2px 6px", borderRadius: "4px" },
  doctorSpecialty: { fontSize: "0.875rem", color: "#0284c7", fontWeight: "600", margin: "2px 0" },
  doctorMeta: { fontSize: "0.8125rem", color: "#64748b", display: "flex", gap: "14px" },

  // Labs Grid
  labsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" },
  labCard: {
    background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "20px",
    display: "flex", flexDirection: "column"
  },

  // Case Requests View
  caseCard: (cat) => ({
    background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0",
    borderLeft: cat === "EMERGENCY_ESCALATION" ? "5px solid #ef4444" : cat === "PHYSICAL_VISIT" ? "5px solid #f59e0b" : "5px solid #10b981",
    padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
  }),
  triageBadge: (cat) => ({
    fontSize: "0.75rem", fontWeight: "800", padding: "3px 8px", borderRadius: "100px",
    background: cat === "EMERGENCY_ESCALATION" ? "#fee2e2" : cat === "PHYSICAL_VISIT" ? "#fef9c3" : "#dcfce7",
    color: cat === "EMERGENCY_ESCALATION" ? "#b91c1c" : cat === "PHYSICAL_VISIT" ? "#854d0e" : "#15803d"
  }),
  hitlPill: (st) => ({
    fontSize: "0.75rem", fontWeight: "800", padding: "3px 8px", borderRadius: "100px",
    background: st === "APPROVED" ? "#dcfce7" : st === "OVERRIDDEN" ? "#ffedd5" : "#e0f2fe",
    color: st === "APPROVED" ? "#166534" : st === "OVERRIDDEN" ? "#c2410c" : "#0369a1"
  }),
  statusBadge: (st) => ({
    fontSize: "0.75rem", fontWeight: "800", padding: "3px 8px", borderRadius: "100px",
    background: st === "ACCEPTED" ? "#dbeafe" : st === "COMPLETED" ? "#dcfce7" : "#f1f5f9",
    color: st === "ACCEPTED" ? "#1e40af" : st === "COMPLETED" ? "#15803d" : "#475569"
  }),
  caseReasoningBox: {
    marginTop: "10px", padding: "8px 12px", background: "#f8fafc", borderRadius: "6px",
    fontSize: "0.8rem", color: "#334155"
  },
  assignedDocBox: {
    marginTop: "10px", borderTop: "1px solid #e2e8f0", paddingTop: "8px",
    display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem"
  },

  emptyState: { textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: "0.9rem" },

  // Modal
  modalOverlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(15, 23, 42, 0.65)", display: "flex", justifyContent: "center",
    alignItems: "center", zIndex: 100, padding: "16px"
  },
  modalContent: {
    background: "#fff", borderRadius: "18px", padding: "28px",
    width: "100%", maxWidth: "620px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
  },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  closeModalBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "#64748b" },
  formSection: {
    background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px",
    padding: "16px", marginBottom: "16px"
  },
  formSectionTitle: { fontSize: "0.95rem", fontWeight: "800", color: "#0f172a", margin: "0 0 12px 0" }
};