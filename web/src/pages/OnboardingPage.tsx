import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const slides = [
  { emoji: '🎨', title: 'Draw Anything', desc: 'Express yourself with our intuitive drawing tools — colors, brushes, undo, and more.' },
  { emoji: '🧩', title: 'Guess the Word', desc: 'Watch the drawing come to life and type your guesses. Faster guesses earn more points!' },
  { emoji: '🏆', title: 'Win Together', desc: 'Play with up to 11 friends in private rooms. Invite by code or link and battle for the top score!' },
];

export const OnboardingPage: React.FC = () => {
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc', padding: 24, gap: 24 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 48, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 24 }}>{slides[slide].emoji}</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>{slides[slide].title}</h2>
        <p style={{ fontSize: 16, color: '#64748b', marginBottom: 32, lineHeight: 1.6 }}>{slides[slide].desc}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {slides.map((_, i) => (
            <div key={i} style={{ width: i === slide ? 24 : 8, height: 8, borderRadius: 4, background: i === slide ? '#6366f1' : '#e2e8f0', transition: 'all 0.3s' }} />
          ))}
        </div>

        {slide < slides.length - 1 ? (
          <button onClick={() => setSlide(s => s + 1)} style={btnStyle('#6366f1')}>Next →</button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={() => navigate('/register')} style={btnStyle('#6366f1')}>Get Started</button>
            <button onClick={() => navigate('/login')} style={btnStyle('#e2e8f0', '#374151')}>Already have an account</button>
          </div>
        )}
        <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginTop: 16, fontSize: 14 }}>Skip</button>
      </div>
    </div>
  );
};

const btnStyle = (bg: string, color = '#fff'): React.CSSProperties => ({
  background: bg, color, border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 16,
  fontWeight: 600, cursor: 'pointer', width: '100%', transition: 'opacity 0.2s',
});
