import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { useAuth } from "../../contexts/AuthContext";

const navLinks = ["Problems", "How it works"];

/** Generate a gradient avatar colour from the student's name */
function getAvatarGradient(name = "") {
  const hue = (name.charCodeAt(0) || 65) * 5 % 360;
  return `linear-gradient(135deg, hsl(${hue},70%,55%), hsl(${(hue + 60) % 360},80%,45%))`;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Navbar() {
  const navigate = useNavigate();
  const { student, loading, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNavClick = (label) => {
    if (label === "Problems") navigate("/practice");
    if (label === "How it works") {
      const el = document.getElementById("how-it-works");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "20px 60px", borderBottom: "1px solid rgba(255,255,255,0.06)",
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(8,8,16,0.85)", backdropFilter: "blur(12px)",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/")}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: "#e8c547", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#080810", fontFamily: "monospace" }}>TF</span>
        </div>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>
          ThinkFirst
        </span>
      </div>

      {/* Nav links */}
      <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
        {navLinks.map((label) => (
          <a
            key={label}
            onClick={() => handleNavClick(label)}
            style={{
              color: "#9090a8", fontSize: 14, fontWeight: 500, letterSpacing: "0.03em",
              cursor: "pointer", transition: "color 0.2s", textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.target.style.color = "#e8e8f0")}
            onMouseLeave={(e) => (e.target.style.color = "#9090a8")}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Auth section */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {!loading && student ? (
          /* ── Logged-in chip ── */
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              id="navbar-user-chip"
              onClick={() => setDropdownOpen((o) => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 999,
                padding: "6px 14px 6px 6px",
                cursor: "pointer",
                transition: "background 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.borderColor = "rgba(232,197,71,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              }}
            >
              {/* Avatar */}
              {student.profilePicture ? (
                <img
                  src={student.profilePicture}
                  alt={student.name}
                  style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: getAvatarGradient(student.name),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0,
                }}>
                  {getInitials(student.name)}
                </div>
              )}
              <span style={{ color: "#e8e8f0", fontSize: 13, fontWeight: 600, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {student.name.split(" ")[0]}
              </span>
              {/* Chevron */}
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{ transition: "transform 0.2s", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", color: "#9090a8" }}
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 10px)", right: 0,
                background: "rgba(18,18,32,0.98)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                backdropFilter: "blur(20px)",
                minWidth: 200,
                overflow: "hidden",
                animation: "dropdownFade 0.15s ease",
              }}>
                {/* Header */}
                <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ margin: 0, color: "#e8e8f0", fontSize: 14, fontWeight: 600 }}>{student.name}</p>
                  <p style={{ margin: "2px 0 0", color: "#9090a8", fontSize: 12 }}>{student.email}</p>
                </div>

                {/* Items */}
                {[
                  { label: "My Profile", icon: "👤", action: () => { setDropdownOpen(false); navigate("/student/profile"); } },
                  { label: "Dashboard", icon: "📊", action: () => { setDropdownOpen(false); navigate("/student/dashboard"); } },
                  { label: "Problems", icon: "⚡", action: () => { setDropdownOpen(false); navigate("/practice"); } },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "11px 16px",
                      background: "transparent", border: "none",
                      color: "#c0c0d8", fontSize: 13, fontWeight: 500,
                      cursor: "pointer", textAlign: "left",
                      transition: "background 0.15s, color 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#e8e8f0"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#c0c0d8"; }}
                  >
                    <span>{item.icon}</span> {item.label}
                  </button>
                ))}

                {/* Divider + Logout */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "11px 16px",
                      background: "transparent", border: "none",
                      color: "#f87171", fontSize: 13, fontWeight: 500,
                      cursor: "pointer", textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <span>🚪</span> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : !loading ? (
          /* ── Guest buttons ── */
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/student/login")}
              style={{ borderRadius: 999, padding: "10px 18px", minWidth: 92 }}
            >
              Login
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/student/register")}
              style={{ borderRadius: 999, padding: "10px 18px", minWidth: 110, boxShadow: "0 10px 30px rgba(232,197,71,0.18)" }}
            >
              Register
            </Button>
          </>
        ) : null}
      </div>

      <style>{`
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  );
}
