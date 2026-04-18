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
        <h1 style={styles.title}>Practice Coding</h1>
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
    backgroundColor: "#1e1e1e",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "40px 20px",
    color: "white"
  },
  header: {
    maxWidth: "1200px",
    margin: "0 auto 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "600"
  },
  backButton: {
    padding: "10px 16px",
    backgroundColor: "transparent",
    color: "#9ca3af",
    border: "1px solid #3c3c3c",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    fontWeight: "500"
  },
  loading: {
    textAlign: "center",
    fontSize: "20px",
    marginTop: "100px",
    color: "#d1d5db"
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
    color: "#9ca3af"
  },
  questionCard: {
    backgroundColor: "#252526",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #3c3c3c",
    cursor: "pointer",
    transition: "all 0.3s",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    display: "flex",
    flexDirection: "column"
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
    color: "#f3f4f6",
    flex: 1,
    margin: "0 10px 0 0"
  },
  badge: {
    padding: "4px 12px",
    borderRadius: "12px",
    color: "white",
    fontSize: "12px",
    fontWeight: "600"
  },
  questionDescription: {
    color: "#9ca3af",
    fontSize: "14px",
    marginBottom: "15px",
    lineHeight: "1.6"
  },
  questionFooter: {
    borderTop: "1px solid #3c3c3c",
    paddingTop: "12px",
    marginTop: "auto"
  },
  category: {
    fontSize: "12px",
    color: "#818cf8",
    fontWeight: "600"
  }
};
