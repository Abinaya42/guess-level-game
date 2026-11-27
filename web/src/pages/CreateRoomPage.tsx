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
      if (!fbUser) { navigate('/login'); return; }
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
      <div className="sketch-card" style={cardStyle}>
        {/* Tilted Sticky Note Tag */}
        <div style={stickyTagStyle} className="font-hand">
          Private Table
        </div>

        {/* Custom Hand-Drawn Easel / Canvas Emblem */}
        <div style={logoBadgeStyle}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="3" width="16" height="12" rx="2" fill="#FFFDF9" />
            <path d="M12 15v6" />
            <path d="M8 21l2-6" />
            <path d="M16 21l-2-6" />
            <path d="M8 9c1.5-2 3.5-2 5 0s3 1.5 3.5 0" stroke="#E11D48" />
          </svg>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1C1917', margin: '14px 0 6px' }}>
          Set Up a Sketch Room
        </h1>
        <p style={{ color: '#57534E', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          Open a private sketchbook table and share the invite code with your crew.
        </p>

        {/* Room Rules Box */}
        <div style={rulesBoxStyle}>
          <div className="font-hand" style={{ fontSize: 18, fontWeight: 700, color: '#1C1917', marginBottom: 10 }}>
            House Rules
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, fontWeight: 600, color: '#1C1917', textAlign: 'left' }}>
            <div style={ruleRowStyle}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Up to 11 artists per table</span>
            </div>

            <div style={ruleRowStyle}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
              <span>11 rounds — everyone gets the pencil</span>
            </div>

            <div style={ruleRowStyle}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>60 seconds on the clock per sketch</span>
            </div>
          </div>
        </div>

        <button
          onClick={createRoom}
          disabled={creating}
          className="sketch-btn"
          style={{
            background: creating ? '#E7E5E4' : '#34D399',
            color: '#1C1917',
            padding: '15px 28px',
            fontSize: 17,
            width: '100%',
            marginBottom: 14,
            cursor: creating ? 'not-allowed' : 'pointer',
          }}
        >
          {creating ? 'Setting Up Easel...' : 'Open Room & Get Code →'}
        </button>

        <button
          onClick={() => navigate('/home')}
          style={{
            background: 'none',
            border: 'none',
            color: '#57534E',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          ← Back to Studio
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
};

const cardStyle: React.CSSProperties = {
  padding: '38px 32px',
  maxWidth: 430,
  width: '100%',
  textAlign: 'center',
  position: 'relative',
};

const stickyTagStyle: React.CSSProperties = {
  position: 'absolute',
  top: -14,
  right: 22,
  background: '#38BDF8',
  border: '2px solid #1C1917',
  borderRadius: 8,
  padding: '2px 12px',
  fontSize: 18,
  fontWeight: 700,
  color: '#1C1917',
  transform: 'rotate(3deg)',
  boxShadow: '2px 2px 0px #1C1917',
};

const logoBadgeStyle: React.CSSProperties = {
  width: 62,
  height: 62,
  margin: '0 auto',
  borderRadius: 16,
  background: '#FDE047',
  border: '2.5px solid #1C1917',
  boxShadow: '3px 3px 0px #1C1917',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transform: 'rotate(-4deg)',
};

const rulesBoxStyle: React.CSSProperties = {
  background: '#FEF9C3',
  border: '2px solid #1C1917',
  borderRadius: 14,
  padding: '16px 18px',
  marginBottom: 24,
};

const ruleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};