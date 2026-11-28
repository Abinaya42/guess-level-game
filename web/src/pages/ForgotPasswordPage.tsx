import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
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
      toast.success('Password reset email sent.');
    } catch (err: any) {
      setServerError(err.message);
    }
  };

  if (sent) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={badgeStyle}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>

            <h2 style={titleStyle}>Check Your Inbox</h2>
            <p style={subtitleStyle}>
              We sent a password reset link to your email address.
            </p>

            <button
              onClick={() => navigate('/login')}
              style={primaryBtnStyle}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={badgeStyle}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7.5" cy="15.5" r="5.5" />
              <path d="m21 2-9.6 9.6" />
              <path d="m15.5 7.5 3 3L22 7l-3-3" />
            </svg>
          </div>

          <h1 style={titleStyle}>Forgot Password</h1>
          <p style={subtitleStyle}>
            Enter your email and we will send you a password reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={formStyle}>
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

          {serverError && <div style={errorBoxStyle}>{serverError}</div>}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...primaryBtnStyle,
              background: isLoading ? '#143827' : '#22C55E',
              color: isLoading ? '#86EFAC' : '#05160E',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p style={footerLinkWrapStyle}>
          <Link to="/login" style={footerLinkStyle}>
            Back to Sign In
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
  maxWidth: 420,
  width: '100%',
  background: '#0B2418',
  border: '2px solid #1F6B46',
  borderRadius: 16,
};

const badgeStyle: React.CSSProperties = {
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
  fontSize: 25,
  fontWeight: 700,
  color: '#ECFDF5',
  margin: '0 0 6px',
};

const subtitleStyle: React.CSSProperties = {
  color: '#86EFAC',
  fontSize: 14,
  lineHeight: 1.5,
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

const primaryBtnStyle: React.CSSProperties = {
  marginTop: 8,
  background: '#22C55E',
  color: '#05160E',
  padding: '13px 20px',
  fontSize: 15,
  fontWeight: 700,
  width: '100%',
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
};

const footerLinkWrapStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: 20,
  color: '#86EFAC',
  fontSize: 14,
};

const footerLinkStyle: React.CSSProperties = {
  color: '#4ADE80',
  fontWeight: 700,
  textDecoration: 'underline',
};