import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { Navigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

/* ─── Markdown Renderer ─────────────────────────────────────────── */
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
        h1: ({ children }) => <h1 style={{ color: "#cdd6f4", fontSize: "1.5rem", fontWeight: "800", borderBottom: "1px solid #45475a", paddingBottom: "0.3em", marginBottom: "0.7em" }}>{children}</h1>,
        h2: ({ children }) => <h2 style={{ color: "#cba6f7", fontSize: "1.2rem", fontWeight: "700" }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ color: "#89dceb", fontSize: "1rem", fontWeight: "700" }}>{children}</h3>,
        p:  ({ children }) => <p  style={{ color: "#cdd6f4", lineHeight: "1.75", marginBottom: "0.8em" }}>{children}</p>,
        a:  ({ href, children }) => <a href={href} style={{ color: "#89b4fa", textDecoration: "underline" }} target="_blank" rel="noopener noreferrer">{children}</a>,
        ul: ({ children }) => <ul style={{ color: "#cdd6f4", paddingLeft: "1.5em", marginBottom: "0.8em" }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ color: "#cdd6f4", paddingLeft: "1.5em", marginBottom: "0.8em" }}>{children}</ol>,
        li: ({ children }) => <li style={{ marginBottom: "0.3em" }}>{children}</li>,
        blockquote: ({ children }) => <blockquote style={{ borderLeft: "3px solid #cba6f7", paddingLeft: "1em", color: "#a6adc8", fontStyle: "italic", margin: "0.8em 0" }}>{children}</blockquote>,
        hr: () => <hr style={{ border: "none", borderTop: "1px solid #45475a", margin: "1em 0" }} />,
        strong: ({ children }) => <strong style={{ color: "#cdd6f4", fontWeight: "700" }}>{children}</strong>,
        table: ({ children }) => <div style={{ overflowX: "auto" }}><table style={{ borderCollapse: "collapse", width: "100%", marginBottom: "0.8em" }}>{children}</table></div>,
        th: ({ children }) => <th style={{ border: "1px solid #45475a", padding: "8px 12px", background: "#313244", color: "#cba6f7" }}>{children}</th>,
        td: ({ children }) => <td style={{ border: "1px solid #45475a", padding: "8px 12px", color: "#cdd6f4" }}>{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/* ─── Toolbar Button ────────────────────────────────────────────── */
function ToolbarBtn({ onClick, title, children, mono }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick} title={title}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: h ? "#313244" : "transparent",
        border: `1px solid ${h ? "#cba6f7" : "#45475a"}`,
        borderRadius: "6px", color: h ? "#cba6f7" : "#a6adc8",
        padding: "3px 8px", cursor: "pointer",
        fontSize: mono ? "12px" : "13px",
        fontFamily: mono ? "monospace" : "inherit",
        fontWeight: 700, transition: "all 0.15s", userSelect: "none",
      }}
    >
      {children}
    </button>
  );
}

