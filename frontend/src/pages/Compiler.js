import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

const DEFAULT_JAVA_CODE = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, DevVault!");
    }
}
`;

function Compiler() {
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");

  const [code, setCode] = useState(DEFAULT_JAVA_CODE);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  if (!token) return <Navigate to="/login" />;

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("Running...");
    try {
      const res = await axios.post(`${API_BASE}/compile`, {
        code: code,
        language: "java"
      });
      if (res.data.success) {
        setOutput(res.data.output);
      } else {
        setOutput((res.data.error || "") + "\n" + (res.data.output || ""));
      }
    } catch (e) {
      console.error(e);
      setOutput("Error connecting to compilation server.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSave = async () => {
    const title = window.prompt("Enter a title for your Java snippet:");
    if (!title || !title.trim()) return;

    setIsSaving(true);
    try {
      const markdownContent = `\`\`\`java\n${code}\n\`\`\``;
      await axios.post(`${API_BASE}/addNote`, {
        email: email,
        title: title.trim(),
        content: markdownContent
      });
      alert("Code saved successfully to your Vault!");
    } catch (e) {
      console.error(e);
      alert("Failed to save code.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    const receiverEmail = window.prompt("Enter your friend's email address:");
    if (!receiverEmail || !receiverEmail.trim()) return;
    
    const title = window.prompt("Enter a title for this snippet:");
    if (!title || !title.trim()) return;

    setIsSharing(true);
    try {
      const markdownContent = `\`\`\`java\n${code}\n\`\`\``;
      await axios.post(`${API_BASE}/shareNote`, {
        senderEmail: email,
        receiverEmail: receiverEmail.trim(),
        title: title.trim(),
        content: markdownContent
      });
      alert("Code sent successfully to " + receiverEmail.trim() + "!");
    } catch (e) {
      console.error(e);
      alert("Failed to share code.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#11111b", color: "#cdd6f4", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* ── Navbar ── */}
      <nav style={{
        background: "rgba(17,17,27,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid #313244", padding: "0 2rem", height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#cba6f7,#89b4fa)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔥</div>
            <span style={{ fontSize: "1.3rem", fontWeight: 800, background: "linear-gradient(135deg,#cba6f7,#89b4fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>DevVault</span>
          </div>
          
          <Link to="/dashboard" style={{ color: "#a6adc8", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>← Back to Dashboard</Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <button
            onClick={handleShare}
            disabled={isSharing}
            style={{
              background: "transparent",
              color: "#89b4fa",
              border: "1px solid #89b4fa", padding: "7px 16px", borderRadius: 9,
              fontWeight: 700, fontSize: "0.85rem", cursor: isSharing ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {isSharing ? "Sharing..." : "↗ Share"}
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              background: "transparent",
              color: "#cba6f7",
              border: "1px solid #cba6f7", padding: "7px 16px", borderRadius: 9,
              fontWeight: 700, fontSize: "0.85rem", cursor: isSaving ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {isSaving ? "Saving..." : "💾 Save"}
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            style={{
              background: isRunning ? "#313244" : "linear-gradient(135deg,#a6e3a1,#94e2d5)",
              color: "#11111b",
              border: "none", padding: "8px 24px", borderRadius: 9,
              fontWeight: 800, fontSize: "0.9rem", cursor: isRunning ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: "0.4rem"
            }}
          >
            {isRunning ? "Running..." : "▶ Run"}
          </button>
        </div>
      </nav>

      {/* ── Split Layout ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        
        {/* Editor Pane */}
        <div style={{ flex: 1, borderRight: "1px solid #313244", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "0.5rem 1rem", background: "#181825", borderBottom: "1px solid #313244", fontSize: "0.75rem", color: "#a6adc8", fontWeight: 700, letterSpacing: "0.05em" }}>
            Main.java
          </div>
          <div style={{ flex: 1 }}>
            <Editor
              height="100%"
              defaultLanguage="java"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value)}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                scrollBeyondLastLine: false,
                padding: { top: 16 }
              }}
            />
          </div>
        </div>

        {/* Output Pane */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#1e1e2e" }}>
          <div style={{ padding: "0.5rem 1rem", background: "#181825", borderBottom: "1px solid #313244", fontSize: "0.75rem", color: "#a6adc8", fontWeight: 700, letterSpacing: "0.05em" }}>
            Output
          </div>
          <div style={{ flex: 1, padding: "1rem", overflowY: "auto" }}>
            <pre style={{
              margin: 0,
              color: output.includes("Error") || output.includes("Exception") || output.includes("error:") ? "#f38ba8" : "#a6e3a1",
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: "0.9rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all"
            }}>
              {output || "Run your code to see the output here."}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Compiler;
