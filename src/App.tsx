import React, { useState, ReactNode, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useMotionValue,
  useTransform,
} from "motion/react";
import {
  HelpCircle,
  MapPin,
  Clock,
  Heart,
  CheckCircle2,
  Flower2,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
} from "lucide-react";
import { SHEETS_ENDPOINT } from "./config";
import { postToSheet, fetchWishes, Wish } from "./sheets";

// FlipCard Component with 3D Tilt Effect + Premium Mobile Tap Hint
function FlipCard({
  front,
  back,
  className,
  containerClassName,
  rounded = "rounded-[2rem]",
  ...motionProps
}: {
  front: ReactNode;
  back: ReactNode;
  className?: string;
  containerClassName?: string;
  rounded?: string;
  [key: string]: any;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);

  const springConfig = { damping: 20, stiffness: 300 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  useEffect(() => {
    const mql = window.matchMedia("(hover: none) and (pointer: coarse)");

    const update = () => setIsTouchDevice(mql.matches);
    update();

    // Safari iOS compatibility
    if (typeof mql.addEventListener === "function") mql.addEventListener("change", update);
    else (mql as any).addListener?.(update);

    return () => {
      if (typeof mql.removeEventListener === "function") mql.removeEventListener("change", update);
      else (mql as any).removeListener?.(update);
    };
  }, []);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
    setIsFlipped(false);
  }

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-no-flip]")) return;

    setIsFlipped((prev) => !prev);
  }

  return (
    <motion.div
      {...motionProps}
      ref={cardRef}
      className={`perspective-1000 cursor-pointer relative ${containerClassName || ""}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        if (!isTouchDevice) setIsFlipped(true);
      }}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        rotateX: isFlipped ? 0 : springRotateX,
        rotateY: isFlipped ? 0 : springRotateY,
      }}
    >
      <motion.div
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className={`w-full h-full transform-style-3d relative ${className || ""}`}
        style={{ WebkitTransformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className={`absolute inset-0 backface-hidden flip-face w-full h-full ${rounded} overflow-hidden shadow-2xl border border-white/40 ring-1 ring-black/5`}
          style={{ transform: "rotateY(0deg) translateZ(1px)", WebkitTransform: "rotateY(0deg) translateZ(1px)" }}
        >
          {front}
          <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-white/30 rounded-tl-lg" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r border-white/30 rounded-br-lg" />
        </div>

        {/* Back */}
        <div
          style={{ transform: "rotateY(180deg) translateZ(1px)", WebkitTransform: "rotateY(180deg) translateZ(1px)" }}
          className={`absolute inset-0 backface-hidden flip-face w-full h-full bg-paper border border-sage/20 ${rounded} flex flex-col justify-center items-center text-center p-3 md:p-8 shadow-2xl overflow-hidden`}
        >
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] pointer-events-none" />
          <div className="absolute top-5 left-5 w-10 h-10 border-t-2 border-l-2 border-sage/10 rounded-tl-xl" />
          <div className="absolute bottom-5 right-5 w-10 h-10 border-b-2 border-r-2 border-sage/10 rounded-br-xl" />
          <div className="relative z-10 w-full h-full flex flex-col py-4 overflow-y-auto overflow-x-hidden ios-scroll">{back}</div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isTouchDevice && !isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.4 } }}
            transition={{ duration: 0.4 }}
            className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none z-50"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="flex items-center gap-2 bg-black/35 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/25 shadow-xl"
            >
              <span className="relative flex items-center justify-center w-4 h-4 shrink-0">
                <motion.span
                  animate={{ scale: [1, 2.2], opacity: [0.7, 0] }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full bg-white/70"
                />
                <span className="relative w-2 h-2 rounded-full bg-white shadow-sm" />
              </span>
              <span
                className="text-white text-[9px] uppercase tracking-[0.2em] font-bold whitespace-nowrap"
                style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.18em" }}
              >
                Tap to reveal
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Gold monogram crest — S / Y
function Monogram({ className = "" }: { className?: string }) {
  const gid = React.useId().replace(/:/g, "");
  const octA = "181.3,133.7 133.7,181.3 66.3,181.3 18.7,133.7 18.7,66.3 66.3,18.7 133.7,18.7 181.3,66.3";
  const octB = "188,100 162.2,162.2 100,188 37.8,162.2 12,100 37.8,37.8 100,12 162.2,37.8";
  return (
    <svg viewBox="0 0 200 200" className={className} aria-label="Sahan and Shenali monogram" role="img">
      <defs>
        <linearGradient id={`gold-${gid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D8B57A" />
          <stop offset="50%" stopColor="#A8804A" />
          <stop offset="100%" stopColor="#D8B57A" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#gold-${gid})`}>
        <circle cx="100" cy="100" r="88" strokeWidth="2.2" />
        <circle cx="100" cy="100" r="81" strokeWidth="0.8" opacity="0.7" />
        <polygon points={octA} strokeWidth="1" opacity="0.85" />
        <polygon points={octB} strokeWidth="1" opacity="0.85" />
        <line x1="66" y1="101" x2="134" y2="101" strokeWidth="1.2" />
      </g>
      <text x="100" y="90" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="50" fill={`url(#gold-${gid})`}>
        S
      </text>
      <text x="100" y="146" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="50" fill={`url(#gold-${gid})`}>
        S
      </text>
    </svg>
  );
}

function OrnamentDivider({ className = "", tone = "text-sage" }: { className?: string; tone?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${tone} ${className}`}>
      <div className="h-px w-10 md:w-16 bg-gradient-to-r from-transparent to-current opacity-50" />
      <svg viewBox="0 0 16 16" className="w-2.5 h-2.5 opacity-70" fill="currentColor">
        <path d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z" />
      </svg>
      <div className="h-px w-10 md:w-16 bg-gradient-to-l from-transparent to-current opacity-50" />
    </div>
  );
}

function RealisticPetal({ size = 20, className = "" }: { size?: number; className?: string }) {
  const organicPetal = "M15 30C15 30 0 25 0 15C0 5 10 0 15 0C20 0 30 5 30 15C30 25 15 30 15 30Z";

  return (
    <motion.div
      animate={{
        rotateX: [0, 45, -45, 0],
        rotateY: [0, 180, 360],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{ width: size, height: size }}
      className={className}
    >
      <svg width="100%" height="100%" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="petalGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#B23A6B" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#8E5A7E" stopOpacity="0.65" />
          </radialGradient>
        </defs>
        <path
          d={organicPetal}
          fill="url(#petalGrad)"
          style={{ filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.05))" }}
        />
      </svg>
    </motion.div>
  );
}

type Attendance = "yes" | "no";

function RSVPForm({ invitedAs }: { invitedAs: string }) {
  const endpoint = SHEETS_ENDPOINT;

  const [name, setName] = useState(invitedAs);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }
    if (!attendance) {
      setErrorMessage("Please select Attending or Not Attending.");
      return;
    }
    if (!endpoint) {
      setErrorMessage("RSVP saving is not configured yet.");
      return;
    }

    setSubmitting(true);
    try {
      await postToSheet("rsvp", { name: name.trim(), attendance, invitedAs });
      setSuccessMessage(
        attendance === "yes" ? "Thank you! We can't wait to celebrate with you." : "Thank you for letting us know. You'll be missed!",
      );
    } catch {
      setErrorMessage("Could not submit RSVP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const choice = (value: Attendance, label: string) => (
    <button
      type="button"
      data-no-flip
      onClick={() => setAttendance(value)}
      aria-pressed={attendance === value}
      className={`py-3 md:py-2.5 rounded-xl text-[10px] md:text-xs uppercase tracking-widest font-bold border transition-colors ${
        attendance === value
          ? value === "yes"
            ? "bg-sage text-white border-sage"
            : "bg-umber text-white border-umber"
          : "bg-white/40 text-sage border-sage/30"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div data-no-flip className="w-full cursor-auto my-auto">
      <CheckCircle2 size={24} className="text-sage mb-2 md:mb-4 mx-auto opacity-70 md:w-8 md:h-8" />
      <h4 className="serif text-2xl md:text-3xl text-sage mb-2 md:mb-3 text-center">RSVP</h4>
      <p className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-widest mb-4 md:mb-6 text-center leading-relaxed">
        Please let us know by
        <br />
        21.07.2027
      </p>

      <form onSubmit={submit} className="space-y-4 px-1 md:px-2 max-w-sm mx-auto">
        <input
          data-no-flip
          value={name}
          onChange={(ev) => setName(ev.target.value)}
          placeholder="Your name"
          maxLength={100}
          className="w-full rounded-xl border border-sage/20 bg-white/60 px-3 py-2.5 text-xs md:text-sm text-zinc-700 outline-none focus:border-sage/50"
        />

        <div className="grid grid-cols-2 gap-2">
          {choice("yes", "Attending")}
          {choice("no", "Not Attending")}
        </div>

        {errorMessage && <p className="text-[10px] md:text-xs text-red-700 font-semibold">{errorMessage}</p>}
        {successMessage && <p className="text-[10px] md:text-xs text-sage font-bold">{successMessage}</p>}

        <button
          type="submit"
          data-no-flip
          disabled={submitting}
          className="w-full bg-sage hover:bg-umber text-white py-3 rounded-xl text-[10px] md:text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit RSVP"}
        </button>

        {!endpoint && (
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Admin setup needed: set <span className="font-bold">VITE_SHEETS_ENDPOINT</span> to your Google Apps Script URL.
          </p>
        )}
      </form>
    </div>
  );
}

function WishesSection({ defaultName }: { defaultName: string }) {
  const [name, setName] = useState(defaultName);
  const [message, setMessage] = useState("");
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    fetchWishes()
      .then((w) => {
        if (alive) setWishes(w);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    const n = name.trim();
    const m = message.trim();
    if (!n || !m) {
      setStatus({ ok: false, text: "Please enter your name and a wish." });
      return;
    }
    setSubmitting(true);
    try {
      await postToSheet("wish", { name: n, message: m, invitedAs: defaultName });
      setWishes((prev) => [{ name: n, message: m, submittedAt: new Date().toISOString() }, ...prev]);
      setMessage("");
      setStatus({ ok: true, text: "Thank you for your lovely wishes!" });
    } catch {
      setStatus({ ok: false, text: "Could not send your wish. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="relative bg-paper/90 backdrop-blur-sm rounded-[2rem] shadow-2xl border border-white/40 ring-1 ring-black/5 p-6 md:p-10 overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] pointer-events-none" />
        <div className="relative z-10">
          <div className="text-center mb-6 md:mb-8">
            <Heart className="mx-auto text-sage/70 mb-2" size={26} />
            <h3 className="serif text-3xl md:text-5xl text-umber">Wishes for the Couple</h3>
            <OrnamentDivider className="mt-3" tone="text-taupe" />
            <p className="serif italic text-taupe text-sm md:text-lg mt-3">Leave a few words of love for Sahan &amp; Shenali</p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={80}
              className="w-full rounded-xl border border-sage/20 bg-white/60 px-4 py-3 text-sm text-zinc-700 outline-none focus:border-sage/50"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your wishes…"
              rows={4}
              maxLength={1000}
              className="w-full rounded-xl border border-sage/20 bg-white/60 px-4 py-3 text-sm text-zinc-700 outline-none focus:border-sage/50 resize-none"
            />
            {status && <p className={`text-xs font-semibold ${status.ok ? "text-sage" : "text-red-700"}`}>{status.text}</p>}
            <button
              type="submit"
              disabled={submitting || !SHEETS_ENDPOINT}
              className="w-full inline-flex items-center justify-center gap-2 bg-sage hover:bg-rust text-white py-3 rounded-xl text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-60"
            >
              <Send size={14} /> {submitting ? "Sending..." : "Send Wishes"}
            </button>
          </form>

          {wishes.length > 0 && (
            <div className="mt-8 space-y-3 max-h-96 overflow-y-auto pr-1 ios-scroll">
              {wishes.map((w, i) => (
                <div key={`${w.submittedAt}-${i}`} className="rounded-2xl bg-white/60 border border-sand/40 px-4 py-3 text-left">
                  <p className="serif text-base md:text-lg text-zinc-700 leading-relaxed whitespace-pre-line break-words">“{w.message}”</p>
                  <p className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-sage mt-2">— {w.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

export default function App({ guestName = "" }: { guestName?: string }) {
  const [isFlapOpen, setIsFlapOpen] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const updateSize = () => setIsSmallScreen(mediaQuery.matches);
    updateSize();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateSize);
      return () => mediaQuery.removeEventListener("change", updateSize);
    }

    // iOS Safari < 14
    mediaQuery.addListener(updateSize);
    return () => mediaQuery.removeListener(updateSize);
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setPrefersReducedMotion(motionQuery.matches);
    updateMotion();
    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", updateMotion);
      return () => motionQuery.removeEventListener("change", updateMotion);
    }
    motionQuery.addListener(updateMotion);
    return () => motionQuery.removeListener(updateMotion);
  }, []);

  const isIOS =
    typeof navigator !== "undefined" &&
    (/iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1));

  const reduceEffects = prefersReducedMotion || isIOS;

  const handleOpen = () => {
    setIsFlapOpen(true);
    setTimeout(() => {
      setIsOpened(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1200);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = isMuted;

    if (isMuted) {
      audio.pause();
      return;
    }

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // iOS/Safari may block playback until a user gesture; the button tap will retry.
      });
    }
  }, [isMuted]);

  return (
    <div
      className="min-h-screen bg-paper text-zinc-800 selection:bg-sage/20 overflow-x-hidden relative"
    >
      <audio ref={audioRef} src="/song.mp3" loop preload="auto" />

      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-sage origin-left z-[1000]" style={{ scaleX }} />

      <motion.button
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsMuted((m) => !m)}
        className="fixed bottom-6 right-6 z-[500] w-12 h-12 rounded-full bg-sage text-white shadow-2xl flex items-center justify-center backdrop-blur-md border border-white/20"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} className="animate-pulse" />}
      </motion.button>

      <AnimatePresence>
        {!isOpened && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, delay: 0.5 } }}
            className="fixed inset-0 z-[100] bg-paper/95 backdrop-blur-md flex flex-col items-center justify-center p-6 overflow-hidden"
          >
            {/* soft vignette + fine double frame for an editorial, elegant feel */}
            <div className="absolute inset-0 pointer-events-none z-[1] bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(78,31,69,0.14)_100%)]" />
            <div className="absolute inset-3 md:inset-6 border border-taupe/30 rounded-[1.25rem] pointer-events-none z-[1]" />
            <div className="absolute inset-[18px] md:inset-[34px] border border-taupe/15 rounded-[1rem] pointer-events-none z-[1]" />

            {!reduceEffects && (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] md:w-[90vw] md:h-[90vw] rounded-full border-2 border-sage/10 border-dashed pointer-events-none z-0 opacity-50"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] md:w-[70vw] md:h-[70vw] rounded-full border border-sage/10 pointer-events-none z-0 opacity-40 flex items-center justify-center p-8"
                >
                  <div className="w-full h-full rounded-full border-[0.5px] border-sage/5" />
                </motion.div>

                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-[80vw] md:w-[600px] h-[80vw] md:h-[600px] bg-sage/20 rounded-full blur-[80px] md:blur-[120px] pointer-events-none z-0"
                />
              </>
            )}

            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              <motion.div
                animate={{
                  x: ["-10%", "10%", "-10%"],
                  y: ["-5%", "5%", "-5%"],
                  opacity: [0.6, 0.9, 0.6],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-[30%] -left-[20%] w-[140%] h-[140%] rounded-full bg-[radial-gradient(circle,rgba(178,58,107,0.45)_0%,transparent_60%)] blur-3xl"
              />
              <motion.div
                animate={{
                  x: ["10%", "-10%", "10%"],
                  y: ["5%", "-5%", "5%"],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-[30%] -right-[20%] w-[140%] h-[140%] rounded-full bg-[radial-gradient(circle,rgba(142,90,126,0.4)_0%,transparent_60%)] blur-3xl"
              />

              {!reduceEffects &&
                [...Array(18)].map((_, i) => (
                  <motion.div
                    key={`dust-${i}`}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -Math.random() * 500 - 300],
                      x: [0, (Math.random() - 0.5) * 200],
                      rotate: [0, Math.random() * 360],
                      opacity: [0, Math.random() * 0.5 + 0.2, 0],
                      scale: [0.5, Math.random() * 1 + 0.5, 0.5],
                    }}
                    transition={{
                      duration: 10 + Math.random() * 20,
                      repeat: Infinity,
                      delay: Math.random() * 10,
                      ease: "easeInOut",
                    }}
                  >
                    {i % 4 === 0 ? (
                      <Flower2 className="text-sage/20 w-4 h-4 md:w-6 md:h-6" />
                    ) : (
                      <div
                        className="rounded-full shadow-[0_0_15px_rgba(178,58,107,0.4)]"
                        style={{
                          backgroundColor: i % 2 === 0 ? "#B23A6B" : "#8E2457",
                          width: Math.random() * 6 + 2 + "px",
                          height: Math.random() * 6 + 2 + "px",
                          filter: `blur(${Math.random() * 1}px)`,
                        }}
                      />
                    )}
                  </motion.div>
                ))}

              {!reduceEffects &&
                [...Array(10)].map((_, i) => {
                  const isHeart = i % 2 === 0;
                  const size = isHeart ? Math.random() * 20 + 10 : Math.random() * 25 + 15;
                  return (
                    <motion.div
                      key={`loading-falling-${i}`}
                      className="absolute pointer-events-none z-10"
                      initial={{ top: "-10%", left: `${Math.random() * 100}%`, rotate: 0, opacity: 0 }}
                      animate={{
                        top: "110%",
                        left: [
                          `${Math.random() * 100}%`,
                          `${Math.random() * 100 + (Math.random() - 0.5) * 20}%`,
                          `${Math.random() * 100}%`,
                        ],
                        rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                        opacity: [0, 0.6, 0],
                      }}
                      transition={{
                        duration: 15 + Math.random() * 15,
                        repeat: Infinity,
                        delay: Math.random() * 10,
                        ease: "linear",
                      }}
                    >
                      {isHeart ? (
                        <Heart className="text-sage" fill="currentColor" size={size} />
                      ) : (
                        <RealisticPetal size={size} />
                      )}
                    </motion.div>
                  );
                })}

              {!reduceEffects &&
                [...Array(6)].map((_, i) => (
                  <motion.div
                    key={`bokeh-${i}`}
                    className="absolute rounded-full mix-blend-soft-light"
                    style={{
                      backgroundColor: i % 2 === 0 ? "#8E5A7E" : "#FBF1F4",
                      opacity: 0.3,
                      width: Math.random() * 150 + 100 + "px",
                      height: Math.random() * 150 + 100 + "px",
                      left: `${Math.random() * 100}%`,
                      bottom: `-20%`,
                      filter: `blur(${Math.random() * 20 + 30}px)`,
                    }}
                    animate={{
                      y: [0, -1200],
                      x: [(Math.random() - 0.5) * 400, (Math.random() - 0.5) * 400],
                      opacity: [0, 0.4, 0],
                    }}
                    transition={{
                      duration: 25 + Math.random() * 35,
                      repeat: Infinity,
                      delay: Math.random() * 20,
                      ease: "linear",
                    }}
                  />
                ))}
            </div>

            {/* elegant heading */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.6, delay: 0.3, ease: "easeOut" }}
              className="relative z-10 text-center mb-8 md:mb-12 px-4 pointer-events-none"
            >
              <p className="serif italic text-sm md:text-lg text-taupe tracking-[0.15em]">The wedding of</p>
              <h1 className="mt-2 md:mt-3 flex items-baseline justify-center gap-3 md:gap-5 leading-none">
                <span className="script text-[3.2rem] sm:text-6xl md:text-8xl text-rust drop-shadow-[0_2px_6px_rgba(142,36,87,0.15)]">Sahan</span>
                <span className="serif italic text-2xl md:text-4xl text-taupe">&amp;</span>
                <span className="script text-[3.2rem] sm:text-6xl md:text-8xl text-rust drop-shadow-[0_2px_6px_rgba(142,36,87,0.15)]">Shenali</span>
              </h1>
              <OrnamentDivider className="mt-4 md:mt-6" tone="text-taupe" />
              <p className="serif mt-3 md:mt-4 text-xs md:text-base uppercase tracking-[0.45em] text-umber font-medium">
                21 · August · 2027
              </p>
              {guestName && (
                <p className="serif italic mt-4 md:mt-5 text-sm md:text-lg text-umber/90">
                  Specially for <span className="not-italic font-semibold text-rust">{guestName}</span>
                </p>
              )}
            </motion.div>

            <motion.div
              layoutId="envelope-box"
              style={{ perspective: 1500 }}
              animate={!reduceEffects && !isFlapOpen ? { y: [0, -8, 0] } : {}}
              transition={!reduceEffects ? { duration: 5, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }}
              className="relative w-full max-w-xl h-64 sm:h-72 md:h-[380px] rounded-[1.75rem] shadow-[0_34px_80px_-22px_rgba(58,20,52,0.55)] z-10 overflow-hidden"
            >
              {/* envelope material */}
              <div className="absolute inset-0 bg-gradient-to-b from-sage via-sage/90 to-rust" />
              <div className="absolute inset-0 opacity-25 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/16 via-transparent to-umber/25 pointer-events-none" />
              <div className="absolute inset-[10px] rounded-[1.35rem] border border-sand/40 pointer-events-none" />

              {/* bottom pocket */}
              <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-umber/40 via-umber/15 to-transparent clip-path-envelope-bottom pointer-events-none" />

              {/* top flap */}
              <motion.div
                initial={{ rotateX: 0 }}
                animate={{ rotateX: isFlapOpen ? 180 : 0, opacity: isFlapOpen ? 0 : 1 }}
                transition={{ duration: 1, ease: [0.3, 0.1, 0.2, 1] }}
                style={{ transformOrigin: "top", backfaceVisibility: "hidden" }}
                className="absolute top-0 left-0 right-0 h-[55%] z-20 clip-path-envelope overflow-hidden pointer-events-none"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-sage to-rust" />
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/18 via-transparent to-umber/30" />
              </motion.div>

              {!isFlapOpen && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 z-30 cursor-pointer"
                  onClick={handleOpen}
                  role="button"
                  aria-label="Open the invitation"
                >
                  {/* wax seal at the flap tip */}
                  <motion.div
                    animate={!reduceEffects ? { scale: [1, 1.04, 1] } : {}}
                    transition={!reduceEffects ? { repeat: Infinity, duration: 3, ease: "easeInOut" } : { duration: 0 }}
                    className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 group"
                  >
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-full p-1 bg-gradient-to-br from-rust to-umber shadow-[0_14px_34px_-10px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-500">
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-[#A8346A] to-[#5E1E4C] shadow-[inset_0_-6px_14px_rgba(0,0,0,0.35),inset_0_4px_10px_rgba(255,255,255,0.18)] flex items-center justify-center border border-white/10">
                        <div className="w-[78%] h-[78%] rounded-full border border-sand/40 flex items-center justify-center">
                          <span className="serif text-paper/90 text-xl md:text-3xl tracking-wider leading-none">
                            S<span className="italic text-sand/90 mx-0.5">&amp;</span>S
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* label on the pocket */}
                  <div className="absolute bottom-5 md:bottom-8 left-0 right-0 flex flex-col items-center gap-1.5 text-center">
                    <span className="serif text-paper text-sm md:text-xl tracking-[0.45em] uppercase drop-shadow">
                      The Invitation
                    </span>
                    <motion.span
                      animate={!reduceEffects ? { opacity: [0.6, 1, 0.6] } : {}}
                      transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                      className="text-paper/85 text-[9px] md:text-[11px] tracking-[0.35em] uppercase"
                    >
                      Tap the seal to open
                    </motion.span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/background1.png"
          alt=""
          className="w-full h-full object-cover opacity-[0.35] md:opacity-[0.45]"
          style={{ filter: "hue-rotate(-45deg) saturate(1.05)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-paper/40 via-transparent to-paper/40" />
      </div>

      <motion.main
        initial={false}
        animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: 100 }}
        transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
        className="max-w-[1600px] mx-auto px-4 py-10 sm:py-12 md:px-12 md:py-24 flex flex-col gap-10 md:gap-16 relative z-10 min-h-screen"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isOpened ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.8 }}
          className="text-center space-y-4 md:space-y-8 mt-4 md:mt-12"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 1, duration: 1 }}
            className="flex items-center justify-center gap-4 text-sage/60"
          >
            <div className="h-px w-8 md:w-16 bg-current opacity-30" />
            <p className="text-[10px] md:text-sm uppercase tracking-[0.6em] font-bold">With joy in our hearts</p>
            <div className="h-px w-8 md:w-16 bg-current opacity-30" />
          </motion.div>

          <h1 className="flex flex-col items-center px-2">
            <span className="serif italic text-3xl sm:text-5xl md:text-[8rem] text-sage font-light leading-tight drop-shadow-sm mb-1 md:mb-6">
              You're Invited!
            </span>
            <span className="serif text-sm sm:text-base md:text-4xl text-umber tracking-[0.15em] md:tracking-[0.3em] uppercase font-light">
              to the wedding of
            </span>
          </h1>

          <div className="flex flex-row items-center justify-center gap-2 sm:gap-4 md:gap-16 mt-4 md:mt-8 relative w-full px-2">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-32 bg-sage/5 blur-3xl rounded-full" />

            <motion.h2 whileHover={{ scale: 1.05 }} className="script text-[13vw] sm:text-6xl md:text-9xl text-sage drop-shadow-lg relative z-10 leading-none">
              Sahan
            </motion.h2>

            <div className="relative flex items-center justify-center shrink-0">
              <div className="h-px w-6 md:w-24 bg-sage/20 hidden md:block" />
              <div className="relative mx-1 md:mx-4">
                <Heart className="text-sage/40 w-5 h-5 sm:w-7 sm:h-7 md:w-10 md:h-10 animate-pulse" fill="currentColor" />
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-sage/20 blur-xl rounded-full"
                />
              </div>
              <div className="h-px w-6 md:w-24 bg-sage/20 hidden md:block" />
            </div>

            <motion.h2 whileHover={{ scale: 1.05 }} className="script text-[13vw] sm:text-6xl md:text-9xl text-sage drop-shadow-lg relative z-10 leading-none">
              Shenali
            </motion.h2>
          </div>

          <div className="w-24 md:w-32 h-px bg-gradient-to-r from-transparent via-sage/40 to-transparent mx-auto mt-8" />

          {guestName && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ delay: 1.4, duration: 1 }}
              className="max-w-xl mx-auto px-4 pt-2"
            >
              <p className="serif text-base sm:text-lg md:text-2xl text-umber/90 leading-relaxed">
                We cordially invite
                <span className="block script text-4xl sm:text-5xl md:text-6xl text-rust my-1 md:my-2 leading-tight break-words">
                  {guestName}
                </span>
                to celebrate our special day with us.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Opened envelope with the invitation card lifted fully out — no flap overlaps the text */}
        <div className="flex justify-center w-full mb-8 mt-10 md:mt-24">
          {!isOpened ? (
            <div className="w-full max-w-3xl h-[640px]" />
          ) : (
            <motion.div
              layoutId="envelope-box"
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-3xl relative cursor-default pt-16 md:pt-24 pb-[150px] md:pb-[210px]"
            >
              {/* ambient glow */}
              <div className="absolute inset-x-8 top-[20%] h-56 bg-sage/20 blur-[80px] rounded-full pointer-events-none" />

              {/* envelope back + opened flap (behind the card) */}
              <div className="absolute bottom-0 left-0 right-0 h-[230px] md:h-[320px] rounded-b-[2rem] z-0 shadow-[0_24px_70px_-12px_rgba(58,20,52,0.55)]">
                <div className="absolute inset-0 rounded-b-[2rem] bg-gradient-to-b from-umber via-rust/60 to-sienna/70" />
                <div className="absolute inset-0 rounded-b-[2rem] opacity-20 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                <div
                  className="absolute left-0 right-0 bottom-full h-[120px] md:h-[180px] bg-gradient-to-t from-rust to-sage"
                  style={{ clipPath: "polygon(0 100%, 50% 0, 100% 100%)" }}
                >
                  <div className="absolute inset-0 opacity-25 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-umber/30 to-white/10" />
                </div>
              </div>

              {/* invitation card */}
              <motion.div
                initial={{ y: 160, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1.4, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 mx-3 sm:mx-8 md:mx-16"
              >
                <div className="relative bg-paper rounded-[1.4rem] md:rounded-[1.75rem] shadow-[0_-18px_60px_rgba(58,20,52,0.18),0_10px_30px_rgba(0,0,0,0.08)] border border-sand/50 overflow-hidden">
                  {/* paper + frames */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
                    <div className="absolute inset-[10px] border border-taupe/35 rounded-[1rem] md:rounded-[1.3rem]" />
                    <div className="absolute inset-[15px] border border-sand/40 rounded-[0.8rem] md:rounded-[1.1rem]" />
                    {[
                      ["top-4 left-4", "rotate-0"],
                      ["top-4 right-4", "rotate-90"],
                      ["bottom-4 left-4", "-rotate-90"],
                      ["bottom-4 right-4", "rotate-180"],
                    ].map(([pos, rot], i) => (
                      <div key={i} className={`absolute ${pos} w-8 h-8 md:w-10 md:h-10`}>
                        <svg viewBox="0 0 28 28" fill="none" className={`w-full h-full ${rot} opacity-60`}>
                          <path d="M2 2 C2 2, 14 2, 14 14" stroke="#A8804A" strokeWidth="0.8" />
                          <path d="M2 2 C8 2, 2 8, 2 14" stroke="#A8804A" strokeWidth="0.8" />
                          <circle cx="4" cy="4" r="1.3" fill="#B23A6B" opacity="0.7" />
                        </svg>
                      </div>
                    ))}
                  </div>

                  {/* content — the bottom padding is the part tucked inside the envelope pocket */}
                  <div className="relative z-10 px-6 pt-8 pb-[100px] sm:px-10 md:px-14 md:pt-12 md:pb-[130px] flex flex-col items-center text-center">
                    <Monogram className="w-20 h-20 md:w-28 md:h-28" />

                    <p className="serif italic text-taupe text-sm md:text-lg mt-4 md:mt-5">Together with their families</p>

                    <div className="mt-3 md:mt-4 space-y-1">
                      <p className="serif text-[13px] sm:text-sm md:text-lg uppercase tracking-[0.2em] text-umber font-medium">
                        Mr. &amp; Mrs. Prince Perera
                      </p>
                      <p className="serif italic text-taupe text-sm md:text-base">and</p>
                      <p className="serif text-[13px] sm:text-sm md:text-lg uppercase tracking-[0.2em] text-umber font-medium">
                        Mr. &amp; Mrs. Roshan Fernando
                      </p>
                    </div>

                    <p className="serif text-sm md:text-lg text-umber/85 leading-relaxed mt-4 md:mt-5 max-w-[30ch]">
                      request the pleasure of your company to celebrate the marriage of their children
                    </p>

                    <div className="mt-4 md:mt-6 flex flex-col sm:flex-row items-center justify-center gap-0 sm:gap-5 leading-none">
                      <span className="script text-[3.2rem] sm:text-6xl md:text-7xl text-rust">Sahan</span>
                      <span className="serif italic text-2xl md:text-3xl text-taupe my-1 sm:my-0">&amp;</span>
                      <span className="script text-[3.2rem] sm:text-6xl md:text-7xl text-rust">Shenali</span>
                    </div>

                    <OrnamentDivider className="mt-5 md:mt-7" tone="text-taupe" />

                    {/* date block */}
                    <div className="mt-4 md:mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6 w-full max-w-md">
                      <p className="serif text-xs md:text-base uppercase tracking-[0.25em] text-umber border-y border-taupe/40 py-2">
                        Saturday
                      </p>
                      <div className="flex flex-col items-center px-1">
                        <span className="serif text-[11px] md:text-sm uppercase tracking-[0.3em] text-taupe">August</span>
                        <span className="serif text-5xl md:text-6xl text-rust font-medium leading-none my-1">21</span>
                        <span className="serif text-[11px] md:text-sm uppercase tracking-[0.3em] text-taupe">2027</span>
                      </div>
                      <p className="serif text-xs md:text-base uppercase tracking-[0.25em] text-umber border-y border-taupe/40 py-2">
                        4:00 PM
                      </p>
                    </div>

                    <div className="mt-5 md:mt-7">
                      <p className="serif text-sm md:text-lg uppercase tracking-[0.22em] text-umber font-medium">St. Sebastian&rsquo;s Church</p>
                      <p className="serif italic text-taupe text-sm md:text-base mt-0.5">Katuwapitiya, Negombo</p>
                    </div>

                    <div className="mt-4 md:mt-5 pt-4 md:pt-5 border-t border-taupe/25 w-full max-w-sm">
                      <p className="serif italic text-taupe text-sm md:text-base">followed by the reception at</p>
                      <p className="serif text-sm md:text-lg uppercase tracking-[0.22em] text-umber font-medium mt-1">Ranowell Hotel</p>
                      <p className="serif italic text-taupe text-sm md:text-base mt-0.5">Kochchikade, Negombo &middot; 7:00 PM</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* front pocket (in front of the card's tucked bottom) */}
              <div className="absolute bottom-0 left-0 right-0 h-[230px] md:h-[320px] z-20 rounded-b-[2rem] overflow-hidden pointer-events-none">
                <div
                  className="absolute inset-0 bg-gradient-to-br from-umber via-rust/90 to-sienna/85"
                  style={{ clipPath: "polygon(0 0, 50% 58%, 0 100%)" }}
                >
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                </div>
                <div
                  className="absolute inset-0 bg-gradient-to-bl from-umber via-rust/90 to-sienna/85"
                  style={{ clipPath: "polygon(100% 0, 50% 58%, 100% 100%)" }}
                >
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                </div>
                <div
                  className="absolute inset-0 bg-gradient-to-t from-umber to-rust"
                  style={{ clipPath: "polygon(0 100%, 50% 50%, 100% 100%)" }}
                >
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                </div>
                <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center gap-1">
                  <div className="w-14 h-px bg-sand/50" />
                  <p className="serif italic text-sand/80 text-[10px] md:text-xs tracking-[0.4em] uppercase">With Love · 2027</p>
                  <div className="w-14 h-px bg-sand/50" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bento Grid Layout - Flipped Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-10 relative">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full h-full col-span-2 lg:col-span-2"
          >
            <div className="w-full h-[220px] md:h-[350px] lg:h-[350px] relative overflow-hidden rounded-[2rem] shadow-2xl border border-white/40 ring-1 ring-black/5">
              <div className="w-full h-full bg-[#FBF1F4] p-2 md:p-8 flex flex-col items-center justify-center text-center space-y-2 md:space-y-4 relative group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-40 pointer-events-none" />
                <div className="relative z-10 space-y-2 md:space-y-8 scale-[0.9] md:scale-100">
                  <div className="space-y-1">
                    <span className="serif italic text-[14px] md:text-2xl text-sage/70">Our Wedding Date</span>
                    <div className="w-full h-px bg-sage/20" />
                  </div>

                  <div className="flex flex-col items-center">
                    <p className="text-[8px] md:text-xs uppercase tracking-[0.4em] text-zinc-400 font-black mb-1 md:mb-2">Saturday</p>
                    <div className="relative inline-block px-6 md:px-8 py-1 md:py-2 border-y border-sage/30">
                      <p className="serif text-5xl md:text-8xl font-medium text-sage leading-none">21</p>
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -top-1 -right-1 text-[#8E2457]"
                      >
                        <Sparkles size={12} className="md:w-4 md:h-4" />
                      </motion.div>
                    </div>
                    <p className="serif text-sm md:text-2xl font-light tracking-[0.2em] mt-2 md:mt-3">AUGUST</p>
                  </div>

                  <div className="pt-1">
                    <p className="text-[7px] md:text-xs uppercase tracking-[0.4em] md:tracking-[0.5em] font-black text-sage/40">
                      Twenty Twenty Seven
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-4 bg-paper clip-path-[polygon(0%_100%,_5%_80%,_10%_100%,_15%_80%,_20%_100%,_25%_80%,_30%_100%,_35%_80%,_40%_100%,_45%_80%,_50%_100%,_55%_80%,_60%_100%,_65%_80%,_70%_100%,_75%_80%,_80%_100%,_85%_80%,_90%_100%,_95%_80%,_100%_100%)] opacity-50" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full h-full col-span-2 lg:col-span-2"
          >
            <FlipCard
              containerClassName="w-full h-[380px] md:h-[350px] lg:h-[350px]"
              front={
                <div className="w-full h-full bg-[#FBF1F4] p-6 flex flex-col justify-center items-center text-center relative group overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-sage/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 space-y-3 md:space-y-6">
                    <div className="flex flex-col items-center gap-1">
                      <p className="serif italic text-lg md:text-2xl text-umber group-hover:scale-110 transition-transform">Kindly</p>
                      <h3 className="serif text-2xl md:text-4xl tracking-[0.3em] font-medium text-umber">RSVP</h3>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      className="group-hover:scale-110 transition-transform duration-500"
                    >
                      <Monogram className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 drop-shadow-md" />
                    </motion.div>
                    <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-zinc-400 font-bold mt-1">by 21.07.2027</p>
                  </div>
                </div>
              }
              back={
                <RSVPForm invitedAs={guestName} />
              }
            />
          </motion.div>



          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="w-full h-full col-span-2 lg:col-span-2"
          >
            <FlipCard
              containerClassName="w-full h-[400px] md:h-[350px] lg:h-[350px]"
              front={
                <div className="w-full h-full relative group">
                  <img
                    src="/Ballroom-2-768x512.jpg"
                    alt="Wedding venues"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    style={{ filter: "hue-rotate(-40deg) saturate(0.9)" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-umber/80 via-umber/30 to-umber/10" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    <p className="serif text-[10px] md:text-xs uppercase tracking-[0.4em] text-white/85 mb-2 flex items-center gap-2">
                      <span className="w-6 h-px bg-white/50" />
                      The Venues
                      <span className="w-6 h-px bg-white/50" />
                    </p>
                    <h3 className="serif text-2xl md:text-4xl text-white leading-tight drop-shadow-md">
                      St. Sebastian&rsquo;s Church
                    </h3>
                    <p className="serif italic text-white/80 text-sm md:text-base mt-1">Katuwapitiya &middot; 4:00 PM</p>
                    <div className="my-3 md:my-4 w-10 h-px bg-white/50" />
                    <h3 className="serif text-2xl md:text-4xl text-white leading-tight drop-shadow-md">Ranowell Hotel</h3>
                    <p className="serif italic text-white/80 text-sm md:text-base mt-1">Negombo &middot; 7:00 PM</p>
                  </div>
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                    <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/60 shadow-lg text-sage">
                      <MapPin size={16} className="animate-bounce" />
                      <p className="serif text-[10px] md:text-sm tracking-[0.2em] font-bold uppercase">Negombo</p>
                    </div>
                  </div>
                </div>
              }
              back={
                <div className="w-full flex flex-col items-center gap-4 md:gap-5 px-2 my-auto">
                  <MapPin size={24} className="text-sage opacity-70 md:w-8 md:h-8" />
                  {[
                    {
                      label: "Church Ceremony · 4:00 PM",
                      name: "St. Sebastian’s Church",
                      address: "Katuwapitiya, Negombo",
                      href: "https://www.google.com/maps/search/?api=1&query=St.%20Sebastian%27s%20Church%20Katuwapitiya%20Negombo",
                      button: "Church Map",
                    },
                    {
                      label: "Reception · 7:00 PM",
                      name: "Ranowell Hotel",
                      address: "162/4 Chilaw Road, Kochchikade, Negombo",
                      href: "https://www.google.com/maps/search/?api=1&query=Ranowell%20Hotel%2C%20162%2F4%20Chilaw%20Road%2C%20Kochchikade%2C%20Negombo",
                      button: "Hotel Map",
                    },
                  ].map((v, i) => (
                    <div key={v.name} className={`w-full max-w-sm ${i > 0 ? "pt-4 md:pt-5 border-t border-sage/15" : ""}`}>
                      <p className="text-[9px] md:text-[11px] uppercase tracking-[0.3em] font-bold text-taupe">{v.label}</p>
                      <h4 className="serif text-xl md:text-3xl text-sage mt-1">{v.name}</h4>
                      <p className="text-[10px] md:text-xs text-zinc-500 tracking-wider mt-1">{v.address}</p>
                      <motion.a
                        data-no-flip
                        href={v.href}
                        target="_blank"
                        rel="noreferrer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block mt-2 md:mt-3 px-5 py-2 md:px-7 md:py-2.5 bg-sage text-white rounded-full text-[9px] md:text-xs font-bold uppercase tracking-widest hover:bg-umber transition-colors"
                      >
                        {v.button}
                      </motion.a>
                    </div>
                  ))}
                </div>
              }
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="w-full h-full col-span-2 lg:col-span-2"
          >
            <FlipCard
              containerClassName="w-full h-[300px] md:h-[350px] lg:h-[350px]"
              front={
                <div className="w-full h-full relative group overflow-hidden">
                  <img
                    src="/time.png"
                    alt="Timeline"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-20">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} whileHover={{ scale: 1, opacity: 1 }} className="bg-white/10 backdrop-blur-lg p-6 rounded-full border border-white/20">
                      <Clock size={32} className="text-white" />
                    </motion.div>
                    <p className="serif text-white text-3xl md:text-5xl italic tracking-widest mt-6 drop-shadow-lg">Event Timeline</p>
                    <div className="mt-4 flex gap-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/50" />
                      ))}
                    </div>
                  </div>

                  <div className="absolute top-0 bottom-0 left-4 w-px bg-white/20" />
                  <div className="absolute top-0 bottom-0 left-6 w-px bg-white/10" />
                  <div className="absolute top-0 bottom-0 right-4 w-px bg-white/20" />
                  <div className="absolute top-0 bottom-0 right-6 w-px bg-white/10" />
                </div>
              }
              back={
                <div className="w-full h-full flex flex-col justify-center items-center px-4 md:px-8">
                  <Clock size={24} className="text-sage mb-4 md:mb-6 opacity-70 md:w-8 md:h-8" />
                  <h4 className="serif text-2xl md:text-3xl text-sage mb-4 md:mb-8">Timeline</h4>

                  <div className="w-full max-w-sm space-y-5 md:space-y-7 text-left">
                    {[
                      { time: "4:00 PM", title: "Church Ceremony", sub: "St. Sebastian’s Church, Katuwapitiya" },
                      { time: "7:00 PM", title: "Wedding Reception", sub: "Ranowell Hotel, Negombo" },
                    ].map((t) => (
                      <div key={t.time} className="flex items-start gap-3 md:gap-4">
                        <span className="serif text-sage font-bold text-xs md:text-base w-14 md:w-20 text-right shrink-0 pt-0.5">{t.time}</span>
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-sage shrink-0" />
                        <div>
                          <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider">{t.title}</p>
                          <p className="serif text-[11px] md:text-sm italic text-zinc-500">{t.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              }
            />
          </motion.div>
        </div>

        <WishesSection defaultName={guestName} />

        <motion.footer
          initial={{ opacity: 0 }}
          animate={isOpened ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.5, delay: 2 }}
          className="text-center pt-12 pb-12 space-y-6"
        >
          <div className="flex items-center justify-center gap-6 text-sage/40">
            <div className="h-px w-16 bg-current" />
            <span className="text-xs uppercase tracking-[0.6em] font-medium">Est. 2027</span>
            <div className="h-px w-16 bg-current" />
          </div>
          <p className="serif italic text-zinc-500 text-xl max-w-lg mx-auto leading-relaxed">
            "Love brought us together, made more beautiful with your presence"
          </p>
          <p className="serif text-sage/60 text-sm italic">We can't wait to celebrate with you</p>

          <div className="pt-6 mt-2 border-t border-taupe/20 max-w-md mx-auto">
            <p className="text-[#A8804A] text-xs mt-2 font-sans tracking-wider leading-relaxed">
              Want a beautiful wedding website like this? Create yours with{" "}
              <a
                target="_blank"
                rel="noreferrer"
                className="text-rust font-semibold underline underline-offset-4 decoration-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                href="https://wa.me/94707819074"
              >
                invitemint
              </a>
            </p>
          </div>

        </motion.footer>
      </motion.main>

      {/* Heavy background motion removed for iOS stability */}
    </div>
  );
}