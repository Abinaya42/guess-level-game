import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';

export const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { resendVerification, logout } = useAuthStore();
  const [checking, setChecking] = useState(false);

  const checkVerification = async () => {
    setChecking(true);
    await auth.currentUser?.reload();
    if (auth.currentUser?.emailVerified) {
      toast.success('Pass stamped! Welcome to the studio!');
      navigate('/home');
    } else {
      toast.error('Not verified yet — check your inbox or spam folder.');
    }
    setChecking(false);
  };

  return (
    <div style={pageStyle}>
      <div className="sketch-card" style={cardStyle}>
        {/* Tilted Sticky Note Tag */}
        <div style={stickyTagStyle} className="font-hand">
          Stamp Pass
        </div>

        {/* Custom Hand-Drawn Envelope Emblem */}
        <div style={badgeStyle}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ECFDF5" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="3" fill="#0B2418" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#ECFDF5', margin: '16px 0 8px' }}>
          Verify Your Sketch Pass
        </h2>
        <p style={{ color: '#86EFAC', fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>
          We dispatched a verification note to:
        </p>

        <div style={emailBoxStyle}>
          {auth.currentUser?.email || 'your email address'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={checkVerification}
            disabled={checking}
            className="sketch-btn"
            style={{
              background: checking ? '#1F6B46' : '#34D399',
              color: '#ECFDF5',
              padding: '14px',
              fontSize: 16,
              width: '100%',
              cursor: checking ? 'not-allowed' : 'pointer',
            }}
          >
            {checking ? 'Checking Stamp...' : "I've Verified My Email →"}
          </button>

          <button
            onClick={() => resendVerification().then(() => toast.success('Fresh verification note sent!'))}
            className="sketch-btn"
            style={{
              background: '#22C55E',
              color: '#ECFDF5',
              padding: '12px',
              fontSize: 15,
              width: '100%',
            }}
          >
            Resend Verification Note
          </button>

          <button
            onClick={() => logout().then(() => navigate('/login'))}
            style={{
              background: 'none',
              border: 'none',
              color: '#86EFAC',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 700,
              marginTop: 6,
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            ← Sign Out
          </button>
        </div>
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
  background: '#10B981',
  border: '2px solid #1F6B46',
  borderRadius: 8,
  padding: '2px 12px',
  fontSize: 18,
  fontWeight: 700,
  color: '#ECFDF5',
  transform: 'rotate(3deg)',
  boxShadow: '2px 2px 0px #020A06',
};

const badgeStyle: React.CSSProperties = {
  width: 60,
  height: 60,
  margin: '0 auto',
  borderRadius: 16,
  background: '#14452E',
  border: '2.5px solid #1F6B46',
  boxShadow: '3px 3px 0px #020A06',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transform: 'rotate(-4deg)',
};

const emailBoxStyle: React.CSSProperties = {
  background: '#14452E',
  border: '2px dashed #1F6B46',
  borderRadius: 11,
  padding: '10px 14px',
  fontSize: 14,
  fontWeight: 700,
  color: '#ECFDF5',
  marginBottom: 24,
  wordBreak: 'break-all',
};