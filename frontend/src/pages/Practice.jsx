import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = "http://localhost:8000/api/v1";

export default function Practice() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/questions/public`);
      setQuestions(response.data.data || []);
    } catch (error) {
      toast.error("Failed to load questions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionClick = (questionId) => {
    navigate(`/practice/${questionId}`);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading questions...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Practice Coding</h1>
        <button onClick={() => navigate("/")} style={styles.backButton}>
          ← Back to Home
        </button>
      </div>

      <div style={styles.questionList}>
        {questions.length === 0 ? (
          <div style={styles.empty}>No questions available yet.</div>
        ) : (
          questions.map((question) => (
            <div
              key={question.id}
              onClick={() => handleQuestionClick(question.id)}
              style={styles.questionCard}
            >
              <div style={styles.questionHeader}>
                <h3 style={styles.questionTitle}>{question.title}</h3>
                <span
                  style={{
                    ...styles.badge,
                    backgroundColor:
                      question.difficulty === "Easy"
                        ? "#10b981"
                        : question.difficulty === "Medium"
                        ? "#f59e0b"
                        : "#ef4444"
                  }}
                >
                  {question.difficulty}
                </span>
              </div>
              <p style={styles.questionDescription}>
                {question.description.substring(0, 100)}...
              </p>
              <div style={styles.questionFooter}>
                <span style={styles.category}>{question.category}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    padding: "40px 20px"
  },
  header: {
    maxWidth: "1200px",
    margin: "0 auto 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  backButton: {
    padding: "10px 20px",
    backgroundColor: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px"
  },
  loading: {
    textAlign: "center",
    fontSize: "20px",
    marginTop: "100px"
  },
  questionList: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "20px"
  },
  empty: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: "60px",
    fontSize: "18px",
    color: "#6b7280"
  },
  questionCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    cursor: "pointer",
    transition: "all 0.3s",
    ":hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
    }
  },
  questionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    marginBottom: "10px"
  },
  questionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    flex: 1
  },
  badge: {
    padding: "4px 12px",
    borderRadius: "12px",
    color: "white",
    fontSize: "12px",
    fontWeight: "600"
  },
  questionDescription: {
    color: "#6b7280",
    fontSize: "14px",
    marginBottom: "15px",
    lineHeight: "1.5"
  },
  questionFooter: {
    borderTop: "1px solid #e5e7eb",
    paddingTop: "10px"
  },
  category: {
    fontSize: "12px",
    color: "#6366f1",
    fontWeight: "600"
  }
};
