import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

/* ── Reusable styled input ───────────────────────────────────── */
function AuthInput({ icon: Icon, type, placeholder, value, onChange, disabled, rightSlot }) {
  return (
    <div style={{ position: 'relative' }}>
      <Icon size={16} strokeWidth={1.8} style={{
        position: 'absolute', left: 15, top: '50%',
        transform: 'translateY(-50%)', color: 'var(--stone-400)',
        pointerEvents: 'none',
      }} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required
        className="dv-input"
        style={{ paddingLeft: 44, paddingRight: rightSlot ? 44 : 16 }}
      />
      {rightSlot && (
        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
          {rightSlot}
        </div>
      )}
    </div>
  );
}

/* ── Decorative left panel ───────────────────────────────────── */
function AuthPanel({ title, subtitle, emoji }) {
  return (
    <div className="auth-panel-left" style={{
      flex: '0 0 42%',
      background: 'var(--lavender)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '3rem', position: 'relative', overflow: 'hidden',
    }}>
      {/* Soft blobs */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5 }}
        viewBox="0 0 440 600" fill="none" preserveAspectRatio="xMidYMid slice">
        <circle cx="380" cy="60"  r="180" fill="#C8C2FF" />
        <circle cx="40"  cy="520" r="140" fill="#B8B0FF" />
        <circle cx="200" cy="300" r="70"  fill="#D8D4FF" />
        <circle cx="320" cy="440" r="90"  fill="#D0CCFF" opacity="0.6" />
      </svg>

      <div style={{ position: 'relative', textAlign: 'center', maxWidth: 300 }} className="dv-fade-up">
        <div style={{ fontSize: 52, marginBottom: '1.5rem', lineHeight: 1 }}>{emoji}</div>
        <h1 style={{
          fontSize: '2.25rem', fontWeight: 800,
          color: 'var(--stone-900)', letterSpacing: '-0.03em',
          marginBottom: '0.875rem', lineHeight: 1.15,
        }}>
          {title}
        </h1>
        <p style={{ color: 'var(--stone-600)', fontSize: '1.0rem', lineHeight: 1.65 }}>
          {subtitle}
        </p>

        {/* Decorative pips */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
          {[1, 0.6, 0.35].map((o, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: `rgba(124,111,247,${o})`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Login Page ──────────────────────────────────────────────── */
function Login() {
  const navigate = useNavigate();
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [slowHint,    setSlowHint]    = useState(false);

  // Pre-warm the backend while user types (Render free-tier cold start mitigation).
  // Hits the lightweight /health endpoint (no DB query) instead of /users, so the
  // warm-up ping stays fast and cheap even as the user table grows.
  useEffect(() => {
    axios.get(`${API_BASE}/health`, { timeout: 60000 }).catch(() => {});
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSlowHint(false);

    // Show a helpful hint if the server takes > 5s (Render free-tier cold start)
    const hintTimer = setTimeout(() => setSlowHint(true), 5000);

    try {
      const response = await axios.post(`${API_BASE}/login`, { email, password }, {
        headers: { "Content-Type": "application/json" },
        timeout: 90000,
      });
      if (response.data === "User Not Found" || response.data === "Invalid Password") {
        setError(response.data);
        return;
      }
      localStorage.setItem("token", response.data);
      localStorage.setItem("email", email);
      navigate("/dashboard");
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        setError("Server took too long to respond. Please try again in a moment.");
      } else {
        setError("Login failed. Please check your credentials and try again.");
      }
    } finally {
      clearTimeout(hintTimer);
      setLoading(false);
      setSlowHint(false);
    }
  };

  return (
    <div className="auth-page-container" style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--ivory)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <AuthPanel
        emoji="✦"
        title="Your calm developer space"
        subtitle="Notes, code, reminders — all in one peaceful place."
      />

      {/* Form panel */}
      <div className="auth-form-right" style={{
        flex: 1, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '3rem 4.5rem',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }} className="dv-fade-up">

          {/* Heading */}
          <div style={{ marginBottom: '2.25rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
              Welcome back
            </p>
            <h2 style={{
              fontSize: '2rem', fontWeight: 800,
              color: 'var(--stone-900)', letterSpacing: '-0.025em',
              marginBottom: '0.375rem', lineHeight: 1.2,
            }}>
              Sign in to DevVault
            </h2>
            <p style={{ color: 'var(--stone-400)', fontSize: '0.9rem' }}>
              Good to see you again 🌿
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'var(--peach)', border: '1px solid #FDDCC4',
              color: '#A0522D', borderRadius: 12, padding: '0.875rem 1rem',
              fontSize: '0.875rem', fontWeight: 500, marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--stone-700)', marginBottom: '0.5rem' }}>
                Email address
              </label>
              <AuthInput icon={Mail} type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--stone-700)', marginBottom: '0.5rem' }}>
                Password
              </label>
              <AuthInput
                icon={Lock} type={showPass ? 'text' : 'password'} placeholder="Your password"
                value={password} onChange={e => setPassword(e.target.value)} disabled={loading}
                rightSlot={
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    background: 'none', border: 'none', color: 'var(--stone-400)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0,
                  }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="dv-btn dv-btn-primary"
              style={{ width: '100%', padding: '14px 24px', borderRadius: 14, marginTop: '0.5rem', fontSize: '0.9375rem' }}
            >
              {loading ? 'Signing in…' : <><span>Sign In</span><ArrowRight size={16} /></>}
            </button>

            {/* Cold-start hint — shown after 5s of waiting */}
            {slowHint && (
              <div style={{
                background: '#F0EFFF', border: '1px solid #D8D4FF',
                color: '#5B52A3', borderRadius: 12, padding: '0.75rem 1rem',
                fontSize: '0.8125rem', fontWeight: 500, marginTop: '0.5rem',
                display: 'flex', alignItems: 'center', gap: 8,
                animation: 'fadeIn 0.3s ease',
              }}>
                ☕ Server is waking up (free tier). This may take 30–60s on first request…
              </div>
            )}
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.75rem', color: 'var(--stone-400)', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
