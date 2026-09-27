import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { tracks, type TrackId } from "@/content/skills";

/** First-visit intro: a modal that asks where to start. Escape means "show me the whole map". */
export const IntroDialog = ({ open, onChoose, onCloseAutoFocus }: {
  open: boolean;
  onChoose: (track: TrackId | null) => void;
  onCloseAutoFocus: (e: Event) => void;
}) => (
  <Dialog.Root open={open} onOpenChange={(o) => !o && onChoose(null)}>
    <Dialog.Portal>
      {/* The overlay is the scroll container, so a tall intro on a short screen can scroll. */}
      <Dialog.Overlay className="fixed inset-0 z-[60] overflow-y-auto bg-background/75 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:duration-200">
        <Dialog.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className="flex min-h-full items-end p-5 pb-10 outline-none sm:items-center sm:p-12"
        >
          <div className="max-w-xl space-y-6">
            <Dialog.Title className="text-[2.75rem] font-extrabold leading-[1.05] sm:text-6xl">Learn by lighting up a galaxy.</Dialog.Title>
            <Dialog.Description className="text-lg text-foreground/80">
              Every star is a skill. Pass its skill check to light it up and unlock the stars it connects to.
              Your progress saves as you go. No sign-up needed.
            </Dialog.Description>
            <div role="group" aria-labelledby="intro-start">
              <p id="intro-start" className="mb-3 text-sm text-muted-foreground">Where do you want to start?</p>
              <div className="grid grid-cols-2 gap-2">
                {tracks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onChoose(t.id)}
                    className="rounded-xl border bg-card/60 p-4 text-left transition-[border-color,transform] duration-150 hover:border-[hsl(var(--track))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
                    style={{ ["--track" as string]: t.hue }}
                  >
                    <span className="block font-display text-lg font-bold" style={{ color: `hsl(${t.hue})` }}>{t.name}</span>
                    <span className="text-sm text-muted-foreground">{t.blurb}</span>
                  </button>
                ))}
              </div>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" className="px-0 text-muted-foreground hover:bg-transparent hover:text-foreground">
                Show me the whole map
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Portal>
  </Dialog.Root>
);
