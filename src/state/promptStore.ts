// src/store/promptStore.ts
import { create } from "zustand";

interface PromptState {
  promptsUsed: number;
  promptsLimit: number;
  lastReset: Date | null;
  isSubscribed: boolean;
  isLoading: boolean;

  // Actions
  setPromptData: (data: Partial<PromptState>) => void;
  reset: () => void;
}

export const usePromptStore = create<PromptState>()((set) => ({
  promptsUsed: 0,
  promptsLimit: 15,
  lastReset: null,
  isSubscribed: false,
  isLoading: true,

  setPromptData: (data) =>
    set((state) => ({
      ...state,
      ...data,
      isLoading: false,
    })),

  reset: () =>
    set((state) => ({
      promptsUsed: 0,
      promptsLimit: state.isSubscribed ? 45 : 15,
      lastReset: null,
      isLoading: true,
      isSubscribed: state.isSubscribed, // Keep the subscription status
    })),
}));
