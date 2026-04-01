import React from "react";
import AnimatedSection from "../ui/AnimatedSection";

export default function QuoteBreak() {
  return (
    <section style={{
      padding: "80px 60px",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      textAlign: "center",
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <AnimatedSection>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(22px, 3.5vw, 38px)",
            fontStyle: "italic", fontWeight: 400,
            lineHeight: 1.5, color: "#c0c0d8",
            marginBottom: 20,
          }}>
            "Most beginners don't know how to write the code. That's not the problem.
            The real problem is they don't understand what they're trying to solve."
          </p>
          <p style={{ fontSize: 13, color: "#4a4a6a", letterSpacing: "0.05em" }}>
            — Andy Harris, <em>How to Begin Thinking Like a Programmer</em>
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
