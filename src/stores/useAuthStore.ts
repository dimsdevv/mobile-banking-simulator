import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  failedAttempts: number;
  lockedUntil: number | null;
  
  login: (userId: string) => void;
  logout: () => void;
  incrementFailedAttempts: () => void;
  resetLock: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userId: null,
      failedAttempts: 0,
      lockedUntil: null,

      login: (userId) => set({ isAuthenticated: true, userId, failedAttempts: 0, lockedUntil: null }),
      logout: () => set({ isAuthenticated: false, userId: null }),
      incrementFailedAttempts: () => set((state) => {
        const attempts = state.failedAttempts + 1;
        if (attempts >= 3) {
          // Lock for 30 seconds
          return { failedAttempts: attempts, lockedUntil: Date.now() + 30000 };
        }
        return { failedAttempts: attempts };
      }),
      resetLock: () => set({ failedAttempts: 0, lockedUntil: null }),
    }),
    {
      name: 'simbank-auth-storage',
    }
  )
)
