import { useEffect, useState } from "react";
import axios from "axios";

function PreviousNotes() {
  const [notes, setNotes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const email = localStorage.getItem("email");

  const fetchNotes = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/getNotes/${email}`
      );

      setNotes(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/deleteNote/${id}`);

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
    const updatedNote = {
      title: editTitle,
      content: editContent,
    };

    try {
      await axios.put(
        `http://localhost:8080/updateNote/${editingId}`,
        updatedNote
      );

      setEditingId(null);
      setEditTitle("");
      setEditContent("");
      fetchNotes();
    } catch (error) {
      console.log(error);
      alert("Failed to update note");
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-10">All Previous Notes</h1>

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

                <button
                  onClick={handleUpdate}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition duration-300"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-3">{note.title}</h2>

                <p className="text-gray-400">{note.content}</p>

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
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PreviousNotes;
