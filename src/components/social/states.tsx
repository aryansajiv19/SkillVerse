import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** A grey block standing in for content that is still loading. */
export const Skeleton = ({ className }: { className?: string }) => (
  <div aria-hidden className={cn("animate-pulse rounded-2xl bg-foreground/[0.06]", className)} />
);

export const LoadError = ({ what, error, onRetry }: { what: string; error: Error; onRetry: () => void }) => {
  useEffect(() => console.error(error), [error]);
  return (
    <div role="alert" className="glass-panel max-w-xl rounded-2xl p-6">
      <p className="font-semibold">Couldn't load {what}</p>
      <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
      <Button className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
};
