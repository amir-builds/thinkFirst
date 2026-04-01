import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";

const defaultActions = [
  { label: "Start Practice", path: "/practice", variant: "primary" },
  { label: "Admin Login", path: "/admin/login", variant: "secondary" },
];

export default function NavButtons({ actions = defaultActions }) {
  const navigate = useNavigate();

  return (
    <div className="flex gap-5 justify-center">
      {actions.map(({ label, path, variant }) => (
        <Button key={path} variant={variant} onClick={() => navigate(path)}>
          {label}
        </Button>
      ))}
    </div>
  );
}
