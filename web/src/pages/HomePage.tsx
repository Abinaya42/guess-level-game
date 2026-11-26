import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getUserStats, getUserHistory } from '../services/api';
import { GameStats, GameHistory } from '../types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [joinCode, setJoinCode] = useState('');
  const [stats, setStats] = useState<GameStats | null>(null);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 32 }}>🎨</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: 1 }}>Guess 11</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/profile')} style={ghostBtn}>{user?.username || 'Profile'}</button>
          <button onClick={() => navigate('/settings')} style={ghostBtn}>⚙️</button>
          <button onClick={() => logout().then(() => navigate('/login'))} style={{ ...ghostBtn, color: '#fca5a5' }}>Logout</button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <button onClick={() => navigate('/create-room')} style={actionCard('#6366f1')}>
            <span style={{ fontSize: 40 }}>🚀</span>
            <span style={{ fontSize: 18, fontWeight: 700 }}>Create Room</span>
            <span style={{ fontSize: 13, opacity: 0.8 }}>Start a private game</span>
          </button>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>🔗 Join Room</span>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="Enter 6-char code"
              maxLength={6}
              style={{ padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 16, letterSpacing: 3, fontWeight: 700, textAlign: 'center', outline: 'none' }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            <button onClick={handleJoin} disabled={joinCode.length !== 6} style={{ background: joinCode.length === 6 ? '#10b981' : '#d1fae5', color: joinCode.length === 6 ? '#fff' : '#6ee7b7', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 15, cursor: joinCode.length === 6 ? 'pointer' : 'not-allowed' }}>
              Join Game
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>📊 Your Status</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[['Games', stats.gamesPlayed], ['Wins', stats.gamesWon], ['Avg Score', stats.avgScore], ['Best', stats.bestScore]].map(([label, val]) => (
                <div key={label as string} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#6366f1' }}>{val}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent games */}
        {history.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>🕹️ Recent Games</h3>
              <button onClick={() => navigate('/history')} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>View All →</button>
            </div>
            {history.slice(0, 3).map(g => (
              <div key={g.gameId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>Room {g.roomCode}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>{new Date(g.playedAt).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#6366f1' }}>#{g.rank} of {g.totalPlayers}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>{g.myScore} pts</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const ghostBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const actionCard = (bg: string): React.CSSProperties => ({ background: bg, color: '#fff', border: 'none', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', textAlign: 'left', boxShadow: `0 4px 20px ${bg}66` });
