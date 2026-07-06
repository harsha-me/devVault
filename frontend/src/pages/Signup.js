import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

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

function Signup() {
  const navigate = useNavigate();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API_BASE}/signup`, { name, email, password }, {
        headers: { "Content-Type": "application/json" },
        timeout: 90000,
      });
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Network error or server is down";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container" style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--ivory)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* Decorative left panel */}
      <div className="auth-panel-left" style={{
        flex: '0 0 42%',
        background: 'var(--sage)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '3rem', position: 'relative', overflow: 'hidden',
      }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5 }}
          viewBox="0 0 440 600" fill="none" preserveAspectRatio="xMidYMid slice">
          <circle cx="380" cy="80"  r="180" fill="#B8D8BC" />
          <circle cx="50"  cy="520" r="140" fill="#A8CCAC" />
          <circle cx="200" cy="280" r="70"  fill="#C8E0CA" />
        </svg>

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 300 }} className="dv-fade-up">
          <div style={{ fontSize: 52, marginBottom: '1.5rem', lineHeight: 1 }}>🌱</div>
          <h1 style={{
            fontSize: '2.25rem', fontWeight: 800,
            color: 'var(--stone-900)', letterSpacing: '-0.03em',
            marginBottom: '0.875rem', lineHeight: 1.15,
          }}>
            Start your journey
          </h1>
          <p style={{ color: 'var(--stone-600)', fontSize: '1rem', lineHeight: 1.65 }}>
            Join thousands of developers who keep their best thinking organised in DevVault.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
            {[1, 0.6, 0.35].map((o, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: `rgba(92,138,106,${o})`,
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-form-right" style={{
        flex: 1, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '3rem 4.5rem',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }} className="dv-fade-up">

          <div style={{ marginBottom: '2.25rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-sage)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
              Create account
            </p>
            <h2 style={{
              fontSize: '2rem', fontWeight: 800,
              color: 'var(--stone-900)', letterSpacing: '-0.025em',
              marginBottom: '0.375rem', lineHeight: 1.2,
            }}>
              Join DevVault
            </h2>
            <p style={{ color: 'var(--stone-400)', fontSize: '0.9rem' }}>
              It only takes a moment ✨
            </p>
          </div>

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

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--stone-700)', marginBottom: '0.5rem' }}>Full name</label>
              <AuthInput icon={User} type="text" placeholder="Jane Smith"
                value={name} onChange={e => setName(e.target.value)} disabled={loading} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--stone-700)', marginBottom: '0.5rem' }}>Email address</label>
              <AuthInput icon={Mail} type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--stone-700)', marginBottom: '0.5rem' }}>Password</label>
              <AuthInput
                icon={Lock} type={showPass ? 'text' : 'password'} placeholder="Choose a strong password"
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
              {loading ? 'Creating account…' : <><span>Create Account</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.75rem', color: 'var(--stone-400)', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
