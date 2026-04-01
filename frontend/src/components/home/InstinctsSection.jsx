import React, { useState, useEffect } from "react";
import AnimatedSection from "../ui/AnimatedSection";

const instincts = [
  {
    icon: "✦",
    title: "Think before you type",
    quote: "If you're lost in coding, it's probably because you shouldn't be coding yet.",
    body: "Write your algorithm in plain English first. Code is just comments explained to a computer.",
  },
  {
    icon: "◈",
    title: "Computers are beautifully dumb",
    quote: "The hard part is learning to be as mind-numbingly stupid as a computer.",
    body: "A gaming rig and a shoe have the same IQ. Programming is explaining things precisely to something that understands nothing.",
  },
  {
    icon: "◎",
    title: "Failure is the curriculum",
    quote: "Embrace the failures. That's where the real learning lives.",
    body: "Every crash is not a setback — it's the next question your algorithm needs to answer.",
  },
  {
    icon: "⬡",
    title: "Only eight concepts exist",
    quote: "There are really about seven or eight concepts. Get those, and you're done.",
    body: "Variables, I/O, conditions, loops — every program ever written is just these ideas in different clothes.",
  },
];

export default function InstinctsSection() {
  const [activeInstinct, setActiveInstinct] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActiveInstinct((p) => (p + 1) % instincts.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <section style={{ padding: "100px 60px", maxWidth: 1100, margin: "0 auto" }}>
      <AnimatedSection>
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: "#4a4a6a", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500 }}>
            Core Instincts
          </span>
        </div>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 700,
          letterSpacing: "-0.02em", marginBottom: 16, lineHeight: 1.1,
        }}>
          What every programmer<br />
          <em style={{ fontStyle: "italic", color: "#9090a8" }}>needs to internalize</em>
        </h2>
        <p style={{ fontSize: 15, marginBottom: 60, color: "#5a5a78" }}>
          From Andy Harris's talk on thinking like a programmer — distilled into practice.
        </p>
      </AnimatedSection>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {instincts.map((ins, i) => (
          <AnimatedSection key={i} delay={i * 0.08}>
            <div
              onClick={() => setActiveInstinct(i)}
              style={{
                border: `1px solid ${activeInstinct === i ? "rgba(232,197,71,0.3)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 8, padding: 24, cursor: "pointer", transition: "all 0.3s",
                background: activeInstinct === i ? "rgba(232,197,71,0.05)" : "rgba(255,255,255,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 22, color: "#e8c547", lineHeight: 1 }}>{ins.icon}</span>
                <span style={{
                  fontSize: 11, color: "#4a4a6a", fontWeight: 500,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                }}>0{i + 1}</span>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12, lineHeight: 1.3 }}>
                {ins.title}
              </h3>
              <p style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: "italic", fontSize: 13, color: "#e8c547",
                lineHeight: 1.6, marginBottom: 12,
                borderLeft: "2px solid rgba(232,197,71,0.3)", paddingLeft: 12,
              }}>
                "{ins.quote}"
              </p>
              <p style={{ fontSize: 13, color: "#6060a0", lineHeight: 1.7 }}>{ins.body}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
