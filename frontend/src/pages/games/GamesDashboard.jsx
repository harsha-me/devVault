import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { Trophy, Lock } from 'lucide-react';

function GamesDashboard() {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const activeGames = [
    {
      id: 'tic-tac-toe',
      title: 'Tic Tac Toe',
      description: 'Challenge our intelligent minimax AI bot or play locally with a friend.',
      icon: '❌⭕',
      route: '/games/tic-tac-toe'
    }
  ];

  const upcomingGames = [
    { title: 'Sudoku', description: 'Solve classic grids to sharpen logic skills.', icon: '🧩' },
    { title: 'Chess', description: 'Match wits in an analytical board contest.', icon: '♟' },
    { title: 'Memory Match', description: 'Flip blocks to train code token recall.', icon: '🧠' },
    { title: 'Snake', description: 'Classic developer grid retro game.', icon: '🐍' }
  ];

  return (
    <div className="dv-page">
      <Sidebar />
      <main className="dv-main">
        <div className="dv-content dv-fade-up">
          {/* Header */}
          <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--stone-900)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                🎮 Developer Break Room
              </h1>
              <p style={{ color: 'var(--stone-400)', fontSize: '0.875rem' }}>
                Refresh your mind with clean, elegant mini-games during coding sessions.
              </p>
            </div>
            
            <button 
              onClick={() => navigate('/games/history')} 
              className="dv-btn dv-btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                background: 'var(--sage)',
                color: 'var(--accent-sage)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
            >
              <Trophy size={16} /> View Stats & History
            </button>
          </div>

          {/* Active Games Grid */}
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--stone-700)', marginBottom: '1.25rem' }}>Available Now</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {activeGames.map((game) => (
              <div 
                key={game.id}
                className="dv-card dv-card-hover"
                style={{
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '220px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '2.5rem' }}>{game.icon}</span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      background: 'var(--accent-sage-lt)', 
                      color: 'var(--accent-sage)', 
                      padding: '4px 10px', 
                      borderRadius: '8px', 
                      fontWeight: 700 
                    }}>
                      READY TO PLAY
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--stone-900)', marginBottom: '0.5rem' }}>{game.title}</h3>
                  <p style={{ color: 'var(--stone-500)', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>{game.description}</p>
                </div>
                <button 
                  onClick={() => navigate(game.route)}
                  className="dv-btn dv-btn-primary"
                  style={{ width: '100%', py: '10px' }}
                >
                  Start Game
                </button>
              </div>
            ))}
          </div>

          {/* Upcoming Games Grid */}
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--stone-700)', marginBottom: '1.25rem' }}>Coming Soon</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {upcomingGames.map((game, index) => (
              <div 
                key={index}
                className="dv-card"
                style={{
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: 0.75,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ position: 'absolute', top: 12, right: 12, color: 'var(--stone-400)' }}>
                  <Lock size={16} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '2rem' }}>{game.icon}</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--stone-600)' }}>{game.title}</h3>
                </div>
                <p style={{ color: 'var(--stone-400)', fontSize: '0.8125rem', lineHeight: '1.5' }}>{game.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default GamesDashboard;
