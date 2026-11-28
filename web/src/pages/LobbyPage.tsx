import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import { socketService } from '../services/socket';
import { auth } from '../lib/firebase';
import { Player } from '../types';
import toast from 'react-hot-toast';

const AVATAR_COLORS = ['#15803D', '#166534', '#14532D', '#103322', '#0D291C', '#1F6B46'];

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
  const allReady = players.length >= 2 && players.filter((p) => !p.isHost).every((p) => p.isReady);

  useEffect(() => {
    if (!user || !code || socketRef.current) return;
    socketRef.current = true;

    const connectAndJoin = async () => {
      const fbUser = auth.currentUser;
      if (!fbUser) {
        navigate('/login');
        return;
      }
      const token = await fbUser.getIdToken();
      const socket = socketService.connect(token);

      socket.on('room:joined', (data: any) => {
        setRoom({
          id: data.roomId,
          code: data.code,
          hostId: data.hostId,
          status: 'WAITING',
          maxPlayers: 11,
          players: data.players,
        });
        setPlayers(data.players);
        setInviteLink(`${window.location.origin}/join/${data.code}`);
      });

      socket.on('room:created', (data: any) => {
        setRoom({
          id: data.roomId,
          code: data.code,
          hostId: user.id,
          status: 'WAITING',
          maxPlayers: 11,
          players: data.players,
          inviteLink: data.inviteLink,
        });
        setPlayers(data.players);
        setInviteLink(data.inviteLink || `${window.location.origin}/join/${data.code}`);
      });

      socket.on('room:updated', (data: any) => {
        setPlayers(data.players);
        if (room) setRoom({ ...room, hostId: data.hostId });
      });

      socket.on('host:changed', (data: any) => {
        if (room) setRoom({ ...room, hostId: data.newHostId });
        if (data.newHostId === user.id) toast.success('You are now the room host.');
      });

      socket.on('error', (data: any) => {
        toast.error(data.message || 'Could not update room');
      });

      socket.on('game:started', () => {
        navigate(`/game/${code}`);
      });

      if (window.location.pathname.includes('/create-room')) {
        socketService.createRoom(user.username);
      } else {
        socketService.joinRoom(code);
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
    if (!allReady) {
      toast.error('Wait for all players to be ready.');
      return;
    }
    setStarting(true);
    socketService.startGame(code!);
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied.');
  };

  const leaveRoom = () => {
    socketService.leaveRoom(code!);
    navigate('/home');
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={bannerCardStyle}>
          <div style={bannerTopStyle}>
            <div>
              <span style={passLabelStyle}>Room Code</span>
              <h1 style={lobbyTitleStyle}>Lobby</h1>

              <div style={codeRowStyle}>
                <span style={codeTicketStyle}>{code}</span>
                <button onClick={copyInvite} style={copyBtnStyle}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy Link</span>
                </button>
              </div>
            </div>

            <button onClick={leaveRoom} style={leaveBtnStyle}>
              Leave Room
            </button>
          </div>

          <div style={bannerFooterStyle}>
            <span>Players: {players.length} / 11</span>
            <span>
              {players.length < 2 ? 'Waiting for at least 1 more player' : 'Ready to start'}
            </span>
          </div>
        </div>

        <div style={playersCardStyle}>
          <h3 style={playersHeadingStyle}>Players in Room</h3>

          <div style={playersListStyle}>
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
                    background: isMe ? '#14452E' : '#081D13',
                    borderRadius: 10,
                    border: '1.5px solid #1F6B46',
                  }}
                >
                  <div style={playerLeftStyle}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 9,
                        background: avatarBg,
                        border: '1.5px solid #22C55E',
                        color: '#ECFDF5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    >
                      {p.username[0]?.toUpperCase()}
                    </div>

                    <div>
                      <div style={playerNameRowStyle}>
                        <span>{p.username}</span>
                        {isMe && <span style={youBadgeStyle}>You</span>}
                      </div>

                      {p.isHost && (
                        <div style={hostLabelStyle}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                          </svg>
                          <span>Host</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    {p.isHost ? (
                      <span style={statusPillStyle('#14452E', '#ECFDF5')}>Host</span>
                    ) : p.isReady ? (
                      <span style={statusPillStyle('#22C55E', '#05160E')}>Ready</span>
                    ) : (
                      <span style={statusPillStyle('#103322', '#86EFAC')}>Waiting</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={bottomActionsStyle}>
          {!isHost && (
            <button
              onClick={toggleReady}
              style={{
                flex: 1,
                background: isReady ? '#14452E' : '#22C55E',
                color: isReady ? '#ECFDF5' : '#05160E',
                border: isReady ? '1.5px solid #22C55E' : 'none',
                padding: '14px 20px',
                fontSize: 16,
                fontWeight: 700,
                borderRadius: 10,
                cursor: 'pointer',
              }}
            >
              {isReady ? 'Cancel Ready' : 'Ready'}
            </button>
          )}

          {isHost && (
            <button
              onClick={startGame}
              disabled={!allReady || starting || players.length < 2}
              style={{
                flex: 1,
                background: allReady && players.length >= 2 ? '#22C55E' : '#143827',
                color: allReady && players.length >= 2 ? '#05160E' : '#86EFAC',
                padding: '14px 20px',
                fontSize: 16,
                fontWeight: 700,
                borderRadius: 10,
                border: 'none',
                cursor: allReady && players.length >= 2 ? 'pointer' : 'not-allowed',
              }}
            >
              {starting
                ? 'Starting Game...'
                : players.length < 2
                ? 'Waiting for More Players...'
                : !allReady
                ? 'Waiting for Players to Ready...'
                : 'Start Game'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  padding: '28px 18px',
  background: '#05160E',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 680,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};

const bannerCardStyle: React.CSSProperties = {
  padding: 24,
  background: '#0B2418',
  border: '2px solid #22C55E',
  borderRadius: 16,
};

const bannerTopStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  flexWrap: 'wrap',
};

const passLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#86EFAC',
};

const lobbyTitleStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 700,
  color: '#ECFDF5',
  margin: '2px 0 12px',
};

const codeRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
};

const codeTicketStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: 4,
  background: '#081D13',
  color: '#4ADE80',
  border: '1.5px solid #22C55E',
  padding: '6px 14px',
  borderRadius: 10,
};

const copyBtnStyle: React.CSSProperties = {
  background: '#103322',
  color: '#ECFDF5',
  border: '1.5px solid #1F6B46',
  borderRadius: 10,
  padding: '8px 14px',
  fontSize: 14,
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  cursor: 'pointer',
};

const leaveBtnStyle: React.CSSProperties = {
  background: '#103322',
  color: '#ECFDF5',
  border: '1.5px solid #1F6B46',
  borderRadius: 10,
  padding: '8px 14px',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
};

const bannerFooterStyle: React.CSSProperties = {
  marginTop: 16,
  paddingTop: 12,
  borderTop: '1.5px dashed #1F6B46',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 14,
  fontWeight: 700,
  color: '#86EFAC',
  flexWrap: 'wrap',
  gap: 8,
};

const playersCardStyle: React.CSSProperties = {
  padding: 22,
  background: '#0B2418',
  border: '2px solid #1F6B46',
  borderRadius: 16,
};

const playersHeadingStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#ECFDF5',
  margin: '0 0 14px',
};

const playersListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const playerLeftStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const playerNameRowStyle: React.CSSProperties = {
  fontWeight: 700,
  color: '#ECFDF5',
  fontSize: 15,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const youBadgeStyle: React.CSSProperties = {
  fontSize: 11,
  background: '#103322',
  color: '#4ADE80',
  border: '1px solid #22C55E',
  borderRadius: 6,
  padding: '1px 6px',
};

const hostLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#4ADE80',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  marginTop: 2,
};

const statusPillStyle = (bg: string, color: string) => ({
  display: 'inline-block',
  background: bg,
  border: '1px solid #22C55E',
  borderRadius: 8,
  padding: '3px 10px',
  fontSize: 12,
  fontWeight: 700,
  color,
});

const bottomActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
};