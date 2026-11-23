// Single source of truth for the couple's details.
// The invitation, the /admin link generator and the WhatsApp message all read from here.
export const WEDDING = {
  groomName: "Sahan",
  brideName: "Shenali",
} as const;

// Google Apps Script Web App URL (ends with /exec). Handles both RSVP and Wishes.
// Set VITE_SHEETS_ENDPOINT (or the older VITE_RSVP_ENDPOINT) in .env.local / your host's env settings.
const env = (import.meta as any).env ?? {};
export const SHEETS_ENDPOINT: string | undefined =
  (env.VITE_SHEETS_ENDPOINT as string | undefined) || (env.VITE_RSVP_ENDPOINT as string | undefined) || undefined;
