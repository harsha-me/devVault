import { useEffect, useState } from "react";
import axios from "axios";

function ReceivedNotes() {

  const [receivedNotes, setReceivedNotes] = useState([]);

  const email = localStorage.getItem("email");

  const fetchReceivedNotes = async () => {

    try {

      const response = await axios.get(
        `http://localhost:8080/receivedNotes/${email}`
      );

      setReceivedNotes(response.data);

    } catch (error) {

      console.log(error);

    }
  };
  const markAsRead = async () => {

  try {

    await axios.put(
      `http://localhost:8080/markAsRead/${email}`
    );

  } catch (error) {

    console.log(error);

  }
};

  useEffect(() => {

    fetchReceivedNotes();
     markAsRead();

  }, []);

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