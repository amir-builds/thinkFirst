import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const response = await fetch(`${API_BASE}/student/current`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load dashboard");
        if (response.status === 401) {
          navigate("/student/login");
        }
        return;
      }

      setStudent(data.data.student);
      setStats(data.data.stats);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/student/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }

    navigate("/");
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #080810 0%, #1a1a2e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <p style={{ color: "#e8c547", fontSize: 18 }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #080810 0%, #1a1a2e 100%)",
      padding: "20px",
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "40px",
          paddingBottom: "20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}>
          <div>
            <h1 style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#e8e8f0",
              margin: 0,
              marginBottom: 10,
            }}>
              Welcome back, {student?.name}! 👋
            </h1>
            <p style={{
              color: "#9090a8",
              fontSize: 14,
              margin: 0,
            }}>
              {student?.email}
            </p>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: "10px 20px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              color: "#fca5a5",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Logout
          </button>
        </div>

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.5)",
            color: "#fca5a5",
            padding: "12px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}>
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}>
          <div style={{
            background: "rgba(26, 26, 46, 0.8)",
            border: "1px solid rgba(232, 197, 71, 0.2)",
            borderRadius: "12px",
            padding: "20px",
            backdropFilter: "blur(12px)",
          }}>
            <p style={{ color: "#9090a8", fontSize: 12, margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Problems Solved
            </p>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#e8c547" }}>
              {stats?.problemsSolved || 0}
            </div>
            <p style={{ color: "#9090a8", fontSize: 12, margin: "8px 0 0 0" }}>
              +{stats?.totalProblems || 0} total attempts
            </p>
          </div>

          <div style={{
            background: "rgba(26, 26, 46, 0.8)",
            border: "1px solid rgba(100, 200, 255, 0.2)",
            borderRadius: "12px",
            padding: "20px",
            backdropFilter: "blur(12px)",
          }}>
            <p style={{ color: "#9090a8", fontSize: 12, margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Thinking Time
            </p>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#64c8ff" }}>
              {stats?.totalThinkingTime ? Math.round(stats.totalThinkingTime / 60) : 0}
            </div>
            <p style={{ color: "#9090a8", fontSize: 12, margin: "8px 0 0 0" }}>
              minutes invested
            </p>
          </div>

          <div style={{
            background: "rgba(26, 26, 46, 0.8)",
            border: "1px solid rgba(150, 200, 150, 0.2)",
            borderRadius: "12px",
            padding: "20px",
            backdropFilter: "blur(12px)",
          }}>
            <p style={{ color: "#9090a8", fontSize: 12, margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Accuracy Rate
            </p>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#96c896" }}>
              {stats?.totalProblems 
                ? Math.round((stats.problemsSolved / stats.totalProblems) * 100)
                : 0}%
            </div>
            <p style={{ color: "#9090a8", fontSize: 12, margin: "8px 0 0 0" }}>
              success rate
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
          marginBottom: "40px",
        }}>
          <Button
            variant="primary"
            onClick={() => navigate("/practice")}
            style={{ width: "100%", padding: "15px" }}
          >
            Start Practicing
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate("/student/profile")}
            style={{ width: "100%", padding: "15px", background: "rgba(100, 200, 255, 0.2)", border: "1px solid rgba(100, 200, 255, 0.5)" }}
          >
            My Profile
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate("/student/history")}
            style={{ width: "100%", padding: "15px", background: "rgba(150, 200, 150, 0.2)", border: "1px solid rgba(150, 200, 150, 0.5)" }}
          >
            Problem History
          </Button>
        </div>

        {/* Quick Info */}
        <div style={{
          background: "rgba(26, 26, 46, 0.8)",
          border: "1px solid rgba(232, 197, 71, 0.2)",
          borderRadius: "12px",
          padding: "20px",
          backdropFilter: "blur(12px)",
        }}>
          <h2 style={{ color: "#e8e8f0", fontSize: 18, fontWeight: 600, margin: "0 0 15px 0" }}>
            🎯 Next Steps
          </h2>
          <ul style={{ color: "#9090a8", fontSize: 14, lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
            <li>Start with fundamental problems to build your thinking approach</li>
            <li>Write clear explanations before diving into code</li>
            <li>Review AI mentor feedback after each problem</li>
            <li>Track your progress steady to build learning streaks</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
