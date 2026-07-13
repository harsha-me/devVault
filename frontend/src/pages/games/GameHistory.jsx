import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { gameService } from '../../services/gameService';
import TicTacToeReplay from './tictactoe/TicTacToeReplay';
import { ArrowLeft, Trash2, Play, Trophy, Flame, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

function GameHistory() {
  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Replay modal state
  const [selectedGame, setSelectedGame] = useState(null);

  const fetchHistoryAndStats = async () => {
    try {
      setLoading(true);
      setError('');
      if (email) {
        const histData = await gameService.getUserHistory(email);
        const statsData = await gameService.getStats(email);
        setHistory(histData);
        setStats(statsData);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve game logs from database. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && email) {
      fetchHistoryAndStats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, email]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this match record? This action cannot be undone.')) {
      try {
        await gameService.deleteHistory(id);
        toast.success('Match log deleted successfully.');
        fetchHistoryAndStats();
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete game history.');
      }
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recent';
    try {
      if (Array.isArray(dateStr)) {
        const [year, month, day, hour = 0, minute = 0] = dateStr;
        const date = new Date(year, month - 1, day, hour, minute);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + 
               hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return String(dateStr);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + 
             date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) {
      return String(dateStr);
    }
  };

  // Circular progress loader for Win Rate
  const renderWinRateCircle = (rate) => {
    const strokeWidth = 6;
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (rate / 100) * circumference;

    return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="70" height="70" viewBox="0 0 70 70">
          <circle cx="35" cy="35" r={radius} stroke="var(--stone-100)" strokeWidth={strokeWidth} fill="transparent" />
          <circle 
            cx="35" cy="35" r={radius} 
            stroke="var(--accent-sage)" 
            strokeWidth={strokeWidth} 
            fill="transparent" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 35 35)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <span style={{ position: 'absolute', fontSize: '0.8125rem', fontWeight: 800, color: 'var(--stone-900)' }}>
          {Math.round(rate)}%
        </span>
      </div>
    );
  };

  return (
    <div className="dv-page">
      <Sidebar />
      <main className="dv-main">
        <div className="dv-content dv-fade-up">
          
          {/* Header */}
          <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <button 
                onClick={() => navigate('/games')} 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--stone-400)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--stone-700)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--stone-400)'}
              >
                <ArrowLeft size={16} /> Back to Games
              </button>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--stone-900)', letterSpacing: '-0.02em' }}>
                🏆 Statistics & Logs
              </h1>
            </div>
          </div>

          {loading ? (
            <div className="dv-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'inline-block', animation: 'dvPulse 1.5s infinite' }}>⏳</div>
              <p style={{ color: 'var(--stone-400)', fontSize: '0.9375rem' }}>Retrieving match records...</p>
            </div>
          ) : error ? (
            <div className="dv-card" style={{ padding: '4rem 2rem', textAlign: 'center', borderColor: 'var(--danger-light)', background: 'rgba(232,86,86,0.05)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
              <p style={{ color: 'var(--danger)', fontSize: '0.9375rem', fontWeight: 600 }}>{error}</p>
              <button onClick={fetchHistoryAndStats} className="dv-btn dv-btn-primary" style={{ marginTop: '1rem' }}>Retry</button>
            </div>
          ) : (
            <>
              {/* Stats Overview Panel */}
              {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                  
                  {/* Games Played Card */}
                  <div className="dv-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ background: 'var(--stone-100)', color: 'var(--stone-700)', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Activity size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--stone-900)', lineHeight: 1.2 }}>{stats.gamesPlayed}</div>
                      <div style={{ color: 'var(--stone-400)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>Games Played</div>
                    </div>
                  </div>

                  {/* Win Rate Card */}
                  <div className="dv-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--stone-900)', lineHeight: 1.2 }}>Win Rate</div>
                      <div style={{ color: 'var(--stone-400)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>
                        {stats.gamesWon}W / {stats.gamesLost}L / {stats.gamesDrawn}D
                      </div>
                    </div>
                    {renderWinRateCircle(stats.winRate)}
                  </div>

                  {/* Streak Card */}
                  <div className="dv-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ background: 'var(--peach)', color: '#E8745A', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Flame size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--stone-900)', lineHeight: 1.2 }}>{stats.currentWinStreak} wins</div>
                      <div style={{ color: 'var(--stone-400)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>
                        Longest: {stats.longestWinStreak}
                      </div>
                    </div>
                  </div>

                  {/* Favorite Mode Card */}
                  <div className="dv-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ background: 'var(--sage)', color: 'var(--accent-sage)', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trophy size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--stone-900)', lineHeight: 1.2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        {stats.favoriteMode === 'None' ? 'None' : stats.favoriteMode}
                      </div>
                      <div style={{ color: 'var(--stone-400)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>Favorite Mode</div>
                    </div>
                  </div>

                </div>
              )}

              {/* Match History Logs Section */}
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--stone-700)', marginBottom: '1.25rem' }}>Match History</h2>
              
              {history.length === 0 ? (
                <div className="dv-card" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
                  <p style={{ color: 'var(--stone-400)', fontSize: '0.9375rem', fontWeight: 600 }}>No games played yet. Challenge the AI to start your first record!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {history.map((game) => {
                    const isUserWinner = email.equalsIgnoreCase(game.winner);
                    const isDrawGame = game.draw;
                    let resultBadgeBg = 'var(--stone-100)';
                    let resultBadgeColor = 'var(--stone-600)';
                    let resultLabel = 'DRAW';

                    if (!isDrawGame) {
                      if (isUserWinner) {
                        resultBadgeBg = 'var(--success-light)';
                        resultBadgeColor = 'var(--success)';
                        resultLabel = 'WON';
                      } else {
                        resultBadgeBg = 'var(--danger-light)';
                        resultBadgeColor = 'var(--danger)';
                        resultLabel = 'LOST';
                      }
                    }

                    return (
                      <div 
                        key={game.id}
                        className="dv-card"
                        style={{
                          padding: '1.25rem 1.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '1rem',
                          border: '1px solid var(--stone-200)',
                        }}
                      >
                        {/* Match Left Block */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                          <span style={{ fontSize: '2rem' }}>
                            {game.gameMode.includes('AI') ? '🤖' : '👥'}
                          </span>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--stone-900)' }}>
                                {game.gameMode}
                              </h3>
                              <span style={{ 
                                fontSize: '0.6875rem', 
                                background: resultBadgeBg, 
                                color: resultBadgeColor, 
                                padding: '2px 8px', 
                                borderRadius: '6px', 
                                fontWeight: 700 
                              }}>
                                {resultLabel}
                              </span>
                            </div>
                            <p style={{ color: 'var(--stone-400)', fontSize: '0.75rem', marginTop: 2 }}>
                              Played on {formatDate(game.playedAt)}
                            </p>
                          </div>
                        </div>

                        {/* Match Middle Block */}
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--stone-900)' }}>
                              {game.totalMoves}
                            </div>
                            <div style={{ color: 'var(--stone-400)', fontSize: '0.6875rem', fontWeight: 600 }}>Moves</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--stone-900)' }}>
                              {formatTime(game.duration)}
                            </div>
                            <div style={{ color: 'var(--stone-400)', fontSize: '0.6875rem', fontWeight: 600 }}>Duration</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--stone-900)' }}>
                              {game.winner ? (game.winner === email ? 'You' : game.winner.split('@')[0]) : 'None'}
                            </div>
                            <div style={{ color: 'var(--stone-400)', fontSize: '0.6875rem', fontWeight: 600 }}>Winner</div>
                          </div>
                        </div>

                        {/* Match Actions Right Block */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedGame(game)}
                            className="dv-btn dv-btn-primary"
                            style={{
                              padding: '8px 16px',
                              borderRadius: '10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.8125rem'
                            }}
                          >
                            <Play size={12} fill="white" /> Replay
                          </button>
                          
                          <button
                            onClick={() => handleDelete(game.id)}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: 'var(--stone-300)',
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '10px',
                              transition: 'all 0.2s ease',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--danger)';
                              e.currentTarget.style.background = 'var(--danger-light)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--stone-300)';
                              e.currentTarget.style.background = 'none';
                            }}
                            title="Delete Match Log"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ================= REPLAY OVERLAY MODAL ================= */}
          {selectedGame && (
            <TicTacToeReplay 
              game={selectedGame}
              onClose={() => setSelectedGame(null)}
            />
          )}

        </div>
      </main>
    </div>
  );
}

export default GameHistory;
