import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getUserstatus, getUserHistory } from '../services/api';
import { Gamestatus, GameHistory } from '../types';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [status, setstatus] = useState<Gamestatus | null>(null);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserstatus(user.id).then(setstatus).catch(() => {}),
      getUserHistory(user.id).then(d => setHistory(d.history)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user]);

  const initials = user?.username?.slice(0, 2).toUpperCase() || '??';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate('/home')} style={{ color: '#fff', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>← Back</button>
        <h1 style={{ color: '#fff', margin: 0, fontWeight: 700 }}>Profile</h1>
      </div>

      <div style={{ maxWidth: 600, margin: '32px auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Avatar + name */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>{initials}</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>{user?.username}</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>{user?.email}</p>
        </div>

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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
