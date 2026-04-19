import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Button from "../components/ui/Button";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export default function StudentLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refetch } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthError = params.get("error");

    if (oauthError) {
      setError(oauthError);
    }
  }, [location.search]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/student/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        if (response.status === 403 && data.message.includes("verify your email")) {
          setUnverifiedEmail(formData.email);
        }
        return;
      }

      await refetch();  // update navbar immediately
      navigate("/student/dashboard");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    window.location.href = `${API_BASE}/student/oauth/${provider}`;
  };

  const handleResendOTP = async () => {
    try {
      const response = await fetch(`${API_BASE}/student/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Failed to resend OTP");
      } else {
        setError("Verification email resent! Please check your inbox and click the link or use the code in the register page.");
        // We could redirect them to the register page with a state, but for now just showing a message is fine.
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
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
            Student Login
          </h1>
          <p style={{ color: "#9090a8", fontSize: 14, margin: 0 }}>
            Access your ThinkFirst dashboard
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
            {unverifiedEmail && (
              <div style={{ marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#e8c547",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: 0,
                    fontSize: "13px"
                  }}
                >
                  Click here to resend verification email
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleLocalLogin}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "15px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "6px",
              color: "#e8e8f0",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "20px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "6px",
              color: "#e8e8f0",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />

          <Button
            variant="primary"
            type="submit"
            style={{ width: "100%", marginBottom: "15px" }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
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

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            type="button"
            onClick={() => handleOAuthLogin("google")}
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "#ffffff",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              color: "#1f1f1f",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f8f8f8";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => handleOAuthLogin("github")}
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "#1f1f1f",
              border: "1px solid #333333",
              borderRadius: "8px",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#2d2d2d";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#1f1f1f";
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <FaGithub size={20} />
            Continue with GitHub
          </button>
        </div>

        <p style={{
          textAlign: "center",
          color: "#9090a8",
          fontSize: "14px",
          marginTop: "20px",
          marginBottom: 0,
        }}>
          Don't have an account?{" "}
          <Link
            to="/student/register"
            style={{ color: "#e8c547", textDecoration: "none", fontWeight: "600" }}
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
