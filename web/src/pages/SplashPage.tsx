import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

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
    <div style={styles.container}>
      <div className="sketch-card" style={styles.coverCard}>
        {/* Tilted Sticky Note Tag */}
        <div style={styles.stickyTag} className="font-hand">
          Sketch Edition
        </div>

        {/* Custom Hand-Drawn Pencil & Palette Emblem */}
        <div style={styles.logoBadge}>
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1C1917"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" fill="#FFFDF9" />
            <path d="m15 5 4 4" />
          </svg>
        </div>

        <h1 className="font-display" style={styles.title}>
          Guess 11
        </h1>

        <div style={styles.taglineRow}>
          <span style={styles.pill('#FEF9C3')}>Draw</span>
          <span style={styles.pill('#E0F2FE')}>Guess</span>
          <span style={styles.pill('#DCFCE7')}>Win</span>
        </div>

        {/* Ink-Styled Spinner */}
        <div style={styles.loaderWrap}>
          <div style={styles.spinner} />
          <span className="font-hand" style={styles.loadingText}>
            Sharpening pencils...
          </span>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: 20,
  },
  coverCard: {
    padding: '44px 36px 36px',
    maxWidth: 400,
    width: '100%',
    textAlign: 'center',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  stickyTag: {
    position: 'absolute',
    top: -14,
    right: 22,
    background: '#38BDF8',
    border: '2px solid #1C1917',
    borderRadius: 8,
    padding: '2px 12px',
    fontSize: 18,
    fontWeight: 700,
    color: '#1C1917',
    transform: 'rotate(3deg)',
    boxShadow: '2px 2px 0px #1C1917',
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 22,
    background: '#FDE047',
    border: '3px solid #1C1917',
    boxShadow: '4px 4px 0px #1C1917',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'rotate(-5deg)',
    marginBottom: 20,
  },
  title: {
    fontSize: 44,
    fontWeight: 700,
    color: '#1C1917',
    letterSpacing: 1,
    margin: '0 0 14px',
    lineHeight: 1.1,
  },
  taglineRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 30,
  },
  pill: (bg: string): React.CSSProperties => ({
    background: bg,
    border: '2px solid #1C1917',
    borderRadius: 99,
    padding: '4px 14px',
    fontSize: 14,
    fontWeight: 700,
    color: '#1C1917',
  }),
  loaderWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  spinner: {
    width: 34,
    height: 34,
    border: '3.5px solid #E7E5E4',
    borderTop: '3.5px solid #1C1917',
    borderRadius: '50%',
    animation: 'spin 0.9s linear infinite',
  },
  loadingText: {
    fontSize: 19,
    fontWeight: 700,
    color: '#57534E',
  },
};