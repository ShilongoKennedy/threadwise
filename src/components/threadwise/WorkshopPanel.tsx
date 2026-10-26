import { useEffect, useState } from "react";
import { Copy, Minus, Play, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { voteTotal, canVote } from "@/lib/threadwise/workshop-rules";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Json } from "@/integrations/supabase/types";
import { useAccount } from "@/lib/threadwise/cloud-sync";
import { useThread } from "@/lib/threadwise/store";
import { useLiveRoom } from "@/lib/threadwise/live-room";
type Room = Tables<"workshop_sessions">;
type Card = { id: string; title: string; body: string };
export function WorkshopPanel() {
  const user = useAccount((s) => s.user);
  const s = useThread();
  const [room, setRoom] = useState<Room | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<Tables<"workshop_ideas">[]>([]);
  const [votes, setVotes] = useState<Tables<"workshop_votes">[]>([]);
  const [members, setMembers] = useState<Tables<"workshop_members">[]>([]);
  const [title, setTitle] = useState("Thinking together");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [minutes, setMinutes] = useState(10);
  const [budget, setBudget] = useState(3);
  const [idea, setIdea] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [group, setGroup] = useState("");
  const [checked, setChecked] = useState<string[]>([]);
  const host = !!user && room?.host_id === user.id;
  const groups = (room?.groups ?? {}) as Record<string, string>;
  const cards = [
    ...((room?.cards ?? []) as unknown as Card[]),
    ...ideas.map((i) => ({ id: i.id, title: i.title, body: i.body })),
  ];
  const used = voteTotal(votes, user?.id ?? "");
  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(
        e && typeof e === "object" && "message" in e
          ? String(e.message)
          : "Connection unavailable. Retry.",
      );
    } finally {
      setBusy(false);
    }
  };
  const refresh = async (id = roomId) => {
    if (!id) return;
    const results = await Promise.all([
      supabase.from("workshop_sessions").select("*").eq("id", id).single(),
      supabase.from("workshop_ideas").select("*").eq("session_id", id).order("created_at"),
      supabase.from("workshop_votes").select("*").eq("session_id", id),
      supabase.from("workshop_members").select("*").eq("session_id", id),
    ]);
    for (const r of results) if (r.error) throw r.error;
    setRoom(results[0].data);
    setIdeas(results[1].data ?? []);
    setVotes(results[2].data ?? []);
    setMembers(results[3].data ?? []);
  };
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`threadwise-room-${user.id}`);
    if (saved) setRoomId(saved);
  }, [user?.id]);
  useEffect(() => {
    if (!roomId || !user) return;
    localStorage.setItem(`threadwise-room-${user.id}`, roomId);
    let live = true;
    const load = () => {
      if (live)
        void refresh(roomId).catch(() => {
          if (live) setError("Session updates paused. Retry connection.");
        });
    };
    load();
    const poll = setInterval(load, 2500);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      live = false;
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [roomId, user?.id]);
  const changePhase = (phase: string) =>
    act(async () => {
      if (!room) return;
      const { error } = await supabase
        .from("workshop_sessions")
        .update({
          phase,
          ends_at:
            phase === "silent" || phase === "vote"
              ? new Date(Date.now() + minutes * 60000).toISOString()
              : null,
        })
        .eq("id", room.id);
      if (error) throw error;
      await refresh();
    });
  const remaining = room?.ends_at
    ? Math.max(0, Math.ceil((Date.parse(room.ends_at) - now) / 1000))
    : null;
  const importCards = () => {
    cards.forEach((card, i) => {
      const existing = s.nodes.find(
        (n) => n.id === card.id || n.data.meta["workshopCardId"] === card.id,
      );
      if (existing) {
        s.updateNode(existing.id, (d) => ({
          ...d,
          meta: {
            ...d.meta,
            affinity: groups[card.id] ?? "",
            votes: String(
              votes.filter((v) => v.node_id === card.id).reduce((sum, v) => sum + v.dots, 0),
            ),
          },
        }));
        return;
      }
      const id = s.addNode("idea", { x: (i % 3) * 340, y: Math.floor(i / 3) * 220 });
      s.updateNode(id, (d) => ({
        ...d,
        title: card.title,
        body: card.body,
        meta: {
          ...d.meta,
          workshopCardId: card.id,
          affinity: groups[card.id] ?? "",
          votes: String(votes.filter((v) => v.node_id === card.id).reduce((a, v) => a + v.dots, 0)),
        },
      }));
    });
    s.recordSnapshot("Workshop ideas imported");
  };
  if (!user)
    return (
      <div className="py-12">
        <h2 className="font-display text-3xl">A shared room for connected thinking.</h2>
        <p className="mt-4 text-muted-foreground">
          Sign in from your account to host or join a live workshop.
        </p>
      </div>
    );
  return (
    <div className="space-y-5">
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 border-l-2 border-accent-ink bg-muted p-3 text-sm"
        >
          <span>{error}</span>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => act(() => refresh())}>
            <RefreshCw />
            Retry
          </Button>
        </div>
      )}
      {!room ? (
        <div className="grid gap-8 py-4 md:grid-cols-2">
          <section className="space-y-4">
            <h2 className="font-display text-2xl">Host a session</h2>
            <Input
              aria-label="Session title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <label className="block text-sm">
              Dots per participant
              <Input
                aria-label="Vote budget"
                type="number"
                min={1}
                max={20}
                value={budget}
                onChange={(e) => setBudget(Math.max(1, Math.min(20, Number(e.target.value))))}
              />
            </label>
            <Button
              disabled={busy || !title.trim()}
              onClick={() =>
                act(async () => {
                  const { data, error } = await supabase
                    .from("workshop_sessions")
                    .insert({
                      host_id: user.id,
                      title,
                      cards: s.nodes
                        .filter((n) => n.data.kind !== "portal")
                        .map((n) => ({
                          id: n.id,
                          title: n.data.title,
                          body: n.data.body,
                        })) as unknown as Json,
                      vote_budget: budget,
                    })
                    .select()
                    .single();
                  if (error) throw error;
                  setRoom(data);
                  setRoomId(data.id);
                })
              }
            >
              <Play />
              Start workshop
            </Button>
          </section>
          <section className="space-y-4 border-t pt-4 md:border-t-0 md:border-l md:pl-8 md:pt-0">
            <h2 className="font-display text-2xl">Join the room</h2>
            <Input
              aria-label="Session invitation code"
              placeholder="Invitation code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Input
              aria-label="Participant name"
              placeholder="Your name in this session"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button
              variant="outline"
              disabled={busy || !code.trim() || !name.trim()}
              onClick={() =>
                act(async () => {
                  const { data, error } = await supabase.rpc("join_workshop", {
                    p_code: code,
                    p_name: name,
                  });
                  if (error) throw error;
                  setRoomId(data);
                  await refresh(data);
                })
              }
            >
              Join workshop
            </Button>
          </section>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="font-display text-3xl">{room.title}</h2>
              <p className="mt-1 font-mono text-xs uppercase text-muted-foreground">
                {room.phase} ·{" "}
                {members.length + (members.some((m) => m.user_id === room.host_id) ? 0 : 1)} in the
                room
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-3xl tabular-nums" role="timer">
                {remaining === null
                  ? "—"
                  : `${Math.floor(remaining / 60)
                      .toString()
                      .padStart(2, "0")}:${(remaining % 60).toString().padStart(2, "0")}`}
              </div>
              <span className="text-xs text-muted-foreground">
                {remaining === 0 ? "Time is up" : "Session timer"}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => useLiveRoom.getState().setRoom(room.id, room.title)}
          >
            Enable live canvas presence & audio
          </Button>
          {host && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  className="min-w-0 flex-1 font-mono text-xs"
                  aria-label="Workshop invite code"
                  readOnly
                  value={room.join_code}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  title="Copy invitation code"
                  aria-label="Copy invitation code"
                  onClick={() =>
                    act(async () => {
                      await navigator.clipboard.writeText(room.join_code);
                    })
                  }
                >
                  <Copy />
                </Button>
                <label className="flex items-center gap-2 text-xs">
                  Minutes
                  <Input
                    className="w-20"
                    type="number"
                    aria-label="Session minutes"
                    min={1}
                    max={180}
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(1, Math.min(180, Number(e.target.value))))}
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  ["silent", "Silent ideation"],
                  ["discuss", "Reveal & discuss"],
                  ["vote", "Dot voting"],
                  ["closed", "End session"],
                ].map(([phase, label]) => (
                  <Button
                    key={phase}
                    disabled={busy || room.phase === "closed"}
                    variant={room.phase === phase ? "default" : "outline"}
                    onClick={() => changePhase(phase ?? "setup")}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </>
          )}
          {room.phase === "silent" && (
            <form
              className="space-y-3 border-y py-4"
              onSubmit={(e) => {
                e.preventDefault();
                void act(async () => {
                  const { error } = await supabase
                    .from("workshop_ideas")
                    .insert({ session_id: room.id, user_id: user.id, title: idea.trim(), body });
                  if (error) throw error;
                  setIdea("");
                  setBody("");
                  await refresh();
                });
              }}
            >
              <p className="text-sm text-muted-foreground">
                Your ideas stay private until the facilitator reveals the room.
              </p>
              <Input
                aria-label="Silent idea title"
                placeholder="One thought at a time…"
                maxLength={500}
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
              />
              <Textarea
                aria-label="Silent idea details"
                placeholder="Optional detail"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <Button type="submit" disabled={busy || !idea.trim()}>
                Submit idea
              </Button>
            </form>
          )}
          {room.phase === "vote" && (
            <p className="font-mono text-sm">{room.vote_budget - used} dots remaining</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const total = votes
                .filter((v) => v.node_id === card.id)
                .reduce((a, v) => a + v.dots, 0);
              const mine =
                votes.find((v) => v.node_id === card.id && v.user_id === user.id)?.dots ?? 0;
              return (
                <article key={card.id} className="rounded-lg border bg-card p-4">
                  <div className="flex justify-between gap-2">
                    <h3 className="font-display text-lg">{card.title}</h3>
                    {host && (
                      <input
                        type="checkbox"
                        aria-label={`Group ${card.title}`}
                        checked={checked.includes(card.id)}
                        onChange={(e) =>
                          setChecked(
                            e.target.checked
                              ? [...checked, card.id]
                              : checked.filter((id) => id !== card.id),
                          )
                        }
                      />
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {card.body}
                  </p>
                  {groups[card.id] && (
                    <p className="mt-3 border-t pt-2 font-mono text-xs">{groups[card.id]}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="font-mono text-xs">{total} dots</span>
                    {room.phase === "vote" && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Remove dot"
                          aria-label={`Remove vote from ${card.title}`}
                          disabled={busy || mine === 0}
                          onClick={() =>
                            act(async () => {
                              const { error } = await supabase.rpc("cast_workshop_vote", {
                                p_session: room.id,
                                p_node: card.id,
                                p_delta: -1,
                              });
                              if (error) throw error;
                              await refresh();
                            })
                          }
                        >
                          <Minus />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          title="Add dot"
                          aria-label={`Vote for ${card.title}`}
                          disabled={busy || !canVote(room.phase, used, room.vote_budget)}
                          onClick={() =>
                            act(async () => {
                              const { error } = await supabase.rpc("cast_workshop_vote", {
                                p_session: room.id,
                                p_node: card.id,
                                p_delta: 1,
                              });
                              if (error) throw error;
                              await refresh();
                            })
                          }
                        >
                          <Plus />
                        </Button>
                        <span className="text-xs text-muted-foreground">{mine} yours</span>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {host && (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Input
                className="max-w-64"
                aria-label="Affinity group name"
                placeholder="Affinity group name"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
              />
              <Button
                variant="outline"
                disabled={busy || !group.trim() || !checked.length}
                onClick={() =>
                  act(async () => {
                    const next = { ...groups };
                    checked.forEach((id) => {
                      next[id] = group.trim();
                    });
                    const { error } = await supabase
                      .from("workshop_sessions")
                      .update({ groups: next })
                      .eq("id", room.id);
                    if (error) throw error;
                    const positions: Record<string, { x: number; y: number }> = {};
                    checked.forEach((id, i) => {
                      const node = s.nodes.find(
                        (n) => n.id === id || n.data.meta["workshopCardId"] === id,
                      );
                      if (node) {
                        positions[node.id] = { x: (i % 3) * 340, y: Math.floor(i / 3) * 220 };
                        s.updateNode(node.id, (d) => ({
                          ...d,
                          meta: { ...d.meta, affinity: group.trim() },
                        }));
                      }
                    });
                    s.setPositions(positions);
                    setChecked([]);
                    setGroup("");
                    await refresh();
                  })
                }
              >
                Group selected cards
              </Button>
              <Button variant="outline" disabled={room.phase === "silent"} onClick={importCards}>
                Bring ideas onto canvas
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              localStorage.removeItem(`threadwise-room-${user.id}`);
              setRoom(null);
              setRoomId(null);
              useLiveRoom.getState().setRoom(null);
              setIdeas([]);
              setVotes([]);
            }}
          >
            Leave room
          </Button>
        </>
      )}
    </div>
  );
}
