import React from "react";
import AnimatedSection from "../ui/AnimatedSection";

const steps = [
  { num: "01", label: "Read the problem", sub: "Understand before you solve" },
  { num: "02", label: "Write it in English", sub: "Algorithm before syntax" },
  { num: "03", label: "Review your plan", sub: "AI mentor asks the hard questions" },
  { num: "04", label: "Unlock the editor", sub: "Now you're ready to code" },
  { num: "05", label: "Run & reflect", sub: "Failures become lessons" },
];

const mentorPills = ["Asks questions", "Never gives answers", "Highlights edge cases", "Guides reflection"];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" style={{ padding: "100px 60px", maxWidth: 1100, margin: "0 auto" }}>
      <AnimatedSection>
        <span style={{ fontSize: 12, color: "#4a4a6a", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500 }}>
          The Flow
        </span>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 700,
          letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: 8, marginBottom: 48,
        }}>
          The editor is <em style={{ color: "#e94560", fontStyle: "italic" }}>locked</em><br />
          until you've thought.
        </h2>
      </AnimatedSection>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        <div>
          {steps.map((s, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <div style={{
                display: "flex", gap: 20, alignItems: "flex-start", padding: "20px 0",
                borderBottom: i < steps.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, color: "#e8c547", fontWeight: 500,
                  letterSpacing: "0.1em", minWidth: 28, paddingTop: 2,
                }}>
                  {s.num}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 13, color: "#505070" }}>{s.sub}</div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.3}>
          <div style={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: 32,
            background: "rgba(255,255,255,0.02)",
          }}>
            <div style={{ marginBottom: 20 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "#4ecca3",
              }}>
                ThinkFirst Mentor AI
              </span>
            </div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 15, fontStyle: "italic",
              color: "#c0c0d8", lineHeight: 1.75, marginBottom: 24,
            }}>
              "Before we unlock the editor — what exactly do you think needs to happen
              when the input is empty? What should your algorithm do then?"
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {mentorPills.map((t) => (
                <span key={t} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 20, padding: "6px 14px", fontSize: 13, color: "#9090a8",
                }}>
                  {t}
                </span>
              ))}
            </div>
            <div style={{
              marginTop: 24, padding: "14px 16px",
              background: "rgba(78,204,163,0.06)", borderRadius: 8,
              border: "1px solid rgba(78,204,163,0.15)",
              fontSize: 13, color: "#4ecca3",
            }}>
              💡 AI supports reasoning — it never replaces it.
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
