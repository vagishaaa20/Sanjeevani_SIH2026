import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function RequestHistoryPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const res = await fetch("/api/requests/my", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to retrieve history logs.");
        } else {
          setRequests(data.requests || []);
        }
      } catch (err) {
        setError("Network error fetching past consultations.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getFilteredRequests = () => {
    return requests.filter((req) => {
      // 1. Filter by tab status
      if (activeTab === "PENDING" && req.status !== "PENDING") return false;
      if (activeTab === "ACTIVE" && req.status !== "ACCEPTED") return false;
      if (activeTab === "COMPLETED" && req.status !== "COMPLETED") return false;

      // 2. Filter by search term
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const symptomMatch = req.symptoms.toLowerCase().includes(query);
        const reqMatch = req.requirement.toLowerCase().includes(query);
        const locMatch = req.location.toLowerCase().includes(query);
        const triMatch = req.triageCategory.toLowerCase().includes(query);
        return symptomMatch || reqMatch || locMatch || triMatch;
      }

      return true;
    });
  };

  const getTriageBadgeStyle = (category) => {
    switch (category) {
      case "EMERGENCY_ESCALATION":
        return { backgroundColor: "#fee2e2", color: "#991b1b", label: "Emergency" };
      case "PHYSICAL_VISIT":
        return { backgroundColor: "#fffbeb", color: "#92400e", label: "Physical Visit" };
      case "TELECONSULTATION":
      default:
        return { backgroundColor: "#e0f2fe", color: "#0369a1", label: "Teleconsult" };
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "ACCEPTED":
        return { backgroundColor: "#eff6ff", color: "#1d4ed8" };
      case "COMPLETED":
        return { backgroundColor: "#f0fdf4", color: "#166534" };
      case "CANCELLED":
        return { backgroundColor: "#fef2f2", color: "#991b1b" };
      case "PENDING":
      default:
        return { backgroundColor: "#f1f5f9", color: "#475569" };
    }
  };

  const filtered = getFilteredRequests();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>Your Consultation Logs</h1>
        <p style={styles.subtitle}>View your clinical request history, ongoing doctor responses, and download issued digital prescriptions.</p>
      </div>

      {/* Filters and search action bar */}
      <div style={styles.actionBar}>
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by symptoms, location, requirement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.tabsRow}>
          {["ALL", "PENDING", "ACTIVE", "COMPLETED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tabBtn,
                backgroundColor: activeTab === tab ? "#0d9488" : "transparent",
                color: activeTab === tab ? "#ffffff" : "#64748b",
                borderColor: activeTab === tab ? "#0d9488" : "#cbd5e1"
              }}
            >
              {tab === "ALL" && `All Cases (${requests.length})`}
              {tab === "PENDING" && `Pending (${requests.filter((r) => r.status === "PENDING").length})`}
              {tab === "ACTIVE" && `Active (${requests.filter((r) => r.status === "ACCEPTED").length})`}
              {tab === "COMPLETED" && `Completed (${requests.filter((r) => r.status === "COMPLETED").length})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={{ marginTop: "1rem", color: "#64748b" }}>Loading case history...</p>
        </div>
      ) : error ? (
        <div style={styles.alertError}>{error}</div>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyBox}>
          <span style={{ fontSize: "2.5rem" }}>📄</span>
          <h3>No Consultation Records Found</h3>
          <p style={{ color: "#64748b", maxWidth: "400px", margin: "0.25rem 0 1.25rem 0" }}>
            {requests.length === 0
              ? "You haven't submitted any clinical triage requests yet."
              : "No requests match your current filters or search term."}
          </p>
          {requests.length === 0 && (
            <button onClick={() => navigate("/patient/new-request")} style={styles.actionBtn}>
              Submit New Request
            </button>
          )}
        </div>
      ) : (
        <div style={styles.listGrid}>
          {filtered.map((req) => {
            const triage = getTriageBadgeStyle(req.triageCategory);
            const status = getStatusBadgeStyle(req.status);
            const formattedDate = new Date(req.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric"
            });

            return (
              <div key={req.id} style={styles.reqCard}>
                <div style={styles.cardHeader}>
                  <span style={styles.dateLabel}>📅 {formattedDate}</span>
                  <div style={styles.badgeGroup}>
                    <span style={{ ...styles.badge, backgroundColor: triage.backgroundColor, color: triage.color }}>
                      {triage.label}
                    </span>
                    <span style={{ ...styles.badge, backgroundColor: status.backgroundColor, color: status.color }}>
                      {req.status}
                    </span>
                  </div>
                </div>

                <h4 style={styles.symptomsPreview}>
                  {req.symptoms.length > 90 ? `${req.symptoms.slice(0, 95)}...` : req.symptoms}
                </h4>

                <div style={styles.metaRow}>
                  <div style={styles.metaCol}>
                    <span style={styles.metaLabel}>Location:</span>
                    <span style={styles.metaVal}>📍 {req.location}</span>
                  </div>
                  <div style={styles.metaCol}>
                    <span style={styles.metaLabel}>Requirement:</span>
                    <span style={styles.metaVal}>📋 {req.requirement}</span>
                  </div>
                </div>

                <div style={styles.cardFooter}>
                  {req.prescription ? (
                    <span style={styles.prescriptionRibbon}>💊 Digital Rx Attached</span>
                  ) : req.status === "ACCEPTED" ? (
                    <span style={styles.doctorActiveRibbon}>👨‍⚕️ Physician Consult Active</span>
                  ) : (
                    <span style={styles.infoRibbon}>⏳ Placed in Local Queue</span>
                  )}
                  <button
                    onClick={() => navigate(`/patient/request/${req.id}`)}
                    style={styles.detailBtn}
                  >
                    View Details →
                  </button>
                </div>
              </div>
            );
          })}
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
    fontWeight: "750",
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1.5rem",
    flexWrap: "wrap",
    marginBottom: "2rem"
  },
  searchBox: {
    position: "relative",
    flex: 1,
    minWidth: "280px"
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
  tabsRow: {
    display: "flex",
    gap: "0.5rem"
  },
  tabBtn: {
    padding: "0.6rem 1rem",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
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
  actionBtn: {
    padding: "0.65rem 1.25rem",
    backgroundColor: "#0d9488",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer"
  },
  listGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "1.25rem"
  },
  reqCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "1.5rem",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
    border: "1px solid #f1f5f9",
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "0.5rem"
  },
  dateLabel: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#64748b"
  },
  badgeGroup: {
    display: "flex",
    gap: "0.4rem"
  },
  badge: {
    padding: "0.25rem 0.65rem",
    borderRadius: "9999px",
    fontSize: "0.725rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.025em"
  },
  symptomsPreview: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: "600",
    color: "#1e293b",
    lineHeight: "1.5"
  },
  metaRow: {
    display: "flex",
    gap: "2rem",
    flexWrap: "wrap",
    borderTop: "1px solid #f8fafc",
    paddingTop: "0.75rem"
  },
  metaCol: {
    display: "flex",
    gap: "0.5rem",
    fontSize: "0.875rem"
  },
  metaLabel: {
    color: "#64748b",
    fontWeight: "500"
  },
  metaVal: {
    color: "#334155",
    fontWeight: "600"
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "1rem",
    marginTop: "0.25rem"
  },
  prescriptionRibbon: {
    fontSize: "0.825rem",
    color: "#166534",
    backgroundColor: "#dcfce7",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontWeight: "600"
  },
  doctorActiveRibbon: {
    fontSize: "0.825rem",
    color: "#1e40af",
    backgroundColor: "#eff6ff",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontWeight: "600"
  },
  infoRibbon: {
    fontSize: "0.825rem",
    color: "#475569",
    backgroundColor: "#f1f5f9",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontWeight: "600"
  },
  detailBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#0d9488",
    fontSize: "0.9rem",
    fontWeight: "700",
    cursor: "pointer",
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    transition: "transform 0.2s"
  }
};