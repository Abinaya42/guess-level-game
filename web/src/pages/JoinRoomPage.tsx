import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const JoinRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleJoin = () => {
    const c = code.trim().toUpperCase();
    if (c.length !== 6) {
      setError('Room pass needs all 6 characters.');
      return;
    }
    setError('');
    navigate(`/lobby/${c}`);
  };

  const isReady = code.length === 6;

  return (
    <div style={pageStyle}>
      <div className="sketch-card" style={cardStyle}>
        {/* Tilted Sticky Note Tag */}
        <div style={stickyTagStyle} className="font-hand">
          Guest Pass
        </div>

        {/* Custom Hand-Drawn Ticket Stub Emblem */}
        <div style={badgeStyle}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" fill="#0B2418" />
            <path d="M13 5v2" />
            <path d="M13 17v2" />
            <path d="M13 11v2" />
          </svg>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1C1917', margin: '14px 0 6px' }}>
          Join a Sketch Table
        </h1>
        <p style={{ color: '#57534E', fontSize: 14, marginBottom: 26, lineHeight: 1.5 }}>
          Punch in the 6-character room code from your host to pull up a chair.
        </p>

        {/* Ticket Code Input */}
        <div style={ticketSlotStyle}>
          <label className="font-hand" style={{ display: 'block', fontSize: 17, fontWeight: 700, color: '#44403C', marginBottom: 8 }}>
            6-Character Pass Code
          </label>
          <input
            value={code}
            onChange={e => {
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
              setError('');
            }}
            placeholder="XXXXXX"
            maxLength={6}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            className="font-display"
            style={codeInputStyle(!!error)}
          />
          {error && <div style={errStyle}>{error}</div>}
        </div>

        <button
          onClick={handleJoin}
          disabled={!isReady}
          className="sketch-btn"
          style={{
            background: isReady ? '#34D399' : '#E7E5E4',
            color: isReady ? '#1C1917' : '#78716C',
            padding: '15px',
            fontSize: 17,
            width: '100%',
            marginBottom: 14,
            cursor: isReady ? 'pointer' : 'not-allowed',
          }}
        >
          Enter Sketch Room →
        </button>

        <button
          onClick={() => navigate('/home')}
          style={{
            background: 'none',
            border: 'none',
            color: '#57534E',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          ← Back to Studio
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
};

const cardStyle: React.CSSProperties = {
  padding: '38px 32px',
  maxWidth: 420,
  width: '100%',
  textAlign: 'center',
  position: 'relative',
};

const stickyTagStyle: React.CSSProperties = {
  position: 'absolute',
  top: -14,
  right: 22,
  background: '#22C55E',
  border: '2px solid #1C1917',
  borderRadius: 8,
  padding: '2px 12px',
  fontSize: 18,
  fontWeight: 700,
  color: '#1C1917',
  transform: 'rotate(3deg)',
  boxShadow: '2px 2px 0px #1C1917',
};

const badgeStyle: React.CSSProperties = {
  width: 60,
  height: 60,
  margin: '0 auto',
  borderRadius: 16,
  background: '#10B981',
  border: '2.5px solid #1C1917',
  boxShadow: '3px 3px 0px #1C1917',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transform: 'rotate(-4deg)',
};

const ticketSlotStyle: React.CSSProperties = {
  background: '#14452E',
  border: '2px dashed #1C1917',
  borderRadius: 14,
  padding: '16px 16px 18px',
  marginBottom: 22,
};

const codeInputStyle = (err: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '14px 12px',
  borderRadius: 11,
  border: `2.5px solid ${err ? '#E11D48' : '#1C1917'}`,
  background: '#0B2418',
  fontSize: 28,
  fontWeight: 700,
  letterSpacing: 8,
  textAlign: 'center',
  outline: 'none',
  boxSizing: 'border-box',
  color: '#1C1917',
});

const errStyle: React.CSSProperties = {
  color: '#E11D48',
  fontSize: 12,
  fontWeight: 700,
  marginTop: 8,
};