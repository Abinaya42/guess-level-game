import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { verifyAndCreateUser } from '../services/api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  firebaseUser: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  register: (email: string, password: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  setUser: (user: User | null) => void;
  setFirebaseUser: (fbUser: any) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      firebaseUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      register: async (email, password, username) => {
        set({ isLoading: true, error: null });
        try {
          const credential = await createUserWithEmailAndPassword(auth, email, password);
          await firebaseUpdateProfile(credential.user, { displayName: username });
          await sendEmailVerification(credential.user);
          const token = await credential.user.getIdToken();
          const user = await verifyAndCreateUser(username);
          set({ user, firebaseUser: credential.user, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          const msg = getAuthErrorMessage(err.code);
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const credential = await signInWithEmailAndPassword(auth, email, password);
          const user = await verifyAndCreateUser();
          set({ user, firebaseUser: credential.user, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          const msg = getAuthErrorMessage(err.code);
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        }
      },

      logout: async () => {
        await signOut(auth);
        set({ user: null, firebaseUser: null, isAuthenticated: false });
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await sendPasswordResetEmail(auth, email);
          set({ isLoading: false });
        } catch (err: any) {
          const msg = getAuthErrorMessage(err.code);
          set({ error: msg, isLoading: false });
          throw new Error(msg);
        }
      },

      resendVerification: async () => {
        const fbUser = auth.currentUser;
        if (fbUser) await sendEmailVerification(fbUser);
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setFirebaseUser: (fbUser) => set({ firebaseUser: fbUser }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'This email is already registered. Please log in.';
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/user-not-found': return 'No account found with this email.';
    case 'auth/wrong-password': return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests': return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed': return 'Network error. Check your connection.';
    case 'auth/invalid-credential': return 'Invalid email or password.';
    default: return 'An error occurred. Please try again.';
  }
}
