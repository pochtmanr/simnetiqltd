// Analytics consent for the public site. Google Analytics is loaded, and events
// are sent, only while the stored choice is "granted".

export type ConsentChoice = "granted" | "denied";

const CONSENT_KEY = "simnetiq_analytics_consent";
const CLIENT_ID_KEY = "simnetiq_client_id";
const CHANGE_EVENT = "simnetiq:consent-change";
export const OPEN_EVENT = "simnetiq:consent-open";

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function subscribeConsent(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function clearAnalyticsData(): void {
  try {
    localStorage.removeItem(CLIENT_ID_KEY);
  } catch {
    // Storage unavailable: nothing was stored.
  }
  const host = window.location.hostname;
  const domains = [host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const cookie of document.cookie.split("; ")) {
    const name = cookie.split("=")[0];
    if (!name.startsWith("_ga")) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`;
    }
    document.cookie = `${name}=; Max-Age=0; path=/`;
  }
}

export function writeConsent(choice: ConsentChoice): void {
  const previous = readConsent();
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    return;
  }
  if (choice === "denied" && previous === "granted") {
    // The Google tag is already running on this page; remove what it stored and
    // reload so it is gone, not just hidden.
    clearAnalyticsData();
    window.location.reload();
    return;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function openConsentSettings(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}
