import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function NewRequestPage() {
  const navigate = useNavigate();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customDetail, setCustomDetail] = useState("");
  const [location, setLocation] = useState("");
  const [requirement, setRequirement] = useState("General Doctor Consultation");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [triageResult, setTriageResult] = useState(null);

  const symptomOptions = [
    "Fever",
    "Cough",
    "Cold / Runny Nose",
    "Sore Throat",
    "Shortness of Breath",
    "Chest Pain",
    "Severe Headache",
    "Dizziness / Fainting",
    "Abdominal Pain / Nausea",
    "Diarrhea",
    "Muscle Aches / Fatigue",
    "Loss of Smell or Taste",
    "Skin Rash / Irritation"
  ];

  // Try to load region/location from user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      try {
        const res = await fetch("/api/profile/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.profile && data.profile.region) {
          setLocation(data.profile.region);
        }
      } catch (err) {
        console.error("Error loading patient profile location:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleSymptomToggle = (symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((item) => item !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setTriageResult(null);

    // Build symptoms string from checkboxes and text description
    const symptomsList = [
      ...selectedSymptoms,
      customDetail.trim() ? `Additional status details: ${customDetail.trim()}` : ""
    ].filter(Boolean).join(", ");

    if (!symptomsList.trim()) {
      setError("Please select at least one symptom or describe your symptoms below.");
      return;
    }

    if (!location.trim()) {
      setError("Please enter your current city or location.");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("accessToken");

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          symptoms: symptomsList,
          location: location.trim(),
          requirement: requirement
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit request.");
      } else {
        setSuccess("Clinical request successfully triaged!");
        setTriageResult(data.request);
        // Clear form
        setSelectedSymptoms([]);
        setCustomDetail("");
      }
    } catch (err) {
      setError("Network error submitting request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getTriageBannerStyle = (category) => {
    switch (category) {
      case "EMERGENCY_ESCALATION":
        return {
          background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
          border: "2px solid #ef4444",
          color: "#991b1b",
          icon: "🚨",
          badgeBg: "#ef4444",
          badgeText: "#ffffff"
        };
      case "PHYSICAL_VISIT":
        return {
          background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
          border: "2px solid #f59e0b",
          color: "#92400e",
          icon: "🏥",
          badgeBg: "#f59e0b",
          badgeText: "#ffffff"
        };
      case "TELECONSULTATION":
      default:
        return {
          background: "linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)",
          border: "2px solid #0d9488",
          color: "#115e59",
          icon: "💻",
          badgeBg: "#0d9488",
          badgeText: "#ffffff"
        };
    }
  };

  return (
    <div style={styles.container}>
      {/* Dynamic Embedded CSS */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .pulse-card {
          animation: pulse 2s infinite ease-in-out;
        }
      `}</style>

      <div style={styles.header}>
        <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>Submit Consultation & Triage Request</h1>
        <p style={styles.subtitle}>
          State your symptoms below. Our clinical database and AI engine will triage your symptoms to match you with appropriate medical pathways.
        </p>
      </div>

      <div style={styles.contentLayout}>
        {/* Form Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Symptom Triage Questionnaire</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            {error && <div style={styles.errorAlert}>{error}</div>}
            {success && <div style={styles.successAlert}>{success}</div>}

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Select All Present Symptoms</label>
              <div style={styles.checkboxGrid}>
                {symptomOptions.map((symptom) => {
                  const isChecked = selectedSymptoms.includes(symptom);
                  return (
                    <label
                      key={symptom}
                      style={{
                        ...styles.checkboxLabel,
                        backgroundColor: isChecked ? "#f0fdfa" : "#fff",
                        borderColor: isChecked ? "#0d9488" : "#e2e8f0"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleSymptomToggle(symptom)}
                        style={styles.checkboxInput}
                      />
                      <span style={{ color: isChecked ? "#0f766e" : "#334155", fontWeight: isChecked ? "600" : "400" }}>
                        {symptom}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label htmlFor="customDetail" style={styles.label}>Additional Details / Patient Notes</label>
              <textarea
                id="customDetail"
                value={customDetail}
                onChange={(e) => setCustomDetail(e.target.value)}
                placeholder="Briefly describe severity, onset time, or any additional context (e.g. 'Fever started yesterday, currently 101F. Cough feels dry.')"
                rows={3}
                style={styles.textarea}
              />
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.fieldGroup, flex: 1 }}>
                <label htmlFor="location" style={styles.label}>Your Current City / Region</label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Delhi, Mumbai, Bengaluru"
                  style={styles.input}
                  required
                />
              </div>

              <div style={{ ...styles.fieldGroup, flex: 1 }}>
                <label htmlFor="requirement" style={styles.label}>Primary Purpose / Requirement</label>
                <select
                  id="requirement"
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  style={styles.select}
                >
                  <option value="General Doctor Consultation">General Doctor Consultation</option>
                  <option value="Specialist Opinion">Specialist Opinion</option>
                  <option value="Prescription Refill">Prescription Refill</option>
                  <option value="Urgent Clinical Assessment">Urgent Clinical Assessment</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.submitBtn,
                backgroundColor: submitting ? "#94a3b8" : "#0d9488"
              }}
            >
              {submitting ? "Processing AI Clinical Triage..." : "Submit & Triage Symptom Record"}
            </button>
          </form>
        </div>

        {/* Live Triage Results Column (Conditional) */}
        {triageResult && (
          <div
            style={{
              ...styles.resultCard,
              ...(triageResult.triageCategory === "EMERGENCY_ESCALATION" ? { className: "pulse-card" } : {})
            }}
          >
            <div
              style={{
                ...styles.triageBanner,
                ...getTriageBannerStyle(triageResult.triageCategory)
              }}
            >
              <div style={styles.bannerHeader}>
                <span style={styles.bannerIcon}>{getTriageBannerStyle(triageResult.triageCategory).icon}</span>
                <h3 style={styles.bannerTitle}>Triage Outcome: {triageResult.triageCategory.replace("_", " ")}</h3>
              </div>
              <p style={styles.bannerText}>
                {triageResult.triageCategory === "EMERGENCY_ESCALATION" &&
                  "WARNING: Red flag symptoms detected. Immediate face-to-face emergency medical attention recommended."}
                {triageResult.triageCategory === "PHYSICAL_VISIT" &&
                  "RECOMMENDATION: A physical in-person hospital/clinic consultation is recommended for clinical assessment."}
                {triageResult.triageCategory === "TELECONSULTATION" &&
                  "RECOMMENDATION: Safe for online tele-consultation. A certified doctor can review your condition via chat/video."}
              </p>
            </div>

            <div style={styles.resultDetails}>
              <h4 style={styles.detailHeading}>Clinical Reasoning Analysis</h4>
              <p style={styles.reasoningText}>{triageResult.triageReasoning || "Triage completed based on matching clinical rules."}</p>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Ticket Reference ID:</span>
                <span style={styles.infoValue}>{triageResult.id}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Triage Status:</span>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: getTriageBannerStyle(triageResult.triageCategory).badgeBg,
                    color: getTriageBannerStyle(triageResult.triageCategory).badgeText
                  }}
                >
                  {triageResult.status}
                </span>
              </div>

              <div style={styles.actionBlock}>
                <button
                  onClick={() => navigate(`/patient/request/${triageResult.id}`)}
                  style={styles.actionBtn}
                >
                  Track Triage Case Status & Attending Doctor →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "2rem 1.5rem",
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: "#1e293b",
    backgroundColor: "#f8fafc",
    minHeight: "100vh"
  },
  header: {
    marginBottom: "2rem"
  },
  backBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#0d9488",
    fontSize: "0.95rem",
    fontWeight: "600",
    cursor: "pointer",
    padding: "0",
    marginBottom: "1rem",
    display: "inline-flex",
    alignItems: "center",
    transition: "color 0.2s"
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 0.5rem 0",
    letterSpacing: "-0.025em"
  },
  subtitle: {
    fontSize: "1.05rem",
    color: "#64748b",
    margin: 0,
    lineHeight: "1.5"
  },
  contentLayout: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem"
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "2rem",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
    border: "1px solid #f1f5f9"
  },
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 1.5rem 0"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  },
  errorAlert: {
    padding: "1rem",
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    borderRadius: "8px",
    border: "1px solid #fee2e2",
    fontSize: "0.9rem",
    fontWeight: "500"
  },
  successAlert: {
    padding: "1rem",
    backgroundColor: "#f0fdf4",
    color: "#166534",
    borderRadius: "8px",
    border: "1px solid #dcfce7",
    fontSize: "0.9rem",
    fontWeight: "500"
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#334155"
  },
  checkboxGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "0.75rem",
    marginTop: "0.5rem"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.85rem 1rem",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  checkboxInput: {
    width: "1.1rem",
    height: "1.1rem",
    accentColor: "#0d9488",
    cursor: "pointer"
  },
  textarea: {
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    outline: "none",
    resize: "vertical",
    transition: "border-color 0.2s",
    minHeight: "80px"
  },
  row: {
    display: "flex",
    gap: "1.5rem",
    flexWrap: "wrap"
  },
  input: {
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s"
  },
  select: {
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "0.95rem",
    backgroundColor: "#ffffff",
    outline: "none"
  },
  submitBtn: {
    padding: "1rem",
    borderRadius: "8px",
    border: "none",
    color: "#ffffff",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
    marginTop: "1rem"
  },
  resultCard: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    marginTop: "1rem"
  },
  triageBanner: {
    padding: "1.5rem 2rem"
  },
  bannerHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "0.75rem"
  },
  bannerIcon: {
    fontSize: "1.75rem"
  },
  bannerTitle: {
    fontSize: "1.25rem",
    fontWeight: "750",
    margin: 0
  },
  bannerText: {
    fontSize: "0.95rem",
    margin: 0,
    lineHeight: "1.5",
    fontWeight: "500"
  },
  resultDetails: {
    padding: "2rem"
  },
  detailHeading: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 0.75rem 0"
  },
  reasoningText: {
    fontSize: "0.95rem",
    color: "#475569",
    lineHeight: "1.6",
    backgroundColor: "#f8fafc",
    padding: "1rem",
    borderRadius: "8px",
    margin: "0 0 1.5rem 0",
    borderLeft: "4px solid #cbd5e1"
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.85rem 0",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "0.9rem"
  },
  infoLabel: {
    color: "#64748b",
    fontWeight: "500"
  },
  infoValue: {
    fontWeight: "600",
    color: "#334155"
  },
  statusBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: "700",
    textTransform: "uppercase"
  },
  actionBlock: {
    marginTop: "2rem",
    textAlign: "center"
  },
  actionBtn: {
    width: "100%",
    padding: "1rem",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "0.95rem",
    cursor: "pointer",
    transition: "background-color 0.2s"
  }
};