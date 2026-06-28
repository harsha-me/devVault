import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Search, X, Zap } from "lucide-react";
import Sidebar from "../components/Sidebar";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

const extractCode = (content) => {
  if (!content) return null;
  const match = content.match(/```(?:[a-zA-Z0-9+#-]+)?\n([\s\S]*?)\n?```/);
  return match ? match[1] : null;
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
        h1: ({ children }) => <h1 style={{ color: 'var(--stone-900)', fontSize: '1.4rem', fontWeight: 800, borderBottom: '1px solid var(--stone-200)', paddingBottom: '0.3em', marginBottom: '0.7em' }}>{children}</h1>,
        h2: ({ children }) => <h2 style={{ color: 'var(--accent)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.6em' }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ color: 'var(--accent-sage)', fontSize: '1rem', fontWeight: 700, marginBottom: '0.5em' }}>{children}</h3>,
        p:  ({ children }) => <p  style={{ color: 'var(--stone-700)', lineHeight: 1.75, marginBottom: '0.8em' }}>{children}</p>,
        a:  ({ href, children }) => <a href={href} style={{ color: 'var(--accent)', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">{children}</a>,
        ul: ({ children }) => <ul style={{ color: 'var(--stone-700)', paddingLeft: '1.5em', marginBottom: '0.8em' }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ color: 'var(--stone-700)', paddingLeft: '1.5em', marginBottom: '0.8em' }}>{children}</ol>,
        li: ({ children }) => <li style={{ marginBottom: '0.3em' }}>{children}</li>,
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

/* ── Toolbar Button ─────────────────────────────────────────── */
function ToolbarBtn({ onClick, title, children, mono }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: h ? 'var(--stone-200)' : 'transparent',
        border: `1px solid ${h ? 'var(--stone-300)' : 'var(--stone-200)'}`,
        borderRadius: 7, color: h ? 'var(--stone-900)' : 'var(--stone-500)',
        padding: '3px 8px', cursor: 'pointer',
        fontSize: mono ? '12px' : '13px',
        fontFamily: mono ? 'monospace' : 'inherit',
        fontWeight: 700, transition: 'all 0.15s', userSelect: 'none',
      }}
    >{children}</button>
  );
}

