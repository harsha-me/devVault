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

const DEFAULT_CODES = {
  java: DEFAULT_JAVA_CODE,
  python: `print("Hello, DevVault!")
`,
  javascript: `console.log("Hello, DevVault!");
`
};

const LANGUAGES = [
  { value: 'java',       label: '☕ Java' },
  { value: 'python',     label: '🐍 Python' },
  { value: 'javascript', label: '🟨 JavaScript' },
];

const THEMES = [
  { value: 'vs-dark',    label: '🌙 Dark' },
  { value: 'vs',         label: '☀️ Light' },
  { value: 'hc-black',   label: '⬛ High Contrast' },
];

/* ── Generic modal (defined outside to prevent unmounting and focus loss on keystrokes) ── */
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

function Compiler() {
  const token    = localStorage.getItem("token");
  const email    = localStorage.getItem("email");
  const navigate = useNavigate();
  const location = useLocation();

  const [language,      setLanguage]      = useState("java");
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
  const [editorTheme,   setEditorTheme]   = useState(
    () => localStorage.getItem('dv_editor_theme') || 'vs-dark'
  );

  const codeRef = React.useRef(code);
  const isRunningRef = React.useRef(isRunning);
  const languageRef = React.useRef(language);

  // Sync refs
  useEffect(() => { codeRef.current = code; }, [code]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { languageRef.current = language; }, [language]);

  const changeTheme = (theme) => {
    setEditorTheme(theme);
    localStorage.setItem('dv_editor_theme', theme);
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    // If code is currently equal to any default boilerplate code, update to new language default code
    const currentDefaults = Object.values(DEFAULT_CODES);
    if (currentDefaults.includes(codeRef.current.trim()) || codeRef.current.trim() === DEFAULT_JAVA_CODE.trim()) {
      setCode(DEFAULT_CODES[newLang]);
    }
  };

  useEffect(() => {
    if (location.state?.code) {
      setCode(location.state.code);
      setSnippetLoaded(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  /* Ctrl+Enter → run code */
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isRunningRef.current) {
          handleRun();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!token) return <Navigate to="/login" />;

  const handleRun = async () => {
    setIsRunning(true); setOutput("Running…");
    try {
      const res = await axios.post(`${API_BASE}/compile`, { code: codeRef.current, language: languageRef.current });
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
      await axios.post(`${API_BASE}/addNote`, { email, title: noteTitle.trim(), content: `\`\`\`${languageRef.current}\n${codeRef.current}\n\`\`\`` });
      setSaveModalOpen(false); setNoteTitle("");
    } catch (e) { console.error(e); alert("Failed to save code."); }
    finally { setIsSaving(false); }
  };

  const handleShare = async () => {
    if (!receiverEmail?.trim() || !noteTitle?.trim()) return;
    setIsSharing(true);
    try {
      await axios.post(`${API_BASE}/shareNote`, { senderEmail: email, receiverEmail: receiverEmail.trim(), title: noteTitle.trim(), content: `\`\`\`${languageRef.current}\n${codeRef.current}\n\`\`\`` });
      setShareModalOpen(false); setNoteTitle(""); setReceiverEmail("");
    } catch (e) { console.error(e); alert("Failed to share code."); }
    finally { setIsSharing(false); }
  };

  const isError = output.includes("Error") || output.includes("Exception") || output.includes("error:");

  return (
    <div className="dv-page" style={{ flexDirection: 'column' }}>
      <Sidebar />

      <div className="dv-main" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* ── Top bar ── */}
        <div className="dv-sticky-topbar" style={{
          minHeight: 56, height: 'auto', background: 'var(--cream)',
          borderBottom: '1px solid var(--stone-200)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 1.25rem', flexShrink: 0,
          flexWrap: 'wrap', gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-500)', background: 'var(--stone-100)', padding: '4px 10px', borderRadius: 7, border: '1px solid var(--stone-200)', fontFamily: 'monospace' }}>
              {language === 'java' ? 'Main.java' : language === 'python' ? 'Main.py' : 'Main.js'}
            </div>
            {snippetLoaded && (
              <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'var(--success-light)', color: 'var(--success)', padding: '3px 10px', borderRadius: 6, border: '1px solid var(--accent-sage-lt)' }}>
                ⚡ Snippet loaded
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {/* Language selector */}
            <select
              value={language}
              onChange={e => handleLanguageChange(e.target.value)}
              style={{
                background: 'var(--stone-100)', border: '1px solid var(--stone-200)',
                borderRadius: 10, padding: '7px 12px', fontFamily: 'inherit',
                fontSize: '0.8rem', fontWeight: 600, color: 'var(--stone-700)',
                cursor: 'pointer', outline: 'none',
              }}
            >
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>

            {/* Theme selector */}
            <select
              value={editorTheme}
              onChange={e => changeTheme(e.target.value)}
              style={{
                background: 'var(--stone-100)', border: '1px solid var(--stone-200)',
                borderRadius: 10, padding: '7px 12px', fontFamily: 'inherit',
                fontSize: '0.8rem', fontWeight: 600, color: 'var(--stone-700)',
                cursor: 'pointer', outline: 'none',
              }}
            >
              {THEMES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <button onClick={() => { setShareModalOpen(true); setNoteTitle(""); setReceiverEmail(""); }} disabled={isSharing} className="dv-btn dv-btn-ghost" style={{ padding: '7px 12px', borderRadius: 10, fontSize: '0.8125rem', gap: 4 }}>
              <Share2 size={14} /><span className="hidden sm:inline"> Share</span>
            </button>
            <button onClick={() => { setSaveModalOpen(true); setNoteTitle(""); }} disabled={isSaving} className="dv-btn dv-btn-ghost" style={{ padding: '7px 12px', borderRadius: 10, fontSize: '0.8125rem', gap: 4 }}>
              <Save size={14} /><span className="hidden sm:inline"> Save</span>
            </button>
            <button onClick={handleRun} disabled={isRunning} className="dv-btn dv-btn-sage" style={{ padding: '8px 16px', borderRadius: 10, fontSize: '0.875rem', gap: 4 }}>
              <Play size={14} fill="currentColor" /> <span className="hidden sm:inline">{isRunning ? 'Running…' : 'Run'}</span>
              <kbd className="hidden md:inline-block" style={{ fontSize: '0.6rem', opacity: 0.7, marginLeft: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 4, padding: '1px 5px' }}>⌃↵</kbd>
            </button>
          </div>
        </div>

        {/* ── Editor + Output ── */}
        <div className="compiler-panes-container" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Monaco editor pane (stays dark — code editors need dark bg) */}
          <div style={{ flex: 1, borderRight: '1px solid var(--stone-200)', display: 'flex', flexDirection: 'column' }}>
            <Editor
              height="100%"
              defaultLanguage="java"
              language={language}
              theme={editorTheme}
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
                  <p style={{ fontSize: '0.8rem', color: 'var(--stone-300)', marginTop: '0.375rem' }}>Supports Java, Python, and JavaScript</p>
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
