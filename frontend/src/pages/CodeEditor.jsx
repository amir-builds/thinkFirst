import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Editor from "@monaco-editor/react";

const API_BASE_URL = "http://localhost:8000/api/v1";

export default function CodeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [readyToCode, setReadyToCode] = useState(false);
  const [executionError, setExecutionError] = useState("");

  useEffect(() => {
    fetchQuestion();
  }, [id]);

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

  const handleSendMessage = async () => {
    if (!currentInput.trim() || isProcessing) return;

    const userMessage = currentInput.trim();
    setCurrentInput("");
    setIsProcessing(true);

    // Add user message to chat
    setMessages(prev => [...prev, {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    // Create placeholder for mentor response
    const mentorMessageId = Date.now();
    setMessages(prev => [...prev, {
      id: mentorMessageId,
      type: 'mentor',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }]);

    try {
      console.log('Sending request to mentor API...');
      console.log('Problem:', question.description);
      console.log('Plan:', userMessage);

      const response = await fetch(`${API_BASE_URL}/ai/mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problem: question.description,
          plan: userMessage
        })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API error: ${response.statusText} - ${errorText}`);
      }

      console.log('Starting to read response stream...');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullMessage = '';
      let detectedReadyToCode = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          console.log('Stream read - done:', done, 'value length:', value?.length);
          if (done) {
            console.log('Stream completed');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          console.log('Buffer length:', buffer.length);
          const lines = buffer.split('\n');
          buffer = lines[lines.length - 1];
          console.log('Processing', lines.length - 1, 'lines');

          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            console.log('Processing line:', line.substring(0, 100));
            try {
              const chunk = JSON.parse(line);
              console.log('Parsed chunk type:', chunk.type);
              
              if (chunk.type === 'chunk') {
                fullMessage += chunk.content;
                console.log('Full message length:', fullMessage.length);
                // Update the streaming message
                setMessages(prev => prev.map(msg => 
                  msg.id === mentorMessageId 
                    ? { ...msg, content: fullMessage }
                    : msg
                ));
              } else if (chunk.type === 'complete') {
                console.log('Received complete message');
                fullMessage = chunk.fullMessage;
                detectedReadyToCode = chunk.readyToCode;
                setMessages(prev => prev.map(msg => 
                  msg.id === mentorMessageId 
                    ? { ...msg, content: fullMessage, isStreaming: false, readyToCode: chunk.readyToCode }
                    : msg
                ));
              }
            } catch (error) {
              console.debug('Skipped malformed chunk:', error.message);
            }
          }
        }

        // Process remaining buffer
        if (buffer.trim()) {
          try {
            const chunk = JSON.parse(buffer);
            if (chunk.type === 'complete') {
              detectedReadyToCode = chunk.readyToCode;
              setMessages(prev => prev.map(msg => 
                msg.id === mentorMessageId 
                  ? { ...msg, content: chunk.fullMessage, isStreaming: false, readyToCode: chunk.readyToCode }
                  : msg
              ));
            }
          } catch (error) {
            console.debug('Skipped final malformed chunk');
          }
        }

        if (detectedReadyToCode) {
          setReadyToCode(true);
          toast.success("🎉 You're ready to code! Editor unlocked.");
        }

      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Full error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      toast.error(`Failed to get mentor feedback: ${error.message}`);
      
      // Remove the failed mentor message
      setMessages(prev => prev.filter(msg => msg.id !== mentorMessageId));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!question) {
    return <div style={styles.loading}>Loading...</div>;
  }

  const getPlaceholder = () => {
    if (messages.length === 0) {
      return "Describe your approach (no code yet)…";
    }
    return "Respond to the mentor's question…";
  };

  return (
    <div style={styles.container}>
      {/* Left Sidebar - Problem Description */}
      <div style={styles.sidebar}>
        <button onClick={() => navigate("/practice")} style={styles.backButton}>
          ← Back to Problems
        </button>
        
        <div style={styles.problemHeader}>
          <h2 style={styles.title}>{question.title}</h2>
          <span style={styles.difficulty}>{question.difficulty}</span>
        </div>
        
        <div style={styles.description}>
          <h3 style={styles.sectionTitle}>Description</h3>
          <p style={styles.descriptionText}>{question.description}</p>
        </div>

        {question.sample_input1 && (
          <div style={styles.testCases}>
            <h3 style={styles.sectionTitle}>Sample Test Cases</h3>
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
      </div>

      {/* Right Side - Chat + Code Editor */}
      <div style={styles.rightPanel}>
        {/* Chat Section */}
        <div style={styles.chatSection}>
          <div style={styles.chatHeader}>
            <h3 style={styles.chatHeaderTitle}>🧠 ThinkFirst Mentor</h3>
          </div>
          
          <div style={styles.chatMessages}>
            {messages.length === 0 ? (
              // Empty State
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>💭</div>
                <h2 style={styles.emptyTitle}>Welcome to ThinkFirst</h2>
                <p style={styles.emptyDescription}>
                  Explain how you would approach the problem.<br />
                  I'll guide your thinking — not give the answer.
                </p>
              </div>
            ) : (
              // Message History
              messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.messageWrapper,
                    justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      ...styles.message,
                      ...(msg.type === 'user' ? styles.userMessage : styles.mentorMessage)
                    }}
                  >
                    {msg.type === 'mentor' && (
                      <div style={styles.mentorLabel}>ThinkFirst Mentor</div>
                    )}
                    <div style={styles.messageContent}>
                      {msg.content || (msg.isStreaming && '...')}
                    </div>
                    {msg.readyToCode && (
                      <div style={styles.readyBadge}>
                        ✅ Ready to code!
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {isProcessing && messages[messages.length - 1]?.type === 'mentor' && (
              <div style={styles.thinkingIndicator}>
                <div style={styles.typingDot}></div>
                <div style={styles.typingDot}></div>
                <div style={styles.typingDot}></div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Area */}
          <div style={styles.chatInputContainer}>
            <div style={styles.inputWrapper}>
              <textarea
                ref={inputRef}
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={getPlaceholder()}
                disabled={isProcessing}
                style={{
                  ...styles.chatInput,
                  opacity: isProcessing ? 0.6 : 1
                }}
                rows={1}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!currentInput.trim() || isProcessing}
                style={{
                  ...styles.sendButton,
                  opacity: !currentInput.trim() || isProcessing ? 0.4 : 1
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
            {isProcessing && (
              <div style={styles.processingText}>Mentor is thinking...</div>
            )}
          </div>
        </div>

        {/* Code Editor Section */}
        <div style={styles.editorSection}>
          <div style={styles.editorHeader}>
            <div style={styles.editorHeaderLeft}>
              <span style={styles.editorTitle}>💻 Code Editor</span>
              {!readyToCode && (
                <span style={styles.lockedBadge}>🔒 Locked</span>
              )}
            </div>
            <div style={styles.editorHeaderRight}>
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
          </div>

          <div style={{ position: "relative" }}>
            {!readyToCode && (
              <div style={styles.editorOverlay}>
                <div style={styles.overlayContent}>
                  <div style={styles.lockIcon}>🔒</div>
                  <p style={styles.overlayText}>
                    Complete your plan and get mentor approval to unlock the editor
                  </p>
                </div>
              </div>
            )}
            <Editor
              height="35vh"
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
            <h3 style={styles.outputTitle}>Output</h3>
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
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#1e1e1e",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  sidebar: {
    width: "380px",
    backgroundColor: "#252526",
    color: "white",
    padding: "24px",
    overflowY: "auto",
    borderRight: "1px solid #3c3c3c"
  },
  backButton: {
    padding: "10px 16px",
    backgroundColor: "transparent",
    color: "#9ca3af",
    border: "1px solid #3c3c3c",
    borderRadius: "8px",
    marginBottom: "24px",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    fontWeight: "500"
  },
  problemHeader: {
    marginBottom: "24px"
  },
  title: {
    fontSize: "22px",
    marginBottom: "12px",
    fontWeight: "600",
    lineHeight: "1.3"
  },
  difficulty: {
    display: "inline-block",
    padding: "6px 12px",
    backgroundColor: "#f59e0b",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "20px"
  },
  description: {
    marginBottom: "24px"
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  descriptionText: {
    lineHeight: "1.7",
    fontSize: "14px",
    color: "#d1d5db"
  },
  testCases: {
    marginTop: "24px"
  },
  testCase: {
    backgroundColor: "#1e1e1e",
    padding: "12px",
    borderRadius: "8px",
    marginTop: "12px",
    fontSize: "13px",
    lineHeight: "1.6",
    border: "1px solid #3c3c3c"
  },
  // Right Panel Layout
  rightPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#1e1e1e",
    overflow: "hidden"
  },
  // Chat Section (Top Half)
  chatSection: {
    flex: "0 0 50%",
    display: "flex",
    flexDirection: "column",
    borderBottom: "2px solid #3c3c3c"
  },
  chatHeader: {
    padding: "16px 24px",
    backgroundColor: "#252526",
    borderBottom: "1px solid #3c3c3c"
  },
  chatHeaderTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: 0,
    color: "white"
  },
  chatMessages: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 24px",
    backgroundColor: "#1e1e1e"
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    textAlign: "center",
    padding: "40px"
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px"
  },
  emptyTitle: {
    fontSize: "22px",
    fontWeight: "600",
    color: "white",
    marginBottom: "12px"
  },
  emptyDescription: {
    fontSize: "14px",
    color: "#9ca3af",
    lineHeight: "1.6",
    maxWidth: "400px"
  },
  messageWrapper: {
    display: "flex",
    marginBottom: "16px",
    animation: "fadeIn 0.3s ease-in"
  },
  message: {
    maxWidth: "75%",
    padding: "12px 16px",
    borderRadius: "12px",
    fontSize: "14px",
    lineHeight: "1.6",
    wordWrap: "break-word"
  },
  userMessage: {
    backgroundColor: "#6366f1",
    color: "white",
    borderBottomRightRadius: "4px",
    marginLeft: "auto"
  },
  mentorMessage: {
    backgroundColor: "#2d2d30",
    color: "white",
    border: "1px solid #3c3c3c",
    borderBottomLeftRadius: "4px"
  },
  mentorLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#9ca3af",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  messageContent: {
    whiteSpace: "pre-wrap"
  },
  readyBadge: {
    marginTop: "10px",
    padding: "6px 10px",
    backgroundColor: "#10b981",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block"
  },
  thinkingIndicator: {
    display: "flex",
    gap: "6px",
    padding: "16px",
    marginBottom: "12px"
  },
  typingDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#6366f1",
    animation: "typing 1.4s infinite ease-in-out"
  },
  chatInputContainer: {
    borderTop: "1px solid #3c3c3c",
    padding: "16px 24px",
    backgroundColor: "#252526"
  },
  inputWrapper: {
    display: "flex",
    alignItems: "flex-end",
    gap: "12px",
    backgroundColor: "#1e1e1e",
    border: "1px solid #3c3c3c",
    borderRadius: "12px",
    padding: "10px 14px",
    transition: "border-color 0.2s"
  },
  chatInput: {
    flex: 1,
    backgroundColor: "transparent",
    border: "none",
    color: "white",
    fontSize: "14px",
    resize: "none",
    outline: "none",
    lineHeight: "1.5",
    maxHeight: "120px",
    minHeight: "24px",
    fontFamily: "inherit"
  },
  sendButton: {
    backgroundColor: "#6366f1",
    border: "none",
    borderRadius: "8px",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    color: "white",
    flexShrink: 0
  },
  processingText: {
    marginTop: "8px",
    fontSize: "12px",
    color: "#9ca3af",
    textAlign: "center"
  },
  // Editor Section (Bottom Half)
  editorSection: {
    flex: "0 0 50%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  editorHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 24px",
    backgroundColor: "#252526",
    borderBottom: "1px solid #3c3c3c"
  },
  editorHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  editorTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "white"
  },
  lockedBadge: {
    fontSize: "12px",
    padding: "4px 10px",
    backgroundColor: "#ef4444",
    color: "white",
    borderRadius: "12px",
    fontWeight: "600"
  },
  editorHeaderRight: {
    display: "flex",
    gap: "12px",
    alignItems: "center"
  },
  languageSelect: {
    padding: "6px 12px",
    backgroundColor: "#1e1e1e",
    color: "white",
    border: "1px solid #3c3c3c",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer"
  },
  runButton: {
    padding: "8px 20px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  editorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(30, 30, 30, 0.95)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    backdropFilter: "blur(2px)"
  },
  overlayContent: {
    textAlign: "center",
    padding: "40px"
  },
  lockIcon: {
    fontSize: "48px",
    marginBottom: "16px"
  },
  overlayText: {
    color: "#9ca3af",
    fontSize: "15px",
    lineHeight: "1.6",
    maxWidth: "400px"
  },
  outputSection: {
    backgroundColor: "#1e1e1e",
    color: "white",
    padding: "16px 24px",
    flex: 1,
    overflowY: "auto",
    borderTop: "1px solid #3c3c3c"
  },
  outputTitle: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  results: {
    marginTop: "12px"
  },
  resultItem: {
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "8px",
    color: "#1f2937"
  },
  resultStatus: {
    fontWeight: "600",
    marginBottom: "8px",
    fontSize: "13px"
  },
  resultDetails: {
    fontSize: "12px",
    lineHeight: "1.6"
  },
  metrics: {
    marginTop: "12px",
    display: "flex",
    gap: "20px",
    fontSize: "13px",
    color: "#10b981",
    fontWeight: "500"
  },
  output: {
    backgroundColor: "#0d1117",
    padding: "12px",
    borderRadius: "6px",
    fontSize: "13px",
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
    border: "1px solid #3c3c3c"
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontSize: "24px",
    color: "white",
    backgroundColor: "#1e1e1e"
  }
};
