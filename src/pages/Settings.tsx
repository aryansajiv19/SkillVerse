import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useProgress, useUsername } from "@/hooks/useProgress";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="glass-panel space-y-4 rounded-2xl p-6">
    <h2 className="text-xl font-bold">{title}</h2>
    {children}
  </section>
);

const Settings = () => {
  const { user, isGuest, saveAccount, signIn, signOut } = useAuth();
  const { stats, reset } = useProgress();
  const rename = useUsername();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const attempt = (fn: () => Promise<unknown>, success: string) => async (e?: FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    try {
      await fn();
      toast.success(success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const withCredentials = (fn: (email: string, password: string) => Promise<unknown>, success: string) => (e: FormEvent<HTMLFormElement>) => {
    const f = new FormData(e.currentTarget);
    attempt(() => fn(String(f.get("email")), String(f.get("password"))), success)(e);
  };

  return (
    <PageShell title="Account" width="max-w-2xl">
      <div className="space-y-6">
        <Section title="Display name">
          <form
            className="flex gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              rename.mutate(name.trim(), {
                onSuccess: () => { toast.success("Name updated"); setName(""); },
                onError: (err) => toast.error(err.message),
              });
            }}
          >
            <Label htmlFor="username" className="sr-only">Display name</Label>
            <Input id="username" value={name} onChange={(e) => setName(e.target.value)} placeholder={stats.username} maxLength={20} />
            <Button type="submit" disabled={!name.trim() || rename.isPending}>Save name</Button>
          </form>
          <p className="text-sm text-muted-foreground">Shown on the leaderboard. 3–20 letters, numbers, _ or -.</p>
        </Section>

        {isGuest ? (
          <>
            <Section title="Keep your progress">
              <p className="text-sm text-muted-foreground">
                You're exploring as a guest, so your progress lives in this browser's session. Add an email and password to keep it and sign in anywhere.
              </p>
              <form className="space-y-3" onSubmit={withCredentials(saveAccount, "Account saved. You can now sign in anywhere.")}>
                <Label htmlFor="save-email">Email</Label>
                <Input id="save-email" name="email" type="email" autoComplete="email" required />
                <Label htmlFor="save-password">Password</Label>
                <Input id="save-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
                <Button type="submit" disabled={busy}>Save account</Button>
              </form>
            </Section>
            <Section title="Already have an account?">
              <p className="text-sm text-muted-foreground">Signing in switches to that account. Progress made as a guest stays behind.</p>
              <form className="space-y-3" onSubmit={withCredentials(signIn, "Signed in")}>
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" name="email" type="email" autoComplete="email" required />
                <Label htmlFor="signin-password">Password</Label>
                <Input id="signin-password" name="password" type="password" autoComplete="current-password" required />
                <Button type="submit" variant="outline" disabled={busy}>Sign in</Button>
              </form>
            </Section>
          </>
        ) : (
          <Section title="Signed in">
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Button variant="outline" onClick={() => attempt(signOut, "Signed out")()} disabled={busy}>Sign out</Button>
          </Section>
        )}

        <Section title="Start over">
          <p className="text-sm text-muted-foreground">Clears every mastered skill and completed challenge on this account. This can't be undone.</p>
          <Button
            variant="destructive"
            disabled={reset.isPending}
            onClick={() => confirm("Reset all progress? This can't be undone.") &&
              reset.mutate(undefined, { onSuccess: () => toast.success("Progress reset"), onError: (e) => toast.error(e.message) })}
          >
            Reset progress
          </Button>
        </Section>
      </div>
    </PageShell>
  );
};

export default Settings;
