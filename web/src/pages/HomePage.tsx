import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getUserstatus, getUserHistory } from '../services/api';
import { Gamestatus, GameHistory } from '../types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [joinCode, setJoinCode] = useState('');
  const [status, setstatus] = useState<Gamestatus | null>(null);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserstatus(user.id).then(setstatus).catch(() => {}),
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" fill="#FB7185" />
              <path d="m14 6 4 4" />
            </svg>
          </div>
          <div>
            <span className="font-display" style={{ fontSize: 22, fontWeight: 700, color: '#1C1917', display: 'block', lineHeight: 1.1 }}>
              Guess 11
            </span>
            <span className="font-hand" style={{ fontSize: 16, fontWeight: 700, color: '#57534E' }}>
              sketchbook studio
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/profile')} className="sketch-btn" style={navBtnStyle('#FFFDF9')}>
            {user?.username || 'Artist'}
          </button>
          <button onClick={() => navigate('/settings')} className="sketch-btn" style={iconBtnStyle} title="Settings" aria-label="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </button>
          <button onClick={() => logout().then(() => navigate('/login'))} className="sketch-btn" style={navBtnStyle('#FFE4E6')}>
            Sign Out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '32px 18px', display: 'flex', flexDirection: 'column', gap: 26 }}>
        {/* Main Play Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {/* Create Room Card */}
          <button onClick={() => navigate('/create-room')} className="sketch-card" style={createCardStyle}>
            <div style={actionIconBox('#FFFDF9')}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div>
              <span className="font-display" style={{ fontSize: 22, fontWeight: 700, color: '#1C1917', display: 'block' }}>
                Host a Room
              </span>
              <span style={{ fontSize: 14, color: '#44403C', marginTop: 4, display: 'block' }}>
                Pick rounds, invite friends &amp; start drawing
              </span>
            </div>
            <span className="font-hand" style={{ fontSize: 19, fontWeight: 700, color: '#1C1917', marginTop: 'auto' }}>
              New canvas →
            </span>
          </button>

          {/* Join Room Card */}
          <div className="sketch-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={actionIconBox('#38BDF8')}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </div>
              <span className="font-display" style={{ fontSize: 21, fontWeight: 700, color: '#1C1917' }}>
                Join with Code
              </span>
            </div>

            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABC123"
              maxLength={6}
              className="font-display"
              style={codeInputStyle}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />

            <button
              onClick={handleJoin}
              disabled={joinCode.length !== 6}
              className="sketch-btn"
              style={{
                background: joinCode.length === 6 ? '#34D399' : '#E7E5E4',
                color: joinCode.length === 6 ? '#1C1917' : '#78716C',
                padding: '12px',
                fontSize: 16,
                cursor: joinCode.length === 6 ? 'pointer' : 'not-allowed',
              }}
            >
              Hop Into Room
            </button>
          </div>
        </div>

<<<<<<< HEAD
        {/* status */}
        {status && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>📊 Your Status</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[['Games', status.gamesPlayed], ['Wins', status.gamesWon], ['Avg Score', status.avgScore], ['Best', status.bestScore]].map(([label, val]) => (
                <div key={label as string} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#6366f1' }}>{val}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
=======
        {/* Player Stats */}
        {stats && (
          <div className="sketch-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" fill="#FDE047" />
              </svg>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: '#1C1917' }}>Sketchbook Record</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14 }}>
              {[
                { label: 'Played', val: stats.gamesPlayed, bg: '#FEF9C3' },
                { label: 'Wins', val: stats.gamesWon, bg: '#DCFCE7' },
                { label: 'Avg Pts', val: stats.avgScore, bg: '#E0F2FE' },
                { label: 'High Score', val: stats.bestScore, bg: '#FFE4E6' },
              ].map(({ label, val, bg }) => (
                <div key={label} style={{ textAlign: 'center', background: bg, border: '2px solid #1C1917', borderRadius: 14, padding: '14px 10px' }}>
                  <div className="font-display" style={{ fontSize: 26, fontWeight: 700, color: '#1C1917' }}>{val}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#44403C', marginTop: 2 }}>{label}</div>
>>>>>>> d066e9d (Update UI, auth handling, and API config)
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Matches */}
        {history.length > 0 && (
          <div className="sketch-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <h3 style={{ fontSize: 19, fontWeight: 700, color: '#1C1917' }}>Past Rounds</h3>
              </div>
              <button onClick={() => navigate('/history')} style={{ background: 'none', border: 'none', color: '#E11D48', fontSize: 14, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                See all →
              </button>
            </div>

            {history.slice(0, 3).map((g, idx) => (
              <div key={g.gameId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 4px', borderBottom: idx < Math.min(history.length, 3) - 1 ? '1.5px dashed #D6D3D1' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#1C1917', fontSize: 15 }}>Room #{g.roomCode}</div>
                  <div style={{ color: '#57534E', fontSize: 12 }}>{new Date(g.playedAt).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-block', background: g.rank === 1 ? '#FDE047' : '#F5F5F4', border: '1.5px solid #1C1917', borderRadius: 8, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                    #{g.rank} of {g.totalPlayers}
                  </span>
                  <div style={{ color: '#57534E', fontSize: 12, fontWeight: 600, marginTop: 3 }}>{g.myScore} pts</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const headerStyle: React.CSSProperties = {
  background: '#FFFDF9',
  borderBottom: '2.5px solid #1C1917',
  padding: '14px 28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const brandBadgeStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 12,
  background: '#FDE047',
  border: '2px solid #1C1917',
  boxShadow: '2px 2px 0px #1C1917',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transform: 'rotate(-4deg)',
};

const navBtnStyle = (bg: string): React.CSSProperties => ({
  background: bg,
  color: '#1C1917',
  padding: '8px 14px',
  fontSize: 14,
});

const iconBtnStyle: React.CSSProperties = {
  background: '#FFFDF9',
  padding: '8px 10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const createCardStyle: React.CSSProperties = {
  background: '#FDE047',
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'transform 0.12s ease',
};

const actionIconBox = (bg: string): React.CSSProperties => ({
  width: 44,
  height: 44,
  borderRadius: 12,
  background: bg,
  border: '2px solid #1C1917',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const codeInputStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '2px solid #1C1917',
  background: '#FFFDF9',
  fontSize: 20,
  letterSpacing: 5,
  fontWeight: 700,
  textAlign: 'center',
  color: '#1C1917',
  outline: 'none',
};