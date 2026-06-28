import React, { useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { Play, Save, Share2, X } from "lucide-react";
import Sidebar from "../components/Sidebar";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

const DEFAULT_JAVA_CODE = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, DevVault!");
    }
}
`;

function Compiler() {
  const token    = localStorage.getItem("token");
  const email    = localStorage.getItem("email");
  const navigate = useNavigate();
  const location = useLocation();

  const [code,          setCode]          = useState(() => location.state?.code || DEFAULT_JAVA_CODE);
  const [output,        setOutput]        = useState("");
  const [isRunning,     setIsRunning]     = useState(false);
  const [isSaving,      setIsSaving]      = useState(false);
  const [isSharing,     setIsSharing]     = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [shareModalOpen,setShareModalOpen]= useState(false);
  const [noteTitle,     setNoteTitle]     = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [snippetLoaded, setSnippetLoaded] = useState(!!location.state?.code);

  useEffect(() => {
    if (location.state?.code) {
      setCode(location.state.code);
      setSnippetLoaded(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  if (!token) return <Navigate to="/login" />;

  const handleRun = async () => {
    setIsRunning(true); setOutput("Running…");
    try {
      const res = await axios.post(`${API_BASE}/compile`, { code, language: "java" });
      if (res.data.success) setOutput(res.data.output);
      else setOutput((res.data.error || "") + "\n" + (res.data.output || ""));
    } catch (e) {
      console.error(e); setOutput("Error connecting to compilation server.");
    } finally { setIsRunning(false); }
  };

  const handleSave = async () => {
    if (!noteTitle?.trim()) return;
    setIsSaving(true);
    try {
      await axios.post(`${API_BASE}/addNote`, { email, title: noteTitle.trim(), content: `\`\`\`java\n${code}\n\`\`\`` });
      setSaveModalOpen(false); setNoteTitle("");
    } catch (e) { console.error(e); alert("Failed to save code."); }
    finally { setIsSaving(false); }
  };

  const handleShare = async () => {
    if (!receiverEmail?.trim() || !noteTitle?.trim()) return;
    setIsSharing(true);
    try {
      await axios.post(`${API_BASE}/shareNote`, { senderEmail: email, receiverEmail: receiverEmail.trim(), title: noteTitle.trim(), content: `\`\`\`java\n${code}\n\`\`\`` });
      setShareModalOpen(false); setNoteTitle(""); setReceiverEmail("");
    } catch (e) { console.error(e); alert("Failed to share code."); }
    finally { setIsSharing(false); }
  };

  const isError = output.includes("Error") || output.includes("Exception") || output.includes("error:");

  /* ── Generic modal ── */
  const Modal = ({ title, onClose, onConfirm, confirmLabel, confirmLoading, children }) => (
    <div className="dv-overlay" onClick={onClose}>
      <div className="dv-modal" style={{ width: 400, padding: 0 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '1.375rem 1.5rem', borderBottom: '1px solid var(--stone-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--stone-900)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--stone-400)', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '1.375rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {children}
        </div>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--stone-200)', display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="dv-btn dv-btn-ghost" style={{ padding: '9px 18px', borderRadius: 11 }}>Cancel</button>
          <button onClick={onConfirm} disabled={confirmLoading} className="dv-btn dv-btn-primary" style={{ padding: '9px 20px', borderRadius: 11 }}>
            {confirmLoading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dv-page" style={{ flexDirection: 'column' }}>
      <Sidebar />

      <div style={{ marginLeft: 72, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* ── Top bar ── */}
        <div style={{
          height: 56, background: 'var(--cream)',
          borderBottom: '1px solid var(--stone-200)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.75rem', flexShrink: 0,
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', background: 'var(--stone-100)', padding: '4px 10px', borderRadius: 7, border: '1px solid var(--stone-200)', fontFamily: 'monospace' }}>
              Main.java
            </div>
            {snippetLoaded && (
              <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'var(--success-light)', color: 'var(--success)', padding: '3px 10px', borderRadius: 6, border: '1px solid var(--accent-sage-lt)' }}>
                ⚡ Snippet loaded
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <button onClick={() => { setShareModalOpen(true); setNoteTitle(""); setReceiverEmail(""); }} disabled={isSharing} className="dv-btn dv-btn-ghost" style={{ padding: '7px 16px', borderRadius: 10, fontSize: '0.8125rem' }}>
              <Share2 size={14} /> Share
            </button>
            <button onClick={() => { setSaveModalOpen(true); setNoteTitle(""); }} disabled={isSaving} className="dv-btn dv-btn-ghost" style={{ padding: '7px 16px', borderRadius: 10, fontSize: '0.8125rem' }}>
              <Save size={14} /> Save
            </button>
            <button onClick={handleRun} disabled={isRunning} className="dv-btn dv-btn-sage" style={{ padding: '8px 20px', borderRadius: 10, fontSize: '0.875rem' }}>
              <Play size={14} fill="currentColor" /> {isRunning ? 'Running…' : 'Run'}
            </button>
          </div>
        </div>

        {/* ── Editor + Output ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Monaco editor pane (stays dark — code editors need dark bg) */}
          <div style={{ flex: 1, borderRight: '1px solid var(--stone-200)', display: 'flex', flexDirection: 'column' }}>
            <Editor
              height="100%"
              defaultLanguage="java"
              theme="vs-dark"
              value={code}
              onChange={value => setCode(value)}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                scrollBeyondLastLine: false,
                padding: { top: 16 },
                lineHeight: 22,
              }}
            />
          </div>

          {/* Output pane */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--ivory)' }}>
            <div style={{ padding: '0.5rem 1.25rem', background: 'var(--cream)', borderBottom: '1px solid var(--stone-200)', fontSize: '0.7rem', color: 'var(--stone-400)', fontWeight: 700, letterSpacing: '0.06em' }}>
              OUTPUT
            </div>
            <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto' }}>
              {output ? (
                <pre style={{
                  margin: 0,
                  color: isError ? 'var(--danger)' : 'var(--accent-sage)',
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: '0.875rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                  lineHeight: 1.7,
                }}>
                  {output}
                </pre>
              ) : (
                <div className="dv-empty">
                  <div className="dv-empty-icon">▶</div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--stone-500)' }}>Run your code to see the output here.</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--stone-300)', marginTop: '0.375rem' }}>Supports Java — more languages coming soon</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {saveModalOpen && (
        <Modal title="💾 Save Snippet" onClose={() => setSaveModalOpen(false)} onConfirm={handleSave} confirmLabel="Save to Vault" confirmLoading={isSaving}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--stone-700)', marginBottom: '0.5rem' }}>Snippet title</label>
            <input type="text" placeholder="My Algorithm" value={noteTitle} onChange={e => setNoteTitle(e.target.value)} className="dv-input" />
          </div>
        </Modal>
      )}

      {/* Share Modal */}
      {shareModalOpen && (
        <Modal title="↗ Share Snippet" onClose={() => setShareModalOpen(false)} onConfirm={handleShare} confirmLabel="Send Snippet" confirmLoading={isSharing}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--stone-700)', marginBottom: '0.5rem' }}>Recipient's email</label>
            <input type="email" placeholder="friend@example.com" value={receiverEmail} onChange={e => setReceiverEmail(e.target.value)} className="dv-input" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--stone-700)', marginBottom: '0.5rem' }}>Snippet title</label>
            <input type="text" placeholder="Binary Search" value={noteTitle} onChange={e => setNoteTitle(e.target.value)} className="dv-input" />
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Compiler;
