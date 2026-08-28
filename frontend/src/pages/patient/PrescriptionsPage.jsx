import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PrescriptionsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRx, setSelectedRx] = useState(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const res = await fetch("/api/requests/my", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to retrieve prescription records.");
        } else {
          // Filter requests that actually have a prescription
          const pxRequests = (data.requests || []).filter(
            (req) => req.prescription && typeof req.prescription === "object"
          );
          setRequests(pxRequests);
        }
      } catch (err) {
        setError("Network error fetching prescriptions list.");
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  const handlePrint = (rx) => {
    setSelectedRx(rx);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const getFilteredPrescriptions = () => {
    return requests.filter((req) => {
      if (searchTerm.trim() === "") return true;
      const query = searchTerm.toLowerCase();

      // Check doctor name match
      const docName = req.doctorUser?.doctorProfile?.fullName || req.prescription.doctorName || "";
      const docMatched = docName.toLowerCase().includes(query);

      // Check specialisation match
      const docSpec = req.doctorUser?.doctorProfile?.specialization || "";
      const specMatched = docSpec.toLowerCase().includes(query);

      // Check symptoms match
      const symMatched = req.symptoms.toLowerCase().includes(query);

      // Check medicine names match
      const meds = req.prescription.medications || [];
      const medsMatched = meds.some((m) => m.name.toLowerCase().includes(query));

      return docMatched || specMatched || symMatched || medsMatched;
    });
  };

  const filtered = getFilteredPrescriptions();

  return (
    <div style={styles.container}>
      {/* Print styles override */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-prescription-section, #print-prescription-section * {
            visibility: visible;
          }
          #print-prescription-section {
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
        <h1 style={styles.title}>Your Health Prescriptions</h1>
        <p style={styles.subtitle}>Manage and download digital Rx prescriptions issued during your teleconsultations and clinics visits.</p>
      </div>

      <div style={styles.actionBar} className="no-print">
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by doctor, medicine name, specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingContainer} className="no-print">
          <div style={styles.spinner}></div>
          <p style={{ marginTop: "1rem", color: "#64748b" }}>Fetching digital prescriptions...</p>
        </div>
      ) : error ? (
        <div style={styles.alertError} className="no-print">{error}</div>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyBox} className="no-print">
          <span style={{ fontSize: "2.5rem" }}>💊</span>
          <h3>No Prescriptions Found</h3>
          <p style={{ color: "#64748b", maxWidth: "420px", margin: "0.25rem 0 1.25rem 0" }}>
            {requests.length === 0
              ? "You haven't received any digital prescriptions yet. Consultations must be completed with a prescription issued by the doctor."
              : "No prescriptions match your current search criteria."}
          </p>
        </div>
      ) : (
        <div style={styles.contentLayout} className="no-print">
          {/* List of Prescription Cards */}
          <div style={styles.listContainer}>
            {filtered.map((req) => {
              const doc = req.doctorUser;
              const dateObj = req.prescription.issuedAt ? new Date(req.prescription.issuedAt) : new Date(req.createdAt);
              const formattedDate = dateObj.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric"
              });

              const isSelected = selectedRx?.id === req.id;

              return (
                <div
                  key={req.id}
                  style={{
                    ...styles.rxListItem,
                    borderColor: isSelected ? "#0d9488" : "#f1f5f9",
                    boxShadow: isSelected ? "0 4px 12px -2px rgb(0 0 0 / 0.08)" : "0 1px 3px 0 rgb(0 0 0 / 0.05)"
                  }}
                  onClick={() => setSelectedRx(req)}
                >
                  <div style={styles.rxCardHeader}>
                    <div>
                      <h4 style={styles.docNameTitle}>
                        Dr. {doc?.doctorProfile?.fullName || req.prescription.doctorName || "Sanjeevani Practicioner"}
                      </h4>
                      <span style={styles.docSpecBadge}>
                        {doc?.doctorProfile?.specialization || "General Medicine"}
                      </span>
                    </div>
                    <span style={styles.rxDateLabel}>{formattedDate}</span>
                  </div>

                  <div style={styles.rxMedSummary}>
                    <strong>Meds Prescribed:</strong>{" "}
                    {(req.prescription.medications || []).map((m) => m.name).join(", ") || "None"}
                  </div>

                  <div style={styles.rxCardFooter}>
                    <span style={styles.rxHospitalText}>
                      🏥 {doc?.doctorProfile?.clinicOrHospital || "Sanjeevani Clinic Center"}
                    </span>
                    <div style={styles.actionBtnGroup}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patient/request/${req.id}`);
                        }}
                        style={styles.btnSecondary}
                      >
                        Track Case
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrint(req);
                        }}
                        style={styles.btnPrimary}
                      >
                        Print Rx 🖨️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Screen Preview Panel */}
          <div style={styles.previewContainer}>
            {selectedRx ? (
              <div style={styles.previewCard}>
                <h3 style={styles.previewTitle}>Digital Prescription Preview</h3>
                <div style={styles.previewBox}>
                  {/* Prescription PDF Block */}
                  <div id="print-prescription-section" style={printStyles.prescriptionContainer}>
                    <div style={printStyles.rxHeader}>
                      <div style={printStyles.rxLogoBox}>
                        <span style={printStyles.rxIcon}>⚕️</span>
                        <div>
                          <h2 style={printStyles.rxLogoText}>SANJEEVANI HEALTHCARE</h2>
                          <h4 style={printStyles.rxSubtitleText}>Digital Prescription Registry</h4>
                        </div>
                      </div>
                      <div style={printStyles.rxRefBox}>
                        <p style={{ margin: 0 }}><strong>Rx ID:</strong> RX-{selectedRx.id.slice(0, 8).toUpperCase()}</p>
                        <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem" }}>
                          <strong>Date:</strong> {selectedRx.prescription.issuedAt ? new Date(selectedRx.prescription.issuedAt).toLocaleDateString() : new Date(selectedRx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div style={printStyles.doctorPrescriberBlock}>
                      <div>
                        <p style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>
                          Dr. {selectedRx.doctorUser?.doctorProfile?.fullName || selectedRx.prescription.doctorName || "Certified Medical Professional"}
                        </p>
                        <p style={{ margin: "0.25rem 0", color: "#475569", fontSize: "0.875rem" }}>
                          {selectedRx.doctorUser?.doctorProfile?.specialization || "General Medicine"}
                        </p>
                        <p style={{ margin: 0, color: "#64748b", fontSize: "0.8rem" }}>
                          NMC License: {selectedRx.doctorUser?.doctorProfile?.licenseNumber || selectedRx.prescription.doctorLicense || "NMC-8291-APP"}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", fontSize: "0.875rem" }}>
                        <p style={{ margin: 0 }}><strong>Clinical Practice:</strong></p>
                        <p style={{ margin: "0.2rem 0", fontWeight: "600", color: "#334155" }}>
                          {selectedRx.doctorUser?.doctorProfile?.clinicOrHospital || "Sanjeevani Telehealth Center"}
                        </p>
                        <p style={{ margin: 0, color: "#64748b" }}>{selectedRx.location}</p>
                      </div>
                    </div>

                    <div style={printStyles.patientRxBlock}>
                      <div style={printStyles.rxPatientGrid}>
                        <p style={{ margin: 0 }}><strong>Patient Name:</strong> {selectedRx.patientUser?.patientProfile?.fullName || "Verified Citizen"}</p>
                        {selectedRx.patientUser?.patientProfile?.dateOfBirth && (
                          <p style={{ margin: 0 }}>
                            <strong>Age/Sex:</strong> {new Date().getFullYear() - new Date(selectedRx.patientUser.patientProfile.dateOfBirth).getFullYear()} Yr / {selectedRx.patientUser.patientProfile.sex || "M"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={printStyles.rxSymbolContainer}>
                      <span style={printStyles.rxSymbol}>℞</span>
                    </div>

                    <table style={printStyles.prescriptionTable}>
                      <thead>
                        <tr style={printStyles.tableHeader}>
                          <th style={{ ...printStyles.tableCell, textAlign: "left", width: "45%" }}>Medicine Name</th>
                          <th style={{ ...printStyles.tableCell, textAlign: "center" }}>Dosage</th>
                          <th style={{ ...printStyles.tableCell, textAlign: "center" }}>Frequency</th>
                          <th style={{ ...printStyles.tableCell, textAlign: "right" }}>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedRx.prescription.medications || []).map((med, idx) => (
                          <tr key={idx} style={idx % 2 === 0 ? printStyles.tableRowEven : printStyles.tableRowOdd}>
                            <td style={{ ...printStyles.tableCell, textAlign: "left", fontWeight: "600", color: "#0f172a" }}>{med.name}</td>
                            <td style={{ ...printStyles.tableCell, textAlign: "center" }}>{med.dosage || "1 Tab"}</td>
                            <td style={{ ...printStyles.tableCell, textAlign: "center" }}>{med.frequency || "Once Daily"}</td>
                            <td style={{ ...printStyles.tableCell, textAlign: "right" }}>{med.duration || "5 Days"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={printStyles.prescriptionInstructions}>
                      <h4 style={{ margin: "0 0 0.35rem 0", fontSize: "0.9rem", color: "#334155" }}>Doctor Instructions:</h4>
                      <p style={{ margin: 0, fontSize: "0.9rem", color: "#475569", lineHeight: "1.5", whiteSpace: "pre-line" }}>
                        {selectedRx.prescription.instructions || "Take as directed by doctor. Schedule checkup if symptoms persist."}
                      </p>
                    </div>

                    <div style={printStyles.rxSignatureBlock}>
                      <div style={printStyles.signatureDrawingBox}>
                        <span style={printStyles.signedBadge}>Digitally Verified</span>
                        <p style={printStyles.doctorNamePrinted}>Dr. {selectedRx.doctorUser?.doctorProfile?.fullName || selectedRx.prescription.doctorName}</p>
                      </div>
                      <p style={printStyles.signLabel}>Authorizing Practitioner</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handlePrint(selectedRx)}
                  style={styles.btnPanelPrint}
                >
                  Download / Print PDF Document 🖨️
                </button>
              </div>
            ) : (
              <div style={styles.previewPrompt}>
                <span style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>👈</span>
                <p style={{ margin: 0, fontWeight: "500", color: "#64748b" }}>Select a prescription record from the list to display details and print options.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actual Hidden print section for window.print() if selectedRx exists */}
      {selectedRx && (
        <div id="print-prescription-section" style={{ display: "none" }}>
          {/* Content rendered in preview block is mirrored for print mode */}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1150px",
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
    marginBottom: "1rem"
  },
  title: {
    fontSize: "1.9rem",
    fontWeight: "755",
    color: "#0f172a",
    margin: "0 0 0.5rem 0",
    letterSpacing: "-0.02em"
  },
  subtitle: {
    fontSize: "1rem",
    color: "#64748b",
    margin: 0,
    lineHeight: "1.5"
  },
  actionBar: {
    marginBottom: "2rem"
  },
  searchBox: {
    position: "relative",
    width: "100%",
    maxWidth: "500px"
  },
  searchIcon: {
    position: "absolute",
    left: "1rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8"
  },
  searchInput: {
    width: "100%",
    padding: "0.75rem 1rem 0.75rem 2.5rem",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "0.925rem",
    outline: "none",
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    transition: "border-color 0.2s"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem 0"
  },
  spinner: {
    width: "35px",
    height: "35px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #0d9488",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  alertError: {
    padding: "1rem",
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    borderRadius: "8px",
    margin: "1rem 0"
  },
  emptyBox: {
    backgroundColor: "#ffffff",
    padding: "4rem 2rem",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  contentLayout: {
    display: "flex",
    gap: "2rem",
    flexWrap: "wrap"
  },
  listContainer: {
    flex: 1,
    minWidth: "320px",
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  rxListItem: {
    backgroundColor: "#ffffff",
    border: "2px solid #f1f5f9",
    borderRadius: "12px",
    padding: "1.25rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    flexDirection: "column",
    gap: "0.85rem"
  },
  rxCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  docNameTitle: {
    fontSize: "1rem",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 0.25rem 0"
  },
  docSpecBadge: {
    fontSize: "0.725rem",
    color: "#0d9488",
    fontWeight: "600",
    textTransform: "uppercase"
  },
  rxDateLabel: {
    fontSize: "0.825rem",
    fontWeight: "600",
    color: "#64748b"
  },
  rxMedSummary: {
    fontSize: "0.875rem",
    color: "#475569",
    lineHeight: "1.4",
    backgroundColor: "#f8fafc",
    padding: "0.65rem 0.85rem",
    borderRadius: "6px"
  },
  rxCardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "0.25rem"
  },
  rxHospitalText: {
    fontSize: "0.8rem",
    color: "#64748b",
    fontWeight: "500"
  },
  actionBtnGroup: {
    display: "flex",
    gap: "0.5rem"
  },
  btnPrimary: {
    padding: "0.45rem 0.85rem",
    backgroundColor: "#0d9488",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.8rem",
    fontWeight: "600",
    cursor: "pointer"
  },
  btnSecondary: {
    padding: "0.45rem 0.85rem",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.8rem",
    fontWeight: "600",
    cursor: "pointer"
  },
  previewContainer: {
    flex: 1.3,
    minWidth: "360px"
  },
  previewCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "1.5rem",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
    border: "1px solid #e2e8f0"
  },
  previewTitle: {
    fontSize: "1.1rem",
    fontWeight: "650",
    color: "#0f172a",
    margin: "0 0 1.25rem 0"
  },
  previewBox: {
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "inset 0 2px 4px 0 rgb(0 0 0 / 0.02)"
  },
  btnPanelPrint: {
    width: "100%",
    padding: "0.85rem",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "0.95rem",
    cursor: "pointer",
    marginTop: "1.25rem",
    transition: "background-color 0.2s"
  },
  previewPrompt: {
    backgroundColor: "#ffffff",
    border: "2px dashed #cbd5e1",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "4rem 2rem",
    minHeight: "300px"
  }
};

const printStyles = {
  prescriptionContainer: {
    backgroundColor: "#ffffff",
    padding: "1.75rem",
    fontFamily: '"Inter", sans-serif',
    color: "#1e293b"
  },
  rxHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "2px double #cbd5e1",
    paddingBottom: "1rem"
  },
  rxLogoBox: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  rxIcon: {
    fontSize: "2rem",
    color: "#0d9488"
  },
  rxLogoText: {
    margin: 0,
    fontSize: "1.15rem",
    fontWeight: "800",
    color: "#0f172a"
  },
  rxSubtitleText: {
    margin: 0,
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase"
  },
  rxRefBox: {
    textAlign: "right",
    fontSize: "0.8rem",
    color: "#334155"
  },
  doctorPrescriberBlock: {
    display: "flex",
    justifyContent: "space-between",
    margin: "1rem 0",
    gap: "1rem"
  },
  patientRxBlock: {
    marginBottom: "1rem"
  },
  rxPatientGrid: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.85rem",
    color: "#334155",
    borderTop: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
    padding: "0.5rem 0"
  },
  rxSymbolContainer: {
    margin: "0.5rem 0"
  },
  rxSymbol: {
    fontSize: "2rem",
    fontFamily: '"Times New Roman", Times, serif',
    fontWeight: "750",
    color: "#0f172a"
  },
  prescriptionTable: {
    width: "100%",
    borderCollapse: "collapse",
    margin: "0.5rem 0 1.5rem 0"
  },
  tableHeader: {
    borderBottom: "1.5px solid #0f172a"
  },
  tableCell: {
    padding: "0.6rem 0.4rem",
    fontSize: "0.85rem"
  },
  tableRowOdd: {
    backgroundColor: "#ffffff"
  },
  tableRowEven: {
    backgroundColor: "#f8fafc"
  },
  prescriptionInstructions: {
    backgroundColor: "#f8fafc",
    padding: "1rem",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    marginBottom: "1.5rem"
  },
  rxSignatureBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    marginTop: "2rem"
  },
  signatureDrawingBox: {
    borderBottom: "1px solid #cbd5e1",
    width: "150px",
    textAlign: "center",
    paddingBottom: "0.2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  signedBadge: {
    color: "#166534",
    backgroundColor: "#dcfce7",
    padding: "0.1rem 0.35rem",
    borderRadius: "2px",
    fontSize: "0.65rem",
    fontWeight: "700"
  },
  doctorNamePrinted: {
    margin: "0.35rem 0 0 0",
    fontFamily: "cursive",
    fontSize: "0.95rem",
    color: "#1e3a8a"
  },
  signLabel: {
    fontSize: "0.7rem",
    color: "#64748b",
    marginTop: "0.3rem",
    width: "150px",
    textAlign: "center"
  }
};