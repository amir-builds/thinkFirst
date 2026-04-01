import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";

const navLinks = ["Practice", "How it works", "Admin"];

export default function Navbar() {
  const navigate = useNavigate();

  const handleNavClick = (label) => {
    if (label === "Practice") navigate("/practice");
    else if (label === "Admin") navigate("/admin/login");
  };

  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "20px 60px", borderBottom: "1px solid rgba(255,255,255,0.06)",
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(8,8,16,0.85)", backdropFilter: "blur(12px)",
    }}>
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

      <div style={{ display: "flex", gap: 32 }}>
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

      <Button variant="primary" size="sm" onClick={() => navigate("/practice")}>
        Start Thinking →
      </Button>
    </nav>
  );
}
