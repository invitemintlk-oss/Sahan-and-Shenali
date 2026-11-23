import { WEDDING } from "./config";

export const PREFIXES = [
  { key: "mr", label: "Mr." },
  { key: "mrs", label: "Mrs." },
  { key: "miss", label: "Miss" },
  { key: "mr-mrs", label: "Mr. & Mrs." },
  { key: "family", label: "Family" },
  { key: "dear", label: "Dear" },
] as const;

export type PrefixKey = (typeof PREFIXES)[number]["key"];

export function isPrefixKey(value: unknown): value is PrefixKey {
  return PREFIXES.some((p) => p.key === value);
}

/** Collapse whitespace and trim. */
export function cleanName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

/** A usable name must contain at least one letter or digit. */
export function isValidName(name: string): boolean {
  return /[\p{L}\p{N}]/u.test(cleanName(name));
}

/** Remove a title the user may have typed themselves, so "Mr." + "Mr. Sanjaya" never becomes "Mr. Mr. Sanjaya". */
function stripDuplicateTitle(prefix: PrefixKey, name: string): string {
  const patterns: Record<PrefixKey, RegExp | null> = {
    mr: /^mr\.?\s+/i,
    mrs: /^mrs\.?\s+/i,
    miss: /^miss\.?\s+/i,
    "mr-mrs": /^mr\.?\s*(&|and)\s*mrs\.?\s+/i,
    family: null,
    dear: /^dear\s+/i,
  };
  const re = patterns[prefix];
  let out = re ? name.replace(re, "") : name;
  if (prefix === "family") out = out.replace(/\s+(and|&)\s+family$/i, "");
  return cleanName(out);
}

/**
 * Combine prefix + name into the name shown on the site and in the greeting.
 * "Dear" is a message style only — it never appears in the display name,
 * because the greeting itself already starts with "Dear".
 */
export function buildDisplayName(prefix: PrefixKey, rawName: string): string {
  const name = stripDuplicateTitle(prefix, cleanName(rawName));
  if (!name) return "";
  switch (prefix) {
    case "mr":
      return `Mr. ${name}`;
    case "mrs":
      return `Mrs. ${name}`;
    case "miss":
      return `Miss ${name}`;
    case "mr-mrs":
      return `Mr. & Mrs. ${name}`;
    case "family":
      return `${name} and Family`;
    case "dear":
    default:
      return name;
  }
}

export function buildGreeting(displayName: string): string {
  return `Dear ${displayName} ❤️`;
}

/**
 * {baseURL}/{guestName}. The name is URL-encoded; the prefix rides along as ?p=
 * so the invitation can show "Mr. Sanjaya" (omitted for "Dear", which needs none).
 */
export function buildInviteLink(baseUrl: string, prefix: PrefixKey, rawName: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const name = stripDuplicateTitle(prefix, cleanName(rawName));
  const path = `${base}/${encodeURIComponent(name)}`;
  return prefix === "dear" ? path : `${path}?p=${encodeURIComponent(prefix)}`;
}

export function buildInviteMessage(displayName: string, link: string): string {
  return `${buildGreeting(displayName)}

With joyful hearts, we warmly invite you to celebrate one of the most special days of our lives as we begin our journey together.

Please view our wedding invitation and all the event details through the link below 🌐:

${link}

Your presence would truly mean the world to us, and we would be honored to celebrate this beautiful moment together.

With love,
❤️ ${WEDDING.groomName} & ${WEDDING.brideName}`;
}

/** Read the guest from the current URL: /{guestName}?p={prefix}. Returns "" when there is none. */
export function readGuestFromLocation(loc: Location = window.location): string {
  const segment = loc.pathname.replace(/^\/+|\/+$/g, "").split("/")[0] ?? "";
  if (!segment) return "";

  let name = "";
  try {
    name = decodeURIComponent(segment);
  } catch {
    return "";
  }
  name = cleanName(name).slice(0, 80);
  if (!isValidName(name)) return "";

  const p = new URLSearchParams(loc.search).get("p");
  return buildDisplayName(isPrefixKey(p) ? p : "dear", name);
}
