import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "https://devvault1-aeaj.onrender.com";

function Signup() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e) => {

    e.preventDefault();

    const userData = {
      name,
      email,
      password
    };

    try {

      const response = await axios.post(
        `${API_BASE}/signup`,
        userData
      );

      console.log(response.data);

      alert("Signup Successful!");

      setName("");
      setEmail("");
      setPassword("");

    } catch (error) {

      console.log(error);

      alert("Signup Failed");

    }
  };

  return (

  <div className="min-h-screen bg-black flex items-center justify-center">

    <div className="bg-gray-900 p-10 rounded-2xl shadow-2xl w-96">

      <h1 className="text-white text-4xl font-bold mb-8 text-center">
        Create Account 🚀
      </h1>

      <div className="mb-5">

        <label className="text-gray-300 block mb-2">
          Name
        </label>

        <input
          type="text"
          placeholder="Enter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white outline-none"
        />

      </div>

      <div className="mb-5">

        <label className="text-gray-300 block mb-2">
          Email
        </label>

        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white outline-none"
        />

      </div>

      <div className="mb-6">

        <label className="text-gray-300 block mb-2">
          Password
        </label>

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white outline-none"
        />

      </div>

      <button
        onClick={handleSignup}
        className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition duration-300"
      >
        Signup
      </button>
     <p className="text-gray-400 text-center mt-5">

  Already have an account?{" "}

  <Link
    to="/login"
    className="text-green-500 hover:underline"
  >
    Login
  </Link>

</p>
    </div>

  </div>
);
}

export default Signup;
