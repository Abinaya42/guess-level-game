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
      toast.success('Email verified.');
      navigate('/home');
    } else {
      toast.error('Not verified yet. Check your inbox or spam folder.');
    }
    setChecking(false);
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={badgeStyle}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>

        <h2 style={titleStyle}>Verify Your Email</h2>
        <p style={subtitleStyle}>
          We sent a verification link to:
        </p>

        <div style={emailBoxStyle}>
          {auth.currentUser?.email || 'your email address'}
        </div>

        <div style={actionsStyle}>
          <button
            onClick={checkVerification}
            disabled={checking}
            style={{
              ...primaryBtnStyle,
              background: checking ? '#143827' : '#22C55E',
              color: checking ? '#86EFAC' : '#05160E',
              cursor: checking ? 'not-allowed' : 'pointer',
            }}
          >
            {checking ? 'Checking...' : 'I Have Verified My Email'}
          </button>

          <button
            onClick={() => resendVerification().then(() => toast.success('Verification email sent.'))}
            style={secondaryBtnStyle}
          >
            Resend Verification Email
          </button>

          <button
            onClick={() => logout().then(() => navigate('/login'))}
            style={signOutBtnStyle}
          >
            Sign Out
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
  margin: '0 auto 14px',
  borderRadius: 12,
  background: '#103322',
  border: '1.5px solid #22C55E',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const titleStyle: React.CSSProperties = {
  fontSize: 25,
  fontWeight: 700,
  color: '#ECFDF5',
  margin: '0 0 8px',
};

const subtitleStyle: React.CSSProperties = {
  color: '#86EFAC',
  fontSize: 14,
  lineHeight: 1.5,
  margin: '0 0 14px',
};

const emailBoxStyle: React.CSSProperties = {
  background: '#081D13',
  border: '1.5px dashed #1F6B46',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 14,
  fontWeight: 700,
  color: '#ECFDF5',
  marginBottom: 22,
  wordBreak: 'break-all',
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '13px 16px',
  fontSize: 15,
  fontWeight: 700,
  width: '100%',
  borderRadius: 10,
  border: 'none',
};

const secondaryBtnStyle: React.CSSProperties = {
  background: '#13422B',
  color: '#ECFDF5',
  padding: '12px 16px',
  fontSize: 14,
  fontWeight: 700,
  width: '100%',
  borderRadius: 10,
  border: '1.5px solid #22C55E',
  cursor: 'pointer',
};

const signOutBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#86EFAC',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  marginTop: 6,
  textDecoration: 'underline',
};