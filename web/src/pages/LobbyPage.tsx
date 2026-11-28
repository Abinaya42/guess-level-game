import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import { socketService } from '../services/socket';
import { auth } from '../lib/firebase';
import { Player } from '../types';
import toast from 'react-hot-toast';

const AVATAR_COLORS = ['#22C55E', '#10B981', '#34D399', '#FB7185', '#C084FC', '#FDBA74'];

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
        if (data.newHostId === user.id) toast.success('You are holding the host pencil now!');
      });

      socket.on('error', (data: any) => {
        toast.error(data.message || 'Could not sync room');
      });

      socket.on('game:started', () => {
        navigate(`/game/${code}`);
      });

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
    if (!allReady) { toast.error('Wait for everyone to ready up!'); return; }
    setStarting(true);
    socketService.startGame(code!);
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied to clipboard!');
  };

  const leaveRoom = () => {
    socketService.leaveRoom(code!);
    navigate('/home');
  };

  return (
    <div style={{ minHeight: '100vh', padding: '28px 18px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Room Ticket Header */}
        <div className="sketch-card" style={{ padding: 24, background: '#22C55E', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <span className="font-hand" style={{ fontSize: 18, fontWeight: 700, color: '#44403C' }}>
                Sketchbook Room Pass
              </span>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1C1917', margin: '2px 0 12px' }}>
                Waiting Lobby
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="font-display" style={codeTicketStyle}>
                  {code}
                </span>
                <button onClick={copyInvite} className="sketch-btn" style={copyBtnStyle}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy Invite Link</span>
                </button>
              </div>
            </div>

            <button onClick={leaveRoom} className="sketch-btn" style={{ background: '#FFE4E6', color: '#1C1917', padding: '8px 14px', fontSize: 14 }}>
              Leave Room
            </button>
          </div>

          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '2px dashed #1C1917', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, fontWeight: 700, color: '#1C1917' }}>
            <span>Seats filled: {players.length} / 11 artists</span>
            <span className="font-hand" style={{ fontSize: 18 }}>
              {players.length < 2 ? 'Invite at least 1 friend' : 'Ready to roll!'}
            </span>
          </div>
        </div>

        {/* Players List */}
        <div className="sketch-card" style={{ padding: 22, background: '#0B2418' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1C1917', marginBottom: 14 }}>
            Artists in Room
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {players.map((p: Player, idx: number) => {
              const isMe = p.userId === user?.id;
              const avatarBg = AVATAR_COLORS[idx % AVATAR_COLORS.length];

              return (
                <div
                  key={p.userId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: isMe ? '#14452E' : '#0E2E1F',
                    borderRadius: 12,
                    border: '2px solid #1C1917',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      className="font-display"
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        background: avatarBg,
                        border: '2px solid #1C1917',
                        color: '#1C1917',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 16,
                      }}
                    >
                      {p.username[0]?.toUpperCase()}
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, color: '#1C1917', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{p.username}</span>
                        {isMe && (
                          <span style={{ fontSize: 11, background: '#E0F2FE', border: '1.5px solid #1C1917', borderRadius: 6, padding: '1px 6px' }}>
                            You
                          </span>
                        )}
                      </div>

                      {p.isHost && (
                        <div style={{ fontSize: 12, color: '#B45309', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="#22C55E" stroke="#1C1917" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                          </svg>
                          <span>Room Host</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Stamp */}
                  <div>
                    {p.isHost ? (
                      <span style={statusPillStyle('#14452E')}>Host</span>
                    ) : p.isReady ? (
                      <span style={statusPillStyle('#DCFCE7')}>Ready</span>
                    ) : (
                      <span style={statusPillStyle('#F5F5F4')}>Sharpening...</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div style={{ display: 'flex', gap: 12 }}>
          {!isHost && (
            <button
              onClick={toggleReady}
              className="sketch-btn"
              style={{
                flex: 1,
                background: isReady ? '#FFE4E6' : '#34D399',
                color: '#1C1917',
                padding: '15px',
                fontSize: 17,
              }}
            >
              {isReady ? 'Not Ready Yet' : 'Ready to Sketch!'}
            </button>
          )}

          {isHost && (
            <button
              onClick={startGame}
              disabled={!allReady || starting || players.length < 2}
              className="sketch-btn"
              style={{
                flex: 1,
                background: allReady && players.length >= 2 ? '#34D399' : '#E7E5E4',
                color: allReady && players.length >= 2 ? '#1C1917' : '#78716C',
                padding: '15px',
                fontSize: 17,
                cursor: allReady && players.length >= 2 ? 'pointer' : 'not-allowed',
              }}
            >
              {starting
                ? 'Opening Canvas...'
                : players.length < 2
                ? 'Waiting for 1 More Artist...'
                : !allReady
                ? 'Waiting for Everyone to Ready Up...'
                : 'Start Sketching →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const codeTicketStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: 4,
  background: '#0B2418',
  color: '#1C1917',
  border: '2px solid #1C1917',
  boxShadow: '2px 2px 0px #1C1917',
  padding: '6px 14px',
  borderRadius: 10,
};

const copyBtnStyle: React.CSSProperties = {
  background: '#0B2418',
  color: '#1C1917',
  padding: '8px 14px',
  fontSize: 14,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const statusPillStyle = (bg: string): React.CSSProperties => ({
  display: 'inline-block',
  background: bg,
  border: '1.5px solid #1C1917',
  borderRadius: 8,
  padding: '3px 10px',
  fontSize: 12,
  fontWeight: 700,
  color: '#1C1917',
});