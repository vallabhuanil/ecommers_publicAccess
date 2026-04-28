import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      setAuth: (data) => set({ user: { name: data.name, email: data.email }, token: data.token, role: data.role }),
      logout: () => set({ user: null, token: null, role: null }),
    }),
    { name: 'auth-storage' }
  )
);