/* ─── Inline Edit Panel ─────────────────────────────────────────── */
function EditPanel({ note, onSave, onCancel }) {
  const [editTitle,   setEditTitle]   = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);
  const [mode,        setMode]        = useState("split");
  const taRef = useRef(null);

  const insertAtCursor = (before, after = "", placeholder = "") => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = editContent.substring(s, e) || placeholder;
    setEditContent(editContent.substring(0, s) + before + sel + after + editContent.substring(e));
    setTimeout(() => { ta.focus(); const p = s + before.length + sel.length + after.length; ta.setSelectionRange(p, p); }, 0);
  };

  const toolbarGroups = [
    [
      { label: "H1",  title: "Heading 1",     action: () => insertAtCursor("# ",   "",   "Heading") },
      { label: "H2",  title: "Heading 2",     action: () => insertAtCursor("## ",  "",   "Heading") },
    ],
    [
      { label: "B",   title: "Bold",          action: () => insertAtCursor("**",   "**", "bold") },
      { label: "I",   title: "Italic",        action: () => insertAtCursor("_",    "_",  "italic"), mono: true },
    ],
    [
      { label: "`",   title: "Inline code",   action: () => insertAtCursor("`",    "`",  "code"), mono: true },
      { label: "```", title: "Code block",    action: () => insertAtCursor("```javascript\n", "\n```", "// code"), mono: true },
    ],
    [
      { label: "•",   title: "Bullet list",   action: () => insertAtCursor("- ",   "",   "item") },
      { label: ">",   title: "Blockquote",    action: () => insertAtCursor("> ",   "",   "quote"), mono: true },
      { label: "🔗",  title: "Link",          action: () => insertAtCursor("[",    "](url)", "link") },
    ],
  ];

  return (
    <div style={{ background: "#181825", borderRadius: 14, border: "1px solid #45475a", overflow: "hidden", marginBottom: "0.5rem" }}>
      {/* Edit Header */}
      <div style={{ padding: "0.7rem 1.2rem", background: "#11111b", borderBottom: "1px solid #313244", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#cba6f7", letterSpacing: "0.05em" }}>✏️ EDITING</span>
        <div style={{ display: "flex", background: "#1e1e2e", borderRadius: 8, padding: 3, gap: 2 }}>
          {[{ key: "write", icon: "✏️" }, { key: "split", icon: "⬛" }, { key: "preview", icon: "👁️" }].map(({ key, icon }) => (
            <button key={key} onClick={() => setMode(key)} style={{
              padding: "3px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700,
              background: mode === key ? "linear-gradient(135deg,#cba6f7,#89b4fa)" : "transparent",
              color: mode === key ? "#11111b" : "#585b70", transition: "all 0.15s",
            }}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div style={{ padding: "0.6rem 1.2rem", borderBottom: "1px solid #313244" }}>
        <input
          type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
          style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: "1.1rem", fontWeight: 700, color: "#cdd6f4", boxSizing: "border-box" }}
        />
      </div>

      {/* Toolbar */}
      {mode !== "preview" && (
        <div style={{ padding: "0.5rem 1.2rem", borderBottom: "1px solid #313244", display: "flex", gap: "0.25rem", flexWrap: "wrap", alignItems: "center" }}>
          {toolbarGroups.map((grp, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && <div style={{ width: 1, height: 18, background: "#45475a", margin: "0 0.15rem" }} />}
              {grp.map((item, i) => <ToolbarBtn key={i} onClick={item.action} title={item.title} mono={item.mono}>{item.label}</ToolbarBtn>)}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Panes */}
      <div style={{ display: "flex", minHeight: 260 }}>
        {(mode === "write" || mode === "split") && (
          <div style={{ flex: 1, borderRight: mode === "split" ? "1px solid #313244" : "none", display: "flex", flexDirection: "column" }}>
            {mode === "split" && <div style={{ padding: "0.3rem 1.2rem", background: "#11111b", borderBottom: "1px solid #313244", fontSize: "0.65rem", color: "#45475a", fontWeight: 700, letterSpacing: "0.08em" }}>MARKDOWN</div>}
            <textarea
              ref={taRef} value={editContent} onChange={(e) => setEditContent(e.target.value)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", padding: "1rem 1.2rem", color: "#cdd6f4", fontSize: "0.85rem", fontFamily: "monospace", lineHeight: "1.75", minHeight: 220 }}
            />
          </div>
        )}
        {(mode === "preview" || mode === "split") && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {mode === "split" && <div style={{ padding: "0.3rem 1.2rem", background: "#11111b", borderBottom: "1px solid #313244", fontSize: "0.65rem", color: "#45475a", fontWeight: 700, letterSpacing: "0.08em" }}>PREVIEW</div>}
            <div style={{ flex: 1, padding: "1rem 1.2rem", overflowY: "auto", minHeight: 220 }}>
              {editContent ? <MarkdownRenderer content={editContent} /> : <p style={{ color: "#45475a", fontSize: "0.85rem" }}>Preview appears here...</p>}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: "0.75rem 1.2rem", borderTop: "1px solid #313244", display: "flex", gap: "0.6rem", justifyContent: "flex-end", background: "#11111b" }}>
        <button onClick={onCancel} style={{ background: "transparent", border: "1px solid #45475a", color: "#a6adc8", padding: "7px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
          Cancel
        </button>
        <button onClick={() => onSave(editTitle, editContent)} style={{ background: "linear-gradient(135deg,#cba6f7,#89b4fa)", color: "#11111b", border: "none", padding: "7px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>
          💾 Save Changes
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
function PreviousNotes() {
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");

  const [notes,        setNotes]        = useState([]);
  const [editingId,    setEditingId]    = useState(null);
  const [users,        setUsers]        = useState([]);
  const [showShareBox, setShowShareBox] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  const fetchNotes = useCallback(async () => {
    try { const r = await axios.get(`${API_BASE}/getNotes/${email}`); setNotes(r.data); }
    catch (e) { console.log(e); }
  }, [email]);

  const fetchUsers = useCallback(async () => {
    try { const r = await axios.get(`${API_BASE}/users`); setUsers(r.data); }
    catch (e) { console.log(e); }
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try { await axios.delete(`${API_BASE}/deleteNote/${id}`); fetchNotes(); }
    catch (e) { console.log(e); alert("Failed to delete note"); }
  };

  const handleUpdate = async (id, newTitle, newContent) => {
    if (!newTitle.trim() || !newContent.trim()) { alert("Title and content cannot be empty."); return; }
    try {
      await axios.put(`${API_BASE}/updateNote/${id}`, { title: newTitle, content: newContent });
      setEditingId(null);
      fetchNotes();
    } catch (e) { console.log(e); alert("Failed to update note"); }
  };

  const handleSendNote = async (receiverEmail) => {
    try {
      await axios.post(`${API_BASE}/shareNote`, { senderEmail: email, receiverEmail, title: selectedNote.title, content: selectedNote.content });
      setShowShareBox(false);
      alert("Note shared successfully 🚀");
    } catch (e) { console.log(e); alert("Failed to share note"); }
  };

  useEffect(() => { fetchNotes(); fetchUsers(); }, [fetchNotes, fetchUsers]);

  if (!token) return <Navigate to="/login" />;

  return (
    <div style={{ minHeight: "100vh", background: "#11111b", color: "#cdd6f4", fontFamily: "'Inter',-apple-system,sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ background: "rgba(17,17,27,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid #313244", padding: "0 2.5rem", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#cba6f7,#89b4fa)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>🔥</div>
          <h1 style={{ fontSize: "1.1rem", fontWeight: 800, background: "linear-gradient(135deg,#cba6f7,#89b4fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            My Notes
          </h1>
          <span style={{ color: "#45475a", fontSize: "0.85rem" }}>· {notes.length} total</span>
        </div>
        <Link to="/dashboard" style={{ background: "#313244", color: "#cdd6f4", padding: "7px 16px", borderRadius: 9, textDecoration: "none", fontSize: "0.83rem", fontWeight: 600 }}>
          ← Dashboard
        </Link>
      </div>

      <div style={{ padding: "2rem 2.5rem", maxWidth: 1400, margin: "0 auto" }}>

        {notes.length === 0 && (
          <div style={{ textAlign: "center", padding: "5rem", color: "#45475a" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem" }}>📝</div>
            <p>No notes yet. Head to the Dashboard to add your first note!</p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: "1.25rem" }}>
          {notes.map((note) =>
            editingId === note.id ? (
              /* Edit Mode */
              <div key={note.id} style={{ gridColumn: "1 / -1" }}>
                <EditPanel
                  note={note}
                  onSave={(t, c) => handleUpdate(note.id, t, c)}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              /* View Mode */
              <NoteViewCard
                key={note.id}
                note={note}
                onEdit={() => setEditingId(note.id)}
                onDelete={() => handleDelete(note.id)}
                onShare={() => { setSelectedNote(note); setShowShareBox(true); }}
              />
            )
          )}
        </div>
      </div>

      {/* ── Share Modal ── */}
      {showShareBox && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#1e1e2e", borderRadius: 16, padding: "2rem", width: 380, border: "1px solid #313244", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.4rem" }}>Share Note 🚀</h2>
            <p style={{ color: "#585b70", fontSize: "0.82rem", marginBottom: "1.25rem" }}>
              "{selectedNote?.title}"
            </p>
            <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {users.filter((u) => u.email !== email).map((u) => (
                <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#313244", padding: "0.6rem 0.9rem", borderRadius: 9 }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#585b70" }}>{u.email}</div>
                  </div>
                  <button onClick={() => handleSendNote(u.email)} style={{ background: "linear-gradient(135deg,#1d4ed8,#1e40af)", color: "#fff", border: "none", padding: "5px 14px", borderRadius: 7, cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
                    Send
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowShareBox(false)} style={{ marginTop: "1.25rem", width: "100%", background: "transparent", border: "1px solid #45475a", color: "#a6adc8", padding: "9px", borderRadius: 9, cursor: "pointer", fontWeight: 600 }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Note View Card ────────────────────────────────────────────── */
function NoteViewCard({ note, onEdit, onDelete, onShare }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#1e1e2e", borderRadius: 14,
        border: `1px solid ${hovered ? "#cba6f7" : "#313244"}`,
        overflow: "hidden", transition: "all 0.2s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 12px 40px rgba(203,166,247,0.12)" : "none",
        display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ padding: "1.1rem 1.25rem", flex: 1 }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", color: "#cdd6f4" }}>{note.title}</h2>
        <div style={{ fontSize: "0.82rem", color: "#a6adc8", maxHeight: "120px", overflow: "hidden" }}>
          <MarkdownRenderer content={note.content.substring(0, 300) + (note.content.length > 300 ? "..." : "")} />
        </div>
      </div>
      <div style={{ padding: "0.8rem 1.25rem", borderTop: "1px solid #313244", display: "flex", gap: "0.5rem" }}>
        <button onClick={onEdit}   style={{ flex: 1, background: "#313244", border: "none", color: "#cba6f7", padding: "7px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}>✏️ Edit</button>
        <button onClick={onShare}  style={{ flex: 1, background: "#313244", border: "none", color: "#89b4fa", padding: "7px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}>📤 Share</button>
        <button onClick={onDelete} style={{ background: "transparent", border: "1px solid #f38ba8", color: "#f38ba8", padding: "7px 10px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}>🗑️</button>
      </div>
    </div>
  );
}

export default PreviousNotes;
