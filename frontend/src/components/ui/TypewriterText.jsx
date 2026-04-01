import React, { useState, useEffect } from "react";

export default function TypewriterText({ text, speed = 45 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && (
        <span style={{
          display: "inline-block", width: 2, height: "1em",
          background: "#e8c547", marginLeft: 2,
          animation: "blink 1s step-end infinite",
          verticalAlign: "text-bottom",
        }} />
      )}
    </span>
  );
}
