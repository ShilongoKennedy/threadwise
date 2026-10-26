import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { BookOpen, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { authHeaders } from "@/lib/threadwise/ai-client";
import { useSocratic, type SocraticSession } from "@/lib/threadwise/socratic";
import { useWorkspaces } from "@/lib/threadwise/workspaces";
import { useThread } from "@/lib/threadwise/store";
import { neighborhood } from "@/lib/threadwise/graph";

export function SocraticDrawer({ threadId }: { threadId: string }) {
  const s = useSocratic(); const navigate = useNavigate();
  useEffect(() => s.boot(), [s.boot]);
  const session = s.sessions.find((s) => s.id === threadId);
  const create = () => { const w = useWorkspaces.getState().workspaces.find((w) => w.id === useWorkspaces.getState().activeId); const graph = useThread.getState(); const id = s.create(w?.document.activeCanvasId ?? "", [...neighborhood(graph.selectedId, graph.edges).nodeIds]); void navigate({ to: "/socratic/$threadId", params: { threadId: id } }); };
  return <aside className="tw-sheet absolute inset-x-0 bottom-0 z-30 flex h-[78dvh] flex-col border bg-card shadow-[var(--shadow-lift)] md:inset-x-auto md:right-6 md:top-[124px] md:bottom-6 md:h-auto md:w-[440px]" aria-label="Socratic inquiry">
    <header className="flex items-center justify-between border-b px-4 py-3"><div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-accent-ink" /><span className="font-display text-xl">Socratic inquiry</span></div><Button variant="ghost" size="icon" aria-label="Close inquiry" onClick={() => void navigate({ to: "/" })}><X /></Button></header>
    <div className="flex items-center gap-1 border-b p-2"><select aria-label="Select inquiry" value={session?.id ?? ""} className="min-w-0 flex-1 bg-card text-sm" onChange={(e) => void navigate({ to: "/socratic/$threadId", params: { threadId: e.target.value } })}><option value="" disabled>Select inquiry</option>{s.sessions.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select><Button size="icon" variant="ghost" title="New inquiry" aria-label="New inquiry" onClick={create}><Plus /></Button><Button size="icon" variant="ghost" title="Delete inquiry" aria-label="Delete inquiry" disabled={!session} onClick={() => { if (!session || !confirm("Delete this browser-only inquiry?")) return; s.remove(session.id); const other = useSocratic.getState().sessions[0]; if (other) void navigate({ to: "/socratic/$threadId", params: { threadId: other.id } }); else void navigate({ to: "/" }); }}><Trash2 /></Button></div>
    {session ? <Chat key={threadId} session={session} /> : <div className="p-5 text-sm text-muted-foreground">{s.ready ? "This inquiry is not saved in this browser." : "Opening inquiry…"}</div>}
  </aside>;
}

function Chat({ session }: { session: SocraticSession }) {
  const save = useSocratic((s) => s.save); const rename = useSocratic((s) => s.rename);
  const [text, setText] = useState(""); const [storageError, setStorageError] = useState("");
  const composer = useRef<HTMLTextAreaElement | null>(null);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/threadwise", headers: authHeaders, body: () => {
    const w = useWorkspaces.getState().workspaces.find((w) => w.id === useWorkspaces.getState().activeId);
    const c = w?.document.canvases.find((c) => c.id === session.canvasId);
    const nodes = c?.nodes ?? [];
    const ids = session.nodeIds.length ? new Set(session.nodeIds) : new Set(nodes.map((n) => n.id));
    return { mode: "socratic", threadId: session.id, graph: { nodes: nodes.filter((n) => ids.has(n.id)).map((n) => ({ id: n.id, ...n.data })), edges: c?.edges.filter((e) => ids.has(e.source) && ids.has(e.target)).map((e) => ({ source: e.source, target: e.target, ...e.data })) ?? [] } };
  } }), [session.id, session.canvasId, session.nodeIds]);
  const { messages, sendMessage, status, error, stop } = useChat({ id: session.id, messages: session.messages, transport, onFinish: ({ messages }) => { try { save(session.id, messages); } catch { setStorageError("This browser could not save the inquiry. Free some space before continuing."); } } });
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => { try { save(session.id, messages); } catch { setStorageError("This browser could not save the inquiry."); } }, [messages, save, session.id]);
  useEffect(() => { if (!document.querySelector('[role="dialog"]')) composer.current?.focus(); }, [status, session.id]);
  return <>
    <div className="border-b px-4 py-2"><Input aria-label="Inquiry name" className="h-8 border-0 bg-transparent px-0 font-display text-base shadow-none" value={session.title} onChange={(e) => rename(session.id, e.target.value)} /><span className="font-mono text-[9px] uppercase text-muted-foreground">Browser only · {session.nodeIds.length || "All"} linked cards</span></div>
    <Conversation className="min-h-0 flex-1"><ConversationContent className="gap-5 p-4">
      {!messages.length && <div className="py-8"><BookOpen className="mb-4 h-7 w-7 text-accent-ink" /><h3 className="font-display text-2xl italic">What remains unexamined?</h3></div>}
      {messages.map((message) => <Message key={message.id} from={message.role}><MessageContent className={message.role === "user" ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground" : ""}>{message.parts.map((part, i) => part.type === "text" ? <MessageResponse key={i} isAnimating={busy && message.role === "assistant"}>{part.text}</MessageResponse> : part.type === "reasoning" ? <details key={i} className="text-xs text-muted-foreground"><summary>Examining the thread</summary><MessageResponse>{part.text}</MessageResponse></details> : null)}</MessageContent></Message>)}
      {status === "submitted" && <Shimmer>Examining the thread…</Shimmer>}
      {(error || storageError) && <p role="alert" className="text-sm text-accent-ink">{storageError || error?.message}</p>}
    </ConversationContent><ConversationScrollButton /></Conversation>
    <div className="border-t p-3"><PromptInput onSubmit={async ({ text: value }) => { if (busy || !value.trim()) return; setText(""); composer.current?.focus(); await sendMessage({ text: value }); }}><PromptInputTextarea ref={composer} aria-label="Socratic question" value={text} onChange={(e) => setText(e.target.value)} placeholder="What should we question here?" /><PromptInputFooter className="justify-end"><PromptInputSubmit status={status} onStop={() => void stop()} disabled={!busy && !text.trim()} /></PromptInputFooter></PromptInput></div>
  </>;
}