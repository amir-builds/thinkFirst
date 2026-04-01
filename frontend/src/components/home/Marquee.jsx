import React from "react";

const items = [
  "Think First", "◆", "Algorithm Before Code", "◆",
  "8 Core Concepts", "◆", "Embrace Failure", "◆",
  "Plan In English", "◆", "No Syntax Until You're Ready", "◆",
  "Comments Are The Code", "◆", "Computers Are Dumb", "◆",
];

export default function Marquee() {
  return (
    <div style={{
      borderTop: "1px solid rgba(255,255,255,0.06)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      padding: "14px 0",
      overflow: "hidden",
    }}>
      <div style={{ overflow: "hidden", width: "100%" }}>
        <div style={{
          display: "flex", gap: 40, whiteSpace: "nowrap",
          animation: "marquee 20s linear infinite",
        }}>
          {[...items, ...items].map((item, i) => (
            <span
              key={i}
              style={{
                color: item === "◆" ? "#e8c547" : "#3a3a52",
                fontSize: 13, fontWeight: 500, letterSpacing: "0.1em",
                textTransform: "uppercase", flexShrink: 0,
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
