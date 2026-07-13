import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import { gameService } from '../../../services/gameService';
import { ArrowLeft, RefreshCw, Undo2, LogOut, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

function TicTacToe() {
  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');
  const navigate = useNavigate();

  // Mode Selection State: 'SELECT' or 'PLAYING'
  const [gameState, setGameState] = useState('SELECT');
  const [gameMode, setGameMode] = useState('AI'); // 'AI' or 'FRIEND'
  const [difficulty, setDifficulty] = useState('MEDIUM'); // 'EASY', 'MEDIUM', 'HARD'

  // Board state: 9 cell entries
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null); // 'X', 'O', 'DRAW', or null
  const [winningLine, setWinningLine] = useState(null); // combination index
  const [movesHistory, setMovesHistory] = useState([]); // array of cell indices in order
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Time & Stats Tracking
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  // Local Match Stats
  const [localStats, setLocalStats] = useState(null);

  // Confetti particles for victory
  const [showConfetti, setShowConfetti] = useState(false);

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];

  // Fetch Stats
  const fetchStats = async () => {
    try {
      if (email) {
        const stats = await gameService.getStats(email);
        setLocalStats(stats);
      }
    } catch (err) {
      console.error("Error fetching game stats", err);
    }
  };

  useEffect(() => {
    if (email) {
      fetchStats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, gameState]);

  // Start Timer when game begins (on first move)
  useEffect(() => {
    if (gameState === 'PLAYING' && startTime && !winner) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, startTime, winner]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // AI Helper: Find Winner
  const checkWinner = (b) => {
    for (let i = 0; i < winningCombinations.length; i++) {
      const [a, c, d] = winningCombinations[i];
      if (b[a] && b[a] === b[c] && b[a] === b[d]) {
        return { winner: b[a], combination: i };
      }
    }
    if (b.every(cell => cell !== null)) {
      return { winner: 'DRAW', combination: null };
    }
    return { winner: null, combination: null };
  };

  // Minimax Algorithm for HARD AI
  const minimax = (tempBoard, depth, isMaximizing) => {
    const check = checkWinner(tempBoard);
    if (check.winner === 'O') return 10 - depth;
    if (check.winner === 'X') return depth - 10;
    if (check.winner === 'DRAW') return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (tempBoard[i] === null) {
          tempBoard[i] = 'O';
          let score = minimax(tempBoard, depth + 1, false);
          tempBoard[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (tempBoard[i] === null) {
          tempBoard[i] = 'X';
          let score = minimax(tempBoard, depth + 1, true);
          tempBoard[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  // Get AI choice based on difficulty
  const getAiMove = (currentBoard) => {
    const emptyCells = [];
    currentBoard.forEach((cell, idx) => {
      if (cell === null) emptyCells.push(idx);
    });

    if (emptyCells.length === 0) return null;

    // 1. EASY: Random move
    if (difficulty === 'EASY') {
      const randIdx = Math.floor(Math.random() * emptyCells.length);
      return emptyCells[randIdx];
    }

    // 2. MEDIUM: Take win or block win, otherwise random
    if (difficulty === 'MEDIUM') {
      // Check if AI can win in one move
      for (let cell of emptyCells) {
        let testBoard = [...currentBoard];
        testBoard[cell] = 'O';
        if (checkWinner(testBoard).winner === 'O') return cell;
      }
      // Check if Player can win in one move (and block it)
      for (let cell of emptyCells) {
        let testBoard = [...currentBoard];
        testBoard[cell] = 'X';
        if (checkWinner(testBoard).winner === 'X') return cell;
      }
      // Otherwise, play random
      const randIdx = Math.floor(Math.random() * emptyCells.length);
      return emptyCells[randIdx];
    }

    // 3. HARD: Minimax (Unbeatable)
    let bestScore = -Infinity;
    let bestMove = emptyCells[0];

    for (let cell of emptyCells) {
      let testBoard = [...currentBoard];
      testBoard[cell] = 'O';
      let score = minimax(testBoard, 0, false);
      testBoard[cell] = null;

      if (score > bestScore) {
        bestScore = score;
        bestMove = cell;
      }
    }
    return bestMove;
  };

  const handleCellClick = (index) => {
    if (board[index] !== null || winner || isAiThinking) return;

    // Start start-time timer on first move
    if (!startTime) {
      setStartTime(Date.now());
      // Log session start on backend
      gameService.startGame(email).catch(e => console.error("Error starting match backend: ", e));
    }

    const nextSymbol = isXNext ? 'X' : 'O';
    const newBoard = [...board];
    newBoard[index] = nextSymbol;

    const newHistory = [...movesHistory, index];
    setBoard(newBoard);
    setMovesHistory(newHistory);

    const check = checkWinner(newBoard);

    if (check.winner) {
      handleGameOver(check.winner, check.combination, newHistory);
    } else {
      setIsXNext(!isXNext);

      // If playing with AI and it was X's turn, trigger AI move
      if (gameMode === 'AI') {
        setIsAiThinking(true);
        setTimeout(() => {
          triggerAiMove(newBoard, newHistory);
        }, 5500 - (difficulty === 'HARD' ? 5000 : difficulty === 'MEDIUM' ? 4900 : 4850)); 
        // Generates ~500ms delay for hard, ~600ms for medium, ~650ms for easy
      }
    }
  };

  const triggerAiMove = (currentBoard, history) => {
    const moveIndex = getAiMove(currentBoard);
    if (moveIndex === null) {
      setIsAiThinking(false);
      return;
    }

    const newBoard = [...currentBoard];
    newBoard[moveIndex] = 'O';

    const newHistory = [...history, moveIndex];
    setBoard(newBoard);
    setMovesHistory(newHistory);
    setIsAiThinking(false);

    const check = checkWinner(newBoard);
    if (check.winner) {
      handleGameOver(check.winner, check.combination, newHistory);
    } else {
      setIsXNext(true);
    }
  };

  const handleGameOver = async (gameWinner, combination, finalHistory) => {
    setWinner(gameWinner);
    if (combination !== null) {
      setWinningLine(combination);
    }

    const duration = Math.floor((Date.now() - (startTime || Date.now())) / 1000) || 1;
    setElapsedSeconds(duration);

    // Confetti on win
    if (gameWinner === 'X') {
      setShowConfetti(true);
      toast.success('Congratulations! You won!', { icon: '🎉' });
    } else if (gameWinner === 'O') {
      toast.error(gameMode === 'AI' ? 'AI Bot won the match.' : 'Player 2 won the match.');
    } else {
      toast.success('Nice game! It is a draw.', { icon: '🤝' });
    }

    // Save Game Result to Database
    try {
      const modeString = gameMode === 'AI' ? `AI (${difficulty})` : 'Local Friend';
      const playerTwoString = gameMode === 'AI' ? 'AI Bot' : 'Player 2';
      const isDraw = gameWinner === 'DRAW';

      const winStr = isDraw ? null : (gameWinner === 'X' ? email : playerTwoString);
      const loseStr = isDraw ? null : (gameWinner === 'X' ? playerTwoString : email);

      const payload = {
        playerOne: email,
        playerTwo: playerTwoString,
        gameMode: modeString,
        difficulty: gameMode === 'AI' ? difficulty : null,
        winner: winStr,
        loser: loseStr,
        isDraw: isDraw,
        totalMoves: finalHistory.length,
        duration: duration,
        moves: finalHistory.join(',')
      };

      await gameService.saveHistory(payload);
      fetchStats();
    } catch (err) {
      console.error("Failed to save match history", err);
    }
  };

  const handleUndo = () => {
    // Undo only allowed in local FRIEND mode, and when there's at least one move, and game is not finished
    if (gameMode !== 'FRIEND' || movesHistory.length === 0 || winner) return;

    const newHistory = [...movesHistory];
    newHistory.pop(); // remove last index

    const newBoard = Array(9).fill(null);
    newHistory.forEach((cellIdx, i) => {
      newBoard[cellIdx] = i % 2 === 0 ? 'X' : 'O';
    });

    setBoard(newBoard);
    setMovesHistory(newHistory);
    setIsXNext(newHistory.length % 2 === 0);
  };

  const handleRestart = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    setMovesHistory([]);
    setStartTime(null);
    setElapsedSeconds(0);
    setIsAiThinking(false);
    setShowConfetti(false);
  };

  const handleExitGame = () => {
    handleRestart();
    setGameState('SELECT');
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  // Helper render for cell cross/circle
  const renderCellSymbol = (val) => {
    if (val === 'X') {
      return (
        <svg viewBox="0 0 100 100" style={{ width: '60%', height: '60%' }}>
          <line x1="15" y1="15" x2="85" y2="85" stroke="var(--stone-700)" strokeWidth="12" strokeLinecap="round" />
          <line x1="85" y1="15" x2="15" y2="85" stroke="var(--stone-700)" strokeWidth="12" strokeLinecap="round" />
        </svg>
      );
    }
    if (val === 'O') {
      return (
        <svg viewBox="0 0 100 100" style={{ width: '60%', height: '60%' }}>
          <circle cx="50" cy="50" r="35" stroke="var(--accent-sage)" strokeWidth="12" fill="none" strokeLinecap="round" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="dv-page">
      {/* CSS Confetti Overlay */}
      {showConfetti && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden'
        }}>
          {Array.from({ length: 40 }).map((_, i) => {
            const left = Math.random() * 100;
            const size = Math.random() * 12 + 6;
            const color = ['#5C8A6A', '#CEC8BF', '#7C6FF7', '#D97706', '#E8745A'][Math.floor(Math.random() * 5)];
            const delay = Math.random() * 3;
            const duration = Math.random() * 3 + 2;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: -20,
                  left: `${left}%`,
                  width: size,
                  height: size,
                  background: color,
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  opacity: 0.85,
                  transform: 'rotate(0deg)',
                  animation: `fallAndFlutter ${duration}s linear ${delay}s infinite`
                }}
              />
            );
          })}
          <style>{`
            @keyframes fallAndFlutter {
              0% { top: -20px; transform: translateX(0) rotate(0deg); }
              50% { transform: translateX(30px) rotate(180deg); }
              100% { top: 105vh; transform: translateX(-30px) rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      <Sidebar />
      <main className="dv-main">
        <div className="dv-content dv-fade-up">
          
          {/* Back button */}
          <div style={{ marginBottom: '1.5rem' }}>
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
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--stone-700)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--stone-400)'}
            >
              <ArrowLeft size={16} /> Back to Games
            </button>
          </div>

          {gameState === 'SELECT' ? (
            /* ================= MODE SELECTION SCREEN ================= */
            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '1rem 0' }}>
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>🎮</span>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--stone-900)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                  Play Tic Tac Toe
                </h1>
                <p style={{ color: 'var(--stone-400)', fontSize: '0.9375rem' }}>
                  Select your opponent to start a new match.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                
                {/* Play with AI Card */}
                <div className="dv-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--stone-200)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '2rem' }}>🤖</span>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--stone-900)' }}>Play with AI</h2>
                    </div>
                    <p style={{ color: 'var(--stone-500)', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                      Challenge an intelligent bot. Choose a difficulty level that matches your coding focus state.
                    </p>
                    
                    {/* Difficulty selector */}
                    <div style={{ marginBottom: '2rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-400)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Difficulty</label>
                      <div style={{ display: 'flex', gap: '8px', background: 'var(--stone-100)', padding: '4px', borderRadius: '10px' }}>
                        {['EASY', 'MEDIUM', 'HARD'].map((diff) => (
                          <button
                            key={diff}
                            onClick={() => setDifficulty(diff)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: difficulty === diff ? 'var(--cream)' : 'transparent',
                              color: difficulty === diff ? 'var(--stone-900)' : 'var(--stone-400)',
                              boxShadow: difficulty === diff ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {diff}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setGameMode('AI');
                      setGameState('PLAYING');
                      handleRestart();
                    }}
                    className="dv-btn dv-btn-primary"
                    style={{ width: '100%', py: '10px' }}
                  >
                    Start Game <ChevronRight size={14} />
                  </button>
                </div>

                {/* Play with Friend Card */}
                <div className="dv-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--stone-200)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '2rem' }}>👥</span>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--stone-900)' }}>Play with Friend</h2>
                    </div>
                    <p style={{ color: 'var(--stone-500)', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '2.5rem' }}>
                      Play locally with another player using the same device. Alternate turns to block and score.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setGameMode('FRIEND');
                      setGameState('PLAYING');
                      handleRestart();
                    }}
                    className="dv-btn dv-btn-primary"
                    style={{ width: '100%', py: '10px' }}
                  >
                    Start Match <ChevronRight size={14} />
                  </button>
                </div>

              </div>
            </div>
          ) : (
            /* ================= ACTIVE GAMEPLAY SCREEN ================= */
            <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              
              {/* Board and Game Section */}
              <div style={{ flex: '1 1 450px', maxWidth: '480px' }}>
                
                {/* Game Info Panel */}
                <div className="dv-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--stone-200)' }}>
                  <div>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      background: 'var(--sage)', 
                      color: 'var(--accent-sage)', 
                      padding: '3px 8px', 
                      borderRadius: '6px', 
                      fontWeight: 700,
                      marginRight: '8px'
                    }}>
                      {gameMode === 'AI' ? `AI (${difficulty})` : 'FRIEND'}
                    </span>
                    <span style={{ color: 'var(--stone-400)', fontSize: '0.8125rem', fontWeight: 600 }}>
                      🕒 {formatTime(elapsedSeconds)}
                    </span>
                  </div>

                  {/* Active Player / Winner display */}
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--stone-900)' }}>
                    {winner ? (
                      winner === 'DRAW' ? (
                        <span style={{ color: 'var(--warning)' }}>Draw Game 🤝</span>
                      ) : (
                        <span style={{ color: 'var(--success)' }}>Winner: {winner} 🎉</span>
                      )
                    ) : (
                      <span>
                        Turn: <span style={{ color: isXNext ? 'var(--stone-700)' : 'var(--accent-sage)' }}>{isXNext ? 'X' : 'O'}</span>
                        {isAiThinking && <span style={{ color: 'var(--stone-400)', fontWeight: 500, fontSize: '0.8rem', marginLeft: '6px' }}>(AI Thinking...)</span>}
                      </span>
                    )}
                  </div>
                </div>

                {/* 3x3 Game Board Grid */}
                <div 
                  className="dv-card"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    padding: '16px',
                    background: 'var(--stone-100)',
                    borderRadius: '24px',
                    boxShadow: 'inset 0 2px 8px rgba(74,69,64,0.06)',
                    position: 'relative',
                    aspectRatio: '1',
                    marginBottom: '1.5rem'
                  }}
                >
                  {board.map((cell, idx) => {
                    // Check if this cell is part of winning combination
                    const isWinningCell = winner && winner !== 'DRAW' && winningCombinations[winningLine].includes(idx);
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleCellClick(idx)}
                        disabled={cell !== null || winner !== null || isAiThinking}
                        style={{
                          background: isWinningCell ? 'var(--accent-sage-lt)' : 'var(--cream)',
                          border: 'none',
                          borderRadius: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: (cell !== null || winner !== null || isAiThinking) ? 'default' : 'pointer',
                          boxShadow: '0 4px 10px rgba(74,69,64,0.04)',
                          transform: 'scale(1)',
                          transition: 'all 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          if (cell === null && !winner && !isAiThinking) {
                            e.target.style.background = 'var(--stone-50)';
                            e.target.style.transform = 'scale(1.03)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (cell === null && !winner && !isAiThinking) {
                            e.target.style.background = 'var(--cream)';
                            e.target.style.transform = 'scale(1)';
                          }
                        }}
                      >
                        {renderCellSymbol(cell)}
                      </button>
                    );
                  })}
                </div>

                {/* Game Controls Panel */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button 
                    onClick={handleRestart}
                    className="dv-btn"
                    style={{ flex: 1, background: 'var(--stone-200)', color: 'var(--stone-700)', padding: '10px 15px', borderRadius: '12px' }}
                  >
                    <RefreshCw size={14} /> Restart
                  </button>
                  {gameMode === 'FRIEND' && (
                    <button 
                      onClick={handleUndo}
                      disabled={movesHistory.length === 0 || winner !== null}
                      className="dv-btn"
                      style={{ flex: 1, background: 'var(--stone-200)', color: 'var(--stone-700)', padding: '10px 15px', borderRadius: '12px' }}
                    >
                      <Undo2 size={14} /> Undo
                    </button>
                  )}
                  <button 
                    onClick={handleExitGame}
                    className="dv-btn"
                    style={{ flex: 1, background: 'var(--stone-900)', color: '#fff', padding: '10px 15px', borderRadius: '12px' }}
                  >
                    <LogOut size={14} /> Exit Match
                  </button>
                </div>

              </div>

              {/* Stats & Match Info Sidebar */}
              <div style={{ flex: '1 1 300px', maxWidth: '340px' }}>
                <div className="dv-card" style={{ padding: '1.75rem', border: '1px solid var(--stone-200)', height: '100%' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--stone-900)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📈 Your Stats
                  </h3>
                  
                  {localStats ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--stone-100)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--stone-400)', fontSize: '0.875rem' }}>Games Played</span>
                        <span style={{ fontWeight: 700, color: 'var(--stone-900)' }}>{localStats.gamesPlayed}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--stone-100)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--stone-400)', fontSize: '0.875rem' }}>Win Rate</span>
                        <span style={{ fontWeight: 700, color: 'var(--stone-900)' }}>{localStats.winRate.toFixed(1)}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--stone-100)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--stone-400)', fontSize: '0.875rem' }}>Current Streak</span>
                        <span style={{ fontWeight: 700, color: 'var(--success)' }}>{localStats.currentWinStreak} wins</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--stone-100)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--stone-400)', fontSize: '0.875rem' }}>Longest Streak</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{localStats.longestWinStreak} wins</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--stone-400)', fontSize: '0.875rem' }}>Avg Match Duration</span>
                        <span style={{ fontWeight: 700, color: 'var(--stone-900)' }}>{formatTime(Math.round(localStats.averageMatchDuration))}</span>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--stone-400)', fontSize: '0.875rem' }}>Loading statistics...</p>
                  )}

                  <div style={{ marginTop: '2rem', background: 'var(--sage)', padding: '1rem', borderRadius: '12px' }}>
                    <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--accent-sage)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Tips</h4>
                    <p style={{ color: 'var(--stone-600)', fontSize: '0.75rem', lineHeight: '1.5' }}>
                      On <strong>Hard Mode</strong>, the AI uses a perfect Minimax search tree. It will block all double traps and secure wins. See if you can play a perfect draw!
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= WINNER OVERLAY MODAL ================= */}
          {winner && (
            <div 
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(42,37,32,0.4)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                animation: 'dvFadeIn 0.2s ease both'
              }}
            >
              <div 
                className="dv-card"
                style={{
                  width: '90%',
                  maxWidth: '380px',
                  padding: '2.5rem 2rem',
                  textAlign: 'center',
                  background: 'var(--cream)',
                  border: '1px solid var(--stone-200)',
                  animation: 'dvScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both'
                }}
              >
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                  {winner === 'DRAW' ? '🤝' : (winner === 'X' ? '🎉' : (gameMode === 'AI' ? '🤖' : '😊'))}
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--stone-900)', marginBottom: '0.5rem' }}>
                  {winner === 'DRAW' ? "It's a Draw!" : (winner === 'X' ? 'You Won!' : (gameMode === 'AI' ? 'AI Bot Wins!' : 'Player 2 Wins!'))}
                </h3>
                
                <p style={{ color: 'var(--stone-400)', fontSize: '0.875rem', marginBottom: '2rem' }}>
                  {winner === 'DRAW' ? 'Both players executed matching strategies.' : `Match resolved in ${movesHistory.length} moves in ${formatTime(elapsedSeconds)}.`}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={handleRestart}
                    className="dv-btn dv-btn-primary"
                    style={{ width: '100%' }}
                  >
                    Play Again
                  </button>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="dv-btn"
                    style={{ width: '100%', background: 'var(--stone-200)', color: 'var(--stone-700)' }}
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default TicTacToe;
