// Everyone gets a session: visitors are signed in as anonymous guests on first load,
// so progress is saved server-side from the first click. Guests can later attach an
// email + password to keep their account, or sign in to an existing one.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

interface Auth {
  user: User | null;
  isGuest: boolean;
  error: string | null;
  saveAccount: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<Auth | null>(null);

const ensureSession = async () => {
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    ensureSession().catch((e) => setError(e.message));
    return () => data.subscription.unsubscribe();
  }, []);

  const value: Auth = {
    user,
    isGuest: user?.is_anonymous ?? true,
    error,
    saveAccount: async (email, password) => {
      const { error } = await supabase.auth.updateUser({ email, password });
      if (error) throw error;
    },
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      qc.clear();
    },
    signOut: async () => {
      await supabase.auth.signOut();
      qc.clear();
      await ensureSession();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
