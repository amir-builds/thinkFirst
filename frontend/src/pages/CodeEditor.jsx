import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Editor from "@monaco-editor/react";

const API_BASE_URL = "http://localhost:8000/api/v1";

export default function CodeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mentorMessageRef = useRef(null);
  const reflectionMessageRef = useRef(null);
  
  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const [plan, setPlan] = useState("");
  const [mentorMessage, setMentorMessage] = useState("");
  const [readyToCode, setReadyToCode] = useState(false);
  const [mentorLoading, setMentorLoading] = useState(false);
  const [reflectionMessage, setReflectionMessage] = useState("");
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [executionError, setExecutionError] = useState("");

  useEffect(() => {
    fetchQuestion();
  }, [id]);

  useEffect(() => {
    if (mentorMessage && mentorMessageRef.current) {
      mentorMessageRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [mentorMessage]);

  useEffect(() => {
    if (reflectionMessage && reflectionMessageRef.current) {
      reflectionMessageRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [reflectionMessage]);

  const fetchQuestion = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/questions/${id}`);
      const q = response.data.data;
      setQuestion(q);
      setCode("");
    } catch (error) {
      toast.error("Failed to load question");
      console.error(error);
    }
  };

  const handleRunCode = async () => {
    setLoading(true);
    setOutput("");
    setResults(null);
    setExecutionError("");
    setReflectionMessage("");

    try {
      const response = await axios.post(`${API_BASE_URL}/runcode/execute`, {
        question,
        code,
        language
      });

      setResults(response.data.data);
      const allPassed = response.data.data.results.every((r) => r.pass);
      
      if (allPassed) {
        toast.success("All test cases passed! ✅");
      } else {
        toast.error("Some test cases failed ❌");
        const failedResults = response.data.data.results.filter((r) => !r.pass);
        const errorDetails = failedResults.map((r, i) => 
          `Test ${i + 1}: Expected ${r.expected}, Got ${r.output}`
        ).join("; ");
        setExecutionError(errorDetails);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Execution failed";
      toast.error(errorMsg);
      setOutput(errorMsg);
      setExecutionError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAskMentor = async () => {
    setMentorLoading(true);
    setMentorMessage("");

    try {
      const response = await axios.post(`${API_BASE_URL}/ai/mentor`, {
        problem: question.description,
        plan
      });

      const data = response.data.data;
      setMentorMessage(data.message);

      if (data.readyToCode) {
        setReadyToCode(true);
      }
    } catch (error) {
      toast.error("Failed to get mentor feedback");
      console.error(error);
    } finally {
      setMentorLoading(false);
    }
  };

  const handleAskReflection = async () => {
    setReflectionLoading(true);
    setReflectionMessage("");

    try {
      const response = await axios.post(`${API_BASE_URL}/ai/reflection`, {
        problem: question.description,
        plan,
        code,
        error: executionError
      });

      setReflectionMessage(response.data.data.message);
    } catch (error) {
      toast.error("Failed to get reflection");
      console.error(error);
    } finally {
      setReflectionLoading(false);
    }
  };

  if (!question) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <button onClick={() => navigate("/practice")} style={styles.backButton}>
          ← Back
        </button>
        
        <h2 style={styles.title}>{question.title}</h2>
        <span style={styles.difficulty}>{question.difficulty}</span>
        
        <div style={styles.description}>
          <h3>Description</h3>
          <p>{question.description}</p>
        </div>

        {question.sample_input1 && (
          <div style={styles.testCases}>
            <h3>Sample Test Cases</h3>
            <div style={styles.testCase}>
              <div><strong>Input:</strong> {question.sample_input1}</div>
              <div><strong>Output:</strong> {question.sample_output1}</div>
            </div>
            {question.sample_input2 && (
              <div style={styles.testCase}>
                <div><strong>Input:</strong> {question.sample_input2}</div>
                <div><strong>Output:</strong> {question.sample_output2}</div>
              </div>
            )}
          </div>
        )}

        <div style={styles.planSection}>
          <h3>Your Plan / Approach</h3>
          <textarea
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            placeholder="Explain how you would solve this problem in simple steps. No code."
            style={styles.planTextarea}
            disabled={readyToCode}
          />
          <button
            onClick={handleAskMentor}
            disabled={mentorLoading || readyToCode || !plan.trim()}
            style={{
              ...styles.mentorButton,
              opacity: mentorLoading || readyToCode || !plan.trim() ? 0.5 : 1
            }}
          >
            {mentorLoading ? "Thinking..." : "Ask ThinkFirst"}
          </button>

          {mentorMessage && (
            <div ref={mentorMessageRef} style={styles.mentorMessage}>
              <strong>ThinkFirst Mentor:</strong>
              <p>{mentorMessage}</p>
            </div>
          )}
        </div>
      </div>

      <div style={styles.editorSection}>
        <div style={styles.editorHeader}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={styles.languageSelect}
            disabled={!readyToCode}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
          </select>
          
          <button
            onClick={handleRunCode}
            disabled={loading || !readyToCode}
            style={{
              ...styles.runButton,
              opacity: loading || !readyToCode ? 0.5 : 1
            }}
          >
            {loading ? "Running..." : "▶ Run Code"}
          </button>
        </div>

        <div style={{ position: "relative" }}>
          {!readyToCode && (
            <div style={styles.editorOverlay}>
              <p>Complete your plan and get mentor approval to unlock the editor</p>
            </div>
          )}
          <Editor
            height="60vh"
            language={language === "cpp" ? "cpp" : language}
            value={code}
            onChange={(value) => setCode(value || "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              readOnly: !readyToCode
            }}
          />
        </div>

        <div style={styles.outputSection}>
          <h3>Output</h3>
          {results && (
            <div style={styles.results}>
              {results.results.map((result, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.resultItem,
                    backgroundColor: result.pass ? "#d1fae5" : "#fee2e2"
                  }}
                >
                  <div style={styles.resultStatus}>
                    Test Case {index + 1}: {result.pass ? "✅ Passed" : "❌ Failed"}
                  </div>
                  {!result.pass && (
                    <div style={styles.resultDetails}>
                      <div>Expected: {result.expected}</div>
                      <div>Got: {result.output}</div>
                      {result.explanation && <div>Error: {result.explanation}</div>}
                    </div>
                  )}
                </div>
              ))}
              <div style={styles.metrics}>
                <span>Time: {results.time}s</span>
                <span>Memory: {results.memory} KB</span>
              </div>
            </div>
          )}
          {output && <pre style={styles.output}>{output}</pre>}

          {executionError && !reflectionMessage && (
            <button
              onClick={handleAskReflection}
              disabled={reflectionLoading}
              style={{
                ...styles.reflectionButton,
                opacity: reflectionLoading ? 0.5 : 1
              }}
            >
              {reflectionLoading ? "Thinking..." : "Why did this fail?"}
            </button>
          )}

          {reflectionMessage && (
            <div ref={reflectionMessageRef} style={styles.reflectionMessage}>
              <strong>ThinkFirst Reflection:</strong>
              <p>{reflectionMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#1e1e1e"
  },
  sidebar: {
    width: "400px",
    backgroundColor: "#252526",
    color: "white",
    padding: "20px",
    overflowY: "auto"
  },
  backButton: {
    padding: "8px 16px",
    backgroundColor: "#007acc",
    color: "white",
    border: "none",
    borderRadius: "4px",
    marginBottom: "20px",
    fontSize: "14px"
  },
  title: {
    fontSize: "24px",
    marginBottom: "10px"
  },
  difficulty: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "#f59e0b",
    borderRadius: "12px",
    fontSize: "12px",
    marginBottom: "20px"
  },
  description: {
    marginBottom: "20px",
    lineHeight: "1.6"
  },
  testCases: {
    marginTop: "20px"
  },
  testCase: {
    backgroundColor: "#1e1e1e",
    padding: "10px",
    borderRadius: "4px",
    marginTop: "10px",
    fontSize: "14px"
  },
  editorSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column"
  },
  editorHeader: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 20px",
    backgroundColor: "#2d2d30",
    alignItems: "center"
  },
  languageSelect: {
    padding: "8px 12px",
    backgroundColor: "#3c3c3c",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "14px"
  },
  runButton: {
    padding: "10px 24px",
    backgroundColor: "#0e639c",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "16px",
    fontWeight: "600"
  },
  outputSection: {
    backgroundColor: "#1e1e1e",
    color: "white",
    padding: "20px",
    height: "25vh",
    overflowY: "auto"
  },
  results: {
    marginTop: "10px"
  },
  resultItem: {
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "8px",
    color: "#1f2937"
  },
  resultStatus: {
    fontWeight: "600",
    marginBottom: "8px"
  },
  resultDetails: {
    fontSize: "13px",
    lineHeight: "1.6"
  },
  metrics: {
    marginTop: "15px",
    display: "flex",
    gap: "20px",
    fontSize: "14px",
    color: "#10b981"
  },
  output: {
    backgroundColor: "#0d1117",
    padding: "12px",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "monospace",
    whiteSpace: "pre-wrap"
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontSize: "24px"
  },
  planSection: {
    marginTop: "20px",
    borderTop: "1px solid #3c3c3c",
    paddingTop: "20px"
  },
  planTextarea: {
    width: "100%",
    minHeight: "120px",
    padding: "12px",
    backgroundColor: "#1e1e1e",
    color: "white",
    border: "1px solid #3c3c3c",
    borderRadius: "4px",
    fontSize: "14px",
    resize: "vertical",
    marginTop: "10px"
  },
  mentorButton: {
    marginTop: "10px",
    padding: "10px 20px",
    backgroundColor: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%"
  },
  mentorMessage: {
    marginTop: "15px",
    padding: "12px",
    backgroundColor: "#1e1e1e",
    border: "1px solid #6366f1",
    borderRadius: "6px",
    lineHeight: "1.6"
  },
  editorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    color: "#9ca3af",
    fontSize: "16px",
    textAlign: "center",
    padding: "20px"
  },
  reflectionButton: {
    marginTop: "15px",
    padding: "10px 20px",
    backgroundColor: "#f59e0b",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer"
  },
  reflectionMessage: {
    marginTop: "15px",
    padding: "12px",
    backgroundColor: "#1e1e1e",
    border: "1px solid #f59e0b",
    borderRadius: "6px",
    lineHeight: "1.6"
  }
};
