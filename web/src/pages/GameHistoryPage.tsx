import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getUserHistory } from '../services/api';
import { GameHistory } from '../types';

const PODIUM_BG = ['#15803D', '#103322', '#0D291C'];
const PODIUM_LABELS = ['1st', '2nd', '3rd'];

export const GameHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getUserHistory(user.id, page)
      .then((d) => {
        setHistory((prev) => (page === 1 ? d.history : [...prev, ...d.history]));
        setHasMore(d.hasMore);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, page]);

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <button onClick={() => navigate('/home')} style={backBtnStyle}>
          Home
        </button>
        <h1 style={headerTitleStyle}>Game History</h1>
        <div style={{ width: 70 }} />
      </header>

      <main style={mainStyle}>
        {loading && page === 1 ? (
          <div style={loadingBoxStyle}>
            Loading match history...
          </div>
        ) : history.length === 0 ? (
          <div style={emptyCardStyle}>
            <div style={emptyBadgeStyle}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
            </div>
            <h2 style={emptyTitleStyle}>No Matches Played Yet</h2>
            <p style={emptySubtitleStyle}>
              Create or join a room to start recording your game history.
            </p>
            <button onClick={() => navigate('/home')} style={startBtnStyle}>
              Go to Home
            </button>
          </div>
        ) : (
          <div style={listStyle}>
            {history.map((g) => (
              <div key={g.gameId} style={matchCardStyle}>
                <div style={matchTopRowStyle}>
                  <div>
                    <span style={roomTagStyle}>Room {g.roomCode}</span>
                    <div style={dateTextStyle}>
                      {new Date(g.playedAt).toLocaleString()}
                    </div>
                  </div>

                  <div style={rankBoxStyle(g.rank === 1)}>
                    <div style={{ fontSize: 19, fontWeight: 700, color: g.rank === 1 ? '#05160E' : '#ECFDF5', lineHeight: 1.1 }}>
                      #{g.rank}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: g.rank === 1 ? '#05160E' : '#86EFAC' }}>
                      of {g.totalPlayers}
                    </div>
                  </div>
                </div>

                <div style={matchBottomRowStyle}>
                  <div style={myScorePillStyle}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: '#ECFDF5' }}>
                      {g.myScore}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#86EFAC', marginLeft: 4 }}>
                      pts
                    </span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={topPlayersLabelStyle}>Top Scores:</div>
                    <div style={topPlayersListStyle}>
                      {g.topScores.map((s, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            background: PODIUM_BG[i] || '#103322',
                            border: '1px solid #1F6B46',
                            borderRadius: 8,
                            padding: '3px 9px',
                            color: '#ECFDF5',
                          }}
                        >
                          {PODIUM_LABELS[i] || `#${i + 1}`} - {s.username} ({s.points})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
                style={{
                  ...loadMoreBtnStyle,
                  background: loading ? '#143827' : '#22C55E',
                  color: loading ? '#86EFAC' : '#05160E',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            )}
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
  maxWidth: 660,
  margin: '32px auto',
  padding: '0 18px',
};

const loadingBoxStyle: React.CSSProperties = {
  padding: 32,
  textAlign: 'center',
  color: '#86EFAC',
  fontWeight: 600,
  background: '#0B2418',
  border: '2px solid #1F6B46',
  borderRadius: 14,
};

const emptyCardStyle: React.CSSProperties = {
  padding: '40px 28px',
  textAlign: 'center',
  background: '#0B2418',
  border: '2px solid #1F6B46',
  borderRadius: 16,
};

const emptyBadgeStyle: React.CSSProperties = {
  width: 52,
  height: 52,
  margin: '0 auto',
  borderRadius: 12,
  background: '#103322',
  border: '1.5px solid #22C55E',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const emptyTitleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: '#ECFDF5',
  margin: '14px 0 6px',
};

const emptySubtitleStyle: React.CSSProperties = {
  color: '#86EFAC',
  fontSize: 14,
  margin: '0 0 22px',
};

const startBtnStyle: React.CSSProperties = {
  background: '#22C55E',
  color: '#05160E',
  padding: '12px 24px',
  fontSize: 15,
  fontWeight: 700,
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const matchCardStyle: React.CSSProperties = {
  padding: 20,
  background: '#0B2418',
  border: '2px solid #1F6B46',
  borderRadius: 14,
};

const matchTopRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 14,
  gap: 12,
};

const roomTagStyle: React.CSSProperties = {
  display: 'inline-block',
  background: '#103322',
  border: '1px solid #22C55E',
  borderRadius: 8,
  padding: '3px 10px',
  fontSize: 13,
  fontWeight: 700,
  color: '#ECFDF5',
};

const dateTextStyle: React.CSSProperties = {
  color: '#86EFAC',
  fontSize: 13,
  marginTop: 6,
};

const rankBoxStyle = (isFirst: boolean) => ({
  background: isFirst ? '#22C55E' : '#103322',
  border: '1.5px solid #1F6B46',
  borderRadius: 10,
  padding: '6px 12px',
  textAlign: 'center' as const,
  minWidth: 56,
});

const matchBottomRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 14,
  alignItems: 'center',
  flexWrap: 'wrap',
  paddingTop: 12,
  borderTop: '1.5px dashed #1F6B46',
};

const myScorePillStyle: React.CSSProperties = {
  background: '#103322',
  border: '1.5px solid #22C55E',
  borderRadius: 10,
  padding: '6px 12px',
};

const topPlayersLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#86EFAC',
  marginBottom: 6,
};

const topPlayersListStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const loadMoreBtnStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 15,
  fontWeight: 700,
  width: '100%',
  marginTop: 4,
  borderRadius: 10,
  border: 'none',
};