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
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be 20 characters or fewer')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
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
      toast.success('Account created. Check your email to verify.');
      navigate('/verify-email');
    } catch (err: any) {
      setServerError(err.message);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={headerWrapStyle}>
          <div style={logoBadgeStyle}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </div>

          <h1 style={titleStyle}>Create Account</h1>
          <p style={subtitleStyle}>
            Pick a username and start playing Find 11
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={formStyle}>
          <div>
            <label style={labelStyle}>Username</label>
            <input
              {...register('username')}
              placeholder="player_11"
              style={inputStyle(!!errors.username)}
            />
            {errors.username && <span style={errStyle}>{errors.username.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="player@example.com"
              style={inputStyle(!!errors.email)}
            />
            {errors.email && <span style={errStyle}>{errors.email.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              {...register('password')}
              type="password"
              placeholder="At least 8 characters"
              style={inputStyle(!!errors.password)}
            />
            {errors.password && <span style={errStyle}>{errors.password.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>Confirm Password</label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="Enter password again"
              style={inputStyle(!!errors.confirmPassword)}
            />
            {errors.confirmPassword && <span style={errStyle}>{errors.confirmPassword.message}</span>}
          </div>

          {serverError && <div style={errorBoxStyle}>{serverError}</div>}

          <button type="submit" disabled={isLoading} style={submitBtn(isLoading)}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={footerTextStyle}>
          Already have an account?{' '}
          <Link to="/login" style={loginLinkStyle}>
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
  background: '#05160E',
};

const cardStyle: React.CSSProperties = {
  padding: '32px 28px',
  maxWidth: 430,
  width: '100%',
  background: '#0B2418',
  border: '2px solid #1F6B46',
  borderRadius: 16,
};

const headerWrapStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: 22,
};

const logoBadgeStyle: React.CSSProperties = {
  width: 52,
  height: 52,
  margin: '0 auto 12px',
  borderRadius: 12,
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
  margin: '0 0 4px',
};

const subtitleStyle: React.CSSProperties = {
  color: '#86EFAC',
  fontSize: 14,
  margin: 0,
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: '#ECFDF5',
  marginBottom: 5,
};

const inputStyle = (err: boolean) => ({
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: `1.5px solid ${err ? '#4ADE80' : '#1F6B46'}`,
  background: '#081D13',
  fontSize: 15,
  color: '#ECFDF5',
  outline: 'none',
  boxSizing: 'border-box' as const,
});

const errStyle: React.CSSProperties = {
  color: '#86EFAC',
  fontSize: 12,
  fontWeight: 600,
  marginTop: 4,
  display: 'block',
};

const errorBoxStyle: React.CSSProperties = {
  background: '#103322',
  border: '1.5px solid #22C55E',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#ECFDF5',
  fontSize: 13,
  fontWeight: 600,
};

const submitBtn = (loading: boolean) => ({
  background: loading ? '#143827' : '#22C55E',
  color: loading ? '#86EFAC' : '#05160E',
  padding: '13px 20px',
  fontSize: 16,
  fontWeight: 700,
  width: '100%',
  marginTop: 6,
  borderRadius: 10,
  border: 'none',
  cursor: loading ? 'not-allowed' : 'pointer',
});

const footerTextStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: 20,
  color: '#86EFAC',
  fontSize: 14,
};

const loginLinkStyle: React.CSSProperties = {
  color: '#4ADE80',
  fontWeight: 700,
  textDecoration: 'underline',
};