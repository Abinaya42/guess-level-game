import { io, Socket } from 'socket.io-client';
import { StrokeData } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string): Socket {
    if (this.socket?.connected) return this.socket;

    this.socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => console.log('Socket connected:', this.socket?.id));
    this.socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
    this.socket.on('connect_error', (err) => console.error('Socket error:', err.message));

    return this.socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // ── Room ──────────────────────────────────────────────────────────────────
  createRoom(username: string) {
    this.socket?.emit('room:create', { username });
  }

  joinRoom(code: string) {
    this.socket?.emit('room:join', { code });
  }

  leaveRoom(code: string) {
    this.socket?.emit('room:leave', { code });
  }

  setReady(code: string, ready: boolean) {
    this.socket?.emit('room:ready', { code, ready });
  }

  startGame(code: string) {
    this.socket?.emit('room:start', { code });
  }

  // ── Game ──────────────────────────────────────────────────────────────────
  selectWord(roundId: string, word: string) {
    this.socket?.emit('game:word-select', { roundId, word });
  }

  drawStroke(roundId: string, stroke: StrokeData) {
    this.socket?.emit('game:draw-stroke', { roundId, stroke });
  }

  undoStroke(roundId: string) {
    this.socket?.emit('game:undo', { roundId });
  }

  redoStroke(roundId: string) {
    this.socket?.emit('game:redo', { roundId });
  }

  clearCanvas(roundId: string) {
    this.socket?.emit('game:clear', { roundId });
  }

  submitGuess(roundId: string, text: string) {
    this.socket?.emit('game:guess', { roundId, text });
  }

  requestState(roomCode: string) {
    this.socket?.emit('state:request', { roomCode });
  }

  // ── Listeners ─────────────────────────────────────────────────────────────
  on(event: string, handler: (...args: any[]) => void) {
    this.socket?.on(event, handler);
  }

  off(event: string, handler?: (...args: any[]) => void) {
    if (handler) this.socket?.off(event, handler);
    else this.socket?.removeAllListeners(event);
  }
}

export const socketService = new SocketService();
