// Single source of truth for the couple's details.
// The invitation, the /admin link generator and the WhatsApp message all read from here.
export const WEDDING = {
  groomName: "Sahan",
  brideName: "Shenali",
} as const;

// Google Apps Script Web App URL (ends with /exec). Handles both RSVP and Wishes.
// Hard-coded so the site works without any env setup. VITE_SHEETS_ENDPOINT, if set, overrides it.
const DEFAULT_SHEETS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbzK4AXZp7vbhbdbE-EfZ1i--vUkjpzl4o1duWL3gxp40QsVHgYgGM3DtuiQX9k7rh1n/exec";

const env = (import.meta as any).env ?? {};
export const SHEETS_ENDPOINT: string =
  (env.VITE_SHEETS_ENDPOINT as string | undefined) || DEFAULT_SHEETS_ENDPOINT;
