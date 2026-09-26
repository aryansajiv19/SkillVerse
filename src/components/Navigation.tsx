import { NavLink, Link } from "react-router-dom";
import { Map, GraduationCap, LayoutDashboard, Award, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { path: "/", icon: Map, label: "Galaxy" },
  { path: "/learn", icon: GraduationCap, label: "Learn" },
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/leaderboard", icon: Award, label: "Leaderboard" },
  { path: "/settings", icon: Settings, label: "Account" },
];

export const Navigation = () => (
  <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
    <Link to="/" className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
      Skill<span className="text-[hsl(var(--glow-completed))]">✦</span>Verse
    </Link>
    <nav aria-label="Main" className="glass-panel flex gap-1 rounded-full p-1">
      {items.map(({ path, icon: Icon, label }) => (
        <NavLink
          key={path}
          to={path}
          end
          title={label}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )
          }
        >
          <Icon className="h-4 w-4" aria-hidden />
          <span className="hidden lg:inline">{label}</span>
          <span className="sr-only lg:hidden">{label}</span>
        </NavLink>
      ))}
    </nav>
  </header>
);
