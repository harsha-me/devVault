import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Send, Settings, X, AlertCircle, Check, Sparkles, Loader2 } from "lucide-react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

export default function AiCompanion({
  isOpen,
  onClose,
  noteTitle,
  noteContent,
  onInsertContent,
  onReplaceContent,
  selectedText
}) {
  const [chatHistory, setChatHistory] = useState([
    {
      role: "ai",
      content: "Hello! I am your AI Companion. Highlight any code in your note or select one of the shortcut actions below to begin. I can explain code, recommend optimizations, detect bugs, or write code from your prompts."
    }
  ]);
  const [prompt, setPrompt] = useState("");
  const [customKey, setCustomKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const chatEndRef = useRef(null);

  // Load key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("devvault_gemini_key");
    if (savedKey) {
      setCustomKey(savedKey);
    }
  }, []);

  // Scroll to bottom when history changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  const saveApiKey = () => {
    if (customKey.trim()) {
      localStorage.setItem("devvault_gemini_key", customKey.trim());
      setSuccessMsg("API key saved successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      localStorage.removeItem("devvault_gemini_key");
      setSuccessMsg("API key cleared. Using system key.");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
    setShowSettings(false);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userPrompt = prompt;
    setPrompt("");
    setChatHistory((prev) => [...prev, { role: "user", content: userPrompt }]);
    setLoading(true);
    setError("");

    try {
      const savedKey = localStorage.getItem("devvault_gemini_key") || "";
      const headers = {};
      if (savedKey) {
        headers["X-Gemini-Key"] = savedKey;
      }

      const res = await axios.post(
        `${API_BASE}/api/ai/chat`,
        {
          prompt: userPrompt,
          noteTitle,
          noteContent,
          selectedText,
          action: "chat"
        },
        { headers }
      );

      setChatHistory((prev) => [...prev, { role: "ai", content: res.data.response }]);
    } catch (err) {
      console.error("AI Error:", err);
      const errMsg = err.response?.data?.error || err.message || "Failed to communicate with AI service";
      setError(errMsg);
      setChatHistory((prev) => [
        ...prev,
        { role: "ai", content: `❌ **Error:** ${errMsg}\n\n*Please check your API key configuration in Settings (click ⚙️ at the top).*` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    if (loading) return;
    setLoading(true);
    setError("");

    let actionLabel = "";
    if (action === "explain") actionLabel = "🔍 Explaining note / code selection...";
    else if (action === "optimize") actionLabel = "⚡ Auditing code for optimizations...";
    else if (action === "bugs") actionLabel = "🐛 Inspecting code for bugs...";

    setChatHistory((prev) => [...prev, { role: "user", content: actionLabel }]);

    try {
      const savedKey = localStorage.getItem("devvault_gemini_key") || "";
      const headers = {};
      if (savedKey) {
        headers["X-Gemini-Key"] = savedKey;
      }

      const res = await axios.post(
        `${API_BASE}/api/ai/chat`,
        {
          noteTitle,
          noteContent,
          selectedText,
          action
        },
        { headers }
      );

      setChatHistory((prev) => [...prev, { role: "ai", content: res.data.response }]);
    } catch (err) {
      console.error("AI Action Error:", err);
      const errMsg = err.response?.data?.error || err.message || "Failed to run action";
      setError(errMsg);
      setChatHistory((prev) => [
        ...prev,
        { role: "ai", content: `❌ **Error:** ${errMsg}\n\n*Please check your API key configuration in Settings (click ⚙️ at the top).*` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: isOpen ? 0 : "-105%",
        width: "400px",
        maxWidth: "100%",
        height: "100vh",
        background: "var(--cream)",
        borderLeft: "1px solid var(--stone-200)",
        boxShadow: "-4px 0 24px rgba(42,37,32,0.08)",
        zIndex: 1000,
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        overflow: "hidden"
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "1rem 1.25rem",
          borderBottom: "1px solid var(--stone-200)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--stone-50)",
          flexShrink: 0
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles size={16} style={{ color: "var(--accent)" }} />
          <span style={{ fontWeight: 800, color: "var(--stone-900)", fontSize: "0.95rem", letterSpacing: "-0.01em" }}>
            AI Code Companion
          </span>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Configure Gemini API Key"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              color: showSettings ? "var(--accent)" : "var(--stone-500)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              transition: "all 0.15s"
            }}
          >
            <Settings size={16} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              color: "var(--stone-500)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center"
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Settings Subpanel */}
      {showSettings && (
        <div
          style={{
            padding: "1.25rem",
            background: "var(--stone-50)",
            borderBottom: "1px solid var(--stone-200)",
            animation: "dvFadeUp 0.3s ease",
            flexShrink: 0
          }}
        >
          <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.8rem", fontWeight: 700, color: "var(--stone-900)" }}>
            ⚙️ Gemini API Configuration
          </h4>
          <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.72rem", color: "var(--stone-500)", lineHeight: 1.4 }}>
            Enter your custom Gemini API key. It will be stored locally in your browser. Leave blank to fallback to the system API key.
          </p>
          <input
            type="password"
            placeholder="AIzaSy..."
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
            className="dv-input"
            style={{ width: "100%", fontSize: "0.75rem", padding: "8px 12px", marginBottom: "0.75rem", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button
              onClick={() => {
                setCustomKey("");
                localStorage.removeItem("devvault_gemini_key");
                setSuccessMsg("Key cleared.");
                setTimeout(() => setSuccessMsg(""), 3000);
                setShowSettings(false);
              }}
              className="dv-btn dv-btn-ghost"
              style={{ fontSize: "0.72rem", padding: "6px 12px" }}
            >
              Clear
            </button>
            <button
              onClick={saveApiKey}
              className="dv-btn dv-btn-primary"
              style={{ fontSize: "0.72rem", padding: "6px 14px", borderRadius: 8 }}
            >
              Save Key
            </button>
          </div>
        </div>
      )}

      {/* Feedback messages */}
      {successMsg && (
        <div
          style={{
            background: "var(--success-light)",
            borderBottom: "1px solid var(--accent-sage-lt)",
            color: "var(--success)",
            padding: "8px 16px",
            fontSize: "0.72rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0
          }}
        >
          <Check size={12} /> {successMsg}
        </div>
      )}

      {/* Predefined actions bar */}
      <div
        style={{
          padding: "0.75rem 1rem",
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          borderBottom: "1px solid var(--stone-200)",
          background: "var(--stone-50)",
          scrollbarWidth: "none",
          flexShrink: 0
        }}
      >
        <button
          onClick={() => handleAction("explain")}
          disabled={loading}
          style={{
            flexShrink: 0,
            fontSize: "0.7rem",
            fontWeight: 700,
            background: "var(--ivory)",
            border: "1px solid var(--stone-200)",
            padding: "5px 12px",
            borderRadius: "20px",
            cursor: "pointer",
            color: "var(--stone-700)",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          🔍 Explain Code
        </button>
        <button
          onClick={() => handleAction("optimize")}
          disabled={loading}
          style={{
            flexShrink: 0,
            fontSize: "0.7rem",
            fontWeight: 700,
            background: "var(--ivory)",
            border: "1px solid var(--stone-200)",
            padding: "5px 12px",
            borderRadius: "20px",
            cursor: "pointer",
            color: "var(--stone-700)",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          ⚡ Optimize Code
        </button>
        <button
          onClick={() => handleAction("bugs")}
          disabled={loading}
          style={{
            flexShrink: 0,
            fontSize: "0.7rem",
            fontWeight: 700,
            background: "var(--ivory)",
            border: "1px solid var(--stone-200)",
            padding: "5px 12px",
            borderRadius: "20px",
            cursor: "pointer",
            color: "var(--stone-700)",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          🐛 Find Bugs
        </button>
      </div>

      {/* Selected context banner */}
      {selectedText && selectedText.trim().length > 0 && (
        <div
          style={{
            background: "var(--accent-light)",
            borderBottom: "1px solid var(--accent-light)",
            padding: "6px 12px",
            fontSize: "0.68rem",
            color: "var(--accent)",
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0
          }}
        >
          <span>🎯 Highlighted text selected as context ({selectedText.trim().length} chars)</span>
          <span style={{ fontSize: "0.6rem", opacity: 0.7 }}>(Selection will be sent with prompt)</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          style={{
            background: "var(--danger-light)",
            borderBottom: "1px solid var(--danger-light)",
            padding: "10px 14px",
            fontSize: "0.72rem",
            color: "var(--danger)",
            fontWeight: 600,
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            flexShrink: 0
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div style={{ flex: 1, wordBreak: "break-word", lineHeight: 1.4 }}>{error}</div>
          <button
            onClick={() => setError("")}
            style={{
              background: "none",
              border: "none",
              color: "var(--danger)",
              cursor: "pointer",
              fontWeight: 700,
              padding: 0,
              fontFamily: "inherit",
              fontSize: "0.7rem",
              flexShrink: 0,
              marginLeft: "8px"
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Chat scroll workspace */}
      <div
        style={{
          flex: 1,
          padding: "1rem",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          background: "var(--ivory)"
        }}
      >
        {chatHistory.map((msg, index) => {
          const isAi = msg.role === "ai";
          return (
            <div
              key={index}
              style={{
                alignSelf: isAi ? "flex-start" : "flex-end",
                maxWidth: "85%",
                display: "flex",
                flexDirection: "column",
                alignItems: isAi ? "flex-start" : "flex-end"
              }}
            >
              {/* Header metadata */}
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--stone-400)", marginBottom: "4px" }}>
                {isAi ? "🤖 COMPANION" : "👤 YOU"}
              </div>

              {/* Chat bubble */}
              <div
                style={{
                  background: isAi ? "var(--lavender)" : "var(--stone-100)",
                  color: "var(--stone-900)",
                  borderRadius: isAi ? "0px 16px 16px 16px" : "16px 0px 16px 16px",
                  padding: "0.75rem 1rem",
                  fontSize: "0.8125rem",
                  lineHeight: 1.5,
                  boxShadow: "0 1px 2px rgba(42,37,32,0.02)",
                  border: isAi ? "1px solid var(--accent-light)" : "1px solid var(--stone-200)"
                }}
              >
                {isAi ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      code({ inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const codeString = String(children).replace(/\n$/, "");
                        return !inline && match ? (
                          <div style={{ position: "relative", marginTop: "0.5rem", marginBottom: "0.5rem", borderRadius: 8, overflow: "hidden", border: "1px solid var(--stone-200)" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "4px 8px",
                                background: "var(--stone-100)",
                                borderBottom: "1px solid var(--stone-200)",
                                fontSize: "0.65rem",
                                color: "var(--stone-600)"
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>{match[1].toUpperCase()}</span>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(codeString);
                                    alert("Copied to clipboard!");
                                  }}
                                  style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "0.65rem", fontWeight: 700 }}
                                >
                                  📋 Copy
                                </button>
                                {onInsertContent && (
                                  <button
                                    onClick={() => onInsertContent(codeString)}
                                    style={{ background: "none", border: "none", color: "var(--success)", cursor: "pointer", fontSize: "0.65rem", fontWeight: 700 }}
                                    title="Insert code block at active editor cursor"
                                  >
                                    📥 Insert
                                  </button>
                                )}
                                {onReplaceContent && (
                                  <button
                                    onClick={() => onReplaceContent(codeString)}
                                    style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.65rem", fontWeight: 700 }}
                                    title="Overwrite whole editor with this code"
                                  >
                                    📝 Replace
                                  </button>
                                )}
                              </div>
                            </div>
                            <SyntaxHighlighter
                              style={oneLight}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{ margin: 0, padding: "8px 12px", background: "#fdfdfd", fontSize: "0.75rem", fontFamily: "monospace" }}
                              {...props}
                            >
                              {codeString}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code
                            style={{
                              background: "var(--stone-200)",
                              padding: "2px 5px",
                              borderRadius: 4,
                              fontSize: "0.85em",
                              color: "var(--danger)",
                              fontFamily: "monospace"
                            }}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => <p style={{ margin: "0 0 0.5rem 0" }}>{children}</p>,
                      h1: ({ children }) => <h4 style={{ margin: "0.5rem 0 0.3rem 0", color: "var(--stone-900)", fontWeight: 700 }}>{children}</h4>,
                      h2: ({ children }) => <h5 style={{ margin: "0.4rem 0 0.2rem 0", color: "var(--accent)", fontWeight: 700 }}>{children}</h5>,
                      h3: ({ children }) => <h6 style={{ margin: "0.3rem 0 0.1rem 0", color: "var(--stone-700)", fontWeight: 700 }}>{children}</h6>,
                      ul: ({ children }) => <ul style={{ paddingLeft: "1.25rem", margin: "0 0 0.5rem 0" }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ paddingLeft: "1.25rem", margin: "0 0 0.5rem 0" }}>{children}</ol>,
                      li: ({ children }) => <li style={{ marginBottom: "2px" }}>{children}</li>
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                )}
              </div>
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {loading && (
          <div style={{ alignSelf: "flex-start", maxWidth: "85%", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--stone-400)", marginBottom: "4px" }}>
              🤖 COMPANION
            </div>
            <div
              style={{
                background: "var(--lavender)",
                borderRadius: "0px 16px 16px 16px",
                padding: "0.75rem 1rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                border: "1px solid var(--accent-light)",
                boxShadow: "0 1px 2px rgba(42,37,32,0.02)"
              }}
            >
              <Loader2 size={13} className="animate-spin" style={{ color: "var(--accent)" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--stone-500)", fontWeight: 600 }}>AI is thinking…</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSend}
        style={{
          padding: "1rem",
          borderTop: "1px solid var(--stone-200)",
          background: "var(--stone-50)",
          display: "flex",
          gap: "8px",
          alignItems: "flex-end",
          flexShrink: 0
        }}
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask AI Companion..."
          style={{
            flex: 1,
            height: "40px",
            maxHeight: "120px",
            minHeight: "40px",
            borderRadius: "12px",
            border: "1px solid var(--stone-200)",
            padding: "10px 14px",
            fontSize: "0.8125rem",
            resize: "none",
            outline: "none",
            background: "#fff",
            fontFamily: "inherit",
            boxSizing: "border-box"
          }}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          style={{
            background: prompt.trim() && !loading ? "var(--accent)" : "var(--stone-200)",
            color: prompt.trim() && !loading ? "#fff" : "var(--stone-400)",
            border: "none",
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            cursor: prompt.trim() && !loading ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s"
          }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
