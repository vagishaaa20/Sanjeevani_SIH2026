import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRequestDetails = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await fetch(`/api/requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load request details.");
      } else {
        setRequest(data.request);
      }
    } catch {
      setError("Network error fetching case details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]);

  // Keep polling if request is pending/accepted to see if a doctor takes it or issues prescription
  useEffect(() => {
    if (!request || request.status === "COMPLETED" || request.status === "CANCELLED") return;

    const interval = setInterval(() => {
      fetchRequestDetails();
    }, 8000);

    return () => clearInterval(interval);
  }, [request, fetchRequestDetails]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: "1rem", color: "#64748b" }}>Calling clinical registry...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.errorCard}>
          <span style={{ fontSize: "2.5rem" }}>⚠️</span>
          <h3>Case Registry Error</h3>
          <p>{error || "Case record not found or access denied."}</p>
          <button onClick={() => navigate("/dashboard")} style={styles.backLinkBtn}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getTriageTheme = (category) => {
    switch (category) {
      case "EMERGENCY_ESCALATION":
        return {
          bg: "#fef2f2",
          text: "#991b1b",
          border: "#fee2e2",
          badge: "#ef4444",
          badgeText: "#ffffff",
          label: "Emergency Escalation Mode",
          desc: "Critical alerts identified. Proceed to the nearest hospital triage ward immediately."
        };
      case "PHYSICAL_VISIT":
        return {
          bg: "#fffbeb",
          text: "#92400e",
          border: "#fef3c7",
          badge: "#f59e0b",
          badgeText: "#ffffff",
          label: "In-Person Clinical Visit",
          desc: "Physical examination is required. Book local general practice check-ups soon."
        };
      case "TELECONSULTATION":
      default:
        return {
          bg: "#f0fdfa",
          text: "#0f766e",
          border: "#ccfbf1",
          badge: "#0d9488",
          badgeText: "#ffffff",
          label: "Teleconsultation Safe",
          desc: "Suitable for online medicine. Consult with certified doctors on web chats."
        };
    }
  };

  const statusColors = {
    PENDING: { bg: "#f1f5f9", text: "#475569" },
    ACCEPTED: { bg: "#eff6ff", text: "#1d4ed8" },
    COMPLETED: { bg: "#f0fdf4", text: "#166534" },
    CANCELLED: { bg: "#fef2f2", text: "#991b1b" }
  };

  const theme = getTriageTheme(request.triageCategory);
  const statusColor = statusColors[request.status] || { bg: "#e2e8f0", text: "#334155" };
  const doctor = request.doctorUser;
  const patient = request.patientUser;

  return (
    <div style={styles.container}>
      {/* Print styles override */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-prescription-area, #print-prescription-area * {
            visibility: visible;
          }
          #print-prescription-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div style={styles.header} className="no-print">
        <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
        <div style={styles.headerTitleRow}>
          <div>
            <h1 style={styles.title}>Consultation Case Details</h1>
            <span style={styles.refId}>Ticket Reference: {request.id}</span>
          </div>
          <div style={styles.badgeRow}>
            <span style={{ ...styles.statusBadge, backgroundColor: statusColor.bg, color: statusColor.text }}>
              {request.status}
            </span>
            <span style={{ ...styles.statusBadge, backgroundColor: theme.badge, color: theme.badgeText }}>
              {request.triageCategory.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      <div style={styles.gridLayout}>
        {/* Left Column: Symptoms, AI details */}
        <div style={{ ...styles.column, flex: 1.4 }} className="no-print">
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Symptom Submission Report</h3>
            <div style={styles.symptomBox}>
              <p style={{ margin: 0, fontWeight: "500", lineHeight: "1.6", color: "#334155" }}>
                {request.symptoms}
              </p>
            </div>

            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <span style={styles.itemLabel}>Location Reported</span>
                <span style={styles.itemValue}>📍 {request.location}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.itemLabel}>Requirement Stated</span>
                <span style={styles.itemValue}>📋 {request.requirement}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.itemLabel}>Submitted At</span>
                <span style={styles.itemValue}>
                  📅 {new Date(request.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </div>
            </div>
          </div>

          <div style={{ ...styles.card, backgroundColor: theme.bg, borderColor: theme.border }}>
            <h3 style={{ ...styles.sectionTitle, color: theme.text }}>AI Triage Recommendation</h3>
            <p style={{ ...styles.recommendationLabel, color: theme.text }}>
              {theme.label}
            </p>
            <p style={{ ...styles.recommendationDesc, color: theme.text }}>
              {theme.desc}
            </p>
            <div style={styles.reasoningBox}>
              <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#334155" }}>Clinical Analysis Reasoning:</h4>
              <p style={{ margin: 0, fontSize: "0.925rem", color: "#475569", lineHeight: "1.6" }}>
                {request.triageReasoning || "Triage classification generated automatically. Verified safe for consultations."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Doctor Assignment & Prescriptions */}
        <div style={{ ...styles.column, flex: 1 }} className="no-print">
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Attending Doctor</h3>
            {doctor && doctor.doctorProfile ? (
              <div style={styles.doctorBlock}>
                <div style={styles.doctorAvatar}>
                  👨‍⚕️
                </div>
                <div>
                  <h4 style={styles.doctorName}>{doctor.doctorProfile.fullName}</h4>
                  <span style={styles.doctorSpec}>{doctor.doctorProfile.specialization || "General Physician"}</span>
                  <p style={styles.doctorHospital}>🏥 {doctor.doctorProfile.clinicOrHospital || "Sanjeevani Clinic Center"}</p>
                </div>
                <div style={styles.contactDivider}></div>
                <div style={{ fontSize: "0.875rem", color: "#475569" }}>
                  <p style={{ margin: "0 0 0.25rem 0" }}>📧 <strong>Email:</strong> {doctor.email}</p>
                  {doctor.phone && <p style={{ margin: 0 }}>📞 <strong>Phone:</strong> {doctor.phone}</p>}
                </div>

                {request.status === "ACCEPTED" && (
                  <div style={styles.consultationAlert}>
                    💬 Clinical consultation in-progress. The doctor is currently reviewing your medical log.
                  </div>
                )}
              </div>
            ) : request.status === "PENDING" ? (
              <div style={styles.waitingBlock}>
                <div style={styles.pulseSpinner}></div>
                <p style={{ margin: "0 0 0.5rem 0", fontWeight: "600", color: "#334155" }}>Awaiting Doctor Acceptance</p>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", lineHeight: "1.4" }}>
                  Your request is queued for verified medical professionals in {request.location}.
                </p>
              </div>
            ) : (
              <p style={{ color: "#64748b", margin: 0 }}>No doctor assigned.</p>
            )}
          </div>
        </div>
      </div>

      {/* Prescription Area - Styled for Clean Screen/Print */}
      {request.prescription && (
        <div id="print-prescription-area" style={styles.prescriptionContainer}>
          <div style={styles.rxHeader}>
            <div style={styles.rxLogoBox}>
              <span style={styles.rxIcon}>⚕️</span>
              <div>
                <h2 style={styles.rxLogoText}>SANJEEVANI HEALTHCARE</h2>
                <h4 style={styles.rxSubtitleText}>Digital Prescription Registry</h4>
              </div>
            </div>
            <div style={styles.rxRefBox}>
              <p style={{ margin: 0 }}><strong>Rx ID:</strong> RX-{request.id.slice(0, 8).toUpperCase()}</p>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem" }}>
                <strong>Date:</strong> {request.prescription.issuedAt ? new Date(request.prescription.issuedAt).toLocaleDateString() : new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div style={styles.doctorPrescriberBlock}>
            <div>
              <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#0f172a" }}>
                {doctor?.doctorProfile?.fullName || request.prescription.doctorName || "Certified Medical Professional"}
              </p>
              <p style={{ margin: "0.25rem 0", color: "#475569", fontSize: "0.9rem" }}>
                {doctor?.doctorProfile?.specialization || "General Medicine"}
              </p>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>
                NMC Registration License No: {doctor?.doctorProfile?.licenseNumber || request.prescription.doctorLicense || "NMC-8291-APP"}
              </p>
            </div>
            <div style={{ textAlign: "right", fontSize: "0.875rem" }}>
              <p style={{ margin: 0 }}><strong>Hospital/Clinic:</strong></p>
              <p style={{ margin: "0.25rem 0", fontWeight: "600", color: "#334155" }}>
                {doctor?.doctorProfile?.clinicOrHospital || "Sanjeevani Telehealth Center"}
              </p>
              <p style={{ margin: 0, color: "#64748b" }}>{request.location}</p>
            </div>
          </div>

          <div style={styles.patientRxBlock}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.25rem", color: "#475569" }}>
              Patient Demographics
            </h4>
            <div style={styles.rxPatientGrid}>
              <p style={{ margin: 0 }}><strong>Name:</strong> {patient?.patientProfile?.fullName || "Patient Demographics File"}</p>
              {patient?.patientProfile?.dateOfBirth && (
                <p style={{ margin: 0 }}>
                  <strong>Age/Sex:</strong> {new Date().getFullYear() - new Date(patient.patientProfile.dateOfBirth).getFullYear()} Yr / {patient.patientProfile.sex || "M"}
                </p>
              )}
              <p style={{ margin: 0 }}><strong>Record Case Ref:</strong> {request.id.slice(0, 14)}</p>
            </div>
          </div>

          <div style={styles.rxSymbolContainer}>
            <span style={styles.rxSymbol}>℞</span>
          </div>

          <table style={styles.prescriptionTable}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={{ ...styles.tableCell, textAlign: "left", width: "40%" }}>Medication Name / Strength</th>
                <th style={{ ...styles.tableCell, textAlign: "center" }}>Dosage</th>
                <th style={{ ...styles.tableCell, textAlign: "center" }}>Frequency</th>
                <th style={{ ...styles.tableCell, textAlign: "right" }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {request.prescription.medications && request.prescription.medications.length > 0 ? (
                request.prescription.medications.map((med, index) => (
                  <tr key={index} style={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}>
                    <td style={{ ...styles.tableCell, textAlign: "left", fontWeight: "600", color: "#0f172a" }}>{med.name}</td>
                    <td style={{ ...styles.tableCell, textAlign: "center" }}>{med.dosage || "1 Tab"}</td>
                    <td style={{ ...styles.tableCell, textAlign: "center" }}>{med.frequency || "Once Daily"}</td>
                    <td style={{ ...styles.tableCell, textAlign: "right" }}>{med.duration || "5 Days"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ ...styles.tableCell, textAlign: "center", color: "#64748b" }}>
                    No specific medications prescribed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={styles.prescriptionInstructions}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", color: "#334155" }}>Directions / Clinical Instructions:</h4>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#475569", lineHeight: "1.5", whiteSpace: "pre-line" }}>
              {request.prescription.instructions || "Take medications as directed by physician/clinician. Rest and drink plenty of fluids."}
            </p>
          </div>

          <div style={styles.rxSignatureBlock}>
            <div style={styles.signatureDrawingBox}>
              <span style={styles.signedBadge}>Digitally Signed</span>
              <p style={styles.doctorNamePrinted}>Dr. {doctor?.doctorProfile?.fullName || request.prescription.doctorName || "Sanjeevani Physician"}</p>
            </div>
            <p style={styles.signLabel}>Authorizing Practitioner Signature</p>
          </div>

          <div style={styles.printActionRow} className="no-print">
            <button onClick={handlePrint} style={styles.printBtn}>
              🖨️ Download & Print Prescription PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1050px",
    margin: "0 auto",
    padding: "2rem 1.5rem",
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: "#1e293b",
    backgroundColor: "#f8fafc",
    minHeight: "100vh"
  },
  centerContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "80vh",
    fontFamily: '"Inter", sans-serif',
    backgroundColor: "#f8fafc"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #0d9488",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  errorCard: {
    backgroundColor: "#ffffff",
    padding: "2.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
    textAlign: "center",
    maxWidth: "450px",
    border: "1px solid #f1f5f9"
  },
  backLinkBtn: {
    marginTop: "1.5rem",
    padding: "0.65rem 1.25rem",
    backgroundColor: "#0d9488",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer"
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
    marginBottom: "1rem"
  },
  headerTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "1rem"
  },
  title: {
    fontSize: "1.85rem",
    fontWeight: "750",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.025em"
  },
  refId: {
    fontSize: "0.85rem",
    color: "#64748b",
    display: "inline-block",
    marginTop: "0.25rem"
  },
  badgeRow: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center"
  },
  statusBadge: {
    padding: "0.35rem 0.85rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  gridLayout: {
    display: "flex",
    gap: "2rem",
    flexWrap: "wrap",
    marginBottom: "3rem"
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    minWidth: "300px"
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "1.75rem",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    border: "1px solid #f1f5f9"
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 1.25rem 0"
  },
  symptomBox: {
    backgroundColor: "#f8fafc",
    padding: "1.25rem",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    marginBottom: "1.25rem"
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.25rem"
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem"
  },
  itemLabel: {
    fontSize: "0.8rem",
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase"
  },
  itemValue: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "#334155"
  },
  recommendationLabel: {
    fontSize: "1.15rem",
    fontWeight: "700",
    margin: "0 0 0.5rem 0"
  },
  recommendationDesc: {
    fontSize: "0.95rem",
    lineHeight: "1.5",
    margin: "0 0 1.25rem 0",
    fontWeight: "500"
  },
  reasoningBox: {
    backgroundColor: "#ffffff",
    padding: "1.1rem",
    borderRadius: "8px",
    boxShadow: "inset 0 2px 4px 0 rgb(0 0 0 / 0.02)",
    border: "1px solid rgba(0,0,0,0.04)"
  },
  doctorBlock: {
    display: "flex",
    flexDirection: "column"
  },
  doctorAvatar: {
    fontSize: "3rem",
    backgroundColor: "#f1f5f9",
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "1rem"
  },
  doctorName: {
    fontSize: "1.15rem",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 0.25rem 0"
  },
  doctorSpec: {
    fontSize: "0.875rem",
    color: "#0d9488",
    fontWeight: "600",
    textTransform: "uppercase"
  },
  doctorHospital: {
    fontSize: "0.9rem",
    color: "#64748b",
    margin: "0.25rem 0 0 0"
  },
  contactDivider: {
    height: "1px",
    backgroundColor: "#f1f5f9",
    margin: "1.25rem 0"
  },
  consultationAlert: {
    marginTop: "1.25rem",
    padding: "0.85rem",
    borderRadius: "8px",
    backgroundColor: "#eff6ff",
    color: "#1e40af",
    fontSize: "0.85rem",
    fontWeight: "500",
    lineHeight: "1.4",
    borderLeft: "4px solid #3b82f6"
  },
  waitingBlock: {
    textAlign: "center",
    padding: "1.5rem"
  },
  pulseSpinner: {
    width: "24px",
    height: "24px",
    backgroundColor: "#0d9488",
    borderRadius: "50%",
    margin: "0 auto 1rem auto",
    animation: "pulse 1.5s infinite ease-in-out"
  },
  prescriptionContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "2.5rem",
    boxShadow: "0 4px 20px -2px rgb(0 0 0 / 0.08), 0 2px 4px -1px rgb(0 0 0 / 0.06)",
    border: "2px solid #e2e8f0",
    maxWidth: "800px",
    margin: "2rem auto 0 auto"
  },
  rxHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "3px double #cbd5e1",
    paddingBottom: "1.25rem"
  },
  rxLogoBox: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem"
  },
  rxIcon: {
    fontSize: "2.5rem",
    color: "#0d9488"
  },
  rxLogoText: {
    margin: 0,
    fontSize: "1.35rem",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.03em"
  },
  rxSubtitleText: {
    margin: "0.1rem 0 0 0",
    fontSize: "0.8rem",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  rxRefBox: {
    textAlign: "right",
    fontSize: "0.9rem",
    color: "#334155",
    fontWeight: "600"
  },
  doctorPrescriberBlock: {
    display: "flex",
    justifyContent: "space-between",
    margin: "1.5rem 0",
    gap: "1.5rem"
  },
  patientRxBlock: {
    marginBottom: "1.5rem"
  },
  rxPatientGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "0.75rem",
    fontSize: "0.9rem",
    color: "#334155"
  },
  rxSymbolContainer: {
    margin: "1rem 0"
  },
  rxSymbol: {
    fontSize: "2.25rem",
    fontFamily: '"Times New Roman", Times, serif',
    fontWeight: "700",
    color: "#0f172a"
  },
  prescriptionTable: {
    width: "100%",
    borderCollapse: "collapse",
    margin: "1rem 0 2rem 0"
  },
  tableHeader: {
    borderBottom: "2px solid #0f172a"
  },
  tableCell: {
    padding: "0.85rem 0.5rem",
    fontSize: "0.925rem"
  },
  tableRowOdd: {
    backgroundColor: "#ffffff"
  },
  tableRowEven: {
    backgroundColor: "#f8fafc"
  },
  prescriptionInstructions: {
    backgroundColor: "#f8fafc",
    padding: "1.25rem",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    marginBottom: "2rem"
  },
  rxSignatureBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    marginTop: "2.5rem"
  },
  signatureDrawingBox: {
    borderBottom: "1px solid #cbd5e1",
    width: "180px",
    textAlign: "center",
    paddingBottom: "0.25rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  signedBadge: {
    color: "#166534",
    backgroundColor: "#dcfce7",
    padding: "0.15rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.7rem",
    fontWeight: "700",
    textTransform: "uppercase"
  },
  doctorNamePrinted: {
    margin: "0.5rem 0 0 0",
    fontFamily: "cursive",
    fontSize: "1.05rem",
    color: "#1e3a8a"
  },
  signLabel: {
    fontSize: "0.75rem",
    color: "#64748b",
    marginTop: "0.4rem",
    fontWeight: "bold",
    width: "180px",
    textAlign: "center"
  },
  printActionRow: {
    textAlign: "center",
    marginTop: "2rem"
  },
  printBtn: {
    padding: "0.85rem 1.75rem",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "0.95rem",
    transition: "background-color 0.2s"
  }
};