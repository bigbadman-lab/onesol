import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { calculatePNL, STARTING_BALANCE } from "./tradesData";
import { checkNetworkConnection } from "./useNetworkStatus";

// Enhanced fetch with network error detection and retry logic
const fetchWithRetry = async (url, options = {}, retries = 2) => {
  // Check network first
  const isOnline = await checkNetworkConnection();
  if (!isOnline) {
    throw new Error("OFFLINE");
  }

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    } catch (error) {
      // If it's a network error and we have retries left, try again
      if (
        i < retries &&
        (error.message === "Network request failed" ||
          error.message.includes("Failed to fetch"))
      ) {
        console.log(`Retry ${i + 1}/${retries} for ${url}`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // exponential backoff
        continue;
      }

      // If it's a network error, throw OFFLINE
      if (
        error.message === "Network request failed" ||
        error.message.includes("Failed to fetch")
      ) {
        throw new Error("OFFLINE");
      }

      throw error;
    }
  }
};

// Helper to fetch trade from API with retry
const fetchTrade = async (tradeId) => {
  const response = await fetchWithRetry(`/api/trades/${tradeId}`);
  return await response.json();
};

// Helper to fetch random trade for endless mode with retry
const fetchRandomTrade = async (excludeIds = []) => {
  const response = await fetchWithRetry("/api/trades/random", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ excludeIds }),
  });
  return await response.json();
};

const useGameStore = create((set, get) => ({
  // Endless mode state
  endlessModeActive: false,
  endlessModeBalance: STARTING_BALANCE,
  endlessModeTradeCount: 0,
  endlessModeCorrectCount: 0,
  endlessModeResults: [],
  endlessModeCurrentTrade: null,
  endlessModeSelectedBet: null,
  endlessModeUsedTradeIds: [],
  endlessModeHasReset: false,
  endlessModeNextTrade: null, // Prefetched next trade

  // Actions for endless mode
  startEndlessMode: async () => {
    console.log("Starting endless mode...");
    const firstTrade = await fetchRandomTrade();
    console.log("First trade loaded:", firstTrade.id);

    // Prefetch second trade
    let secondTrade = null;
    try {
      secondTrade = await fetchRandomTrade([firstTrade.id]);
      console.log("Second trade prefetched:", secondTrade.id);
    } catch (error) {
      console.warn("Failed to prefetch second trade:", error);
    }

    set({
      endlessModeActive: true,
      endlessModeBalance: STARTING_BALANCE,
      endlessModeTradeCount: 0,
      endlessModeCorrectCount: 0,
      endlessModeResults: [],
      endlessModeCurrentTrade: firstTrade,
      endlessModeSelectedBet: null,
      endlessModeUsedTradeIds: [firstTrade.id],
      endlessModeHasReset: false,
      endlessModeNextTrade: secondTrade,
    });

    console.log("Endless mode started successfully");
  },

  setEndlessModeSelectedBet: (amount) =>
    set({ endlessModeSelectedBet: amount }),

  submitEndlessTrade: async (prediction) => {
    const state = get();
    const {
      endlessModeCurrentTrade,
      endlessModeSelectedBet,
      endlessModeBalance,
      endlessModeNextTrade,
    } = state;

    if (!endlessModeCurrentTrade || !endlessModeSelectedBet) return;

    const pnl = calculatePNL(
      endlessModeSelectedBet,
      prediction,
      endlessModeCurrentTrade.outcome,
      endlessModeCurrentTrade.return_pct,
    );

    const newBalance = Math.max(
      0,
      parseFloat((endlessModeBalance + pnl).toFixed(2)),
    );
    const isCorrect = prediction === endlessModeCurrentTrade.outcome;

    const result = {
      tradeId: endlessModeCurrentTrade.id,
      betAmount: endlessModeSelectedBet,
      prediction,
      outcome: endlessModeCurrentTrade.outcome,
      pnl,
      isCorrect,
      returnPct: endlessModeCurrentTrade.return_pct,
      reason: endlessModeCurrentTrade.reason_short,
    };

    // Use prefetched trade if available, otherwise fetch
    let nextTrade = endlessModeNextTrade;
    const currentUsedIds = [...state.endlessModeUsedTradeIds];

    if (!nextTrade) {
      try {
        nextTrade = await fetchRandomTrade(currentUsedIds);
      } catch (error) {
        console.error("Failed to fetch next trade:", error);
        throw error;
      }
    }

    // Prefetch the trade after next
    let prefetchedNextTrade = null;
    try {
      prefetchedNextTrade = await fetchRandomTrade([
        ...currentUsedIds,
        nextTrade.id,
      ]);
    } catch (error) {
      console.warn("Failed to prefetch next trade:", error);
    }

    set({
      endlessModeResults: [...state.endlessModeResults, result],
      endlessModeBalance: newBalance,
      endlessModeTradeCount: state.endlessModeTradeCount + 1,
      endlessModeCorrectCount:
        state.endlessModeCorrectCount + (isCorrect ? 1 : 0),
      endlessModeCurrentTrade: nextTrade,
      endlessModeSelectedBet: null,
      endlessModeUsedTradeIds: [...currentUsedIds, nextTrade.id],
      endlessModeNextTrade: prefetchedNextTrade,
    });
  },

  completeEndlessMode: () =>
    set({
      endlessModeActive: false,
    }),

  setEndlessModeHasReset: (value) => set({ endlessModeHasReset: value }),

  resetEndlessMode: () => {
    const currentHasReset = get().endlessModeHasReset;
    set({
      endlessModeActive: false,
      endlessModeBalance: STARTING_BALANCE,
      endlessModeTradeCount: 0,
      endlessModeCorrectCount: 0,
      endlessModeResults: [],
      endlessModeCurrentTrade: null,
      endlessModeSelectedBet: null,
      endlessModeUsedTradeIds: [],
      endlessModeHasReset: currentHasReset,
      endlessModeNextTrade: null,
    });
  },
}));

export default useGameStore;
