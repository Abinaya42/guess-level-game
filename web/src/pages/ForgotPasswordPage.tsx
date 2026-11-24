import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const schema = z.object({ email: z.string().email('Please enter a valid email address') });
type FormData = z.infer<typeof schema>;

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { forgotPassword, isLoading } = useAuthStore();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      await forgotPassword(data.email);
      setSent(true);
      toast.success('Password reset email sent!');
    } catch (err: any) {
      setServerError(err.message);
    }
  };

  if (sent) return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64 }}>✉️</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '16px 0 8px' }}>Check Your Email</h2>
          <p style={{ color: '#64748b' }}>We've sent you a link to reset your password.</p>
          <button onClick={() => navigate('/login')} style={{ marginTop: 24, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48 }}>🔑</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '8px 0 4px' }}>Forgot Password?</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Enter your email and we'll send you a reset link.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email</label>
            <input {...register('email')} type="email" placeholder="you@example.com" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${errors.email ? '#ef4444' : '#e2e8f0'}`, fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
            {errors.email && <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{errors.email.message}</span>}
          </div>
          {serverError && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 14 }}>{serverError}</div>}
          <button type="submit" disabled={isLoading} style={{ background: isLoading ? '#a5b4fc' : '#6366f1', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', width: '100%' }}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, color: '#64748b', fontSize: 14 }}>
          <Link to="/login" style={{ color: '#6366f1', fontWeight: 600 }}>← Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

const pageStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 16 };
const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 20, padding: 40, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' };
