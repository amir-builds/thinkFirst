import React from "react";

export default function CodeSnippet() {
  return (
    <div style={{
      maxWidth: 560,
      background: "#0d0d1a",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8,
      padding: "20px 24px",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      lineHeight: 1.8,
    }}>
      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        {["#e94560", "#e8c547", "#4ecca3"].map((c) => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
        ))}
        <span style={{ color: "#3a3a52", fontSize: 12, marginLeft: 8 }}>algorithm.txt</span>
      </div>
      <div style={{ color: "#4a4a6a" }}># Step 1: understand the problem in plain English</div>
      <div style={{ color: "#4a4a6a" }}># Step 2: make a variable for the user's name</div>
      <div style={{ color: "#4a4a6a" }}># Step 3: greet the user by name</div>
      <br />
      <div>
        <span style={{ color: "#e8c547" }}>name</span>
        {" = "}
        <span style={{ color: "#c084fc" }}>input</span>
        {"("}
        <span style={{ color: "#4ecca3" }}>"What's your name? "</span>
        {")"}
      </div>
      <div>
        <span style={{ color: "#c084fc" }}>print</span>
        {"("}
        <span style={{ color: "#4ecca3" }}>"Hello, "</span>
        {" + "}
        <span style={{ color: "#e8c547" }}>name</span>
        {")"}
      </div>
      <div style={{ marginTop: 12, color: "#4a4a6a", fontSize: 12 }}>
        ↑ Comments came first. Code just explains them to the machine.
      </div>
    </div>
  );
}