/* ── Edit Panel ─────────────────────────────────────────────── */
function EditPanel({ note, onSave, onCancel }) {
  const [editTitle,   setEditTitle]   = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);
  const [mode,        setMode]        = useState("split");
  const taRef = useRef(null);

  const insertAtCursor = (before, after = "", placeholder = "") => {
    const ta = taRef.current; if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = editContent.substring(s, e) || placeholder;
    setEditContent(editContent.substring(0, s) + before + sel + after + editContent.substring(e));
    setTimeout(() => { ta.focus(); const p = s + before.length + sel.length + after.length; ta.setSelectionRange(p, p); }, 0);
  };

  const toolbarGroups = [
    [{ label:"H1",title:"Heading 1",action:()=>insertAtCursor("# ","","Heading")},{label:"H2",title:"Heading 2",action:()=>insertAtCursor("## ","","Heading")}],
    [{ label:"B",title:"Bold",action:()=>insertAtCursor("**","**","bold")},{label:"I",title:"Italic",action:()=>insertAtCursor("_","_","italic"),mono:true}],
    [{ label:"`",title:"Inline code",action:()=>insertAtCursor("`","`","code"),mono:true},{label:"```",title:"Code block",action:()=>insertAtCursor("```javascript\n","\n```","// code"),mono:true}],
    [{ label:"•",title:"Bullet list",action:()=>insertAtCursor("- ","","item")},{label:">",title:"Blockquote",action:()=>insertAtCursor("> ","","quote"),mono:true},{label:"🔗",title:"Link",action:()=>insertAtCursor("[","](url)","link")}],
  ];

  return (
    <div className="dv-card" style={{ overflow: 'hidden', marginBottom: '0.5rem', gridColumn: '1 / -1' }}>
      {/* Edit header */}
      <div style={{ padding: '0.75rem 1.25rem', background: 'var(--stone-50)', borderBottom: '1px solid var(--stone-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em' }}>✏️ EDITING</span>
        <div style={{ display: 'flex', background: 'var(--stone-100)', borderRadius: 9, padding: 3, gap: 2 }}>
          {[{key:'write',icon:'✏️'},{key:'split',icon:'⬛'},{key:'preview',icon:'👁️'}].map(({key,icon})=>(
            <button key={key} onClick={() => setMode(key)} style={{
              padding: '4px 11px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: '0.72rem', fontWeight: 700,
              background: mode===key ? 'var(--cream)' : 'transparent',
              color: mode===key ? 'var(--stone-900)' : 'var(--stone-400)',
              boxShadow: mode===key ? '0 1px 4px rgba(74,69,64,0.1)' : 'none',
              fontFamily: 'inherit',
            }}>{icon}</button>
          ))}
        </div>
      </div>
      {/* Title */}
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--stone-200)' }}>
        <input type="text" value={editTitle} onChange={e=>setEditTitle(e.target.value)} style={{ width:'100%',background:'transparent',border:'none',outline:'none',fontSize:'1.125rem',fontWeight:700,color:'var(--stone-900)',fontFamily:'inherit',boxSizing:'border-box' }} />
      </div>
      {/* Toolbar */}
      {mode !== 'preview' && (
        <div style={{ padding:'0.5rem 1.25rem',borderBottom:'1px solid var(--stone-200)',display:'flex',gap:'0.25rem',flexWrap:'wrap',alignItems:'center',background:'var(--stone-50)' }}>
          {toolbarGroups.map((grp,gi)=>(
            <React.Fragment key={gi}>
              {gi>0 && <div style={{width:1,height:18,background:'var(--stone-200)',margin:'0 0.15rem'}} />}
              {grp.map((item,i)=><ToolbarBtn key={i} onClick={item.action} title={item.title} mono={item.mono}>{item.label}</ToolbarBtn>)}
            </React.Fragment>
          ))}
        </div>
      )}
      {/* Panes */}
      <div style={{ display: 'flex', minHeight: 260 }}>
        {(mode==='write'||mode==='split') && (
          <div style={{flex:1,borderRight:mode==='split'?'1px solid var(--stone-200)':'none',display:'flex',flexDirection:'column'}}>
            {mode==='split' && <div style={{padding:'0.3rem 1.25rem',background:'var(--stone-50)',borderBottom:'1px solid var(--stone-200)',fontSize:'0.65rem',color:'var(--stone-400)',fontWeight:700,letterSpacing:'0.08em'}}>MARKDOWN</div>}
            <textarea ref={taRef} value={editContent} onChange={e=>setEditContent(e.target.value)} style={{flex:1,background:'transparent',border:'none',outline:'none',resize:'none',padding:'1rem 1.25rem',color:'var(--stone-700)',fontSize:'0.875rem',fontFamily:'monospace',lineHeight:'1.75',minHeight:220}} />
          </div>
        )}
        {(mode==='preview'||mode==='split') && (
          <div style={{flex:1,display:'flex',flexDirection:'column'}}>
            {mode==='split' && <div style={{padding:'0.3rem 1.25rem',background:'var(--stone-50)',borderBottom:'1px solid var(--stone-200)',fontSize:'0.65rem',color:'var(--stone-400)',fontWeight:700,letterSpacing:'0.08em'}}>PREVIEW</div>}
            <div style={{flex:1,padding:'1rem 1.25rem',overflowY:'auto',minHeight:220}}>
              {editContent ? <MarkdownRenderer content={editContent} /> : <p style={{color:'var(--stone-300)',fontSize:'0.875rem'}}>Preview appears here…</p>}
            </div>
          </div>
        )}
      </div>
      {/* Actions */}
      <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--stone-200)', display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', background: 'var(--stone-50)' }}>
        <button onClick={onCancel} className="dv-btn dv-btn-ghost" style={{ padding: '8px 18px', borderRadius: 10 }}>Cancel</button>
        <button onClick={() => onSave(editTitle, editContent)} className="dv-btn dv-btn-primary" style={{ padding: '8px 20px', borderRadius: 10 }}>💾 Save Changes</button>
      </div>
    </div>
  );
}

/* ── Note Card ──────────────────────────────────────────────── */
function NoteViewCard({ note, onEdit, onDelete, onShare, onRun }) {
  const [hovered, setHovered] = useState(false);
  const hasCode = !!extractCode(note.content);
  // eslint-disable-next-line no-useless-escape
  const preview = note.content.replace(/```[\s\S]*?```/g,"[code snippet]").replace(/[#*`>_~\[\]]/g,"").trim();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="dv-card dv-card-hover"
      style={{
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        background: hovered ? 'var(--stone-50)' : 'var(--cream)',
        borderColor: hovered ? 'var(--stone-300)' : 'var(--stone-200)',
      }}
    >
      <div style={{ padding: '1.125rem 1.25rem', flex: 1 }}>
        <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.625rem', color: 'var(--stone-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title}</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--stone-400)', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
          {preview || "No content preview available."}
        </p>
      </div>
      <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--stone-200)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {hasCode && (
          <button onClick={onRun} className="dv-btn dv-btn-sage" style={{ padding: '6px 10px', borderRadius: 9, fontSize: '0.75rem', gap: 4 }}>
            <Zap size={11} fill="currentColor" /> Run
          </button>
        )}
        <button onClick={onEdit}   className="dv-btn dv-btn-ghost" style={{ flex: 1, padding: '7px', borderRadius: 9, fontSize: '0.8rem' }}>✏️ Edit</button>
        <button onClick={onShare}  className="dv-btn" style={{ flex: 1, padding: '7px', borderRadius: 9, fontSize: '0.8rem', background: 'var(--pale-blue)', color: '#2E6BAA', border: '1px solid #C4DCF8' }}>📤 Share</button>
        <button onClick={onDelete} className="dv-btn dv-btn-danger" style={{ padding: '7px 10px', borderRadius: 9, fontSize: '0.8rem' }}>🗑️</button>
      </div>
    </div>
  );
}

