import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import { socketService } from '../services/socket';
import { auth } from '../lib/firebase';
import { Player } from '../types';
import toast from 'react-hot-toast';

export const LobbyPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { room, setRoom, setPlayers, players } = useGameStore();
  const [isReady, setIsReady] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [starting, setStarting] = useState(false);
  const socketRef = useRef(false);

  const isHost = room?.hostId === user?.id;
  const allReady = players.length >= 2 && players.filter(p => !p.isHost).every(p => p.isReady);

  useEffect(() => {
    if (!user || !code || socketRef.current) return;
    socketRef.current = true;

    const connectAndJoin = async () => {
      const fbUser = auth.currentUser;
      if (!fbUser) { navigate('/login'); return; }
      const token = await fbUser.getIdToken();
      const socket = socketService.connect(token);

      socket.on('room:joined', (data: any) => {
        setRoom({ id: data.roomId, code: data.code, hostId: data.hostId, status: 'WAITING', maxPlayers: 11, players: data.players });
        setPlayers(data.players);
        setInviteLink(`${window.location.origin}/join/${data.code}`);
      });

      socket.on('room:created', (data: any) => {
        setRoom({ id: data.roomId, code: data.code, hostId: user.id, status: 'WAITING', maxPlayers: 11, players: data.players, inviteLink: data.inviteLink });
        setPlayers(data.players);
        setInviteLink(data.inviteLink || `${window.location.origin}/join/${data.code}`);
      });

      socket.on('room:updated', (data: any) => {
        setPlayers(data.players);
        if (room) setRoom({ ...room, hostId: data.hostId });
      });

      socket.on('host:changed', (data: any) => {
        if (room) setRoom({ ...room, hostId: data.newHostId });
        if (data.newHostId === user.id) toast.success('You are now the host!');
      });

      socket.on('error', (data: any) => {
        toast.error(data.message || 'An error occurred');
      });

      socket.on('game:started', () => {
        navigate(`/game/${code}`);
      });

      // Check if this is a create or join flow
      if (window.location.pathname.includes('/create-room')) {
        socketService.createRoom(user.username);
      } else {
        socketService.joinRoom(code!);
      }
    };

    connectAndJoin();

    return () => {
      socketService.off('room:joined');
      socketService.off('room:created');
      socketService.off('room:updated');
      socketService.off('host:changed');
      socketService.off('game:started');
    };
  }, [code, user]);

  const toggleReady = () => {
    const newReady = !isReady;
    setIsReady(newReady);
    socketService.setReady(code!, newReady);
  };

  const startGame = () => {
    if (!allReady) { toast.error('All players must be ready!'); return; }
    setStarting(true);
    socketService.startGame(code!);
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied!');
  };

  const leaveRoom = () => {
    socketService.leaveRoom(code!);
    navigate('/home');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 24 }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, padding: 24, color: '#fff', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Game Lobby</h1>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: 3, background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 8 }}>{code}</span>
                <button onClick={copyInvite} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}>
                  🔗 Copy Invite
                </button>
              </div>
            </div>
            <button onClick={leaveRoom} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Leave</button>
          </div>
          <div style={{ marginTop: 12, fontSize: 14, opacity: 0.8 }}>{players.length} / 11 players</div>
        </div>

        {/* Players list */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 16 }}>Players</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {players.map((p: Player) => (
              <div key={p.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: p.userId === user?.id ? '#ede9fe' : '#f8fafc', borderRadius: 10, border: p.userId === user?.id ? '1.5px solid #a78bfa' : '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                    {p.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{p.username} {p.userId === user?.id && '(You)'}</div>
                    {p.isHost && <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>👑 Host</div>}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: p.isReady || p.isHost ? '#10b981' : '#94a3b8' }}>
                  {p.isHost ? '—' : (p.isReady ? '✅ Ready' : '⏳ Waiting')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          {!isHost && (
            <button onClick={toggleReady} style={{ flex: 1, background: isReady ? '#fee2e2' : '#10b981', color: isReady ? '#dc2626' : '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              {isReady ? '✕ Unready' : '✓ Ready'}
            </button>
          )}
          {isHost && (
            <button onClick={startGame} disabled={!allReady || starting || players.length < 2} style={{ flex: 1, background: allReady && players.length >= 2 ? '#6366f1' : '#a5b4fc', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: allReady ? 'pointer' : 'not-allowed' }}>
              {starting ? 'Starting...' : players.length < 2 ? 'Need 2+ Players' : !allReady ? 'Waiting for players...' : '🚀 Start Game!'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
