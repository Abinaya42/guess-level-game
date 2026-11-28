import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const slides = [
  {
    step: 'Step 1',
    title: 'Draw Words',
    desc: 'Pick a word and sketch it on the canvas before time runs out.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r="1.5" />
        <circle cx="17.5" cy="10.5" r="1.5" />
        <circle cx="8.5" cy="7.5" r="1.5" />
        <circle cx="6.5" cy="12.5" r="1.5" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
      </svg>
    ),
  },
  {
    step: 'Step 2',
    title: 'Guess Fast',
    desc: 'Watch strokes appear in real time and type guesses to earn points.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </svg>
    ),
  },
  {
    step: 'Step 3',
    title: 'Play Together',
    desc: 'Play with up to 11 friends in a room and climb the scoreboard.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
  },
];

export const OnboardingPage: React.FC = () => {
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();
  const current = slides[slide];

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={stepTagStyle}>{current.step}</div>

        <div style={badgeStyle}>{current.icon}</div>

        <h2 style={titleStyle}>{current.title}</h2>
        <p style={descStyle}>{current.desc}</p>

        <div style={dotsRowStyle}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setSlide(i)}
              style={{
                width: i === slide ? 26 : 10,
                height: 10,
                borderRadius: 99,
                border: '1.5px solid #22C55E',
                background: i === slide ? '#22C55E' : '#081D13',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>

        {slide < slides.length - 1 ? (
          <button
            onClick={() => setSlide((s) => s + 1)}
            style={primaryBtnStyle}
          >
            Next
          </button>
        ) : (
          <div style={finalActionsStyle}>
            <button
              onClick={() => navigate('/register')}
              style={primaryBtnStyle}
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/login')}
              style={secondaryBtnStyle}
            >
              Sign In
            </button>
          </div>
        )}

        <button onClick={() => navigate('/login')} style={skipBtnStyle}>
          Skip
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
  padding: '36px 28px',
  maxWidth: 420,
  width: '100%',
  textAlign: 'center',
  background: '#0B2418',
  border: '2px solid #1F6B46',
  borderRadius: 16,
};

const stepTagStyle: React.CSSProperties = {
  display: 'inline-block',
  background: '#103322',
  border: '1.5px solid #22C55E',
  borderRadius: 8,
  padding: '3px 12px',
  fontSize: 13,
  fontWeight: 700,
  color: '#86EFAC',
  marginBottom: 14,
};

const badgeStyle: React.CSSProperties = {
  width: 60,
  height: 60,
  margin: '0 auto',
  borderRadius: 14,
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
  margin: '16px 0 8px',
};

const descStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#86EFAC',
  margin: '0 0 24px',
  lineHeight: 1.6,
};

const dotsRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 10,
  marginBottom: 24,
};

const primaryBtnStyle: React.CSSProperties = {
  background: '#22C55E',
  color: '#05160E',
  padding: '13px 24px',
  fontSize: 16,
  fontWeight: 700,
  width: '100%',
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
};

const finalActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const secondaryBtnStyle: React.CSSProperties = {
  background: '#13422B',
  color: '#ECFDF5',
  padding: '12px 24px',
  fontSize: 15,
  fontWeight: 700,
  width: '100%',
  borderRadius: 10,
  border: '1.5px solid #22C55E',
  cursor: 'pointer',
};

const skipBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#86EFAC',
  cursor: 'pointer',
  marginTop: 16,
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'underline',
};