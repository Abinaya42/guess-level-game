import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import { socketService } from '../services/socket';
import { auth } from '../lib/firebase';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { StrokeData, GuessMessage } from '../types';
import toast from 'react-hot-toast';

const WORD_CARD_BG = ['#14452E', '#103322', '#0D291C'];

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
      if (!fbUser) {
        navigate('/login');
        return;
      }
      const token = await fbUser.getIdToken();
      socketService.connect(token);

      socketService.requestState(code);

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
        setRound({
          id: data.roundId,
          roundNumber: data.roundNumber,
          artistId: data.artistId,
          status: 'WORD_SELECTION',
          timeLeft: 30,
          hint: '',
          correctGuessers: [],
          strokes: [],
        });
        clearStrokes();
        setIsArtist(data.artistId === user.id);
        setHasGuessedCorrectly(false);
        setGame((prev: any) => (prev ? { ...prev, currentRound: data.roundNumber, totalRounds: data.totalRounds } : prev));
        if (data.scores) setScores(data.scores);
      });

      socketService.on('round:word-choices', (data: any) => {
        setWordChoices(data.words);
        setPhase('word-selection');
      });

      socketService.on('round:drawing-start', (data: any) => {
        setRound((prev: any) => (prev ? { ...prev, hint: data.hint, timeLeft: data.timeLeft, status: 'IN_PROGRESS' } : prev));
        setPhase('drawing');
      });

      socketService.on('round:word', (data: any) => {
        setRound((prev: any) => (prev ? { ...prev, word: data.word } : prev));
      });

      socketService.on('round:timer', (data: any) => {
        updateTimer(data.timeLeft);
      });

      socketService.on('round:hint', (data: any) => {
        updateHint(data.hint);
        toast(`Hint: ${data.hint}`, { duration: 3000 });
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
        toast.success(`Correct! +${data.points} points`, { duration: 4000 });
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
      [
        'state:restored', 'round:started', 'round:word-choices', 'round:drawing-start', 'round:word',
        'round:timer', 'round:hint', 'round:end', 'game:end', 'draw:stroke', 'draw:undo', 'draw:redo',
        'draw:clear', 'guess:result', 'guess:correct', 'scores:updated', 'error',
      ].forEach((e) => socketService.off(e));
    };
  }, [code, user]);

  const handleStroke = useCallback((stroke: StrokeData) => {
    addStroke(stroke);
    if (round) socketService.drawStroke(round.id, stroke);
  }, [round]);

  const handleUndo = () => {
    if (round) socketService.undoStroke(round.id);
  };

  const handleRedo = () => {
    if (round) socketService.redoStroke(round.id);
  };

  const handleClear = () => {
    if (round) socketService.clearCanvas(round.id);
  };

  const submitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !round || hasGuessedCorrectly || isArtist) return;
    socketService.submitGuess(round.id, guess.trim());
    setGuess('');
  };

  if (phase === 'word-selection' && isArtist) {
    return (
      <div style={centeredScreenStyle}>
        <div style={modalCardStyle}>
          <div style={roundTagStyle}>
            Round {round?.roundNumber || 1}
          </div>
          <h2 style={modalTitleStyle}>Choose a Word</h2>
          <p style={modalSubtitleStyle}>
            Pick a word to start drawing
          </p>
          <div style={wordChoicesListStyle}>
            {wordChoices.map((word, idx) => (
              <button
                key={word}
                onClick={() => {
                  socketService.selectWord(round!.id, word);
                  setPhase('drawing');
                }}
                style={{
                  background: WORD_CARD_BG[idx % WORD_CARD_BG.length],
                  color: '#ECFDF5',
                  padding: '15px 18px',
                  fontSize: 19,
                  fontWeight: 700,
                  borderRadius: 12,
                  border: '2px solid #22C55E',
                  cursor: 'pointer',
                }}
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'word-selection' && !isArtist) {
    const artist = players.find((p) => p.userId === round?.artistId);
    return (
      <div style={centeredScreenStyle}>
        <div style={modalCardStyle}>
          <div style={iconBadgeStyle}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#ECFDF5', marginBottom: 6 }}>
            {artist?.username || 'Artist'} is choosing a word...
          </h2>
          <p style={{ color: '#86EFAC', fontSize: 14, margin: 0 }}>
            Get ready to guess.
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'game-end' && gameEndData) {
    return (
      <div style={centeredScreenStyle}>
        <div style={modalCardStyle}>
          <div style={roundTagStyle}>Final Scores</div>
          <div style={iconBadgeStyle}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#ECFDF5', margin: '0 0 6px' }}>
            Game Over
          </h2>
          <p style={{ color: '#4ADE80', fontSize: 17, fontWeight: 700, margin: '0 0 20px' }}>
            Winner: {gameEndData.winner?.username}
          </p>
          <div style={scoreListStyle}>
            {gameEndData.scores?.map((s: any, i: number) => (
              <div
                key={s.userId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: i === 0 ? '#14452E' : '#081D13',
                  borderRadius: 10,
                  border: '1.5px solid #1F6B46',
                }}
              >
                <span style={{ fontWeight: 700, color: '#ECFDF5' }}>#{i + 1} {s.username}</span>
                <span style={{ fontWeight: 700, color: '#4ADE80' }}>{s.totalPoints} pts</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              reset();
              navigate('/home');
            }}
            style={primaryBtnStyle}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'round-end' && roundEndData) {
    return (
      <div style={centeredScreenStyle}>
        <div style={modalCardStyle}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#86EFAC' }}>
            Round {round?.roundNumber} Ended
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#ECFDF5', margin: '10px 0 14px' }}>
            Word:{' '}
            <span style={revealedWordStyle}>
              {roundEndData.word}
            </span>
          </h2>
          <div style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, color: '#86EFAC' }}>
            {roundEndData.correctGuessers?.length || 0} player(s) guessed correctly
          </div>
          <div style={scoreListStyle}>
            {scores.slice(0, 5).map((s, i) => (
              <div
                key={s.userId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '9px 14px',
                  background: '#081D13',
                  border: '1.5px solid #1F6B46',
                  borderRadius: 10,
                }}
              >
                <span style={{ fontWeight: 700, color: '#ECFDF5' }}>#{i + 1} {s.username}</span>
                <span style={{ fontWeight: 700, color: '#4ADE80' }}>{s.totalPoints} pts</span>
              </div>
            ))}
          </div>
          <p style={{ color: '#86EFAC', fontSize: 14, fontWeight: 600, margin: 0 }}>
            Starting next round...
          </p>
        </div>
      </div>
    );
  }

  const timeLeft = round?.timeLeft ?? 60;
  const timerBg = timeLeft <= 10 ? '#14532D' : timeLeft <= 20 ? '#15803D' : '#22C55E';
  const artist = players.find((p) => p.userId === round?.artistId);

  return (
    <div style={gameShellStyle}>
      <header style={hudBarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={roundPillStyle}>
            Round {round?.roundNumber || 1} / {game?.totalRounds || 11}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={timerBadgeStyle(timerBg, timeLeft > 20)}>
            {timeLeft}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#86EFAC', textTransform: 'uppercase' }}>
            sec
          </span>
        </div>

        <div style={wordClueBoxStyle}>
          {isArtist ? (
            <span>Word: <strong>{round?.word}</strong></span>
          ) : (
            <span style={{ letterSpacing: 4 }}>{round?.hint || '_ _ _ _ _'}</span>
          )}
        </div>

        <div style={artistRoleStyle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
          <span>{isArtist ? 'Your turn to draw' : `${artist?.username || 'Artist'} is drawing`}</span>
        </div>
      </header>

      <div style={arenaBodyStyle}>
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

        <div style={sidebarStyle}>
          <div style={sideCardStyle}>
            <div style={sideHeaderStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#ECFDF5' }}>Scores</span>
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
                    borderRadius: 8,
                    background: s.userId === user?.id ? '#14452E' : 'transparent',
                    border: s.userId === user?.id ? '1.5px solid #22C55E' : '1.5px solid transparent',
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#ECFDF5' }}>
                    #{i + 1} {s.username}
                  </span>
                  <span style={{ fontWeight: 700, color: '#4ADE80' }}>
                    {s.totalPoints}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...sideCardStyle, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={sideHeaderStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#ECFDF5' }}>Guesses</span>
            </div>

            <div style={guessFeedStyle}>
              {guessMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 13,
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: msg.isCorrect ? '#14532D' : '#081D13',
                    border: msg.isCorrect ? '1.5px solid #22C55E' : '1px solid #1F6B46',
                  }}
                >
                  <span style={{ color: '#ECFDF5', fontWeight: 700 }}>{msg.username}: </span>
                  <span style={{ color: msg.isCorrect ? '#86EFAC' : '#D1FAE5', fontWeight: msg.isCorrect ? 700 : 500 }}>
                    {msg.isCorrect ? `Guessed it (+${msg.points} pts)` : msg.text}
                  </span>
                </div>
              ))}
            </div>

            {!isArtist && !hasGuessedCorrectly && (
              <form onSubmit={submitGuess} style={{ display: 'flex', gap: 8 }}>
                <input
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Type your guess..."
                  style={guessInputStyle}
                />
                <button type="submit" style={sendBtnStyle}>
                  Send
                </button>
              </form>
            )}

            {hasGuessedCorrectly && !isArtist && (
              <div style={guessedBannerStyle}>
                Correct guess. Waiting for round end...
              </div>
            )}

            {isArtist && (
              <div style={artistBannerStyle}>
                You are drawing this round.
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
  background: '#05160E',
};

const modalCardStyle: React.CSSProperties = {
  padding: 32,
  maxWidth: 460,
  width: '100%',
  textAlign: 'center',
  background: '#0B2418',
  border: '2px solid #1F6B46',
  borderRadius: 16,
};

const roundTagStyle: React.CSSProperties = {
  display: 'inline-block',
  background: '#103322',
  border: '1.5px solid #22C55E',
  borderRadius: 8,
  padding: '3px 12px',
  fontSize: 13,
  fontWeight: 700,
  color: '#86EFAC',
  marginBottom: 10,
};

const modalTitleStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 700,
  color: '#ECFDF5',
  margin: '4px 0 6px',
};

const modalSubtitleStyle: React.CSSProperties = {
  color: '#86EFAC',
  fontSize: 14,
  margin: '0 0 22px',
};

const wordChoicesListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const iconBadgeStyle: React.CSSProperties = {
  width: 54,
  height: 54,
  margin: '0 auto 14px',
  borderRadius: 12,
  background: '#103322',
  border: '1.5px solid #22C55E',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const scoreListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginBottom: 20,
};

const primaryBtnStyle: React.CSSProperties = {
  background: '#22C55E',
  color: '#05160E',
  padding: '13px 28px',
  fontSize: 15,
  fontWeight: 700,
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
  width: '100%',
};

const revealedWordStyle: React.CSSProperties = {
  display: 'inline-block',
  background: '#14452E',
  border: '1.5px solid #22C55E',
  borderRadius: 8,
  padding: '2px 12px',
  color: '#4ADE80',
};

const gameShellStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: '#05160E',
};

const hudBarStyle: React.CSSProperties = {
  background: '#0B2418',
  borderBottom: '2px solid #1F6B46',
  padding: '12px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 14,
  flexWrap: 'wrap',
};

const roundPillStyle: React.CSSProperties = {
  background: '#103322',
  border: '1.5px solid #22C55E',
  borderRadius: 8,
  padding: '5px 12px',
  fontSize: 14,
  fontWeight: 700,
  color: '#ECFDF5',
};

const timerBadgeStyle = (bg: string, darkText: boolean) => ({
  background: bg,
  border: '1.5px solid #22C55E',
  borderRadius: 10,
  minWidth: 44,
  padding: '4px 10px',
  fontSize: 20,
  fontWeight: 700,
  color: darkText ? '#05160E' : '#ECFDF5',
  textAlign: 'center' as const,
});

const wordClueBoxStyle: React.CSSProperties = {
  background: '#103322',
  border: '1.5px solid #22C55E',
  borderRadius: 10,
  padding: '6px 18px',
  fontSize: 18,
  fontWeight: 700,
  color: '#ECFDF5',
  textAlign: 'center',
};

const artistRoleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  fontSize: 14,
  fontWeight: 700,
  color: '#ECFDF5',
};

const arenaBodyStyle: React.CSSProperties = {
  flex: 1,
  maxWidth: 1120,
  width: '100%',
  margin: '0 auto',
  display: 'flex',
  gap: 18,
  padding: 18,
  flexWrap: 'wrap',
};

const sidebarStyle: React.CSSProperties = {
  flex: '1 1 280px',
  maxWidth: 340,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const sideCardStyle: React.CSSProperties = {
  padding: 16,
  background: '#0B2418',
  border: '2px solid #1F6B46',
  borderRadius: 14,
};

const sideHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 10,
  paddingBottom: 8,
  borderBottom: '1.5px dashed #1F6B46',
};

const guessFeedStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  marginBottom: 12,
  maxHeight: 260,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const guessInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 12px',
  borderRadius: 10,
  border: '1.5px solid #1F6B46',
  background: '#081D13',
  color: '#ECFDF5',
  fontSize: 14,
  fontWeight: 500,
  outline: 'none',
};

const sendBtnStyle: React.CSSProperties = {
  background: '#22C55E',
  color: '#05160E',
  padding: '8px 14px',
  fontSize: 14,
  fontWeight: 700,
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
};

const guessedBannerStyle: React.CSSProperties = {
  background: '#14532D',
  border: '1.5px solid #22C55E',
  borderRadius: 10,
  padding: '10px 12px',
  textAlign: 'center',
  color: '#ECFDF5',
  fontWeight: 700,
  fontSize: 13,
};

const artistBannerStyle: React.CSSProperties = {
  background: '#103322',
  border: '1.5px solid #1F6B46',
  borderRadius: 10,
  padding: '10px 12px',
  textAlign: 'center',
  color: '#86EFAC',
  fontWeight: 700,
  fontSize: 13,
};