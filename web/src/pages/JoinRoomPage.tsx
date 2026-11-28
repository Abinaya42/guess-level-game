import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const JoinRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleJoin = () => {
    const c = code.trim().toUpperCase();
    if (c.length !== 6) {
      setError('Enter a 6-character room code.');
      return;
    }
    setError('');
    navigate(`/lobby/${c}`);
  };

  const isReady = code.length === 6;

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={badgeStyle}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M13 5v2" />
            <path d="M13 17v2" />
            <path d="M13 11v2" />
          </svg>
        </div>

        <h1 style={titleStyle}>Join Room</h1>
        <p style={subtitleStyle}>
          Enter the 6-character room code to join a game.
        </p>

        <div style={codeBoxStyle}>
          <label style={labelStyle}>Room Code</label>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
              setError('');
            }}
            placeholder="ABC123"
            maxLength={6}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            style={codeInputStyle(!!error)}
          />
          {error && <div style={errStyle}>{error}</div>}
        </div>

        <button
          onClick={handleJoin}
          disabled={!isReady}
          style={{
            ...joinBtnStyle,
            background: isReady ? '#22C55E' : '#143827',
            color: isReady ? '#05160E' : '#86EFAC',
            cursor: isReady ? 'pointer' : 'not-allowed',
          }}
        >
          Join Room
        </button>

        <button onClick={() => navigate('/home')} style={backBtnStyle}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

const pageStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: 20,
  background: '#05160E',
};

const cardStyle: React.CSSProperties = {
  padding: '32px 28px',
  maxWidth: 420,
  width: '100%',
  textAlign: 'center',
  background: '#0B2418',
  border: '2px solid #1F6B46',
  borderRadius: 16,
};

const badgeStyle: React.CSSProperties = {
  width: 52,
  height: 52,
  margin: '0 auto 12px',
  borderRadius: 12,
  background: '#103322',
  border: '1.5px solid #22C55E',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const titleStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 700,
  color: '#ECFDF5',
  margin: '0 0 6px',
};

const subtitleStyle: React.CSSProperties = {
  color: '#86EFAC',
  fontSize: 14,
  margin: '0 0 22px',
  lineHeight: 1.5,
};

const codeBoxStyle: React.CSSProperties = {
  background: '#081D13',
  border: '1.5px dashed #1F6B46',
  borderRadius: 12,
  padding: '16px',
  marginBottom: 20,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 700,
  color: '#86EFAC',
  marginBottom: 8,
};

const codeInputStyle = (err: boolean) => ({
  width: '100%',
  padding: '12px',
  borderRadius: 10,
  border: `1.5px solid ${err ? '#4ADE80' : '#1F6B46'}`,
  background: '#0B2418',
  fontSize: 26,
  fontWeight: 700,
  letterSpacing: 7,
  textAlign: 'center' as const,
  outline: 'none',
  boxSizing: 'border-box' as const,
  color: '#ECFDF5',
});

const errStyle: React.CSSProperties = {
  color: '#4ADE80',
  fontSize: 12,
  fontWeight: 700,
  marginTop: 8,
};

const joinBtnStyle: React.CSSProperties = {
  padding: '13px 20px',
  fontSize: 16,
  fontWeight: 700,
  width: '100%',
  borderRadius: 10,
  border: 'none',
  marginBottom: 12,
};

const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#86EFAC',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'underline',
};