import { useState, useEffect, useRef } from 'react';
import { Wallet, ShoppingCart, Store, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Wallet as WalletType } from '../../types';
import { BuyerDashboard } from './BuyerDashboard';
import { SellerDashboard } from './SellerDashboard';
import { EnhancedProfilePage } from '../profile/EnhancedProfilePage';
import { NotificationBell } from '../notifications/NotificationBell';
import { ChatWindow } from '../chat/ChatWindow';
import './EnhancedUserDashboard.css';

// Sound file for typing effect
const typingSound = new Audio('/sounds/typing.mp3');

export const EnhancedUserDashboard = () => {
  const { profile, signOut } = useAuth();
  const [mode, setMode] = useState<'buyer' | 'seller'>('buyer');
  const [showProfile, setShowProfile] = useState(false);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatOtherParty, setChatOtherParty] = useState('');
  const matrixRainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) {
      loadWallet();
    }
    setupMatrixRain();
    setupTypingSound();
  }, [profile, mode]);

  const loadWallet = async () => {
    const { data } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', profile?.id)
      .maybeSingle();

    setWallet(data);
  };

  const setupMatrixRain = () => {
    const matrixRain = matrixRainRef.current;
    if (!matrixRain) return;

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$';
    const createRainChar = () => {
      const char = document.createElement('span');
      char.className = 'rain-char';
      // 30% chance to show '$' for "tiny money" effect
      char.textContent = Math.random() < 0.3 ? '$' : characters[Math.floor(Math.random() * (characters.length - 1))];
      char.style.left = `${Math.random() * 100}vw`;
      char.style.animationDuration = `${Math.random() * 5 + 5}s`; // 5-10s fall duration
      matrixRain.appendChild(char);

      setTimeout(() => char.remove(), 10000); // Remove after 10s
    };

    // Create 50-100 rain characters
    const charCount = Math.floor(Math.random() * 50 + 50);
    for (let i = 0; i < charCount; i++) {
      setTimeout(createRainChar, Math.random() * 2000);
    }

    // Continuously add new characters
    const interval = setInterval(createRainChar, 100);
    return () => clearInterval(interval);
  };

  const setupTypingSound = () => {
    const elements = document.querySelectorAll('.header-left h1, .wallet-header span, .wallet-balances .balance-value, .mode-button span');
    elements.forEach((el) => {
      const animationDuration = parseFloat(getComputedStyle(el).animationDuration) * 1000;
      const steps = parseInt(getComputedStyle(el).animationTimingFunction.match(/steps\((\d+)/)?.[1] || '20');
      const interval = animationDuration / steps;

      const playSound = () => {
        typingSound.currentTime = 0;
        typingSound.play().catch(() => {});
      };

      for (let i = 0; i < steps; i++) {
        setTimeout(playSound, i * interval);
      }
    });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const openChat = (conversationId: string, otherPartyName: string) => {
    setActiveChatId(conversationId);
    setChatOtherParty(otherPartyName);
  };

  if (showProfile) {
    return <EnhancedProfilePage onBack={() => setShowProfile(false)} />;
  }

  return (
    <div className="enhanced-user-dashboard">
      <div className="cyber-bg">
        <div className="matrix-rain" ref={matrixRainRef}></div>
      </div>

      <header className="dashboard-header">
        <div className="header-container">
          <div className="header-left">
            <h1>HMOS Platform</h1>
          </div>

          <div className="header-right">
            <NotificationBell className="notification-bell" onOpenChat={openChat} />
            <button className="header-button" onClick={() => setShowProfile(true)}>
              <User size={20} />
              <span>Profile</span>
            </button>
            <div className="wallet-display">
              <div className="wallet-header">
                <Wallet size={16} />
                <span>Wallet</span>
              </div>
              <div className="wallet-balances">
                <div className="balance-item">
                  <div className="balance-label">Available</div>
                  <div className="balance-value available">
                    ${wallet?.available_balance.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div className="balance-item">
                  <div className="balance-label">Pending</div>
                  <div className="balance-value pending">
                    ${wallet?.pending_balance.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div className="balance-item">
                  <div className="balance-label">Frozen</div>
                  <div className="balance-value frozen">
                    ${wallet?.freezed_balance.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>
            </div>
            <button className="header-button" onClick={handleSignOut}>
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <div className="mode-switcher">
          <button
            onClick={() => setMode('buyer')}
            className={`mode-button ${mode === 'buyer' ? 'active' : ''}`}
          >
            <ShoppingCart size={20} />
            <span>Buyer Mode</span>
          </button>
          <button
            onClick={() => setMode('seller')}
            className={`mode-button ${mode === 'seller' ? 'active' : ''}`}
          >
            <Store size={20} />
            <span>Seller Mode</span>
          </button>
        </div>
      </header>

      <div className="welcome-container">
        <p>Welcome, {profile?.full_name}</p>
      </div>

      <main className="dashboard-main">
        {mode === 'buyer' ? <BuyerDashboard /> : <SellerDashboard />}
      </main>

      {activeChatId && (
        <ChatWindow
          className="chat-window"
          conversationId={activeChatId}
          otherPartyName={chatOtherParty}
          onClose={() => setActiveChatId(null)}
        />
      )}
    </div>
  );
};