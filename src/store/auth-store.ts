import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { setApiToken, setOnUnauthorized } from '../api/client';
import type { AuthUser } from '../types';
import { login as apiLogin, register as apiRegister } from '../api/courtly';

const TOKEN_KEY = 'courtly_access_token';
const USER_KEY = 'courtly_user';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  restore: () => Promise<void>;
}

async function persist(token: string, user: AuthUser) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

async function clearPersisted() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isReady: false,
  isLoading: false,
  error: null,

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiLogin({ email, password });
      setApiToken(res.accessToken);
      await persist(res.accessToken, res.user);
      set({ user: res.user, token: res.accessToken, isLoading: false });
    } catch (e: any) {
      const message =
        e?.response?.data?.message ?? e?.message ?? 'Login failed. Please try again.';
      set({ isLoading: false, error: Array.isArray(message) ? message.join(', ') : message });
      throw e;
    }
  },

  signUp: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRegister({ name, email, password });
      setApiToken(res.accessToken);
      await persist(res.accessToken, res.user);
      set({ user: res.user, token: res.accessToken, isLoading: false });
    } catch (e: any) {
      const message =
        e?.response?.data?.message ?? e?.message ?? 'Registration failed. Please try again.';
      set({ isLoading: false, error: Array.isArray(message) ? message.join(', ') : message });
      throw e;
    }
  },

  signOut: async () => {
    setApiToken(null);
    await clearPersisted();
    set({ user: null, token: null, error: null });
  },

  restore: async () => {
    try {
      const [token, rawUser] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);
      if (token && rawUser) {
        setApiToken(token);
        set({ token, user: JSON.parse(rawUser) as AuthUser });
      } else {
        setApiToken(null);
      }
    } catch {
      setApiToken(null);
    } finally {
      set({ isReady: true });
    }
  },
}));

// Expired/invalid token -> force logout so the user lands back on login.
setOnUnauthorized(() => {
  const { signOut } = useAuthStore.getState();
  void signOut();
});
