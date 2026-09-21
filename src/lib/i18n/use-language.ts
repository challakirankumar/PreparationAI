'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language, StringKey } from './strings';
import { translate, getLanguageMeta, LANGUAGES } from './strings';

// ============================================================================
// Language store — persisted to localStorage
// ============================================================================

interface LanguageStoreState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: StringKey) => string;
}

export const useLanguageStore = create<LanguageStoreState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      t: (key) => translate(key, get().language),
    }),
    {
      name: 'prep-ai-language',
      version: 1,
    }
  )
);

// ---------------------------------------------------------------------------
// Hook for components — returns current language + translation function + meta
// ---------------------------------------------------------------------------

export function useLanguage() {
  const language = useLanguageStore(s => s.language);
  const setLanguage = useLanguageStore(s => s.setLanguage);
  const t = useLanguageStore(s => s.t);
  const meta = getLanguageMeta(language);
  return { language, setLanguage, t, meta, languages: LANGUAGES };
}
