import React, { useEffect, useRef, useState } from "react";
import { Check, Copy, Link2, MessageCircle, Sparkles } from "lucide-react";
import { WEDDING } from "./config";
import {
  PREFIXES,
  PrefixKey,
  buildDisplayName,
  buildGreeting,
  buildInviteLink,
  buildInviteMessage,
  isValidName,
} from "./guest";

type Generated = { displayName: string; link: string; message: string };

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older / non-secure contexts
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }
}

export default function AdminPage() {
  const [prefix, setPrefix] = useState<PrefixKey>("mr");
  const [guestName, setGuestName] = useState("");
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    document.title = `Invitation Links · ${WEDDING.groomName} & ${WEDDING.brideName}`;
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  // Live preview of the greeting while typing
  const previewName = buildDisplayName(prefix, guestName);

  function showToast(text: string) {
    setToast(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2000);
  }

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidName(guestName)) {
      setError("Please enter a guest name.");
      setGenerated(null);
      return;
    }
    setError(null);
    const displayName = buildDisplayName(prefix, guestName);
    const link = buildInviteLink(window.location.origin, prefix, guestName);
    setGenerated({ displayName, link, message: buildInviteMessage(displayName, link) });
  }

  // Inputs changed after generating → the old link no longer matches, so require regenerating.
  const isStale = generated !== null && generated.displayName !== previewName;
  const canCopy = generated !== null && !isStale;

  async function handleCopy(kind: "link" | "message") {
    if (!generated || !canCopy) return;
    const ok = await copyText(kind === "link" ? generated.link : generated.message);
    showToast(ok ? (kind === "link" ? "Link copied!" : "Message copied!") : "Copy failed — please copy manually");
  }

  const whatsappHref = generated ? `https://wa.me/?text=${encodeURIComponent(generated.message)}` : undefined;

  return (
    <div className="min-h-screen bg-paper text-zinc-800 px-4 py-10 md:py-16">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8 md:mb-10">
          <p className="serif italic text-taupe text-sm md:text-base">Admin</p>
          <h1 className="serif text-3xl md:text-4xl text-umber mt-1">Invitation Link Generator</h1>
          <p className="mt-2 text-sm text-taupe">
            <span className="script text-2xl text-rust align-middle">{WEDDING.groomName}</span>
            <span className="serif italic mx-2">&amp;</span>
            <span className="script text-2xl text-rust align-middle">{WEDDING.brideName}</span>
          </p>
        </header>

        <form
          onSubmit={handleGenerate}
          className="bg-white/70 border border-sand/60 rounded-2xl shadow-sm p-5 md:p-7 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4">
            <label className="block">
              <span className="block text-[11px] uppercase tracking-widest font-bold text-umber/80 mb-1.5">Prefix</span>
              <select
                value={prefix}
                onChange={(e) => setPrefix(e.target.value as PrefixKey)}
                className="w-full rounded-xl border border-sand bg-white px-3 py-2.5 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20"
              >
                {PREFIXES.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-[11px] uppercase tracking-widest font-bold text-umber/80 mb-1.5">Guest Name</span>
              <input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Sanjaya"
                autoComplete="off"
                className="w-full rounded-xl border border-sand bg-white px-3 py-2.5 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20"
              />
            </label>
          </div>

          {/* Greeting preview */}
          <div className="rounded-xl bg-paper/80 border border-sand/50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-widest font-bold text-taupe mb-1">Greeting preview</p>
            <p className="serif text-lg text-umber">
              {previewName ? buildGreeting(previewName) : <span className="text-taupe/70 italic">Dear … ❤️</span>}
            </p>
            {previewName && (
              <p className="serif italic text-sm text-taupe mt-1">
                On the invitation: “We cordially invite {previewName} to celebrate our special day with us.”
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-700 font-medium">{error}</p>}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 bg-sage hover:bg-rust text-white rounded-xl py-3 text-xs uppercase tracking-widest font-bold transition-colors"
          >
            <Sparkles size={16} /> Generate Link
          </button>
        </form>

        {/* Result */}
        <section className="mt-6 bg-white/70 border border-sand/60 rounded-2xl shadow-sm p-5 md:p-7 space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest font-bold text-umber/80 mb-1.5 flex items-center gap-1.5">
              <Link2 size={14} /> Generated Link
            </p>
            {generated ? (
              <a
                href={generated.link}
                target="_blank"
                rel="noreferrer"
                className={`block break-all rounded-xl border px-3 py-2.5 text-sm font-mono ${
                  isStale ? "border-sand/60 text-taupe/70 line-through" : "border-sage/40 bg-sage/5 text-rust hover:underline"
                }`}
              >
                {generated.link}
              </a>
            ) : (
              <p className="rounded-xl border border-dashed border-sand px-3 py-2.5 text-sm text-taupe/80">
                Click “Generate Link” to create the invitation link.
              </p>
            )}
            {isStale && <p className="text-xs text-rust mt-1.5">Details changed — click Generate Link again.</p>}
          </div>

          {generated && !isStale && (
            <div>
              <p className="text-[11px] uppercase tracking-widest font-bold text-umber/80 mb-1.5">Message preview</p>
              <pre className="whitespace-pre-wrap break-words rounded-xl bg-paper/80 border border-sand/50 px-4 py-3 text-sm leading-relaxed font-sans text-zinc-700 max-h-80 overflow-auto">
                {generated.message}
              </pre>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleCopy("link")}
              disabled={!canCopy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-sage text-sage hover:bg-sage hover:text-white py-3 text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <Copy size={15} /> Copy Link Only
            </button>
            <button
              type="button"
              onClick={() => handleCopy("message")}
              disabled={!canCopy}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-umber hover:bg-rust text-white py-3 text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <Copy size={15} /> Copy Full Message
            </button>
          </div>

          {canCopy && whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-bold text-[#1f8f4e] hover:underline"
            >
              <MessageCircle size={15} /> Open in WhatsApp
            </a>
          )}
        </section>
      </div>

      {/* Toast */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2 bg-umber text-white text-sm px-4 py-2.5 rounded-full shadow-xl">
          <Check size={16} /> {toast}
        </div>
      </div>
    </div>
  );
}
