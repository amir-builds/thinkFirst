import React from "react";
import { useNavigate } from "react-router-dom";
import AnimatedSection from "../ui/AnimatedSection";
import Button from "../ui/Button";

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section style={{ padding: "120px 60px", maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
      <AnimatedSection>
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%", background: "#4ecca3",
            boxShadow: "0 0 8px #4ecca3", display: "inline-block",
          }} />
        </div>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 700,
          letterSpacing: "-0.02em", lineHeight: 1.1,
          marginBottom: 20,
        }}>
          Stop typing.<br />
          <em style={{ color: "#e8c547", fontStyle: "italic" }}>Start thinking.</em>
        </h2>
        <p style={{ color: "#6060a0", fontSize: 16, marginBottom: 40 }}>
          The editor unlocks when you're ready. Not before.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Button variant="primary" size="lg" onClick={() => navigate("/practice")}>
            Begin Your First Problem →
          </Button>
          <Button variant="ghost" size="lg" onClick={() => navigate("/admin/login")}>
            Admin Panel
          </Button>
        </div>
      </AnimatedSection>
    </section>
  );
}
