// App chrome. Three layouts:
//   >= 1024px  header pill with icons and labels
//   640-1023   header pill with icons only (tooltips + screen-reader labels)
//   < 640      header keeps the logo and search; destinations move to a bottom tab bar.
// The tab bar's height is published as --bottom-bar-height (index.css) so fixed UI can sit above it.
import { Link, NavLink } from "react-router-dom";
import { Award, GraduationCap, LayoutDashboard, Map, Search, UserRound } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

// eslint-disable-next-line react-refresh/only-export-components
export const navItems = [
  { path: "/", icon: Map, label: "Galaxy" },
  { path: "/learn", icon: GraduationCap, label: "Learn" },
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/leaderboard", icon: Award, label: "Leaderboard" },
  { path: "/settings", icon: UserRound, label: "Account" },
];

/** The command palette is lazy-loaded, so it's opened with an event rather than shared state. */
export const PALETTE_EVENT = "skillverse:open-palette";
// eslint-disable-next-line react-refresh/only-export-components
export const openCommandPalette = () => window.dispatchEvent(new Event(PALETTE_EVENT));

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);
// eslint-disable-next-line react-refresh/only-export-components
export const modKey = isMac ? "⌘" : "Ctrl";

const SearchButton = () => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        onClick={openCommandPalette}
        aria-label="Search skills and pages"
        aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
        className="glass-panel flex h-10 min-w-10 items-center justify-center gap-2 rounded-full px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-[42px] sm:px-3"
      >
        <Search className="h-4 w-4" aria-hidden />
        <span className="hidden xl:inline">Search</span>
        <Kbd className="hidden lg:inline-flex" aria-hidden>{modKey}K</Kbd>
      </button>
    </TooltipTrigger>
    <TooltipContent className="lg:hidden">Search ({modKey}K)</TooltipContent>
  </Tooltip>
);

export const Navigation = ({ solid = false }: { solid?: boolean }) => (
  <>
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4",
        solid && "border-b border-border/40 bg-background/75 backdrop-blur-md",
      )}
    >
      <Link to="/" className="rounded-md font-display text-xl font-extrabold tracking-tight sm:text-2xl">
        Skill<span className="text-[hsl(var(--glow-completed))]" aria-hidden>✦</span>Verse
      </Link>
      <div className="flex items-center gap-2">
        <nav aria-label="Main" className="glass-panel hidden gap-1 rounded-full p-1 sm:flex">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Tooltip key={path}>
              <TooltipTrigger asChild>
                {/* Styled off aria-current: the tooltip's Slot can't merge NavLink's className function */}
                <NavLink
                  to={path}
                  end
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-foreground aria-[current=page]:text-background"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  <span className="sr-only lg:not-sr-only">{label}</span>
                </NavLink>
              </TooltipTrigger>
              <TooltipContent className="lg:hidden">{label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
        <SearchButton />
      </div>
    </header>

    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
    >
      <div className="grid h-14 grid-cols-5">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end
            className="group flex flex-col items-center justify-center gap-1 text-[11px] font-medium leading-none text-muted-foreground outline-none aria-[current=page]:text-foreground"
          >
            <span className="grid h-7 w-12 place-items-center rounded-full transition-colors group-focus-visible:ring-2 group-focus-visible:ring-ring group-aria-[current=page]:bg-foreground group-aria-[current=page]:text-background">
              <Icon className="h-[18px] w-[18px]" aria-hidden />
            </span>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  </>
);
