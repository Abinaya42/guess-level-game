import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
<<<<<<< HEAD
import { getUserstatus, getUserHistory } from '../services/api';
import { Gamestatus, GameHistory } from '../types';
=======
import { getUserStats } from '../services/api';
import { GameStats } from '../types';
>>>>>>> d066e9d (Update UI, auth handling, and API config)

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
<<<<<<< HEAD
  const [status, setstatus] = useState<Gamestatus | null>(null);
  const [history, setHistory] = useState<GameHistory[]>([]);
=======
  const [stats, setStats] = useState<GameStats | null>(null);
>>>>>>> d066e9d (Update UI, auth handling, and API config)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
<<<<<<< HEAD
    Promise.all([
      getUserstatus(user.id).then(setstatus).catch(() => {}),
      getUserHistory(user.id).then(d => setHistory(d.history)).catch(() => {}),
    ]).finally(() => setLoading(false));
=======
    getUserStats(user.id)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
>>>>>>> d066e9d (Update UI, auth handling, and API config)
  }, [user]);

  const initials = user?.username?.slice(0, 2).toUpperCase() || '??';

  const statItems = stats
    ? [
        { label: 'Games Played', val: stats.gamesPlayed, bg: '#FEF9C3' },
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

<<<<<<< HEAD
        {/* status */}
        {status && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 16 }}>Statistics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['🎮 Games Played', status.gamesPlayed],
                ['🏆 Games Won', status.gamesWon],
                ['📈 Avg Score', status.avgScore],
                ['⭐ Best Score', status.bestScore],
                ['💎 Total Points', status.totalPoints],
                ['🎯 Win Rate', status.gamesPlayed > 0 ? `${Math.round(status.gamesWon / status.gamesPlayed * 100)}%` : '0%'],
              ].map(([label, val]) => (
                <div key={label as string} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#6366f1' }}>{val}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
=======
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
>>>>>>> d066e9d (Update UI, auth handling, and API config)
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
  background: '#FFFDF9',
  borderBottom: '2.5px solid #1C1917',
  padding: '14px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const backBtnStyle: React.CSSProperties = {
  background: '#FDE047',
  color: '#1C1917',
  padding: '8px 14px',
  fontSize: 14,
};

const stickyTagStyle: React.CSSProperties = {
  position: 'absolute',
  top: -14,
  right: 22,
  background: '#38BDF8',
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
  background: '#FDE047',
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