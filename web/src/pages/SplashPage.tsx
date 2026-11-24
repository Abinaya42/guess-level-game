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
      <div style={styles.logo}>🎨</div>
      <h1 style={styles.title}>GUESS LEVEL</h1>
      <p style={styles.subtitle}>Draw • Guess • Win</p>
      <div style={styles.spinner} />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', gap: 16 },
  logo: { fontSize: 80, animation: 'bounce 1s infinite' },
  title: { fontSize: 48, fontWeight: 900, color: '#fff', letterSpacing: 4, margin: 0 },
  subtitle: { fontSize: 20, color: 'rgba(255,255,255,0.8)', margin: 0 },
  spinner: { width: 40, height: 40, border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite', marginTop: 32 },
};
