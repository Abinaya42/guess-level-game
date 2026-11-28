import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { updateProfile } from '../services/api';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const [username, setUsername] = useState(user?.username || '');
  const [saving, setSaving] = useState(false);

  const saveUsername = async () => {
    if (!username.trim() || username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile(username.trim());
      setUser(updated);
      toast.success('Username updated.');
    } catch {
      toast.error('Could not update username');
    }
    setSaving(false);
  };

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <button onClick={() => navigate('/home')} style={backBtnStyle}>
          Back
        </button>
        <h1 style={headerTitleStyle}>Settings</h1>
        <div style={{ width: 64 }} />
      </header>

      <main style={mainStyle}>
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
            <h3 style={cardTitleStyle}>Display Name</h3>
          </div>

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your username"
            maxLength={20}
            style={inputStyle}
          />

          <button
            onClick={saveUsername}
            disabled={saving}
            style={{
              ...saveBtnStyle,
              background: saving ? '#143827' : '#22C55E',
              color: saving ? '#86EFAC' : '#05160E',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save Name'}
          </button>
        </div>

        <div style={cardStyle}>
          <h3 style={accountTitleStyle}>Account</h3>
          <p style={accountTextStyle}>
            Signed in as <strong style={{ color: '#ECFDF5' }}>{user?.email}</strong>
          </p>

          <button
            onClick={() => logout().then(() => navigate('/login'))}
            style={logoutBtnStyle}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </main>
    </div>
  );
};

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  paddingBottom: 48,
  background: '#05160E',
};

const headerStyle: React.CSSProperties = {
  background: '#0B2418',
  borderBottom: '2px solid #1F6B46',
  padding: '14px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const backBtnStyle: React.CSSProperties = {
  background: '#22C55E',
  color: '#05160E',
  padding: '8px 14px',
  fontSize: 14,
  fontWeight: 700,
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
};

const headerTitleStyle: React.CSSProperties = {
  fontSize: 21,
  fontWeight: 700,
  color: '#ECFDF5',
  margin: 0,
};

const mainStyle: React.CSSProperties = {
  maxWidth: 520,
  margin: '32px auto',
  padding: '0 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  padding: 24,
  background: '#0B2418',
  border: '2px solid #1F6B46',
  borderRadius: 16,
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 14,
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  color: '#ECFDF5',
  margin: 0,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: '1.5px solid #1F6B46',
  background: '#081D13',
  fontSize: 15,
  fontWeight: 600,
  color: '#ECFDF5',
  outline: 'none',
  boxSizing: 'border-box',
  marginBottom: 14,
};

const saveBtnStyle: React.CSSProperties = {
  padding: '11px 20px',
  fontSize: 15,
  fontWeight: 700,
  borderRadius: 10,
  border: 'none',
};

const accountTitleStyle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  color: '#ECFDF5',
  margin: '0 0 8px',
};

const accountTextStyle: React.CSSProperties = {
  color: '#86EFAC',
  fontSize: 14,
  margin: '0 0 16px',
};

const logoutBtnStyle: React.CSSProperties = {
  background: '#103322',
  color: '#ECFDF5',
  border: '1.5px solid #22C55E',
  borderRadius: 10,
  padding: '10px 18px',
  fontSize: 14,
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  cursor: 'pointer',
};