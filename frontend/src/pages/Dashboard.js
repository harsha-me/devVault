import React, { useEffect, useState, useCallback, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { ChevronRight, Zap } from "lucide-react";
import * as calendarService from "../services/calendarService";
import Sidebar from "../components/Sidebar";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

const extractCode = (content) => {
  if (!content) return null;
  const match = content.match(/```(?:[a-zA-Z0-9+#-]+)?\n([\s\S]*?)\n?```/);
  return match ? match[1] : null;
};

/* ── Warm Markdown Renderer ─────────────────────────────────── */
function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <SyntaxHighlighter style={oneLight} language={match[1]} PreTag="div" {...props}>
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code style={{ background: 'var(--stone-100)', padding: '2px 7px', borderRadius: 6, fontSize: '0.85em', color: 'var(--accent)', fontFamily: 'monospace' }} {...props}>
              {children}
            </code>
          );
        },
        h1: ({ children }) => <h1 style={{ color: 'var(--stone-900)', fontSize: '1.5rem', fontWeight: 800, borderBottom: '1px solid var(--stone-200)', paddingBottom: '0.4em', marginBottom: '0.8em' }}>{children}</h1>,
        h2: ({ children }) => <h2 style={{ color: 'var(--accent)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.6em' }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ color: 'var(--accent-sage)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5em' }}>{children}</h3>,
        p:  ({ children }) => <p  style={{ color: 'var(--stone-700)', lineHeight: 1.75, marginBottom: '0.8em' }}>{children}</p>,
        a:  ({ href, children }) => <a href={href} style={{ color: 'var(--accent)', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">{children}</a>,
        ul: ({ children }) => <ul style={{ color: 'var(--stone-700)', paddingLeft: '1.5em', marginBottom: '0.8em' }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ color: 'var(--stone-700)', paddingLeft: '1.5em', marginBottom: '0.8em' }}>{children}</ol>,
        li: ({ children }) => <li style={{ marginBottom: '0.3em' }}>{children}</li>,
        blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid var(--stone-300)', paddingLeft: '1em', color: 'var(--stone-500)', fontStyle: 'italic', margin: '0.8em 0' }}>{children}</blockquote>,
        hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--stone-200)', margin: '1.2em 0' }} />,
        strong: ({ children }) => <strong style={{ color: 'var(--stone-900)', fontWeight: 700 }}>{children}</strong>,
        table: ({ children }) => <div style={{ overflowX: 'auto', marginBottom: '1em' }}><table style={{ borderCollapse: 'collapse', width: '100%' }}>{children}</table></div>,
        th: ({ children }) => <th style={{ border: '1px solid var(--stone-200)', padding: '8px 14px', background: 'var(--stone-100)', color: 'var(--stone-700)', textAlign: 'left' }}>{children}</th>,
        td: ({ children }) => <td style={{ border: '1px solid var(--stone-200)', padding: '8px 14px', color: 'var(--stone-700)' }}>{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/* ── Toolbar Button ─────────────────────────────────────────── */
function ToolbarBtn({ onClick, title, children, mono }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--stone-200)' : 'transparent',
        border: `1px solid ${hovered ? 'var(--stone-300)' : 'var(--stone-200)'}`,
        borderRadius: 8, color: hovered ? 'var(--stone-900)' : 'var(--stone-500)',
        padding: '4px 9px', cursor: 'pointer',
        fontSize: mono ? '12px' : '13px',
        fontFamily: mono ? "'JetBrains Mono','Fira Code',monospace" : 'inherit',
        fontWeight: 700, transition: 'all 0.15s', userSelect: 'none',
      }}
    >
      {children}
    </button>
  );
}

