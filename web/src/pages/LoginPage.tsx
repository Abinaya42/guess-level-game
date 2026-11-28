import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Drop in a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      await login(data.email, data.password);
      toast.success('Pencils ready — welcome back!');
      navigate('/home');
    } catch (err: any) {
      setServerError(err.message);
    }
  };

  return (
    <div style={pageStyle}>
      {/* Subtle decorative hand-drawn corner doodles */}
      <svg width="110" height="110" viewBox="0 0 110 110" fill="none" style={{ position: 'fixed', top: 24, left: 24, opacity: 0.22, pointerEvents: 'none' }}>
        <path d="M18 65 C 25 22, 78 18, 86 58 C 92 85, 42 96, 26 74" stroke="#1C1917" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 6" />
        <path d="M62 24 L 68 38 L 83 40 L 71 50 L 74 65 L 62 57 L 50 65 L 53 50 L 41 40 L 56 38 Z" stroke="#1C1917" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>

      <div className="sketch-card" style={cardStyle}>
        {/* Tilted Sticky Note Tag */}
        <div style={stickyTagStyle} className="font-hand">
          Sketch &amp; Guess!
        </div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          {/* Custom Hand-Drawn Pencil Emblem */}
          <div style={logoBadgeStyle}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" fill="#FB7185" />
              <path d="m14 6 4 4" />
              <path d="M3 21h18" strokeDasharray="3 3" />
            </svg>
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 700, color: '#1C1917', margin: '10px 0 4px' }}>
            Grab a Brush
          </h1>
          <p style={{ color: '#57534E', fontSize: 14 }}>
            Sign in to join your room and start sketching
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

          <div>
            <label style={labelStyle}>Password</label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              style={inputStyle(!!errors.password)}
            />
            {errors.password && <span style={errStyle}>{errors.password.message}</span>}
          </div>

          <div style={{ textAlign: 'right', marginTop: -4 }}>
            <Link to="/forgot-password" style={{ color: '#1C1917', fontSize: 13, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Forgot password?
            </Link>
          </div>

          {serverError && (
            <div style={errorBoxStyle}>
              {serverError}
            </div>
          )}

          <button type="submit" disabled={isLoading} className="sketch-btn" style={submitBtn(isLoading)}>
            {isLoading ? 'Opening Sketchbook...' : 'Enter Game Room →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 22, color: '#57534E', fontSize: 14 }}>
          New around here?{' '}
          <Link to="/register" style={{ color: '#E11D48', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Create an account
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
  position: 'relative',
};

const cardStyle: React.CSSProperties = {
  padding: '38px 34px',
  maxWidth: 420,
  width: '100%',
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

const logoBadgeStyle: React.CSSProperties = {
  width: 60,
  height: 60,
  margin: '0 auto',
  borderRadius: 16,
  background: '#22C55E',
  border: '2.5px solid #1C1917',
  boxShadow: '3px 3px 0px #1C1917',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transform: 'rotate(-5deg)',
};

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
  background: '#0B2418',
  fontSize: 15,
  color: '#1C1917',
  outline: 'none',
  boxSizing: 'border-box',
});

const errStyle: React.CSSProperties = {
  color: '#E11D48',
  fontSize: 12,
  fontWeight: 600,
  marginTop: 5,
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

const submitBtn = (loading: boolean): React.CSSProperties => ({
  background: loading ? '#E7E5E4' : '#34D399',
  color: '#1C1917',
  padding: '13px',
  fontSize: 16,
  width: '100%',
  marginTop: 6,
  opacity: loading ? 0.8 : 1,
});