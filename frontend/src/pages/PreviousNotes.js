import { useEffect, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

function PreviousNotes() {
  const [notes, setNotes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [users, setUsers] = useState([]);

  const [showShareBox, setShowShareBox] = useState(false);

  const [selectedNote, setSelectedNote] = useState(null);

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
  const fetchUsers = async () => {

  try {

    const response = await axios.get(
      "http://localhost:8080/users"
    );

    setUsers(response.data);

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
  const handleShareClick = (note) => {

  setSelectedNote(note);

  setShowShareBox(true);
};
const handleSendNote = async (receiverEmail) => {

  const sharedData = {

    senderEmail: email,

    receiverEmail: receiverEmail,

    title: selectedNote.title,

    content: selectedNote.content
  };

  try {

    await axios.post(
      "http://localhost:8080/shareNote",
      sharedData
    );

    alert("Note Shared Successfully 🚀");

    setShowShareBox(false);

  } catch (error) {

    console.log(error);

    alert("Failed to share note");

  }
};

  useEffect(() => {

  fetchNotes();

  fetchUsers();

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
    }
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

  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">

    <div className="bg-gray-900 p-8 rounded-2xl w-96">

      <h2 className="text-2xl font-bold mb-5">
        Share Note 🚀
      </h2>

      <div className="space-y-3 max-h-64 overflow-y-auto">

        {users
          .filter((user) => user.email !== email)
          .map((user) => (

            <div
              key={user.id}
              className="flex justify-between items-center bg-gray-800 p-3 rounded-lg"
            >

              <span>
                {user.email}
              </span>

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
