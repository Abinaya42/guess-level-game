import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getUserStats } from '../services/api';
import { GameStats } from '../types';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserStats(user.id)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const initials = user?.username?.slice(0, 2).toUpperCase() || '??';

  const statItems = stats
    ? [
        { label: 'Games Played', val: stats.gamesPlayed, bg: '#14452E' },
        { label: 'Games Won', val: stats.gamesWon, bg: '#DCFCE7' },
        { label: 'Avg Score', val: stats.avgScore, bg: '#E0F2FE' },
        { label: 'Best Score', val: stats.bestScore, bg: '#FFE4E6' },
        { label: 'Total Points', val: stats.totalPoints, bg: '#F3E8FF' },
        {
          label: 'Win Rate',
          val: stats.gamesPlayed > 0 ? `${Math.round((stats.gamesWon / stats.gamesPlayed) * 100)}%` : '0%',
          bg: '#FFEDD5',
        },
      ]
    : [];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 48 }}>
      {/* Sketchbook Top Navbar */}
      <header style={headerStyle}>
        <button onClick={() => navigate('/home')} className="sketch-btn" style={backBtnStyle}>
          ← Studio
        </button>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: '#1C1917', margin: 0 }}>
          Artist Profile
        </h1>
        <div style={{ width: 84 }} />
      </header>

      <main style={{ maxWidth: 620, margin: '32px auto', padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Artist ID Card */}
        <div className="sketch-card" style={{ padding: '34px 28px', textAlign: 'center', position: 'relative' }}>
          <div style={stickyTagStyle} className="font-hand">
            Studio Member
          </div>

          <div className="font-display" style={avatarBadgeStyle}>
            {initials}
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1C1917', margin: '0 0 4px' }}>
            {user?.username || 'Sketch Artist'}
          </h2>
          <p style={{ color: '#57534E', fontSize: 14, margin: 0 }}>
            {user?.email}
          </p>
        </div>

        {/* Career Stats */}
        {!loading && stats && (
          <div className="sketch-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V10" />
                <path d="M18 20V4" />
                <path d="M6 20v-4" />
              </svg>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: '#1C1917', margin: 0 }}>
                Sketchbook Stats
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
              {statItems.map(({ label, val, bg }) => (
                <div
                  key={label}
                  style={{
                    background: bg,
                    border: '2px solid #1C1917',
                    borderRadius: 14,
                    padding: '16px 14px',
                  }}
                >
                  <div className="font-display" style={{ fontSize: 24, fontWeight: 700, color: '#1C1917' }}>
                    {val}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#44403C', marginTop: 3 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const headerStyle: React.CSSProperties = {
  background: '#0B2418',
  borderBottom: '2.5px solid #1C1917',
  padding: '14px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const backBtnStyle: React.CSSProperties = {
  background: '#22C55E',
  color: '#1C1917',
  padding: '8px 14px',
  fontSize: 14,
};

const stickyTagStyle: React.CSSProperties = {
  position: 'absolute',
  top: -14,
  right: 22,
  background: '#10B981',
  border: '2px solid #1C1917',
  borderRadius: 8,
  padding: '2px 12px',
  fontSize: 18,
  fontWeight: 700,
  color: '#1C1917',
  transform: 'rotate(3deg)',
  boxShadow: '2px 2px 0px #1C1917',
};

const avatarBadgeStyle: React.CSSProperties = {
  width: 82,
  height: 82,
  borderRadius: 20,
  background: '#22C55E',
  border: '2.5px solid #1C1917',
  boxShadow: '3px 3px 0px #1C1917',
  color: '#1C1917',
  fontSize: 30,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 16px',
  transform: 'rotate(-4deg)',
};