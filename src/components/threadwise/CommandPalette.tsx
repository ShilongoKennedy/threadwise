import { useEffect, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { 
  Search, LayoutPanelTop, PanelRight, Columns, 
  BookOpenText, Map, Plus, Settings, LogOut, 
  Fingerprint, ShieldAlert, Sparkles
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useWorkspaces } from "@/lib/threadwise/workspaces";
import { useAccount } from "@/lib/threadwise/cloud-sync";
import { supabase } from "@/integrations/supabase/client";

export function CommandPalette({ 
  open, 
  setOpen, 
  setLayout,
  setActiveTab,
  setSlideOpen
}: { 
  open: boolean; 
  setOpen: (v: boolean) => void;
  setLayout: (v: "split" | "tabs" | "slide") => void;
  setActiveTab: (v: "lab" | "canvas") => void;
  setSlideOpen: (v: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const ws = useWorkspaces();
  const user = useAccount((s) => s.user);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery("");
  }, [open]);

  const actions = [
    {
      id: "lab",
      label: "Open Discourse Lab",
      icon: BookOpenText,
      group: "Navigate",
      perform: () => { setLayout("tabs"); setActiveTab("lab"); setOpen(false); }
    },
    {
      id: "canvas",
      label: "Open Canvas",
      icon: Map,
      group: "Navigate",
      perform: () => { setLayout("tabs"); setActiveTab("canvas"); setOpen(false); }
    },
    {
      id: "split",
      label: "Layout: Split Screen",
      icon: Columns,
      group: "Layout",
      perform: () => { setLayout("split"); setOpen(false); }
    },
    {
      id: "tabs",
      label: "Layout: Tabs",
      icon: LayoutPanelTop,
      group: "Layout",
      perform: () => { setLayout("tabs"); setOpen(false); }
    },
    {
      id: "slide",
      label: "Layout: Slide-over",
      icon: PanelRight,
      group: "Layout",
      perform: () => { setLayout("slide"); setSlideOpen(false); setOpen(false); }
    },
    {
      id: "new-canvas",
      label: "Create New Canvas",
      icon: Plus,
      group: "Workspace",
      perform: () => { ws.createCanvas(); setOpen(false); }
    },
    {
      id: "sample",
      label: "Load Sample Speech",
      icon: Sparkles,
      group: "Workspace",
      perform: () => { 
        window.dispatchEvent(new CustomEvent("threadwise:load-sample"));
        setLayout("tabs");
        setActiveTab("lab");
        setOpen(false); 
      }
    },
    {
      id: "signout",
      label: "Sign Out",
      icon: LogOut,
      group: "Account",
      perform: async () => { await supabase.auth.signOut(); setOpen(false); navigate({ to: "/" }); }
    },
  ];

  const filtered = actions.filter((a) => 
    a.label.toLowerCase().includes(query.toLowerCase()) || 
    a.group.toLowerCase().includes(query.toLowerCase())
  );

  const groups = [...new Set(filtered.map(a => a.group))];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden bg-[#FDFBF7] border-black/10 shadow-2xl rounded-2xl">
        <div className="flex items-center border-b border-black/5 px-4">
          <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 h-14 bg-transparent border-0 outline-none text-base placeholder:text-muted-foreground/50 text-foreground"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground bg-black/5 px-2 py-1 rounded">
            ESC
          </kbd>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto p-2">
          {groups.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">No commands found for "{query}"</p>
          )}
          
          {groups.map(group => (
            <div key={group} className="mb-2">
              <div className="px-2 py-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
                {group}
              </div>
              {filtered.filter(a => a.group === group).map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.perform}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-foreground hover:bg-black/5 transition-colors group"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="flex-1 font-medium">{action.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        
        <div className="border-t border-black/5 p-3 bg-black/5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
            <span className="flex items-center gap-1"><kbd className="bg-white border px-1.5 py-0.5 rounded shadow-sm">↑</kbd> <kbd className="bg-white border px-1.5 py-0.5 rounded shadow-sm">↓</kbd> to navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-white border px-1.5 py-0.5 rounded shadow-sm">↵</kbd> to select</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">Threadwise OS</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}