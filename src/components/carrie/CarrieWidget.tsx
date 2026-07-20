"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Compass,
  Layers,
  MessageCircleQuestion,
  Palette,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { CarrieAvatar, type CarrieEmotion } from "./CarrieAvatar";
import { onCarrie } from "./carrieBus";
import {
  EXPRESSION_EMOTION,
  treeForRoute,
  type CarrieNode,
  type CarrieTree,
} from "./carrieTrees";
import { Select } from "@/components/ui/Select";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useCandidatesAI } from "@/lib/hooks/useCandidatesAI";
import { usePerformanceMode } from "@/lib/hooks/usePerformanceMode";
import { useUiDensity } from "@/lib/dashboard/useUiDensity";
import { setDensity } from "@/lib/dashboard/uiDensityBus";
import { cn } from "@/lib/utils";

interface Msg {
  from: "carrie" | "user";
  text: string;
  emotion?: CarrieEmotion;
  links?: { label: string; href: string }[];
}

type View = "questions" | "actions";

const SLEEP_MS = 90_000; // idle → asleep after this long with no activity

// Career phases the "Change phase" action can switch to (stored hyphenated).
const PHASES = [
  { stage: "student", label: "Student" },
  { stage: "young-adult", label: "Young Adult" },
  { stage: "early-career", label: "Early Career" },
  { stage: "mid-career", label: "Mid-Career" },
  { stage: "senior-career", label: "Senior Career" },
  { stage: "executive", label: "Executive" },
];

/**
 * Carrie — the candidate-side page guide + quick-settings hub. A route-aware
 * question tree (Questions) plus an Actions menu wired into shared settings:
 * switch phase, toggle reduce-motion (same store as Settings), flip the
 * Detailed/Vibrant style live, and a tour placeholder. Idle → asleep; the
 * glass-pill buttons animate only when motion is allowed.
 */
