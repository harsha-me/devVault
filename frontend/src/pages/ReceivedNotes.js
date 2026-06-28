import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { X, Zap, Mail } from "lucide-react";
import Sidebar from "../components/Sidebar";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

const extractCode = (content) => {
  if (!content) return null;
  const match = content.match(/```(?:[a-zA-Z0-9+#-]+)?\n([\s\S]*?)\n?```/);
  return match ? match[1] : null;
};

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
            <code style={{ background: 'var(--stone-100)', padding: '2px 7px', borderRadius: 6, fontSize: '0.85em', color: 'var(--accent)', fontFamily: 'monospace' }} {...props}>{children}</code>
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
        strong: ({ children }) => <strong style={{ color: 'var(--stone-900)', fontWeight: 700 }}>{children}</strong>,
        table: ({ children }) => <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '0.8em' }}>{children}</table></div>,
        th: ({ children }) => <th style={{ border: '1px solid var(--stone-200)', padding: '8px 14px', background: 'var(--stone-100)', color: 'var(--stone-700)', textAlign: 'left' }}>{children}</th>,
        td: ({ children }) => <td style={{ border: '1px solid var(--stone-200)', padding: '8px 14px', color: 'var(--stone-700)' }}>{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/* ── Sender avatar initials ─────────────────────────────────── */
function Avatar({ email, size = 36 }) {
  const initials = (email || "?").substring(0, 2).toUpperCase();
  const hue = (email || "").charCodeAt(0) * 37 % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `hsl(${hue},45%,88%)`,
      color: `hsl(${hue},40%,40%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

/* ── ReceivedNotes Page ─────────────────────────────────────── */
function ReceivedNotes() {
  const token    = localStorage.getItem("token");
  const email    = localStorage.getItem("email");
  const navigate = useNavigate();

  const [receivedNotes, setReceivedNotes] = useState([]);
  const [selectedNote,  setSelectedNote]  = useState(null);

  const markAsRead = useCallback(async () => {
    try { await axios.put(`${API_BASE}/markAsRead/${email}`); }
    catch (error) { console.log(error); }
  }, [email]);

  const fetchReceivedNotes = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/receivedNotes/${email}`);
      setReceivedNotes(response.data);
      await markAsRead();
    } catch (error) { console.log(error); }
  }, [email, markAsRead]);

  useEffect(() => { fetchReceivedNotes(); }, [fetchReceivedNotes]);

  if (!token) return <Navigate to="/login" />;

  return (
    <div className="dv-page">
      <Sidebar />
      <main className="dv-main">
        <div className="dv-content dv-fade-up">

          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--stone-900)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Inbox</h1>
            <p style={{ color: 'var(--stone-400)', fontSize: '0.875rem' }}>
              {receivedNotes.length} message{receivedNotes.length !== 1 ? 's' : ''} received
            </p>
          </div>

          {/* Empty state */}
          {receivedNotes.length === 0 ? (
            <div className="dv-card" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.6 }}>
                <Mail size={52} style={{ color: 'var(--stone-300)', display: 'block', margin: '0 auto 0.5rem' }} />
              </div>
              <p style={{ color: 'var(--stone-500)', fontSize: '1rem', fontWeight: 600 }}>Your inbox is quiet today 🌿</p>
              <p style={{ color: 'var(--stone-300)', fontSize: '0.8125rem', marginTop: '0.375rem' }}>
                Ask a teammate to share a note with you — it'll appear here.
              </p>
            </div>
          ) : (
            <div className="dv-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {receivedNotes.map(note => {
                // eslint-disable-next-line no-useless-escape
                const preview = note.content.replace(/```[\s\S]*?```/g, "[code snippet]").replace(/[#*`>_~\[\]]/g, "").trim();
                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className="dv-card dv-card-hover dv-fade-up"
                    style={{
                      padding: '1.125rem 1.375rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '1rem',
                    }}
                  >
                    <Avatar email={note.senderEmail} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.01em' }}>
                          {note.senderEmail}
                        </span>
                        {extractCode(note.content) && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'var(--success-light)', color: 'var(--success)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--accent-sage-lt)', flexShrink: 0, marginLeft: 8 }}>
                            code
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--stone-900)', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {note.title}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--stone-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {preview || "No preview available"}
                      </div>
                    </div>
                    <div style={{ color: 'var(--stone-300)', fontSize: '0.75rem', flexShrink: 0 }}>Open →</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Note Modal ── */}
      {selectedNote && (
        <div className="dv-overlay" onClick={() => setSelectedNote(null)}>
          <div className="dv-modal" style={{ width: '100%', maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ padding: '1.375rem 1.75rem', borderBottom: '1px solid var(--stone-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--stone-50)', borderRadius: '24px 24px 0 0' }}>
              <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                <Avatar email={selectedNote.senderEmail} size={42} />
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--stone-900)', marginBottom: '0.2rem' }}>{selectedNote.title}</h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--accent)', fontWeight: 600 }}>From: {selectedNote.senderEmail}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                {extractCode(selectedNote.content) && (
                  <button
                    onClick={() => navigate('/compiler', { state: { code: extractCode(selectedNote.content) } })}
                    className="dv-btn dv-btn-sage"
                    style={{ padding: '8px 16px', borderRadius: 11, fontSize: '0.8125rem', gap: 6 }}
                  >
                    <Zap size={13} fill="currentColor" /> Run Code
                  </button>
                )}
                <button onClick={() => setSelectedNote(null)} style={{ background: 'var(--stone-100)', border: '1px solid var(--stone-200)', borderRadius: 10, padding: '8px', cursor: 'pointer', color: 'var(--stone-500)', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-light)'; e.currentTarget.style.color = 'var(--danger)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--stone-100)'; e.currentTarget.style.color = 'var(--stone-500)'; }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            {/* Modal body */}
            <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1 }}>
              <MarkdownRenderer content={selectedNote.content} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReceivedNotes;
