import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Users, X, Search, Zap, Pin, PinOff, FileDown, Download, Sparkles } from "lucide-react";
import Sidebar from "../components/Sidebar";
import jsPDF from "jspdf";
import AiCompanion from "../components/AiCompanion";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

const extractCode = (content) => {
  if (!content) return null;
  const match = content.match(/```(?:[a-zA-Z0-9+#-]+)?\n([\s\S]*?)\n?```/);
  return match ? match[1] : null;
};

const readingTime = (content) => {
  const words = (content || "").trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.ceil(words / 200);
  return mins < 1 ? "< 1 min" : `${mins} min read`;
};

const getTagColors = (tag) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return {
    bg: `hsl(${h}, 85%, 95%)`,
    text: `hsl(${h}, 55%, 30%)`,
    border: `hsl(${h}, 70%, 85%)`
  };
};

const highlightText = (text, search) => {
  if (!search?.trim()) return text;
  // eslint-disable-next-line no-useless-escape
  const parts = text.split(new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === search.toLowerCase() ? 
          <mark key={i} style={{ background: 'yellow', color: 'black', padding: '0 2px', borderRadius: 2 }}>{part}</mark> : 
          part
      )}
    </span>
  );
};

/* ── Markdown Renderer ──────────────────────────────────────── */
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
        h1: ({ children }) => <h1 style={{ color: 'var(--stone-900)', fontSize: '1.3rem', fontWeight: 800, borderBottom: '1px solid var(--stone-200)', paddingBottom: '0.3em', marginBottom: '0.7em' }}>{children}</h1>,
        h2: ({ children }) => <h2 style={{ color: 'var(--accent)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.6em' }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ color: 'var(--accent-sage)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5em' }}>{children}</h3>,
        p:  ({ children }) => <p  style={{ color: 'var(--stone-700)', lineHeight: 1.7, marginBottom: '0.8em', whiteSpace: 'pre-wrap' }}>{children}</p>,
        a:  ({ href, children }) => <a href={href} style={{ color: 'var(--accent)', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">{children}</a>,
        ul: ({ children }) => <ul style={{ color: 'var(--stone-700)', paddingLeft: '1.5em', marginBottom: '0.8em' }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ color: 'var(--stone-700)', paddingLeft: '1.5em', marginBottom: '0.8em' }}>{children}</ol>,
        li: ({ children }) => <li style={{ marginBottom: '0.3em', whiteSpace: 'pre-wrap' }}>{children}</li>,
        blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid var(--stone-300)', paddingLeft: '1em', color: 'var(--stone-500)', fontStyle: 'italic', margin: '0.8em 0' }}>{children}</blockquote>,
        hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--stone-200)', margin: '1em 0' }} />,
        strong: ({ children }) => <strong style={{ color: 'var(--stone-900)', fontWeight: 700 }}>{children}</strong>,
        table: ({ children }) => <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '0.8em' }}>{children}</table></div>,
        th: ({ children }) => <th style={{ border: '1px solid var(--stone-200)', padding: '8px 12px', background: 'var(--stone-100)', color: 'var(--stone-700)' }}>{children}</th>,
        td: ({ children }) => <td style={{ border: '1px solid var(--stone-200)', padding: '8px 12px', color: 'var(--stone-700)' }}>{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/* ── Note Card for Workspace ───────────────────────────────── */
function NoteViewCard({ note, onEdit, onDelete, onRun, onTogglePin, searchQuery }) {
  const [hovered, setHovered] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const noteContent = (note && note.content) || "";
  const noteTitle = (note && note.title) || "Untitled Note";
  const hasCode = !!extractCode(noteContent);
  // eslint-disable-next-line no-useless-escape
  const preview = noteContent.replace(/```[\s\S]*?```/g, "[code snippet]").replace(/[#*`>_~\[\]]/g, "").trim();
  const readTime = readingTime(noteContent);

  const exportMarkdown = (n) => {
    const blob = new Blob([`# ${n.title}\n\n${n.content}`], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${n.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = (n) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const margin = 20;
    const pageW = doc.internal.pageSize.getWidth();
    const maxW = pageW - margin * 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(42, 37, 32);
    const titleLines = doc.splitTextToSize(n.title, maxW);
    doc.text(titleLines, margin, 30);

    const titleH = titleLines.length * 8;
    doc.setDrawColor(200, 195, 190);
    doc.line(margin, 30 + titleH, pageW - margin, 30 + titleH);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(74, 69, 64);
    const plain = n.content
      .replace(/```[\s\S]*?```/g, '[code block]')
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/^[-*]\s/gm, '• ')
      .replace(/^>\s/gm, '  ')
      .trim();

    const contentLines = doc.splitTextToSize(plain, maxW);
    let y = 30 + titleH + 8;
    const pageH = doc.internal.pageSize.getHeight();

    contentLines.forEach(line => {
      if (y > pageH - margin) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += 6;
    });

    doc.setFontSize(8);
    doc.setTextColor(155, 146, 135);
    doc.text(`Exported from DevVault · ${new Date().toLocaleDateString()}`, margin, pageH - 10);
    doc.save(`${n.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setExportMenuOpen(false); }}
      className="dv-card dv-card-hover"
      style={{
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        background: note.pinned ? 'var(--lavender)' : hovered ? 'var(--stone-50)' : 'var(--cream)',
        borderColor: note.pinned ? 'var(--accent-light)' : hovered ? 'var(--stone-300)' : 'var(--stone-200)',
        position: 'relative',
      }}
    >
      {note.pinned && (
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <Pin size={13} style={{ color: 'var(--accent)', fill: 'var(--accent)' }} />
        </div>
      )}

      <div style={{ padding: '1.125rem 1.25rem', flex: 1 }}>
        <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--stone-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: note.pinned ? '1.5rem' : 0 }}>
          {highlightText(noteTitle, searchQuery)}
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--stone-400)', fontWeight: 600 }}>
            📖 {readTime}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }}>
            👤 {note.email.split('@')[0]}
          </span>
          {note.tags && note.tags.map((tag, idx) => {
            const colors = getTagColors(tag);
            return (
              <span
                key={idx}
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  padding: '1px 7px',
                  borderRadius: 20,
                  background: colors.bg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                }}
              >
                {tag}
              </span>
            );
          })}
        </div>

        <p style={{ fontSize: '0.8125rem', color: 'var(--stone-400)', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
          {highlightText(preview || "No content preview available.", searchQuery)}
        </p>
      </div>

      <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--stone-200)', display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {hasCode && (
          <button onClick={onRun} className="dv-btn dv-btn-sage" style={{ padding: '5px 9px', borderRadius: 8, fontSize: '0.72rem', gap: 3 }}>
            <Zap size={10} fill="currentColor" /> Run
          </button>
        )}

        <button
          onClick={onTogglePin}
          title={note.pinned ? 'Unpin' : 'Pin to top'}
          style={{
            background: note.pinned ? 'var(--accent-light)' : 'var(--stone-100)',
            border: `1px solid ${note.pinned ? 'var(--accent)' : 'var(--stone-200)'}`,
            borderRadius: 8, padding: '5px 9px', cursor: 'pointer',
            color: note.pinned ? 'var(--accent)' : 'var(--stone-400)',
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: '0.72rem', fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.18s',
          }}
        >
          {note.pinned ? <PinOff size={11} /> : <Pin size={11} />}
        </button>

        <button onClick={onEdit} className="dv-btn dv-btn-ghost" style={{ flex: 1, padding: '6px', borderRadius: 8, fontSize: '0.78rem' }}>✏️ Edit</button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setExportMenuOpen(v => !v)}
            title="Export note"
            style={{ background: 'var(--stone-100)', border: '1px solid var(--stone-200)', borderRadius: 8, padding: '5px 9px', cursor: 'pointer', color: 'var(--stone-500)', display: 'flex', alignItems: 'center', transition: 'all 0.18s' }}
          >
            <FileDown size={14} />
          </button>
          {exportMenuOpen && (
            <div style={{ position: 'absolute', bottom: '110%', right: 0, background: 'var(--ivory)', border: '1px solid var(--stone-200)', borderRadius: 12, boxShadow: '0 8px 24px rgba(74,69,64,0.14)', padding: '0.4rem', minWidth: 140, zIndex: 50 }}>
              <button
                onClick={() => { exportMarkdown(note); setExportMenuOpen(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--stone-700)', fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.15s' }}
              >
                <Download size={13} /> Download .md
              </button>
              <button
                onClick={() => { exportPDF(note); setExportMenuOpen(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--stone-700)', fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.15s' }}
              >
                <Download size={13} /> Export PDF
              </button>
            </div>
          )}
        </div>

        <button onClick={onDelete} className="dv-btn dv-btn-danger" style={{ padding: '5px 9px', borderRadius: 8, fontSize: '0.78rem' }}>🗑️</button>
      </div>
    </div>
  );
}

/* ── Edit Panel for Workspace ───────────────────────────────── */
function EditPanel({ note, onSave, onCancel }) {
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);
  const [editTags, setEditTags] = useState(note.tags ? note.tags.join(", ") : "");
  const [mode, setMode] = useState("split");
  const taRef = useRef(null);

  const [aiOpen, setAiOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  const insertAtCursor = (before, after = "", placeholder = "") => {
    const ta = taRef.current; if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = editContent.substring(s, e) || placeholder;
    setEditContent(editContent.substring(0, s) + before + sel + after + editContent.substring(e));
    setTimeout(() => { ta.focus(); const p = s + before.length + sel.length + after.length; ta.setSelectionRange(p, p); }, 0);
  };

  const toolbarGroups = [
    [{ label: "H1", title: "Heading 1", action: () => insertAtCursor("# ", "", "Heading") }, { label: "H2", title: "Heading 2", action: () => insertAtCursor("## ", "", "Heading") }],
    [{ label: "B", title: "Bold", action: () => insertAtCursor("**", "**", "bold") }, { label: "I", title: "Italic", action: () => insertAtCursor("_", "_", "italic"), mono: true }],
    [{ label: "`", title: "Inline code", action: () => insertAtCursor("`", "`", "code"), mono: true }, { label: "```", title: "Code block", action: () => insertAtCursor("```javascript\n", "\n```", "// code"), mono: true }],
    [{ label: "•", title: "Bullet list", action: () => insertAtCursor("- ", "", "item") }, { label: ">", title: "Blockquote", action: () => insertAtCursor("> ", "", "quote"), mono: true }, { label: "🔗", title: "Link", action: () => insertAtCursor("[", "](url)", "link") }],
  ];

  return (
    <div className="dv-card" style={{ overflow: 'hidden', marginBottom: '0.5rem', gridColumn: '1 / -1' }}>
      <div style={{ padding: '0.75rem 1.25rem', background: 'var(--stone-50)', borderBottom: '1px solid var(--stone-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em' }}>✏️ EDITING</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <button
            onClick={() => setAiOpen(!aiOpen)}
            style={{
              background: aiOpen ? 'var(--accent-light)' : 'var(--cream)',
              border: `1px solid ${aiOpen ? 'var(--accent)' : 'var(--stone-200)'}`,
              borderRadius: 8,
              color: aiOpen ? 'var(--accent)' : 'var(--stone-700)',
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontWeight: 700,
              transition: 'all 0.18s',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'inherit',
            }}
          >
            <Sparkles size={11} style={{ color: aiOpen ? 'var(--accent)' : 'var(--stone-500)', fill: aiOpen ? 'var(--accent)' : 'none' }} />
            AI Companion
          </button>
          <div style={{ display: 'flex', background: 'var(--stone-100)', borderRadius: 9, padding: 3, gap: 2 }}>
            {[{ key: 'write', icon: '✏️' }, { key: 'split', icon: '⬛' }, { key: 'preview', icon: '👁️' }].map(({ key, icon }) => (
              <button key={key} onClick={() => setMode(key)} style={{ padding: '4px 11px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, background: mode === key ? 'var(--cream)' : 'transparent', color: mode === key ? 'var(--stone-900)' : 'var(--stone-400)', fontFamily: 'inherit' }}>{icon}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--stone-200)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '1.125rem', fontWeight: 700, color: 'var(--stone-900)', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        <div style={{ width: 1, height: 20, background: 'var(--stone-200)' }} />
        <input type="text" placeholder="🏷️ Tags (comma-separated)" value={editTags} onChange={e => setEditTags(e.target.value)} style={{ width: '30%', background: 'transparent', border: 'none', outline: 'none', fontSize: '0.85rem', fontWeight: 600, color: 'var(--stone-600)', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      </div>
      {mode !== 'preview' && (
        <div style={{ padding: '0.5rem 1.25rem', borderBottom: '1px solid var(--stone-200)', display: 'flex', gap: '0.25rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--stone-50)' }}>
          {toolbarGroups.map((grp, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && <div style={{ width: 1, height: 18, background: 'var(--stone-200)', margin: '0 0.15rem' }} />}
              {grp.map((item, i) => (
                <button key={i} onClick={item.action} style={{ background: 'transparent', border: '1px solid var(--stone-200)', borderRadius: 7, padding: '3px 8px', cursor: 'pointer', fontSize: item.mono ? '12px' : '13px', fontFamily: item.mono ? 'monospace' : 'inherit', fontWeight: 700 }} title={item.title}>{item.label}</button>
              ))}
            </React.Fragment>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', minHeight: 260 }}>
        {(mode === 'write' || mode === 'split') && (
          <div style={{ flex: 1, borderRight: mode === 'split' ? '1px solid var(--stone-200)' : 'none', display: 'flex', flexDirection: 'column' }}>
            <textarea
              ref={taRef}
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              onSelect={e => {
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                if (start !== end) {
                  setSelectedText(e.target.value.substring(start, end));
                } else {
                  setSelectedText("");
                }
              }}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', padding: '1rem 1.25rem', color: 'var(--stone-700)', fontSize: '0.875rem', fontFamily: 'monospace', lineHeight: '1.75', minHeight: 220 }}
            />
          </div>
        )}
        {(mode === 'preview' || mode === 'split') && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, padding: '1rem 1.25rem', overflowY: 'auto', minHeight: 220 }}>
              {editContent ? <MarkdownRenderer content={editContent} /> : <p style={{ color: 'var(--stone-300)', fontSize: '0.875rem' }}>Preview appears here…</p>}
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--stone-200)', display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', background: 'var(--stone-50)' }}>
        <button onClick={onCancel} className="dv-btn dv-btn-ghost" style={{ padding: '8px 18px', borderRadius: 10 }}>Cancel</button>
        <button onClick={() => onSave(editTitle, editContent, editTags)} className="dv-btn dv-btn-primary" style={{ padding: '8px 20px', borderRadius: 10 }}>💾 Save Changes</button>
      </div>
      <AiCompanion
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        noteTitle={editTitle}
        noteContent={editContent}
        selectedText={selectedText}
        onInsertContent={insertAtCursor}
        onReplaceContent={(code) => {
          if (window.confirm("Replace your current note content with this code block?")) {
            setEditContent(code);
          }
        }}
      />
    </div>
  );
}

/* ── WorkspaceView Dashboard ────────────────────────────────── */
function WorkspaceView() {
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [notes, setNotes] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Note creator fields
  const [showCreator, setShowCreator] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteTags, setNoteTags] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Invite form fields
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  // UI features
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const fetchWorkspaceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch workspaces & find current
      const wRes = await axios.get(`${API_BASE}/api/workspaces/user/${email}`);
      const current = wRes.data.find(w => w.id.toString() === id);
      if (!current) {
        setError("Workspace not found or you are not a member.");
        setLoading(false);
        return;
      }
      setWorkspace(current);

      // 2. Fetch workspace notes
      const nRes = await axios.get(`${API_BASE}/api/workspaces/${id}/notes`);
      setNotes(nRes.data);

      // 3. Fetch workspace members
      const mRes = await axios.get(`${API_BASE}/api/workspaces/${id}/members`);
      setMembers(mRes.data);
    } catch (e) {
      console.error(e);
      setError("Failed to load workspace data.");
    } finally {
      setLoading(false);
    }
  }, [id, email]);

  useEffect(() => {
    if (token && email) {
      fetchWorkspaceData();
    }
  }, [token, email, fetchWorkspaceData]);

  if (!token) return <Navigate to="/login" />;

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) {
      alert("Please enter title and content");
      return;
    }
    try {
      setSavingNote(true);
      const tags = noteTags ? noteTags.split(",").map(t => t.trim()).filter(t => t.length > 0) : [];
      await axios.post(`${API_BASE}/addNote`, {
        email,
        title: noteTitle.trim(),
        content: noteContent.trim(),
        tags,
        workspaceId: parseInt(id)
      });
      setNoteTitle("");
      setNoteContent("");
      setNoteTags("");
      setShowCreator(false);
      
      // Refresh notes list
      const nRes = await axios.get(`${API_BASE}/api/workspaces/${id}/notes`);
      setNotes(nRes.data);
    } catch (err) {
      alert("Failed to add note: " + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  const handleInviteTeammate = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      setInviteLoading(true);
      await axios.post(`${API_BASE}/api/workspaces/${id}/invite`, {
        email: inviteEmail.trim()
      });
      setInviteEmail("");
      setInviteModalOpen(false);
      
      // Refresh members list
      const mRes = await axios.get(`${API_BASE}/api/workspaces/${id}/members`);
      setMembers(mRes.data);
      alert("Successfully invited teammate!");
    } catch (err) {
      alert(err.response?.data || "Failed to invite teammate");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Delete this shared note?")) return;
    try {
      await axios.delete(`${API_BASE}/deleteNote/${noteId}`);
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (err) {
      alert("Failed to delete note");
    }
  };

  const handleUpdateNote = async (noteId, title, content, tagsString) => {
    if (!title.trim() || !content.trim()) return;
    const tags = tagsString ? tagsString.split(",").map(t => t.trim()).filter(t => t.length > 0) : [];
    try {
      await axios.put(`${API_BASE}/updateNote/${noteId}`, { title, content, tags });
      setEditingId(null);
      // Refresh notes list
      const nRes = await axios.get(`${API_BASE}/api/workspaces/${id}/notes`);
      setNotes(nRes.data);
    } catch (err) {
      alert("Failed to update note");
    }
  };

  const handleTogglePin = async (noteId) => {
    try {
      await axios.put(`${API_BASE}/togglePin/${noteId}`);
      // Refresh notes list
      const nRes = await axios.get(`${API_BASE}/api/workspaces/${id}/notes`);
      setNotes(nRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Tag filter logic
  const allTags = Array.from(new Set((notes || []).flatMap(n => (n && n.tags) || [])));
  const filtered = (notes || []).filter(n => {
    const titleText = (n && n.title) || "";
    const contentText = (n && n.content) || "";
    const matchesSearch = titleText.toLowerCase().includes(search.toLowerCase()) ||
                          contentText.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !selectedTag || (n && n.tags && n.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  const pinnedFiltered = filtered.filter(n => n && n.pinned);
  const unpinnedFiltered = filtered.filter(n => n && !n.pinned);

  if (loading) {
    return (
      <div className="dv-page">
        <Sidebar />
        <main className="dv-main">
          <div className="dv-content" style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
            <div style={{ fontSize: '2.5rem', display: 'inline-block', animation: 'dvPulse 1.5s infinite' }}>⏳</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dv-page">
        <Sidebar />
        <main className="dv-main">
          <div className="dv-content">
            <div className="dv-card" style={{ padding: '4rem 2rem', textAlign: 'center', borderColor: 'var(--danger-light)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
              <p style={{ color: 'var(--danger)', fontSize: '0.9375rem', fontWeight: 600 }}>{error}</p>
              <button onClick={() => navigate('/workspaces')} className="dv-btn dv-btn-primary" style={{ marginTop: '1rem', padding: '8px 20px', borderRadius: 10 }}>Back to Workspaces</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dv-page">
      <Sidebar />
      <main className="dv-main">
        <div className="dv-content dv-fade-up" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2rem', alignItems: 'start' }}>
          
          {/* Main workspace area */}
          <div>
            {/* Header */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--stone-900)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                  📁 {workspace?.name}
                </h1>
                <p style={{ color: 'var(--stone-400)', fontSize: '0.875rem' }}>
                  {workspace?.description || "No description provided."}
                </p>
              </div>
              <button onClick={() => setShowCreator(!showCreator)} className="dv-btn dv-btn-primary" style={{ padding: '9px 18px', borderRadius: 12 }}>
                {showCreator ? "Cancel" : "✏️ Add Note"}
              </button>
            </div>

            {/* Note Creator form */}
            {showCreator && (
              <div className="dv-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--stone-900)', marginBottom: '1rem' }}>✏️ Share Note in Workspace</h3>
                <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input required type="text" placeholder="Title" value={noteTitle} onChange={e => setNoteTitle(e.target.value)} className="dv-input" style={{ flex: 1 }} />
                    <input type="text" placeholder="Tags (comma-separated)" value={noteTags} onChange={e => setNoteTags(e.target.value)} className="dv-input" style={{ width: '30%' }} />
                  </div>
                  <textarea required placeholder="Write your markdown note here..." value={noteContent} onChange={e => setNoteContent(e.target.value)} className="dv-input" style={{ minHeight: 180, resize: 'none', paddingTop: 10 }} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button type="button" onClick={() => setShowCreator(false)} className="dv-btn dv-btn-ghost">Cancel</button>
                    <button type="submit" disabled={savingNote} className="dv-btn dv-btn-primary" style={{ padding: '8px 20px', borderRadius: 10 }}>
                      {savingNote ? "Saving…" : "Save Note"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Search & Tag filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone-400)', pointerEvents: 'none' }} />
                <input type="text" placeholder="Search workspace notes..." value={search} onChange={e => setSearch(e.target.value)} className="dv-input" style={{ paddingLeft: 38 }} />
              </div>
              
              {allTags.length > 0 && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setSelectedTag(null)} className="dv-btn" style={{ fontSize: '0.72rem', padding: '5px 12px', borderRadius: 20, background: selectedTag === null ? 'var(--lavender)' : 'var(--stone-100)', color: selectedTag === null ? 'var(--accent)' : 'var(--stone-600)', border: '1px solid var(--stone-200)' }}>
                    All
                  </button>
                  {allTags.map(tag => {
                    const isSelected = selectedTag === tag;
                    const colors = getTagColors(tag);
                    return (
                      <button key={tag} onClick={() => setSelectedTag(isSelected ? null : tag)} className="dv-btn" style={{ fontSize: '0.72rem', padding: '5px 12px', borderRadius: 20, background: isSelected ? colors.bg : 'var(--stone-100)', color: isSelected ? colors.text : 'var(--stone-600)', border: `1px solid ${isSelected ? colors.border : 'transparent'}` }}>
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes display */}
            {filtered.length === 0 ? (
              <div className="dv-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--stone-400)', fontSize: '0.9375rem' }}>No notes match this filter.</p>
              </div>
            ) : (
              <>
                {/* Pinned section */}
                {pinnedFiltered.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <Pin size={14} style={{ color: 'var(--accent)', fill: 'var(--accent)' }} />
                      <span className="dv-section-heading">Pinned</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                      {pinnedFiltered.map(n => 
                        editingId === n.id ? (
                          <EditPanel key={n.id} note={n} onSave={(title, content, tags) => handleUpdateNote(n.id, title, content, tags)} onCancel={() => setEditingId(null)} />
                        ) : (
                          <NoteViewCard key={n.id} note={n} onEdit={() => setEditingId(n.id)} onDelete={() => handleDeleteNote(n.id)} onRun={() => { const code = extractCode(n.content); if (code) navigate('/compiler', { state: { code } }); }} onTogglePin={() => handleTogglePin(n.id)} searchQuery={search} />
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Unpinned section */}
                {unpinnedFiltered.length > 0 && (
                  <div>
                    {pinnedFiltered.length > 0 && <span className="dv-section-heading" style={{ display: 'block', marginBottom: '1rem' }}>Other Notes</span>}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                      {unpinnedFiltered.map(n => 
                        editingId === n.id ? (
                          <EditPanel key={n.id} note={n} onSave={(title, content, tags) => handleUpdateNote(n.id, title, content, tags)} onCancel={() => setEditingId(null)} />
                        ) : (
                          <NoteViewCard key={n.id} note={n} onEdit={() => setEditingId(n.id)} onDelete={() => handleDeleteNote(n.id)} onRun={() => { const code = extractCode(n.content); if (code) navigate('/compiler', { state: { code } }); }} onTogglePin={() => handleTogglePin(n.id)} searchQuery={search} />
                        )
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Members Sidebar Panel */}
          <div className="dv-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--cream)', border: '1px solid var(--stone-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.85rem', color: 'var(--stone-800)' }}>
                <Users size={16} /> Team Members
              </div>
              <button onClick={() => setInviteModalOpen(true)} className="dv-btn" style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: 8, background: 'var(--lavender)', color: 'var(--accent)' }}>
                Invite
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {members.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--stone-50)', padding: '0.5rem 0.75rem', borderRadius: 10, border: '1px solid var(--stone-100)' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--stone-900)' }}>
                      {m.memberEmail.split('@')[0]}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--stone-400)' }}>
                      {m.memberEmail}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: m.role === 'OWNER' ? 'var(--sage)' : 'var(--stone-100)', color: m.role === 'OWNER' ? 'var(--success)' : 'var(--stone-500)', border: '1px solid var(--stone-200)' }}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Invite Modal */}
          {inviteModalOpen && (
            <div className="dv-overlay" onClick={() => setInviteModalOpen(false)}>
              <div className="dv-modal" style={{ width: 380, padding: 0 }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--stone-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--stone-50)' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--stone-900)' }}>➕ Invite Teammate</h3>
                  <button onClick={() => setInviteModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--stone-400)', cursor: 'pointer', display: 'flex' }}><X size={16} /></button>
                </div>
                <form onSubmit={handleInviteTeammate} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--stone-500)', textTransform: 'uppercase', marginBottom: 4 }}>Teammate Email</label>
                    <input required type="email" placeholder="teammate@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="dv-input" />
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setInviteModalOpen(false)} className="dv-btn dv-btn-ghost" style={{ padding: '8px 16px', borderRadius: 10 }}>Cancel</button>
                    <button type="submit" disabled={inviteLoading} className="dv-btn dv-btn-primary" style={{ padding: '8px 20px', borderRadius: 10 }}>
                      {inviteLoading ? 'Inviting…' : 'Send Invite'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default WorkspaceView;
