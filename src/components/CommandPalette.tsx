// ⌘K / Ctrl+K from anywhere, or the search button in the header. Finds pages, tracks and
// skills (with their state on the map). Enter opens; ⌘/Ctrl+Enter on a skill starts its skill check.
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Blocks, Globe, MessageCircle, Orbit, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { useProgress } from "@/hooks/useProgress";
import { skillById, trackById, tracks } from "@/content/skills";
import { checkIdFor } from "@/content/types";
import type { SkillState } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { PALETTE_EVENT, modKey, navItems } from "./Navigation";
import { openTutor } from "./AIAssistant";

type StarState = "mastered" | "available" | "locked";
const stateOf = (s: SkillState): StarState => (s.mastered ? "mastered" : s.unlocked ? "available" : "locked");
const stateLabel = { mastered: "Mastered", available: "Available", locked: "Locked" };

const pageKeywords: Record<string, string[]> = {
  "/": ["map", "home", "stars"],
  "/learn": ["skills", "challenges", "quiz", "practice"],
  "/dashboard": ["progress", "stats", "achievements", "streak", "xp"],
  "/leaderboard": ["ranking", "players", "top"],
  "/settings": ["settings", "github", "sign in", "sign out", "reset", "name"],
};

/** Same language as the map: filled = mastered, hollow ring = available, small dim dot = locked. */
const StarGlyph = ({ state, hue }: { state: StarState; hue: string }) => (
  <span className="grid h-4 w-4 shrink-0 place-items-center" style={{ ["--track" as string]: hue }} aria-hidden>
    <span
      className={cn(
        "rounded-full",
        state === "mastered" && "h-2.5 w-2.5 bg-[hsl(var(--track))] shadow-[0_0_8px_1px_hsl(var(--track)/0.7)]",
        state === "available" && "h-2.5 w-2.5 border-[1.5px] border-[hsl(var(--track))]",
        state === "locked" && "h-1.5 w-1.5 bg-muted-foreground/70",
      )}
    />
  </span>
);

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const returnFocus = useRef<HTMLElement | null>(null);
  // Set when an action moves focus somewhere else (a new page's heading, the tutor's input),
  // so closing doesn't pull focus back to where the palette was opened from.
  const handedOff = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { skills, mastered, stats } = useProgress();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const show = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(PALETTE_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(PALETTE_EVENT, show);
    };
  }, []);

  const handOff = (action: () => void) => {
    handedOff.current = true;
    setOpen(false);
    action();
  };
  const go = (to: string) => (to === location.pathname + location.search ? setOpen(false) : handOff(() => navigate(to)));
  const takeCheck = (s: SkillState) => go(`/learn?skill=${s.id}&challenge=${checkIdFor(s.id)}`);

  const highlighted = skills.find((s) => s.name === active);
  const unlockAfter = (s: SkillState) => s.requires.filter((r) => !mastered.has(r)).map((r) => skillById.get(r)!.name).join(" and ");
  const pages = [
    ...navItems.map((p) => ({ ...p, keywords: pageKeywords[p.path] })),
    { path: "/about", icon: Blocks, label: "How it's built", keywords: ["about", "architecture", "source", "github", "stack"] },
    ...(stats.username ? [{ path: `/u/${stats.username}`, icon: Globe, label: "Your public profile", keywords: ["profile", "share", stats.username] }] : []),
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        // Radix only restores focus to a <DialogTrigger>; this dialog opens from anywhere.
        onOpenAutoFocus={() => {
          returnFocus.current = document.activeElement as HTMLElement | null;
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          if (!handedOff.current) returnFocus.current?.focus();
          handedOff.current = false;
          setActive("");
        }}
      >
        <DialogTitle className="sr-only">Search SkillVerse</DialogTitle>
        <DialogDescription className="sr-only">
          Find a page, track or skill. Arrow keys move, Enter opens, and {modKey === "⌘" ? "Command" : "Control"} Enter on a skill starts its skill check.
        </DialogDescription>
        <Command
          label="Search SkillVerse"
          loop
          value={active}
          onValueChange={setActive}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && highlighted?.unlocked) {
              e.preventDefault();
              takeCheck(highlighted);
            }
          }}
        >
          <div className="relative">
            <CommandInput placeholder="Search skills, tracks and pages" className="pr-14" />
            <DialogClose
              aria-label="Esc: close search"
              className="absolute right-3 top-1/2 grid min-h-11 min-w-11 sm:min-h-8 sm:min-w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Kbd className="hidden sm:inline-flex">Esc</Kbd>
              <X className="h-4 w-4 sm:hidden" aria-hidden />
            </DialogClose>
          </div>

          <CommandList>
            <CommandEmpty>Nothing matches. Try a skill like React, or a track like Backend.</CommandEmpty>

            <CommandGroup heading="Continue a track">
              {tracks.map((t) => {
                const own = skills.filter((s) => s.track === t.id);
                const next = own.find((s) => s.unlocked && !s.mastered);
                const done = own.every((s) => s.mastered);
                return (
                  <CommandItem
                    key={t.id}
                    value={`${t.name} track`}
                    keywords={[t.constellation]}
                    onSelect={() => go(next ? `/learn?skill=${next.id}` : "/learn")}
                  >
                    <Orbit style={{ color: `hsl(${t.hue})` }} aria-hidden />
                    <span className="truncate">
                      {t.name} <span className="text-muted-foreground">({t.constellation})</span>
                    </span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {next ? `Next: ${next.name}` : done ? "Complete" : "Locked"}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandGroup heading="Pages">
              {pages.map(({ path, icon: Icon, label, keywords }) => (
                <CommandItem key={path} value={label} keywords={keywords} onSelect={() => go(path)}>
                  <Icon className="text-muted-foreground" aria-hidden />
                  {label}
                </CommandItem>
              ))}
              <CommandItem value="Ask the AI tutor" keywords={["ai", "help", "chat", "question", "hint"]} onSelect={() => handOff(openTutor)}>
                <MessageCircle className="text-muted-foreground" aria-hidden />
                Ask the AI tutor
              </CommandItem>
            </CommandGroup>

            <CommandGroup heading="Skills">
              {skills.map((s) => {
                const track = trackById.get(s.track)!;
                const state = stateOf(s);
                return (
                  <CommandItem
                    key={s.id}
                    value={s.name}
                    keywords={[track.name, track.constellation, stateLabel[state]]}
                    onSelect={() => go(`/learn?skill=${s.id}`)}
                    className="group"
                  >
                    <StarGlyph state={state} hue={track.hue} />
                    <span className={cn("truncate", state === "locked" && "text-muted-foreground")}>{s.name}</span>
                    <span className="hidden truncate text-muted-foreground sm:inline">{track.name}</span>
                    <span className={cn("ml-auto shrink-0 text-xs", state === "mastered" ? "text-[hsl(var(--glow-completed))]" : "text-muted-foreground")}>
                      {stateLabel[state]}
                      {state === "locked" && <span className="sr-only">, unlocks after {unlockAfter(s)}</span>}
                    </span>
                    {s.unlocked && (
                      // Pointer shortcut for the highlighted row; keyboard users get ⌘/Ctrl+Enter
                      // (a focusable control can't live inside an option).
                      <span
                        aria-hidden
                        onClick={(e) => {
                          e.stopPropagation();
                          takeCheck(s);
                        }}
                        className="hidden shrink-0 rounded-md border border-foreground/25 px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-foreground hover:text-background group-data-[selected=true]:inline"
                      >
                        Skill check
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>

          {/* Key hints are for keyboards, so phones only get the footer for a locked skill */}
          <div
            className={cn(
              "min-h-10 items-center gap-4 border-t px-4 py-2 text-xs text-muted-foreground",
              highlighted && !highlighted.unlocked ? "flex" : "hidden sm:flex",
            )}
            aria-hidden
          >
            {highlighted && !highlighted.unlocked ? (
              <span className="truncate">
                Unlocks after {unlockAfter(highlighted)}
              </span>
            ) : (
              <>
                <span className="flex items-center gap-1.5"><Kbd>↵</Kbd>open</span>
                {highlighted && (
                  <span className="flex items-center gap-1.5"><Kbd>{modKey}</Kbd><Kbd>↵</Kbd>take the skill check</span>
                )}
              </>
            )}
            <span className="ml-auto hidden items-center gap-1.5 sm:flex"><Kbd>↑</Kbd><Kbd>↓</Kbd>move</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
};
