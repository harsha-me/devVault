import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Navigate, Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

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

function ReceivedNotes() {
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");
  const navigate = useNavigate();

  const [receivedNotes, setReceivedNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);

  const markAsRead = useCallback(async () => {
    try {
      await axios.put(`${API_BASE}/markAsRead/${email}`);
    } catch (error) {
      console.log(error);
    }
  }, [email]);

  const fetchReceivedNotes = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/receivedNotes/${email}`);
      setReceivedNotes(response.data);
      await markAsRead();
    } catch (error) {
      console.log(error);
    }
  }, [email, markAsRead]);

  useEffect(() => {
    fetchReceivedNotes();
  }, [fetchReceivedNotes]);

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-black text-white p-10 font-sans">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-bold">Received Developer Notes 📩</h1>
        <Link
          to="/dashboard"
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition duration-300 font-semibold"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {receivedNotes.length === 0 && (
        <p className="text-gray-500 text-center text-lg mt-20">
          No received notes yet. Ask a teammate to share a note with you! 📩
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {receivedNotes.map((note) => {
          // Clean up markdown syntax for preview
          const preview = note.content.replace(/```[\s\S]*?```/g, "[code snippet]").replace(/[#*`>_~[\]]/g, "").trim();
          
          return (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800 hover:border-blue-500 transition-all duration-200 cursor-pointer hover:-translate-y-1"
            >
              <p className="text-xs text-blue-400 mb-2 font-bold uppercase tracking-wider">
                From: {note.senderEmail}
              </p>
              <h2 className="text-xl font-bold mb-3 truncate">{note.title}</h2>
              <p className="text-gray-400 text-sm line-clamp-3">
                {preview || "No preview available"}
              </p>
              <div className="mt-4 text-blue-400 text-sm font-semibold">
                Click to open →
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal Overlay ── */}
      {selectedNote && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          style={{ background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelectedNote(null)}
        >
          <div 
            className="bg-[#1e1e2e] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#313244]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#313244] flex justify-between items-center bg-[#181825]">
              <div>
                <h2 className="text-2xl font-bold text-[#cdd6f4]">{selectedNote.title}</h2>
                <p className="text-sm text-[#89b4fa] mt-1 font-semibold">From: {selectedNote.senderEmail}</p>
              </div>
              <div className="flex items-center gap-3">
                {extractCode(selectedNote.content) && (
                  <button
                    onClick={() => {
                      const code = extractCode(selectedNote.content);
                      navigate("/compiler", { state: { code } });
                    }}
                    className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg font-bold text-sm transition duration-200 flex items-center gap-1"
                  >
                    Run Code ⚡
                  </button>
                )}
                <button 
                  onClick={() => setSelectedNote(null)}
                  className="text-[#a6adc8] hover:text-[#f38ba8] transition-colors p-2 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <MarkdownRenderer content={selectedNote.content} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReceivedNotes;
