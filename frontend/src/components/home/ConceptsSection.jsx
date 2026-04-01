import React from "react";
import AnimatedSection from "../ui/AnimatedSection";

const concepts = [
  { label: "Variables", desc: "Name · Type · Value", icon: "x =" },
  { label: "Output", desc: "Tell the user something", icon: ">_" },
  { label: "Input", desc: "Listen to the user", icon: "←" },
  { label: "Conditions", desc: "If this, then that", icon: "?" },
  { label: "Loops", desc: "Sentry · Start · End · Change", icon: "↻" },
  { label: "Functions", desc: "Reusable named ideas", icon: "ƒ()" },
  { label: "Data structures", desc: "Organize information", icon: "[]" },
  { label: "Debugging", desc: "Understand before fixing", icon: "⊘" },
];

export default function ConceptsSection() {
  return (
    <section style={{
      padding: "80px 60px",
      background: "rgba(255,255,255,0.015)",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <AnimatedSection>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 32, marginBottom: 48 }}>
            <div>
              <span style={{ fontSize: 12, color: "#4a4a6a", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500 }}>
                The Framework
              </span>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 700,
                letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: 8,
              }}>
                Only 8 concepts.<br />
                <em style={{ fontStyle: "italic", color: "#4ecca3" }}>Every program, ever.</em>
              </h2>
            </div>
            <p style={{ maxWidth: 380, color: "#6060a0", fontSize: 14, lineHeight: 1.75 }}>
              "Your first language is hard. Your second is harder. By four or five,
              you see the patterns. These eight concepts are universal — and ThinkFirst
              builds them one at a time."
            </p>
          </div>
        </AnimatedSection>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {concepts.map((c, i) => (
            <AnimatedSection key={i} delay={i * 0.05}>
              <div style={{
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 8, padding: "20px 16px",
                background: "rgba(255,255,255,0.02)",
                transition: "all 0.2s",
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 18, color: "#e8c547", marginBottom: 10,
                }}>
                  {c.icon}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{c.label}</div>
                <div style={{ fontSize: 12, color: "#4a4a6a", lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
