import React from "react";
import { useNavigate } from "react-router-dom";

const footerLinks = ["Problems", "GitHub"];

export default function Footer() {
  const navigate = useNavigate();

  const handleClick = (label) => {
    if (label === "Problems") navigate("/practice");
  };

  return (
    <footer style={{
      borderTop: "1px solid rgba(255,255,255,0.06)",
      padding: "32px 60px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => navigate("/")}>
        <div style={{
          width: 20, height: 20, borderRadius: 4,
          background: "#e8c547", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#080810", fontFamily: "monospace" }}>TF</span>
        </div>
        <span style={{ fontSize: 13, color: "#4a4a6a" }}>ThinkFirst · MIT License</span>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        {footerLinks.map((label) => (
          <a
            key={label}
            onClick={() => handleClick(label)}
            style={{ fontSize: 13, color: "#4a4a6a", cursor: "pointer", textDecoration: "none" }}
          >
            {label}
          </a>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "#3a3a52" }}>
        Built with Node.js · React · Judge0
      </p>
    </footer>
  );
}
