import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // BUG 4 FIX: Added loading state and inline error message
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const loginData = { email, password };

    try {
      const response = await axios.post(`${API_BASE}/login`, loginData);

      // Handle wrong credentials returned as plain string
      if (response.data === "User Not Found" || response.data === "Invalid Password") {
        setError(response.data);
        return;
      }

      localStorage.setItem("token", response.data);
      localStorage.setItem("email", email);
      navigate("/dashboard");

    } catch (error) {
      console.log(error);
      setError("Login failed. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 p-10 rounded-2xl shadow-2xl w-96">

        <h1 className="text-white text-4xl font-bold mb-8 text-center">
          DevVault 🔥
        </h1>

        {error && (
          <div className="bg-red-900 text-red-200 p-3 rounded-lg mb-5 text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="mb-5">
          <label className="text-gray-300 block mb-2">Email</label>
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
          <label className="text-gray-300 block mb-2">Password</label>
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
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-gray-400 text-center mt-5">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-500 hover:underline">
            Signup
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;