/* ── Note Card ──────────────────────────────────────────────── */
function NoteCard({ note }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  // eslint-disable-next-line no-useless-escape
  const preview = note.content.replace(/```[\s\S]*?```/g, "[code]").replace(/[#*`>_~\[\]]/g, "").trim();
  const extractedCode = extractCode(note.content);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="dv-card dv-card-hover"
      style={{
        padding: '1.25rem', display: 'flex', flexDirection: 'column',
        background: hovered ? 'var(--stone-50)' : 'var(--cream)',
        borderColor: hovered ? 'var(--stone-300)' : 'var(--stone-200)',
        cursor: 'default',
      }}
    >
      <h3 style={{
        fontSize: '0.9375rem', fontWeight: 700,
        color: 'var(--stone-900)', marginBottom: '0.5rem',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {note.title}
      </h3>
      <p style={{
        fontSize: '0.8125rem', color: 'var(--stone-400)', lineHeight: 1.6,
        overflow: 'hidden', display: '-webkit-box',
        WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
        flex: 1, marginBottom: '0.875rem',
      }}>
        {preview || "No content preview available."}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => navigate('/previous-notes')}
          style={{
            background: 'none', border: 'none', color: 'var(--accent)',
            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            padding: 0, display: 'flex', alignItems: 'center', gap: 3,
            fontFamily: 'inherit',
          }}
        >
          Edit / Share <ChevronRight size={13} />
        </button>
        {extractedCode && (
          <button
            onClick={() => navigate('/compiler', { state: { code: extractedCode } })}
            style={{
              background: 'var(--success-light)', border: '1px solid var(--accent-sage-lt)',
              color: 'var(--success)', padding: '4px 10px', borderRadius: 8,
              fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-sage-lt)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--success-light)'; }}
          >
            <Zap size={11} fill="currentColor" /> Run
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Dashboard ──────────────────────────────────────────────── */
function Dashboard() {
  const token    = localStorage.getItem("token");
  const email    = localStorage.getItem("email");
  const textareaRef = useRef(null);

  const [title,              setTitle]              = useState("");
  const [content,            setContent]            = useState("");
  const [notes,              setNotes]              = useState([]);
  const [unreadCount,        setUnreadCount]        = useState(0);
  const [mode,               setMode]               = useState("split");
  const [saving,             setSaving]             = useState(false);
  const [dashboardReminders, setDashboardReminders] = useState({ today: [], upcoming: [], overdue: [] });

  const fetchNotes = useCallback(async () => {
    try { const res = await axios.get(`${API_BASE}/getNotes/${email}`); setNotes(res.data); }
    catch (e) { console.log(e); }
  }, [email]);

  const fetchReminders = useCallback(async () => {
    try { const data = await calendarService.getDashboardReminders(); setDashboardReminders(data); }
    catch (e) { console.log("Error fetching reminders", e); }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try { const res = await axios.get(`${API_BASE}/unreadCount/${email}`); setUnreadCount(res.data); }
    catch (e) { console.log(e); }
  }, [email]);

  useEffect(() => {
    if (token && email) { fetchNotes(); fetchUnreadCount(); fetchReminders(); }
    const iv = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(iv);
  }, [token, email, fetchNotes, fetchUnreadCount, fetchReminders]);

  if (!token) return <Navigate to="/login" />;

  const handleAddNote = async () => {
    if (!title.trim() || !content.trim()) { alert("Please enter both a title and content for your note."); return; }
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/addNote`, { email, title, content });
      setTitle(""); setContent(""); fetchNotes();
    } catch (e) { console.log(e); alert("Failed to add note"); }
    finally { setSaving(false); }
  };

  const insertAtCursor = (before, after = "", placeholder = "") => {
    const ta = textareaRef.current; if (!ta) return;
    const start = ta.selectionStart; const end = ta.selectionEnd;
    const sel  = content.substring(start, end) || placeholder;
    const next = content.substring(0, start) + before + sel + after + content.substring(end);
    setContent(next);
    setTimeout(() => { ta.focus(); const pos = start + before.length + sel.length + after.length; ta.setSelectionRange(pos, pos); }, 0);
  };

  const toolbarGroups = [
    [
      { label: "H1", title: "Heading 1", action: () => insertAtCursor("# ", "", "Heading") },
      { label: "H2", title: "Heading 2", action: () => insertAtCursor("## ", "", "Heading") },
      { label: "H3", title: "Heading 3", action: () => insertAtCursor("### ", "", "Heading") },
    ],
    [
      { label: "B",  title: "Bold",          action: () => insertAtCursor("**", "**", "bold") },
      { label: "I",  title: "Italic",        action: () => insertAtCursor("_", "_", "italic"), mono: true },
      { label: "~~", title: "Strikethrough", action: () => insertAtCursor("~~", "~~", "strikethrough"), mono: true },
    ],
    [
      { label: "`",   title: "Inline code", action: () => insertAtCursor("`", "`", "code"), mono: true },
      { label: "```", title: "Code block",  action: () => insertAtCursor("```javascript\n", "\n```", "// code here"), mono: true },
    ],
    [
      { label: "•",  title: "Bullet list",    action: () => insertAtCursor("- ", "", "item") },
      { label: "1.", title: "Numbered list",  action: () => insertAtCursor("1. ", "", "item"), mono: true },
      { label: ">",  title: "Blockquote",     action: () => insertAtCursor("> ", "", "quote"), mono: true },
    ],
    [
      { label: "—",  title: "Horizontal rule", action: () => insertAtCursor("\n---\n") },
      { label: "🔗", title: "Link",            action: () => insertAtCursor("[", "](url)", "link text") },
      { label: "✅", title: "Checkbox",        action: () => insertAtCursor("- [ ] ", "", "task") },
    ],
  ];

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  /* Greeting */
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const timeEmoji = hour < 12 ? "☀️" : hour < 17 ? "🌤️" : "🌙";
  const rawName   = (email || "").split("@")[0].split(".")[0];
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const statItems = [
    { label: "Notes", value: notes.length,                         bg: 'var(--stone-100)', border: 'var(--stone-200)',  color: 'var(--stone-600)', icon: "📝" },
    { label: "Today", value: dashboardReminders.today.length,      bg: 'var(--sage)',       border: '#C8E4CC',           color: '#3D7A52',          icon: "🌿" },
    { label: "Upcoming",value: dashboardReminders.upcoming.length, bg: 'var(--pale-blue)', border: '#C4DCF8',           color: '#2E6BAA',          icon: "⏳" },
    { label: "Overdue", value: dashboardReminders.overdue.length,  bg: 'var(--peach)',     border: '#FDDCC4',           color: '#A0522D',          icon: "⚠️" },
  ];

  return (
    <div className="dv-page">
      <Sidebar unreadCount={unreadCount} />

      <main className="dv-main">
        <div className="dv-content dv-fade-up">

          {/* ── Greeting ── */}
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--stone-900)', letterSpacing: '-0.025em', marginBottom: '0.25rem', lineHeight: 1.2 }}>
                {greeting}, {firstName} {timeEmoji}
              </h1>
              <p style={{ color: 'var(--stone-400)', fontSize: '0.875rem' }}>
                {dateLabel} · {notes.length} note{notes.length !== 1 ? 's' : ''} in your vault
              </p>
            </div>
            <div style={{
              fontSize: '0.75rem', color: 'var(--stone-500)', fontWeight: 500,
              background: 'var(--stone-100)', padding: '6px 14px',
              borderRadius: 20, border: '1px solid var(--stone-200)',
            }}>
              {email}
            </div>
          </div>

          {/* ── Stats row ── */}
          <div className="dv-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.875rem', marginBottom: '2rem' }}>
            {statItems.map(({ label, value, bg, border, color, icon }) => (
              <div key={label} className="dv-stat dv-fade-up" style={{ background: bg, borderColor: border }}>
                <span style={{ fontSize: '1.375rem' }}>{icon}</span>
                <div>
                  <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--stone-900)', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color, marginTop: 2 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Note Editor ── */}
          <div className="dv-card" style={{ marginBottom: '2.25rem', overflow: 'hidden' }}>

            {/* Card header */}
            <div style={{
              padding: '0.875rem 1.5rem', borderBottom: '1px solid var(--stone-200)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--stone-50)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem' }}>✏️</span>
                <span style={{ fontWeight: 700, color: 'var(--stone-700)', fontSize: '0.875rem' }}>New Note</span>
              </div>
              {/* Mode toggle */}
              <div style={{ display: 'flex', background: 'var(--stone-100)', borderRadius: 10, padding: 3, gap: 2, border: '1px solid var(--stone-200)' }}>
                {[
                  { key: 'write',   label: 'Write',   icon: '✏️' },
                  { key: 'split',   label: 'Split',   icon: '⬛' },
                  { key: 'preview', label: 'Preview', icon: '👁️' },
                ].map(({ key, icon, label }) => (
                  <button key={key} onClick={() => setMode(key)} style={{
                    padding: '5px 13px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.18s',
                    background: mode === key ? 'var(--cream)' : 'transparent',
                    color: mode === key ? 'var(--stone-900)' : 'var(--stone-400)',
                    boxShadow: mode === key ? '0 1px 4px rgba(74,69,64,0.1)' : 'none',
                    fontFamily: 'inherit',
                  }}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--stone-200)' }}>
              <input
                type="text" placeholder="Note title…"
                value={title} onChange={e => setTitle(e.target.value)}
                style={{
                  width: '100%', background: 'transparent', border: 'none',
                  outline: 'none', fontSize: '1.25rem', fontWeight: 700,
                  color: 'var(--stone-900)', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Toolbar */}
            {mode !== 'preview' && (
              <div style={{
                padding: '0.5rem 1.5rem', borderBottom: '1px solid var(--stone-200)',
                display: 'flex', gap: '0.25rem', flexWrap: 'wrap',
                background: 'var(--stone-50)', alignItems: 'center',
              }}>
                {toolbarGroups.map((group, gi) => (
                  <React.Fragment key={gi}>
                    {gi > 0 && <div style={{ width: 1, height: 20, background: 'var(--stone-200)', margin: '0 0.2rem' }} />}
                    {group.map((item, i) => (
                      <ToolbarBtn key={i} onClick={item.action} title={item.title} mono={item.mono}>{item.label}</ToolbarBtn>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Panes */}
            <div style={{ display: 'flex', minHeight: 300 }}>
              {(mode === 'write' || mode === 'split') && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: mode === 'split' ? '1px solid var(--stone-200)' : 'none' }}>
                  {mode === 'split' && (
                    <div style={{ padding: '0.3rem 1.5rem', background: 'var(--stone-50)', borderBottom: '1px solid var(--stone-200)', fontSize: '0.65rem', color: 'var(--stone-400)', fontWeight: 700, letterSpacing: '0.08em' }}>
                      MARKDOWN
                    </div>
                  )}
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={"Write in Markdown…\n\n# My Heading\n**bold**, _italic_, `code`\n\n```javascript\nconst greet = () => 'Hello DevVault!';\n```"}
                    style={{
                      flex: 1, background: 'transparent', border: 'none',
                      outline: 'none', resize: 'none',
                      padding: '1.25rem 1.5rem', color: 'var(--stone-700)',
                      fontSize: '0.875rem',
                      fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
                      lineHeight: '1.8', minHeight: 260,
                    }}
                  />
                </div>
              )}
              {(mode === 'preview' || mode === 'split') && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {mode === 'split' && (
                    <div style={{ padding: '0.3rem 1.5rem', background: 'var(--stone-50)', borderBottom: '1px solid var(--stone-200)', fontSize: '0.65rem', color: 'var(--stone-400)', fontWeight: 700, letterSpacing: '0.08em' }}>
                      PREVIEW
                    </div>
                  )}
                  <div style={{ flex: 1, padding: '1.25rem 1.5rem', overflowY: 'auto', minHeight: 260 }}>
                    {content ? <MarkdownRenderer content={content} /> : (
                      <div style={{ color: 'var(--stone-300)', textAlign: 'center', marginTop: '4rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👁️</div>
                        <p style={{ fontSize: '0.875rem' }}>Preview appears here as you type…</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '0.75rem 1.5rem', borderTop: '1px solid var(--stone-200)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--stone-50)',
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--stone-400)' }}>
                {wordCount} word{wordCount !== 1 ? 's' : ''} · {content.length} chars
              </span>
              <button
                onClick={handleAddNote}
                disabled={saving}
                className="dv-btn dv-btn-primary"
                style={{ padding: '9px 22px', borderRadius: 12 }}
              >
                {saving ? 'Saving…' : '💾 Save Note'}
              </button>
            </div>
          </div>

          {/* ── Recent Notes ── */}
          {notes.length > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.125rem' }}>
                <h2 className="dv-section-heading">Recent Notes</h2>
                <button
                  onClick={() => window.location.href = '/previous-notes'}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}
                >
                  View all <ChevronRight size={14} />
                </button>
              </div>
              <div className="dv-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
                {notes.slice(0, 6).map(note => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </>
          ) : (
            <div className="dv-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
              <p style={{ color: 'var(--stone-400)', fontSize: '0.9375rem' }}>
                Write your first note above to get started.
              </p>
              <p style={{ color: 'var(--stone-300)', fontSize: '0.825rem', marginTop: '0.5rem' }}>
                Your vault is ready and waiting 🌿
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
