import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

function ReceivedNotes() {

  const [receivedNotes, setReceivedNotes] = useState([]);

  const email = localStorage.getItem("email");

  const fetchReceivedNotes = useCallback(async () => {

    try {

      const response = await axios.get(
        `${API_BASE}/receivedNotes/${email}`
      );

      setReceivedNotes(response.data);

    } catch (error) {

      console.log(error);

    }
  }, [email]);

  const markAsRead = useCallback(async () => {

  try {

    await axios.put(
      `${API_BASE}/markAsRead/${email}`
    );

  } catch (error) {

    console.log(error);

  }
}, [email]);

  useEffect(() => {

    fetchReceivedNotes();
     markAsRead();

  }, [fetchReceivedNotes, markAsRead]);

  return (

    <div className="min-h-screen bg-black text-white p-10">

      <h1 className="text-4xl font-bold mb-10">
        Received Developer Notes 📩
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {receivedNotes.map((note) => (

          <div
            key={note.id}
            className="bg-gray-900 p-6 rounded-2xl shadow-lg"
          >

            <p className="text-sm text-blue-400 mb-3">
              Shared by: {note.senderEmail}
            </p>

            <h2 className="text-2xl font-bold mb-3">
              {note.title}
            </h2>

            <p className="text-gray-400">
              {note.content}
            </p>

          </div>

        ))}

      </div>

    </div>
  );
}

export default ReceivedNotes;
