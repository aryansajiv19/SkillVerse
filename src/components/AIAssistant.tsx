import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useProgress } from "@/hooks/useProgress";
import { skillById } from "@/content/skills";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

/** Lets other chrome (the command palette) open the tutor without sharing state. */
export const TUTOR_EVENT = "skillverse:open-tutor";
// eslint-disable-next-line react-refresh/only-export-components
export const openTutor = () => window.dispatchEvent(new Event(TUTOR_EVENT));

/** Reads an OpenAI-style SSE stream, calling onDelta with each text chunk. */
const readStream = async (body: ReadableStream<Uint8Array>, onDelta: (text: string) => void) => {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop()!;
    for (const line of lines) {
      const data = line.trim().replace(/^data: /, "");
      if (!line.startsWith("data: ") || data === "[DONE]") continue;
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta?.content;
        if (delta) onDelta(delta);
      } catch {
        /* keep-alive or partial frame */
      }
    }
  }
};

/**
 * Non-modal chat panel. The launcher sits bottom-right, above the phone tab bar
 * (--bottom-bar-height); opening focuses the message box, Escape closes, and focus
 * goes back to the launcher.
 */
export const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // The chat function answers 503 when no model key is set; no later message will work either.
  const [offline, setOffline] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const messageBox = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const [params] = useSearchParams();
  const { mastered } = useProgress();
  const current = skillById.get(params.get("skill") ?? "")?.name;

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(TUTOR_EVENT, show);
    return () => window.removeEventListener(TUTOR_EVENT, show);
  }, []);

  useEffect(() => {
    // In an effect rather than autoFocus: a closing modal (the command palette) traps focus until its cleanup runs.
    if (open) messageBox.current?.focus();
    else if (wasOpen.current) launcher.current?.focus();
    wasOpen.current = open;
  }, [open]);

  // The message box is disabled once the tutor is known to be off; keep focus inside the panel.
  useEffect(() => {
    if (offline) closeButton.current?.focus();
  }, [offline]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages, notice, loading]);

  const send = async (text: string) => {
    text = text.trim();
    if (!text || loading || offline) return;
    const history: Message[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    setInput("");
    setLoading(true);
    setNotice(null);

    const context = [
      current && `Currently studying ${current}.`,
      `Has mastered: ${[...mastered].map((id) => skillById.get(id)?.name).join(", ") || "nothing yet"}.`,
    ].filter(Boolean).join(" ");

    try {
      const { data } = await supabase.auth.getSession();
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${data.session?.access_token}`,
        },
        body: JSON.stringify({ messages: history, context }),
      });
      if (resp.status === 503) {
        setOffline(true);
        return;
      }
      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        setNotice(err.error ?? "The tutor is unavailable right now.");
        return;
      }
      // The reply bubble is only added once text arrives, so an empty reply never leaves a blank turn behind.
      let started = false;
      await readStream(resp.body, (delta) => {
        const first = !started;
        started = true;
        setMessages((m) =>
          first ? [...m, { role: "assistant", content: delta }] : [...m.slice(0, -1), { role: "assistant", content: m[m.length - 1].content + delta }],
        );
      });
      if (!started) setNotice("The tutor didn't reply. Try asking another way.");
    } catch {
      setNotice("Couldn't reach the tutor. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open)
    return (
      <Button
        ref={launcher}
        onClick={() => setOpen(true)}
        size="icon"
        aria-label="Ask the AI tutor"
        aria-haspopup="dialog"
        className="fixed bottom-[calc(var(--bottom-bar-height)_+_1.5rem)] right-6 z-50 h-14 w-14 rounded-full shadow-[0_8px_30px_-6px_hsl(232_80%_3%/0.8)] transition-transform active:scale-95 [&_svg]:size-6"
      >
        <MessageCircle aria-hidden />
      </Button>
    );

  const waiting = loading && messages[messages.length - 1]?.role === "user";
  const suggestions = current
    ? [`Explain ${current} like I'm new to it`, `What should I learn after ${current}?`]
    : ["Where should I start?", "How do flexbox and grid differ?"];

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="tutor-title"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          setOpen(false);
        }
      }}
      className="glass-panel fixed inset-x-3 bottom-[calc(var(--bottom-bar-height)_+_0.75rem)] z-50 flex h-[min(70dvh,calc(100dvh_-_var(--bottom-bar-height)_-_5.5rem))] origin-bottom-right flex-col rounded-2xl duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] animate-in fade-in-0 zoom-in-95 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(520px,calc(100dvh_-_7rem))] sm:w-96"
    >
      <div className="flex items-center justify-between gap-3 border-b py-3 pl-4 pr-2">
        <div>
          <h2 id="tutor-title" className="font-display font-bold leading-tight">AI tutor</h2>
          <p className="text-xs text-muted-foreground">{current ? `Helping with ${current}` : "Hints first, not answers"}</p>
        </div>
        <Button ref={closeButton} variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close tutor" className="hover:bg-foreground/10 hover:text-foreground">
          <X aria-hidden />
        </Button>
      </div>

      <div ref={log} role="log" aria-busy={loading} className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {!messages.length && !offline && (
          <div className="space-y-3">
            <p className="text-muted-foreground">Ask about anything you're learning. For skill checks you'll get a hint, not the answer.</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border px-3 py-1.5 text-left text-xs text-foreground/90 transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
            <p className={cn("max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2", m.role === "user" ? "bg-foreground text-background" : "bg-muted")}>
              <span className="sr-only">{m.role === "user" ? "You: " : "Tutor: "}</span>
              {m.content}
            </p>
          </div>
        ))}
        {waiting && <p className="text-muted-foreground">Thinking…</p>}
        {notice && <p className="rounded-xl border border-destructive/40 p-3 text-muted-foreground">{notice}</p>}
        {offline && (
          <div className="space-y-1 rounded-xl border p-3">
            <p className="font-medium">The tutor is switched off here</p>
            <p className="text-muted-foreground">
              This deployment has no AI model key, so the tutor can't answer. Skill checks, challenges and your progress all work without it.
            </p>
          </div>
        )}
      </div>

      <form
        className="flex gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <Input
          ref={messageBox}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={offline ? "The tutor is unavailable" : "Ask a question"}
          aria-label="Message the tutor"
          disabled={offline}
          maxLength={2000}
        />
        <Button type="submit" size="icon" disabled={loading || offline || !input.trim()} aria-label="Send">
          <Send aria-hidden />
        </Button>
      </form>
    </div>
  );
};
