import { create } from 'zustand';
import { Room, Game, Round, Player, ScoreEntry, GuessMessage, StrokeData } from '../types';

interface GameStore {
  room: Room | null;
  game: Game | null;
  round: Round | null;
  players: Player[];
  scores: ScoreEntry[];
  guessMessages: GuessMessage[];
  isArtist: boolean;
  myUserId: string | null;
  wordChoices: string[];
  hasGuessedCorrectly: boolean;

  setRoom: (room: Room | null) => void;
  setGame: (game: Game | null | ((prev: Game | null) => Game | null)) => void;
  setRound: (round: Round | null | ((prev: Round | null) => Round | null)) => void;
  setPlayers: (players: Player[]) => void;
  setScores: (scores: ScoreEntry[]) => void;
  addGuessMessage: (msg: GuessMessage) => void;
  setIsArtist: (val: boolean) => void;
  setMyUserId: (id: string) => void;
  setWordChoices: (words: string[]) => void;
  setHasGuessedCorrectly: (val: boolean) => void;
  updateTimer: (timeLeft: number) => void;
  updateHint: (hint: string) => void;
  addStroke: (stroke: StrokeData) => void;
  setStrokes: (strokes: StrokeData[]) => void;
  clearStrokes: () => void;
  reset: () => void;
}

const initialState = {
  room: null,
  game: null,
  round: null,
  players: [],
  scores: [],
  guessMessages: [],
  isArtist: false,
  myUserId: null,
  wordChoices: [],
  hasGuessedCorrectly: false,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setRoom: (room) => set({ room }),
  setGame: (game) => set((s) => ({ game: typeof game === 'function' ? (game as Function)(s.game) : game })),
  setRound: (round) => set((s) => ({ round: typeof round === 'function' ? (round as Function)(s.round) : round })),
  setPlayers: (players) => set({ players }),
  setScores: (scores) => set({ scores }),
  addGuessMessage: (msg) => set((s) => ({ guessMessages: [...s.guessMessages, msg] })),
  setIsArtist: (val) => set({ isArtist: val }),
  setMyUserId: (id) => set({ myUserId: id }),
  setWordChoices: (words) => set({ wordChoices: words }),
  setHasGuessedCorrectly: (val) => set({ hasGuessedCorrectly: val }),

  updateTimer: (timeLeft) =>
    set((s) => ({ round: s.round ? { ...s.round, timeLeft } : null })),

  updateHint: (hint) =>
    set((s) => ({ round: s.round ? { ...s.round, hint } : null })),

  addStroke: (stroke) =>
    set((s) => ({
      round: s.round ? { ...s.round, strokes: [...(s.round.strokes || []), stroke] } : null,
    })),

  setStrokes: (strokes) =>
    set((s) => ({ round: s.round ? { ...s.round, strokes } : null })),

  clearStrokes: () =>
    set((s) => ({ round: s.round ? { ...s.round, strokes: [] } : null })),

  reset: () => set(initialState),
}));
