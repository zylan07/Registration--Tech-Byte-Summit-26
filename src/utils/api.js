/**
 * Google Apps Script Web App API integration for TECHBYTE SUMMIT 26
 */

// Centralized API constant configured with the real Google Apps Script Web App endpoint
export const API_URL = "https://script.google.com/macros/s/AKfycbyIIyg2C5VOVYKXagutyVlLsMv4xxZ97tiFUbm7R3zzI1KQXpEXmmjCJDacG36YitIR/exec";
export const DEFAULT_API_URL = API_URL;

export function getActiveApiUrl() {
  const envUrl = import.meta?.env?.VITE_APPS_SCRIPT_URL;
  if (envUrl && envUrl.trim() !== "") {
    return envUrl.trim();
  }
  const localStored = typeof window !== "undefined" ? localStorage.getItem("TECHBYTE_EXEC_URL") : null;
  if (localStored && localStored.trim() !== "") {
    return localStored.trim();
  }
  return DEFAULT_API_URL;
}

export function setActiveApiUrl(newUrl) {
  if (typeof window !== "undefined") {
    if (newUrl && newUrl.trim() !== "" && newUrl !== DEFAULT_API_URL) {
      localStorage.setItem("TECHBYTE_EXEC_URL", newUrl.trim());
    } else {
      localStorage.removeItem("TECHBYTE_EXEC_URL");
    }
  }
}

/**
 * Submits the registration payload to Google Apps Script Web App.
 * Uses text/plain;charset=utf-8 to prevent CORS preflight OPTIONS failures.
 *
 * @param {Object} payload The formatted backend payload
 * @returns {Promise<Object>} Backend response
 */
export async function submitRegistration(payload) {
  const apiUrl = getActiveApiUrl();

  // Validate endpoint configuration
  if (!apiUrl || apiUrl === "PASTE_EXEC_URL_HERE" || !apiUrl.includes("/exec")) {
    throw new Error(
      "The Google Apps Script Web App URL has not been configured yet. Please configure your /exec URL."
    );
  }

  // Safe debug payload structure per specification (no Base64, no PII)
  if (import.meta?.env?.DEV) {
    const transactionKeys = payload.transactionScreenshots
      ? Object.keys(payload.transactionScreenshots)
      : payload.registrations?.[0]?.transactionScreenshots
      ? Object.keys(payload.registrations[0].transactionScreenshots)
      : [];

    console.log("[TECHBYTE SUMMIT 26] Submitting Registration:", {
      registrationMode: payload.registrationMode,
      sameTeamAcrossEvents: payload.sameTeamAcrossEvents,
      events: payload.registrations ? payload.registrations.map((r) => r.event) : [],
      teamCount: payload.registrations?.length || 0,
      transactionScreenshotMemberKeys: transactionKeys
    });
  }

  const maxAttempts = 4;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok && response.status !== 200) {
        const isRetryableHttp = [429, 500, 502, 503, 504].includes(response.status);
        if (isRetryableHttp && attempt < maxAttempts) {
          const delay = Math.pow(2, attempt - 1) * 1000 + Math.floor(Math.random() * 500);
          console.warn(`[TECHBYTE SUMMIT 26] HTTP ${response.status} on attempt ${attempt}. Retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
      }

      let result;
      try {
        result = await response.json();
      } catch (jsonErr) {
        if (attempt < maxAttempts) {
          const delay = Math.pow(2, attempt - 1) * 1000 + Math.floor(Math.random() * 500);
          console.warn(`[TECHBYTE SUMMIT 26] Non-JSON response on attempt ${attempt}. Retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw new Error(
          "The server returned an unreadable response. Please check that the Google Apps Script Web App is deployed as 'Anyone' and returns valid JSON."
        );
      }

      if (import.meta?.env?.DEV) {
        console.log("[TECHBYTE SUMMIT 26] Apps Script Response (Attempt " + attempt + "):", result);
      }

      if (result && result.success === true) {
        // Ensure response has valid registrations array
        if (!Array.isArray(result.registrations) || result.registrations.length === 0) {
          if (result.registrationId) {
            result.registrations = [{
              event: payload.registrations?.[0]?.event || "Event",
              registrationId: result.registrationId
            }];
          } else {
            throw new Error(
              result.message || "Registration accepted, but no registration ID was returned. Please contact support."
            );
          }
        }
        return result;
      }

      // Check if failure is marked retryable (e.g., lock contention or high volume)
      const isRetryableError = result?.retryable === true ||
        (result?.message && (
          result.message.includes("high volume") ||
          result.message.includes("busy") ||
          result.message.includes("Lock timeout") ||
          result.message.includes("concurrently")
        ));

      if (isRetryableError && attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000 + Math.floor(Math.random() * 500);
        console.warn(`[TECHBYTE SUMMIT 26] Retryable error on attempt ${attempt}: ${result.message}. Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      // Non-retryable error (validation error, etc.)
      throw new Error(result?.message || "Registration could not be completed. Please try again.");
    } catch (err) {
      lastError = err;
      // Do not retry validation errors
      if (err.message && (
        err.message.includes("required") ||
        err.message.includes("Missing") ||
        err.message.includes("Invalid") ||
        err.message.includes("Unknown event") ||
        err.message.includes("The Google Apps Script Web App URL has not been configured")
      )) {
        throw err;
      }

      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000 + Math.floor(Math.random() * 500);
        console.warn(`[TECHBYTE SUMMIT 26] Network error on attempt ${attempt}: ${err.message}. Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      throw new Error(
        "Something went wrong while submitting your registration. Please check your internet connection or verify the Web App deployment and try again."
      );
    }
  }

  throw lastError || new Error("Registration could not be completed after several attempts. Please try again.");
}
