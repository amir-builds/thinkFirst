import React from "react";

export default function Logo({ height = "h-24", className = "" }) {
  return (
    <img
      src="/logo.png"
      alt="ThinkFirst"
      className={`${height} w-auto align-middle ${className}`}
    />
  );
}
