import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function ReviewerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tabs: 'pending' | 'audited' | 'missed'
  const [activeTab, setActiveTab] = useState("pending");

  // HITL Triage Queue
  const [queue, setQueue] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, audited: 0, missed: 0 });
  const [queueLoading, setQueueLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [activeOverrideId, setActiveOverrideId] = useState(null);
  const [overrideForm, setOverrideForm] = useState({
    correctedCategory: "PHYSICAL_VISIT",
    correctedSpecialist: "General Physician",
    overrideReason: "",
    additionalGuidance: ""
  });

  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const res = await fetch(`/api/requests/hitl/queue?tab=${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setQueue(data.queue || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.error("Failed to load HITL queue:", err);
    } finally {
      setQueueLoading(false);
    }
  }, [activeTab]);

  const loadProfileAndData = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const pRes = await fetch("/api/profile/me", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      if (pRes.profile) {
        setProfile(pRes.profile);
      }
      await loadQueue();
    } catch (e) {
      console.error(e);
    }
  }, [loadQueue]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
    if (!stored || !token) { navigate("/login"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "hitl_reviewer" && u.role !== "admin") { navigate("/login"); return; }
    setUser(u);

    loadProfileAndData().finally(() => setLoading(false));

    // Auto-poll HITL queue every 6 seconds
    const interval = setInterval(loadQueue, 6000);
    return () => clearInterval(interval);
  }, [navigate, loadProfileAndData, loadQueue, activeTab]);

  const logout = () => { localStorage.clear(); navigate("/login"); };

  // ── Handle Approve AI Triage ──────────────────────────────────────────────
  const handleApproveTriage = async (requestId) => {
    setProcessingId(requestId);
    setFeedbackMsg("");
    setErrorMsg("");
    const token = localStorage.getItem("accessToken");

    try {
      const res = await fetch(`/api/requests/hitl/${requestId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to approve triage.");
      } else {
        setFeedbackMsg("✓ Case Approved & Validated! Automatically removed from pending queue.");
        await loadQueue();
        setTimeout(() => setFeedbackMsg(""), 4000);
      }
    } catch {
      setErrorMsg("Network error approving triage.");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Handle Override AI Triage ─────────────────────────────────────────────
  const handleOverrideTriage = async (e, requestId) => {
    e.preventDefault();
    if (!overrideForm.overrideReason.trim()) {
      setErrorMsg("Please specify the clinical override justification.");
      return;
    }

    setProcessingId(requestId);
    setFeedbackMsg("");
    setErrorMsg("");
    const token = localStorage.getItem("accessToken");

    try {
      const res = await fetch(`/api/requests/hitl/${requestId}/override`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          correctedCategory: overrideForm.correctedCategory,
          correctedSpecialist: overrideForm.correctedSpecialist,
          overrideReason: overrideForm.overrideReason.trim(),
          additionalGuidance: overrideForm.additionalGuidance.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to submit triage override.");
      } else {
        setFeedbackMsg("✓ Triage overridden and correction logged to model improvement dataset. Removed from pending queue.");
        setActiveOverrideId(null);
        setOverrideForm({
          correctedCategory: "PHYSICAL_VISIT",
          correctedSpecialist: "General Physician",
          overrideReason: "",
          additionalGuidance: ""
        });
        await loadQueue();
        setTimeout(() => setFeedbackMsg(""), 5000);
      }
    } catch {
      setErrorMsg("Network error submitting override.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ width: "40px", height: "40px", border: "4px solid #e2e8f0", borderTop: "4px solid #0ea5e9", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <p style={{ marginTop: "16px", color: "#64748b", fontWeight: "600" }}>Loading HITL Reviewer Portal…</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={st.page}>
      {/* ── Top Navigation ─────────────────────────────────────────────────── */}
      <nav style={st.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={st.navTitle}>🌿 Sanjeevani — HITL Clinical Reviewer Station</span>
          <span style={st.liveTag}>● LIVE AUDIT</span>
        </div>
        <div style={st.navRight}>
          <span style={st.navUser}>👨‍⚕️ {profile?.fullName || user?.email}</span>
          <button style={st.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </nav>

      {/* ── Main Container ─────────────────────────────────────────────────── */}
      <div style={st.body}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={st.greeting}>Human-In-The-Loop (HITL) Triage Audit Station</h1>
            <p style={st.sub}>
              Validate AI symptom classifications, review technical medical translations and uploaded evidence, or override paths to feed continuous model training.
            </p>
          </div>
          <button style={st.refreshBtn} onClick={loadQueue} disabled={queueLoading}>
            {queueLoading ? "Refreshing…" : "🔄 Refresh Queue"}
          </button>
        </div>

        {feedbackMsg && <div style={st.successBar}>{feedbackMsg}</div>}
        {errorMsg && <div style={st.errorBar}>{errorMsg}</div>}

        {/* ── Queue Status Summary ─────────────────────────────────────────── */}
        <div style={st.statsRow}>
          <div
            style={{ ...st.statCard, borderBottom: activeTab === "pending" ? "3px solid #0284c7" : "1px solid #e2e8f0", cursor: "pointer" }}
            onClick={() => setActiveTab("pending")}
          >
            <span style={st.statLabel}>Pending HITL Cases</span>
            <strong style={st.statNumber}>{counts.pending}</strong>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Active 15-min countdowns</span>
          </div>
          <div
            style={{ ...st.statCard, borderBottom: activeTab === "audited" ? "3px solid #16a34a" : "1px solid #e2e8f0", cursor: "pointer" }}
            onClick={() => setActiveTab("audited")}
          >
            <span style={st.statLabel}>Audited & Processed</span>
            <strong style={{ ...st.statNumber, color: "#16a34a" }}>{counts.audited}</strong>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Approved & Overridden</span>
          </div>
          <div
            style={{ ...st.statCard, borderBottom: activeTab === "missed" ? "3px solid #dc2626" : "1px solid #e2e8f0", cursor: "pointer" }}
            onClick={() => setActiveTab("missed")}
          >
            <span style={st.statLabel}>Expired / Missed (15m+)</span>
            <strong style={{ ...st.statNumber, color: "#dc2626" }}>{counts.missed}</strong>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Auto-teleconsult fallback</span>
          </div>
        </div>

        {/* ── Tabs Navigation ──────────────────────────────────────────────── */}
        <div style={st.tabBar}>
          <button
            style={st.tabBtn(activeTab === "pending")}
            onClick={() => setActiveTab("pending")}
          >
            📥 Active Pending Queue ({counts.pending})
          </button>
          <button
            style={st.tabBtn(activeTab === "audited")}
            onClick={() => setActiveTab("audited")}
          >
            ✓ Audited Cases History ({counts.audited})
          </button>
          <button
            style={st.tabBtn(activeTab === "missed")}
            onClick={() => setActiveTab("missed")}
          >
            ⏱️ Missed / Auto-Fallback ({counts.missed})
          </button>
        </div>

        {/* ── Cases List ───────────────────────────────────────────────────── */}
        {queue.length === 0 ? (
          <div style={st.emptyCard}>
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "10px" }}>
              {activeTab === "pending" ? "✨" : activeTab === "audited" ? "📋" : "⏱️"}
            </span>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "750", color: "#0f172a", margin: 0 }}>
              {activeTab === "pending"
                ? "No Pending Triage Cases!"
                : activeTab === "audited"
                ? "No Audited Cases Yet"
                : "No Missed Cases"}
            </h3>
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "6px 0 0" }}>
              {activeTab === "pending"
                ? "All patient requests have been audited. When a new case is submitted, it will appear here in real time."
                : "Audited cases will be archived here with clinical logs."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {queue.map((req) => {
              const p = req.patientUser?.patientProfile;
              const ai = req.triageAnalysis || req.originalAiAnalysis || {};
              const isOverriding = activeOverrideId === req.id;
              const isAudited = req.hitlStatus === "APPROVED" || req.hitlStatus === "OVERRIDDEN";

              return (
                <div key={req.id} style={st.caseCard(req.triageCategory)}>
                  {/* Header info */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "14px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                          {p?.fullName || "Patient Demographics"}
                        </h3>
                        <span style={st.patientBadge}>
                          {p?.sex || "N/A"} · {p?.dateOfBirth ? (new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()) + " yrs" : "Adult"}
                          {p?.bloodGroup ? ` · Blood: ${p.bloodGroup}` : ""}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                        📍 Location: <strong>{req.location}</strong> · Case ID: <code>{req.id.slice(0, 8)}</code> · Submitted: {new Date(req.createdAt).toLocaleTimeString()}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={st.triageCategoryPill(req.triageCategory)}>
                        {req.triageCategory?.replace(/_/g, " ")}
                      </span>
                      <span style={st.hitlStatusPill(req.hitlStatus)}>
                        HITL: {req.hitlStatus}
                      </span>
                    </div>
                  </div>

                  {/* Body Content Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
                    {/* Left: Reframed Medical Terminology, Symptoms, Photos */}
                    <div>
                      {/* LLM Technical Medical Reframe */}
                      {ai.technicalChiefComplaint && (
                        <div style={st.medicalReframeBox}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                            <span style={{ fontSize: "0.9rem" }}>🧠</span>
                            <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#0369a1", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                              TECHNICAL CLINICAL REFRAME (CC & HPI)
                            </span>
                          </div>
                          <p style={{ margin: "0 0 6px 0", color: "#0c4a6e", fontWeight: "750", fontSize: "0.925rem", lineHeight: "1.5" }}>
                            {ai.technicalChiefComplaint}
                          </p>
                          {ai.technicalHpi && (
                            <p style={{ margin: 0, color: "#334155", fontSize: "0.825rem", lineHeight: "1.5" }}>
                              {ai.technicalHpi}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Highlighted Clinical Keywords */}
                      {ai.clinicalKeywords && ai.clinicalKeywords.length > 0 && (
                        <div style={{ marginTop: "10px" }}>
                          <span style={st.subLabel}>Extracted High-Yield Clinical Keywords:</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                            {ai.clinicalKeywords.map((kw, kwIdx) => (
                              <span key={kwIdx} style={st.keywordTag}>
                                🏷️ {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Original Patient Input */}
                      <div style={{ ...st.infoBox, marginTop: "12px" }}>
                        <div style={st.fieldLabel}>ORIGINAL PATIENT INPUT</div>
                        <p style={{ margin: "4px 0 0", color: "#475569", fontSize: "0.85rem", fontStyle: "italic", lineHeight: "1.4" }}>
                          "{req.symptoms}"
                        </p>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                        <div style={st.miniBox}>
                          <span style={st.subLabel}>Duration:</span> <strong>{req.duration || "2-3 Days"}</strong>
                        </div>
                        <div style={st.miniBox}>
                          <span style={st.subLabel}>Pain Scale:</span> <strong style={{ color: req.painLevel >= 7 ? "#dc2626" : "#0f172a" }}>{req.painLevel || 3} / 10</strong>
                        </div>
                        <div style={st.miniBox}>
                          <span style={st.subLabel}>Body Area:</span> <strong>{req.affectedArea || "General"}</strong>
                        </div>
                        <div style={st.miniBox}>
                          <span style={st.subLabel}>Conditions:</span> <strong>{p?.medicalConditions?.join(", ") || "None"}</strong>
                        </div>
                      </div>

                      {/* Attached Photos of Affected Area & Prescriptions */}
                      {req.attachments && req.attachments.length > 0 && (
                        <div style={{ marginTop: "14px" }}>
                          <div style={st.fieldLabel}>UPLOADED VISUAL & REPORT ATTACHMENTS ({req.attachments.length})</div>
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "6px" }}>
                            {req.attachments.map((att, attIdx) => (
                              <div key={attIdx} style={st.attPreview}>
                                {att.mimetype?.includes("image") ? (
                                  <a href={att.url} target="_blank" rel="noreferrer">
                                    <img src={att.url} alt="affected-area" style={st.attImg} />
                                  </a>
                                ) : (
                                  <div style={{ fontSize: "2rem", textAlign: "center", padding: "10px" }}>📄</div>
                                )}
                                <div style={{ fontSize: "0.725rem", fontWeight: "600", color: "#334155", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {att.filename}
                                </div>
                                <a href={att.url} target="_blank" rel="noreferrer" style={{ fontSize: "0.7rem", color: "#0ea5e9", textDecoration: "underline" }}>
                                  View Full File ↗
                                </a>
                              </div>
                            ))}
                          </div>
                          {ai.attachmentFindings && (
                            <div style={{ fontSize: "0.775rem", color: "#0369a1", marginTop: "6px", background: "#f0f9ff", padding: "6px 10px", borderRadius: "6px" }}>
                              🔍 <strong>AI Attachment Analysis:</strong> {ai.attachmentFindings}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: AI Suggestion & Reviewer Decision */}
                    <div style={st.aiDecisionCard}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "1.25rem" }}>🤖</span>
                        <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>AI Clinical Recommendation</strong>
                      </div>

                      <div style={{ fontSize: "0.85rem", color: "#334155", marginBottom: "6px" }}>
                        <strong>Suggested Specialist:</strong> <span style={{ color: "#0ea5e9", fontWeight: "750" }}>{ai.recommendedSpecialization || "General Physician"}</span>
                      </div>

                      <div style={st.reasoningBubble}>
                        <strong>Clinical Reasoning:</strong> {req.triageReasoning || ai.clinicalReasoning}
                      </div>

                      {/* Suspected Indications */}
                      {ai.suspectedConditions && ai.suspectedConditions.length > 0 && (
                        <div style={{ marginTop: "8px" }}>
                          <span style={st.subLabel}>Suspected Indications:</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "2px" }}>
                            {ai.suspectedConditions.map((c, cIdx) => (
                              <span key={cIdx} style={{ fontSize: "0.75rem", background: "#fff", padding: "2px 8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}>
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Review Actions: Only visible on pending cases */}
                      {!isAudited ? (
                        !isOverriding ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
                            <button
                              type="button"
                              style={st.btnApprove}
                              onClick={() => handleApproveTriage(req.id)}
                              disabled={processingId === req.id}
                            >
                              {processingId === req.id ? "Processing…" : "✓ Accept & Validate AI Recommendation"}
                            </button>
                            <button
                              type="button"
                              style={st.btnOverride}
                              onClick={() => {
                                setActiveOverrideId(req.id);
                                setOverrideForm({
                                  correctedCategory: req.triageCategory === "TELECONSULTATION" ? "PHYSICAL_VISIT" : "TELECONSULTATION",
                                  correctedSpecialist: ai.recommendedSpecialization || "General Physician",
                                  overrideReason: "",
                                  additionalGuidance: ""
                                });
                              }}
                            >
                              ⚠️ Override / Modify Triage Path
                            </button>
                          </div>
                        ) : (
                          <form onSubmit={(e) => handleOverrideTriage(e, req.id)} style={st.overrideForm}>
                            <h4 style={{ fontSize: "0.875rem", fontWeight: "800", color: "#b45309", margin: "0 0 8px" }}>
                              Clinical Triage Override
                            </h4>

                            <label style={st.subLabel}>New Triage Classification *</label>
                            <select
                              style={st.select}
                              value={overrideForm.correctedCategory}
                              onChange={(e) => setOverrideForm({ ...overrideForm, correctedCategory: e.target.value })}
                            >
                              <option value="TELECONSULTATION">TELECONSULTATION (Mild / Digital Safe)</option>
                              <option value="PHYSICAL_VISIT">PHYSICAL VISIT (Requires In-Person Exam)</option>
                              <option value="EMERGENCY_ESCALATION">EMERGENCY ESCALATION (Critical / Immediate)</option>
                            </select>

                            <label style={{ ...st.subLabel, marginTop: "8px" }}>Recommended Specialist</label>
                            <select
                              style={st.select}
                              value={overrideForm.correctedSpecialist}
                              onChange={(e) => setOverrideForm({ ...overrideForm, correctedSpecialist: e.target.value })}
                            >
                              <option value="General Physician">General Physician</option>
                              <option value="Dermatologist">Dermatologist</option>
                              <option value="Cardiologist">Cardiologist</option>
                              <option value="Pulmonologist">Pulmonologist</option>
                              <option value="Orthopedic">Orthopedic Surgeon</option>
                              <option value="Gastroenterologist">Gastroenterologist</option>
                              <option value="ENT">ENT Specialist</option>
                              <option value="Neurologist">Neurologist</option>
                              <option value="Pediatrician">Pediatrician</option>
                              <option value="Gynecologist">Gynecologist</option>
                            </select>

                            <label style={{ ...st.subLabel, marginTop: "8px" }}>Clinical Override Reason (Saved for Model Retraining) *</label>
                            <textarea
                              rows={3}
                              style={st.textarea}
                              placeholder="Explain why the AI classification was incorrect or why this path was chosen..."
                              value={overrideForm.overrideReason}
                              onChange={(e) => setOverrideForm({ ...overrideForm, overrideReason: e.target.value })}
                              required
                            />

                            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                              <button type="submit" style={st.btnSaveOverride} disabled={processingId === req.id}>
                                {processingId === req.id ? "Saving…" : "Save Override & Feed to Model"}
                              </button>
                              <button type="button" style={st.btnCancel} onClick={() => setActiveOverrideId(null)}>
                                Cancel
                              </button>
                            </div>
                          </form>
                        )
                      ) : (
                        <div style={{ marginTop: "14px", background: "#fff", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                          <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#166534" }}>
                            ✓ Case Audited by {req.hitlReviewerName || "Reviewer"}
                          </div>
                          {req.hitlOverrideNotes && (
                            <div style={{ fontSize: "0.775rem", color: "#64748b", marginTop: "4px" }}>
                              <strong>Audit Note:</strong> {req.hitlOverrideNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const st = {
  page: { minHeight: "100vh", background: "#f1f5f9", fontFamily: "system-ui, -apple-system, sans-serif" },
  nav: {
    background: "#0f172a", padding: "0 24px", height: "64px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    borderBottom: "1px solid #334155"
  },
  navTitle: { fontWeight: "800", fontSize: "1.15rem", color: "#f8fafc" },
  liveTag: { fontSize: "0.7rem", fontWeight: "800", color: "#4ade80", background: "rgba(34, 197, 94, 0.2)", padding: "3px 8px", borderRadius: "100px" },
  navRight: { display: "flex", alignItems: "center", gap: "16px" },
  navUser: { fontSize: "0.875rem", color: "#93c5fd", fontWeight: "600" },
  logoutBtn: {
    background: "none", border: "1.5px solid #475569", borderRadius: "8px",
    padding: "6px 12px", cursor: "pointer", fontSize: "0.85rem", color: "#cbd5e1", fontWeight: "600"
  },

  body: { maxWidth: "1200px", margin: "30px auto 60px", padding: "0 24px" },
  greeting: { fontSize: "1.6rem", fontWeight: "850", color: "#0f172a", margin: 0, letterSpacing: "-0.02em" },
  sub: { fontSize: "0.9rem", color: "#64748b", margin: "6px 0 0", maxWidth: "800px", lineHeight: "1.5" },
  refreshBtn: {
    background: "#fff", border: "1px solid #cbd5e1", padding: "8px 16px", borderRadius: "8px",
    fontSize: "0.85rem", fontWeight: "700", cursor: "pointer", color: "#334155"
  },

  successBar: { background: "#dcfce7", color: "#15803d", padding: "12px 18px", borderRadius: "10px", fontSize: "0.9rem", fontWeight: "700", marginBottom: "16px" },
  errorBar: { background: "#fee2e2", color: "#b91c1c", padding: "12px 18px", borderRadius: "10px", fontSize: "0.9rem", fontWeight: "700", marginBottom: "16px" },

  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" },
  statCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "4px" },
  statLabel: { fontSize: "0.8rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase" },
  statNumber: { fontSize: "1.6rem", fontWeight: "850", color: "#0f172a" },

  tabBar: { display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", marginBottom: "20px" },
  tabBtn: (active) => ({
    padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
    fontSize: "0.9rem", fontWeight: active ? "800" : "600", color: active ? "#0284c7" : "#64748b",
    borderBottom: active ? "3px solid #0284c7" : "3px solid transparent", marginBottom: "-2px"
  }),

  emptyCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "48px 24px", textAlign: "center" },

  caseCard: (cat) => ({
    background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0",
    borderLeft: cat === "EMERGENCY_ESCALATION" ? "6px solid #ef4444" : cat === "PHYSICAL_VISIT" ? "6px solid #f59e0b" : "6px solid #10b981",
    padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
  }),

  patientBadge: { fontSize: "0.75rem", fontWeight: "700", background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "6px" },
  triageCategoryPill: (cat) => ({
    fontSize: "0.75rem", fontWeight: "800", padding: "4px 10px", borderRadius: "100px",
    background: cat === "EMERGENCY_ESCALATION" ? "#fee2e2" : cat === "PHYSICAL_VISIT" ? "#fef3c7" : "#dcfce7",
    color: cat === "EMERGENCY_ESCALATION" ? "#b91c1c" : cat === "PHYSICAL_VISIT" ? "#854d0e" : "#15803d",
    border: cat === "EMERGENCY_ESCALATION" ? "1px solid #fecaca" : cat === "PHYSICAL_VISIT" ? "1px solid #fde68a" : "1px solid #bbf7d0"
  }),
  hitlStatusPill: (st) => ({
    fontSize: "0.75rem", fontWeight: "800", padding: "4px 10px", borderRadius: "100px",
    background: st === "APPROVED" ? "#dcfce7" : st === "OVERRIDDEN" ? "#ffedd5" : st === "TIMEOUT_FALLBACK" ? "#fee2e2" : "#e0f2fe",
    color: st === "APPROVED" ? "#166534" : st === "OVERRIDDEN" ? "#c2410c" : st === "TIMEOUT_FALLBACK" ? "#991b1b" : "#0369a1"
  }),

  medicalReframeBox: {
    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", border: "1.5px solid #bae6fd",
    padding: "14px", borderRadius: "12px", marginBottom: "10px"
  },
  keywordTag: {
    fontSize: "0.75rem", fontWeight: "750", background: "#eff6ff", color: "#1d4ed8",
    padding: "3px 8px", borderRadius: "6px", border: "1px solid #bfdbfe"
  },

  infoBox: { background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px 12px", borderRadius: "10px" },
  fieldLabel: { fontSize: "0.75rem", fontWeight: "800", color: "#64748b", letterSpacing: "0.03em" },
  subLabel: { fontSize: "0.75rem", color: "#64748b", fontWeight: "700", display: "block", marginBottom: "2px" },
  miniBox: { background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px 12px", borderRadius: "8px", fontSize: "0.85rem" },

  attPreview: { border: "1px solid #e2e8f0", borderRadius: "8px", padding: "6px", background: "#fff", width: "120px" },
  attImg: { width: "100%", height: "80px", objectFit: "cover", borderRadius: "6px" },

  aiDecisionCard: {
    background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "16px"
  },
  reasoningBubble: {
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px",
    padding: "10px 12px", fontSize: "0.825rem", color: "#475569", lineHeight: "1.5"
  },

  btnApprove: {
    background: "#16a34a", color: "#fff", border: "none", borderRadius: "8px",
    padding: "10px 16px", fontSize: "0.875rem", fontWeight: "750", cursor: "pointer"
  },
  btnOverride: {
    background: "#f59e0b", color: "#fff", border: "none", borderRadius: "8px",
    padding: "10px 16px", fontSize: "0.875rem", fontWeight: "750", cursor: "pointer"
  },

  overrideForm: {
    background: "#fff", border: "1.5px solid #fde68a", borderRadius: "10px",
    padding: "14px", marginTop: "12px"
  },
  select: { width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.85rem", background: "#fff", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.85rem", fontFamily: "inherit", boxSizing: "border-box" },
  btnSaveOverride: { background: "#d97706", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 14px", fontWeight: "750", fontSize: "0.825rem", cursor: "pointer" },
  btnCancel: { background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px 14px", fontWeight: "600", fontSize: "0.825rem", cursor: "pointer" }
};
