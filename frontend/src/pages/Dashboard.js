import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";
import * as calendarService from "../services/calendarService";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

const extractCode = (content) => {
  if (!content) return null;
  const match = content.match(/```(?:[a-zA-Z0-9+#-]+)?\n([\s\S]*?)\n?```/);
  return match ? match[1] : null;
};

/* ─── Reusable Markdown Renderer ─────────────────────────────────── */
function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" {...props}>
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code style={{ background: "#313244", padding: "2px 6px", borderRadius: "4px", fontSize: "0.88em", color: "#f38ba8" }} {...props}>
              {children}
            </code>
          );
        },
        h1: ({ children }) => <h1 style={{ color: "#cdd6f4", fontSize: "1.6rem", fontWeight: "800", borderBottom: "1px solid #45475a", paddingBottom: "0.4em", marginBottom: "0.8em" }}>{children}</h1>,
        h2: ({ children }) => <h2 style={{ color: "#cba6f7", fontSize: "1.3rem", fontWeight: "700", marginBottom: "0.6em" }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ color: "#89dceb", fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.5em" }}>{children}</h3>,
        p:  ({ children }) => <p  style={{ color: "#cdd6f4", lineHeight: "1.75", marginBottom: "0.8em" }}>{children}</p>,
        a:  ({ href, children }) => <a href={href} style={{ color: "#89b4fa", textDecoration: "underline" }} target="_blank" rel="noopener noreferrer">{children}</a>,
        ul: ({ children }) => <ul style={{ color: "#cdd6f4", paddingLeft: "1.5em", marginBottom: "0.8em" }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ color: "#cdd6f4", paddingLeft: "1.5em", marginBottom: "0.8em" }}>{children}</ol>,
        li: ({ children }) => <li style={{ marginBottom: "0.3em" }}>{children}</li>,
        blockquote: ({ children }) => <blockquote style={{ borderLeft: "3px solid #cba6f7", paddingLeft: "1em", color: "#a6adc8", fontStyle: "italic", margin: "0.8em 0" }}>{children}</blockquote>,
        hr: () => <hr style={{ border: "none", borderTop: "1px solid #45475a", margin: "1.2em 0" }} />,
        strong: ({ children }) => <strong style={{ color: "#cdd6f4", fontWeight: "700" }}>{children}</strong>,
        em: ({ children }) => <em style={{ color: "#a6adc8" }}>{children}</em>,
        table: ({ children }) => <div style={{ overflowX: "auto", marginBottom: "1em" }}><table style={{ borderCollapse: "collapse", width: "100%" }}>{children}</table></div>,
        th: ({ children }) => <th style={{ border: "1px solid #45475a", padding: "8px 14px", background: "#313244", color: "#cba6f7", textAlign: "left" }}>{children}</th>,
        td: ({ children }) => <td style={{ border: "1px solid #45475a", padding: "8px 14px", color: "#cdd6f4" }}>{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/* ─── Toolbar Button ──────────────────────────────────────────────── */
function ToolbarBtn({ onClick, title, children, mono }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#313244" : "transparent",
        border: `1px solid ${hovered ? "#cba6f7" : "#45475a"}`,
        borderRadius: "6px",
        color: hovered ? "#cba6f7" : "#a6adc8",
        padding: "4px 9px",
        cursor: "pointer",
        fontSize: mono ? "13px" : "14px",
        fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
        fontWeight: "700",
        transition: "all 0.15s",
        lineHeight: 1,
        userSelect: "none",
      }}
    >
      {children}
    </button>
  );
}

