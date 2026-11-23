import { SHEETS_ENDPOINT } from "./config";

/**
 * POST a record to the Apps Script Web App.
 * text/plain keeps it a "simple" CORS request (no preflight, which Apps Script can't answer).
 * Falls back to an opaque no-cors FormData post if the readable request fails.
 */
export async function postToSheet(type: "rsvp" | "wish", data: Record<string, unknown>): Promise<void> {
  if (!SHEETS_ENDPOINT) throw new Error("NOT_CONFIGURED");

  const payload = JSON.stringify({
    type,
    ...data,
    submittedAt: new Date().toISOString(),
    pageUrl: window.location.href,
    userAgent: navigator.userAgent,
  });

  let res: Response;
  try {
    res = await fetch(SHEETS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: payload,
    });
  } catch {
    // Network/CORS failure → opaque fallback (response can't be read, assume delivered).
    const fd = new FormData();
    fd.append("payload", payload);
    await fetch(SHEETS_ENDPOINT, { method: "POST", mode: "no-cors", body: fd });
    return;
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || (json && json.ok === false)) throw new Error(json?.error || `Save failed (${res.status})`);
}
