import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import CodeSnippet from "./CodeSnippet";

// Uppercase so textTransform doesn't affect rendering inconsistently
const FULL_TEXT   = "THINK. PLAN. CODE.";
const CHAR_DELAY  = 120;  // ms per char — typing speed
const ERASE_DELAY = 55;   // ms per char — erase speed
const DOT_PAUSE   = 480;  // extra pause after each "."
const END_PAUSE   = 1500; // pause when fully typed before erasing
const START_PAUSE = 600;  // pause when fully erased before re-typing

function ThinkPlanCode() {
  const [displayed, setDisplayed] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    let index    = 0;
    let isErase  = false;

    function tick() {
      if (!isErase) {
        if (index < FULL_TEXT.length) {
          index++;
          setDisplayed(FULL_TEXT.slice(0, index));
          const ch    = FULL_TEXT[index - 1];
          const delay = ch === "." ? CHAR_DELAY + DOT_PAUSE : CHAR_DELAY;
          timerRef.current = setTimeout(tick, delay);
        } else {
          timerRef.current = setTimeout(() => { isErase = true; tick(); }, END_PAUSE);
        }
      } else {
        if (index > 0) {
          index--;
          setDisplayed(FULL_TEXT.slice(0, index));
          timerRef.current = setTimeout(tick, ERASE_DELAY);
        } else {
          timerRef.current = setTimeout(() => { isErase = false; tick(); }, START_PAUSE);
        }
      }
    }

    timerRef.current = setTimeout(tick, 700);
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <>
      <style>{`
        @keyframes tpc-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .tpc-root {
          display: inline-flex;
          align-items: center;
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: #4ecca3;
          line-height: 1;
        }
        .tpc-cursor {
          display: inline-block;
          width: 1.5px;
          height: 1.1em;
          background: #4ecca3;
          border-radius: 1px;
          margin-left: 2px;
          vertical-align: middle;
          box-shadow: 0 0 5px #4ecca3;
          animation: tpc-blink 1.05s step-end infinite;
          flex-shrink: 0;
        }
      `}</style>
      <span className="tpc-root">
        {/* Single text node — no per-char spans, so all glyphs render identically */}
        <span>{displayed}</span>
        <span className="tpc-cursor" />
      </span>
    </>
  );
}

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
        <ThinkPlanCode />
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
