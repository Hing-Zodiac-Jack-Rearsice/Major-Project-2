// stores/promptStore.ts
import { create } from "zustand";

interface PromptState {
  promptsRemaining: number | null;
  isSubscribed: boolean | null;
  isLoading: boolean;
  error: string | null;
  fetchPromptCount: () => Promise<void>;
  decrementPromptCount: () => void;
}

export const usePromptStore = create<PromptState>((set, get) => ({
  promptsRemaining: null,
  isSubscribed: false,
  isLoading: false,
  error: null,

  fetchPromptCount: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/chat/prompts");
      if (!response.ok) {
        throw new Error("Failed to fetch prompt count");
      }
      const data = await response.json();
      set({ promptsRemaining: data.promptsRemaining, isLoading: false });
      set({ isSubscribed: data.isSubscribed });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  decrementPromptCount: async () => {
    // First update optimistically on the client
    const { promptsRemaining } = get();
    if (promptsRemaining !== null && promptsRemaining !== Infinity && promptsRemaining > 0) {
      set({ promptsRemaining: promptsRemaining - 1 });
    }

    // Then update in the database
    try {
      const response = await fetch("/api/chat/prompts", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to decrement prompt count");
      }
      // Get the updated count from the server
      const data = await response.json();
      set({ promptsRemaining: data.promptsRemaining });
    } catch (error) {
      // If there's an error, fetch the correct count from the server
      get().fetchPromptCount();
      console.error("Error decrementing prompt count:", error);
    }
  },
}));
