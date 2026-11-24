import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
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
      toast.success('Welcome back!');
      navigate('/home');
    } catch (err: any) {
      setServerError(err.message);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48 }}>🎨</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1e293b', margin: '8px 0 4px' }}>Welcome Back!</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Log in to continue playing</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input {...register('email')} type="email" placeholder="you@example.com" style={inputStyle(!!errors.email)} />
            {errors.email && <span style={errStyle}>{errors.email.message}</span>}
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input {...register('password')} type="password" placeholder="Your password" style={inputStyle(!!errors.password)} />
            {errors.password && <span style={errStyle}>{errors.password.message}</span>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <Link to="/forgot-password" style={{ color: '#6366f1', fontSize: 13, fontWeight: 500 }}>Forgot password?</Link>
          </div>

          {serverError && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 14 }}>{serverError}</div>}

          <button type="submit" disabled={isLoading} style={submitBtn(isLoading)}>
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, color: '#64748b', fontSize: 14 }}>
          Don't have an account? <Link to="/register" style={{ color: '#6366f1', fontWeight: 600 }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

const pageStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 16 };
const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 20, padding: 40, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const inputStyle = (err: boolean): React.CSSProperties => ({ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${err ? '#ef4444' : '#e2e8f0'}`, fontSize: 15, outline: 'none', boxSizing: 'border-box' });
const errStyle: React.CSSProperties = { color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' };
const submitBtn = (loading: boolean): React.CSSProperties => ({ background: loading ? '#a5b4fc' : '#6366f1', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', width: '100%', marginTop: 8 });
