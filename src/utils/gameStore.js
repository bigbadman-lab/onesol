import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { calculatePNL, STARTING_BALANCE } from "./tradesData";
import { checkNetworkConnection } from "./useNetworkStatus";

// Enhanced fetch with network error detection and retry logic
const fetchWithRetry = async (url, options = {}, retries = 2) => {
  // Check network first
  const isOnline = await checkNetworkConnection();
  if (!isOnline) {
    throw new Error("OFFLINE");
  }

  console.log('[fetchWithRetry] Starting request:', {
    url,
    method: options.method || 'GET',
    hasBody: !!options.body,
    retries,
  });

  for (let i = 0; i <= retries; i++) {
    try {
      console.log(`[fetchWithRetry] Attempt ${i + 1}/${retries + 1}:`, url);
      const response = await fetch(url, options);
      console.log(`[fetchWithRetry] Response received:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
        redirected: response.redirected,
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error body');
        console.error(`[fetchWithRetry] Error response body:`, errorText);
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
  const url = "/api/trades/random";
  const requestBody = { excludeIds };
  
  console.log('[fetchRandomTrade] Request:', {
    url,
    method: 'POST',
    body: requestBody,
    excludeIdsCount: excludeIds.length,
  });
  
  try {
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    
    console.log('[fetchRandomTrade] Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries()),
    });
    
    if (!response.ok) {
      let errorText = '';
      let errorData = null;
      try {
        errorText = await response.text();
        // Try to parse as JSON
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Not JSON, keep as text
        }
      } catch (e) {
        errorText = 'Could not read error response body';
      }
      
      console.error(`[fetchRandomTrade] API Error Details:`, {
        status: response.status,
        statusText: response.statusText,
        errorText,
        errorData,
        responseUrl: response.url,
        requestUrl: url,
        method: 'POST',
      });
      
      // Handle specific error cases
      if (response.status === 404 && errorData?.error === 'No trades available') {
        console.error('[fetchRandomTrade] Server reports no trades available, but database has 7 trades. This suggests a server-side filtering issue.');
        console.error('[fetchRandomTrade] Possible causes:');
        console.error('  - Trades may have status field that filters them out');
        console.error('  - Trades may be filtered by date or visibility');
        console.error('  - Trades may be missing required fields');
        throw new Error('NO_TRADES_AVAILABLE');
      }
      
      throw new Error(`Failed to fetch random trade: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[fetchRandomTrade] Success:', { tradeId: data?.id });
    
    // Validate the returned trade has an ID
    if (!data || !data.id) {
      console.error('[fetchRandomTrade] ERROR: API returned trade without ID');
      throw new Error('NO_TRADES_AVAILABLE');
    }
    
    // Log if the returned trade is in the exclude list (shouldn't happen, but log for debugging)
    if (excludeIds.includes(data.id)) {
      console.error('[fetchRandomTrade] WARNING: API returned a trade that should be excluded!', {
        tradeId: data.id,
        excludeIds: excludeIds,
      });
      // This is a server-side bug, but we'll handle it client-side
      throw new Error('NO_TRADES_AVAILABLE');
    }
    
    return data;
    } catch (error) {
      console.error("[fetchRandomTrade] Error:", error);
      // Re-throw with more context
      if (error.message === 'NO_TRADES_AVAILABLE') {
        throw new Error("No trades are currently available. Please try again later.");
      }
      if (error.message.includes("HTTP 404")) {
        throw new Error("Random trade endpoint not found. Please check if the API endpoint exists.");
      }
      throw error;
    }
};

// SecureStore keys for trade ID persistence
const USED_TRADE_IDS_KEY = "used_trade_ids_today";
const LAST_TRADE_DATE_KEY = "last_trade_date";

// Helper function to check and reset daily trade IDs
const checkAndResetDaily = async () => {
  try {
    const lastDate = await SecureStore.getItemAsync(LAST_TRADE_DATE_KEY);
    const today = new Date().toDateString();
    
    console.log("[checkAndResetDaily] Date check:", {
      lastDate,
      today,
      isNewDay: lastDate !== today,
    });
    
    if (lastDate !== today) {
      // New day - clear used trade IDs
      await SecureStore.deleteItemAsync(USED_TRADE_IDS_KEY);
      await SecureStore.setItemAsync(LAST_TRADE_DATE_KEY, today);
      console.log("[checkAndResetDaily] New day detected, cleared used trade IDs");
      return []; // Return empty array for new day
    }
    
    // Same day - return stored IDs
    const stored = await SecureStore.getItemAsync(USED_TRADE_IDS_KEY);
    const usedIds = stored ? JSON.parse(stored) : [];
    console.log("[checkAndResetDaily] Same day, loaded", usedIds.length, "used trade IDs:", usedIds);
    return usedIds;
  } catch (error) {
    console.error("[checkAndResetDaily] Error:", error);
    // On error, return empty array (safe fallback)
    return [];
  }
};

// Helper function to save used trade IDs to SecureStore
const saveUsedTradeIds = async (usedIds) => {
  try {
    const serialized = JSON.stringify(usedIds);
    await SecureStore.setItemAsync(USED_TRADE_IDS_KEY, serialized);
    console.log("[saveUsedTradeIds] Saved", usedIds.length, "used trade IDs to SecureStore:", usedIds);
    
    // Verify it was saved correctly
    const verify = await SecureStore.getItemAsync(USED_TRADE_IDS_KEY);
    const verifyParsed = verify ? JSON.parse(verify) : [];
    console.log("[saveUsedTradeIds] Verification - stored IDs:", verifyParsed);
    if (verifyParsed.length !== usedIds.length) {
      console.warn("[saveUsedTradeIds] WARNING: Saved count doesn't match! Expected:", usedIds.length, "Got:", verifyParsed.length);
    }
  } catch (error) {
    console.error("[saveUsedTradeIds] Error saving:", error);
    // Non-critical error - continue even if save fails
  }
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
    try {
      // Load previously used trade IDs from SecureStore (with daily reset check)
      const previousUsedIds = await checkAndResetDaily();
      console.log("[startEndlessMode] Loaded previousUsedIds:", previousUsedIds);
      console.log("[startEndlessMode] Will exclude", previousUsedIds.length, "trade IDs when fetching first trade");
      
      // Fetch first trade, excluding any previously used today
      let firstTrade;
      try {
        firstTrade = await fetchRandomTrade(previousUsedIds);
        console.log("First trade loaded:", firstTrade?.id);
      } catch (error) {
        // If no trades available, check if it's because all trades have been used today
        if (error.message.includes("No trades are currently available") || 
            error.message === 'NO_TRADES_AVAILABLE') {
          console.log("[startEndlessMode] All trades have been used today");
          throw new Error("ALL_TRADES_USED_TODAY");
        }
        throw error;
      }
      
      if (!firstTrade || !firstTrade.id) {
        throw new Error("Invalid trade data received from server");
      }

      // Update used IDs with the new trade
      const newUsedIds = [...previousUsedIds, firstTrade.id];
      console.log("[startEndlessMode] Updated used IDs:", {
        previousCount: previousUsedIds.length,
        newCount: newUsedIds.length,
        addedTradeId: firstTrade.id,
        allUsedIds: newUsedIds,
      });
      
      // Save to SecureStore immediately
      await saveUsedTradeIds(newUsedIds);

      // Prefetch second trade (excluding all used IDs including the new one)
      let secondTrade = null;
      try {
        secondTrade = await fetchRandomTrade(newUsedIds);
        console.log("Second trade prefetched:", secondTrade?.id);
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
        endlessModeUsedTradeIds: newUsedIds,
        endlessModeHasReset: false,
        endlessModeNextTrade: secondTrade,
      });

      console.log("Endless mode started successfully");
    } catch (error) {
      console.error("Error starting endless mode:", error);
      throw error; // Re-throw so the UI can handle it
    }
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
    
    // Wrap in try-catch to ensure we clear state on error
    try {

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
    // IMPORTANT: Include the current trade being submitted in the exclude list
    // This prevents the same trade from appearing again in the same session
    const currentTradeId = endlessModeCurrentTrade.id;
    const currentUsedIds = [...state.endlessModeUsedTradeIds];
    
    // Ensure current trade is in the exclude list
    const excludeIds = currentUsedIds.includes(currentTradeId) 
      ? currentUsedIds 
      : [...currentUsedIds, currentTradeId];
    
    console.log("[submitEndlessTrade] Current trade being submitted:", currentTradeId);
    console.log("[submitEndlessTrade] Used IDs from state:", currentUsedIds);
    console.log("[submitEndlessTrade] Exclude list (including current):", excludeIds);

    if (!nextTrade) {
      try {
        console.log("[submitEndlessTrade] No prefetched trade, fetching with excludeIds:", excludeIds);
        nextTrade = await fetchRandomTrade(excludeIds);
      } catch (error) {
        console.error("Failed to fetch next trade:", error);
        // If no trades available, this means all trades have been used
        if (error.message.includes("No trades are currently available") || error.message === 'NO_TRADES_AVAILABLE') {
          throw new Error("ALL_TRADES_EXHAUSTED");
        }
        throw error;
      }
      } else {
        console.log("[submitEndlessTrade] Using prefetched trade:", nextTrade.id);
        // CRITICAL: Verify prefetched trade is not in the exclude list
        // The prefetch might have happened before current trade was added to used list
        if (excludeIds.includes(nextTrade.id) || nextTrade.id === currentTradeId) {
          console.warn("[submitEndlessTrade] WARNING: Prefetched trade is already used! Fetching new one.");
          console.warn("[submitEndlessTrade] Prefetched ID:", nextTrade.id, "is in exclude list:", excludeIds);
          try {
            nextTrade = await fetchRandomTrade(excludeIds);
            
            // CRITICAL: Validate the replacement trade is not in exclude list
            // If API returns a trade that's already excluded, all trades are exhausted
            if (!nextTrade || !nextTrade.id) {
              console.error("[submitEndlessTrade] Replacement fetch returned invalid trade");
              throw new Error("ALL_TRADES_EXHAUSTED");
            }
            
            if (excludeIds.includes(nextTrade.id) || nextTrade.id === currentTradeId) {
              console.error("[submitEndlessTrade] ERROR: Replacement trade is also in exclude list! All trades exhausted.");
              console.error("[submitEndlessTrade] Replacement ID:", nextTrade.id, "exclude list:", excludeIds);
              throw new Error("ALL_TRADES_EXHAUSTED");
            }
            
            console.log("[submitEndlessTrade] Replacement trade validated:", nextTrade.id);
          } catch (error) {
            console.error("Failed to fetch replacement trade:", error);
            // If no trades available, this means all trades have been used
            if (error.message === "ALL_TRADES_EXHAUSTED" || 
                error.message.includes("No trades are currently available") || 
                error.message === 'NO_TRADES_AVAILABLE') {
              throw new Error("ALL_TRADES_EXHAUSTED");
            }
            throw error;
          }
        }
      }
      
      // Final validation: Ensure nextTrade is valid and not in exclude list
      if (!nextTrade || !nextTrade.id) {
        console.error("[submitEndlessTrade] ERROR: No valid next trade available");
        throw new Error("ALL_TRADES_EXHAUSTED");
      }
      
      if (excludeIds.includes(nextTrade.id)) {
        console.error("[submitEndlessTrade] ERROR: Next trade is in exclude list! All trades exhausted.");
        throw new Error("ALL_TRADES_EXHAUSTED");
      }

    // Prefetch the trade after next
    let prefetchedNextTrade = null;
    const excludeForPrefetch = [...excludeIds, nextTrade.id];
    try {
      console.log("[submitEndlessTrade] Prefetching next trade, excluding:", excludeForPrefetch);
      prefetchedNextTrade = await fetchRandomTrade(excludeForPrefetch);
      console.log("[submitEndlessTrade] Prefetched trade:", prefetchedNextTrade?.id);
    } catch (error) {
      // If prefetch fails because no trades available, that's okay - we'll fetch on demand
      if (error.message.includes("No trades are currently available") || error.message === 'NO_TRADES_AVAILABLE') {
        console.log("[submitEndlessTrade] All trades will be exhausted after this one. Prefetch skipped.");
      } else {
        console.warn("Failed to prefetch next trade:", error);
      }
    }

    // Update used IDs: include current trade (if not already there) and next trade
    const newUsedIds = excludeIds.includes(nextTrade.id)
      ? excludeIds
      : [...excludeIds, nextTrade.id];
    
    console.log("[submitEndlessTrade] Updated used IDs:", {
      previousCount: currentUsedIds.length,
      excludeCount: excludeIds.length,
      newCount: newUsedIds.length,
      currentTradeId: currentTradeId,
      nextTradeId: nextTrade.id,
      allUsedIds: newUsedIds,
    });
    
    // Save updated used trade IDs to SecureStore
    await saveUsedTradeIds(newUsedIds);

    set({
      endlessModeResults: [...state.endlessModeResults, result],
      endlessModeBalance: newBalance,
      endlessModeTradeCount: state.endlessModeTradeCount + 1,
      endlessModeCorrectCount:
        state.endlessModeCorrectCount + (isCorrect ? 1 : 0),
      endlessModeCurrentTrade: nextTrade,
      endlessModeSelectedBet: null,
      endlessModeUsedTradeIds: newUsedIds,
      endlessModeNextTrade: prefetchedNextTrade,
    });
    } catch (error) {
      // If all trades exhausted, clear current trade to prevent showing stale data
      if (error.message === "ALL_TRADES_EXHAUSTED" || 
          error.message.includes("No trades are currently available")) {
        console.log("[submitEndlessTrade] Clearing current trade - all trades exhausted");
        set({ endlessModeCurrentTrade: null });
      }
      // Re-throw the error so the UI can handle it
      throw error;
    }
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
