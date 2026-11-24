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
        setRoom({ id: data.roomId, code: data.code, hostId: user.id, status: 'WAITING', maxPlayers: 11, players: data.players, inviteLink: data.inviteLink });
        setPlayers(data.players);
        navigate(`/lobby/${data.code}`);
      });

      socketService.on('error', (data: any) => {
        toast.error(data.message);
        setCreating(false);
      });
    };

    setup();

    return () => { socketService.off('room:created'); socketService.off('error'); };
  }, [user]);

  const createRoom = () => {
    if (!user) return;
    setCreating(true);
    socketService.createRoom(user.username);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 48, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🚀</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>Create a Room</h1>
        <p style={{ color: '#64748b', marginBottom: 32, lineHeight: 1.6 }}>
          Start a private game for up to 11 players. Share the room code or invite link.
        </p>

        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Room details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, color: '#374151' }}>
            <div>👥 Up to 11 players</div>
            <div>🔄 11 rounds (each player draws once)</div>
            <div>⏱️ 60 seconds per round</div>
          </div>
        </div>

        <button onClick={createRoom} disabled={creating} style={{ background: creating ? '#a5b4fc' : '#6366f1', color: '#fff', border: 'none', borderRadius: 14, padding: '16px 32px', fontSize: 18, fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer', width: '100%', marginBottom: 12 }}>
          {creating ? '⏳ Creating...' : '✨ Create Room'}
        </button>
        <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>← Back to Home</button>
      </div>
    </div>
  );
};
