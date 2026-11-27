import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const schema = z.object({
  username: z
    .string()
    .min(3, 'Pick at least 3 characters')
    .max(20, 'Keep it under 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  email: z.string().email('Drop in a valid email address'),
  password: z.string().min(8, 'Password needs at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      await registerUser(data.email, data.password, data.username);
      toast.success('Artist pass issued! Check your inbox to verify.');
      navigate('/verify-email');
    } catch (err: any) {
      setServerError(err.message);
    }
  };

  return (
    <div style={pageStyle}>
      {/* Subtle decorative hand-drawn corner doodle */}
      <svg width="110" height="110" viewBox="0 0 110 110" fill="none" style={{ position: 'fixed', bottom: 24, right: 24, opacity: 0.22, pointerEvents: 'none' }}>
        <path d="M20 82 C 34 38, 76 34, 88 76" stroke="#1C1917" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 6" />
        <circle cx="54" cy="30" r="12" stroke="#1C1917" strokeWidth="2.5" />
      </svg>

      <div className="sketch-card" style={cardStyle}>
        {/* Tilted Sticky Note Tag */}
        <div style={stickyTagStyle} className="font-hand">
          Artist Pass!
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {/* Custom Hand-Drawn Brush Emblem */}
          <div style={logoBadgeStyle}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" fill="#FDE047" />
              <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" fill="#FB7185" />
            </svg>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1C1917', margin: '10px 0 4px' }}>
            Claim Your Sketchbook
          </h1>
          <p style={{ color: '#57534E', fontSize: 14 }}>
            Pick an artist name and jump into Guess 11
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Artist Name</label>
            <input {...register('username')} placeholder="e.g. DoodleKing_11" style={inputStyle(!!errors.username)} />
            {errors.username && <span style={errStyle}>{errors.username.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input {...register('email')} type="email" placeholder="artist@sketchbook.com" style={inputStyle(!!errors.email)} />
            {errors.email && <span style={errStyle}>{errors.email.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input {...register('password')} type="password" placeholder="At least 8 characters" style={inputStyle(!!errors.password)} />
            {errors.password && <span style={errStyle}>{errors.password.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>Confirm Password</label>
            <input {...register('confirmPassword')} type="password" placeholder="Type password again" style={inputStyle(!!errors.confirmPassword)} />
            {errors.confirmPassword && <span style={errStyle}>{errors.confirmPassword.message}</span>}
          </div>

          {serverError && <div style={errorBoxStyle}>{serverError}</div>}

          <button type="submit" disabled={isLoading} className="sketch-btn" style={submitBtn(isLoading)}>
            {isLoading ? 'Printing Pass...' : 'Create Artist Account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, color: '#57534E', fontSize: 14 }}>
          Already have a sketchbook?{' '}
          <Link to="/login" style={{ color: '#E11D48', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Sign In
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
  padding: '34px 32px',
  maxWidth: 430,
  width: '100%',
  position: 'relative',
};

const stickyTagStyle: React.CSSProperties = {
  position: 'absolute',
  top: -14,
  right: 22,
  background: '#34D399',
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
  width: 58,
  height: 58,
  margin: '0 auto',
  borderRadius: 16,
  background: '#38BDF8',
  border: '2.5px solid #1C1917',
  boxShadow: '3px 3px 0px #1C1917',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transform: 'rotate(4deg)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: '#1C1917',
  marginBottom: 5,
};

const inputStyle = (err: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '11px 14px',
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

const submitBtn = (loading: boolean): React.CSSProperties => ({
  background: loading ? '#E7E5E4' : '#FDE047',
  color: '#1C1917',
  padding: '13px',
  fontSize: 16,
  width: '100%',
  marginTop: 6,
  opacity: loading ? 0.8 : 1,
});