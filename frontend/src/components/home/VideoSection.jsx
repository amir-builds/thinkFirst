import React from "react";
import AnimatedSection from "../ui/AnimatedSection";

const videoHighlights = [
  { icon: "✦", text: "Algorithms before code — always" },
  { icon: "◈", text: "Computers understand nothing; you must be precise" },
  { icon: "◎", text: "Every failure is a question your plan didn't answer" },
  { icon: "⬡", text: "Only 8 concepts power every program ever written" },
];

export default function VideoSection() {
  return (
    <section style={{ padding: "0 60px 80px", maxWidth: 1100, margin: "0 auto" }}>
      <AnimatedSection delay={0.1}>
        <div style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: "#4a4a6a", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500 }}>
            The Talk That Inspired This
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
          <div style={{
            position: "relative", borderRadius: 12, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)", aspectRatio: "16/9",
            background: "#0d0d1a", boxShadow: "0 0 60px rgba(232,197,71,0.06)",
          }}>
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/YWwBhjQN-Qw?start=149&rel=0&modestbranding=1&color=white"
              title="How to Begin Thinking like a Programmer by Andy Harris"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ display: "block", width: "100%", height: "100%", position: "absolute", inset: 0 }}
            />
          </div>

          <div>
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(22px, 2.5vw, 34px)", fontWeight: 700,
              letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 16,
            }}>
              How to Begin Thinking<br />
              <em style={{ fontStyle: "italic", color: "#e8c547" }}>Like a Programmer</em>
            </h3>
            <p style={{ fontSize: 14, color: "#6060a0", lineHeight: 1.8, marginBottom: 20 }}>
              Andy Harris's talk is the philosophical backbone of ThinkFirst. He argues
              that programming has nothing to do with memorizing syntax — it's about
              learning to think precisely, plan deliberately, and embrace confusion as
              the actual lesson.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {videoHighlights.map((item) => (
                <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: "#e8c547", fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, color: "#9090a8" }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
