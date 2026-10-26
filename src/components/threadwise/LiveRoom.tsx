import { useEffect, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { Mic, MicOff, LogOut, Users, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Json } from "@/integrations/supabase/types";
import { useAccount } from "@/lib/threadwise/cloud-sync";
import { useLiveRoom } from "@/lib/threadwise/live-room";
import { accountLabel } from "@/lib/threadwise/account-label";
import { useThread } from "@/lib/threadwise/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";

export function LiveRoomDialog({ onClose }: { onClose: () => void }) {
  const user = useAccount((s) => s.user),
    live = useLiveRoom();
  const [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const act = async (host: boolean) => {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      if (host) {
        const cards = useThread
          .getState()
          .nodes.map((n) => ({ id: n.id, title: n.data.title, body: n.data.body }));
        const { data, error } = await supabase
          .from("workshop_sessions")
          .insert({ host_id: user.id, title: "Canvas huddle", cards: cards as Json })
          .select("*")
          .single();
        if (error) throw error;
        live.setRoom(data.id, data.title);
        setCode(data.join_code);
      } else {
        const { data, error } = await supabase.rpc("join_workshop", {
          p_code: code,
          p_name: accountLabel(user.user_metadata),
        });
        if (error) throw error;
        const room = await supabase.from("workshop_sessions").select("*").eq("id", data).single();
        if (room.error) throw room.error;
        live.setRoom(data, room.data.title);
        onClose();
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : e && typeof e === "object" && "message" in e
            ? String(e.message)
            : "Could not join the room.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Think together</DialogTitle>
          <DialogDescription>
            {user
              ? "Invite participants to this live room."
              : "Sign in from your account to host or join."}
          </DialogDescription>
        </DialogHeader>
        {user && (
          <>
            <Input
              aria-label="Live room invite code"
              placeholder="Invitation code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy || !code} onClick={() => void act(false)}>
                <Users />
                Join room
              </Button>
              <Button variant="outline" disabled={busy} onClick={() => void act(true)}>
                Host new room
              </Button>
              {live.roomId && code && (
                <Button variant="outline" onClick={() => void navigator.clipboard.writeText(code)}>
                  <Copy />
                  Copy invitation
                </Button>
              )}
            </div>
            {live.roomId && (
              <Button variant="outline" onClick={onClose}>
                Return to canvas
              </Button>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-accent-ink">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function LivePresence() {
  const user = useAccount((s) => s.user),
    room = useLiveRoom(),
    rf = useReactFlow();
  const [people, setPeople] = useState<Tables<"workshop_presence">[]>([]),
    [audio, setAudio] = useState(false),
    [muted, setMuted] = useState(false),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0);
  const client = useRef(crypto.randomUUID()),
    point = useRef({ x: 0, y: 0 }),
    stream = useRef<MediaStream | null>(null),
    peers = useRef(new Map<string, RTCPeerConnection>()),
    players = useRef(new Map<string, HTMLAudioElement>()),
    audioRef = useRef(false);
  const closeAudio = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    peers.current.forEach((p) => p.close());
    peers.current.clear();
    players.current.forEach((p) => {
      p.pause();
      p.srcObject = null;
    });
    players.current.clear();
    audioRef.current = false;
    setAudio(false);
    setMuted(false);
  };
  useEffect(() => {
    if (!room.roomId || !user) return;
    const sid = room.roomId,
      uid = user.id,
      cid = client.current;
    let active = true;
    const write = async () => {
      const { error } = await supabase.from("workshop_presence").upsert({
        session_id: sid,
        user_id: uid,
        client_id: cid,
        display_name: accountLabel(user.user_metadata),
        ...point.current,
        audio: audioRef.current,
        updated_at: new Date().toISOString(),
      });
      if (error && active) setError("Live presence paused. Leave and rejoin the room.");
    };
    const refresh = async () => {
      const r = await supabase
        .from("workshop_presence")
        .select("*")
        .eq("session_id", sid)
        .gte("updated_at", new Date(Date.now() - 15000).toISOString());
      if (active && r.data) setPeople(r.data);
    };
    const pointer = (e: PointerEvent) => {
      point.current = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("pointermove", pointer);
    void write();
    void refresh();
    const timer = setInterval(() => {
      void write();
      void refresh();
      setVersion((v) => v + 1);
    }, 1000);
    const channel = supabase
      .channel(`presence:${sid}:${cid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workshop_presence",
          filter: `session_id=eq.${sid}`,
        },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("pointermove", pointer);
      void supabase.removeChannel(channel);
      closeAudio();
      void supabase
        .from("workshop_presence")
        .delete()
        .eq("session_id", sid)
        .eq("user_id", uid)
        .eq("client_id", cid);
    };
  }, [room.roomId, user?.id, rf]);
  useEffect(() => {
    if (!audio || !room.roomId || !user) return;
    const sid = room.roomId,
      uid = user.id,
      cid = client.current;
    let active = true;
    const handled = new Set<string>();
    const send = async (
      p: Tables<"workshop_presence">,
      kind: "offer" | "answer" | "ice",
      payload: unknown,
    ) => {
      const r = await supabase.from("workshop_signals").insert({
        session_id: sid,
        sender_id: uid,
        sender_client: cid,
        recipient_id: p.user_id,
        recipient_client: p.client_id,
        kind,
        payload: JSON.parse(JSON.stringify(payload)) as Json,
      });
      if (r.error && active) setError("Audio signaling unavailable. Leave and retry.");
    };
    const ensure = (p: Tables<"workshop_presence">) => {
      const existing = peers.current.get(p.client_id);
      if (existing) return existing;
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      peers.current.set(p.client_id, pc);
      stream.current?.getTracks().forEach((t) => {
        if (stream.current) pc.addTrack(t, stream.current);
      });
      pc.onicecandidate = (e) => {
        if (e.candidate) void send(p, "ice", e.candidate.toJSON());
      };
      pc.ontrack = (e) => {
        const player = new Audio();
        player.autoplay = true;
        player.srcObject = e.streams[0] ?? new MediaStream([e.track]);
        players.current.set(p.client_id, player);
        void player.play().catch(() => setError("Allow audio playback to hear the huddle."));
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed")
          setError(
            "Audio could not connect on this network. A relay service is needed for restricted networks.",
          );
      };
      return pc;
    };
    const signals = async () => {
      const presence = await supabase
        .from("workshop_presence")
        .select("*")
        .eq("session_id", sid)
        .eq("audio", true)
        .gte("updated_at", new Date(Date.now() - 15000).toISOString());
      const remote = (presence.data ?? []).filter((p) => p.client_id !== cid);
      for (const [id, pc] of peers.current)
        if (!remote.some((p) => p.client_id === id)) {
          pc.close();
          peers.current.delete(id);
          const a = players.current.get(id);
          if (a) {
            a.pause();
            a.srcObject = null;
            players.current.delete(id);
          }
        }
      for (const p of remote)
        if (cid < p.client_id && !peers.current.has(p.client_id)) {
          const pc = ensure(p);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await send(p, "offer", offer);
        }
      const r = await supabase
        .from("workshop_signals")
        .select("*")
        .eq("session_id", sid)
        .eq("recipient_id", uid)
        .eq("recipient_client", cid)
        .order("created_at");
      for (const s of r.data ?? []) {
        if (handled.has(s.id)) continue;
        const p = remote.find((p) => p.user_id === s.sender_id && p.client_id === s.sender_client);
        if (!p) continue;
        const pc = ensure(p);
        try {
          if (s.kind === "offer") {
            await pc.setRemoteDescription(s.payload as unknown as RTCSessionDescriptionInit);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await send(p, "answer", answer);
          }
          if (s.kind === "answer")
            await pc.setRemoteDescription(s.payload as unknown as RTCSessionDescriptionInit);
          if (s.kind === "ice") {
            if (!pc.remoteDescription) continue;
            await pc.addIceCandidate(s.payload as unknown as RTCIceCandidateInit);
          }
          handled.add(s.id);
          await supabase.from("workshop_signals").delete().eq("id", s.id);
        } catch {
          if (active) setError("Audio connection interrupted. Leave audio and rejoin.");
        }
      }
    };
    let running = false;
    const tick = () => {
      if (!active || running) return;
      running = true;
      void signals()
        .catch(() => {
          if (active) setError("Audio connection unavailable.");
        })
        .finally(() => {
          running = false;
        });
    };
    tick();
    const timer = setInterval(tick, 1500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [audio, room.roomId, user?.id]);
  if (!room.roomId || !user) return null;
  const others = people.filter((p) => p.client_id !== client.current);
  void version;
  return (
    <>
      <div className="tw-live-strip">
        <Users className="h-4 w-4" />
        <span>{people.length || 1} in room</span>
        <Button
          size="icon"
          variant={audio ? "default" : "ghost"}
          aria-label={audio ? "Leave audio huddle" : "Join audio huddle"}
          title={audio ? "Leave audio" : "Join audio"}
          onClick={() => {
            if (audio) {
              closeAudio();
              return;
            }
            setError("");
            void navigator.mediaDevices
              .getUserMedia({ audio: true })
              .then((s) => {
                stream.current = s;
                audioRef.current = true;
                setAudio(true);
              })
              .catch(() => setError("Microphone access is required to join audio."));
          }}
        >
          {audio ? <Mic /> : <MicOff />}
        </Button>
        {audio && (
          <Button
            size="icon"
            variant="ghost"
            aria-label={muted ? "Unmute microphone" : "Mute microphone"}
            onClick={() => {
              stream.current?.getAudioTracks().forEach((t) => {
                t.enabled = muted;
              });
              setMuted(!muted);
            }}
          >
            {muted ? <MicOff /> : <Mic />}
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          aria-label="Leave live room"
          onClick={() => room.setRoom(null)}
        >
          <LogOut />
        </Button>
        {error && (
          <span role="alert" className="max-w-64 text-xs text-accent-ink">
            {error}
          </span>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        {others.map((p) => {
          const xy = rf.flowToScreenPosition({ x: p.x, y: p.y });
          return (
            <div key={p.client_id} className="tw-presence-cursor" style={{ left: xy.x, top: xy.y }}>
              <svg width="18" height="22" viewBox="0 0 18 22">
                <path d="M1 1 L16 12 L9 13 L6 20 Z" fill="currentColor" />
              </svg>
              <span>
                {p.display_name}
                {p.audio ? " · audio" : ""}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
