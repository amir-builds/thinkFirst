import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>
          Welcome to <img src="/img/logo.png" alt="ThinkFirst" style={styles.logo} />
        </h1>
        <p style={styles.subtitle}>Good programmers are not fast typers — they are clear thinkers</p>
        
        <div style={styles.buttonGroup}>
          <button
            onClick={() => navigate("/practice")}
            style={styles.primaryButton}
          >
            Start Practice
          </button>
          <button
            onClick={() => navigate("/admin/login")}
            style={styles.secondaryButton}
          >
            Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, rgb(0 0 0) 47%, rgb(145 145 145) 50%)"
  },
  content: {
    textAlign: "center",
    color: "white",
    padding: "40px"
  },
  title: {
    fontSize: "48px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "15px"
  },
  logo: {
    height: "96px",
    width: "auto",
    verticalAlign: "middle"
  },
  subtitle: {
    fontSize: "20px",
    marginBottom: "40px",
    opacity: 0.9
  },
  buttonGroup: {
    display: "flex",
    gap: "20px",
    justifyContent: "center"
  },
  primaryButton: {
    padding: "15px 40px",
    fontSize: "18px",
    backgroundColor: "white",
    color: "#667eea",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    transition: "all 0.3s"
  },
  secondaryButton: {
    padding: "15px 40px",
    fontSize: "18px",
    backgroundColor: "transparent",
    color: "white",
    border: "2px solid white",
    borderRadius: "8px",
    fontWeight: "bold",
    transition: "all 0.3s"
  }
};