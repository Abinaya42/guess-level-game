import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import { socketService } from '../services/socket';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';

export const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setRoom, setPlayers, reset } = useGameStore();
  const [creating, setCreating] = useState(false);
  const socketRef = useRef(false);

  useEffect(() => {
    if (!user || socketRef.current) return;
    socketRef.current = true;

    const setup = async () => {
      const fbUser = auth.currentUser;
      if (!fbUser) {
        navigate('/login');
        return;
      }
      const token = await fbUser.getIdToken();
      socketService.connect(token);

      socketService.on('room:created', (data: any) => {
        reset();
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
        navigate(`/lobby/${data.code}`);
      });

      socketService.on('error', (data: any) => {
        toast.error(data.message);
        setCreating(false);
      });
    };

    setup();

    return () => {
      socketService.off('room:created');
      socketService.off('error');
    };
  }, [user]);

  const createRoom = () => {
    if (!user) return;
    setCreating(true);
    socketService.createRoom(user.username);
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={badgeRowStyle}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </div>

        <h1 style={titleStyle}>Create Room</h1>
        <p style={subtitleStyle}>
          Start a private room and share the code with friends.
        </p>

        <div style={infoBoxStyle}>
          <div style={infoHeadingStyle}>Game Details</div>
          <div style={infoListStyle}>
            <div style={infoItemStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Up to 11 players</span>
            </div>

            <div style={infoItemStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>11 rounds per game</span>
            </div>

            <div style={infoItemStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>60 seconds per turn</span>
            </div>
          </div>
        </div>

        <button
          onClick={createRoom}
          disabled={creating}
          style={{
            ...primaryBtnStyle,
            background: creating ? '#143827' : '#22C55E',
            color: creating ? '#86EFAC' : '#05160E',
            cursor: creating ? 'not-allowed' : 'pointer',
          }}
        >
          {creating ? 'Creating Room...' : 'Create Room'}
        </button>

        <button onClick={() => navigate('/home')} style={backBtnStyle}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

const pageStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: 20,
  background: '#05160E',
};

const cardStyle: React.CSSProperties = {
  padding: '32px 28px',
  maxWidth: 420,
  width: '100%',
  textAlign: 'center',
  background: '#0B2418',
  border: '2px solid #1F6B46',
  borderRadius: 16,
};

const badgeRowStyle: React.CSSProperties = {
  width: 52,
  height: 52,
  margin: '0 auto 12px',
  borderRadius: 12,
  background: '#103322',
  border: '1.5px solid #22C55E',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const titleStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 700,
  color: '#ECFDF5',
  margin: '0 0 6px',
};

const subtitleStyle: React.CSSProperties = {
  color: '#86EFAC',
  fontSize: 14,
  margin: '0 0 22px',
  lineHeight: 1.5,
};

const infoBoxStyle: React.CSSProperties = {
  background: '#081D13',
  border: '1.5px solid #1F6B46',
  borderRadius: 12,
  padding: '14px 16px',
  marginBottom: 22,
};

const infoHeadingStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: '#ECFDF5',
  marginBottom: 10,
};

const infoListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  fontSize: 14,
  fontWeight: 600,
  color: '#ECFDF5',
  textAlign: 'left',
};

const infoItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '13px 24px',
  fontSize: 16,
  fontWeight: 700,
  width: '100%',
  borderRadius: 10,
  border: 'none',
  marginBottom: 12,
};

const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#86EFAC',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'underline',
};