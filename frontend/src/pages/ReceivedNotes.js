import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Navigate, Link } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

function ReceivedNotes() {
  // BUG 10 FIX: Auth guard
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");

  const [receivedNotes, setReceivedNotes] = useState([]);

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
      // BUG 2 FIX: markAsRead called AFTER notes are successfully fetched and rendered
      await markAsRead();
    } catch (error) {
      console.log(error);
    }
  }, [email, markAsRead]);

  useEffect(() => {
    fetchReceivedNotes();
  }, [fetchReceivedNotes]);

  // BUG 10 FIX: Redirect unauthenticated users to login
  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-black text-white p-10">
      {/* BUG 8 FIX: Added back navigation */}
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-bold">Received Developer Notes 📩</h1>
        <Link
          to="/dashboard"
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition duration-300"
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
        {receivedNotes.map((note) => (
          <div
            key={note.id}
            className="bg-gray-900 p-6 rounded-2xl shadow-lg"
          >
            <p className="text-sm text-blue-400 mb-3">
              Shared by: {note.senderEmail}
            </p>
            <h2 className="text-2xl font-bold mb-3">{note.title}</h2>
            <p className="text-gray-400">{note.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReceivedNotes;
