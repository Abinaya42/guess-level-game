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
    if (!username.trim() || username.length < 3) { toast.error('Username must be at least 3 characters'); return; }
    setSaving(true);
    try {
      const updated = await updateProfile(username.trim());
      setUser(updated);
      toast.success('Username updated!');
    } catch { toast.error('Failed to update username'); }
    setSaving(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate('/home')} style={{ color: '#fff', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>← Back</button>
        <h1 style={{ color: '#fff', margin: 0, fontWeight: 700 }}>Settings</h1>
      </div>

      <div style={{ maxWidth: 500, margin: '32px auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 16 }}>Display Name</h3>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" maxLength={20} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
          <button onClick={saveUsername} disabled={saving} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 16 }}>Account</h3>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>{user?.email}</p>
          <button onClick={() => logout().then(() => navigate('/login'))} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 600, cursor: 'pointer' }}>
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
};
