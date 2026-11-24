export interface Player {
  userId: string;
  username: string;
  isReady: boolean;
  isConnected: boolean;
  socketId: string;
  isHost: boolean;
}

export interface RoomState {
  id: string;
  code: string;
  hostId: string;
  players: Map<string, Player>;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
  gameId?: string;
  createdAt: Date;
}

export interface GameState {
  id: string;
  roomCode: string;
  currentRound: number;
  totalRounds: number;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
  playerOrder: string[]; // userId order for artist rotation
  scores: Map<string, number>; // userId -> total points
  currentRoundState?: RoundState;
}

export interface RoundState {
  id: string;
  gameId: string;
  roundNumber: number;
  artistId: string;
  word: string;
  wordChoices?: string[]; // only sent to artist during selection
  status: 'WAITING' | 'WORD_SELECTION' | 'IN_PROGRESS' | 'FINISHED';
  startedAt?: Date;
  endedAt?: Date;
  timeLeft: number; // seconds
  correctGuessers: string[]; // userIds who guessed correctly
  guessRank: number; // next correct guess rank
  strokes: StrokeData[];
  undoneStrokes: StrokeData[];
  hint: string; // masked word with revealed letters, e.g. "_ _ _ _ _"
  revealedIndices: number[];
  timerInterval?: ReturnType<typeof setInterval>;
}

export interface StrokeData {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  brushSize: number;
  isEraser: boolean;
  timestamp: number;
}

export interface GuessResult {
  userId: string;
  username: string;
  isCorrect: boolean;
  points: number;
  rank: number;
  maskedGuess?: string; // for incorrect guesses shown to others
}

export interface ScoreUpdate {
  scores: Array<{ userId: string; username: string; totalPoints: number }>;
  roundPoints: Array<{ userId: string; points: number; reason: string }>;
}

// Socket event payloads
export interface CreateRoomPayload {
  userId: string;
  username: string;
}

export interface JoinRoomPayload {
  code: string;
  userId: string;
  username: string;
}

export interface ReadyPayload {
  code: string;
  userId: string;
  ready: boolean;
}

export interface StartGamePayload {
  code: string;
  userId: string;
}

export interface WordSelectPayload {
  roundId: string;
  userId: string;
  word: string;
}

export interface DrawStrokePayload {
  roundId: string;
  userId: string;
  stroke: StrokeData;
}

export interface UndoPayload {
  roundId: string;
  userId: string;
}

export interface RedoPayload {
  roundId: string;
  userId: string;
}

export interface ClearPayload {
  roundId: string;
  userId: string;
}

export interface GuessPayload {
  roundId: string;
  userId: string;
  text: string;
}
