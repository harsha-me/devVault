import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "https://devvault1-aeaj.onrender.com";

function Signup() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e) => {

    e.preventDefault();
    setLoading(true);
    setError("");

    const userData = {
      name,
      email,
      password
    };

    try {
      console.log("Making signup request to:", `${API_BASE}/signup`);
      console.log("Request data:", userData);

      const response = await axios.post(
        `${API_BASE}/signup`,
        userData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000
        }
      );

      console.log("Signup successful:", response.data);

      alert("Signup Successful!");

      setName("");
      setEmail("");
      setPassword("");

    } catch (error) {

      console.error("Full error object:", error);
      console.error("Error response:", error.response);
      console.error("Error message:", error.message);
      
      const errorMessage = error.response?.data?.message || error.message || "Network error or server is down";
      setError(errorMessage);
      alert(`Signup Failed: ${errorMessage}`);

    } finally {
      setLoading(false);
    }
  };

  return (

  <div className="min-h-screen bg-black flex items-center justify-center">

    <div className="bg-gray-900 p-10 rounded-2xl shadow-2xl w-96">

      <h1 className="text-white text-4xl font-bold mb-8 text-center">
        Create Account 🚀
      </h1>

      {error && (
        <div className="bg-red-900 text-red-200 p-3 rounded-lg mb-5 text-sm">
          ⚠️ {error}
        </div>
      )}

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
          disabled={loading}
          required
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
          disabled={loading}
          required
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
          disabled={loading}
          required
        />

      </div>

      <button
        onClick={handleSignup}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Creating Account..." : "Signup"}
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
