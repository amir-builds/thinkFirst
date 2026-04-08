import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/ui/Button";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export default function StudentRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear field-specific error when user starts typing
    if (validationErrors[e.target.name]) {
      setValidationErrors({ ...validationErrors, [e.target.name]: "" });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!formData.email.includes("@")) {
      errors.email = "Invalid email format";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/student/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      if (data.data?.needsVerification) {
        setRegisteredEmail(formData.email);
        setShowOTP(true);
        toast && toast.success && toast.success("Verification email sent!"); // optional if they have toast
        return;
      }

      navigate("/student/dashboard");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/student/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail, otp }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Verification failed");
        return;
      }

      navigate("/student/dashboard");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const response = await fetch(`${API_BASE}/student/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Failed to resend OTP");
      } else {
        setError("");
        alert("OTP resent successfully!");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleOAuthLogin = (provider) => {
    window.location.href = `${API_BASE}/student/oauth/${provider}`;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #080810 0%, #1a1a2e 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: "rgba(26, 26, 46, 0.8)",
        border: "1px solid rgba(232, 197, 71, 0.3)",
        borderRadius: "12px",
        padding: "40px",
        width: "100%",
        maxWidth: "400px",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: "#e8c547",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 15px",
          }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#080810", fontFamily: "monospace" }}>TF</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#e8e8f0", margin: 0, marginBottom: 10 }}>
            Create Account
          </h1>
          <p style={{ color: "#9090a8", fontSize: 14, margin: 0 }}>
            Join ThinkFirst community
          </p>
        </div>

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.5)",
            color: "#fca5a5",
            padding: "12px",
            borderRadius: "6px",
            marginBottom: "20px",
            fontSize: "14px",
          }}>
            {error}
          </div>
        )}

        {showOTP ? (
          <div>
            <p style={{ color: "#e8e8f0", fontSize: "14px", marginBottom: "20px", textAlign: "center" }}>
              We've sent a 6-digit confirmation code to <strong>{registeredEmail}</strong>.
            </p>
            <form onSubmit={handleVerifyOTP}>
              <div style={{ marginBottom: "20px" }}>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "6px",
                    color: "#e8e8f0",
                    fontSize: "18px",
                    letterSpacing: "4px",
                    textAlign: "center",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <Button
                variant="primary"
                type="submit"
                style={{ width: "100%", marginBottom: "15px" }}
                disabled={loading || otp.length < 6}
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </Button>
            </form>
            <div style={{ textAlign: "center", marginTop: "15px" }}>
              <button
                type="button"
                onClick={handleResendOTP}
                style={{
                  background: "none",
                  border: "none",
                  color: "#e8c547",
                  cursor: "pointer",
                  fontSize: "14px",
                  textDecoration: "underline",
                }}
              >
                Resend Code
              </button>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleRegister}>
          <div style={{ marginBottom: "15px" }}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.05)",
                border: validationErrors.name
                  ? "1px solid rgba(239, 68, 68, 0.5)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
                color: "#e8e8f0",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            {validationErrors.name && (
              <p style={{ color: "#fca5a5", fontSize: "12px", margin: "4px 0 0 0" }}>
                {validationErrors.name}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "15px" }}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.05)",
                border: validationErrors.email
                  ? "1px solid rgba(239, 68, 68, 0.5)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
                color: "#e8e8f0",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            {validationErrors.email && (
              <p style={{ color: "#fca5a5", fontSize: "12px", margin: "4px 0 0 0" }}>
                {validationErrors.email}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "15px" }}>
            <input
              type="password"
              name="password"
              placeholder="Password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.05)",
                border: validationErrors.password
                  ? "1px solid rgba(239, 68, 68, 0.5)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
                color: "#e8e8f0",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            {validationErrors.password && (
              <p style={{ color: "#fca5a5", fontSize: "12px", margin: "4px 0 0 0" }}>
                {validationErrors.password}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.05)",
                border: validationErrors.confirmPassword
                  ? "1px solid rgba(239, 68, 68, 0.5)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
                color: "#e8e8f0",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            {validationErrors.confirmPassword && (
              <p style={{ color: "#fca5a5", fontSize: "12px", margin: "4px 0 0 0" }}>
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>

          <Button
            variant="primary"
            type="submit"
            style={{ width: "100%", marginBottom: "15px" }}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Register"}
          </Button>
        </form>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          margin: "20px 0",
          color: "#9090a8",
          fontSize: "12px",
        }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(255, 255, 255, 0.1)" }}></div>
          <span>OR</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255, 255, 255, 0.1)" }}></div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            onClick={() => handleOAuthLogin("github")}
            style={{
              padding: "12px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "6px",
              color: "#e8e8f0",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.15)";
              e.target.style.borderColor = "rgba(232, 197, 71, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.1)";
              e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
            }}
          >
            🐙 Register with GitHub
          </button>

          <button
            type="button"
            onClick={() => handleOAuthLogin("google")}
            style={{
              padding: "12px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "6px",
              color: "#e8e8f0",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.15)";
              e.target.style.borderColor = "rgba(232, 197, 71, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.1)";
              e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
            }}
          >
            🔴 Register with Google
          </button>
        </div>
        </>
        )}

        <p style={{
          textAlign: "center",
          color: "#9090a8",
          fontSize: "14px",
          marginTop: "20px",
          marginBottom: 0,
        }}>
          Already have an account?{" "}
          <Link
            to="/student/login"
            style={{ color: "#e8c547", textDecoration: "none", fontWeight: "600" }}
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
