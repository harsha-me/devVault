import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';

function TicTacToeReplay({ game, onClose }) {
  // Parse moves string "4,0,8,1,3" into integer array [4, 0, 8, 1, 3]
  const moves = game.moves ? game.moves.split(',').map(Number) : [];
  const [currentStep, setCurrentStep] = useState(0); // 0 means empty board, up to moves.length
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // multiplier: 0.5, 1, 2
  const timerRef = useRef(null);

  // Auto playback loop
  useEffect(() => {
    if (isPlaying) {
      const intervalDuration = 1000 / speed;
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= moves.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalDuration);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, speed, moves.length]);

  // Clean timer on unmount
  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // Reconstruct board at current step
  const getBoardAtStep = (step) => {
    const board = Array(9).fill(null);
    for (let i = 0; i < step; i++) {
      if (i < moves.length) {
        const cellIdx = moves[i];
        board[cellIdx] = i % 2 === 0 ? 'X' : 'O';
      }
    }
    return board;
  };

  const board = getBoardAtStep(currentStep);

  const handleNext = () => {
    setIsPlaying(false);
    if (currentStep < moves.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    setIsPlaying(false);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

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
          maxWidth: '440px',
          padding: '2rem 1.75rem',
          background: 'var(--cream)',
          border: '1px solid var(--stone-200)',
          animation: 'dvScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: 'var(--stone-400)',
            cursor: 'pointer',
            padding: '4px'
          }}
          onMouseEnter={(e) => e.target.style.color = 'var(--stone-700)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--stone-400)'}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--stone-900)', marginBottom: '0.25rem' }}>
            Match Replay
          </h3>
          <p style={{ color: 'var(--stone-400)', fontSize: '0.8125rem' }}>
            Mode: {game.gameMode} • Winner: {game.winner || 'Draw'}
          </p>
        </div>

        {/* Board View */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            padding: '12px',
            background: 'var(--stone-100)',
            borderRadius: '20px',
            aspectRatio: '1',
            marginBottom: '1.5rem'
          }}
        >
          {board.map((cell, idx) => {
            // Check if this move was just played
            const isLatestMove = currentStep > 0 && moves[currentStep - 1] === idx;
            return (
              <div
                key={idx}
                style={{
                  background: isLatestMove ? 'var(--accent-sage-lt)' : 'var(--cream)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(74,69,64,0.03)',
                  transition: 'background 0.2s ease'
                }}
              >
                {renderCellSymbol(cell)}
              </div>
            );
          })}
        </div>

        {/* Step Indicator */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--stone-600)' }}>
          Step {currentStep} / {moves.length}
        </div>

        {/* Control Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '1.5rem' }}>
          <button 
            onClick={handleReset}
            className="dv-btn"
            style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--stone-200)', color: 'var(--stone-700)' }}
            title="Restart Replay"
          >
            <RotateCcw size={16} />
          </button>
          
          <button 
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="dv-btn"
            style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--stone-200)', color: 'var(--stone-700)' }}
            title="Previous Move"
          >
            <SkipBack size={16} />
          </button>

          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={currentStep >= moves.length && !isPlaying}
            className="dv-btn dv-btn-primary"
            style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', padding: 0 }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 3 }} />}
          </button>

          <button 
            onClick={handleNext}
            disabled={currentStep >= moves.length}
            className="dv-btn"
            style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--stone-200)', color: 'var(--stone-700)' }}
            title="Next Move"
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Speed Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--stone-400)', textTransform: 'uppercase' }}>Speed:</span>
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              style={{
                border: 'none',
                background: speed === s ? 'var(--accent-sage-lt)' : 'transparent',
                color: speed === s ? 'var(--accent-sage)' : 'var(--stone-400)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {s}x
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

export default TicTacToeReplay;
