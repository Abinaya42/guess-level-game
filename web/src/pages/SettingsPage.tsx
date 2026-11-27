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
      toast.error('Artist name must be at least 3 characters');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile(username.trim());
      setUser(updated);
      toast.success('Artist name updated!');
    } catch {
      toast.error('Could not update artist name');
    }
    setSaving(false);
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 48 }}>
      {/* Sketchbook Top Navbar */}
      <header style={headerStyle}>
        <button onClick={() => navigate('/home')} className="sketch-btn" style={backBtnStyle}>
          ← Studio
        </button>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: '#1C1917', margin: 0 }}>
          Studio Settings
        </h1>
        <div style={{ width: 84 }} />
      </header>

      <main style={{ maxWidth: 520, margin: '32px auto', padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Artist Name Card */}
        <div className="sketch-card" style={{ padding: 24, position: 'relative' }}>
          <div style={stickyTagStyle} className="font-hand">
            Name Tag
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1C1917', margin: 0 }}>
              Artist Display Name
            </h3>
          </div>

          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Your artist name"
            maxLength={20}
            style={inputStyle}
          />

          <button
            onClick={saveUsername}
            disabled={saving}
            className="sketch-btn"
            style={{
              background: saving ? '#E7E5E4' : '#34D399',
              color: '#1C1917',
              padding: '12px 22px',
              fontSize: 15,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Updating Tag...' : 'Save Name'}
          </button>
        </div>

        {/* Account Card */}
        <div className="sketch-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1C1917', margin: '0 0 8px' }}>
            Account Pass
          </h3>
          <p style={{ color: '#57534E', fontSize: 14, marginBottom: 18 }}>
            Signed in as <strong style={{ color: '#1C1917' }}>{user?.email}</strong>
          </p>

          <button
            onClick={() => logout().then(() => navigate('/login'))}
            className="sketch-btn"
            style={logoutBtnStyle}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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

const headerStyle: React.CSSProperties = {
  background: '#FFFDF9',
  borderBottom: '2.5px solid #1C1917',
  padding: '14px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const backBtnStyle: React.CSSProperties = {
  background: '#FDE047',
  color: '#1C1917',
  padding: '8px 14px',
  fontSize: 14,
};

const stickyTagStyle: React.CSSProperties = {
  position: 'absolute',
  top: -13,
  right: 20,
  background: '#FDE047',
  border: '2px solid #1C1917',
  borderRadius: 8,
  padding: '1px 12px',
  fontSize: 17,
  fontWeight: 700,
  color: '#1C1917',
  transform: 'rotate(2.5deg)',
  boxShadow: '2px 2px 0px #1C1917',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 11,
  border: '2px solid #1C1917',
  background: '#FFFDF9',
  fontSize: 15,
  fontWeight: 600,
  color: '#1C1917',
  outline: 'none',
  boxSizing: 'border-box',
  marginBottom: 14,
};

const logoutBtnStyle: React.CSSProperties = {
  background: '#FFE4E6',
  color: '#1C1917',
  padding: '11px 20px',
  fontSize: 15,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};