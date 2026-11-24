import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const JoinRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleJoin = () => {
    const c = code.trim().toUpperCase();
    if (c.length !== 6) { setError('Room code must be exactly 6 characters.'); return; }
    setError('');
    navigate(`/lobby/${c}`);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 48, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔗</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>Join a Room</h1>
        <p style={{ color: '#64748b', marginBottom: 32 }}>Enter the 6-character room code to join your friends.</p>

        <input
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)); setError(''); }}
          placeholder="XXXXXX"
          maxLength={6}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          style={{ width: '100%', padding: '16px', borderRadius: 12, border: `2px solid ${error ? '#ef4444' : '#e2e8f0'}`, fontSize: 28, fontWeight: 800, letterSpacing: 8, textAlign: 'center', outline: 'none', boxSizing: 'border-box', marginBottom: 8, color: '#1e293b' }}
        />
        {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button onClick={handleJoin} disabled={code.length !== 6} style={{ background: code.length === 6 ? '#10b981' : '#d1fae5', color: code.length === 6 ? '#fff' : '#6ee7b7', border: 'none', borderRadius: 12, padding: '14px', fontSize: 17, fontWeight: 700, cursor: code.length === 6 ? 'pointer' : 'not-allowed', width: '100%', marginBottom: 12 }}>
          Join Game →
        </button>
        <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>← Back</button>
      </div>
    </div>
  );
};
