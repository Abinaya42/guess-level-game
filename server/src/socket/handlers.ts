import { Server as SocketIOServer, Socket } from 'socket.io';
import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import { GameEngine } from '../game/GameEngine.js';

export function setupSocketHandlers(io: SocketIOServer, prisma: PrismaClient, engine: GameEngine): void {

  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required.'));
    }
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      (socket as any).userId = decoded.uid;
      (socket as any).userEmail = decoded.email;
      next();
    } catch {
      next(new Error('Invalid token.'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    console.log(`Socket connected: ${socket.id} (user: ${userId})`);

    // ── Room Events ───────────────────────────────────────────────────────────

    socket.on('room:create', async (data: { username: string }) => {
      try {
        // Look up user in DB
        const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
        if (!user) { socket.emit('error', { message: 'User not found. Please log in again.' }); return; }

        const { room, dbRoom } = await engine.createRoom(user.id, user.username, socket.id);
        socket.join(room.code);

        socket.emit('room:created', {
          code: room.code,
          roomId: room.id,
          inviteLink: dbRoom.inviteLink,
          players: [...room.players.values()].map(p => ({
            userId: p.userId,
            username: p.username,
            isReady: p.isReady,
            isHost: p.isHost,
          })),
        });
      } catch (err: any) {
        console.error('room:create error:', err);
        socket.emit('error', { message: 'Failed to create room.' });
      }
    });

    socket.on('room:join', async (data: { code: string }) => {
      try {
        const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
        if (!user) { socket.emit('error', { message: 'User not found.' }); return; }

        const code = data.code?.toUpperCase().trim();
        const result = await engine.joinRoom(code, user.id, user.username, socket.id);

        if (!result.success) {
          socket.emit('error', { message: result.error });
          return;
        }

        socket.join(code);
        const room = result.room!;

        const playersArr = [...room.players.values()].map(p => ({
          userId: p.userId,
          username: p.username,
          isReady: p.isReady,
          isHost: p.userId === room.hostId,
          isConnected: p.isConnected,
        }));

        // Tell the joining player about the room
        socket.emit('room:joined', {
          code: room.code,
          roomId: room.id,
          hostId: room.hostId,
          players: playersArr,
        });

        // Tell everyone else a player joined
        socket.to(code).emit('player:joined', {
          userId: user.id,
          username: user.username,
          isReady: false,
          isHost: false,
        });

        // Broadcast updated player list
        io.to(code).emit('room:updated', { players: playersArr, hostId: room.hostId });
      } catch (err: any) {
        console.error('room:join error:', err);
        socket.emit('error', { message: 'Failed to join room.' });
      }
    });

    socket.on('room:leave', async (data: { code: string }) => {
      try {
        const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
        if (!user) return;

        const code = data.code?.toUpperCase().trim();
        const result = await engine.leaveRoom(code, user.id);
        socket.leave(code);

        if (result.hostChanged) {
          io.to(code).emit('host:changed', { newHostId: result.newHostId });
        }

        socket.to(code).emit('player:left', { userId: user.id });

        if (result.room) {
          const playersArr = [...result.room.players.values()].map(p => ({
            userId: p.userId,
            username: p.username,
            isReady: p.isReady,
            isHost: p.userId === result.room!.hostId,
          }));
          io.to(code).emit('room:updated', { players: playersArr, hostId: result.room.hostId });
        }

        socket.emit('room:left', { success: true });
      } catch (err: any) {
        socket.emit('error', { message: 'Failed to leave room.' });
      }
    });

    socket.on('room:ready', async (data: { code: string; ready: boolean }) => {
      try {
        const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
        if (!user) return;

        const code = data.code?.toUpperCase().trim();
        const room = await engine.setReady(code, user.id, data.ready);
        if (!room) { socket.emit('error', { message: 'Room not found.' }); return; }

        const playersArr = [...room.players.values()].map(p => ({
          userId: p.userId,
          username: p.username,
          isReady: p.isReady,
          isHost: p.userId === room.hostId,
        }));

        io.to(code).emit('room:updated', { players: playersArr, hostId: room.hostId });
      } catch (err: any) {
        socket.emit('error', { message: 'Failed to update ready status.' });
      }
    });

    socket.on('room:start', async (data: { code: string }) => {
      try {
        const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
        if (!user) return;

        const code = data.code?.toUpperCase().trim();
        const result = await engine.startGame(code, user.id);

        if (!result.success) {
          socket.emit('error', { message: result.error });
          return;
        }

        io.to(code).emit('game:started', {
          gameId: result.gameId,
          message: 'Game starting!',
        });
      } catch (err: any) {
        socket.emit('error', { message: 'Failed to start game.' });
      }
    });

    // ── Game Events ───────────────────────────────────────────────────────────

    socket.on('game:word-select', async (data: { roundId: string; word: string }) => {
      try {
        const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
        if (!user) return;

        const result = await engine.selectWord(data.roundId, user.id, data.word);
        if (!result.success) {
          socket.emit('error', { message: result.error });
        }
      } catch (err: any) {
        socket.emit('error', { message: 'Failed to select word.' });
      }
    });

    socket.on('game:draw-stroke', async (data: { roundId: string; stroke: any }) => {
      try {
        const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
        if (!user) return;

        await engine.addDrawStroke(data.roundId, user.id, data.stroke);
      } catch (err: any) {
        // Silently ignore drawing errors to avoid interrupting gameplay
      }
    });

    socket.on('game:undo', async (data: { roundId: string }) => {
      try {
        const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
        if (!user) return;
        await engine.undoStroke(data.roundId, user.id);
      } catch {}
    });

    socket.on('game:redo', async (data: { roundId: string }) => {
      try {
        const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
        if (!user) return;
        await engine.redoStroke(data.roundId, user.id);
      } catch {}
    });

    socket.on('game:clear', async (data: { roundId: string }) => {
      try {
        const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
        if (!user) return;
        await engine.clearCanvas(data.roundId, user.id);
      } catch {}
    });

    socket.on('game:guess', async (data: { roundId: string; text: string }) => {
      try {
        const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
        if (!user) return;

        const result = await engine.submitGuess(data.roundId, user.id, data.text);
        if (!result) {
          socket.emit('error', { message: 'Could not submit guess.' });
          return;
        }

        // Find room code for broadcasting
        const info = engine.getRoomBySocketId(socket.id);
        const roomCode = info?.room.code;

        if (result.isCorrect) {
          // Tell the guesser they got it
          socket.emit('guess:correct', {
            roundId: data.roundId,
            points: result.points,
            rank: result.rank,
          });
          // Tell everyone in room (without revealing the word) who guessed correctly
          if (roomCode) {
            io.to(roomCode).emit('guess:result', {
              roundId: data.roundId,
              userId: user.id,
              username: user.username,
              isCorrect: true,
              rank: result.rank,
              points: result.points,
            });
          }
        } else {
          // Show incorrect guess in chat
          if (roomCode) {
            io.to(roomCode).emit('guess:result', {
              roundId: data.roundId,
              userId: user.id,
              username: user.username,
              isCorrect: false,
              text: data.text, // show text for incorrect guesses (not the word)
            });
          }
        }
      } catch (err: any) {
        socket.emit('error', { message: 'Failed to submit guess.' });
      }
    });

    // ── Reconnection ──────────────────────────────────────────────────────────

    socket.on('state:request', async (data: { roomCode: string }) => {
      try {
        const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
        if (!user) return;

        const code = data.roomCode?.toUpperCase().trim();
        engine.handleReconnect(code, user.id, socket.id);
        socket.join(code);

        const state = engine.getFullState(code, user.id);
        socket.emit('state:restored', state);
      } catch (err: any) {
        socket.emit('error', { message: 'Failed to restore state.' });
      }
    });

    // ── Disconnect ────────────────────────────────────────────────────────────

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const result = engine.handleDisconnect(socket.id);
      if (result.roomCode) {
        socket.to(result.roomCode).emit('player:disconnected', { userId: result.userId });
      }
    });
  });
}
