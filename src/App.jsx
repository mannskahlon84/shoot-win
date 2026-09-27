import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import GameArena from './components/GameArena';
import AdOverlay from './components/AdOverlay';
import ResultModal from './components/ResultModal';

export default function App() {
  const [gameState, setGameState] = useState('DASHBOARD'); // DASHBOARD | PLAYING | AD_PLAYING | RESULT
  const [bonusCoins, setBonusCoins] = useState(100);
  const [winningsCoins, setWinningsCoins] = useState(0);
  const [loginStreak, setLoginStreak] = useState(1);
  const [lastCheckIn, setLastCheckIn] = useState('');
  const [selectedTier, setSelectedTier] = useState(null);
  const [matchResult, setMatchResult] = useState(null); // { won: boolean, stats: {} }
  const [globalLevel, setGlobalLevel] = useState(1);
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('saw_userProfile');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (profileData) => {
    setUserProfile(profileData);
    localStorage.setItem('saw_userProfile', JSON.stringify(profileData));
  };

  const handleLogout = () => {
    setUserProfile(null);
    localStorage.removeItem('saw_userProfile');
  };

  // Play Tiers configuration
  const tiers = [
    { id: 1, name: 'Tier 1', entryFee: 10, payout: 15, rake: 5 },
    { id: 2, name: 'Tier 2', entryFee: 20, payout: 35, rake: 5 },
    { id: 3, name: 'Tier 3', entryFee: 30, payout: 50, rake: 10 },
  ];

  const [isSplash, setIsSplash] = useState(true);

  // Load state on mount
  useEffect(() => {
    const savedBonus = localStorage.getItem('saw_bonusCoins');
    const savedWinnings = localStorage.getItem('saw_winningsCoins');
    const savedStreak = localStorage.getItem('saw_loginStreak');
    const savedCheckIn = localStorage.getItem('saw_lastCheckIn');
    const savedLevel = localStorage.getItem('saw_globalLevel');

    if (savedWinnings !== null) setWinningsCoins(parseInt(savedWinnings, 10));
    if (savedLevel !== null) setGlobalLevel(parseInt(savedLevel, 10));

    const todayStr = new Date().toDateString();
    
    // Check daily reward
    if (savedCheckIn !== todayStr) {
      let nextStreak = 1;
      let nextBonus = 100;

      if (savedCheckIn) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (savedCheckIn === yesterdayStr) {
          nextStreak = savedStreak ? parseInt(savedStreak, 10) + 1 : 2;
          const currentBonus = savedBonus ? parseInt(savedBonus, 10) : 100;
          nextBonus = currentBonus + 100;
        }
      }
      setLoginStreak(nextStreak);
      setBonusCoins(nextBonus);
      localStorage.setItem('saw_loginStreak', nextStreak.toString());
      localStorage.setItem('saw_bonusCoins', nextBonus.toString());
      localStorage.setItem('saw_lastCheckIn', todayStr);
    } else {
      if (savedBonus !== null) setBonusCoins(parseInt(savedBonus, 10));
      if (savedStreak !== null) setLoginStreak(parseInt(savedStreak, 10));
    }

    // Splash Timer
    const timer = setTimeout(() => {
      setIsSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const updateCoins = (bonus, winnings) => {
    setBonusCoins(bonus);
    setWinningsCoins(winnings);
    localStorage.setItem('saw_bonusCoins', bonus.toString());
    localStorage.setItem('saw_winningsCoins', winnings.toString());
  };

  // Start match
  const handleStartMatch = (tier) => {
    if (tier.isOffline) {
      // Offline campaign is free!
    } else {
      if (bonusCoins >= tier.entryFee) {
        updateCoins(bonusCoins - tier.entryFee, winningsCoins);
      } else if (winningsCoins >= tier.entryFee) {
        updateCoins(bonusCoins, winningsCoins - tier.entryFee);
      } else {
        alert('Insufficient coins! Claim your daily reward or win matches to play.');
        return;
      }
    }

    setSelectedTier(tier);
    setGameState('PLAYING');
  };

  // Game complete
  const handleGameComplete = (won, gameStats) => {
    setMatchResult({ won, stats: gameStats });
    setGameState('AD_PLAYING');
  };

  // Finished watching post-match ad
  const handleAdFinished = () => {
    if (matchResult && matchResult.won && selectedTier) {
      if (selectedTier.isOffline) {
        // Offline Victory gives +5 Bonus Coins (Entry Credits)
        updateCoins(bonusCoins + 5, winningsCoins);
      } else {
        // Cash Victory gives Winnings Coins (Real Cash)
        updateCoins(bonusCoins, winningsCoins + selectedTier.payout);
      }
      const nextLevel = globalLevel + 1;
      setGlobalLevel(nextLevel);
      localStorage.setItem('saw_globalLevel', nextLevel.toString());
    }
    setGameState('RESULT');
  };

  // Go back to lobby
  const handleReturnToLobby = () => {
    setGameState('DASHBOARD');
    setSelectedTier(null);
    setMatchResult(null);
  };

  // Withdraw coins
  const handleWithdrawCoins = (amountCoins) => {
    if (winningsCoins < amountCoins) {
      alert('Insufficient winnings balance!');
      return false;
    }
    updateCoins(bonusCoins, winningsCoins - amountCoins);
    return true;
  };

  // Simulate skip day
  const handleSimulateDaySkip = () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    localStorage.setItem('saw_lastCheckIn', twoDaysAgo.toDateString());
    window.location.reload();
  };

  // Render Splash Screen
  if (isSplash) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '24px',
        boxSizing: 'border-box',
        fontFamily: "'Outfit', 'Space Grotesk', sans-serif",
        userSelect: 'none'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          maxWidth: '340px',
          width: '100%',
          textAlign: 'center'
        }}>
          {/* Centered Game Preview Image */}
          <div style={{
            width: '190px',
            height: '190px',
            borderRadius: '28px',
            overflow: 'hidden',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
            border: '5px solid #f1f5f9',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src="./game_preview.png" 
              alt="Shoot & Win Preview" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }} 
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 900,
              letterSpacing: '3px',
              color: '#0f172a',
              margin: 0,
              textTransform: 'uppercase'
            }}>
              SHOOT & WIN
            </h1>
            <p style={{
              fontSize: '10px',
              color: '#64748b',
              fontWeight: 'bold',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '1.5px'
            }}>
              1v1 PvP Clash Runner
            </p>
          </div>

          <div style={{
            width: '100%',
            height: '5px',
            backgroundColor: '#e2e8f0',
            borderRadius: '999px',
            overflow: 'hidden',
            marginTop: '10px',
            position: 'relative'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
              borderRadius: '999px',
              width: '100%',
              animation: 'loading-bar-splash 2.3s ease-in-out infinite'
            }}></div>
          </div>
          <span style={{
            fontSize: '9px',
            color: '#94a3b8',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1.5px'
          }}>
            Loading Assets & Matchmaking...
          </span>
        </div>

        {/* Inline CSS for loading animations */}
        <style>{`
          @keyframes loading-bar-splash {
            0% { width: 0%; left: 0%; }
            50% { width: 70%; left: 15%; }
            100% { width: 100%; left: 100%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* 3D Game Arena runs ONLY when active gameplay is on */}
      {gameState === 'PLAYING' ? (
        <GameArena 
          tier={selectedTier || tiers[0]}
          globalLevel={globalLevel}
          isDemo={false}
          onGameComplete={handleGameComplete}
          onExit={handleReturnToLobby}
        />
      ) : null}

      {/* Lobby Dashboard layered on solid white/slate background */}
      {gameState === 'DASHBOARD' && (
        <div className="overlay-wrapper">
          <Dashboard 
            bonusCoins={bonusCoins}
            winningsCoins={winningsCoins}
            loginStreak={loginStreak}
            tiers={tiers}
            globalLevel={globalLevel}
            onStartMatch={handleStartMatch}
            onWithdraw={handleWithdrawCoins}
            onSimulateSkip={handleSimulateDaySkip}
            onUpdateCoins={updateCoins}
            userProfile={userProfile}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onResetLevel={() => {
              setGlobalLevel(1);
              localStorage.setItem('saw_globalLevel', '1');
            }}
          />
        </div>
      )}

      {gameState === 'AD_PLAYING' && (
        <div className="overlay-wrapper absolute inset-0 z-20">
          <AdOverlay 
            onAdComplete={handleAdFinished}
          />
        </div>
      )}

      {gameState === 'RESULT' && (
        <div className="overlay-wrapper absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <ResultModal 
            result={matchResult}
            tier={selectedTier}
            onClose={handleReturnToLobby}
          />
        </div>
      )}
    </div>
  );
}
