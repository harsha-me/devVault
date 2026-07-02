import React, { useEffect, useState } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import { Plus, ArrowRight, X } from "lucide-react";
import Sidebar from "../components/Sidebar";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

function Workspaces() {
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API_BASE}/api/workspaces/user/${email}`);
      setWorkspaces(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load workspaces. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && email) {
      fetchWorkspaces();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, email]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setCreateLoading(true);
      await axios.post(`${API_BASE}/api/workspaces`, {
        name: name.trim(),
        description: description.trim(),
        ownerEmail: email
      });
      setName("");
      setDescription("");
      setModalOpen(false);
      fetchWorkspaces();
    } catch (err) {
      alert("Failed to create workspace: " + (err.response?.data || err.message));
    } finally {
      setCreateLoading(false);
    }
  };

  if (!token) return <Navigate to="/login" />;

  return (
    <div className="dv-page">
      <Sidebar />
      <main className="dv-main">
        <div className="dv-content dv-fade-up">
          {/* Header */}
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--stone-900)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Workspaces</h1>
              <p style={{ color: 'var(--stone-400)', fontSize: '0.875rem' }}>
                Collaborate on code and notes with your teammates
              </p>
            </div>
            <button onClick={() => setModalOpen(true)} className="dv-btn dv-btn-primary" style={{ padding: '10px 20px', borderRadius: 12, gap: 6 }}>
              <Plus size={16} /> Create Workspace
            </button>
          </div>

          {/* Workspaces list */}
          {loading ? (
            <div className="dv-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'inline-block', animation: 'dvPulse 1.5s infinite' }}>⏳</div>
              <p style={{ color: 'var(--stone-400)', fontSize: '0.9375rem' }}>Loading workspaces…</p>
            </div>
          ) : error ? (
            <div className="dv-card" style={{ padding: '4rem 2rem', textAlign: 'center', borderColor: 'var(--danger-light)', background: 'rgba(232,86,86,0.05)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
              <p style={{ color: 'var(--danger)', fontSize: '0.9375rem', fontWeight: 600 }}>{error}</p>
              <button onClick={fetchWorkspaces} className="dv-btn dv-btn-primary" style={{ marginTop: '1rem', padding: '8px 20px', borderRadius: 10 }}>Retry</button>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="dv-card" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🗂️</div>
              <p style={{ color: 'var(--stone-500)', fontSize: '1rem', fontWeight: 600 }}>No workspaces yet</p>
              <p style={{ color: 'var(--stone-300)', fontSize: '0.8125rem', marginTop: '0.375rem', marginBottom: '1.5rem' }}>
                Create a workspace to collaborate with other developers.
              </p>
              <button onClick={() => setModalOpen(true)} className="dv-btn dv-btn-primary" style={{ margin: '0 auto', padding: '10px 20px', borderRadius: 12 }}>
                <Plus size={16} /> Create your first workspace
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {workspaces.map(ws => (
                <div key={ws.id} className="dv-card dv-card-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 180 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>📁</span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--stone-900)' }}>{ws.name}</h3>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--stone-400)', lineHeight: 1.5, marginBottom: '1.25rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {ws.description || "No description provided."}
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--stone-200)', paddingTop: '0.875rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--stone-400)', fontWeight: 600 }}>
                      👑 Owner: {ws.ownerEmail.split('@')[0]}
                    </span>
                    <button onClick={() => navigate(`/workspace/${ws.id}`)} className="dv-btn" style={{ background: 'var(--accent-light)', color: 'var(--accent)', padding: '6px 14px', borderRadius: 9, fontSize: '0.8rem', gap: 4, fontWeight: 700 }}>
                      Enter <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Modal */}
          {modalOpen && (
            <div className="dv-overlay" onClick={() => setModalOpen(false)}>
              <div className="dv-modal" style={{ width: 380, padding: 0 }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--stone-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--stone-50)' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--stone-900)' }}>📁 Create New Workspace</h3>
                  <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--stone-400)', cursor: 'pointer', display: 'flex' }}><X size={16} /></button>
                </div>
                <form onSubmit={handleCreateWorkspace} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--stone-500)', textTransform: 'uppercase', marginBottom: 4 }}>Workspace Name</label>
                    <input required type="text" placeholder="e.g. Backend Team" value={name} onChange={e => setName(e.target.value)} className="dv-input" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--stone-500)', textTransform: 'uppercase', marginBottom: 4 }}>Description</label>
                    <textarea placeholder="What is this workspace for?" value={description} onChange={e => setDescription(e.target.value)} className="dv-input" style={{ minHeight: 80, resize: 'none', paddingTop: 8 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setModalOpen(false)} className="dv-btn dv-btn-ghost" style={{ padding: '8px 16px', borderRadius: 10 }}>Cancel</button>
                    <button type="submit" disabled={createLoading} className="dv-btn dv-btn-primary" style={{ padding: '8px 20px', borderRadius: 10 }}>
                      {createLoading ? 'Creating…' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Workspaces;
