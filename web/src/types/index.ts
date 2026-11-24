export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: string;
}

export interface Player {
  userId: string;
  username: string;
  isReady: boolean;
  isHost: boolean;
  isConnected?: boolean;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
  maxPlayers: number;
  inviteLink?: string;
  players: Player[];
}

export interface Game {
  id: string;
  currentRound: number;
  totalRounds: number;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
  scores: ScoreEntry[];
}

export interface Round {
  id: string;
  roundNumber: number;
  artistId: string;
  status: 'WAITING' | 'WORD_SELECTION' | 'IN_PROGRESS' | 'FINISHED';
  timeLeft: number;
  hint: string;
  word?: string; // only for artist
  wordChoices?: string[]; // only during WORD_SELECTION for artist
  correctGuessers: string[];
  strokes: StrokeData[];
}

export interface StrokeData {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  brushSize: number;
  isEraser: boolean;
  timestamp: number;
}

export interface ScoreEntry {
  userId: string;
  username: string;
  totalPoints: number;
}

export interface GuessMessage {
  userId: string;
  username: string;
  text?: string;
  isCorrect: boolean;
  rank?: number;
  points?: number;
  timestamp: number;
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  totalPoints: number;
  avgScore: number;
  bestScore: number;
}

export interface GameHistory {
  gameId: string;
  playedAt: string;
  endedAt: string;
  myScore: number;
  rank: number;
  totalPlayers: number;
  roomCode: string;
  topScores: Array<{ username: string; points: number }>;
}
