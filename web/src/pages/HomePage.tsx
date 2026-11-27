import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getUserStats, getUserHistory } from '../services/api';
import { GameHistory } from '../types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [joinCode, setJoinCode] = useState('');
  const [stats, setStats] = useState<{ gamesPlayed: number; gamesWon: number; avgScore: number; bestScore: number } | null>(null);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserStats(user.id).then(setStats).catch(() => {}),
      getUserHistory(user.id).then(d => setHistory(d.history)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user]);

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) return;
    navigate(`/lobby/${code}`);
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 48 }}>
      {/* Sketchbook Top Navbar */}
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={brandBadgeStyle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14532D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" fill="#4ADE80" />
              <path d="m14 6 4 4" />
            </svg>
          </div>
          <div>
            <span className="font-display" style={{ fontSize: 22, fontWeight: 700, color: '#14532D', display: 'block', lineHeight: 1.1 }}>
              Find 11
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/profile')} className="sketch-btn" style={navBtnStyle('#F0FDF4')}>
            {user?.username || 'Artist'}
          </button>
          <button onClick={() => navigate('/settings')} className="sketch-btn" style={iconBtnStyle} title="Settings" aria-label="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14532D" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </button>
          <button onClick={() => logout().then(() => navigate('/login'))} className="sketch-btn" style={navBtnStyle('#DCFCE7')}>
            Sign Out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '32px 18px', display: 'flex', flexDirection: 'column', gap: 26 }}>
        {/* Main Play Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
