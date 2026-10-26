import { useState } from "react";
import { ChevronRight, Cloud, Copy, DoorOpen, FolderOpen, Plus, RefreshCw, Search, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useWorkspaces } from "@/lib/threadwise/workspaces";
import { breadcrumbs } from "@/lib/threadwise/workspace-model";
import { syncWorkspaces, useAccount } from "@/lib/threadwise/cloud-sync";
import { useThread } from "@/lib/threadwise/store";
import { AccountDialog } from "./AccountDialog";
import { ColorPicker } from "./ColorPicker";
import { paperColor } from "@/lib/threadwise/paper";

export function WorkspaceBar() {
  const s = useWorkspaces(); const user = useAccount((s) => s.user);
  const replay = useThread((s) => s.replayIndex !== null);
  const [open, setOpen] = useState(false), [account, setAccount] = useState(false);
  const [search, setSearch] = useState("");
  const w = s.workspaces.find((w) => w.id === s.activeId);
  const c = w?.document.canvases.find((c) => c.id === w.document.activeCanvasId);
  const newCanvas = (parentId?: string) => { s.createCanvas(undefined, parentId); setOpen(false); };
  return <>
    <div className="tw-workspacebar absolute inset-x-4 top-[74px] z-10 flex min-w-0 items-center gap-1 border-y bg-background/95 py-1 sm:inset-x-6">
      <Button size="icon" variant="ghost" aria-label="Manage workspaces" title="Your files" onClick={() => setOpen(true)}><FolderOpen /></Button>
      <nav aria-label="Canvas breadcrumbs" className="flex min-w-0 flex-1 items-center overflow-x-auto">
        <Button variant="ghost" size="sm" className="hidden max-w-40 shrink-0 md:inline-flex" onClick={() => setOpen(true)}><span className="truncate">{w?.title}</span></Button>
        {w && breadcrumbs(w.document.canvases, w.document.activeCanvasId).map((crumb) => <span key={crumb.id} className="flex min-w-0 shrink-0 items-center"><ChevronRight className="h-3 w-3 text-muted-foreground" /><Button size="sm" variant="ghost" className="max-w-36" onClick={() => s.switchCanvas(crumb.id)} aria-current={crumb.id === c?.id ? "page" : undefined}><span className="truncate">{crumb.title}</span></Button></span>)}
      </nav>
      <span role="status" className={`hidden max-w-48 truncate font-mono text-[9px] sm:block ${s.status.includes('Retry') ? 'text-accent-ink' : 'text-muted-foreground'}`} title={s.status}><Cloud className="mr-1 inline h-3 w-3" />{s.status}</span>
      <Button size="sm" variant="outline" disabled={replay} aria-label="Create new canvas" onClick={() => newCanvas()}><Plus /><span className="hidden sm:inline">New canvas</span></Button>
      <Button size="icon" variant={s.status.includes('Retry') ? 'outline' : 'ghost'} title="Retry cloud sync" aria-label="Retry cloud sync" disabled={!user || s.status === 'Saving…'} onClick={() => void syncWorkspaces()}><RefreshCw className={s.status === 'Saving…' ? 'animate-spin' : ''} /></Button>
      <Button size="icon" variant="ghost" title={user ? "Your account" : "Sign in to sync"} aria-label="Workspace account" onClick={() => setAccount(true)}><UserRound /></Button>
    </div>
    {account && <AccountDialog onClose={() => setAccount(false)} />}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="tw-library w-[calc(100%-24px)] max-w-5xl gap-0 overflow-hidden p-0"><DialogHeader className="border-b px-6 py-5"><DialogTitle className="pr-4 text-left font-display text-2xl sm:text-3xl">Your thinking, collected.</DialogTitle><DialogDescription>{s.status}</DialogDescription></DialogHeader>
      <div className="grid min-h-0 grid-cols-[minmax(0,1fr)] md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="min-w-0 border-b bg-muted/40 p-4 md:border-r md:border-b-0">
          <div className="mb-3 flex items-center justify-between"><span className="font-mono text-[10px] uppercase text-muted-foreground">Workspaces</span><Button variant="ghost" size="icon" disabled={replay} aria-label="Create new workspace" title="New workspace" onClick={() => { s.createWorkspace(); setSearch(""); }}><Plus /></Button></div>
          <div className="flex max-h-36 gap-1 overflow-auto md:max-h-[48dvh] md:flex-col">{s.workspaces.map((workspace) => <Button key={workspace.id} variant={workspace.id === s.activeId ? "secondary" : "ghost"} className="min-w-0 shrink-0 justify-start md:w-full" onClick={() => { s.switchWorkspace(workspace.id); setSearch(""); }}><span data-paper={paperColor(workspace.document.color)} className="tw-swatch h-3 w-3 shrink-0 rounded-full border" /><span className="truncate">{workspace.title}</span></Button>)}</div>
          <Button className="mt-4 w-full justify-start" variant="outline" disabled={replay} onClick={() => { s.createWorkspace(); setSearch(""); }}><Plus />New workspace</Button>
        </aside>
        <section className="min-w-0 p-5 md:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><Input key={w?.id} aria-label="Workspace name" className="h-9 border-transparent bg-transparent px-0 font-display text-2xl shadow-none" defaultValue={w?.title} disabled={replay} onBlur={(e) => { if (w) s.renameWorkspace(w.id, e.target.value); }} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} /><div className="mt-2"><ColorPicker value={w?.document.color} label="Workspace color" disabled={replay} onChange={(color) => { if (w) s.setWorkspaceColor(w.id, paperColor(color)); }} /></div></div><Button disabled={replay} onClick={() => newCanvas()}><Plus />New canvas</Button></div>
          <div className="relative mb-4"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" aria-label="Search canvases" placeholder="Find a canvas…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="grid max-h-[36dvh] grid-cols-1 gap-3 overflow-y-auto p-1 sm:grid-cols-2 md:max-h-[40dvh]">
            {w?.document.canvases.filter((canvas) => canvas.title.toLowerCase().includes(search.toLowerCase())).map((canvas) => <article key={canvas.id} className={`overflow-hidden rounded-lg border ${canvas.id === c?.id ? "border-foreground" : ""}`}>
              <Button variant="ghost" data-paper={paperColor(canvas.color)} className="tw-file-preview relative h-24 w-full rounded-none" aria-label={`Open ${canvas.title}`} onClick={() => { s.switchCanvas(canvas.id); setOpen(false); }}><span className="tw-file-mark font-display text-3xl italic">{canvas.title.slice(0, 1)}</span><span className="absolute bottom-2 right-3 font-mono text-[9px] text-muted-foreground">{canvas.nodes.length} cards · {canvas.edges.length} threads</span>{canvas.parentId && <DoorOpen className="absolute left-3 top-3 h-4 w-4" />}</Button>
              <div className="space-y-3 p-3"><Input aria-label={`Rename ${canvas.title}`} defaultValue={canvas.title} disabled={replay} className="h-8 border-transparent px-0 shadow-none" onBlur={(e) => s.renameCanvas(canvas.id, e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
                <div className="flex flex-wrap items-center justify-between gap-2"><ColorPicker value={canvas.color} disabled={replay} label={`Canvas color for ${canvas.title}`} onChange={(color) => s.setCanvasColor(canvas.id, paperColor(color))} /><div className="flex"><Button size="icon" variant="ghost" disabled={replay} aria-label={`Duplicate ${canvas.title}`} title="Duplicate canvas" onClick={() => { s.duplicateCanvas(canvas.id); setOpen(false); }}><Copy /></Button><Button size="icon" variant="ghost" disabled={replay || w.document.canvases.length <= 1} aria-label={`Delete ${canvas.title}`} title="Delete canvas" onClick={() => { if (confirm(`Delete ${canvas.title} and its child canvases?`)) s.deleteCanvas(canvas.id); }}><Trash2 /></Button></div></div>
              </div>
            </article>)}
          </div>
          {w && !w.document.canvases.some((canvas) => canvas.title.toLowerCase().includes(search.toLowerCase())) && <p className="py-8 text-center font-display text-xl text-muted-foreground">No canvases found.</p>}
          <div className="mt-4 flex flex-wrap justify-between gap-2 border-t pt-4"><Button variant="ghost" disabled={replay || !c} onClick={() => newCanvas(c?.id)}><DoorOpen />New child canvas</Button>{user && <Button variant="outline" disabled={replay} onClick={() => { if (confirm("Copy this browser’s signed-out canvases into your account?")) s.importGuest(); }}>Import browser canvases</Button>}</div>
        </section>
      </div>
    </DialogContent></Dialog>
  </>;
}
