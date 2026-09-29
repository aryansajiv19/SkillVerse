import { Component, lazy, Suspense, useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/lib/auth";

// Route-level code splitting: three.js only loads with the galaxy, not with a shared profile link.
const Index = lazy(() => import("./pages/Index"));
const Learn = lazy(() => import("./pages/Learn"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Profile = lazy(() => import("./pages/Profile"));
const About = lazy(() => import("./pages/About"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AIAssistant = lazy(() => import("./components/AIAssistant").then((m) => ({ default: m.AIAssistant })));
const CommandPalette = lazy(() => import("./components/CommandPalette").then((m) => ({ default: m.CommandPalette })));

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

const Centered = ({ children }: { children: ReactNode }) => (
  <div className="grid min-h-screen place-items-center p-6 text-center">
    <div className="max-w-sm space-y-3">{children}</div>
  </div>
);

/** Shown after a short delay, so a fast load doesn't flash it. */
const Loading = ({ label }: { label: string }) => (
  <Centered>
    <div role="status" className="space-y-1 duration-300 animate-in fade-in-0 delay-300 fill-mode-both">
      <p className="font-display text-2xl font-extrabold tracking-tight">
        Skill<span className="text-[hsl(var(--glow-completed))]" aria-hidden>✦</span>Verse
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  </Centered>
);

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Centered>
        <h1 className="text-2xl font-bold">Something broke on this page</h1>
        <p className="text-muted-foreground">Reload the page, or head back to the galaxy and try again.</p>
        <Button onClick={() => window.location.assign("/")}>Back to the galaxy</Button>
      </Centered>
    );
  }
}

const Gate = ({ children }: { children: ReactNode }) => {
  const { user, error, retry } = useAuth();
  useEffect(() => {
    if (error) console.error(error);
  }, [error]);
  if (error)
    return (
      <Centered>
        <h1 className="text-2xl font-bold">Can't reach the SkillVerse server</h1>
        <p className="text-muted-foreground">Check your connection, then try again.</p>
        <Button onClick={retry}>Try again</Button>
      </Centered>
    );
  if (!user) return <Loading label="Connecting…" />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster position="top-center" />
        <BrowserRouter>
          <a
            href="#main"
            className="sr-only rounded-md bg-foreground font-medium text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:px-4 focus:py-2"
          >
            Skip to content
          </a>
          <ErrorBoundary>
            <Gate>
              <Suspense fallback={<Loading label="Loading…" />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/learn" element={<Learn />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/u/:username" element={<Profile />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              {/* Chrome loads in parallel with the page and never blanks it while loading */}
              <Suspense fallback={null}>
                <CommandPalette />
                <AIAssistant />
              </Suspense>
            </Gate>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
