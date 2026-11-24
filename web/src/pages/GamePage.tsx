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

      // Restore state on reconnect
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
        toast(`💡 Hint: ${data.hint}`, { duration: 3000 });
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
        toast.success(`🎉 Correct! +${data.points} points!`, { duration: 4000 });
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

  // ── Word Selection Phase ────────────────────────────────────────────────────
  if (phase === 'word-selection' && isArtist) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 40, maxWidth: 480, width: '100%', margin: 16, textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>Choose a Word to Draw!</h2>
          <p style={{ color: '#64748b', marginBottom: 32 }}>Round {round?.roundNumber} — You are the Artist</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {wordChoices.map(word => (
              <button key={word} onClick={() => { socketService.selectWord(round!.id, word); setPhase('drawing'); }} style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 12, padding: '18px', fontSize: 20, fontWeight: 700, color: '#1e293b', cursor: 'pointer', transition: 'all 0.2s' }}>
                {word}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'word-selection' && !isArtist) {
    const artist = players.find(p => p.userId === round?.artistId);
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 40, maxWidth: 400, width: '100%', margin: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>{artist?.username} is choosing a word...</h2>
          <p style={{ color: '#64748b' }}>Get ready to guess!</p>
        </div>
      </div>
    );
  }

  // ── Game End ───────────────────────────────────────────────────────────────
  if (phase === 'game-end' && gameEndData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 40, maxWidth: 480, width: '100%', margin: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 64 }}>🏆</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', margin: '16px 0 8px' }}>Game Over!</h2>
          <p style={{ color: '#6366f1', fontSize: 18, fontWeight: 700, marginBottom: 24 }}>🎉 {gameEndData.winner?.username} wins!</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {gameEndData.scores?.map((s: any, i: number) => (
              <div key={s.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: i === 0 ? '#fef3c7' : '#f8fafc', borderRadius: 10, border: i === 0 ? '1px solid #fbbf24' : 'none' }}>
                <span style={{ fontWeight: 600 }}>{i + 1}. {s.username}</span>
                <span style={{ fontWeight: 800, color: '#6366f1' }}>{s.totalPoints} pts</span>
              </div>
            ))}
          </div>
          <button onClick={() => { reset(); navigate('/home'); }} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            🏠 Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Round End ──────────────────────────────────────────────────────────────
  if (phase === 'round-end' && roundEndData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#1e293b' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 40, maxWidth: 480, width: '100%', margin: 16, textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>Round {round?.roundNumber} Over!</h2>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#6366f1', marginBottom: 20 }}>The word was: <span style={{ color: '#10b981' }}>{roundEndData.word}</span></div>
          <div style={{ marginBottom: 20, fontSize: 15, color: '#64748b' }}>
            {roundEndData.correctGuessers?.length} player(s) guessed correctly
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {scores.slice(0, 5).map((s, i) => (
              <div key={s.userId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', background: '#f8fafc', borderRadius: 8 }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>#{i + 1} {s.username}</span>
                <span style={{ fontWeight: 800, color: '#6366f1' }}>{s.totalPoints} pts</span>
              </div>
            ))}
          </div>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Next round starting in a few seconds...</p>
        </div>
      </div>
    );
  }

  // ── Main Game Screen ───────────────────────────────────────────────────────
  const timeLeft = round?.timeLeft ?? 60;
  const timerColor = timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f97316' : '#10b981';
  const artist = players.find(p => p.userId === round?.artistId);

  return (
    <div style={{ minHeight: '100vh', background: '#1e293b', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ background: '#0f172a', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Round {round?.roundNumber || 1} / {game?.totalRounds || 11}</div>

        {/* Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: timerColor, minWidth: 48, textAlign: 'center' }}>{timeLeft}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>seconds</div>
        </div>

        {/* Word hint */}
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, letterSpacing: 6, textAlign: 'center' }}>
          {isArtist ? <span style={{ color: '#fbbf24' }}>🎨 {round?.word}</span> : (round?.hint || '_ _ _ _ _')}
        </div>

        <div style={{ color: '#94a3b8', fontSize: 14 }}>
          {isArtist ? '✏️ Draw it!' : `🎨 ${artist?.username} is drawing`}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', gap: 16, padding: 16, flexWrap: 'wrap' }}>
        {/* Canvas */}
        <div style={{ flex: '1 1 500px' }}>
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

        {/* Right panel */}
        <div style={{ flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Scores */}
          <div style={{ background: '#0f172a', borderRadius: 12, padding: 14 }}>
            <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>SCORES</div>
            {scores.map((s, i) => (
              <div key={s.userId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e293b', fontSize: 13 }}>
                <span style={{ color: s.userId === user?.id ? '#a78bfa' : '#e2e8f0' }}>#{i + 1} {s.username}</span>
                <span style={{ color: '#6366f1', fontWeight: 700 }}>{s.totalPoints}</span>
              </div>
            ))}
          </div>

          {/* Chat / Guesses */}
          <div style={{ background: '#0f172a', borderRadius: 12, padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>GUESSES</div>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 10, maxHeight: 240, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {guessMessages.map((msg, i) => (
                <div key={i} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, background: msg.isCorrect ? '#065f46' : '#1e293b' }}>
                  <span style={{ color: msg.isCorrect ? '#34d399' : '#94a3b8', fontWeight: 600 }}>{msg.username}: </span>
                  <span style={{ color: msg.isCorrect ? '#d1fae5' : '#e2e8f0' }}>
                    {msg.isCorrect ? `✅ Guessed correctly! (+${msg.points} pts)` : msg.text}
                  </span>
                </div>
              ))}
            </div>

            {!isArtist && !hasGuessedCorrectly && (
              <form onSubmit={submitGuess} style={{ display: 'flex', gap: 6 }}>
                <input
                  value={guess}
                  onChange={e => setGuess(e.target.value)}
                  placeholder="Your guess..."
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#fff', fontSize: 13, outline: 'none' }}
                />
                <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>→</button>
              </form>
            )}
            {hasGuessedCorrectly && !isArtist && (
              <div style={{ background: '#065f46', borderRadius: 8, padding: '8px 12px', textAlign: 'center', color: '#34d399', fontWeight: 700, fontSize: 13 }}>🎉 You guessed it!</div>
            )}
            {isArtist && (
              <div style={{ background: '#1e3a5f', borderRadius: 8, padding: '8px 12px', textAlign: 'center', color: '#93c5fd', fontSize: 12 }}>You are the artist</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
