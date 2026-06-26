import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Navigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

function PreviousNotes() {
  // BUG 10 FIX: Auth guard
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");

  const [notes, setNotes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [users, setUsers] = useState([]);
  const [showShareBox, setShowShareBox] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  const fetchNotes = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/getNotes/${email}`);
      setNotes(response.data);
    } catch (error) {
      console.log(error);
    }
  }, [email]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/users`);
      setUsers(response.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await axios.delete(`${API_BASE}/deleteNote/${id}`);
      fetchNotes();
    } catch (error) {
      console.log(error);
      alert("Failed to delete note");
    }
  };

  const handleEdit = (note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleUpdate = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert("Title and content cannot be empty.");
      return;
    }
    const updatedNote = { title: editTitle, content: editContent };
    try {
      await axios.put(`${API_BASE}/updateNote/${editingId}`, updatedNote);
      setEditingId(null);
      setEditTitle("");
      setEditContent("");
      fetchNotes();
    } catch (error) {
      console.log(error);
      alert("Failed to update note");
    }
  };

  const handleShareClick = (note) => {
    setSelectedNote(note);
    setShowShareBox(true);
  };

  const handleSendNote = async (receiverEmail) => {
    const sharedData = {
      senderEmail: email,
      receiverEmail: receiverEmail,
      title: selectedNote.title,
      content: selectedNote.content,
    };
    try {
      await axios.post(`${API_BASE}/shareNote`, sharedData);
      setShowShareBox(false);
      alert("Note Shared Successfully 🚀");
    } catch (error) {
      console.log(error);
      alert("Failed to share note");
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchUsers();
  }, [fetchNotes, fetchUsers]);

  // BUG 10 FIX: Redirect unauthenticated users to login
  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-black text-white p-10">
      {/* BUG 7 FIX: Added back navigation */}
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-bold">All Previous Notes</h1>
        <Link
          to="/dashboard"
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition duration-300"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {notes.length === 0 && (
        <p className="text-gray-500 text-center text-lg mt-20">
          No notes yet. Go to the Dashboard to add your first note! 📝
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map((note) => (
          <div key={note.id} className="bg-gray-900 p-6 rounded-2xl shadow-lg">
            {editingId === note.id ? (
              <>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-800 text-white outline-none mb-4"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-800 text-white outline-none h-32 mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdate}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition duration-300"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg transition duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-3">{note.title}</h2>
                <div className="prose prose-invert max-w-none text-gray-300">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      code({ inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {note.content}
                  </ReactMarkdown>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => handleEdit(note)}
                    className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg transition duration-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition duration-300"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleShareClick(note)}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition duration-300"
                  >
                    Share
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {showShareBox && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-2xl w-96">
            <h2 className="text-2xl font-bold mb-5">Share Note 🚀</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {users
                .filter((user) => user.email !== email)
                .map((user) => (
                  <div
                    key={user.id}
                    className="flex justify-between items-center bg-gray-800 p-3 rounded-lg"
                  >
                    <span>{user.email}</span>
                    <button
                      onClick={() => handleSendNote(user.email)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg"
                    >
                      Send
                    </button>
                  </div>
                ))}
            </div>
            <button
              onClick={() => setShowShareBox(false)}
              className="mt-5 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PreviousNotes;
