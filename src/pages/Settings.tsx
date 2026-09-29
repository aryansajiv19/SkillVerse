import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Github } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useProgress, useUsername } from "@/hooks/useProgress";

// Mirrors the profiles.username check constraint, so most mistakes never reach the server.
const USERNAME = /^[A-Za-z0-9_-]{3,20}$/;

/** Supabase sends OAuth failures (e.g. a GitHub account already linked elsewhere) back in the URL. */
const readOAuthError = () => {
  const params = new URLSearchParams(`${window.location.search.slice(1)}&${window.location.hash.slice(1)}`);
  const description = params.get("error_description");
  if (!description) return null;
  return params.get("error_code") === "identity_already_exists"
    ? "That GitHub account already has a SkillVerse account. Use \"I already have an account\" to switch to it."
    : `GitHub didn't connect: ${description}`;
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="glass-panel space-y-4 rounded-2xl p-5 sm:p-6" aria-label={title}>
    <h2 className="text-xl font-bold">{title}</h2>
    {children}
  </section>
);

const Settings = () => {
  const { user, isGuest, linkGitHub, signInWithGitHub, signOut } = useAuth();
  const { stats, resetAll } = useProgress();
  const rename = useUsername();
  const [draft, setDraft] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [oauthError] = useState(readOAuthError);
  const navigate = useNavigate();
  const resetButton = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);
  const github = user?.identities?.find((i) => i.provider === "github")?.identity_data;

  const name = (draft ?? stats.username).trim();
  const changed = !!stats.username && name !== stats.username;

  // Shown once; drop it from the URL so a reload doesn't repeat it.
  useEffect(() => {
    if (oauthError) navigate("/settings", { replace: true });
  }, [oauthError, navigate]);

  // Leaving the confirmation (either answer) puts focus back on the button that opened it.
  useEffect(() => {
    if (!confirmReset && wasConfirming.current) resetButton.current?.focus();
    wasConfirming.current = confirmReset;
  }, [confirmReset]);

  const attempt = (fn: () => Promise<unknown>) => () => fn().catch((e: Error) => toast.error(e.message));

  const saveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!USERNAME.test(name)) return setNameError("Use 3–20 letters, numbers, _ or -.");
    rename.mutate(name, {
      onSuccess: () => {
        toast.success("Name saved");
        setDraft(null);
      },
      onError: (err) => setNameError(err.message),
    });
  };

  return (
    <PageShell title="Account" width="max-w-2xl">
      <div className="space-y-6">
        <Section title="Display name">
          <form className="space-y-2" onSubmit={saveName} noValidate>
            <Label htmlFor="username" className="sr-only">Display name</Label>
            <div className="flex flex-col gap-3 min-[360px]:flex-row">
              <Input
                id="username"
                value={draft ?? stats.username}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setNameError(null);
                }}
                maxLength={20}
                autoComplete="nickname"
                spellCheck={false}
                aria-invalid={!!nameError}
                aria-describedby="username-help"
                className="aria-[invalid=true]:border-destructive"
              />
              <Button type="submit" disabled={!changed || rename.isPending} className="shrink-0">
                {rename.isPending ? "Saving…" : "Save name"}
              </Button>
            </div>
            <p id="username-help" className={nameError ? "text-sm text-destructive" : "text-sm text-muted-foreground"} aria-live="polite">
              {nameError ?? (
                <>
                  Shown on the leaderboard and your{" "}
                  <Link className="underline underline-offset-4 hover:text-foreground" to={`/u/${stats.username}`}>public profile</Link>.
                  3–20 letters, numbers, _ or -.
                </>
              )}
            </p>
          </form>
        </Section>

        {isGuest ? (
          <Section title="Keep your progress">
            <p className="text-sm text-muted-foreground">
              You're exploring as a guest. Your progress is saved, but only this browser can get back to it.
              Connect GitHub to keep it and pick up on any device.
            </p>
            {oauthError && (
              <p className="rounded-xl border border-destructive/50 p-3 text-sm" role="alert">{oauthError}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button onClick={attempt(linkGitHub)}><Github aria-hidden />Connect GitHub</Button>
              <Button variant="outline" onClick={attempt(signInWithGitHub)}>I already have an account</Button>
            </div>
            <p className="text-xs text-muted-foreground">Signing in to an existing account switches to it. This guest's progress stays behind.</p>
          </Section>
        ) : (
          <Section title="Signed in">
            <div className="flex items-center gap-3">
              {github?.avatar_url && <img src={github.avatar_url} alt="" className="h-10 w-10 rounded-full border" />}
              <p className="text-sm">
                {github?.user_name ? <>GitHub <span className="font-semibold">@{github.user_name}</span></> : user?.email}
              </p>
            </div>
            <Button variant="outline" onClick={attempt(signOut)}>Sign out</Button>
          </Section>
        )}

        <Section title="Start over">
          <p className="text-sm text-muted-foreground">Clears every mastered skill and completed challenge on this account. This can't be undone.</p>
          {confirmReset ? (
            <div className="space-y-3 rounded-xl border border-destructive/50 p-4" role="alertdialog" aria-labelledby="reset-q">
              <p id="reset-q" className="text-sm font-medium">Reset all your progress? Your XP, streak and every lit star go back to zero.</p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="destructive"
                  disabled={resetAll.isPending}
                  onClick={() =>
                    resetAll.mutate(undefined, {
                      onSuccess: () => {
                        toast.success("Progress reset");
                        setConfirmReset(false);
                      },
                      onError: (e) => toast.error(e.message),
                    })
                  }
                >
                  {resetAll.isPending ? "Resetting…" : "Yes, reset everything"}
                </Button>
                <Button variant="outline" autoFocus disabled={resetAll.isPending} onClick={() => setConfirmReset(false)}>Keep my progress</Button>
              </div>
            </div>
          ) : (
            <Button ref={resetButton} variant="outline" className="border-destructive/70" onClick={() => setConfirmReset(true)}>Reset progress</Button>
          )}
        </Section>
      </div>
    </PageShell>
  );
};

export default Settings;