/* ── PreviousNotes Page ─────────────────────────────────────── */
function PreviousNotes() {
  const token    = localStorage.getItem("token");
  const email    = localStorage.getItem("email");
  const navigate = useNavigate();

  const [notes,        setNotes]        = useState([]);
  const [editingId,    setEditingId]    = useState(null);
  const [users,        setUsers]        = useState([]);
  const [showShareBox, setShowShareBox] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [search,       setSearch]       = useState("");

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
      setEditingId(null); fetchNotes();
    } catch (e) { console.log(e); alert("Failed to update note"); }
  };

  const handleSendNote = async (receiverEmail) => {
    try {
      await axios.post(`${API_BASE}/shareNote`, { senderEmail: email, receiverEmail, title: selectedNote.title, content: selectedNote.content });
      setShowShareBox(false); alert("Note shared successfully 🚀");
    } catch (e) { console.log(e); alert("Failed to share note"); }
  };

  useEffect(() => { fetchNotes(); fetchUsers(); }, [fetchNotes, fetchUsers]);

  if (!token) return <Navigate to="/login" />;

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dv-page">
      <Sidebar />
      <main className="dv-main">
        <div className="dv-content dv-fade-up">

          {/* Header */}
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--stone-900)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>My Notes</h1>
              <p style={{ color: 'var(--stone-400)', fontSize: '0.875rem' }}>
                {notes.length} note{notes.length !== 1 ? 's' : ''} in your vault
              </p>
            </div>
            {/* Search */}
            <div style={{ position: 'relative', width: 260 }}>
              <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone-400)', pointerEvents: 'none' }} />
              <input
                type="text" placeholder="Search notes…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="dv-input"
                style={{ paddingLeft: 38, paddingTop: 10, paddingBottom: 10, fontSize: '0.875rem' }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--stone-400)', cursor: 'pointer', display: 'flex' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Notes grid */}
          {filtered.length === 0 ? (
            <div className="dv-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{search ? '🔍' : '📝'}</div>
              <p style={{ color: 'var(--stone-400)', fontSize: '0.9375rem' }}>
                {search ? `No notes match "${search}"` : "No notes yet. Head to the Dashboard to add your first note."}
              </p>
              {!search && <p style={{ color: 'var(--stone-300)', fontSize: '0.825rem', marginTop: '0.5rem' }}>Your vault is ready and waiting 🌿</p>}
            </div>
          ) : (
            <div className="dv-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1.125rem' }}>
              {filtered.map(note =>
                editingId === note.id ? (
                  <EditPanel
                    key={note.id}
                    note={note}
                    onSave={(t, c) => handleUpdate(note.id, t, c)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <NoteViewCard
                    key={note.id}
                    note={note}
                    onEdit={() => setEditingId(note.id)}
                    onDelete={() => handleDelete(note.id)}
                    onShare={() => { setSelectedNote(note); setShowShareBox(true); }}
                    onRun={() => {
                      const code = extractCode(note.content);
                      if (code) navigate('/compiler', { state: { code } });
                    }}
                  />
                )
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Share Modal ── */}
      {showShareBox && (
        <div className="dv-overlay" onClick={() => setShowShareBox(false)}>
          <div className="dv-modal" style={{ width: 380, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--stone-200)' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--stone-900)', marginBottom: '0.25rem' }}>Share Note 🚀</h2>
              <p style={{ color: 'var(--stone-400)', fontSize: '0.8125rem' }}>"{selectedNote?.title}"</p>
            </div>
            <div style={{ maxHeight: 260, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {users.filter(u => u.email !== email).length === 0 ? (
                <p style={{ color: 'var(--stone-400)', textAlign: 'center', padding: '2rem', fontSize: '0.875rem' }}>No other users found.</p>
              ) : (
                users.filter(u => u.email !== email).map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--stone-100)', padding: '0.75rem 1rem', borderRadius: 12, border: '1px solid var(--stone-200)' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--stone-900)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--stone-400)' }}>{u.email}</div>
                    </div>
                    <button onClick={() => handleSendNote(u.email)} className="dv-btn dv-btn-accent" style={{ padding: '6px 14px', borderRadius: 9, fontSize: '0.8rem' }}>Send</button>
                  </div>
                ))
              )}
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--stone-200)' }}>
              <button onClick={() => setShowShareBox(false)} className="dv-btn dv-btn-ghost" style={{ width: '100%', padding: '10px', borderRadius: 12 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PreviousNotes;
