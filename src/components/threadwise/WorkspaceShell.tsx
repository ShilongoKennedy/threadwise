import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import Canvas from "./Canvas";
import { DiscourseLab } from "./DiscourseLab";
import { useWorkspaces } from "@/lib/threadwise/workspaces";
import { emptySuite } from "@/lib/threadwise/advanced";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { WorkspaceBar } from "./WorkspaceBar";
import { Columns, LayoutPanelTop, PanelRight, X, Command, Keyboard, Scale } from "lucide-react";
import { CommandPalette } from "./CommandPalette";
import { ShortcutsModal } from "./ShortcutsModal";

export function WorkspaceShell() {
  const [layout, setLayout] = useState<"split" | "tabs" | "slide">("tabs");
  const [activeTab, setActiveTab] = useState<"lab" | "canvas">("lab");
  const [slideOpen, setSlideOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [focusSource, setFocusSource] = useState<string | null>(null);

  const [cmdOpen, setCmdOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 1024);
      setIsLargeScreen(width >= 1440);
      if (width < 1440 && layout === "split") setLayout("tabs");
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, [layout]);

  // Global Keyboard Listeners
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest('[role="dialog"]')
      ) return;

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((open) => !open);
      }

      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const ws = useWorkspaces();
  const w = ws.workspaces.find((w) => w.id === ws.activeId);
  const canvas = w?.document.canvases.find((c) => c.id === w.document.activeCanvasId);
  const corpus = canvas?.suite?.discourse || undefined;
  const updateSuite = (patch: any) => {
    if (canvas) ws.updateSuite(canvas.id, { ...(canvas.suite ?? emptySuite()), ...patch });
  };

  useEffect(() => {
    const handleOpenLab = () => {
      if (layout === "tabs") { setActiveTab("lab"); }
      if (layout === "slide") { setSlideOpen(false); }
    };
    const handleViewCanvas = () => {
      if (layout === "tabs") { setActiveTab("canvas"); }
      if (layout === "slide") { setSlideOpen(true); }
    };
    const handleFocusSource = (e: Event) => {
      const detail = (e as CustomEvent<{ source?: string }>).detail;
      if (!detail?.source) return;
      setFocusSource(detail.source);
      if (layout === "tabs") setActiveTab("lab");
      if (layout === "slide") setSlideOpen(false);
    };
    window.addEventListener("threadwise:open-lab", handleOpenLab);
    window.addEventListener("threadwise:view-canvas", handleViewCanvas);
    window.addEventListener("threadwise:focus-source", handleFocusSource);
    return () => {
      window.removeEventListener("threadwise:open-lab", handleOpenLab);
      window.removeEventListener("threadwise:view-canvas", handleViewCanvas);
      window.removeEventListener("threadwise:focus-source", handleFocusSource);
    };
  }, [layout]);

  // Planting a card in the lab has to be able to show its result.
  useEffect(() => {
    const reveal = () => {
      if (isMobile || layout === "slide") {
        setSlideOpen(true);
        if (layout !== "slide") setActiveTab("canvas");
      } else {
        setActiveTab("canvas");
      }
      if (layout === "slide") setSlideOpen(true);
    };
    window.addEventListener("threadwise:open-canvas", reveal);
    return () => window.removeEventListener("threadwise:open-canvas", reveal);
  }, [isMobile, layout]);

  const labContent = (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-background">
      <DiscourseLab
        {...(corpus ? { corpus } : {})}
        update={(discourse) => updateSuite({ discourse })}
        onClose={() => {
          if (layout === 'slide') setSlideOpen(false);
          if (layout === 'tabs') setActiveTab('canvas');
        }}
        focusSource={focusSource}
        onFocusHandled={() => setFocusSource(null)}
      />
    </div>
  );

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <CommandPalette
        open={cmdOpen}
        setOpen={setCmdOpen}
        setLayout={setLayout}
        setActiveTab={setActiveTab}
        setSlideOpen={setSlideOpen}
      />
      <ShortcutsModal open={shortcutsOpen} setOpen={setShortcutsOpen} />

      <div className="h-14 border-b flex items-center px-4 justify-between shrink-0 bg-card z-[60]">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="hidden font-display text-lg md:text-xl italic font-medium tracking-tight sm:inline">Threadwise</span>
          <span className="hidden lg:inline-block font-mono text-[10px] uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded-md">Workspace</span>
        </div>

        <div className="flex min-w-0 flex-1 items-center px-1 md:px-2">
          <WorkspaceBar />
        </div>

        {isMobile && (
          <Button
            size="sm"
            variant={slideOpen ? "default" : "outline"}
            onClick={() => setSlideOpen((v) => !v)}
            aria-label={slideOpen ? "Close the canvas" : "Open the canvas"}
            className="h-8 shrink-0 gap-1.5 px-2 text-xs"
          >
            <LayoutPanelTop className="h-3.5 w-3.5" />
            {slideOpen ? "Lab" : "Canvas"}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              aria-label="Change layout"
              className="hidden h-8 gap-1.5 text-xs lg:flex"
            >
              {layout === "slide" ? <PanelRight className="h-3.5 w-3.5" /> : <LayoutPanelTop className="h-3.5 w-3.5" />}
              <span className="capitalize">{layout}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="tw-sheet w-52 p-1">
            {isLargeScreen && (
              <DropdownMenuItem onSelect={() => setLayout("split")}>
                <Columns className="h-3.5 w-3.5" /> Split
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => setLayout("tabs")}>
              <LayoutPanelTop className="h-3.5 w-3.5" /> Tabs
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setLayout("slide")}>
              <PanelRight className="h-3.5 w-3.5" /> Slide
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {layout === "slide" || isMobile ? (
              <DropdownMenuItem onSelect={() => setSlideOpen(!slideOpen)}>
                {slideOpen ? "Close canvas" : "Open canvas"}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => setActiveTab(activeTab === "lab" ? "canvas" : "lab")}>
                Switch to {activeTab === "lab" ? "Canvas" : "Lab"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => setShortcutsOpen(true)}>
              <Keyboard className="h-3.5 w-3.5" /> Shortcuts
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCmdOpen(true)}
            className="hidden md:flex items-center gap-2 h-8 text-xs text-muted-foreground bg-background rounded-lg border-black/10 shadow-sm hover:text-foreground"
          >
            <Command className="w-3.5 h-3.5" />
            <span>Search</span>
            <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          <Link
            to="/analyst"
            title="Bring a move to the analyst"
            className="inline-flex h-8 shrink-0 items-center gap-1.5 border-2 border-[#1A1A1A] bg-[#1A4BFF] px-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-[2px_2px_0_0_#1A1A1A] transition-all hover:bg-[#1A1A1A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <Scale className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Morning Brief</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex">
        {layout === "split" && isLargeScreen && !isMobile && (
          <>
            <div className="w-1/2 h-full border-r overflow-hidden flex flex-col relative z-10">{labContent}</div>
            <div className="w-1/2 h-full overflow-hidden flex flex-col relative z-0"><Canvas /></div>
          </>
        )}

        {layout === "tabs" && !isMobile && (
          <div className="w-full h-full relative">
            {activeTab === "lab" ? labContent : <Canvas />}
          </div>
        )}

        {(layout === "slide" || isMobile) && (
          <>
            <div className="w-full h-full relative z-0">{labContent}</div>
            <div className={`absolute inset-y-0 right-0 w-full md:w-[75%] lg:w-[65%] border-l bg-background shadow-2xl transition-transform duration-300 ease-in-out z-50 flex flex-col ${slideOpen ? "translate-x-0" : "translate-x-full"}`}>
              <div className="h-10 border-b flex items-center justify-between px-4 bg-muted/20 shrink-0">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Canvas View</span>
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Close canvas" onClick={() => setSlideOpen(false)}><X className="h-3 w-3" /></Button>
              </div>
              <div className="flex-1 relative overflow-hidden"><Canvas /></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}