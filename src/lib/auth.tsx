// Everyone gets a session: first-time visitors are signed in as anonymous guests, so
// progress is saved server-side from the first click. Guests keep their account by
// linking GitHub (same user id, same progress), or sign in with GitHub on another device.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

interface Auth {
  user: User | null;
  isGuest: boolean;
  error: string | null;
  retry: () => void;
  /** Guest → permanent account, keeping progress. Redirects to GitHub. */
  linkGitHub: () => Promise<void>;
  /** Switch to an existing GitHub-backed account. Redirects to GitHub. */
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<Auth | null>(null);

// Tokens the server no longer honours (account purged, session revoked): start over as a guest.
const isDeadSession = (status?: number) => status === 401 || status === 403 || status === 404;

let inflight: Promise<void> | null = null;

/**
 * Makes sure there's a valid session, creating a guest only when there's truly none.
 * Network failures surface as errors instead of silently replacing a guest's account.
 * Deduplicated so React StrictMode's double effects can't create two guests.
 */
const ensureSession = () =>
  (inflight ??= (async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) {
      const { error: userError } = await supabase.auth.getUser();
      if (!userError) return;
      if (!isDeadSession(userError.status)) throw userError;
      await supabase.auth.signOut({ scope: "local" });
    }
    const { error: anonError } = await supabase.auth.signInAnonymously();
    if (anonError) throw anonError;
  })().finally(() => {
    inflight = null;
  }));

const oauthRedirect = () => `${window.location.origin}/settings`;

const friendly = (e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  return /provider is not enabled|Unsupported provider/i.test(message)
    ? "GitHub sign-in isn't set up on this deployment yet."
    : message;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  const start = useCallback(() => {
    setError(null);
    ensureSession().catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      // Signed out anywhere (this tab, another tab, or a revoked refresh token): become a guest again.
      // Deferred: calling auth methods inside this callback can deadlock supabase-js.
      if (event === "SIGNED_OUT") setTimeout(start, 0);
    });
    start();
    return () => data.subscription.unsubscribe();
  }, [start]);

  const value: Auth = {
    user,
    isGuest: user?.is_anonymous ?? true,
    error,
    retry: start,
    linkGitHub: async () => {
      const { error } = await supabase.auth.linkIdentity({ provider: "github", options: { redirectTo: oauthRedirect() } });
      if (error) throw new Error(friendly(error));
    },
    signInWithGitHub: async () => {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: oauthRedirect() } });
      if (error) throw new Error(friendly(error));
    },
    signOut: async () => {
      qc.clear();
      await supabase.auth.signOut(); // SIGNED_OUT → new guest session
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
