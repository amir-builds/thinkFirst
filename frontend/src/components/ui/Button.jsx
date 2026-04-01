import React from "react";

const baseStyles = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 600,
  letterSpacing: "0.02em",
  borderRadius: 4,
  cursor: "pointer",
  transition: "all 0.2s",
};

const variantStyles = {
  primary: {
    background: "#e8c547",
    color: "#080810",
    border: "none",
  },
  ghost: {
    background: "transparent",
    color: "#e8e8f0",
    border: "1px solid rgba(255,255,255,0.15)",
  },
};

const hoverVariants = {
  primary: { background: "#f0d060", transform: "translateY(-1px)" },
  ghost: { borderColor: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.04)" },
};

const sizeStyles = {
  sm: { padding: "10px 20px", fontSize: 13 },
  md: { padding: "14px 28px", fontSize: 15 },
  lg: { padding: "16px 36px", fontSize: 16 },
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  style = {},
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...(hovered ? hoverVariants[variant] : {}),
        ...style,
      }}
    >
      {children}
    </button>
  );
}
