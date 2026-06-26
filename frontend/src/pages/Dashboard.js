import React, { useEffect, useState, useCallback } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

function Dashboard() {
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotes = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/getNotes/${email}`);
      setNotes(response.data);
    } catch (error) {
      console.log(error);
    }
  }, [email]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/unreadCount/${email}`);
      setUnreadCount(response.data);
    } catch (error) {
      console.log(error);
    }
  }, [email]);

  // BUG 6 FIX: Fetch notes on initial load
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  if (!token) {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    navigate("/login");
  };

  const handleAddNote = async () => {
    // BUG 5 FIX: Validate that title and content are not empty
    if (!title.trim() || !content.trim()) {
      alert("Please enter both a title and content for your note.");
      return;
    }

    const noteData = { email, title, content };

    try {
      await axios.post(`${API_BASE}/addNote`, noteData);
      setTitle("");
      setContent("");
      fetchNotes();
    } catch (error) {
      console.log(error);
      alert("Failed to add note");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">

      <nav className="bg-gray-900 flex justify-between items-center px-10 py-5 shadow-lg">
        <h1 className="text-3xl font-bold text-blue-500">DevVault 🔥</h1>

        <div className="flex items-center gap-5">
          <span className="text-gray-300">{email}</span>

          <Link
            to="/previous-notes"
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition duration-300"
          >
            Previous Notes
          </Link>

          <Link
            to="/received-notes"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition duration-300 relative"
          >
            Received Notes
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-600 px-2 py-1 rounded-full text-sm">
                {unreadCount}
              </span>
            )}
          </Link>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition duration-300"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="p-10">
        <h2 className="text-5xl font-bold mb-2">Welcome Back 👋</h2>
        <p className="text-gray-400 text-lg mb-10">
          Logged in as <span className="text-blue-400">{email}</span>
        </p>

        <div className="bg-gray-900 p-6 rounded-2xl mb-10">
          <h3 className="text-2xl font-bold mb-5">Add New Note 📝</h3>

          <input
            type="text"
            placeholder="Note Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white outline-none mb-4"
          />

          <textarea
            placeholder="Write your note... (supports Markdown)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white outline-none h-32 mb-4"
          />

          <div className="flex gap-4">
            <button
              onClick={handleAddNote}
              className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-lg transition duration-300"
            >
              Save Note
            </button>
            <Link
              to="/previous-notes"
              className="bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-lg transition duration-300 inline-block"
            >
              All Previous Notes
            </Link>
          </div>
        </div>

        {notes.length === 0 ? (
          <p className="text-gray-500 text-center text-lg mt-10">
            No notes yet. Add your first note above! 📝
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-gray-900 p-6 rounded-2xl shadow-lg"
              >
                <h3 className="text-xl font-bold mb-3">{note.title}</h3>
                <p className="text-gray-400 text-sm line-clamp-4">{note.content}</p>
                <Link
                  to="/previous-notes"
                  className="text-blue-400 text-sm mt-3 inline-block hover:underline"
                >
                  Edit / Share →
                </Link>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default Dashboard;
