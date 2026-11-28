import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const PILL_BG = ['#081D13', '#103322', '#14452E'];

export const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(isAuthenticated ? '/home' : '/onboarding');
    }, 2000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={logoBadgeStyle}>
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4ADE80"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
        </div>

        <h1 style={titleStyle}>Find 11</h1>

        <div style={taglineRowStyle}>
          {['Draw', 'Guess', 'Win'].map((word, idx) => (
            <span
              key={word}
              style={{
                background: PILL_BG[idx % PILL_BG.length],
                border: '1.5px solid #22C55E',
                borderRadius: 99,
                padding: '4px 14px',
                fontSize: 13,
                fontWeight: 700,
                color: '#ECFDF5',
              }}
            >
              {word}
            </span>
          ))}
        </div>

        <div style={loaderWrapStyle}>
          <div style={spinnerStyle} />
          <span style={loadingTextStyle}>Loading...</span>
        </div>
      </div>
    </div>
  );
};

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: 20,
  background: '#05160E',
};

const cardStyle: React.CSSProperties = {
  padding: '40px 32px 34px',
  maxWidth: 400,
  width: '100%',
  textAlign: 'center',
  background: '#0B2418',
  border: '2px solid #1F6B46',
  borderRadius: 16,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const logoBadgeStyle: React.CSSProperties = {
  width: 68,
  height: 68,
  borderRadius: 16,
  background: '#103322',
  border: '1.5px solid #22C55E',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 18,
};

const titleStyle: React.CSSProperties = {
  fontSize: 36,
  fontWeight: 700,
  color: '#ECFDF5',
  letterSpacing: 0.5,
  margin: '0 0 14px',
  lineHeight: 1.1,
};

const taglineRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginBottom: 28,
};

const loaderWrapStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
};

const spinnerStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  border: '3px solid #14452E',
  borderTop: '3px solid #4ADE80',
  borderRadius: '50%',
  animation: 'spin 0.9s linear infinite',
};

const loadingTextStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: '#86EFAC',
};