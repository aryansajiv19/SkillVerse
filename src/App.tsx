import { Component, lazy, Suspense, type ReactNode } from "react";
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

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

const Centered = ({ children }: { children: ReactNode }) => (
  <div className="grid min-h-screen place-items-center p-6 text-center">
    <div className="max-w-sm space-y-3">{children}</div>
  </div>
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
        <p className="text-muted-foreground">{this.state.error.message}</p>
        <Button onClick={() => window.location.assign("/")}>Back to the galaxy</Button>
      </Centered>
    );
  }
}

const Gate = ({ children }: { children: ReactNode }) => {
  const { user, error, retry } = useAuth();
  if (error)
    return (
      <Centered>
        <h1 className="text-2xl font-bold">Can't reach the SkillVerse server</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={retry}>Try again</Button>
      </Centered>
    );
  if (!user) return <div className="min-h-screen" aria-busy="true" aria-label="Loading" />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster position="top-center" />
        <BrowserRouter>
          <ErrorBoundary>
            <Gate>
              <Suspense fallback={<div className="min-h-screen" aria-busy="true" aria-label="Loading" />}>
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
