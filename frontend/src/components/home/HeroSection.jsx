import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import CodeSnippet from "./CodeSnippet";

export default function HeroSection() {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const parallaxX = (mousePos.x / window.innerWidth - 0.5) * 20;
  const parallaxY = (mousePos.y / window.innerHeight - 0.5) * 20;

  return (
    <section style={{ padding: "120px 60px 80px", maxWidth: 1100, margin: "0 auto", position: "relative" }}>
      {/* Background orb */}
      <div style={{
        position: "absolute", top: 60, right: -100, width: 500, height: 500,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(232,197,71,0.06) 0%, transparent 70%)",
        transform: `translate(${parallaxX}px, ${parallaxY}px)`,
        transition: "transform 0.1s ease-out",
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%", background: "#4ecca3",
          boxShadow: "0 0 8px #4ecca3", display: "inline-block",
        }} />
        <span style={{ fontSize: 13, color: "#4ecca3", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Think. Plan. Code.
        </span>
      </div>

      <h1 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "clamp(48px, 7vw, 88px)",
        fontWeight: 700,
        lineHeight: 1.05,
        letterSpacing: "-0.02em",
        marginBottom: 28,
        maxWidth: 780,
      }}>
        Good programmers are{" "}
        <em style={{ fontStyle: "italic", color: "#e8c547" }}>clear thinkers</em>,<br />
        not fast typers.
      </h1>

      <p style={{
        fontSize: 18, color: "#9090a8", lineHeight: 1.75,
        maxWidth: 560, marginBottom: 48, fontWeight: 400,
      }}>
        ThinkFirst enforces what every great programmer already knows — you must
        understand the problem before you touch the keyboard.
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 64 }}>
        <Button variant="primary" onClick={() => navigate("/practice")}>
          Start Practicing →
        </Button>
        <Button variant="ghost" onClick={() => {
          document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
        }}>
          See how it works
        </Button>
      </div>

      <CodeSnippet />
    </section>
  );
}
