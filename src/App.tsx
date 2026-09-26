import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AIAssistant } from "@/components/AIAssistant";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Learn from "./pages/Learn";
import Leaderboard from "./pages/Leaderboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });

const Gate = ({ children }: { children: React.ReactNode }) => {
  const { user, error } = useAuth();
  if (error)
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="max-w-sm space-y-2">
          <h1 className="text-2xl font-bold">Can't reach the SkillVerse server</h1>
          <p className="text-muted-foreground">{error}. Check your connection and reload the page.</p>
        </div>
      </div>
    );
  if (!user) return <div className="min-h-screen" aria-busy="true" />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Gate>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <AIAssistant />
          </Gate>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
