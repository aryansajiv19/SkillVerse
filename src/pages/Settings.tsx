import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Github } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useProgress, useUsername } from "@/hooks/useProgress";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="glass-panel space-y-4 rounded-2xl p-6" aria-label={title}>
    <h2 className="text-xl font-bold">{title}</h2>
    {children}
  </section>
);

const Settings = () => {
  const { user, isGuest, linkGitHub, signInWithGitHub, signOut } = useAuth();
  const { stats, resetAll } = useProgress();
  const rename = useUsername();
  const [name, setName] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const github = user?.identities?.find((i) => i.provider === "github")?.identity_data;

  const attempt = (fn: () => Promise<unknown>) => () => fn().catch((e: Error) => toast.error(e.message));

  return (
    <PageShell title="Account" width="max-w-2xl">
      <div className="space-y-6">
        <Section title="Display name">
          <form
            className="flex gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              rename.mutate(name.trim(), {
                onSuccess: () => { toast.success("Name saved"); setName(""); },
                onError: (err) => toast.error(err.message),
              });
            }}
          >
            <Label htmlFor="username" className="sr-only">Display name</Label>
            <Input id="username" value={name} onChange={(e) => setName(e.target.value)} placeholder={stats.username} maxLength={20} />
            <Button type="submit" disabled={!name.trim() || rename.isPending}>Save name</Button>
          </form>
          <p className="text-sm text-muted-foreground">
            Shown on the leaderboard and your <Link className="underline" to={`/u/${stats.username}`}>public profile</Link>. 3–20 letters, numbers, _ or -.
          </p>
        </Section>

        {isGuest ? (
          <Section title="Keep your progress">
            <p className="text-sm text-muted-foreground">
              You're exploring as a guest. Your progress is saved, but only this browser can get back to it.
              Connect GitHub to keep it and pick up on any device.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={attempt(linkGitHub)}><Github className="mr-2 h-4 w-4" />Connect GitHub</Button>
              <Button variant="outline" onClick={attempt(signInWithGitHub)}>I already have an account</Button>
            </div>
            <p className="text-xs text-muted-foreground">Signing in to an existing account switches to it. This guest's progress stays behind.</p>
          </Section>
        ) : (
          <Section title="Signed in">
            <p className="text-sm">
              {github?.user_name ? <>GitHub <span className="font-semibold">@{github.user_name}</span></> : user?.email}
            </p>
            <Button variant="outline" onClick={attempt(signOut)}>Sign out</Button>
          </Section>
        )}

        <Section title="Start over">
          <p className="text-sm text-muted-foreground">Clears every mastered skill and completed challenge on this account. This can't be undone.</p>
          {confirmReset ? (
            <div className="flex flex-wrap gap-3" role="alertdialog" aria-label="Confirm reset">
              <Button
                variant="destructive"
                disabled={resetAll.isPending}
                onClick={() =>
                  resetAll.mutate(undefined, {
                    onSuccess: () => { toast.success("Progress reset"); setConfirmReset(false); },
                    onError: (e) => toast.error(e.message),
                  })
                }
              >
                Yes, reset everything
              </Button>
              <Button variant="outline" autoFocus onClick={() => setConfirmReset(false)}>Keep my progress</Button>
            </div>
          ) : (
            <Button variant="outline" className="border-destructive/60 text-foreground" onClick={() => setConfirmReset(true)}>Reset progress</Button>
          )}
        </Section>
      </div>
    </PageShell>
  );
};

export default Settings;
