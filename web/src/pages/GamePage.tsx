import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import { socketService } from '../services/socket';
import { auth } from '../lib/firebase';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { StrokeData, GuessMessage } from '../types';
import toast from 'react-hot-toast';

export const GamePage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    round, game, players, scores, guessMessages, isArtist,
    setRound, setGame, setScores, setIsArtist, addGuessMessage,
    addStroke, setStrokes, clearStrokes, updateTimer, updateHint,
    setHasGuessedCorrectly, hasGuessedCorrectly, wordChoices, setWordChoices,
    reset,
  } = useGameStore();

  const [phase, setPhase] = useState<'word-selection' | 'drawing' | 'round-end' | 'game-end'>('drawing');
  const [guess, setGuess] = useState('');
  const [roundEndData, setRoundEndData] = useState<any>(null);
  const [gameEndData, setGameEndData] = useState<any>(null);
  const socketRef = useRef(false);

  useEffect(() => {
    if (!user || !code || socketRef.current) return;
    socketRef.current = true;

    const connectAndSubscribe = async () => {
      const fbUser = auth.currentUser;
      if (!fbUser) { navigate('/login'); return; }
      const token = await fbUser.getIdToken();
      socketService.connect(token);

      socketService.requestState(code!);

      socketService.on('state:restored', (state: any) => {
        if (state.game) setGame(state.game);
        if (state.round) {
          setRound(state.round);
          setStrokes(state.round.strokes || []);
          setIsArtist(state.round.artistId === user.id);
          if (state.round.status === 'WORD_SELECTION' && state.round.artistId === user.id) {
            setWordChoices(state.round.wordChoices || []);
            setPhase('word-selection');
          } else if (state.round.status === 'IN_PROGRESS') {
            setPhase('drawing');
          }
        }
        if (state.game?.scores) setScores(state.game.scores);
      });

      socketService.on('round:started', (data: any) => {
        setRound({ id: data.roundId, roundNumber: data.roundNumber, artistId: data.artistId, status: 'WORD_SELECTION', timeLeft: 30, hint: '', correctGuessers: [], strokes: [] });
        clearStrokes();
        setIsArtist(data.artistId === user.id);
        setHasGuessedCorrectly(false);
        setGame((prev: any) => prev ? { ...prev, currentRound: data.roundNumber, totalRounds: data.totalRounds } : prev);
        if (data.scores) setScores(data.scores);
      });

      socketService.on('round:word-choices', (data: any) => {
        setWordChoices(data.words);
        setPhase('word-selection');
      });

      socketService.on('round:drawing-start', (data: any) => {
        setRound((prev: any) => prev ? { ...prev, hint: data.hint, timeLeft: data.timeLeft, status: 'IN_PROGRESS' } : prev);
        setPhase('drawing');
      });

      socketService.on('round:word', (data: any) => {
        setRound((prev: any) => prev ? { ...prev, word: data.word } : prev);
      });

      socketService.on('round:timer', (data: any) => {
        updateTimer(data.timeLeft);
      });

      socketService.on('round:hint', (data: any) => {
        updateHint(data.hint);
        toast(`Letter clue revealed: ${data.hint}`, { duration: 3000 });
      });

      socketService.on('round:end', (data: any) => {
        setRoundEndData(data);
        setPhase('round-end');
        if (data.scores) setScores(data.scores);
        setTimeout(() => {
          if (!data.nextRound) return;
          setPhase('drawing');
          setRoundEndData(null);
        }, 5000);
      });

      socketService.on('game:end', (data: any) => {
        setGameEndData(data);
        setPhase('game-end');
      });

      socketService.on('draw:stroke', (data: any) => {
        if (!isArtist) addStroke(data.stroke);
      });

      socketService.on('draw:undo', (data: any) => {
        setStrokes(data.strokes);
      });

      socketService.on('draw:redo', (data: any) => {
        setStrokes(data.strokes);
      });

      socketService.on('draw:clear', () => clearStrokes());

      socketService.on('guess:result', (data: any) => {
        const msg: GuessMessage = {
          userId: data.userId,
          username: data.username,
          text: data.text,
          isCorrect: data.isCorrect,
          rank: data.rank,
          points: data.points,
          timestamp: Date.now(),
        };
        addGuessMessage(msg);
      });

      socketService.on('guess:correct', (data: any) => {
        setHasGuessedCorrectly(true);
        toast.success(`Spot on! +${data.points} points!`, { duration: 4000 });
      });

      socketService.on('scores:updated', (data: any) => {
        setScores(data.scores);
      });

      socketService.on('error', (data: any) => {
        toast.error(data.message);
      });
    };

    connectAndSubscribe();

    return () => {
      ['state:restored','round:started','round:word-choices','round:drawing-start','round:word',
       'round:timer','round:hint','round:end','game:end','draw:stroke','draw:undo','draw:redo',
       'draw:clear','guess:result','guess:correct','scores:updated','error'].forEach(e => socketService.off(e));
    };
  }, [code, user]);

  const handleStroke = useCallback((stroke: StrokeData) => {
    addStroke(stroke);
    if (round) socketService.drawStroke(round.id, stroke);
  }, [round]);

  const handleUndo = () => { if (round) socketService.undoStroke(round.id); };
  const handleRedo = () => { if (round) socketService.redoStroke(round.id); };
  const handleClear = () => { if (round) socketService.clearCanvas(round.id); };

  const submitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !round || hasGuessedCorrectly || isArtist) return;
    socketService.submitGuess(round.id, guess.trim());
    setGuess('');
  };

  // ── Word Selection Phase (Artist) ───────────────────────────────────────────
  if (phase === 'word-selection' && isArtist) {
    return (
      <div style={centeredScreenStyle}>
        <div className="sketch-card" style={{ padding: 36, maxWidth: 460, width: '100%', textAlign: 'center', position: 'relative' }}>
          <div style={stickyBadgeStyle('#22C55E')} className="font-hand">
            Round {round?.roundNumber || 1} — Your Turn!
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1C1917', marginTop: 10, marginBottom: 6 }}>
            Pick a Word to Sketch
          </h2>
          <p style={{ color: '#57534E', fontSize: 14, marginBottom: 26 }}>
            Choose one prompt below to start drawing
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {wordChoices.map((word, idx) => {
              const cardColors = ['#14452E', '#E0F2FE', '#FFE4E6'];
              return (
                <button
                  key={word}
                  onClick={() => { socketService.selectWord(round!.id, word); setPhase('drawing'); }}
                  className="sketch-btn"
                  style={{
                    background: cardColors[idx % cardColors.length],
                    color: '#1C1917',
                    padding: '16px',
                    fontSize: 20,
                    letterSpacing: 0.5,
                  }}
                >
                  {word}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Word Selection Phase (Guessers) ─────────────────────────────────────────
  if (phase === 'word-selection' && !isArtist) {
    const artist = players.find(p => p.userId === round?.artistId);
    return (
      <div style={centeredScreenStyle}>
        <div className="sketch-card" style={{ padding: 36, maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ ...roundIconBadgeStyle('#10B981'), margin: '0 auto 16px', animation: 'wiggle 1.2s ease-in-out infinite' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </div>
          <h2 style={{ fontSize: 23, fontWeight: 700, color: '#1C1917', marginBottom: 6 }}>
            {artist?.username || 'The artist'} is picking a word...
          </h2>
          <p style={{ color: '#57534E', fontSize: 14 }}>
            Keep your eyes on the sketchpad!
          </p>
        </div>
      </div>
    );
  }

  // ── Game End ────────────────────────────────────────────────────────────────
  if (phase === 'game-end' && gameEndData) {
    return (
      <div style={centeredScreenStyle}>
        <div className="sketch-card" style={{ padding: 36, maxWidth: 480, width: '100%', textAlign: 'center', position: 'relative' }}>
          <div style={stickyBadgeStyle('#34D399')} className="font-hand">
            Final Standings
          </div>
          <div style={{ ...roundIconBadgeStyle('#22C55E'), margin: '8px auto 14px' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>
          <h2 style={{ fontSize: 30, fontWeight: 700, color: '#1C1917', marginBottom: 4 }}>
            Match Complete!
          </h2>
          <p style={{ color: '#E11D48', fontSize: 18, fontWeight: 700, marginBottom: 22 }}>
            {gameEndData.winner?.username} takes the crown!
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {gameEndData.scores?.map((s: any, i: number) => (
              <div
                key={s.userId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 16px',
                  background: i === 0 ? '#14452E' : '#0B2418',
                  borderRadius: 12,
                  border: '2px solid #1C1917',
                }}
              >
                <span style={{ fontWeight: 700, color: '#1C1917' }}>#{i + 1} {s.username}</span>
                <span className="font-display" style={{ fontWeight: 700, color: '#1C1917' }}>{s.totalPoints} pts</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => { reset(); navigate('/home'); }}
            className="sketch-btn"
            style={{ background: '#22C55E', color: '#1C1917', padding: '14px 32px', fontSize: 16 }}
          >
            Back to Studio
          </button>
        </div>
      </div>
    );
  }

  // ── Round End ───────────────────────────────────────────────────────────────
  if (phase === 'round-end' && roundEndData) {
    return (
      <div style={centeredScreenStyle}>
        <div className="sketch-card" style={{ padding: 36, maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <span className="font-hand" style={{ fontSize: 22, fontWeight: 700, color: '#57534E' }}>
            Round {round?.roundNumber} Wrap-Up
          </span>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1C1917', margin: '6px 0 14px' }}>
            The sketch was{' '}
            <span style={{ display: 'inline-block', background: '#34D399', border: '2px solid #1C1917', borderRadius: 10, padding: '2px 12px', transform: 'rotate(-1.5deg)' }}>
              {roundEndData.word}
            </span>
          </h2>
          <div style={{ marginBottom: 18, fontSize: 14, fontWeight: 600, color: '#57534E' }}>
            {roundEndData.correctGuessers?.length || 0} player(s) nailed it
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {scores.slice(0, 5).map((s, i) => (
              <div key={s.userId} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', background: '#0B2418', border: '1.5px solid #1C1917', borderRadius: 10 }}>
                <span style={{ fontWeight: 700, color: '#1C1917' }}>#{i + 1} {s.username}</span>
                <span className="font-display" style={{ fontWeight: 700, color: '#1C1917' }}>{s.totalPoints} pts</span>
              </div>
            ))}
          </div>
          <p className="font-hand" style={{ color: '#57534E', fontSize: 19, fontWeight: 700 }}>
            Flipping to the next page...
          </p>
        </div>
      </div>
    );
  }

  // ── Main Gameplay Screen ────────────────────────────────────────────────────
  const timeLeft = round?.timeLeft ?? 60;
  const timerBg = timeLeft <= 10 ? '#FB7185' : timeLeft <= 20 ? '#22C55E' : '#34D399';
  const artist = players.find(p => p.userId === round?.artistId);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sketchbook Top HUD Bar */}
      <header style={hudBarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={roundPillStyle} className="font-display">
            Round {round?.roundNumber || 1} / {game?.totalRounds || 11}
          </span>
        </div>

        {/* Countdown Clock Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={timerBadgeStyle(timerBg)} className="font-display">
            {timeLeft}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#57534E', textTransform: 'uppercase' }}>sec</span>
        </div>

        {/* Secret Word / Clue Box */}
        <div style={wordClueBoxStyle} className="font-display">
          {isArtist ? (
            <span>Draw: <strong>{round?.word}</strong></span>
          ) : (
            <span style={{ letterSpacing: 5 }}>{round?.hint || '_ _ _ _ _'}</span>
          )}
        </div>

        {/* Artist Role Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700, color: '#1C1917' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
          <span>{isArtist ? 'You are sketching' : `${artist?.username || 'Artist'} is sketching`}</span>
        </div>
      </header>

      {/* Arena Body */}
      <div style={{ flex: 1, maxWidth: 1120, width: '100%', margin: '0 auto', display: 'flex', gap: 18, padding: 18, flexWrap: 'wrap' }}>
        {/* Left: Sketchpad */}
        <div style={{ flex: '1 1 540px' }}>
          <DrawingCanvas
            isArtist={isArtist}
            strokes={round?.strokes || []}
            onStroke={handleStroke}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClear}
            width={700}
            height={500}
          />
        </div>

        {/* Right: Scoreboard + Guesses */}
        <div style={{ flex: '1 1 280px', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Scoreboard */}
          <div className="sketch-card" style={{ padding: 16, background: '#0B2418' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: '1.5px dashed #D6D3D1' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" fill="#22C55E" />
              </svg>
              <span className="font-display" style={{ fontSize: 15, fontWeight: 700, color: '#1C1917' }}>Scoreboard</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {scores.map((s, i) => (
                <div
                  key={s.userId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 10px',
                    borderRadius: 9,
                    background: s.userId === user?.id ? '#14452E' : 'transparent',
                    border: s.userId === user?.id ? '1.5px solid #1C1917' : '1.5px solid transparent',
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#1C1917' }}>
                    #{i + 1} {s.username}
                  </span>
                  <span className="font-display" style={{ fontWeight: 700, color: '#1C1917' }}>
                    {s.totalPoints}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Guess Feed */}
          <div className="sketch-card" style={{ padding: 16, background: '#0B2418', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: '1.5px dashed #D6D3D1' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="font-display" style={{ fontSize: 15, fontWeight: 700, color: '#1C1917' }}>Live Guesses</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, maxHeight: 260, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {guessMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 13,
                    padding: '6px 10px',
                    borderRadius: 9,
                    background: msg.isCorrect ? '#DCFCE7' : '#F5F5F4',
                    border: msg.isCorrect ? '1.5px solid #1C1917' : '1px solid #E7E5E4',
                  }}
                >
                  <span style={{ color: '#1C1917', fontWeight: 700 }}>{msg.username}: </span>
                  <span style={{ color: msg.isCorrect ? '#166534' : '#44403C', fontWeight: msg.isCorrect ? 700 : 500 }}>
                    {msg.isCorrect ? `Guessed it! (+${msg.points} pts)` : msg.text}
                  </span>
                </div>
              ))}
            </div>

            {!isArtist && !hasGuessedCorrectly && (
              <form onSubmit={submitGuess} style={{ display: 'flex', gap: 8 }}>
                <input
                  value={guess}
                  onChange={e => setGuess(e.target.value)}
                  placeholder="Type your guess..."
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '2px solid #1C1917',
                    background: '#0E2E1F',
                    color: '#1C1917',
                    fontSize: 14,
                    fontWeight: 500,
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  className="sketch-btn"
                  style={{ background: '#34D399', color: '#1C1917', padding: '8px 14px', fontSize: 15 }}
                >
                  →
                </button>
              </form>
            )}

            {hasGuessedCorrectly && !isArtist && (
              <div style={{ background: '#DCFCE7', border: '2px solid #1C1917', borderRadius: 10, padding: '10px 12px', textAlign: 'center', color: '#166534', fontWeight: 700, fontSize: 14 }}>
                Nailed it! Waiting for others...
              </div>
            )}

            {isArtist && (
              <div style={{ background: '#14452E', border: '2px solid #1C1917', borderRadius: 10, padding: '10px 12px', textAlign: 'center', color: '#1C1917', fontWeight: 700, fontSize: 13 }}>
                You're the artist — no hints in chat!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const centeredScreenStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: 18,
};

const stickyBadgeStyle = (bg: string): React.CSSProperties => ({
  position: 'absolute',
  top: -14,
  left: '50%',
  transform: 'translateX(-50%) rotate(-2deg)',
  background: bg,
  border: '2px solid #1C1917',
  borderRadius: 8,
  padding: '2px 14px',
  fontSize: 18,
  fontWeight: 700,
  color: '#1C1917',
  boxShadow: '2px 2px 0px #1C1917',
  whiteSpace: 'nowrap',
});

const roundIconBadgeStyle = (bg: string): React.CSSProperties => ({
  width: 58,
  height: 58,
  borderRadius: 16,
  background: bg,
  border: '2.5px solid #1C1917',
  boxShadow: '3px 3px 0px #1C1917',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const hudBarStyle: React.CSSProperties = {
  background: '#0B2418',
  borderBottom: '2.5px solid #1C1917',
  padding: '12px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 14,
  flexWrap: 'wrap',
};

const roundPillStyle: React.CSSProperties = {
  background: '#E0F2FE',
  border: '2px solid #1C1917',
  borderRadius: 10,
  padding: '5px 12px',
  fontSize: 14,
  fontWeight: 700,
  color: '#1C1917',
};

const timerBadgeStyle = (bg: string): React.CSSProperties => ({
  background: bg,
  border: '2px solid #1C1917',
  boxShadow: '2px 2px 0px #1C1917',
  borderRadius: 12,
  minWidth: 46,
  padding: '4px 10px',
  fontSize: 22,
  fontWeight: 700,
  color: '#1C1917',
  textAlign: 'center',
});

const wordClueBoxStyle: React.CSSProperties = {
  background: '#22C55E',
  border: '2px solid #1C1917',
  boxShadow: '2px 2px 0px #1C1917',
  borderRadius: 12,
  padding: '6px 18px',
  fontSize: 19,
  fontWeight: 700,
  color: '#1C1917',
  textAlign: 'center',
};