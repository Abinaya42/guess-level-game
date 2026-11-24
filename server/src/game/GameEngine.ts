import { v4 as uuidv4 } from 'uuid';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import {
  RoomState,
  GameState,
  RoundState,
  Player,
  StrokeData,
  GuessResult,
  ScoreUpdate,
} from '../types/index';
import {
  getRandomWords,
  generateRoomCode,
  normalizeGuess,
  maskWord,
  getRevealIndices,
} from './wordList';

const ROUND_DURATION = 60; // seconds
const FIRST_HINT_AT = 30; // seconds elapsed
const SECOND_HINT_AT = 45; // seconds elapsed
const WORD_SELECTION_TIMEOUT = 30; // seconds
const ROUND_END_PAUSE = 5; // seconds before next round

export class GameEngine {
  private rooms: Map<string, RoomState> = new Map();
  private games: Map<string, GameState> = new Map(); // gameId -> GameState
  private roomToGame: Map<string, string> = new Map(); // roomCode -> gameId
  private roundTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private roundIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private io: SocketIOServer;
  private prisma: PrismaClient;

  constructor(io: SocketIOServer, prisma: PrismaClient) {
    this.io = io;
    this.prisma = prisma;
  }

  // ─── Room Management ───────────────────────────────────────────────────────

  async createRoom(userId: string, username: string, socketId: string): Promise<{ room: RoomState; dbRoom: any }> {
    // Generate unique room code
    let code = generateRoomCode();
    while (this.rooms.has(code)) {
      code = generateRoomCode();
    }

    const player: Player = {
      userId,
      username,
      isReady: false,
      isConnected: true,
      socketId,
      isHost: true,
    };

    const players = new Map<string, Player>();
    players.set(userId, player);

    const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/join/${code}`;

    const roomState: RoomState = {
      id: uuidv4(),
      code,
      hostId: userId,
      players,
      status: 'WAITING',
      createdAt: new Date(),
    };

    this.rooms.set(code, roomState);

    // Persist to DB
    const dbRoom = await this.prisma.room.create({
      data: {
        id: roomState.id,
        code,
        hostId: userId,
        status: 'WAITING',
        maxPlayers: 11,
        inviteLink,
        players: {
          create: { userId, isReady: false },
        },
      },
      include: { players: { include: { user: true } }, host: true },
    });

    return { room: roomState, dbRoom };
  }

  async joinRoom(
    code: string,
    userId: string,
    username: string,
    socketId: string
  ): Promise<{ success: boolean; error?: string; room?: RoomState }> {
    const room = this.rooms.get(code);

    if (!room) {
      // Try loading from DB
      const dbRoom = await this.prisma.room.findUnique({
        where: { code },
        include: { players: { include: { user: true } }, game: true },
      });
      if (!dbRoom) return { success: false, error: 'Room not found.' };
      if (dbRoom.status !== 'WAITING') return { success: false, error: 'Game already in progress.' };
    } else {
      if (room.status !== 'WAITING') return { success: false, error: 'Game already in progress.' };
      if (room.players.size >= 11) return { success: false, error: 'Room is full (max 11 players).' };
    }

    const r = room || this.rooms.get(code)!;

    if (r && r.players.has(userId)) {
      // Reconnecting player
      const player = r.players.get(userId)!;
      player.isConnected = true;
      player.socketId = socketId;
      return { success: true, room: r };
    }

    const player: Player = {
      userId,
      username,
      isReady: false,
      isConnected: true,
      socketId,
      isHost: false,
    };

    if (r) {
      r.players.set(userId, player);

      // Persist to DB
      await this.prisma.roomPlayer.upsert({
        where: { roomId_userId: { roomId: r.id, userId } },
        create: { roomId: r.id, userId, isReady: false },
        update: {},
      });

      return { success: true, room: r };
    }

    return { success: false, error: 'Room not found.' };
  }

  async leaveRoom(code: string, userId: string): Promise<{ room?: RoomState; hostChanged: boolean; newHostId?: string }> {
    const room = this.rooms.get(code);
    if (!room) return { hostChanged: false };

    room.players.delete(userId);

    let hostChanged = false;
    let newHostId: string | undefined;

    if (room.players.size === 0) {
      this.rooms.delete(code);
      await this.prisma.room.update({ where: { code }, data: { status: 'FINISHED' } });
    } else {
      if (room.hostId === userId) {
        // Transfer host to next player
        const nextPlayer = room.players.values().next().value as Player;
        room.hostId = nextPlayer.userId;
        nextPlayer.isHost = true;
        hostChanged = true;
        newHostId = nextPlayer.userId;

        await this.prisma.room.update({ where: { code }, data: { hostId: newHostId } });
      }

      await this.prisma.roomPlayer.deleteMany({ where: { roomId: room.id, userId } });
    }

    return { room, hostChanged, newHostId };
  }

  async setReady(code: string, userId: string, ready: boolean): Promise<RoomState | null> {
    const room = this.rooms.get(code);
    if (!room) return null;

    const player = room.players.get(userId);
    if (!player) return null;

    player.isReady = ready;

    await this.prisma.roomPlayer.update({
      where: { roomId_userId: { roomId: room.id, userId } },
      data: { isReady: ready },
    });

    return room;
  }

  getRoomState(code: string): RoomState | undefined {
    return this.rooms.get(code);
  }

  // ─── Game Flow ─────────────────────────────────────────────────────────────

  async startGame(code: string, hostId: string): Promise<{ success: boolean; error?: string; gameId?: string }> {
    const room = this.rooms.get(code);
    if (!room) return { success: false, error: 'Room not found.' };
    if (room.hostId !== hostId) return { success: false, error: 'Only the host can start the game.' };
    if (room.players.size < 2) return { success: false, error: 'Need at least 2 players to start.' };

    const allReady = [...room.players.values()].every(p => p.userId === hostId || p.isReady);
    if (!allReady) return { success: false, error: 'All players must be ready before starting.' };

    // Create game in DB
    const dbGame = await this.prisma.game.create({
      data: {
        roomId: room.id,
        currentRound: 0,
        totalRounds: 11,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    // Initialize player scores
    const playerIds = [...room.players.keys()];
    await this.prisma.playerScore.createMany({
      data: playerIds.map(uid => ({ gameId: dbGame.id, userId: uid, totalPoints: 0 })),
    });

    // Determine player order (randomized)
    const playerOrder = [...playerIds].sort(() => Math.random() - 0.5);

    const gameState: GameState = {
      id: dbGame.id,
      roomCode: code,
      currentRound: 0,
      totalRounds: Math.min(playerOrder.length, 11), // rounds = number of players (max 11)
      status: 'IN_PROGRESS',
      playerOrder,
      scores: new Map(playerIds.map(uid => [uid, 0])),
    };

    this.games.set(dbGame.id, gameState);
    this.roomToGame.set(code, dbGame.id);
    room.status = 'IN_PROGRESS';
    room.gameId = dbGame.id;

    await this.prisma.room.update({ where: { code }, data: { status: 'IN_PROGRESS' } });

    // Start round 1
    setTimeout(() => this.startRound(dbGame.id), 1000);

    return { success: true, gameId: dbGame.id };
  }

  private async startRound(gameId: string): Promise<void> {
    const game = this.games.get(gameId);
    if (!game) return;

    const room = this.rooms.get(game.roomCode);
    if (!room) return;

    game.currentRound++;

    if (game.currentRound > game.totalRounds) {
      await this.endGame(gameId);
      return;
    }

    const artistId = game.playerOrder[game.currentRound - 1];
    const wordChoices = getRandomWords(3);

    // Create round in DB
    const dbRound = await this.prisma.round.create({
      data: {
        gameId,
        roundNumber: game.currentRound,
        artistId,
        word: wordChoices[0], // placeholder, updated when artist selects
        status: 'WORD_SELECTION',
        startedAt: new Date(),
      },
    });

    const roundState: RoundState = {
      id: dbRound.id,
      gameId,
      roundNumber: game.currentRound,
      artistId,
      word: '',
      wordChoices,
      status: 'WORD_SELECTION',
      startedAt: new Date(),
      timeLeft: ROUND_DURATION,
      correctGuessers: [],
      guessRank: 1,
      strokes: [],
      undoneStrokes: [],
      hint: '',
      revealedIndices: [],
    };

    game.currentRoundState = roundState;

    // Send round started event (without word to guessers)
    const artist = room.players.get(artistId);
    this.io.to(game.roomCode).emit('round:started', {
      roundId: dbRound.id,
      roundNumber: game.currentRound,
      totalRounds: game.totalRounds,
      artistId,
      artistName: artist?.username,
      wordLength: 0, // unknown until word selected
      scores: this.getScoresArray(game),
    });

    // Send word choices only to artist
    const artistSocket = artist?.socketId;
    if (artistSocket) {
      this.io.to(artistSocket).emit('round:word-choices', {
        roundId: dbRound.id,
        words: wordChoices,
        timeLeft: WORD_SELECTION_TIMEOUT,
      });
    }

    // Auto-select word if artist doesn't pick in time
    const selectionTimer = setTimeout(() => {
      const r = game.currentRoundState;
      if (r && r.status === 'WORD_SELECTION' && r.id === dbRound.id) {
        this.selectWord(dbRound.id, artistId, wordChoices[0]);
      }
    }, WORD_SELECTION_TIMEOUT * 1000);

    this.roundTimers.set(`${gameId}-select`, selectionTimer);
  }

  async selectWord(roundId: string, artistId: string, word: string): Promise<{ success: boolean; error?: string }> {
    // Find the game with this round
    let game: GameState | undefined;
    for (const g of this.games.values()) {
      if (g.currentRoundState?.id === roundId) {
        game = g;
        break;
      }
    }

    if (!game) return { success: false, error: 'Round not found.' };
    const round = game.currentRoundState!;
    if (round.artistId !== artistId) return { success: false, error: 'Only the artist can select a word.' };
    if (round.status !== 'WORD_SELECTION') return { success: false, error: 'Word already selected.' };
    if (round.wordChoices && !round.wordChoices.includes(word)) return { success: false, error: 'Invalid word choice.' };

    round.word = word;
    round.status = 'IN_PROGRESS';
    round.startedAt = new Date();
    round.timeLeft = ROUND_DURATION;
    round.hint = maskWord(word, []);

    await this.prisma.round.update({
      where: { id: roundId },
      data: { word, status: 'IN_PROGRESS', startedAt: new Date() },
    });

    const room = this.rooms.get(game.roomCode);
    const artist = room?.players.get(artistId);

    // Notify all: word selected, drawing begins
    this.io.to(game.roomCode).emit('round:drawing-start', {
      roundId,
      wordLength: word.length,
      wordSpaces: word.split('').map(c => c === ' ' ? ' ' : '_').join(''),
      hint: round.hint,
      artistId,
      artistName: artist?.username,
      timeLeft: ROUND_DURATION,
    });

    // Send actual word only to artist
    if (artist?.socketId) {
      this.io.to(artist.socketId).emit('round:word', { roundId, word });
    }

    // Start round timer
    this.startRoundTimer(game.id, roundId);

    return { success: true };
  }

  private startRoundTimer(gameId: string, roundId: string): void {
    const game = this.games.get(gameId);
    if (!game) return;
    const round = game.currentRoundState;
    if (!round) return;

    // Clear any existing timers
    const existingInterval = this.roundIntervals.get(roundId);
    if (existingInterval) clearInterval(existingInterval);
    const existingTimer = this.roundTimers.get(roundId);
    if (existingTimer) clearTimeout(existingTimer);

    let elapsed = 0;
    let firstHintSent = false;
    let secondHintSent = false;

    const interval = setInterval(async () => {
      elapsed++;
      round.timeLeft = Math.max(0, ROUND_DURATION - elapsed);

      // Broadcast timer every second
      this.io.to(game.roomCode).emit('round:timer', { roundId, timeLeft: round.timeLeft, elapsed });

      // First hint at 30s
      if (elapsed === FIRST_HINT_AT && !firstHintSent) {
        firstHintSent = true;
        const newRevealed = getRevealIndices(round.word, 1, round.revealedIndices);
        round.revealedIndices = newRevealed;
        round.hint = maskWord(round.word, newRevealed);
        this.io.to(game.roomCode).emit('round:hint', {
          roundId,
          hint: round.hint,
          hintType: 'first',
          timeLeft: round.timeLeft,
        });
        await this.prisma.round.update({ where: { id: roundId }, data: { firstHintAt: new Date() } });
      }

      // Second hint at 45s
      if (elapsed === SECOND_HINT_AT && !secondHintSent) {
        secondHintSent = true;
        const newRevealed = getRevealIndices(round.word, 1, round.revealedIndices);
        round.revealedIndices = newRevealed;
        round.hint = maskWord(round.word, newRevealed);
        this.io.to(game.roomCode).emit('round:hint', {
          roundId,
          hint: round.hint,
          hintType: 'second',
          timeLeft: round.timeLeft,
        });
        await this.prisma.round.update({ where: { id: roundId }, data: { secondHintAt: new Date() } });
      }

      // End round at 60s
      if (elapsed >= ROUND_DURATION) {
        clearInterval(interval);
        this.roundIntervals.delete(roundId);
        await this.endRound(gameId, roundId);
      }
    }, 1000);

    this.roundIntervals.set(roundId, interval);
  }

  async addDrawStroke(roundId: string, userId: string, stroke: StrokeData): Promise<boolean> {
    let game: GameState | undefined;
    for (const g of this.games.values()) {
      if (g.currentRoundState?.id === roundId) { game = g; break; }
    }
    if (!game) return false;
    const round = game.currentRoundState!;
    if (round.artistId !== userId) return false;
    if (round.status !== 'IN_PROGRESS') return false;

    round.strokes.push(stroke);
    round.undoneStrokes = []; // clear redo stack on new stroke

    // Broadcast to all in room except artist
    this.io.to(game.roomCode).emit('draw:stroke', { roundId, stroke });

    // Persist to DB (async, don't await)
    this.prisma.drawStroke.create({
      data: {
        roundId,
        data: stroke as any,
        strokeIndex: round.strokes.length - 1,
      },
    }).catch(console.error);

    return true;
  }

  async undoStroke(roundId: string, userId: string): Promise<boolean> {
    let game: GameState | undefined;
    for (const g of this.games.values()) {
      if (g.currentRoundState?.id === roundId) { game = g; break; }
    }
    if (!game) return false;
    const round = game.currentRoundState!;
    if (round.artistId !== userId || round.strokes.length === 0) return false;

    const undone = round.strokes.pop()!;
    round.undoneStrokes.push(undone);
    this.io.to(game.roomCode).emit('draw:undo', { roundId, strokes: round.strokes });
    return true;
  }

  async redoStroke(roundId: string, userId: string): Promise<boolean> {
    let game: GameState | undefined;
    for (const g of this.games.values()) {
      if (g.currentRoundState?.id === roundId) { game = g; break; }
    }
    if (!game) return false;
    const round = game.currentRoundState!;
    if (round.artistId !== userId || round.undoneStrokes.length === 0) return false;

    const redone = round.undoneStrokes.pop()!;
    round.strokes.push(redone);
    this.io.to(game.roomCode).emit('draw:redo', { roundId, strokes: round.strokes });
    return true;
  }

  async clearCanvas(roundId: string, userId: string): Promise<boolean> {
    let game: GameState | undefined;
    for (const g of this.games.values()) {
      if (g.currentRoundState?.id === roundId) { game = g; break; }
    }
    if (!game) return false;
    const round = game.currentRoundState!;
    if (round.artistId !== userId) return false;

    round.strokes = [];
    round.undoneStrokes = [];
    this.io.to(game.roomCode).emit('draw:clear', { roundId });
    return true;
  }

  async submitGuess(roundId: string, userId: string, text: string): Promise<GuessResult | null> {
    let game: GameState | undefined;
    for (const g of this.games.values()) {
      if (g.currentRoundState?.id === roundId) { game = g; break; }
    }
    if (!game) return null;
    const round = game.currentRoundState!;

    if (round.status !== 'IN_PROGRESS') return null;
    if (round.artistId === userId) return null; // artist cannot guess
    if (round.correctGuessers.includes(userId)) return null; // already guessed correctly

    const normalized = normalizeGuess(text);
    const isCorrect = normalized === normalizeGuess(round.word);

    let points = 0;
    let rank = 0;

    if (isCorrect) {
      rank = round.guessRank;
      round.guessRank++;

      if (rank === 1) points = 10;
      else if (rank === 2) points = 8;
      else if (rank === 3) points = 6;
      else points = 5;

      round.correctGuessers.push(userId);

      // Update score in memory
      const currentScore = game.scores.get(userId) || 0;
      game.scores.set(userId, currentScore + points);

      // Persist guess to DB
      this.prisma.guess.upsert({
        where: { roundId_userId: { roundId, userId } },
        create: { roundId, userId, text, isCorrect: true, points, rank },
        update: { text, isCorrect: true, points, rank },
      }).catch(console.error);

      // Update score in DB
      this.prisma.playerScore.upsert({
        where: { gameId_userId: { gameId: game.id, userId } },
        create: { gameId: game.id, userId, totalPoints: points },
        update: { totalPoints: { increment: points } },
      }).catch(console.error);

      // Check if all guessers have answered
      const totalGuessers = [...this.rooms.get(game.roomCode)!.players.values()]
        .filter(p => p.userId !== round.artistId).length;
      if (round.correctGuessers.length >= totalGuessers) {
        const interval = this.roundIntervals.get(roundId);
        if (interval) { clearInterval(interval); this.roundIntervals.delete(roundId); }
        setTimeout(() => this.endRound(game!.id, roundId), 500);
      }
    } else {
      // Persist incorrect guess
      this.prisma.guess.upsert({
        where: { roundId_userId: { roundId, userId } },
        create: { roundId, userId, text, isCorrect: false, points: 0, rank: 0 },
        update: { text },
      }).catch(console.error);
    }

    const room = this.rooms.get(game.roomCode);
    const player = room?.players.get(userId);

    return {
      userId,
      username: player?.username || 'Unknown',
      isCorrect,
      points,
      rank,
    };
  }

  private async endRound(gameId: string, roundId: string): Promise<void> {
    const game = this.games.get(gameId);
    if (!game) return;
    const round = game.currentRoundState;
    if (!round || round.id !== roundId || round.status === 'FINISHED') return;

    round.status = 'FINISHED';
    round.endedAt = new Date();

    // Artist scoring
    const anyGuessedCorrectly = round.correctGuessers.length > 0;
    const artistBonus = anyGuessedCorrectly ? 5 : -1;
    const artistCurrentScore = game.scores.get(round.artistId) || 0;
    game.scores.set(round.artistId, Math.max(0, artistCurrentScore + artistBonus));

    // Update artist score in DB
    this.prisma.playerScore.upsert({
      where: { gameId_userId: { gameId, userId: round.artistId } },
      create: { gameId, userId: round.artistId, totalPoints: Math.max(0, artistBonus) },
      update: { totalPoints: { increment: artistBonus } },
    }).catch(console.error);

    await this.prisma.round.update({
      where: { id: roundId },
      data: { status: 'FINISHED', endedAt: new Date() },
    });

    // Send round end event with results
    const scoresArray = this.getScoresArray(game);
    this.io.to(game.roomCode).emit('round:end', {
      roundId,
      word: round.word,
      correctGuessers: round.correctGuessers,
      artistBonus,
      artistId: round.artistId,
      scores: scoresArray,
      nextRound: game.currentRound < game.totalRounds ? game.currentRound + 1 : null,
    });

    // Wait and start next round
    setTimeout(() => {
      if (game.currentRound < game.totalRounds) {
        this.startRound(gameId);
      } else {
        this.endGame(gameId);
      }
    }, ROUND_END_PAUSE * 1000);
  }

  private async endGame(gameId: string): Promise<void> {
    const game = this.games.get(gameId);
    if (!game) return;

    game.status = 'FINISHED';

    await this.prisma.game.update({
      where: { id: gameId },
      data: { status: 'FINISHED', endedAt: new Date(), currentRound: game.currentRound },
    });

    const room = this.rooms.get(game.roomCode);
    if (room) room.status = 'FINISHED';

    const finalScores = this.getScoresArray(game);
    const winner = finalScores[0]; // already sorted by score descending

    this.io.to(game.roomCode).emit('game:end', {
      gameId,
      winner,
      scores: finalScores,
      message: `${winner?.username || 'Nobody'} wins the game!`,
    });

    this.games.delete(gameId);
    this.roomToGame.delete(game.roomCode);
  }

  // ─── State Restoration ──────────────────────────────────────────────────────

  getFullState(roomCode: string, userId: string): object {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Room not found' };

    const gameId = this.roomToGame.get(roomCode);
    const game = gameId ? this.games.get(gameId) : undefined;
    const round = game?.currentRoundState;

    return {
      room: {
        id: room.id,
        code: room.code,
        hostId: room.hostId,
        status: room.status,
        players: [...room.players.values()].map(p => ({
          userId: p.userId,
          username: p.username,
          isReady: p.isReady,
          isConnected: p.isConnected,
          isHost: p.userId === room.hostId,
        })),
      },
      game: game ? {
        id: game.id,
        currentRound: game.currentRound,
        totalRounds: game.totalRounds,
        status: game.status,
        scores: this.getScoresArray(game),
      } : null,
      round: round ? {
        id: round.id,
        roundNumber: round.roundNumber,
        artistId: round.artistId,
        status: round.status,
        timeLeft: round.timeLeft,
        hint: round.hint,
        correctGuessers: round.correctGuessers,
        strokes: round.strokes,
        word: userId === round.artistId ? round.word : undefined, // only artist gets word
        wordChoices: userId === round.artistId && round.status === 'WORD_SELECTION' ? round.wordChoices : undefined,
      } : null,
    };
  }

  handleReconnect(roomCode: string, userId: string, socketId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.get(userId);
    if (player) {
      player.isConnected = true;
      player.socketId = socketId;
    }
  }

  handleDisconnect(socketId: string): { roomCode?: string; userId?: string } {
    for (const [code, room] of this.rooms) {
      for (const [uid, player] of room.players) {
        if (player.socketId === socketId) {
          player.isConnected = false;
          return { roomCode: code, userId: uid };
        }
      }
    }
    return {};
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private getScoresArray(game: GameState): Array<{ userId: string; username: string; totalPoints: number }> {
    const room = this.rooms.get(game.roomCode);
    return [...game.scores.entries()]
      .map(([uid, pts]) => ({
        userId: uid,
        username: room?.players.get(uid)?.username || 'Unknown',
        totalPoints: pts,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }

  getRoomBySocketId(socketId: string): { room: RoomState; userId: string } | null {
    for (const room of this.rooms.values()) {
      for (const player of room.players.values()) {
        if (player.socketId === socketId) {
          return { room, userId: player.userId };
        }
      }
    }
    return null;
  }
}
