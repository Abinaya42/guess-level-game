import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getUserStats, getUserHistory } from '../services/api';
import { GameHistory } from '../types';

const STAT_CARD_BG = ['#081D13', '#0D291C', '#103322', '#14452E'];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [joinCode, setJoinCode] = useState('');
  const [stats, setStats] = useState<{ gamesPlayed: number; gamesWon: number; avgScore: number; bestScore: number } | null>(null);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserStats(user.id).then(setStats).catch(() => {}),
      getUserHistory(user.id).then((d) => setHistory(d.history)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user]);

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) return;
    navigate(`/lobby/${code}`);
  };

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div style={brandWrapStyle}>
          <div style={brandBadgeStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </div>
          <span style={brandTitleStyle}>Find 11</span>
        </div>

        <div style={navActionsStyle}>
          <button onClick={() => navigate('/profile')} style={profileBtnStyle}>
            {user?.username || 'Player'}
          </button>
          <button
            onClick={() => navigate('/settings')}
            style={iconBtnStyle}
            title="Settings"
            aria-label="Settings"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </button>
          <button
            onClick={() => logout().then(() => navigate('/login'))}
            style={signOutBtnStyle}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main style={mainStyle}>
        <div style={actionGridStyle}>
          <button onClick={() => navigate('/create-room')} style={createCardStyle}>
            <div style={actionIconBox}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div>
              <span style={cardHeadingStyle}>Create Room</span>
              <span style={cardDescStyle}>
                Start a new game and invite friends
              </span>
            </div>
            <span style={cardLinkStyle}>New room →</span>
          </button>

          <div style={joinCardStyle}>
            <div style={joinHeaderStyle}>
              <div style={actionIconBox}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </div>
              <span style={cardHeadingStyle}>Join Room</span>
            </div>

            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABC123"
              maxLength={6}
              style={codeInputStyle}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />

            <button
              onClick={handleJoin}
              disabled={joinCode.length !== 6}
              style={{
                ...joinBtnStyle,
                background: joinCode.length === 6 ? '#22C55E' : '#103322',
                color: joinCode.length === 6 ? '#05160E' : '#86EFAC',
                cursor: joinCode.length === 6 ? 'pointer' : 'not-allowed',
              }}
            >
              Join Game
            </button>
          </div>
        </div>

        {stats && (
          <div style={sectionCardStyle}>
            <div style={sectionHeaderStyle}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
              <h3 style={sectionTitleStyle}>Your Stats</h3>
            </div>

            <div style={statsGridStyle}>
              {[
                { label: 'Played', val: stats.gamesPlayed },
                { label: 'Wins', val: stats.gamesWon },
                { label: 'Avg Score', val: stats.avgScore },
                { label: 'Best Score', val: stats.bestScore },
              ].map(({ label, val }, idx) => (
                <div
                  key={label}
                  style={{
                    textAlign: 'center',
                    background: STAT_CARD_BG[idx % STAT_CARD_BG.length],
                    border: '1.5px solid #1F6B46',
                    borderRadius: 12,
                    padding: '14px 10px',
                  }}
                >
                  <div style={statValueStyle}>{val}</div>
                  <div style={statLabelStyle}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div style={sectionCardStyle}>
            <div style={historyHeaderStyle}>
              <div style={sectionHeaderNoMarginStyle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <h3 style={sectionTitleStyle}>Recent Games</h3>
              </div>
              <button onClick={() => navigate('/history')} style={seeAllBtnStyle}>
                See all →
              </button>
            </div>

            {history.slice(0, 3).map((g, idx) => (
              <div
                key={g.gameId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 4px',
                  borderBottom: idx < Math.min(history.length, 3) - 1 ? '1.5px dashed #1F6B46' : 'none',
                }}
              >
                <div>
                  <div style={historyRoomStyle}>Room #{g.roomCode}</div>
                  <div style={historyDateStyle}>{new Date(g.playedAt).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      background: g.rank === 1 ? '#22C55E' : '#103322',
                      border: '1px solid #22C55E',
                      borderRadius: 8,
                      padding: '2px 8px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: g.rank === 1 ? '#05160E' : '#ECFDF5',
                    }}
                  >
                    #{g.rank} of {g.totalPlayers}
                  </span>
                  <div style={historyPtsStyle}>{g.myScore} pts</div>
                </div>
              </div>
            ))}
          </div>
        )}
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
  gap: 12,
  flexWrap: 'wrap',
};

const brandWrapStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const brandBadgeStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  background: '#103322',
  border: '1.5px solid #22C55E',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const brandTitleStyle: React.CSSProperties = {
  fontSize: 21,
  fontWeight: 700,
  color: '#ECFDF5',
  lineHeight: 1.1,
};

const navActionsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const profileBtnStyle: React.CSSProperties = {
  background: '#103322',
  color: '#ECFDF5',
  border: '1.5px solid #1F6B46',
  borderRadius: 9,
  padding: '8px 14px',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
};

const iconBtnStyle: React.CSSProperties = {
  background: '#103322',
  border: '1.5px solid #1F6B46',
  borderRadius: 9,
  padding: '8px 10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const signOutBtnStyle: React.CSSProperties = {
  background: '#14452E',
  color: '#ECFDF5',
  border: '1.5px solid #22C55E',
  borderRadius: 9,
  padding: '8px 14px',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
};

const mainStyle: React.CSSProperties = {
  maxWidth: 880,
  margin: '0 auto',
  padding: '32px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

const actionGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 20,
};

const createCardStyle: React.CSSProperties = {
  background: '#0B2418',
  border: '2px solid #22C55E',
  borderRadius: 16,
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  cursor: 'pointer',
  textAlign: 'left',
};

const joinCardStyle: React.CSSProperties = {
  background: '#0B2418',
  border: '2px solid #1F6B46',
  borderRadius: 16,
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

const joinHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const actionIconBox: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 10,
  background: '#103322',
  border: '1.5px solid #22C55E',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const cardHeadingStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#ECFDF5',
  display: 'block',
};

const cardDescStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#86EFAC',
  marginTop: 4,
  display: 'block',
};

const cardLinkStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: '#4ADE80',
  marginTop: 'auto',
};

const codeInputStyle: React.CSSProperties = {
  padding: '11px 14px',
  borderRadius: 10,
  border: '1.5px solid #1F6B46',
  background: '#081D13',
  fontSize: 19,
  letterSpacing: 5,
  fontWeight: 700,
  textAlign: 'center',
  color: '#ECFDF5',
  outline: 'none',
};

const joinBtnStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 15,
  fontWeight: 700,
  borderRadius: 10,
  border: 'none',
};

const sectionCardStyle: React.CSSProperties = {
  background: '#0B2418',
  border: '2px solid #1F6B46',
  borderRadius: 16,
  padding: 24,
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 16,
};

const sectionHeaderNoMarginStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#ECFDF5',
  margin: 0,
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
  gap: 14,
};

const statValueStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: '#ECFDF5',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#86EFAC',
  marginTop: 2,
};

const historyHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 14,
};

const seeAllBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#4ADE80',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  textDecoration: 'underline',
};

const historyRoomStyle: React.CSSProperties = {
  fontWeight: 700,
  color: '#ECFDF5',
  fontSize: 15,
};

const historyDateStyle: React.CSSProperties = {
  color: '#86EFAC',
  fontSize: 12,
  marginTop: 2,
};

const historyPtsStyle: React.CSSProperties = {
  color: '#86EFAC',
  fontSize: 12,
  fontWeight: 600,
  marginTop: 4,
};