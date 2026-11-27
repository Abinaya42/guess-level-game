import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Drop in a valid email address'),
});
type FormData = z.infer<typeof schema>;

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { forgotPassword, isLoading } = useAuthStore();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      await forgotPassword(data.email);
      setSent(true);
      toast.success('Reset note dispatched to your inbox!');
    } catch (err: any) {
      setServerError(err.message);
    }
  };

  if (sent) {
    return (
      <div style={pageStyle}>
        <div className="sketch-card" style={cardStyle}>
          <div style={stickyTagStyle('#34D399')} className="font-hand">
            Sent!
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={badgeStyle('#FEF9C3')}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="3" fill="#FFFDF9" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>

            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1C1917', margin: '16px 0 8px' }}>
              Check Your Inbox
            </h2>
            <p style={{ color: '#57534E', fontSize: 14, lineHeight: 1.5 }}>
              We've sent a fresh password reset link to your email address.
            </p>

            <button
              onClick={() => navigate('/login')}
              className="sketch-btn"
              style={{
                marginTop: 24,
                background: '#FDE047',
                color: '#1C1917',
                padding: '13px 28px',
                fontSize: 16,
                width: '100%',
              }}
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div className="sketch-card" style={cardStyle}>
        <div style={stickyTagStyle('#38BDF8')} className="font-hand">
          Key Recovery
        </div>

        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={badgeStyle('#FDE047')}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7.5" cy="15.5" r="5.5" fill="#FFFDF9" />
              <path d="m21 2-9.6 9.6" />
              <path d="m15.5 7.5 3 3L22 7l-3-3" />
            </svg>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1C1917', margin: '14px 0 6px' }}>
            Lost Your Key?
          </h1>
          <p style={{ color: '#57534E', fontSize: 14, lineHeight: 1.5 }}>
            Enter your email and we'll send over a password reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="artist@sketchbook.com"
              style={inputStyle(!!errors.email)}
            />
            {errors.email && <span style={errStyle}>{errors.email.message}</span>}
          </div>

          {serverError && <div style={errorBoxStyle}>{serverError}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="sketch-btn"
            style={{
              background: isLoading ? '#E7E5E4' : '#34D399',
              color: '#1C1917',
              padding: '13px',
              fontSize: 16,
              width: '100%',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Sending Note...' : 'Send Reset Link →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 22, color: '#57534E', fontSize: 14 }}>
          <Link to="/login" style={{ color: '#E11D48', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            ← Back to Sign In
          </Link>
        </p>
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
  position: 'relative',
};

const stickyTagStyle = (bg: string): React.CSSProperties => ({
  position: 'absolute',
  top: -14,
  right: 22,
  background: bg,
  border: '2px solid #1C1917',
  borderRadius: 8,
  padding: '2px 12px',
  fontSize: 18,
  fontWeight: 700,
  color: '#1C1917',
  transform: 'rotate(3deg)',
  boxShadow: '2px 2px 0px #1C1917',
});

const badgeStyle = (bg: string): React.CSSProperties => ({
  width: 60,
  height: 60,
  margin: '0 auto',
  borderRadius: 16,
  background: bg,
  border: '2.5px solid #1C1917',
  boxShadow: '3px 3px 0px #1C1917',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transform: 'rotate(-4deg)',
});

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: '#1C1917',
  marginBottom: 6,
};

const inputStyle = (err: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '12px 14px',
  borderRadius: 11,
  border: `2px solid ${err ? '#E11D48' : '#1C1917'}`,
  background: '#FFFDF9',
  fontSize: 15,
  color: '#1C1917',
  outline: 'none',
  boxSizing: 'border-box',
});

const errStyle: React.CSSProperties = {
  color: '#E11D48',
  fontSize: 12,
  fontWeight: 600,
  marginTop: 4,
  display: 'block',
};

const errorBoxStyle: React.CSSProperties = {
  background: '#FFE4E6',
  border: '2px solid #1C1917',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#9F1239',
  fontSize: 13,
  fontWeight: 600,
};