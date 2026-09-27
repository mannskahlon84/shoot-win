import React from 'react';

export default function ResultModal({ result, tier, onClose }) {
  if (!result) return null;

  const { won, stats } = result;
  
  // Convert coins to Rs
  const coinsToRs = (coins) => (coins / 100).toFixed(2);

  return (
    <div className="result-fullscreen-wrapper">
      
      <div className="result-card">
        
        {/* Dynamic header */}
        <div>
          {won ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span className="result-badge animate-bounce">🏆</span>
              <h2 className="result-title won">
                MISSION CLEAR!
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>You survived the 60-second runner run!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span className="result-badge">💀</span>
              <h2 className="result-title lost">
                MISSION FAILED
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Your health was reduced to 0!</p>
            </div>
          )}
        </div>

        {/* Cash Rewards Board */}
        <div style={{
          backgroundColor: won ? '#fffbeb' : '#f8fafc',
          border: won ? '1px solid #fde68a' : '1px solid var(--border-light)',
          borderRadius: '20px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{ fontSize: '10px', color: 'var(--text-light)', uppercase: true, fontWeight: 'bold', letterSpacing: '1px' }}>MATCH WINNINGS</span>
          {won ? (
            <>
              <h3 style={{ fontSize: '32px', fontWeight: '900', fontFamily: 'monospace', color: 'var(--amber-gold)', margin: 0 }}>
                +{tier.payout} <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Coins</span>
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--success-green)', fontWeight: 'bold', margin: '4px 0 0 0' }}>
                Value: +₹{coinsToRs(tier.payout)} (Credited to Winnings)
              </p>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: '32px', fontWeight: '900', fontFamily: 'monospace', color: 'var(--text-muted)', margin: 0 }}>
                +0 <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-light)' }}>Coins</span>
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--rose-red)', fontWeight: 'bold', margin: '4px 0 0 0' }}>
                Lost Entry fee of {tier.entryFee} Coins (₹{coinsToRs(tier.entryFee)})
              </p>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="result-stats-container">
          <h4 style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'left', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px', margin: '0 0 4px 0' }}>
            MATCH BREAKDOWN
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="result-stat-row">
              <span>Final Score:</span>
              <span className="result-stat-val">{stats.score}</span>
            </div>

            <div className="result-stat-row">
              <span>Enemies Wasted:</span>
              <span className="result-stat-val" style={{ color: 'var(--rose-red)' }}>{stats.enemiesKilled}</span>
            </div>

            <div className="result-stat-row">
              <span>Max Squad Size:</span>
              <span className="result-stat-val" style={{ color: 'var(--primary-blue)' }}>{stats.maxCrowdSize}</span>
            </div>

            <div className="result-stat-row">
              <span>Global Rank:</span>
              <span className="result-stat-val" style={{ color: 'var(--amber-gold)' }}>Lv.{stats.wavesCleared}</span>
            </div>
          </div>
        </div>

        {/* Return Button */}
        <button 
          onClick={onClose}
          className="btn-play-match"
          style={{
            background: won ? 'linear-gradient(135deg, var(--amber-gold) 0%, #d97706 100%)' : 'linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-indigo) 100%)',
            boxShadow: won ? '0 6px 18px rgba(245, 158, 11, 0.25)' : '0 6px 18px rgba(37, 99, 235, 0.25)'
          }}
        >
          Return to Lobby
        </button>

      </div>
    </div>
  );
}
