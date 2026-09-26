import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useProgress } from "@/hooks/useProgress";
import { skillById } from "@/content/skills";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

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

export const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [params] = useSearchParams();
  const { mastered } = useProgress();

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const history: Message[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    setInput("");
    setLoading(true);
    setNotice(null);

    const current = skillById.get(params.get("skill") ?? "")?.name;
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
      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        setNotice(err.error ?? "The tutor is unavailable right now.");
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      await readStream(resp.body, (delta) =>
        setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: m[m.length - 1].content + delta }]),
      );
    } catch {
      setNotice("Couldn't reach the tutor. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open)
    return (
      <Button onClick={() => setOpen(true)} size="icon" aria-label="Ask the AI tutor" className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg">
        <MessageCircle className="h-6 w-6" />
      </Button>
    );

  return (
    <div role="dialog" aria-label="AI tutor" className="glass-panel fixed inset-x-3 bottom-3 z-50 flex h-[70vh] flex-col rounded-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[520px] sm:w-96">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-display font-bold">AI tutor</h2>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close tutor"><X className="h-4 w-4" /></Button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm" aria-live="polite">
        {!messages.length && <p className="text-muted-foreground">Ask about anything you're learning. I'll give hints, not answers, for skill checks.</p>}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
            <p className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 ${m.role === "user" ? "bg-foreground text-background" : "bg-muted"}`}>
              {m.content || "…"}
            </p>
          </div>
        ))}
        {notice && <p className="rounded-xl border border-destructive/40 p-3 text-muted-foreground">{notice}</p>}
        <div ref={endRef} />
      </div>
      <form className="flex gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="How do flexbox and grid differ?" aria-label="Message" disabled={loading} />
        <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
};
