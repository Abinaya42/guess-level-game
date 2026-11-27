import axios from 'axios';
import { GameHistory, GameStats, Room, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const { auth } = await import('../lib/firebase');
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const verifyAndCreateUser = async (username?: string): Promise<User> => {
  const { data } = await api.post('/auth/verify', { username });
  return data.user;
};

export const getRoom = async (code: string): Promise<Room> => {
  const { data } = await api.get(`/rooms/${code}`);
  return data.room;
};

export const getUserStats = async (userId: string): Promise<GameStats> => {
  const { data } = await api.get(`/users/${userId}/stats`);
  return data.stats;
};

export const getUserHistory = async (userId: string, page = 1): Promise<{ history: GameHistory[]; hasMore: boolean }> => {
  const { data } = await api.get(`/users/${userId}/history`, { params: { page } });
  return data;
};

export const updateProfile = async (username: string): Promise<User> => {
  const { data } = await api.post('/auth/update-profile', { username });
  return data.user;
};
