import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [serverError, setServerError] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const emailRegister = register('email');
  const passwordRegister = register('password');

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      await login(data.email, data.password);
      toast.success('Signed in.');
      navigate('/home');
    } catch (err: any) {
      setServerError(err?.message || 'Sign in failed');
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardWrapperStyle}>
        <div style={cardOffsetShadowStyle} />

        <div style={ribbonBadgeStyle}>Sketch &amp; Guess!</div>

        <div style={cardStyle}>
          <div style={headerWrapStyle}>
            <div style={logoBadgeStyle}>
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#05160E"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </div>

            <h1 style={titleStyle}>Grab a Brush</h1>
            <p style={subtitleStyle}>Sign in to join your room and start sketching</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={formStyle}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                {...emailRegister}
                type="email"
                placeholder="player@example.com"
                onFocus={() => setFocusedField('email')}
                onBlur={(e) => {
                  setFocusedField(null);
                  void emailRegister.onBlur(e);
                }}
                style={inputStyle(!!errors.email, focusedField === 'email')}
              />
              {errors.email && <span style={errStyle}>{errors.email.message}</span>}
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input
                {...passwordRegister}
                type="password"
                placeholder="••••••••"
                onFocus={() => setFocusedField('password')}
                onBlur={(e) => {
                  setFocusedField(null);
                  void passwordRegister.onBlur(e);
                }}
                style={inputStyle(!!errors.password, focusedField === 'password')}
              />
              {errors.password && <span style={errStyle}>{errors.password.message}</span>}
            </div>

            <div style={forgotRowStyle}>
              <Link to="/forgot-password" style={forgotLinkStyle}>
                Forgot password?
              </Link>
            </div>

            {serverError && <div style={errorBoxStyle}>{serverError}</div>}

            <button type="submit" disabled={isLoading} style={submitBtn(isLoading)}>
              {isLoading ? 'Entering Room...' : 'Enter Game Room →'}
            </button>
          </form>

          <p style={footerTextStyle}>
            New around here?{' '}
            <Link to="/register" style={registerLinkStyle}>
              Create an account
            </Link>
          </p>
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
  backgroundColor: '#05160E',
  backgroundImage: 'radial-gradient(#164E32 1.25px, transparent 1.25px)',
  backgroundSize: '18px 18px',
};

const cardWrapperStyle: React.CSSProperties = {
  position: 'relative',
  maxWidth: 420,
  width: '100%',
};

const cardOffsetShadowStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  transform: 'translate(8px, 8px)',
  borderRadius: 18,
  background: '#030E09',
  border: '1.5px solid #133B27',
  zIndex: 0,
};

const ribbonBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: -12,
  right: 18,
  zIndex: 3,
  background: '#FACC15',
  color: '#05160E',
  fontSize: 12,
  fontWeight: 800,
  padding: '5px 12px',
  borderRadius: 8,
  border: '1.5px solid #05160E',
  boxShadow: '2px 2px 0px #05160E',
  transform: 'rotate(3deg)',
  letterSpacing: 0.2,
};

const cardStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  padding: '32px 28px',
  width: '100%',
  background: '#0B2418',
  border: '2px solid #1F6B46',
  borderRadius: 18,
  boxSizing: 'border-box',
};

const headerWrapStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: 24,
};

const logoBadgeStyle: React.CSSProperties = {
  width: 54,
  height: 54,
  margin: '0 auto 12px',
  borderRadius: 14,
  background: '#84CC16',
  border: '2px solid #05160E',
  boxShadow: '3px 3px 0px #05160E',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transform: 'rotate(-4deg)',
};

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  color: '#ECFDF5',
  margin: '0 0 6px',
  letterSpacing: -0.3,
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
  marginBottom: 6,
};

const inputStyle = (hasError: boolean, isFocused: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: `1.5px solid ${
    isFocused ? '#4ADE80' : hasError ? '#F87171' : '#1F6B46'
  }`,
  background: '#071A11',
  fontSize: 15,
  color: '#ECFDF5',
  outline: 'none',
  boxSizing: 'border-box',
  boxShadow: isFocused
    ? '0 0 0 3px rgba(74, 222, 128, 0.25), 0 0 14px rgba(34, 197, 94, 0.35)'
    : 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
});

const errStyle: React.CSSProperties = {
  color: '#FCA5A5',
  fontSize: 12,
  fontWeight: 600,
  marginTop: 5,
  display: 'block',
};

const forgotRowStyle: React.CSSProperties = {
  textAlign: 'right',
  marginTop: -2,
};

const forgotLinkStyle: React.CSSProperties = {
  color: '#A7F3D0',
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'underline',
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

const submitBtn = (loading: boolean): React.CSSProperties => ({
  background: loading ? '#143827' : '#22C55E',
  color: loading ? '#86EFAC' : '#05160E',
  padding: '13px 20px',
  fontSize: 16,
  fontWeight: 800,
  width: '100%',
  marginTop: 6,
  borderRadius: 12,
  border: '2px solid #05160E',
  boxShadow: loading ? 'none' : '0 4px 0 #05160E',
  cursor: loading ? 'not-allowed' : 'pointer',
  transition: 'transform 0.1s ease, box-shadow 0.1s ease',
});

const footerTextStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: 20,
  color: '#A7F3D0',
  fontSize: 14,
};

const registerLinkStyle: React.CSSProperties = {
  color: '#4ADE80',
  fontWeight: 700,
  textDecoration: 'underline',
};