/* ─── Main Dashboard ──────────────────────────────────────────────── */
function Dashboard() {
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  const [title, setTitle]           = useState("");
  const [content, setContent]       = useState("");
  const [notes, setNotes]           = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mode, setMode]             = useState("split"); // "write" | "split" | "preview"
  const [saving, setSaving]         = useState(false);
  const [dashboardReminders, setDashboardReminders] = useState({ today: [], upcoming: [], overdue: [] });

  const fetchNotes = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/getNotes/${email}`);
      setNotes(res.data);
    } catch (e) { console.log(e); }
  }, [email]);

  const fetchReminders = useCallback(async () => {
    try {
      const data = await calendarService.getDashboardReminders();
      setDashboardReminders(data);
    } catch (e) { console.log("Error fetching reminders", e); }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/unreadCount/${email}`);
      setUnreadCount(res.data);
    } catch (e) { console.log(e); }
  }, [email]);

  useEffect(() => {
    if (token && email) {
      fetchNotes();
      fetchUnreadCount();
      fetchReminders();
    }
    const iv = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(iv);
  }, [token, email, fetchNotes, fetchUnreadCount, fetchReminders]);

  if (!token) return <Navigate to="/login" />;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    navigate("/login");
  };

  const handleAddNote = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Please enter both a title and content for your note.");
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/addNote`, { email, title, content });
      setTitle("");
      setContent("");
      fetchNotes();
    } catch (e) {
      console.log(e);
      alert("Failed to add note");
    } finally {
      setSaving(false);
    }
  };

  /* Insert markdown snippet at cursor */
  const insertAtCursor = (before, after = "", placeholder = "") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const sel   = content.substring(start, end) || placeholder;
    const next  = content.substring(0, start) + before + sel + after + content.substring(end);
    setContent(next);
    setTimeout(() => {
      ta.focus();
      const pos = start + before.length + sel.length + after.length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  };

  const toolbarGroups = [
    [
      { label: "H1",  title: "Heading 1",      action: () => insertAtCursor("# ",   "",    "Heading") },
      { label: "H2",  title: "Heading 2",      action: () => insertAtCursor("## ",  "",    "Heading") },
      { label: "H3",  title: "Heading 3",      action: () => insertAtCursor("### ", "",    "Heading") },
    ],
    [
      { label: "B",   title: "Bold",           action: () => insertAtCursor("**",   "**",  "bold") },
      { label: "I",   title: "Italic",         action: () => insertAtCursor("_",    "_",   "italic"), mono: true },
      { label: "~~",  title: "Strikethrough",  action: () => insertAtCursor("~~",   "~~",  "strikethrough"), mono: true },
    ],
    [
      { label: "`",   title: "Inline code",    action: () => insertAtCursor("`",    "`",   "code"), mono: true },
      { label: "```", title: "Code block",     action: () => insertAtCursor("```javascript\n", "\n```", "// code here"), mono: true },
    ],
    [
      { label: "•",   title: "Bullet list",    action: () => insertAtCursor("- ",   "",    "item") },
      { label: "1.",  title: "Numbered list",  action: () => insertAtCursor("1. ",  "",    "item"), mono: true },
      { label: ">",   title: "Blockquote",     action: () => insertAtCursor("> ",   "",    "quote"), mono: true },
    ],
    [
      { label: "—",   title: "Horizontal rule",action: () => insertAtCursor("\n---\n") },
      { label: "🔗",  title: "Link",           action: () => insertAtCursor("[",    "](url)", "link text") },
      { label: "✅",  title: "Checkbox",       action: () => insertAtCursor("- [ ] ", "", "task") },
    ],
  ];

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#11111b", color: "#cdd6f4", fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── Navbar ── */}
      <nav style={{
        background: "rgba(17,17,27,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid #313244", padding: "0 2rem", height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#cba6f7,#89b4fa)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💻</div>
          <span style={{ fontSize: "1.3rem", fontWeight: 800, background: "linear-gradient(135deg,#cba6f7,#89b4fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>DevVault</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "0.8rem", color: "#585b70", background: "#1e1e2e", padding: "5px 12px", borderRadius: 20, border: "1px solid #313244" }}>{email}</span>

          <Link to="/calendar" style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", padding: "7px 14px", borderRadius: 9, textDecoration: "none", fontSize: "0.83rem", fontWeight: 600 }}>
            Calendar
          </Link>

          <Link to="/compiler" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "#fff", padding: "7px 14px", borderRadius: 9, textDecoration: "none", fontSize: "0.83rem", fontWeight: 600 }}>
            Compiler
          </Link>

          <Link to="/previous-notes" style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff", padding: "7px 14px", borderRadius: 9, textDecoration: "none", fontSize: "0.83rem", fontWeight: 600 }}>
            My Notes
          </Link>

          <Link to="/received-notes" style={{ background: "linear-gradient(135deg,#1d4ed8,#1e40af)", color: "#fff", padding: "7px 14px", borderRadius: 9, textDecoration: "none", fontSize: "0.83rem", fontWeight: 600, position: "relative" }}>
            Inbox
            {unreadCount > 0 && (
              <span style={{ position: "absolute", top: -8, right: -8, background: "#f38ba8", color: "#11111b", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>
                {unreadCount}
              </span>
            )}
          </Link>

          <button onClick={handleLogout} style={{ background: "transparent", border: "1px solid #f38ba8", color: "#f38ba8", padding: "7px 14px", borderRadius: 9, cursor: "pointer", fontSize: "0.83rem", fontWeight: 600 }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ padding: "2rem 2.5rem", maxWidth: 1400, margin: "0 auto" }}>

        {/* ── Welcome & Reminders ── */}
        <div style={{ marginBottom: "1.75rem", display: "flex", gap: "2rem", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "0.3rem" }}>Welcome back 👋</h1>
            <p style={{ color: "#585b70", fontSize: "0.9rem" }}>
              {notes.length} note{notes.length !== 1 ? "s" : ""} in your vault
            </p>
          </div>
          
          <div style={{ flex: 2, display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1, background: "#1e1e2e", padding: "1rem", borderRadius: "12px", border: "1px solid #313244", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ background: "rgba(166, 227, 161, 0.2)", color: "#a6e3a1", padding: "0.75rem", borderRadius: "10px" }}><CalendarIcon size={24} /></div>
              <div>
                <div style={{ color: "#a6adc8", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>Today</div>
                <div style={{ color: "#cdd6f4", fontSize: "1.2rem", fontWeight: 700 }}>{dashboardReminders.today.length} Reminders</div>
              </div>
            </div>
            
            <div style={{ flex: 1, background: "#1e1e2e", padding: "1rem", borderRadius: "12px", border: "1px solid #313244", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ background: "rgba(137, 180, 250, 0.2)", color: "#89b4fa", padding: "0.75rem", borderRadius: "10px" }}><Clock size={24} /></div>
              <div>
                <div style={{ color: "#a6adc8", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>Upcoming</div>
                <div style={{ color: "#cdd6f4", fontSize: "1.2rem", fontWeight: 700 }}>{dashboardReminders.upcoming.length} Reminders</div>
              </div>
            </div>

            <div style={{ flex: 1, background: "#1e1e2e", padding: "1rem", borderRadius: "12px", border: "1px solid #313244", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ background: "rgba(243, 139, 168, 0.2)", color: "#f38ba8", padding: "0.75rem", borderRadius: "10px" }}><AlertCircle size={24} /></div>
              <div>
                <div style={{ color: "#a6adc8", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>Overdue</div>
                <div style={{ color: "#cdd6f4", fontSize: "1.2rem", fontWeight: 700 }}>{dashboardReminders.overdue.length} Reminders</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Editor Card ── */}
        <div style={{ background: "#1e1e2e", borderRadius: 16, border: "1px solid #313244", marginBottom: "2.5rem", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>

          {/* Card Header */}
          <div style={{ padding: "0.9rem 1.5rem", borderBottom: "1px solid #313244", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#181825" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1rem" }}>✏️</span>
              <span style={{ fontWeight: 700, color: "#cdd6f4", fontSize: "0.95rem" }}>New Note</span>
            </div>

            {/* Mode Toggle */}
            <div style={{ display: "flex", background: "#11111b", borderRadius: 10, padding: 4, gap: 3, border: "1px solid #313244" }}>
              {[
                { key: "write",   icon: "✏️",  label: "Write" },
                { key: "split",   icon: "⬛",  label: "Split" },
                { key: "preview", icon: "👁️", label: "Preview" },
              ].map(({ key, icon, label }) => (
                <button key={key} onClick={() => setMode(key)} style={{
                  padding: "5px 13px", borderRadius: 7, border: "none", cursor: "pointer",
                  fontSize: "0.78rem", fontWeight: 700, transition: "all 0.2s",
                  background: mode === key ? "linear-gradient(135deg,#cba6f7,#89b4fa)" : "transparent",
                  color: mode === key ? "#11111b" : "#585b70",
                }}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div style={{ padding: "0.9rem 1.5rem", borderBottom: "1px solid #313244" }}>
            <input
              type="text"
              placeholder="Note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: "1.4rem", fontWeight: 700, color: "#cdd6f4", boxSizing: "border-box" }}
            />
          </div>

          {/* Toolbar */}
          {mode !== "preview" && (
            <div style={{ padding: "0.6rem 1.5rem", borderBottom: "1px solid #313244", display: "flex", gap: "0.3rem", flexWrap: "wrap", background: "#181825", alignItems: "center" }}>
              {toolbarGroups.map((group, gi) => (
                <React.Fragment key={gi}>
                  {gi > 0 && <div style={{ width: 1, height: 22, background: "#45475a", margin: "0 0.2rem" }} />}
                  {group.map((item, i) => (
                    <ToolbarBtn key={i} onClick={item.action} title={item.title} mono={item.mono}>
                      {item.label}
                    </ToolbarBtn>
                  ))}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Panes */}
          <div style={{ display: "flex", minHeight: 360 }}>

            {/* Write Pane */}
            {(mode === "write" || mode === "split") && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: mode === "split" ? "1px solid #313244" : "none" }}>
                {mode === "split" && (
                  <div style={{ padding: "0.4rem 1.5rem", background: "#181825", borderBottom: "1px solid #313244", fontSize: "0.7rem", color: "#45475a", fontWeight: 700, letterSpacing: "0.08em" }}>
                    MARKDOWN
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={"Write in Markdown...\n\n# My Heading\n**bold**, _italic_, `code`\n\n```javascript\nconst greet = () => 'Hello DevVault!';\n```"}
                  style={{
                    flex: 1, background: "transparent", border: "none", outline: "none",
                    resize: "none", padding: "1.25rem 1.5rem", color: "#cdd6f4",
                    fontSize: "0.88rem", fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
                    lineHeight: "1.8", minHeight: 320,
                  }}
                />
              </div>
            )}

            {/* Preview Pane */}
            {(mode === "preview" || mode === "split") && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {mode === "split" && (
                  <div style={{ padding: "0.4rem 1.5rem", background: "#181825", borderBottom: "1px solid #313244", fontSize: "0.7rem", color: "#45475a", fontWeight: 700, letterSpacing: "0.08em" }}>
                    PREVIEW
                  </div>
                )}
                <div style={{ flex: 1, padding: "1.25rem 1.5rem", overflowY: "auto", minHeight: 320 }}>
                  {content ? (
                    <MarkdownRenderer content={content} />
                  ) : (
                    <div style={{ color: "#45475a", textAlign: "center", marginTop: "5rem" }}>
                      <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>👁️</div>
                      <p style={{ fontSize: "0.9rem" }}>Preview appears here as you type...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div style={{ padding: "0.75rem 1.5rem", borderTop: "1px solid #313244", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#181825" }}>
            <span style={{ fontSize: "0.75rem", color: "#45475a" }}>
              {wordCount} word{wordCount !== 1 ? "s" : ""} · {content.length} chars
            </span>
            <button
              onClick={handleAddNote}
              disabled={saving}
              style={{
                background: saving ? "#313244" : "linear-gradient(135deg,#cba6f7,#89b4fa)",
                color: saving ? "#585b70" : "#11111b",
                border: "none", padding: "9px 26px", borderRadius: 10,
                fontWeight: 700, fontSize: "0.88rem", cursor: saving ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {saving ? "Saving..." : "💾 Save Note"}
            </button>
          </div>
        </div>

        {/* ── Recent Notes Grid ── */}
        {notes.length > 0 ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.1rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Recent Notes</h2>
              <Link to="/previous-notes" style={{ color: "#cba6f7", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
                View all →
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1rem" }}>
              {notes.slice(0, 6).map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "4rem", color: "#45475a" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem" }}>📝</div>
            <p>Write your first note above to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NoteCard({ note }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  // eslint-disable-next-line no-useless-escape
  const preview = note.content.replace(/```[\s\S]*?```/g, "[code]").replace(/[#*`>_~\[\]]/g, "").trim();
  const extractedCode = extractCode(note.content);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#1e1e2e", borderRadius: 14,
        border: `1px solid ${hovered ? "#cba6f7" : "#313244"}`,
        padding: "1.1rem 1.25rem",
        transition: "all 0.2s",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "0 10px 40px rgba(203,166,247,0.15)" : "none",
        cursor: "default",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.5rem", color: "#cdd6f4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {note.title}
        </h3>
        <p style={{ fontSize: "0.8rem", color: "#585b70", lineHeight: "1.55", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
          {preview || "No content preview available."}
        </p>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.8rem" }}>
        <Link to="/previous-notes" style={{ color: "#cba6f7", fontSize: "0.78rem", textDecoration: "none", fontWeight: 600 }}>
          Edit / Share →
        </Link>
        {extractedCode && (
          <button
            onClick={() => navigate("/compiler", { state: { code: extractedCode } })}
            style={{
              background: "transparent", border: "1px solid #10b981", color: "#10b981",
              padding: "4px 10px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 700,
              cursor: "pointer", transition: "all 0.2s"
            }}
            onMouseEnter={(e) => { e.target.style.background = "#10b981"; e.target.style.color = "#11111b"; }}
            onMouseLeave={(e) => { e.target.style.background = "transparent"; e.target.style.color = "#10b981"; }}
          >
            Run Code ⚡
          </button>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
