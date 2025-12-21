import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

export const DEVICE_ID_KEY = "device_uuid";
export const FRIENDLY_NAME_KEY = "device_friendly_name";
export const CONSENT_KEY = "user_consent_given";

export function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateFriendlyName() {
  const adjectives = [
    "Swift", "Brave", "Clever", "Bold", "Nimble", "Sharp", "Bright", "Quick",
    "Wise", "Fierce", "Calm", "Bold", "Swift", "Lucky", "Mighty", "Royal",
    "Golden", "Silver", "Crimson", "Azure", "Emerald", "Amber", "Violet", "Cobalt"
  ];
  
  const animals = [
    "Tiger", "Eagle", "Fox", "Wolf", "Lion", "Bear", "Hawk", "Falcon",
    "Panther", "Jaguar", "Raven", "Phoenix", "Dragon", "Griffin", "Shark", "Orca",
    "Leopard", "Cheetah", "Lynx", "Cobra", "Viper", "Stallion", "Stag", "Ram"
  ];
  
  const numbers = Math.floor(Math.random() * 999) + 1;
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  
  return `${adjective}${animal}${numbers}`;
}

export default function useDeviceId() {
  const [deviceId, setDeviceId] = useState(null);
  const [friendlyName, setFriendlyName] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function loadOrCreateDeviceId() {
      let hasConsent = false;
      let consentTimeoutId = null;
      
      try {
        // Add timeout for consent check to prevent indefinite loading
        consentTimeoutId = setTimeout(() => {
          if (!isMounted) return;
          console.warn("useDeviceId: Consent check timeout - assuming no consent");
          setLoading(false);
          setDeviceId(null);
          setFriendlyName(null);
        }, 5000);
        
        // First check if user has given consent - use Promise.race for timeout
        console.log("useDeviceId: Checking consent...");
        const consentPromise = SecureStore.getItemAsync(CONSENT_KEY);
        const consentTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Consent check timeout")), 5000)
        );
        const consent = await Promise.race([consentPromise, consentTimeoutPromise]).catch((error) => {
          console.warn("useDeviceId: Consent check failed or timed out:", error.message);
          return null;
        });
        console.log("useDeviceId: Consent value:", consent);
        
        // Clear timeout if operation completes
        if (consentTimeoutId) {
          clearTimeout(consentTimeoutId);
          consentTimeoutId = null;
        }
        
        hasConsent = consent === "true";
        console.log("useDeviceId: Has consent:", hasConsent);

        if (!hasConsent) {
          // No consent given, don't generate or load ID
          setDeviceId(null);
          setFriendlyName(null);
          setLoading(false);
          return;
        }
        
        // Note: We're using Promise.race for individual SecureStore calls instead of a global timeout

        // Consent given, proceed with loading or creating ID
        let id = null;
        let name = null;
        
        try {
          console.log("useDeviceId: Reading device ID and friendly name from SecureStore...");
          
          // Read both values in parallel with individual timeouts
          const readWithTimeout = async (key, timeoutMs = 2000) => {
            try {
              console.log(`useDeviceId: Starting read for ${key}...`);
              const startTime = Date.now();
              const promise = SecureStore.getItemAsync(key);
              const timeout = new Promise((_, reject) => 
                setTimeout(() => {
                  console.warn(`useDeviceId: ${key} read timeout after ${timeoutMs}ms`);
                  reject(new Error(`${key} read timeout`));
                }, timeoutMs)
              );
              const result = await Promise.race([promise, timeout]);
              const duration = Date.now() - startTime;
              console.log(`useDeviceId: ${key} read complete in ${duration}ms, value:`, result ? "exists" : "null");
              return result;
            } catch (error) {
              console.warn(`useDeviceId: ${key} read error:`, error.message);
              return null;
            }
          };
          
          const [deviceIdResult, friendlyNameResult] = await Promise.all([
            readWithTimeout(DEVICE_ID_KEY, 2000),
            readWithTimeout(FRIENDLY_NAME_KEY, 2000)
          ]);
          
          id = deviceIdResult;
          name = friendlyNameResult;
          console.log("useDeviceId: Read values - ID:", id ? "exists" : "null", "Name:", name ? "exists" : "null");
        } catch (readError) {
          console.warn("useDeviceId: Error reading from SecureStore, will generate new values:", readError);
          // Continue to generation logic below
        }

        // Generate UUID if it doesn't exist
        if (!id) {
          id = generateUUID();
          try {
            await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
          } catch (writeError) {
            console.warn("Error writing UUID to SecureStore, using in-memory value:", writeError);
            // Continue with in-memory value
          }
        }

        // Generate friendly name if it doesn't exist
        if (!name) {
          name = generateFriendlyName();
          try {
            await SecureStore.setItemAsync(FRIENDLY_NAME_KEY, name);
          } catch (writeError) {
            console.warn("Error writing friendly name to SecureStore, using in-memory value:", writeError);
            // Continue with in-memory value
          }
        }
        
        // Safeguard: Ensure we always have values if consent exists
        if (!isMounted) {
          console.log("useDeviceId: Component unmounted, skipping state updates");
          return;
        }
        
        if (hasConsent) {
          const finalId = id || generateUUID();
          const finalName = name || generateFriendlyName();
          console.log("useDeviceId: Setting final values - ID:", finalId.substring(0, 8) + "...", "Name:", finalName);
          console.log("useDeviceId: About to call setDeviceId, setFriendlyName, setLoading(false)");
          setDeviceId(finalId);
          setFriendlyName(finalName);
          setLoading(false);
          console.log("useDeviceId: State setters called - Loading complete");
        } else {
          // Shouldn't reach here, but ensure loading is false
          console.log("useDeviceId: No consent, setting loading to false");
          if (isMounted) {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("useDeviceId: Error loading device ID:", error);
        console.error("useDeviceId: Error stack:", error.stack);
        
        // Final safeguard: If consent exists, always generate values (even if all SecureStore operations failed)
        if (hasConsent && isMounted) {
          const id = generateUUID();
          const name = generateFriendlyName();
          console.log("useDeviceId: Error recovery - generating fallback values - ID:", id.substring(0, 8) + "...", "Name:", name);
          setDeviceId(id);
          setFriendlyName(name);
          setLoading(false);
        } else if (isMounted) {
          // Double-check consent in case first check failed
          try {
            const consent = await SecureStore.getItemAsync(CONSENT_KEY);
            if (consent === "true") {
              const id = generateUUID();
              const name = generateFriendlyName();
              setDeviceId(id);
              setFriendlyName(name);
            } else {
              setDeviceId(null);
              setFriendlyName(null);
            }
          } catch (finalError) {
            console.error("Final error checking consent:", finalError);
            // If we can't even check consent, set to null
            setDeviceId(null);
            setFriendlyName(null);
          } finally {
            setLoading(false);
          }
        }
      } finally {
        // Ensure loading is always set to false as a final safeguard
        // (Some paths already set it, but this ensures it's always set)
        // Note: Individual SecureStore calls use Promise.race for timeout handling
      }
    }

    loadOrCreateDeviceId();
    
    // Cleanup function to clear any pending timeouts if component unmounts
    return () => {
      isMounted = false;
      console.log("useDeviceId: Cleanup - component unmounting");
    };
  }, []);

  return { deviceId, friendlyName, loading };
}
