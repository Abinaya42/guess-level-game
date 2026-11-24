import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';

export const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { resendVerification, logout } = useAuthStore();
  const [checking, setChecking] = useState(false);

  const checkVerification = async () => {
    setChecking(true);
    await auth.currentUser?.reload();
    if (auth.currentUser?.emailVerified) {
      toast.success('Email verified! Welcome!');
      navigate('/home');
    } else {
      toast.error('Email not verified yet. Please check your inbox.');
    }
    setChecking(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 48, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📧</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>Check Your Email</h2>
        <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: 32 }}>
          We've sent a verification link to <strong>{auth.currentUser?.email}</strong>. Click the link to verify your account.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={checkVerification} disabled={checking} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            {checking ? 'Checking...' : "I've Verified My Email"}
          </button>
          <button onClick={() => resendVerification().then(() => toast.success('Verification email resent!'))} style={{ background: '#e2e8f0', color: '#374151', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Resend Email
          </button>
          <button onClick={() => logout().then(() => navigate('/login'))} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};
