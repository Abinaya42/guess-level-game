import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getUserHistory } from '../services/api';
import { GameHistory } from '../types';

export const GameHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getUserHistory(user.id, page)
      .then(d => { setHistory(prev => page === 1 ? d.history : [...prev, ...d.history]); setHasMore(d.hasMore); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, page]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate('/home')} style={{ color: '#fff', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>← Back</button>
        <h1 style={{ color: '#fff', margin: 0, fontWeight: 700 }}>Game History</h1>
      </div>

      <div style={{ maxWidth: 650, margin: '32px auto', padding: '0 16px' }}>
        {loading && page === 1 ? (
          <div style={{ textAlign: 'center', color: '#64748b', marginTop: 48 }}>Loading...</div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', marginTop: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎮</div>
            <p>No games played yet. Create or join a room to start!</p>
            <button onClick={() => navigate('/home')} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 600, cursor: 'pointer', marginTop: 12 }}>Play Now</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.map(g => (
              <div key={g.gameId} style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>Room: {g.roomCode}</div>
                    <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{new Date(g.playedAt).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: g.rank === 1 ? '#f59e0b' : '#6366f1' }}>#{g.rank}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>of {g.totalPlayers}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ background: '#ede9fe', borderRadius: 8, padding: '8px 14px' }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#6366f1' }}>{g.myScore}</span>
                    <span style={{ fontSize: 11, color: '#8b5cf6', marginLeft: 4 }}>pts</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Top scores:</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {g.topScores.map((s, i) => (
                        <span key={i} style={{ fontSize: 12, background: '#f1f5f9', borderRadius: 6, padding: '3px 8px', color: '#374151' }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {s.username} ({s.points})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {hasMore && (
              <button onClick={() => setPage(p => p + 1)} disabled={loading} style={{ background: '#e2e8f0', color: '#374151', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
                {loading ? 'Loading...' : 'Load More'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
