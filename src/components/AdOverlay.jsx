import React, { useState, useEffect } from 'react';

export default function AdOverlay({ onAdComplete }) {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isClickable, setIsClickable] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsClickable(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleClose = () => {
    if (isClickable || timeLeft <= 0) {
      onAdComplete();
    }
  };

  // Progress circle calculate percentage
  const strokeDashoffset = 251.2 - (251.2 * (30 - timeLeft)) / 30;

  return (
    <div className="ad-fullscreen-wrapper">
      
      {/* Main Ad Box */}
      <div className="ad-card">
        
        {/* Ad Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>ADVERTISEMENT</span>
          
          <button 
            onClick={handleClose}
            disabled={!isClickable}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: isClickable ? '1px solid #ef4444' : '1px solid #334155',
              backgroundColor: isClickable ? '#7f1d1d' : 'transparent',
              color: isClickable ? '#fca5a5' : '#475569',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: isClickable ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
          >
            ✕
          </button>
        </div>

        {/* Mock Ad Content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: '12px 0' }}>
          {/* Animated Brain Logo */}
          <div 
            className="float-animation"
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
            }}
          >
            🧠
          </div>
          
          <div>
            <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>NEURO-GRID</h4>
            <p style={{ fontSize: '10px', color: '#818cf8', fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '4px 0 0 0' }}>Next Release: Memory Training</p>
          </div>

          <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '320px', margin: 0, lineHeight: '1.5' }}>
            Improve your working memory, reaction speed, and fluid intelligence by competing in head-to-head grid battles!
          </p>

          <div style={{ display: 'flex', gap: '12px', fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
            <span>● Free daily entries</span>
            <span>● Up to ₹100 payouts</span>
          </div>
        </div>

        {/* Countdown / Interactive Area */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {/* Timer Circle */}
          <div style={{ position: 'relative', width: '96px', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* SVG Progress Circle */}
            <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle 
                cx="48" 
                cy="48" 
                r="40" 
                stroke="#1e293b" 
                strokeWidth="4" 
                fill="transparent" 
              />
              <circle 
                cx="48" 
                cy="48" 
                r="40" 
                stroke="#06b6d4" 
                strokeWidth="4" 
                fill="transparent" 
                strokeDasharray="251.2"
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {timeLeft > 0 ? (
                <>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace', color: '#ffffff', lineHeight: '1' }}>{timeLeft}</span>
                  <span style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Seconds</span>
                </>
              ) : (
                <span className="pulse-animation" style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px' }}>Ready</span>
              )}
            </div>
          </div>

          <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
            {timeLeft > 0 
              ? 'Results will unlock after the video ends...' 
              : 'Match results unlocked! Click the (X) above to continue.'
            }
          </p>
        </div>

        {/* Dev tool helper */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', width: '100%', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: '#475569' }}>
          <span>Sponsors: Google AdMob / Unity Ads</span>
          <button 
            onClick={onAdComplete}
            style={{ color: '#06b6d4', textDecoration: 'underline', backgroundColor: 'transparent', border: 'none', fontSize: '9px', cursor: 'pointer' }}
          >
            [Dev Cheat: Fast Skip Ad]
          </button>
        </div>

      </div>
    </div>
  );
}
