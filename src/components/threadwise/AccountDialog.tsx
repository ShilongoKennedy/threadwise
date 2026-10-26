import { useEffect, useState } from "react";
import { Check, Cloud, Download, LogOut, ShieldCheck, UserRound, Volume2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { syncWorkspaces, useAccount } from "@/lib/threadwise/cloud-sync";
import { useWorkspaces } from "@/lib/threadwise/workspaces";
import { cloudDocument } from "@/lib/threadwise/workspace-model";
import { useSound } from "@/lib/threadwise/sound";

export function AccountDialog({ onClose }: { onClose: () => void }) {
  const user = useAccount((s) => s.user);
  const ws = useWorkspaces(); const sound = useSound();
  const [tab, setTab] = useState<"profile" | "preferences" | "privacy">("profile");
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(""); const [loadingProfile, setLoadingProfile] = useState(!!user);
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!user) { setLoadingProfile(false); return; }
    let active = true;
    setLoadingProfile(true);
    void supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle().then(({ data, error }) => {
      if (!active) return;
      if (error) setMessage("Your profile could not be loaded. Please reopen your account to try again.");
      else setDisplayName(data?.display_name || String(user.user_metadata["full_name"] ?? ""));
      setLoadingProfile(false);
    });
    return () => { active = false; };
  }, [user?.id]);
  const hasSupabase = Boolean(import.meta.env["VITE_SUPABASE_URL"] && (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_ANON_KEY"]));
  const oauth = async () => {
    setBusy(true); setMessage("");
    try {
      if (!hasSupabase) throw new Error("Google sign-in needs a Supabase project. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY), then enable Google in Supabase Authentication → Providers.");
      const redirectTo = new URL("/auth/callback", window.location.origin).toString();
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
      if (error) throw error;
    }
    catch (error) { setMessage(error instanceof Error ? error.message : "Sign-in did not finish."); }
    finally { setBusy(false); }
  };
  const exportWorkspaces = () => {
    ws.capture();
    const data = useWorkspaces.getState().workspaces.map((w) => ({ title: w.title, document: cloudDocument(w.document) }));
    const url = URL.createObjectURL(new Blob([JSON.stringify({ format: "threadwise-workspaces", version: 1, workspaces: data }, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "threadwise-workspaces.json"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const initials = (displayName || user?.email || "T").split(/[ @]/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className={user ? "tw-account w-[calc(100%-24px)] max-w-3xl max-h-[90dvh] overflow-y-auto p-0" : "max-w-sm"}>
    {user ? <>
      <DialogHeader className="border-b px-6 py-5"><DialogTitle className="font-display text-3xl">Your personal desk</DialogTitle><DialogDescription>{user.email}</DialogDescription></DialogHeader>
      <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-[190px_minmax(0,1fr)]">
        <nav aria-label="Account settings" className="flex min-w-0 flex-wrap gap-1 border-b bg-muted/40 p-4 md:flex-col md:border-r md:border-b-0">
          {([{ id: "profile", label: "Profile", icon: UserRound }, { id: "preferences", label: "Preferences", icon: Volume2 }, { id: "privacy", label: "Data & privacy", icon: ShieldCheck }] as const).map(({ id, label, icon: Icon }) => <Button key={id} variant={tab === id ? "secondary" : "ghost"} className="justify-start" aria-pressed={tab === id} onClick={() => { setTab(id); setMessage(""); }}><Icon /><span className="text-xs sm:text-sm">{label}</span></Button>)}
          <Button className="mt-auto hidden justify-start text-muted-foreground md:flex" variant="ghost" disabled={busy} onClick={async () => { setBusy(true); const { error } = await supabase.auth.signOut(); if (error) { setMessage(error.message); setBusy(false); } else onClose(); }}><LogOut />Sign out</Button>
        </nav>
        <div className="min-w-0 p-6">
          {tab === "profile" && <>
            <div className="mb-6 flex items-center gap-4"><span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border bg-secondary font-display text-2xl">{initials}</span><div className="min-w-0"><h2 className="truncate font-display text-2xl">{displayName || "Your Threadwise account"}</h2><p className="mt-1 text-xs text-muted-foreground">Personal workspace</p></div></div>
            <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setMessage(""); try {
              const { error } = await supabase.from("profiles").upsert({ id: user.id, display_name: displayName.trim() });
              if (error) throw error;
              setDisplayName(displayName.trim()); setMessage("Profile saved.");
            } catch (error) { setMessage(error instanceof Error ? error.message : "Your profile could not be saved."); } finally { setBusy(false); } }}>
              <div className="space-y-2"><Label htmlFor="display-name">Display name <span className="font-normal text-muted-foreground">· optional</span></Label><Input id="display-name" maxLength={80} disabled={loadingProfile || busy} autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" /></div>
              <div className="space-y-2"><Label htmlFor="account-email">Email address</Label><Input id="account-email" value={user.email ?? ""} readOnly className="bg-muted/40" /></div>
              <Button disabled={loadingProfile || busy} type="submit"><Check />{busy ? "Saving…" : "Save changes"}</Button>
            </form>
            <div className="mt-7 grid grid-cols-2 border-y py-4"><div><p className="font-display text-2xl">{ws.workspaces.length}</p><p className="text-xs text-muted-foreground">Workspaces</p></div><div><p className="font-display text-2xl">{ws.workspaces.reduce((count, w) => count + w.document.canvases.length, 0)}</p><p className="text-xs text-muted-foreground">Canvases</p></div></div>
          </>}
          {tab === "preferences" && <><h2 className="mb-6 font-display text-2xl">Make yourself at home.</h2><div className="flex items-center justify-between gap-4 border-y py-5"><div><Label htmlFor="desk-sound">Desk sounds</Label><p className="mt-1 text-xs text-muted-foreground">Paper, brass, and quiet completion cues</p></div><Switch id="desk-sound" checked={sound.enabled} onCheckedChange={() => sound.toggle()} /></div><div className="mt-6 flex items-start gap-3"><Cloud className="mt-1 h-4 w-4 shrink-0" /><div className="min-w-0"><h3 className="text-sm font-medium">Autosave</h3><p role="status" className="mt-1 break-words text-xs text-muted-foreground">{ws.status}</p><Button className="mt-3" size="sm" variant="outline" onClick={() => void syncWorkspaces()}>Sync now</Button></div></div></>}
          {tab === "privacy" && <><h2 className="mb-6 font-display text-2xl">Your thinking stays yours.</h2><dl className="space-y-5 text-sm"><div className="border-b pb-4"><dt className="font-medium">Canvases & workspaces</dt><dd className="mt-1 text-muted-foreground">Saved to your account, with a local copy for offline edits.</dd></div><div className="border-b pb-4"><dt className="font-medium">Socratic conversations</dt><dd className="mt-1 text-muted-foreground">Stored only in this browser. Never included in workspace sync or backups.</dd></div></dl><Button className="mt-6" variant="outline" onClick={exportWorkspaces}><Download />Download workspace backup</Button></>}
          {message && <p role="status" className="mt-4 break-words text-sm text-accent-ink">{message}</p>}
          <Button className="mt-6 md:hidden" variant="outline" disabled={busy} onClick={async () => { const { error } = await supabase.auth.signOut(); if (error) setMessage(error.message); else onClose(); }}><LogOut />Sign out</Button>
        </div>
      </div>
    </> : <><DialogHeader><DialogTitle className="font-display text-2xl">Keep your thinking connected</DialogTitle><DialogDescription>Sign in to sync canvases across devices. Inquiries stay in this browser.</DialogDescription></DialogHeader>
      <Button disabled={busy} variant="outline" onClick={() => void oauth()}>Continue with Google</Button>
      {!hasSupabase && <p className="-mt-1 text-xs leading-relaxed text-muted-foreground">Google sign-in will activate after you connect a Supabase project. Local DeepSeek testing can work without it.</p>}
      <form className="space-y-3 border-t pt-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setMessage(""); try {
        const callback = new URL("/auth/callback", window.location.origin).toString();
        const result = signup ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: callback } }) : await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        if (signup && !result.data.session) setMessage("Check your email to confirm your account."); else onClose();
      } catch (error) { setMessage(error instanceof Error ? error.message : "Sign-in did not finish."); } finally { setBusy(false); } }}>
        <Input type="email" aria-label="Email" autoComplete="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" aria-label="Password" autoComplete={signup ? "new-password" : "current-password"} placeholder="Password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button className="w-full" disabled={busy}>{busy ? "Please wait…" : signup ? "Create account" : "Sign in"}</Button>
      </form><Button variant="link" onClick={() => setSignup(!signup)}>{signup ? "Already have an account? Sign in" : "Create an account"}</Button>
      {message && <p role="status" className="text-sm text-accent-ink">{message}</p>}
    </>}
  </DialogContent></Dialog>;
}
