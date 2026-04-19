import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

/* ─────────────────────────── helpers ─────────────────────────── */
function getAvatarGradient(name = "") {
  const hue = (name.charCodeAt(0) || 65) * 5 % 360;
  return `linear-gradient(135deg, hsl(${hue},70%,55%), hsl(${(hue + 60) % 360},80%,45%))`;
}
function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
function fmtSeconds(s = 0) {
  if (!s) return "0m";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function relativeTime(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* Build a 52-week × 7-day heatmap grid */
function buildHeatmapGrid(heatmapData = []) {
  const byDate = {};
  heatmapData.forEach(({ date, count }) => {
    byDate[date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10)] = Number(count);
  });

  const today = new Date();
  const grid = []; // columns = weeks, rows = days
  const numWeeks = 52;

  // Start from (52 * 7) days ago, aligned to a Sunday
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - numWeeks * 7);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // align to Sunday

  let cursor = new Date(startDate);
  for (let w = 0; w < numWeeks; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const iso = cursor.toISOString().slice(0, 10);
      week.push({ date: iso, count: byDate[iso] || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    grid.push(week);
  }
  return grid;
}

function heatColor(count) {
  if (!count) return "rgba(255,255,255,0.05)";
  if (count === 1) return "rgba(232,197,71,0.25)";
  if (count === 2) return "rgba(232,197,71,0.50)";
  if (count === 3) return "rgba(232,197,71,0.75)";
  return "#e8c547";
}

/* ─────────────────────────── Animated counter ─────────────────────────── */
function AnimatedNumber({ target = 0, duration = 900 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setVal(Math.round(progress * target));
      if (progress < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [target, duration]);
  return <>{val}</>;
}

/* ═══════════════════════════ Main Component ═══════════════════════════ */
export default function StudentProfile() {
  const navigate = useNavigate();
  const { student: authStudent, loading: authLoading, refetch } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Bio edit state
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/student/profile-data`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) { navigate("/student/login"); return; }
        throw new Error("Failed to load profile");
      }
      const data = await res.json();
      setProfileData(data.data);
      setBioValue(data.data.student?.bio || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!authLoading) {
      if (!authStudent) { navigate("/student/login"); return; }
      fetchProfile();
    }
  }, [authLoading, authStudent, fetchProfile, navigate]);

  const saveBio = async () => {
    setSavingBio(true);
    try {
      const res = await fetch(`${API_BASE}/student/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: profileData.student.name, bio: bioValue }),
      });
      if (res.ok) {
        setEditingBio(false);
        fetchProfile();
        refetch();
      }
    } finally {
      setSavingBio(false);
    }
  };

  /* ── Loading states ── */
  if (authLoading || loading) {
    return (
      <div style={pageWrap}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <div style={{ textAlign: "center" }}>
            <div style={spinnerStyle} />
            <p style={{ color: "#9090a8", marginTop: 16, fontSize: 14 }}>Loading profile…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageWrap}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <div style={{ textAlign: "center", color: "#f87171" }}>
            <p style={{ fontSize: 48, margin: 0 }}>⚠️</p>
            <p>{error}</p>
            <button onClick={() => navigate("/")} style={backBtn}>Go Home</button>
          </div>
        </div>
      </div>
    );
  }

  const { student, stats, activity, heatmap } = profileData || {};
  const solved = stats?.problemsSolved || 0;
  const attempted = stats?.problemsAttempted || 0;
  const total = stats?.totalProblems || 0;
  const accuracy = total > 0 ? Math.round((solved / total) * 100) : 0;
  const totalThinking = stats?.totalThinkingTime || 0;
  const totalCoding = stats?.totalCodingTime || 0;
  const heatmapGrid = buildHeatmapGrid(heatmap || []);

  const joinDate = student?.createdAt
    ? new Date(student.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "Unknown";

  const providerColor = { google: "#4285F4", github: "#6e5494", local: "#e8c547" };

  return (
    <div style={pageWrap}>
      {/* ── Top bar ── */}
      <div style={topBar}>
        <button id="profile-back-btn" onClick={() => navigate(-1)} style={backBtn}>
          ← Back
        </button>
        <button id="profile-dashboard-btn" onClick={() => navigate("/student/dashboard")} style={{ ...backBtn, background: "rgba(232,197,71,0.1)", borderColor: "rgba(232,197,71,0.3)", color: "#e8c547" }}>
          Dashboard →
        </button>
      </div>

      <div style={gridWrap}>
        {/* ══════════ LEFT SIDEBAR ══════════ */}
        <aside style={sidebar}>
          {/* Avatar */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            {student?.profilePicture ? (
              <img src={student.profilePicture} alt={student.name}
                style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(232,197,71,0.4)" }} />
            ) : (
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                background: getAvatarGradient(student?.name || ""),
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, fontWeight: 700, color: "#fff",
                border: "3px solid rgba(232,197,71,0.3)",
                margin: "0 auto",
                boxShadow: "0 0 30px rgba(232,197,71,0.15)",
              }}>
                {getInitials(student?.name || "")}
              </div>
            )}
            <h1 style={{ margin: "14px 0 4px", fontSize: 20, fontWeight: 700, color: "#e8e8f0" }}>
              {student?.name}
            </h1>
            <p style={{ margin: 0, color: "#9090a8", fontSize: 13 }}>{student?.email}</p>

            {/* Provider badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              marginTop: 10, padding: "4px 12px",
              background: "rgba(255,255,255,0.05)", borderRadius: 999,
              border: `1px solid ${providerColor[student?.provider] || "#e8c547"}33`,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: providerColor[student?.provider] || "#e8c547" }} />
              <span style={{ fontSize: 11, color: "#9090a8", textTransform: "capitalize" }}>
                {student?.provider === "local" ? "Email" : student?.provider}
              </span>
            </div>
          </div>

          {/* Bio */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={label}>About</span>
              {!editingBio && (
                <button id="profile-edit-bio-btn" onClick={() => setEditingBio(true)} style={ghostSmallBtn}>
                  Edit
                </button>
              )}
            </div>
            {editingBio ? (
              <>
                <textarea
                  id="profile-bio-input"
                  value={bioValue}
                  onChange={(e) => setBioValue(e.target.value)}
                  maxLength={200}
                  rows={4}
                  placeholder="Tell us about yourself…"
                  style={{
                    width: "100%", padding: "10px", borderRadius: 6,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(232,197,71,0.4)",
                    color: "#e8e8f0", fontSize: 13, resize: "vertical",
                    fontFamily: "inherit", boxSizing: "border-box",
                    outline: "none",
                  }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button id="profile-save-bio-btn" onClick={saveBio} disabled={savingBio}
                    style={{ ...ghostSmallBtn, background: "rgba(232,197,71,0.15)", borderColor: "rgba(232,197,71,0.5)", color: "#e8c547" }}>
                    {savingBio ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => { setEditingBio(false); setBioValue(student?.bio || ""); }}
                    style={ghostSmallBtn}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <p style={{ color: student?.bio ? "#c0c0d8" : "#606080", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                {student?.bio || "No bio yet. Click Edit to add one."}
              </p>
            )}
          </div>

          {/* Meta info */}
          <div style={card}>
            <p style={label}>Joined</p>
            <p style={metaVal}>📅 {joinDate}</p>
            <p style={{ ...label, marginTop: 12 }}>Email Status</p>
            <p style={metaVal}>
              {student?.emailVerified
                ? <span style={{ color: "#4ade80" }}>✓ Verified</span>
                : <span style={{ color: "#f87171" }}>✗ Unverified</span>}
            </p>
          </div>
        </aside>

        {/* ══════════ MAIN CONTENT ══════════ */}
        <main style={{ minWidth: 0 }}>

          {/* ── Stats row ── */}
          <div style={statsGrid}>
            {[
              { label: "Problems Solved", value: solved, color: "#e8c547", suffix: "" },
              { label: "Total Attempts", value: total, color: "#64c8ff", suffix: "" },
              { label: "Accuracy", value: accuracy, color: "#4ade80", suffix: "%" },
              { label: "Thinking Time", value: Math.round(totalThinking / 60), color: "#c084fc", suffix: "m" },
            ].map((s) => (
              <div key={s.label} style={{ ...card, textAlign: "center", padding: "20px 14px" }}>
                <p style={{ ...label, marginBottom: 8 }}>{s.label}</p>
                <div style={{ fontSize: 36, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                  <AnimatedNumber target={s.value} />
                  <span style={{ fontSize: 20 }}>{s.suffix}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Progress bar ── */}
          <div style={{ ...card, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={sectionTitle}>Solving Progress</h2>
              <span style={{ color: "#9090a8", fontSize: 13 }}>
                {solved} / {total} solved
              </span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, height: 10, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${total ? Math.min((solved / total) * 100, 100) : 0}%`,
                background: "linear-gradient(90deg, #e8c547, #f0d060)",
                borderRadius: 8,
                transition: "width 1s ease",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
              <span style={{ color: "#9090a8", fontSize: 12 }}>{accuracy}% accuracy</span>
            </div>
          </div>

          {/* ── Activity Heatmap ── */}
          <div style={{ ...card, marginBottom: 20 }}>
            <h2 style={{ ...sectionTitle, marginBottom: 16 }}>Activity Heatmap</h2>
            <div style={{ overflowX: "auto", paddingBottom: 4 }}>
              <div style={{ display: "flex", gap: 3, minWidth: "max-content" }}>
                {heatmapGrid.map((week, wi) => (
                  <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {week.map((day) => (
                      <div
                        key={day.date}
                        title={`${day.date}: ${day.count} problem${day.count !== 1 ? "s" : ""}`}
                        style={{
                          width: 11, height: 11, borderRadius: 2,
                          background: heatColor(day.count),
                          transition: "transform 0.1s",
                          cursor: day.count > 0 ? "pointer" : "default",
                        }}
                        onMouseEnter={(e) => { if (day.count) e.currentTarget.style.transform = "scale(1.4)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            {/* Legend */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
              <span style={{ color: "#606080", fontSize: 11 }}>Less</span>
              {[0, 1, 2, 3, 4].map((n) => (
                <div key={n} style={{ width: 11, height: 11, borderRadius: 2, background: heatColor(n) }} />
              ))}
              <span style={{ color: "#606080", fontSize: 11 }}>More</span>
            </div>
          </div>

          {/* ── Recent Activity ── */}
          <div style={card}>
            <h2 style={{ ...sectionTitle, marginBottom: 16 }}>Recent Activity</h2>
            {(!activity || activity.length === 0) ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <p style={{ fontSize: 36 }}>🎯</p>
                <p style={{ color: "#9090a8", fontSize: 14, margin: 0 }}>No activity yet.</p>
                <button
                  id="profile-start-practice-btn"
                  onClick={() => navigate("/practice")}
                  style={{
                    marginTop: 16, padding: "10px 24px",
                    background: "rgba(232,197,71,0.15)",
                    border: "1px solid rgba(232,197,71,0.4)",
                    borderRadius: 8, color: "#e8c547",
                    fontSize: 13, cursor: "pointer", fontWeight: 600,
                  }}>
                  Start Practicing →
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {activity.map((item) => (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 8,
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.055)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: item.status === "solved"
                          ? "rgba(74,222,128,0.15)" : "rgba(251,191,36,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, flexShrink: 0,
                      }}>
                        {item.status === "solved" ? "✓" : "~"}
                      </div>
                      <div>
                        <p style={{ margin: 0, color: "#e8e8f0", fontSize: 13, fontWeight: 600 }}>
                          {item.questionTitle || "Unknown Problem"}
                        </p>
                        <p style={{ margin: "2px 0 0", color: "#606080", fontSize: 11 }}>
                          {item.questionDifficulty && (
                            <span style={{
                              color: item.questionDifficulty === "Easy" ? "#4ade80"
                                : item.questionDifficulty === "Medium" ? "#fbbf24" : "#f87171",
                              marginRight: 6,
                            }}>
                              {item.questionDifficulty}
                            </span>
                          )}
                          {fmtSeconds((item.thinkingTime || 0) + (item.codingTime || 0))} spent
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{
                        display: "inline-block", padding: "3px 10px",
                        borderRadius: 999, fontSize: 11, fontWeight: 600,
                        background: item.status === "solved"
                          ? "rgba(74,222,128,0.15)" : "rgba(251,191,36,0.15)",
                        color: item.status === "solved" ? "#4ade80" : "#fbbf24",
                        marginBottom: 4,
                      }}>
                        {item.status === "solved" ? "Solved" : "Attempted"}
                      </span>
                      <p style={{ margin: 0, color: "#606080", fontSize: 11 }}>
                        {relativeTime(item.attemptedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

/* ─────────────────────────── Styles ─────────────────────────── */
const pageWrap = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #080810 0%, #0f0f1e 60%, #1a1a2e 100%)",
  color: "#e8e8f0",
  fontFamily: "'Space Grotesk', 'Inter', sans-serif",
  padding: "0 0 60px",
};
const topBar = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "20px 40px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(8,8,16,0.6)", backdropFilter: "blur(10px)",
  position: "sticky", top: 0, zIndex: 50,
};
const backBtn = {
  padding: "8px 16px", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
  color: "#9090a8", fontSize: 13, cursor: "pointer", fontWeight: 500,
  transition: "all 0.2s",
};
const gridWrap = {
  display: "grid",
  gridTemplateColumns: "280px 1fr",
  gap: 24,
  maxWidth: 1100,
  margin: "32px auto 0",
  padding: "0 24px",
  alignItems: "start",
};
const sidebar = {
  display: "flex", flexDirection: "column", gap: 16,
  position: "sticky", top: 80,
};
const card = {
  background: "rgba(26,26,46,0.7)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 12,
  padding: 18,
  backdropFilter: "blur(12px)",
  marginBottom: 0,
};
const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 14,
  marginBottom: 20,
};
const label = {
  color: "#9090a8", fontSize: 11, fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.08em",
  margin: 0,
};
const metaVal = {
  color: "#c0c0d8", fontSize: 13, margin: "4px 0 0",
};
const sectionTitle = {
  color: "#e8e8f0", fontSize: 15, fontWeight: 700, margin: 0,
};
const ghostSmallBtn = {
  padding: "4px 12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 6, color: "#9090a8",
  fontSize: 12, cursor: "pointer", fontWeight: 500,
};
const spinnerStyle = {
  width: 36, height: 36, borderRadius: "50%",
  border: "3px solid rgba(232,197,71,0.2)",
  borderTopColor: "#e8c547",
  animation: "spin 0.7s linear infinite",
  margin: "0 auto",
};
