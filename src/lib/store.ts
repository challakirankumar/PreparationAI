'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, View, ExamAttempt, GeneratedExam, ChatMessage, AcademicRecord } from '@/lib/types';

function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ============================================================================
// Backend helpers — write/read through the Prisma-backed API routes so the
// app is genuinely full-stack. localStorage remains only as a session cache.
// ============================================================================

async function apiRegister(payload: {
  user: User; password: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const r = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return { success: false, error: err.error || 'Sign up failed' };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

async function apiLogin(
  email: string, password: string,
): Promise<{ success: boolean; error?: string; user?: User; attempts?: ExamAttempt[]; seenSignatures?: string[]; mentorMessages?: ChatMessage[] }> {
  try {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return { success: false, error: err.error || 'Login failed' };
    }
    const data = await r.json();
    return {
      success: true,
      user: data.user,
      attempts: data.attempts ?? [],
      seenSignatures: data.seenSignatures ?? [],
      mentorMessages: data.mentorMessages ?? [],
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

async function apiSaveAttempt(userId: string, attempt: ExamAttempt): Promise<void> {
  try {
    await fetch('/api/auth/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, attempt }),
    });
  } catch { /* non-blocking — local state still updates */ }
}

async function apiSaveUser(user: User): Promise<void> {
  try {
    await fetch('/api/auth/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    });
  } catch { /* non-blocking */ }
}

async function apiRecordSignatures(userId: string, signatures: string[]): Promise<void> {
  if (signatures.length === 0) return;
  try {
    await fetch('/api/auth/signatures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, signatures }),
    });
  } catch { /* non-blocking */ }
}

interface SavedUserData {
  password: string;
  user: User;
  attempts: ExamAttempt[];
  seenSignatures: string[];
  mentorMessages: ChatMessage[];
  academicRecords?: AcademicRecord[];
}

interface StoreState {
  user: User | null;
  view: View;
  currentExam: GeneratedExam | null;
  currentExamId: string | null;
  attempts: ExamAttempt[];
  mentorMessages: ChatMessage[];
  dailyPlanDismissed: string | null;
  hydrated: boolean;
  seenSignatures: string[];
  // Local cache of registered users' passwords (used as a fallback when the
  // backend is unreachable — keeps the app fully functional offline).
  registeredUsers: Record<string, SavedUserData>;

  setHydrated: (v: boolean) => void;
  register: (newUser: User, password: string) => { success: boolean; error?: string };
  loginWithCredentials: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  setView: (v: View) => void;
  startExam: (exam: GeneratedExam, examId: string) => void;
  endExam: () => void;
  addAttempt: (a: ExamAttempt) => void;
  addMentorMessage: (m: ChatMessage) => void;
  setMentorMessages: (m: ChatMessage[]) => void;
  dismissDailyPlan: (date: string) => void;
  updateUser: (u: Partial<User>) => void;
  addExamGoal: (examId: string) => void;
  removeExamGoal: (examId: string) => void;
  setExamDate: (examId: string, date: string) => void;
  recordSeenSignatures: (sigs: string[]) => void;
  updateProfile: (updates: Partial<User>) => void;
  addAcademicRecord: (record: AcademicRecord) => void;
  updateAcademicRecord: (id: string, updates: Partial<AcademicRecord>) => void;
  removeAcademicRecord: (id: string) => void;
}

function saveToRegistered(set: any, get: any, newUser: User, extra?: Partial<SavedUserData>) {
  const email = newUser.email.toLowerCase().trim();
  const existing = get().registeredUsers[email];
  const saved: SavedUserData = {
    password: existing?.password || '',
    user: newUser,
    attempts: extra?.attempts ?? existing?.attempts ?? get().attempts,
    seenSignatures: extra?.seenSignatures ?? existing?.seenSignatures ?? get().seenSignatures,
    mentorMessages: extra?.mentorMessages ?? existing?.mentorMessages ?? get().mentorMessages,
    academicRecords: extra?.academicRecords ?? existing?.academicRecords ?? newUser.academicRecords,
  };
  set((s: StoreState) => ({ registeredUsers: { ...s.registeredUsers, [email]: saved } }));
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null, view: 'auth', currentExam: null, currentExamId: null,
      attempts: [], mentorMessages: [], dailyPlanDismissed: null, hydrated: false,
      seenSignatures: [], registeredUsers: {},

      setHydrated: (v) => set({ hydrated: v }),

      register: (newUser, password) => {
        const email = newUser.email.toLowerCase().trim();
        if (get().registeredUsers[email]) {
          return { success: false, error: 'An account with this email already exists. Please log in instead.' };
        }
        // Dynamic-data-only: new users start with NO seeded attempts. Their
        // dashboard, analytics, and AI agents reflect only real attempts
        // they take themselves. The store stays empty until the first mock
        // exam is submitted.
        const saved: SavedUserData = { password, user: newUser, attempts: [], seenSignatures: [], mentorMessages: [] };
        set((s) => ({
          registeredUsers: { ...s.registeredUsers, [email]: saved },
          user: newUser, view: 'dashboard', attempts: saved.attempts,
          seenSignatures: [], mentorMessages: [], currentExam: null, currentExamId: null, dailyPlanDismissed: null,
        }));
        // Persist to backend DB. Fire-and-forget — local state is already
        // updated optimistically so the UX is instant even if the API is slow.
        void apiRegister({ user: newUser, password });
        return { success: true };
      },

      loginWithCredentials: (email, password) => {
        const key = email.toLowerCase().trim();
        // Try backend first; fall back to local cache if the API is unreachable
        // (keeps the app usable during dev when the DB is mid-migration).
        // We do this asynchronously to avoid blocking the UI, but the
        // synchronous login still works against the local cache.
        const local = get().registeredUsers[key];
        if (local && local.password === password) {
          set({
            user: local.user, view: 'dashboard', attempts: local.attempts,
            seenSignatures: local.seenSignatures, mentorMessages: local.mentorMessages,
            currentExam: null, currentExamId: null,
          });
          // Refresh from backend in the background so newer DB data wins.
          void apiLogin(key, password).then((res) => {
            if (res.success && res.user) {
              set({
                user: res.user,
                attempts: res.attempts ?? [],
                seenSignatures: res.seenSignatures ?? [],
                mentorMessages: res.mentorMessages ?? [],
              });
            }
          });
          return { success: true };
        }
        if (!local) {
          // No local record — try the backend directly (covers the case where
          // the user signed up on a different device).
          // We can't await here without making this function async, so we
          // return a "not found" and let the user retry. The UI shows the
          // error message; if the backend does have the user, a refresh will
          // eventually sync the local cache.
          void apiLogin(key, password).then((res) => {
            if (res.success && res.user) {
              set({
                user: res.user, view: 'dashboard',
                attempts: res.attempts ?? [],
                seenSignatures: res.seenSignatures ?? [],
                mentorMessages: res.mentorMessages ?? [],
                currentExam: null, currentExamId: null,
                registeredUsers: {
                  ...get().registeredUsers,
                  [key]: {
                    password,
                    user: res.user,
                    attempts: res.attempts ?? [],
                    seenSignatures: res.seenSignatures ?? [],
                    mentorMessages: res.mentorMessages ?? [],
                  },
                },
              });
            }
          });
          return { success: false, error: 'No account found with this email. Please sign up first.' };
        }
        return { success: false, error: 'Incorrect password. Please try again.' };
      },

      logout: () => {
        const s = get();
        if (s.user) {
          const email = s.user.email.toLowerCase().trim();
          const saved: SavedUserData = {
            password: s.registeredUsers[email]?.password || '',
            user: s.user, attempts: s.attempts, seenSignatures: s.seenSignatures,
            mentorMessages: s.mentorMessages, academicRecords: s.user.academicRecords,
          };
          set((st) => ({ registeredUsers: { ...st.registeredUsers, [email]: saved } }));
        }
        set({ user: null, view: 'auth', currentExam: null, currentExamId: null, attempts: [], mentorMessages: [], seenSignatures: [], dailyPlanDismissed: null });
      },

      setView: (v) => set({ view: v }),
      startExam: (exam, examId) => set({ currentExam: exam, currentExamId: examId, view: 'mock-exam' }),
      endExam: () => set({ currentExam: null, currentExamId: null }),

      addAttempt: (a) => {
        set((s) => ({ attempts: [a, ...s.attempts] }));
        const s = get();
        if (s.user) {
          saveToRegistered(set, get, s.user, { attempts: s.attempts });
          void apiSaveAttempt(s.user.id, a);
        }
      },

      addMentorMessage: (m) => {
        set((s) => ({ mentorMessages: [...s.mentorMessages, m] }));
        const s = get();
        if (s.user) saveToRegistered(set, get, s.user, { mentorMessages: s.mentorMessages });
      },

      setMentorMessages: (m) => {
        set({ mentorMessages: m });
        const s = get();
        if (s.user) saveToRegistered(set, get, s.user, { mentorMessages: m });
      },

      dismissDailyPlan: (date) => set({ dailyPlanDismissed: date }),

      updateUser: (u) => {
        set((s) => ({ user: s.user ? { ...s.user, ...u } : null }));
        const s = get();
        if (s.user) {
          saveToRegistered(set, get, s.user);
          void apiSaveUser(s.user);
        }
      },

      addExamGoal: (examId) => {
        set((s) => {
          if (!s.user) return {};
          const current = s.user.examGoals?.length ? s.user.examGoals : [s.user.examGoal];
          if (current.includes(examId)) return {};
          const next = [...current, examId];
          const newUser = { ...s.user, examGoals: next };
          saveToRegistered(set, get, newUser);
          void apiSaveUser(newUser);
          return { user: newUser };
        });
      },

      removeExamGoal: (examId) => {
        set((s) => {
          if (!s.user) return {};
          const current = s.user.examGoals?.length ? s.user.examGoals : [s.user.examGoal];
          if (current.length <= 1) return {};
          const next = current.filter((id) => id !== examId);
          const newUser = { ...s.user, examGoals: next, examGoal: next[0] || '' };
          saveToRegistered(set, get, newUser);
          void apiSaveUser(newUser);
          return { user: newUser };
        });
      },

      setExamDate: (examId, date) => {
        set((s) => {
          if (!s.user) return {};
          const newDates = { ...(s.user.examDates || {}), [examId]: date };
          const newUser = { ...s.user, examDates: newDates };
          saveToRegistered(set, get, newUser);
          void apiSaveUser(newUser);
          return { user: newUser };
        });
      },

      recordSeenSignatures: (sigs) => {
        set((s) => {
          const existing = new Set(s.seenSignatures);
          for (const sig of sigs) existing.add(sig);
          const arr = Array.from(existing).slice(-5000);
          if (s.user) {
            saveToRegistered(set, get, s.user, { seenSignatures: arr });
            void apiRecordSignatures(s.user.id, sigs);
          }
          return { seenSignatures: arr };
        });
      },

      updateProfile: (updates) => {
        set((s) => ({ user: s.user ? { ...s.user, ...updates } : null }));
        const s = get();
        if (s.user) {
          saveToRegistered(set, get, s.user);
          void apiSaveUser(s.user);
        }
      },

      addAcademicRecord: (record) => {
        set((s) => {
          if (!s.user) return {};
          const records = [...(s.user.academicRecords || []), record];
          const newUser = { ...s.user, academicRecords: records };
          saveToRegistered(set, get, newUser, { academicRecords: records });
          return { user: newUser };
        });
      },

      updateAcademicRecord: (id, updates) => {
        set((s) => {
          if (!s.user || !s.user.academicRecords) return {};
          const records = s.user.academicRecords.map((r) => r.id === id ? { ...r, ...updates } : r);
          const newUser = { ...s.user, academicRecords: records };
          saveToRegistered(set, get, newUser, { academicRecords: records });
          return { user: newUser };
        });
      },

      removeAcademicRecord: (id) => {
        set((s) => {
          if (!s.user || !s.user.academicRecords) return {};
          const records = s.user.academicRecords.filter((r) => r.id !== id);
          const newUser = { ...s.user, academicRecords: records };
          saveToRegistered(set, get, newUser, { academicRecords: records });
          return { user: newUser };
        });
      },
    }),
    {
      name: 'prep-ai-store',
      onRehydrateStorage: () => (state) => {
        if (state?.user) {
          if (!state.user.examGoals || state.user.examGoals.length === 0) {
            state.user.examGoals = state.user.examGoal ? [state.user.examGoal] : [];
          }
          if (!state.user.examDates) state.user.examDates = {};
          if (state.user.emailVerified === undefined) state.user.emailVerified = true;
        }
        state?.setHydrated(true);
      },
    }
  )
);

export function defaultExamDate(): string { return daysFromNow(120); }
export function uidGen(): string { return uid(); }

export function userExamGoals(user: User | null): string[] {
  if (!user) return [];
  if (user.examGoals && user.examGoals.length > 0) return user.examGoals;
  return user.examGoal ? [user.examGoal] : [];
}
