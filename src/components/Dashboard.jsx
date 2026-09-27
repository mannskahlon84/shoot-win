import React, { useState, useEffect } from 'react';

export default function Dashboard({ 
  bonusCoins, 
  winningsCoins, 
  loginStreak, 
  tiers, 
  globalLevel,
  onStartMatch, 
  onWithdraw,
  onSimulateSkip,
  onUpdateCoins,
  userProfile,
  onLogin,
  onLogout,
  onResetLevel
}) {
  // Auth Form details
  const [authMode, setAuthMode] = useState('SIGNUP'); // SIGNUP | SIGNIN
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  // Settings/Menu slide-out drawer state
  const [showMenu, setShowMenu] = useState(false);
  const [lobbyMode, setLobbyMode] = useState('CASH'); // 'CASH' | 'OFFLINE'

  // OTP Verification States
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpTarget, setOtpTarget] = useState('EMAIL'); // 'EMAIL' | 'PHONE'
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(30);

  // Profile fields
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileUpi, setProfileUpi] = useState('');
  const [profileBankName, setProfileBankName] = useState('');
  const [profileBankAcc, setProfileBankAcc] = useState('');
  const [profileBankIfsc, setProfileBankIfsc] = useState('');
  const [profilePaypal, setProfilePaypal] = useState('');
  const [profileApplePay, setProfileApplePay] = useState('');

  // Selected Match Tier Tab (Tier 1 is default)
  const [selectedTierTab, setSelectedTierTab] = useState(1);
  
  // Settings menu sections: 'MAIN' | 'WINNINGS' | 'WITHDRAW' | 'ENTRY_COINS' | 'EARN_ADS'
  const [menuSection, setMenuSection] = useState('MAIN');

  // Withdrawal States
  const [withdrawMethod, setWithdrawMethod] = useState('UPI'); // UPI | BANK | PAYPAL
  const [upiId, setUpiId] = useState('');
  const [bankAcc, setBankAcc] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState(2000); // default minimum 2,000 coins (Rs 20)
  const [withdrawStatus, setWithdrawStatus] = useState('IDLE'); // IDLE | PROCESSING | SUCCESS

  // Earn Free Credits via Ads States
  const [adWatchesToday, setAdWatchesToday] = useState(0);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(60);

  // Sync profile details if logged in
  useEffect(() => {
    if (userProfile) {
      setProfileName(userProfile.name || '');
      setProfileEmail(userProfile.email || '');
      setProfilePhone(userProfile.phone || '');
      setProfileUpi(userProfile.upi || '');
      setProfileBankName(userProfile.bankName || '');
      setProfileBankAcc(userProfile.bankAcc || '');
      setProfileBankIfsc(userProfile.bankIfsc || '');
      setProfilePaypal(userProfile.paypal || '');
      setProfileApplePay(userProfile.applePay || '');
    }
  }, [userProfile]);

  // OTP Countdown timer
  useEffect(() => {
    let id;
    if (menuSection === 'VERIFY_OTP' && otpTimer > 0) {
      id = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(id);
  }, [menuSection, otpTimer]);

  // Initialize and check daily ad limit
  useEffect(() => {
    const todayStr = new Date().toDateString();
    const savedAdDate = localStorage.getItem('saw_lastAdDate');
    const savedAdWatches = localStorage.getItem('saw_adWatchesToday');

    if (savedAdDate !== todayStr) {
      localStorage.setItem('saw_lastAdDate', todayStr);
      localStorage.setItem('saw_adWatchesToday', '0');
      setAdWatchesToday(0);
    } else if (savedAdWatches) {
      setAdWatchesToday(parseInt(savedAdWatches, 10));
    }
  }, []);

  // 60-Second Video Ad Countdown timer
  useEffect(() => {
    let timer;
    if (isWatchingAd && adCountdown > 0) {
      timer = setInterval(() => {
        setAdCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAdWatchComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isWatchingAd, adCountdown]);

  const handleStartAdWatch = () => {
    if (adWatchesToday >= 5) {
      alert('You have reached the daily limit of 5 ads. Try again tomorrow!');
      return;
    }
    setIsWatchingAd(true);
    setAdCountdown(60);
  };

  const handleAdWatchComplete = () => {
    setIsWatchingAd(false);
    const nextWatches = adWatchesToday + 1;
    setAdWatchesToday(nextWatches);
    localStorage.setItem('saw_adWatchesToday', nextWatches.toString());

    // Add +10 Bonus coins to wallet
    onUpdateCoins(bonusCoins + 10, winningsCoins);
    alert('🎉 +10 Bonus Coins added to your wallet successfully!');
  };

  // Convert Coins to money string
  const coinsToMoneyStr = (coins) => `₹${(coins / 100).toFixed(2)}`;

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    
    // Validations
    if (withdrawMethod === 'UPI') {
      if (!upiId.trim() || !upiId.includes('@')) {
        alert('Please enter a valid UPI ID (e.g. name@oksbi)');
        return;
      }
    } else if (withdrawMethod === 'BANK') {
      if (!bankAcc.trim() || !bankIfsc.trim() || !bankName.trim()) {
        alert('Please fill out all bank account fields.');
        return;
      }
    } else if (withdrawMethod === 'PAYPAL') {
      if (!paypalEmail.trim() || !paypalEmail.includes('@')) {
        alert('Please enter a valid PayPal Email Address.');
        return;
      }
    }

    if (winningsCoins < withdrawAmount) {
      alert('Insufficient winnings balance!');
      return;
    }

    setWithdrawStatus('PROCESSING');
    
    setTimeout(() => {
      const success = onWithdraw(withdrawAmount);
      if (success) {
        setWithdrawStatus('SUCCESS');
      } else {
        setWithdrawStatus('IDLE');
        alert('Failed to withdraw. Please check your winnings balance.');
      }
    }, 2000);
  };

  const resetWithdrawForm = () => {
    setWithdrawStatus('IDLE');
    setUpiId('');
    setBankAcc('');
    setBankIfsc('');
    setBankName('');
    setPaypalEmail('');
  };

  // Calculate level difficulty dynamically
  const getDifficulty = (lvl) => {
    if (lvl === 1) return 'Easy';
    if (lvl === 2) return 'Normal';
    if (lvl === 3) return 'Hard';
    if (lvl === 4) return 'Very Hard';
    const diffs = ['Hard', 'Very Hard', 'Expert', 'Insane'];
    return diffs[(lvl + 3) % diffs.length];
  };
  const activeDifficulty = getDifficulty(globalLevel);

  const selectedTier = tiers.find(t => t.id === selectedTierTab) || tiers[0];
  const hasSufficientCoins = (bonusCoins >= selectedTier.entryFee || winningsCoins >= selectedTier.entryFee);

  return (
    <div className="dashboard-wrapper">
      
      {/* 1. LOBBY TOP BAR */}
      <div className="lobby-header">
        <div className="logo-container">
          <span className="logo-text">SHOOT & WIN</span>
        </div>

        <div className="top-stats-row">
          {/* Daily Coins Badge (Top Right) */}
          <div className="badge-coins" title="Daily Credits/Bonus Wallet">
            <span>🪙</span>
            <span style={{ fontFamily: 'monospace' }}>{bonusCoins}</span>
          </div>

          {/* Menu Button (Three Lines) */}
          <button 
            onClick={() => {
              setMenuSection('MAIN');
              setShowMenu(true);
            }}
            className="btn-hamburger"
          >
            ☰
          </button>
        </div>
      </div>

      {/* 2. MODE SELECTOR (CASH VS OFFLINE) */}
      <div className="mode-toggles">
        <button
          onClick={() => setLobbyMode('CASH')}
          className={`btn-mode-tab ${lobbyMode === 'CASH' ? 'active' : 'inactive'}`}
        >
          🏆 Cash Matches
        </button>
        <button
          onClick={() => setLobbyMode('OFFLINE')}
          className={`btn-mode-tab ${lobbyMode === 'OFFLINE' ? 'active' : 'inactive'}`}
        >
          🕹️ Offline Levels
        </button>
      </div>

      {/* 3. DYNAMIC CONTENT: CASH LOBBY OR OFFLINE CAMPAIGN */}
      {lobbyMode === 'CASH' ? (
        /* Match Selection: Stacked Vertically */
        <div className="tier-tabs-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span className="section-title">Available Tournaments</span>
          </div>
          
          {tiers.map((t) => {
            const hasSufficient = (bonusCoins >= t.entryFee || winningsCoins >= t.entryFee);
            return (
              <div className="tier-details-card" key={t.id} style={{ margin: 0 }}>
                <div className="card-decor-glow"></div>
                
                <div className="card-header-row">
                  <h4 className="card-title" style={{ fontSize: '13px', fontWeight: '900', color: 'var(--text-dark)' }}>{t.name} (Entry: {t.entryFee} Coins)</h4>
                  <span className="card-badge" style={{ backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}>Win {t.payout} Coins</span>
                </div>

                <div className="match-payout-grid" style={{ paddingBottom: '12px' }}>
                  <div>
                    <span className="value-label">Entry Fee</span>
                    <span className="value-coins" style={{ fontSize: '13px' }}>{t.entryFee} Coins</span>
                    <span className="value-cash">({coinsToMoneyStr(t.entryFee)})</span>
                  </div>
                  <div>
                    <span className="value-label">Winner Payout</span>
                    <span className="value-coins payout-high" style={{ fontSize: '14px', color: 'var(--success-green)' }}>{t.payout} Coins</span>
                    <span className="value-cash">({coinsToMoneyStr(t.payout)})</span>
                  </div>
                </div>

                <button 
                  onClick={() => onStartMatch(t)}
                  disabled={!hasSufficient}
                  className="btn-play-match"
                  style={{ padding: '10px 14px', fontSize: '12px' }}
                >
                  {hasSufficient ? `⚡ Play Tier ${t.id}` : '❌ Insufficient Balance'}
                </button>
                
                {!hasSufficient && (
                  <p style={{ fontSize: '9px', textAlign: 'center', color: '#f43f5e', fontWeight: 'bold', margin: '4px 0 0 0' }}>
                    Earn free credits in settings or watch an ad to participate!
                  </p>
                )}
              </div>
            );
          })}
        </div>) : (
        <div className="tier-tabs-container">
          <div>
            <span className="section-title">Campaign Progress</span>
          </div>

          <div className="tier-details-card">
            <div className="card-decor-glow"></div>

            <div className="card-header-row">
              <h4 className="card-title">Level {globalLevel}</h4>
              <span className="card-badge" style={{ backgroundColor: '#ecfdf5', color: '#10b981', borderColor: '#a7f3d0' }}>Campaign</span>
            </div>

            <div className="match-payout-grid">
              <div>
                <span className="value-label">Entry Cost</span>
                <span className="value-coins">FREE</span>
                <span className="value-cash">(0 Coins)</span>
              </div>
              <div>
                <span className="value-label">Win Reward</span>
                <span className="value-coins payout-high" style={{ color: '#10b981' }}>+5 Coins</span>
                <span className="value-cash">(Daily Credits)</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <span style={{ fontWeight: 'bold', color: '#475569' }}>Stage Objectives:</span>
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', fontSize: '11px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Kill at least <strong>{30 + globalLevel * 10} zombies</strong></li>
                <li>Survive the 60s runner timer</li>
                <li>Defeat the **Giant Zombie Titan Boss**</li>
              </ul>
            </div>

            <button 
              onClick={() => onStartMatch({ 
                id: 0, 
                name: `Offline Level ${globalLevel}`, 
                entryFee: 0, 
                payout: 5, 
                rake: 0, 
                isOffline: true 
              })}
              className="btn-play-match"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 6px 18px rgba(16, 185, 129, 0.25)' }}
            >
              ▶ Start Level {globalLevel}
            </button>
          </div>
        </div>
      )}

      {/* 3. COMING SOON EXPANSION GAMES */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">More Games Coming</span>
        
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 border-dashed p-3.5 rounded-2xl opacity-60">
            <span className="text-lg">🎯</span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-600">Shoot & Win (Beta runner)</span>
              <span className="text-[9px] text-slate-400">Active head-to-head calculations. Release v1.4</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 border-dashed p-3.5 rounded-2xl opacity-60">
            <span className="text-lg">🧠</span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-600">Memory Matrix grid</span>
              <span className="text-[9px] text-slate-400">Recall layout coordinates under pressure. Release v1.5</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SETTINGS DRAWER MENU OVERLAY */}
      {showMenu && (
        <div className="settings-overlay" onClick={() => setShowMenu(false)}>
          <div className="settings-drawer" onClick={(e) => e.stopPropagation()}>
            
            {/* Drawer Header */}
            <div className="drawer-header">
              <h3 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                {menuSection === 'MAIN' ? 'MENU & WALLETS' : menuSection.replace('_', ' ')}
              </h3>
              
              <button 
                onClick={() => {
                  if (menuSection === 'MAIN') {
                    setShowMenu(false);
                  } else {
                    setMenuSection('MAIN');
                  }
                }}
                className="btn-drawer-close"
              >
                {menuSection === 'MAIN' ? '✕' : '←'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', margin: '4px 0 12px 0' }}>
              <span>Streak: {loginStreak} Days</span>
            </div>
            
            {/* SUB-SECTION: MAIN SETTINGS DIRECTORY */}
            {menuSection === 'MAIN' && (
              <div className="flex-grow" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Account Details Card */}
                <div className="account-card">
                  <span className="section-title">Account Status</span>
                  {userProfile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-dark)' }}>👤 {userProfile.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📧 {userProfile.email}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📱 UPI: {userProfile.phone}</span>
                      
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <button
                          onClick={() => setMenuSection('PROFILE_DETAILS')}
                          style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          ⚙️ Profile Info
                        </button>
                        <button
                          onClick={() => {
                            onLogout();
                            setEmailVerified(false);
                            setPhoneVerified(false);
                            alert('Logged out successfully.');
                          }}
                          style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>👤 Guest Player (Offline Mode)</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-light)', lineHeight: '1.4' }}>
                        Sign up to verify details, add payout credentials and cash out!
                      </span>
                      <button
                        onClick={() => {
                          setAuthMode('SIGNUP');
                          setMenuSection('AUTH_FLOW');
                        }}
                        style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px', alignSelf: 'flex-start' }}
                      >
                        🔓 Sign Up / Log In
                      </button>
                    </div>
                  )}
                </div>

                {/* Winnings coins tile */}
                <button 
                  onClick={() => {
                    if (!userProfile) {
                      setAuthMode('SIGNUP');
                      setMenuSection('AUTH_FLOW');
                      alert('Profile account required to view Winnings. Please register below.');
                      return;
                    }
                    setMenuSection('WINNINGS_WALLET');
                  }}
                  className="wallet-tile"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '9px', color: '#b45309', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Winnings Wallet</span>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#78350f', fontFamily: 'monospace' }}>{winningsCoins} Coins</span>
                    <span style={{ fontSize: '10px', color: '#d97706' }}>({coinsToMoneyStr(winningsCoins)})</span>
                  </div>
                  <span style={{ color: '#d97706', fontWeight: 'bold' }}>→</span>
                </button>

                {/* Entry coins tile */}
                <button 
                  onClick={() => setMenuSection('ENTRY_COINS_RULES')}
                  className="menu-list-tile"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span className="section-title">Entry Coins (Daily Credits)</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-dark)', fontFamily: 'monospace' }}>{bonusCoins} Coins</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Streak rules & streaks</span>
                  </div>
                  <span style={{ color: 'var(--text-light)', fontWeight: 'bold' }}>→</span>
                </button>

                {/* Withdraw panel tile */}
                <button 
                  onClick={() => {
                    if (!userProfile) {
                      setAuthMode('SIGNUP');
                      setMenuSection('AUTH_FLOW');
                      alert('Profile account required to withdraw cash. Please register below.');
                      return;
                    }
                    if (!emailVerified || !phoneVerified) {
                      alert('Please verify your Email & Mobile Phone under Profile details before cashing out!');
                      setMenuSection('PROFILE_DETAILS');
                      return;
                    }
                    setMenuSection('WITHDRAW_METHOD');
                  }}
                  className="menu-list-tile"
                  style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '9px', color: '#1e40af', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Withdraw Cash</span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a' }}>UPI / Bank / PayPal / Apple Pay</span>
                    <span style={{ fontSize: '9px', color: '#2563eb' }}>Min limit: ₹20.00 (2000 Coins)</span>
                  </div>
                  <span style={{ color: '#2563eb', fontWeight: 'bold' }}>→</span>
                </button>

                {/* Earn rewards tile */}
                <button 
                  onClick={() => setMenuSection('EARN_ADS_CREDITS')}
                  className="menu-list-tile"
                  style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '9px', color: '#166534', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Earn Free Credits</span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#14532d' }}>🎥 Watch 60s Ad for +10 Coins</span>
                    <span style={{ fontSize: '9px', color: '#16a34a' }}>Limit: {adWatchesToday} / 5 watched</span>
                  </div>
                  <span style={{ color: '#16a34a', fontWeight: 'bold' }}>→</span>
                </button>

                {/* Simulation trigger & Reset Levels */}
                <div className="mt-8 border-t border-slate-100 pt-4 flex flex-col gap-2">
                  <button 
                    onClick={() => {
                      onResetLevel();
                      alert('🔄 Level progress reset back to Level 1 successfully!');
                    }}
                    className="w-full py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1 border-none"
                  >
                    ⚙️ Reset Levels (Back to Level 1)
                  </button>
                  <button 
                    onClick={onSimulateSkip}
                    className="w-full py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 rounded-xl text-xs font-semibold cursor-pointer transition-all border-none"
                  >
                    🛠️ Simulate 1 Day Skip (Developer Tool)
                  </button>
                </div>
              </div>
            )}

            {/* SUB-SECTION: AUTH SIGN UP / SIGN IN FLOW */}
            {menuSection === 'AUTH_FLOW' && (
              <div className="flex flex-col gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center flex flex-col gap-1.5">
                  <span className="text-lg">🔐</span>
                  <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider">
                    {authMode === 'SIGNUP' ? 'Create Account' : 'Sign In'}
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Real-money matches and cashouts require a verified profile. Register below to connect your wallets!
                  </p>
                </div>

                {/* Toggle tab */}
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setAuthMode('SIGNUP')}
                    className={`py-1.5 rounded-lg text-[10px] font-bold border-none cursor-pointer transition-all ${
                      authMode === 'SIGNUP' ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-slate-500'
                    }`}
                  >
                    Register
                  </button>
                  <button
                    onClick={() => setAuthMode('SIGNIN')}
                    className={`py-1.5 rounded-lg text-[10px] font-bold border-none cursor-pointer transition-all ${
                      authMode === 'SIGNIN' ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-slate-500'
                    }`}
                  >
                    Login
                  </button>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (authMode === 'SIGNUP') {
                      if (!authName || !authEmail || !authPassword || !authPhone) {
                        alert('Please fill out all fields!');
                        return;
                      }
                      // Go to OTP verification step
                      setOtpTarget('EMAIL');
                      setOtpTimer(30);
                      setOtpCode('');
                      setMenuSection('VERIFY_OTP');
                    } else {
                      if (!authEmail || !authPassword) {
                        alert('Please enter email and password!');
                        return;
                      }
                      // Direct login for existing accounts
                      onLogin({ name: authEmail.split('@')[0], email: authEmail, phone: '9876543210' });
                      setEmailVerified(true);
                      setPhoneVerified(true);
                      alert('🔑 Logged in successfully!');
                      setMenuSection('MAIN');
                    }
                  }}
                  className="flex flex-col gap-2.5"
                >
                  {authMode === 'SIGNUP' && (
                    <input 
                      type="text" 
                      placeholder="Full Name"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="input-box"
                      required
                    />
                  )}
                  <input 
                    type="email" 
                    placeholder="Email Address"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="input-box"
                    required
                  />
                  <input 
                    type="password" 
                    placeholder="Password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="input-box"
                    required
                  />
                  {authMode === 'SIGNUP' && (
                    <input 
                      type="tel" 
                      placeholder="Mobile Phone Number"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      className="input-box"
                      required
                    />
                  )}

                  <button 
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold border-none cursor-pointer mt-2 shadow"
                  >
                    {authMode === 'SIGNUP' ? 'Proceed to OTP Verification' : 'Verify & Sign In'}
                  </button>
                </form>
              </div>
            )}

            {/* SUB-SECTION: OTP VERIFICATION SIMULATOR */}
            {menuSection === 'VERIFY_OTP' && (
              <div className="flex flex-col gap-4">
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center flex flex-col gap-1">
                  <span className="text-lg">⏳</span>
                  <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider">OTP Verification</h4>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    We sent a 4-digit code to your <strong>{otpTarget === 'EMAIL' ? 'Email' : 'Mobile Phone'}</strong>.
                    <br/>
                    Enter code below. <strong>(Use '1234' to verify)</strong>
                  </p>
                </div>

                <div className="flex flex-col gap-3 items-center">
                  <input 
                    type="text" 
                    maxLength={4}
                    placeholder="Enter 4-digit OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g,''))}
                    className="w-40 text-center tracking-widest text-lg font-black font-mono py-2.5 border border-slate-300 rounded-xl bg-slate-50"
                  />

                  <div className="text-[10px] font-bold text-slate-400">
                    {otpTimer > 0 ? (
                      <span>Resend OTP in <b className="text-slate-600 font-mono">{otpTimer}s</b></span>
                    ) : (
                      <button 
                        onClick={() => {
                          setOtpTimer(30);
                          alert('OTP Resent successfully!');
                        }}
                        className="bg-transparent border-none text-blue-600 underline font-bold cursor-pointer"
                      >
                        Resend OTP Code
                      </button>
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      if (otpCode === '1234') {
                        if (otpTarget === 'EMAIL') {
                          setEmailVerified(true);
                          alert('✅ Email address verified successfully!');
                          setOtpTarget('PHONE');
                          setOtpTimer(30);
                          setOtpCode('');
                        } else {
                          setPhoneVerified(true);
                          alert('✅ Mobile phone verified successfully!');
                          onLogin({ 
                            name: authName || authEmail.split('@')[0], 
                            email: authEmail, 
                            phone: authPhone || '9876543210',
                            emailVerified: true,
                            phoneVerified: true 
                          });
                          alert('🎉 Registration complete! Welcome to Shoot & Win.');
                          setMenuSection('MAIN');
                        }
                      } else {
                        alert('❌ Incorrect OTP code! Please use code 1234 to verify.');
                      }
                    }}
                    className="w-full py-3 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold border-none cursor-pointer shadow"
                  >
                    Confirm Code
                  </button>
                </div>
              </div>
            )}

            {/* SUB-SECTION: PROFILE DETAILS & PAYOUT SETUP */}
            {menuSection === 'PROFILE_DETAILS' && (
              <div className="flex flex-col gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Personal Details</span>
                  <div className="flex flex-col gap-1.5 text-xs">
                    <span className="font-semibold text-slate-700">Name: <b className="text-slate-900 font-bold">{profileName}</b></span>
                    
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-slate-600">Email: <span className="font-semibold text-slate-800">{profileEmail}</span></span>
                      {emailVerified ? (
                        <span className="text-[9px] bg-green-50 text-green-600 border border-green-200 px-1.5 py-0.5 rounded-full font-bold">✓ Verified</span>
                      ) : (
                        <button 
                          onClick={() => {
                            setOtpTarget('EMAIL');
                            setOtpTimer(30);
                            setOtpCode('');
                            setMenuSection('VERIFY_OTP');
                          }}
                          className="text-[9px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold cursor-pointer"
                        >
                          Verify
                        </button>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      <span className="text-slate-600">Phone: <span className="font-semibold text-slate-800">{profilePhone}</span></span>
                      {phoneVerified ? (
                        <span className="text-[9px] bg-green-50 text-green-600 border border-green-200 px-1.5 py-0.5 rounded-full font-bold">✓ Verified</span>
                      ) : (
                        <button 
                          onClick={() => {
                            setOtpTarget('PHONE');
                            setOtpTimer(30);
                            setOtpCode('');
                            setMenuSection('VERIFY_OTP');
                          }}
                          className="text-[9px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold cursor-pointer"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit Payment Methods */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    onLogin({
                      ...userProfile,
                      name: profileName,
                      email: profileEmail,
                      phone: profilePhone,
                      upi: profileUpi,
                      bankName: profileBankName,
                      bankAcc: profileBankAcc,
                      bankIfsc: profileBankIfsc,
                      paypal: profilePaypal,
                      applePay: profileApplePay
                    });
                    alert('💾 Profile details and payout methods updated successfully!');
                    setMenuSection('MAIN');
                  }}
                  className="flex flex-col gap-3"
                >
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Payout Accounts</span>
                  
                  <div className="flex flex-col gap-2 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Paytm / UPI ID</span>
                    <input 
                      type="text" 
                      placeholder="e.g. name@paytm" 
                      value={profileUpi}
                      onChange={(e) => setProfileUpi(e.target.value)}
                      className="input-box"
                    />
                  </div>

                  <div className="flex flex-col gap-2 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Bank Account Details</span>
                    <input 
                      type="text" 
                      placeholder="Account Holder Name" 
                      value={profileBankName}
                      onChange={(e) => setProfileBankName(e.target.value)}
                      className="input-box"
                    />
                    <input 
                      type="text" 
                      placeholder="Account Number" 
                      value={profileBankAcc}
                      onChange={(e) => setProfileBankAcc(e.target.value)}
                      className="input-box"
                      style={{ marginTop: '4px' }}
                    />
                    <input 
                      type="text" 
                      placeholder="IFSC Code" 
                      value={profileBankIfsc}
                      onChange={(e) => setProfileBankIfsc(e.target.value)}
                      className="input-box"
                      style={{ marginTop: '4px' }}
                    />
                  </div>

                  <div className="flex flex-col gap-2 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">PayPal Account</span>
                    <input 
                      type="email" 
                      placeholder="PayPal Email Address" 
                      value={profilePaypal}
                      onChange={(e) => setProfilePaypal(e.target.value)}
                      className="input-box"
                    />
                  </div>

                  <div className="flex flex-col gap-2 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Apple Pay ID</span>
                    <input 
                      type="text" 
                      placeholder="Apple Pay email / phone" 
                      value={profileApplePay}
                      onChange={(e) => setProfileApplePay(e.target.value)}
                      className="input-box"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold border-none cursor-pointer mt-2"
                  >
                    Save Profile & Payout Accounts
                  </button>
                </form>
              </div>
            )}

            {/* SUB-SECTION: WINNINGS WALLET DETAILS */}
            {menuSection === 'WINNINGS_WALLET' && (
              <div className="flex flex-col gap-4">
                <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-2xl text-center">
                  <span className="text-xs text-amber-700 font-bold block uppercase tracking-widest">Winnings Balance</span>
                  <span className="text-3xl font-black text-amber-800 block mt-1 font-mono">{winningsCoins} Coins</span>
                  <span className="text-sm font-semibold text-amber-600">Cash Value: {coinsToMoneyStr(winningsCoins)}</span>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Coin Exchange Formula</h4>
                  <div className="flex justify-between items-center text-xs text-slate-600 border-b border-slate-200 pb-2">
                    <span>Rate:</span>
                    <span className="font-bold">1,000 Coins = ₹10.00</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>Payout Limit:</span>
                    <span className="font-bold">Min ₹20.00 (2,000 Coins)</span>
                  </div>
                </div>

                <button 
                  onClick={() => setMenuSection('WITHDRAW_METHOD')}
                  disabled={winningsCoins < 2000}
                  className={`w-full py-3.5 rounded-2xl text-xs font-bold text-white shadow-md border-none cursor-pointer transition-all ${
                    winningsCoins >= 2000
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-slate-300 shadow-none cursor-not-allowed'
                  }`}
                >
                  {winningsCoins >= 2000 ? '💰 Proceed to Cashout' : '❌ Below Minimum (₹20)'}
                </button>
              </div>
            )}

            {/* SUB-SECTION: ENTRY COINS RULES */}
            {menuSection === 'ENTRY_COINS_RULES' && (
              <div className="flex flex-col gap-4">
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl text-center">
                  <span className="text-xs text-slate-500 font-bold block uppercase tracking-widest">Bonus Credits</span>
                  <span className="text-3xl font-black text-slate-700 block mt-1 font-mono">{bonusCoins} Coins</span>
                  <span className="text-xs text-slate-400 block mt-0.5">Consecutive check-in: {loginStreak} days</span>
                </div>

                <div className="bg-amber-50 border border-amber-100 text-amber-900 rounded-2xl p-4 flex flex-col gap-3 text-xs leading-relaxed">
                  <div className="flex items-center gap-2 text-amber-800 font-bold uppercase tracking-wider text-[10px]">
                    ⚠️ IMPORTANT WALLET RULES
                  </div>
                  <p>
                    <strong>Daily credits carry-forward</strong> only works when the user logs in <strong>consecutively</strong> every single day.
                  </p>
                  <p>
                    If you miss a day, the daily credit resets back to <strong>100 Coins</strong> (₹1.00) and your streak reset indicator will trigger.
                  </p>
                  <p>
                    *Note: Bonus wallet credits cannot be directly converted to cash/winnings without playing and winning match matches first.
                  </p>
                </div>
              </div>
            )}

            {/* SUB-SECTION: WITHDRAW Cash panel */}
            {menuSection === 'WITHDRAW_METHOD' && (
              <div className="flex flex-col gap-4">
                
                {/* Method Toggles */}
                <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                  {['UPI', 'BANK', 'PAYPAL'].map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setWithdrawMethod(m);
                        resetWithdrawForm();
                      }}
                      className={`py-2 rounded-lg text-[10px] font-bold border-none cursor-pointer transition-all ${
                        withdrawMethod === m
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'bg-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {withdrawStatus === 'IDLE' && (
                  <form onSubmit={handleWithdrawSubmit} className="flex flex-col gap-4 mt-2">
                    
                    {/* Method Specific Fields */}
                    {withdrawMethod === 'UPI' && (
                      <div className="form-group">
                        <label className="form-label">Enter UPI Address</label>
                        <input 
                          type="text" 
                          placeholder="e.g. username@okhdfcbank" 
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="input-box"
                          required
                        />
                      </div>
                    )}

                    {withdrawMethod === 'BANK' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">Account Holder Name</label>
                          <input 
                            type="text" 
                            placeholder="Full Name" 
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="input-box"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Account Number</label>
                          <input 
                            type="text" 
                            placeholder="12-18 Digits Account No" 
                            value={bankAcc}
                            onChange={(e) => setBankAcc(e.target.value)}
                            className="input-box"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">IFSC Code</label>
                          <input 
                            type="text" 
                            placeholder="e.g. SBIN0001234" 
                            value={bankIfsc}
                            onChange={(e) => setBankIfsc(e.target.value)}
                            className="input-box"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {withdrawMethod === 'PAYPAL' && (
                      <div className="form-group">
                        <label className="form-label">PayPal Account Email</label>
                        <input 
                          type="email" 
                          placeholder="paypal_email@domain.com" 
                          value={paypalEmail}
                          onChange={(e) => setPaypalEmail(e.target.value)}
                          className="input-box"
                          required
                        />
                      </div>
                    )}

                    {/* Amount selection */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Withdraw Amount</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setWithdrawAmount(2000)}
                          className={`py-2.5 rounded-xl border font-bold text-xs transition-all ${
                            withdrawAmount === 2000
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : 'border-slate-200 text-slate-500'
                          }`}
                        >
                          ₹20 (2,000 Coins)
                        </button>
                        <button
                          type="button"
                          onClick={() => setWithdrawAmount(5000)}
                          className={`py-2.5 rounded-xl border font-bold text-xs transition-all ${
                            withdrawAmount === 5000
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : 'border-slate-200 text-slate-500'
                          }`}
                        >
                          ₹50 (5,000 Coins)
                        </button>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={winningsCoins < withdrawAmount}
                      className={`w-full py-3.5 mt-2 rounded-2xl text-xs font-bold text-white shadow-md border-none cursor-pointer transition-all ${
                        winningsCoins >= withdrawAmount
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-slate-300 shadow-none cursor-not-allowed'
                      }`}
                    >
                      {winningsCoins >= withdrawAmount ? '💰 Submit Withdrawal Request' : '❌ Insufficient Balance'}
                    </button>
                  </form>
                )}

                {withdrawStatus === 'PROCESSING' && (
                  <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Processing Transaction...</span>
                    <p className="text-[10px] text-slate-400">Verifying details with bank IMPS gateway.</p>
                  </div>
                )}

                {withdrawStatus === 'SUCCESS' && (
                  <div className="py-8 flex flex-col items-center justify-center gap-4 text-center">
                    <span className="text-4xl">🟢</span>
                    <span className="text-sm font-black text-green-600 uppercase tracking-widest">IMPS Payout Success!</span>
                    <p className="text-xs text-slate-500">
                      We have transferred <strong>{coinsToMoneyStr(withdrawAmount)}</strong> directly to your account. Transaction Ref: IMPS-{Math.floor(Math.random() * 900000 + 100000)}.
                    </p>
                    <button 
                      onClick={() => {
                        resetWithdrawForm();
                        setShowMenu(false);
                      }}
                      className="mt-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border-none cursor-pointer"
                    >
                      Close Menu
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SUB-SECTION: WATCH ADS FOR COINS */}
            {menuSection === 'EARN_ADS_CREDITS' && (
              <div className="flex flex-col gap-4 text-center">
                <span className="text-5xl my-2">🎥</span>
                
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Earn Entry Credits</span>
                  <span className="text-sm font-bold text-slate-700 mt-1">Watch 60-Second Video Ads</span>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed">
                    Watch a full 60-second video ad to receive <strong>+10 Bonus Coins</strong>. You can watch up to 5 video ads per day to replenish your entry wallet!
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 max-w-xs mx-auto w-full text-xs text-slate-600 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span>Credit payout:</span>
                    <span className="font-bold text-green-600">+10 Coins (₹0.10)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining today:</span>
                    <span className="font-bold">{5 - adWatchesToday} / 5 left</span>
                  </div>
                </div>

                {isWatchingAd ? (
                  <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col items-center gap-4 relative overflow-hidden mt-2">
                    <div className="absolute top-2 left-2 text-[8px] bg-red-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                      Live Sponsor Video
                    </div>
                    
                    <span className="text-xs text-gray-400 uppercase tracking-widest mt-4">Video playing...</span>
                    <span className="text-5xl font-black font-mono my-2 text-cyan-400">{adCountdown}s</span>
                    
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-cyan-400 h-full transition-all duration-1000"
                        style={{ width: `${(60 - adCountdown) / 60 * 100}%` }}
                      ></div>
                    </div>

                    <button 
                      onClick={handleAdWatchComplete}
                      className="mt-2 text-[9px] hover:text-cyan-400 underline cursor-pointer bg-transparent border-none text-gray-500"
                    >
                      Skip Ad (Dev Acelerate Shortcut)
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleStartAdWatch}
                    disabled={adWatchesToday >= 5}
                    className={`w-full py-3.5 mt-2 rounded-2xl text-xs font-bold text-white shadow-md border-none cursor-pointer transition-all ${
                      adWatchesToday < 5
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                        : 'bg-slate-300 shadow-none cursor-not-allowed'
                    }`}
                  >
                    {adWatchesToday < 5 ? '🎥 Watch 60s Video' : '❌ Daily Limit Reached'}
                  </button>
                )}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
