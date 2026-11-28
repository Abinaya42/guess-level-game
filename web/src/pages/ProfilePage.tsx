import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getUserStats } from '../services/api';
import { GameStats } from '../types';

const STAT_BOX_BG = ['#081D13', '#0D291C', '#103322', '#14452E', '#0D291C', '#081D13'];

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
        { label: 'Games Played', val: stats.gamesPlayed },
        { label: 'Games Won', val: stats.gamesWon },
        { label: 'Avg Score', val: stats.avgScore },
        { label: 'Best Score', val: stats.bestScore },
        { label: 'Total Points', val: stats.totalPoints },
        {
          label: 'Win Rate',
          val: stats.gamesPlayed > 0 ? `${Math.round((stats.gamesWon / stats.gamesPlayed) * 100)}%` : '0%',
        },
      ]
    : [];

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <button onClick={() => navigate('/home')} style={backBtnStyle}>
          Home
        </button>
        <h1 style={headerTitleStyle}>Profile</h1>
        <div style={{ width: 64 }} />
      </header>

      <main style={mainStyle}>
        <div style={profileCardStyle}>
          <div style={avatarBadgeStyle}>{initials}</div>

          <h2 style={usernameStyle}>{user?.username || 'Player'}</h2>
          <p style={emailStyle}>{user?.email}</p>
        </div>

        {!loading && stats && (
          <div style={statsCardStyle}>
            <div style={statsHeaderStyle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V10" />
                <path d="M18 20V4" />
                <path d="M6 20v-4" />
              </svg>
              <h3 style={statsTitleStyle}>Statistics</h3>
            </div>

            <div style={statsGridStyle}>
              {statItems.map(({ label, val }, idx) => (
                <div
                  key={label}
                  style={{
                    background: STAT_BOX_BG[idx % STAT_BOX_BG.length],
                    border: '1.5px solid #1F6B46',
                    borderRadius: 12,
                    padding: '15px 14px',
                  }}
                >
                  <div style={statValStyle}>{val}</div>
                  <div style={statLabelStyle}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  paddingBottom: 48,
  background: '#05160E',
};

const headerStyle: React.CSSProperties = {
  background: '#0B2418',
  borderBottom: '2px solid #1F6B46',
  padding: '14px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const backBtnStyle: React.CSSProperties = {
  background: '#22C55E',
  color: '#05160E',
  padding: '8px 14px',
  fontSize: 14,
  fontWeight: 700,
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
};

const headerTitleStyle: React.CSSProperties = {
  fontSize: 21,
  fontWeight: 700,
  color: '#ECFDF5',
  margin: 0,
};

const mainStyle: React.CSSProperties = {
  maxWidth: 620,
  margin: '32px auto',
  padding: '0 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 22,
};

const profileCardStyle: React.CSSProperties = {
  padding: '32px 24px',
  textAlign: 'center',
  background: '#0B2418',
  border: '2px solid #1F6B46',
  borderRadius: 16,
};

const avatarBadgeStyle: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: 16,
  background: '#103322',
  border: '2px solid #22C55E',
  color: '#4ADE80',
  fontSize: 26,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 14px',
};

const usernameStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: '#ECFDF5',
  margin: '0 0 4px',
};

const emailStyle: React.CSSProperties = {
  color: '#86EFAC',
  fontSize: 14,
  margin: 0,
};

const statsCardStyle: React.CSSProperties = {
  padding: 24,
  background: '#0B2418',
  border: '2px solid #1F6B46',
  borderRadius: 16,
};

const statsHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 16,
};

const statsTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#ECFDF5',
  margin: 0,
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 12,
};

const statValStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: '#ECFDF5',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#86EFAC',
  marginTop: 3,
};