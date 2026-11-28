import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getUserHistory } from '../services/api';
import { GameHistory } from '../types';

const PODIUM_COLORS = ['#22C55E', '#E0F2FE', '#FFEDD5'];
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
      .then(d => {
        setHistory(prev => (page === 1 ? d.history : [...prev, ...d.history]));
        setHasMore(d.hasMore);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, page]);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 48 }}>
      {/* Sketchbook Top Navbar */}
      <header style={headerStyle}>
        <button onClick={() => navigate('/home')} className="sketch-btn" style={backBtnStyle}>
          ← Studio
        </button>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: '#ECFDF5', margin: 0 }}>
          Sketchbook Log
        </h1>
        <div style={{ width: 84 }} />
      </header>

      <main style={{ maxWidth: 660, margin: '32px auto', padding: '0 18px' }}>
        {loading && page === 1 ? (
          <div className="sketch-card" style={{ padding: 36, textAlign: 'center', color: '#86EFAC', fontWeight: 600 }}>
            Flipping through past pages...
          </div>
        ) : history.length === 0 ? (
          <div className="sketch-card" style={{ padding: '42px 28px', textAlign: 'center' }}>
            <div style={emptyBadgeStyle}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ECFDF5" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#ECFDF5', margin: '14px 0 6px' }}>
              No Sketches Logged Yet
            </h2>
            <p style={{ color: '#86EFAC', fontSize: 14, marginBottom: 22 }}>
              Start or join a table to fill your sketchbook with match results!
            </p>
            <button
              onClick={() => navigate('/home')}
              className="sketch-btn"
              style={{ background: '#34D399', color: '#ECFDF5', padding: '12px 26px', fontSize: 16 }}
            >
              Jump Into a Game →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {history.map(g => (
              <div key={g.gameId} className="sketch-card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="font-display" style={roomTagStyle}>
                        Room {g.roomCode}
                      </span>
                    </div>
                    <div style={{ color: '#86EFAC', fontSize: 13, marginTop: 6 }}>
                      {new Date(g.playedAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Rank Badge */}
                  <div style={rankBoxStyle(g.rank === 1)}>
                    <div className="font-display" style={{ fontSize: 20, fontWeight: 700, color: '#ECFDF5', lineHeight: 1.1 }}>
                      #{g.rank}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#44403C' }}>
                      of {g.totalPlayers}
                    </div>
                  </div>
                </div>

                {/* Score & Podium */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', paddingTop: 12, borderTop: '1.5px dashed #1F6B46' }}>
                  <div style={myScorePillStyle}>
                    <span className="font-display" style={{ fontSize: 18, fontWeight: 700, color: '#ECFDF5' }}>
                      {g.myScore}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#44403C', marginLeft: 4 }}>
                      pts
                    </span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#86EFAC', marginBottom: 6 }}>
                      Top Artists:
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {g.topScores.map((s, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            background: PODIUM_COLORS[i] || '#103322',
                            border: '1.5px solid #1F6B46',
                            borderRadius: 8,
                            padding: '3px 9px',
                            color: '#ECFDF5',
                          }}
                        >
                          {PODIUM_LABELS[i] || `#${i + 1}`} · {s.username} ({s.points})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={loading}
                className="sketch-btn"
                style={{
                  background: '#22C55E',
                  color: '#ECFDF5',
                  padding: '13px',
                  fontSize: 15,
                  width: '100%',
                  marginTop: 4,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Loading Older Pages...' : 'Load More Matches'}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const headerStyle: React.CSSProperties = {
  background: '#0B2418',
  borderBottom: '2.5px solid #1F6B46',
  padding: '14px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const backBtnStyle: React.CSSProperties = {
  background: '#22C55E',
  color: '#ECFDF5',
  padding: '8px 14px',
  fontSize: 14,
};

const emptyBadgeStyle: React.CSSProperties = {
  width: 60,
  height: 60,
  margin: '0 auto',
  borderRadius: 16,
  background: '#14452E',
  border: '2.5px solid #1F6B46',
  boxShadow: '3px 3px 0px #020A06',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transform: 'rotate(-4deg)',
};

const roomTagStyle: React.CSSProperties = {
  display: 'inline-block',
  background: '#E0F2FE',
  border: '1.5px solid #1F6B46',
  borderRadius: 8,
  padding: '3px 10px',
  fontSize: 14,
  fontWeight: 700,
  color: '#ECFDF5',
};

const rankBoxStyle = (isFirst: boolean): React.CSSProperties => ({
  background: isFirst ? '#22C55E' : '#103322',
  border: '2px solid #1F6B46',
  borderRadius: 12,
  padding: '6px 12px',
  textAlign: 'center',
  minWidth: 58,
});

const myScorePillStyle: React.CSSProperties = {
  background: '#DCFCE7',
  border: '2px solid #1F6B46',
  borderRadius: 10,
  padding: '6px 12px',
};