export function CarrieWidget() {
  const pathname = usePathname() ?? "";
  const { data: ai } = useCandidatesAI();
  const [reduceMotion, setReduceMotion] = usePerformanceMode();
  const density = useUiDensity();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("questions");
  const [tree, setTree] = useState<CarrieTree | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [choices, setChoices] = useState<CarrieNode[]>([]);
  const [atRoot, setAtRoot] = useState(true);
  const [emotion, setEmotion] = useState<CarrieEmotion>("idle");
  const [asleep, setAsleep] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const emotionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Idle / asleep lifecycle ──
  const armSleep = useCallback(() => {
    if (sleepTimer.current) clearTimeout(sleepTimer.current);
    sleepTimer.current = setTimeout(() => {
      setAsleep(true);
      setEmotion("offline");
    }, SLEEP_MS);
  }, []);

  const wake = useCallback(() => {
    setAsleep(false);
    setEmotion((e) => (e === "offline" ? "idle" : e));
    armSleep();
  }, [armSleep]);

  /** Show a transient expression; also counts as activity (wakes Carrie). */
  const emote = useCallback(
    (e: CarrieEmotion, ms = 2600) => {
      setAsleep(false);
      armSleep();
      if (emotionTimer.current) clearTimeout(emotionTimer.current);
      setEmotion(e);
      if (e !== "idle") emotionTimer.current = setTimeout(() => setEmotion("idle"), ms);
    },
    [armSleep],
  );

  useEffect(() => {
    armSleep();
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    return () => {
      if (sleepTimer.current) clearTimeout(sleepTimer.current);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [armSleep, wake]);

  const resolveTree = () =>
    treeForRoute(pathname, {
      careerStage: ai?.careerStage,
      onboardingEdit:
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("edit") === "1",
    });

  // App-wide reactions (skill added, task scheduled, …) — react even closed.
  useEffect(() => {
    return onCarrie(({ emotion: e, message }) => {
      emote(e, 3200);
      setMsgs((m) => (open ? [...m, { from: "carrie", text: message, emotion: e }] : m));
      if (!open) {
        setToast(message);
        setTimeout(() => setToast(null), 3200);
      }
    });
  }, [open, emote]);

  const rootConversation = (t: CarrieTree) => {
    setTree(t);
    setMsgs([{ from: "carrie", text: t.intro, emotion: "idle" }]);
    setChoices(t.nodes);
    setAtRoot(true);
  };

  const openPanel = () => {
    rootConversation(resolveTree());
    setView("questions");
    setToast(null);
    emote("listening", 1600);
    setOpen(true);
  };

  // Route/phase change while open → re-root for the new page.
  if (open) {
    const t = resolveTree();
    if (t.title !== tree?.title) rootConversation(t);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [msgs, choices, view]);

  const pick = (node: CarrieNode) => {
    wake();
    const e = EXPRESSION_EMOTION[node.exp];
    setMsgs((m) => [
      ...m,
      { from: "user", text: node.q },
      { from: "carrie", text: node.a, emotion: e, links: node.links },
    ]);
    emote(e, 3000);
    if (node.children?.length) {
      setChoices(node.children);
      setAtRoot(false);
    } else if (!atRoot) {
      setChoices([]);
      setAtRoot(false);
    } else {
      setChoices(tree?.nodes ?? []);
    }
  };

  const backToRoot = () => {
    setChoices(tree?.nodes ?? []);
    setAtRoot(true);
  };

  // ── Actions ──
  const currentStage = ai?.careerStage ?? "";
  const isVibrant = density === "vibrant";
  const anim = reduceMotion ? "" : "transition-all duration-300";

  const applyPhase = async (stage: string) => {
    wake();
    if (!stage || stage === currentStage) return;
    await fetch("/api/me/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ careerStage: stage }),
    }).catch(() => null);
    // Reload so the sidebar, dashboard variant, and Carrie tree all re-read.
    window.location.assign("/candidate/dashboard");
  };

  const startTour = () => {
    wake();
    setView("questions");
    emote("success", 2600);
    setMsgs((m) => [
      ...m,
      {
        from: "carrie",
        text: "A guided tour is coming soon! ✨ For now, tap any question and I'll walk you through what's on this page.",
        emotion: "success",
      },
    ]);
  };

  const pill = cn(
    "flex w-full items-center gap-3 rounded-xl border border-border/15 bg-foreground/5 px-3 py-2.5 text-left backdrop-blur hover:border-luminous/40",
    anim,
  );

  return (
    <>
      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Carrie — page guide"
          className="border-border/20 bg-background/80 fixed bottom-20 right-4 z-50 flex max-h-[72vh] w-80 flex-col overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-2xl"
        >
          <div className="border-border/15 flex shrink-0 items-center gap-2.5 border-b px-3.5 py-2.5">
            <CarrieAvatar emotion={emotion} className="size-9 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">Carrie</p>
              <p className="text-muted-foreground truncate font-mono text-[0.5625rem] uppercase tracking-wider">
                {asleep ? "Dozing — tap to wake" : `Guide · ${tree?.title ?? ""}`}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close Carrie"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Questions | Actions switcher */}
          <div className="border-border/15 shrink-0 border-b px-3.5 py-2.5">
            <SegmentedControl
              aria-label="Carrie menu"
              className="w-full"
              value={view}
              onChange={(v) => {
                wake();
                setView(v);
              }}
              options={[
                { id: "questions", label: "Questions", icon: MessageCircleQuestion },
                { id: "actions", label: "Actions", icon: Wand2 },
              ]}
            />
          </div>

          {view === "questions" ? (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3">
                {msgs.map((m, i) =>
                  m.from === "user" ? (
                    <p key={i} className="bg-luminous/15 text-luminous-soft ml-8 rounded-xl rounded-br-sm px-3 py-2 text-xs">
                      {m.text}
                    </p>
                  ) : (
                    <div key={i} className="flex items-start gap-2">
                      <CarrieAvatar emotion={m.emotion ?? "idle"} className="mt-0.5 size-6 shrink-0" />
                      <div className="min-w-0">
                        <p className="bg-foreground/4 border-border/10 rounded-xl rounded-tl-sm border px-3 py-2 text-xs leading-relaxed">
                          {m.text}
                        </p>
                        {m.links && (
                          <p className="mt-1.5 flex flex-wrap gap-1.5">
                            {m.links.map((l) => (
                              <Link
                                key={l.href}
                                href={l.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                  "border-luminous/30 bg-luminous/10 text-luminous-soft hover:bg-luminous/20 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.6875rem] font-medium",
                                  anim,
                                )}
                              >
                                {l.label} <ArrowUpRight className="size-3" aria-hidden />
                              </Link>
                            ))}
                          </p>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>

              {/* Choice chips */}
              <div className="border-border/15 shrink-0 space-y-1.5 border-t px-3.5 py-3">
                {choices.map((n) => (
                  <button
                    key={n.q}
                    type="button"
                    onClick={() => pick(n)}
                    className={cn(
                      "border-border/15 bg-foreground/2 hover:border-luminous/40 hover:text-foreground text-muted-foreground block w-full rounded-lg border px-3 py-1.5 text-left text-xs",
                      anim,
                    )}
                  >
                    {n.q}
                  </button>
                ))}
                {!atRoot && (
                  <button
                    type="button"
                    onClick={backToRoot}
                    className="text-luminous block w-full px-3 py-1 text-left text-[0.6875rem] font-medium hover:underline"
                  >
                    ← Back to all questions
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Actions — glass pills wired into shared settings */
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3.5">
              {/* 1 · Change phase */}
              <div className={cn("rounded-xl border border-border/15 bg-foreground/5 p-3 backdrop-blur", anim)}>
                <p className="text-muted-foreground flex items-center gap-1.5 font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.14em]">
                  <Layers className="text-luminous size-3" aria-hidden /> Current phase
                </p>
                <Select
                  aria-label="Change career phase"
                  value={currentStage}
                  onChange={(e) => void applyPhase(e.target.value)}
                  wrapperClassName="mt-1.5 w-full"
                  className="w-full"
                >
                  {!currentStage && <option value="">Pick a phase…</option>}
                  {PHASES.map((p) => (
                    <option key={p.stage} value={p.stage}>
                      {p.label}
                    </option>
                  ))}
                </Select>
                <p className="text-muted-foreground/70 mt-1.5 text-[0.625rem]">
                  Switches your dashboard to the chosen phase.
                </p>
              </div>

              {/* 2 · Disable animations */}
              <GlassToggle
                icon={Zap}
                label="Disable animations"
                sub="Reduce motion · saves battery"
                on={reduceMotion}
                onToggle={() => {
                  wake();
                  setReduceMotion(!reduceMotion);
                }}
                anim={anim}
              />

              {/* 3 · Change style */}
              <GlassToggle
                icon={Palette}
                label="Vibrant style"
                sub={isVibrant ? "Compact — details behind ⓘ" : "Detailed — full explanations"}
                on={isVibrant}
                onToggle={() => {
                  wake();
                  void setDensity(isVibrant ? "calm" : "vibrant");
                }}
                anim={anim}
              />

              {/* 4 · Tour mode (placeholder) */}
              <button type="button" onClick={startTour} className={pill}>
                <Compass className="text-luminous size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">Enable tour mode</span>
                  <span className="text-muted-foreground block text-[0.6875rem]">
                    A guided walkthrough
                  </span>
                </span>
                <span className="border-border/20 text-muted-foreground rounded-full border px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-wider">
                  Soon
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reaction toast (panel closed) */}
      {toast && !open && (
        <div className="border-border/20 bg-background/95 fixed bottom-20 right-4 z-50 max-w-64 rounded-xl rounded-br-sm border px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
          {toast}
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        aria-label={open ? "Close Carrie, your page guide" : "Open Carrie, your page guide"}
        onClick={() => {
          wake();
          if (open) setOpen(false);
          else openPanel();
        }}
        className={cn(
          "ring-border/30 bg-background/80 fixed bottom-4 right-4 z-50 size-13 rounded-full shadow-xl ring-1 backdrop-blur",
          reduceMotion ? "" : "transition-transform hover:scale-105",
        )}
      >
        <CarrieAvatar emotion={emotion} bob={!open && !asleep} className="size-full p-0.5" />
      </button>
    </>
  );
}

// ── Glass toggle pill ───────────────────────────────────────────────

function GlassToggle({
  icon: Icon,
  label,
  sub,
  on,
  onToggle,
  anim,
}: {
  icon: typeof Zap;
  label: string;
  sub: string;
  on: boolean;
  onToggle: () => void;
  anim: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border border-border/15 bg-foreground/5 px-3 py-2.5 text-left backdrop-blur hover:border-luminous/40",
        anim,
      )}
    >
      <Icon className="text-luminous size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="text-muted-foreground block truncate text-[0.6875rem]">{sub}</span>
      </span>
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full",
          on ? "bg-luminous" : "bg-border",
          anim,
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white",
            on ? "left-4.5" : "left-0.5",
            anim,
          )}
        />
      </span>
    </button>
  );
}
