import React, { useEffect, useState, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  User, Lock, FileText, CalendarDays, X, Eye, EyeOff, Check, Award, AlertCircle 
} from "lucide-react";
import Sidebar from "../components/Sidebar";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

/* ── Animated Counter Component ───────────────────────────────── */
function AnimatedCounter({ value, duration = 1000 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10);
    if (isNaN(end) || end <= 0) {
      setCount(0);
      return;
    }
    const totalMiliseconds = duration;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 16); // limit to ~60fps
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
}

/* ── Loading Skeleton Component ──────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div className="dv-page">
      <Sidebar />
      <main className="dv-main">
        <div className="dv-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Hero skeleton */}
          <div className="dv-card" style={{ padding: '2.5rem', display: 'flex', gap: '2rem', alignItems: 'center', background: 'var(--cream)', border: '1px solid var(--stone-200)' }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'var(--stone-100)', animation: 'dvPulse 1.5s infinite' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ height: 24, width: '40%', background: 'var(--stone-100)', borderRadius: 6, animation: 'dvPulse 1.5s infinite' }} />
              <div style={{ height: 16, width: '30%', background: 'var(--stone-100)', borderRadius: 6, animation: 'dvPulse 1.5s infinite' }} />
              <div style={{ height: 14, width: '20%', background: 'var(--stone-100)', borderRadius: 6, animation: 'dvPulse 1.5s infinite' }} />
            </div>
          </div>

          {/* Stats grid skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="dv-card" style={{ height: 140, padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', background: 'var(--cream)', border: '1px solid var(--stone-200)', animation: 'dvPulse 1.5s infinite' }}>
                <div style={{ height: 20, width: '60%', background: 'var(--stone-100)', borderRadius: 6 }} />
                <div style={{ height: 36, width: '30%', background: 'var(--stone-100)', borderRadius: 6, margin: '1rem 0' }} />
                <div style={{ height: 14, width: '85%', background: 'var(--stone-100)', borderRadius: 6 }} />
              </div>
            ))}
          </div>

          {/* Activity summary & actions skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <div className="dv-card" style={{ height: 260, background: 'var(--cream)', border: '1px solid var(--stone-200)', animation: 'dvPulse 1.5s infinite' }} />
            <div className="dv-card" style={{ height: 260, background: 'var(--cream)', border: '1px solid var(--stone-200)', animation: 'dvPulse 1.5s infinite' }} />
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Profile Page ────────────────────────────────────────────── */
function Profile() {
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [avatarHovered, setAvatarHovered] = useState(false);

  // Form Fields
  const [newName, setNewName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Success / Error alerts inside modals
  const [modalSuccess, setModalSuccess] = useState("");
  const [modalError, setModalError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 1.5 * 1024 * 1024) {
      alert("Image size should be less than 1.5MB.");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      try {
        await axios.put(`${API_BASE}/updateProfile/${email}`, { profilePicture: base64String });
        fetchProfile();
      } catch (err) {
        alert("Failed to upload profile picture.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Remove profile picture?")) return;
    try {
      await axios.put(`${API_BASE}/updateProfile/${email}`, { profilePicture: "" });
      fetchProfile();
    } catch (err) {
      alert("Failed to remove profile picture.");
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API_BASE}/profile/${email}`);
      setProfile(response.data);
      setNewName(response.data.name);
    } catch (err) {
      console.error(err);
      setError(err.response?.data || "Failed to load user profile. Please check back later.");
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    if (token && email) {
      fetchProfile();
    }
  }, [token, email, fetchProfile]);

  if (!token) return <Navigate to="/login" />;
  if (loading) return <ProfileSkeleton />;

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setModalError("Name cannot be empty.");
      return;
    }
    setActionLoading(true);
    setModalError("");
    setModalSuccess("");
    try {
      await axios.put(`${API_BASE}/updateProfile/${email}`, { name: newName });
      setModalSuccess("Profile updated successfully!");
      setTimeout(() => {
        setEditModalOpen(false);
        setModalSuccess("");
        fetchProfile();
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data || "Failed to update profile.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setModalError("Please fill in all fields.");
      return;
    }
    if (newPassword.length < 6) {
      setModalError("New password must be at least 6 characters.");
      return;
    }
    setActionLoading(true);
    setModalError("");
    setModalSuccess("");
    try {
      await axios.put(`${API_BASE}/changePassword/${email}`, { oldPassword, newPassword });
      setModalSuccess("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setTimeout(() => {
        setPassModalOpen(false);
        setModalSuccess("");
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data || "Failed to change password.");
    } finally {
      setActionLoading(false);
    }
  };

  // Error block
  if (error) {
    return (
      <div className="dv-page">
        <Sidebar />
        <main className="dv-main">
          <div className="dv-content dv-fade-up" style={{ padding: '4rem 2rem', display: 'flex', justifyContent: 'center' }}>
            <div className="dv-card" style={{ maxWidth: 460, width: '100%', padding: '2.5rem', textAlign: 'center', background: 'var(--cream)', border: '1px solid var(--stone-200)' }}>
              <AlertCircle size={48} style={{ color: 'var(--danger)', margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--stone-900)', marginBottom: '0.5rem' }}>Unable to load Profile</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--stone-500)', lineHeight: 1.6, marginBottom: '1.5rem' }}>{error}</p>
              <button onClick={fetchProfile} className="dv-btn dv-btn-primary" style={{ padding: '10px 24px', borderRadius: 12 }}>Try Again</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const initials = (profile.name || "?").substring(0, 2).toUpperCase();
  const prodScore = profile.totalNotes + profile.sharedNotes + profile.totalReminders;

  // Circle gauge math (Radius: 42, Circumference: 2 * pi * 42 ≈ 263.89)
  const maxScoreTarget = 100;
  const percentage = Math.min(Math.round((prodScore / maxScoreTarget) * 100), 100);
  const strokeDashoffset = 263.89 - (263.89 * percentage) / 100;

  return (
    <div className="dv-page">
      <Sidebar />
      <main className="dv-main">
        <div className="dv-content dv-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* ── Hero Section ── */}
          <div className="dv-card" style={{ 
            padding: '2.25rem 2.5rem', display: 'flex', gap: '2rem', 
            alignItems: 'center', background: 'var(--cream)', 
            borderColor: 'var(--stone-200)', flexWrap: 'wrap'
          }}>
            {/* Avatar with Upload options */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div 
                onClick={() => document.getElementById("profile-pic-input").click()}
                onMouseEnter={() => setAvatarHovered(true)}
                onMouseLeave={() => setAvatarHovered(false)}
                style={{
                  width: 100, height: 100, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #DDD8FF, #C8C2FF)',
                  color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', fontWeight: 800,
                  boxShadow: '0 8px 24px rgba(124,111,247,0.18)',
                  border: '3px solid #fff',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                  animation: 'dvScaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
                }}
              >
                {profile.profilePicture ? (
                  <img src={profile.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
                ) : (
                  initials
                )}
                {/* Hover overlay indicator */}
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '0.68rem', fontWeight: 700,
                  opacity: avatarHovered ? 1 : 0, transition: 'opacity 0.15s ease',
                  textTransform: 'uppercase', letterSpacing: '0.04em'
                }}>
                  Change
                </div>
              </div>
              
              {/* Remove Photo option */}
              {profile.profilePicture && (
                <button 
                  onClick={handleRemovePhoto}
                  style={{
                    position: 'absolute', top: 82, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--danger-light)', color: 'var(--danger)',
                    border: '1px solid var(--stone-200)', borderRadius: 10,
                    padding: '2px 8px', fontSize: '0.625rem', fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}
                >
                  Remove
                </button>
              )}
            </div>

            {/* Hidden File Input */}
            <input 
              type="file" 
              id="profile-pic-input" 
              accept="image/*" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
            
            {/* User Welcome info */}
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--stone-900)', letterSpacing: '-0.02em' }}>
                  {profile.name}
                </h1>
                <span style={{ 
                  fontSize: '0.72rem', fontWeight: 700, 
                  background: 'var(--stone-100)', color: 'var(--stone-500)', 
                  padding: '3px 10px', borderRadius: 8, border: '1px solid var(--stone-200)'
                }}>
                  Member since {profile.memberSince || "2026-06-28"}
                </span>
              </div>
              <p style={{ color: 'var(--stone-400)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                {profile.email}
              </p>
              <div style={{ 
                fontSize: '0.9rem', color: 'var(--stone-600)', 
                background: 'rgba(230,225,216,0.25)', padding: '10px 14px', 
                borderRadius: 12, border: '1.5px dashed var(--stone-200)',
                display: 'inline-block'
              }}>
                Welcome back, <strong>{profile.name}</strong> 👋 Keep organizing your ideas beautifully.
              </div>
            </div>
          </div>

          {/* ── Statistics Row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            
            {/* Notes Count */}
            <div className="dv-card dv-card-hover" style={{ padding: '1.375rem 1.625rem', background: 'var(--lavender)', borderColor: 'var(--accent-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>📝 Total Notes</span>
                <span style={{ fontSize: '1.25rem' }}>✏️</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--stone-900)', lineHeight: 1.1, marginBottom: '0.375rem' }}>
                <AnimatedCounter value={profile.totalNotes} />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--stone-500)', fontWeight: 500 }}>
                {profile.totalNotes === 0 ? "No notes yet. Start capturing your ideas today." : "Notes safely saved in your vault"}
              </p>
            </div>

            {/* Shared Notes Count */}
            <div className="dv-card dv-card-hover" style={{ padding: '1.375rem 1.625rem', background: 'var(--pale-blue)', borderColor: '#C4DCF8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2E6BAA', letterSpacing: '0.02em', textTransform: 'uppercase' }}>📤 Notes Shared</span>
                <span style={{ fontSize: '1.25rem' }}>📨</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--stone-900)', lineHeight: 1.1, marginBottom: '0.375rem' }}>
                <AnimatedCounter value={profile.sharedNotes} />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--stone-500)', fontWeight: 500 }}>
                {profile.sharedNotes === 0 ? "No shares yet. Start collaborating with your team." : "Ideas shared and discussed with others"}
              </p>
            </div>

            {/* Reminders Count */}
            <div className="dv-card dv-card-hover" style={{ padding: '1.375rem 1.625rem', background: 'var(--sage)', borderColor: 'var(--accent-sage-lt)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent-sage)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>⏰ Reminders</span>
                <span style={{ fontSize: '1.25rem' }}>⏰</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--stone-900)', lineHeight: 1.1, marginBottom: '0.375rem' }}>
                <AnimatedCounter value={profile.totalReminders} />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--stone-500)', fontWeight: 500 }}>
                {profile.totalReminders === 0 ? "No active reminders. Plan your tasks on the Calendar." : "Upcoming tasks scheduled cleanly"}
              </p>
            </div>

          </div>

          {/* ── Two Column: Activity & Quick Actions ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1rem' }}>
            
            {/* Circular score visualization */}
            <div className="dv-card" style={{ padding: '1.75rem 2rem', background: 'var(--cream)', borderColor: 'var(--stone-200)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--stone-900)', alignSelf: 'flex-start', marginBottom: '1.25rem' }}>
                Activity Summary
              </h3>

              <div style={{ position: 'relative', width: 130, height: 130, marginBottom: '1rem' }}>
                {/* SVG Progress Arc */}
                <svg width="100%" height="100%" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="transparent" stroke="var(--stone-100)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="transparent" stroke="var(--accent)" strokeWidth="8"
                    strokeDasharray="263.89" strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px', transition: 'stroke-dashoffset 1s ease-out' }}
                  />
                </svg>
                {/* Score centered */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '2.125rem', fontWeight: 800, color: 'var(--stone-900)', lineHeight: 1 }}>
                    <AnimatedCounter value={prodScore} />
                  </span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--stone-400)', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 3 }}>
                    Score
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--accent)', background: 'var(--accent-light)', padding: '5px 12px', borderRadius: 9, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.02em', marginBottom: '0.75rem' }}>
                <Award size={13} fill="currentColor" /> Productivity Level
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--stone-400)', lineHeight: 1.5, margin: 0 }}>
                Your score is calculated as<br />
                <strong>Notes</strong> ({profile.totalNotes}) + <strong>Shared Notes</strong> ({profile.sharedNotes}) + <strong>Reminders</strong> ({profile.totalReminders})
              </p>
            </div>

            {/* Quick Actions Card */}
            <div className="dv-card" style={{ padding: '1.75rem 2rem', background: 'var(--cream)', borderColor: 'var(--stone-200)', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--stone-900)', marginBottom: '1.25rem' }}>
                Quick Actions
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', flex: 1, alignItems: 'center' }}>
                
                <button onClick={() => { setModalError(""); setModalSuccess(""); setEditModalOpen(true); }} className="dv-btn" style={{ background: 'var(--stone-100)', color: 'var(--stone-700)', padding: '14px', borderRadius: 14, flexDirection: 'column', gap: 6, fontSize: '0.8125rem', height: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--stone-200)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--stone-100)'; }}
                >
                  <User size={18} style={{ color: 'var(--accent)' }} />
                  Edit Profile
                </button>

                <button onClick={() => { setModalError(""); setModalSuccess(""); setPassModalOpen(true); }} className="dv-btn" style={{ background: 'var(--stone-100)', color: 'var(--stone-700)', padding: '14px', borderRadius: 14, flexDirection: 'column', gap: 6, fontSize: '0.8125rem', height: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--stone-200)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--stone-100)'; }}
                >
                  <Lock size={18} style={{ color: 'var(--accent-sage)' }} />
                  Change Password
                </button>

                <button onClick={() => navigate('/previous-notes')} className="dv-btn" style={{ background: 'var(--stone-100)', color: 'var(--stone-700)', padding: '14px', borderRadius: 14, flexDirection: 'column', gap: 6, fontSize: '0.8125rem', height: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--stone-200)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--stone-100)'; }}
                >
                  <FileText size={18} style={{ color: '#2E6BAA' }} />
                  Manage Notes
                </button>

                <button onClick={() => navigate('/calendar')} className="dv-btn" style={{ background: 'var(--stone-100)', color: 'var(--stone-700)', padding: '14px', borderRadius: 14, flexDirection: 'column', gap: 6, fontSize: '0.8125rem', height: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--stone-200)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--stone-100)'; }}
                >
                  <CalendarDays size={18} style={{ color: 'var(--warning)' }} />
                  View Calendar
                </button>

              </div>
            </div>

          </div>

        </div>
      </main>

      {/* ── Edit Profile Modal ── */}
      {editModalOpen && (
        <div className="dv-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="dv-modal" style={{ width: 380, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--stone-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--stone-50)' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--stone-900)' }}>👤 Edit Profile Info</h3>
              <button onClick={() => setEditModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--stone-400)', cursor: 'pointer', display: 'flex' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleUpdateName} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--stone-500)', textTransform: 'uppercase', marginBottom: 4 }}>Full Name</label>
                <input required type="text" value={newName} onChange={e => setNewName(e.target.value)} className="dv-input" />
              </div>
              {modalError && (
                <div style={{ fontSize: '0.8rem', color: 'var(--danger)', display: 'flex', gap: 4, alignItems: 'center' }}>
                  <AlertCircle size={13} /> {modalError}
                </div>
              )}
              {modalSuccess && (
                <div style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', gap: 4, alignItems: 'center' }}>
                  <Check size={13} /> {modalSuccess}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditModalOpen(false)} className="dv-btn dv-btn-ghost" style={{ padding: '8px 16px', borderRadius: 10 }}>Cancel</button>
                <button type="submit" disabled={actionLoading} className="dv-btn dv-btn-primary" style={{ padding: '8px 20px', borderRadius: 10 }}>
                  {actionLoading ? 'Updating…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {passModalOpen && (
        <div className="dv-overlay" onClick={() => setPassModalOpen(false)}>
          <div className="dv-modal" style={{ width: 380, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--stone-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--stone-50)' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--stone-900)' }}>🔒 Change Password</h3>
              <button onClick={() => setPassModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--stone-400)', cursor: 'pointer', display: 'flex' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleChangePassword} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--stone-500)', textTransform: 'uppercase', marginBottom: 4 }}>Old Password</label>
                <div style={{ position: 'relative' }}>
                  <input required type={showOldPass ? "text" : "password"} value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="dv-input" style={{ paddingRight: 36 }} />
                  <button type="button" onClick={() => setShowOldPass(!showOldPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--stone-400)', cursor: 'pointer', display: 'flex' }}>
                    {showOldPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--stone-500)', textTransform: 'uppercase', marginBottom: 4 }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input required type={showNewPass ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="dv-input" style={{ paddingRight: 36 }} />
                  <button type="button" onClick={() => setShowNewPass(!showNewPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--stone-400)', cursor: 'pointer', display: 'flex' }}>
                    {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              {modalError && (
                <div style={{ fontSize: '0.8rem', color: 'var(--danger)', display: 'flex', gap: 4, alignItems: 'center' }}>
                  <AlertCircle size={13} /> {modalError}
                </div>
              )}
              {modalSuccess && (
                <div style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', gap: 4, alignItems: 'center' }}>
                  <Check size={13} /> {modalSuccess}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setPassModalOpen(false)} className="dv-btn dv-btn-ghost" style={{ padding: '8px 16px', borderRadius: 10 }}>Cancel</button>
                <button type="submit" disabled={actionLoading} className="dv-btn dv-btn-primary" style={{ padding: '8px 20px', borderRadius: 10 }}>
                  {actionLoading ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
