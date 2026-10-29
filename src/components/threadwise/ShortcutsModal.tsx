import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard, Command, Plus, Search, Sparkles, Map, LayoutPanelTop, PanelRight } from "lucide-react";

export function ShortcutsModal({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const shortcuts = [
    {
      group: "Global",
      items: [
        { keys: ["⌘", "K"], label: "Open Command Palette", icon: Command },
        { keys: ["?"], label: "Show Keyboard Shortcuts", icon: Keyboard },
        { keys: ["Esc"], label: "Close modal or deselect", icon: null },
      ],
    },
    {
      group: "Workspace Layout",
      items: [
        { keys: ["⌘", "1"], label: "Switch to Split View", icon: LayoutPanelTop }, // Will implement soon
        { keys: ["⌘", "2"], label: "Switch to Tabs View", icon: LayoutPanelTop },
        { keys: ["⌘", "3"], label: "Switch to Slide View", icon: PanelRight },
      ],
    },
    {
      group: "Canvas Actions",
      items: [
        { keys: ["1"], label: "Add Note", icon: Plus },
        { keys: ["2"], label: "Add Idea", icon: Plus },
        { keys: ["3"], label: "Add Question", icon: Plus },
        { keys: ["4"], label: "Add Experiment", icon: Plus },
        { keys: ["5"], label: "Add Action", icon: Plus },
        { keys: ["E"], label: "Explore with AI", icon: Sparkles },
        { keys: ["O"], label: "Open Thought Portal", icon: Map },
        { keys: ["Z"], label: "Focus Field", icon: Search },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-[#FDFBF7] border-black/10 shadow-2xl rounded-2xl">
        <DialogHeader className="border-b border-black/5 px-6 py-5 bg-white/50">
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">
            <Keyboard className="w-6 h-6 text-[#1A1A1A]" /> 
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[70vh] overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {shortcuts.map((group) => (
            <div key={group.group}>
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4 pb-2 border-b border-black/5">
                {group.group}
              </h4>
              <div className="space-y-3">
                {group.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 text-sm text-[#1A1A1A]/80">
                      {item.icon && <item.icon className="w-4 h-4 text-muted-foreground" />}
                      {item.label}
                    </span>
                    <div className="flex gap-1">
                      {item.keys.map((key) => (
                        <kbd key={key} className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-black/10 bg-white px-1.5 font-mono text-[10px] font-medium text-[#1A1A1A] shadow-sm">
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t border-black/5 p-4 bg-black/5 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground font-mono">
            Pro tip: You can type these shortcuts anywhere on the canvas (unless you are typing in a text box).
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}