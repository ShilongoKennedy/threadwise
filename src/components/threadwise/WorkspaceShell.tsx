import { useState, useEffect } from "react";
import Canvas from "./Canvas";
import { DiscourseLab } from "./DiscourseLab";
import { useWorkspaces } from "@/lib/threadwise/workspaces";
import { emptySuite } from "@/lib/threadwise/advanced";
import { Button } from "@/components/ui/button";
import { Columns, LayoutPanelTop, PanelRight, X } from "lucide-react";

export function WorkspaceShell() {
  // 1. DEFAULT IS NOW TABS
  const [layout, setLayout] = useState<"split" | "tabs" | "slide">("tabs");
  const [activeTab, setActiveTab] = useState<"lab" | "canvas">("lab");
  const [slideOpen, setSlideOpen] = useState(false);
  
  // Track screen size to prevent broken layouts
  const [isLargeScreen, setIsLargeScreen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 1024);
      setIsLargeScreen(width >= 1440); // Only allow Split on large monitors
      
      // Automatically kick out of Split view if the window gets too small
      if (width < 1440 && layout === "split") {
        setLayout("tabs");
      }
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, [layout]);

  const ws = useWorkspaces();
  const w = ws.workspaces.find((w) => w.id === ws.activeId);
  const canvas = w?.document.canvases.find((c) => c.id === w.document.activeCanvasId);
  
  const corpus = canvas?.suite?.discourse || undefined;
  const updateSuite = (patch: any) => { 
    if (canvas) ws.updateSuite(canvas.id, { ...(canvas.suite ?? emptySuite()), ...patch }); 
  };

  // Listen for the "Open Lab" request from the Canvas Studio
  useEffect(() => {
    const handleOpenLab = () => {
      if (layout === "tabs") { setActiveTab("lab"); }
      if (layout === "slide") { setSlideOpen(false); }
    };
    window.addEventListener("threadwise:open-lab", handleOpenLab);
    return () => window.removeEventListener("threadwise:open-lab", handleOpenLab);
  }, [layout]);

  // Listen for the "View Canvas" request (the Planting Magic)
  useEffect(() => {
    const handleViewCanvas = () => {
      if (layout === "tabs") { setActiveTab("canvas"); }
      if (layout === "slide") { setSlideOpen(true); }
    };
    window.addEventListener("threadwise:view-canvas", handleViewCanvas);
    return () => window.removeEventListener("threadwise:view-canvas", handleViewCanvas);
  }, [layout]);

  const labContent = (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-background">
      <DiscourseLab 
        corpus={corpus} 
        update={(discourse) => updateSuite({ discourse })} 
        onClose={() => { 
          if (layout === 'slide') setSlideOpen(false); 
          if (layout === 'tabs') setActiveTab('canvas');
        }} 
      />
    </div>
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* HEADER */}
      <div className="h-14 border-b flex items-center px-4 justify-between shrink-0 bg-card z-[60]">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="font-display text-lg md:text-xl italic font-medium tracking-tight">Threadwise</span>
          <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded-md">Workspace</span>
        </div>
        
        {/* LAYOUT TOGGLES */}
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border">
          {/* Only show Split if the screen is wide enough to handle it */}
          {isLargeScreen && (
            <Button 
              size="sm" 
              variant={layout === "split" ? "secondary" : "ghost"} 
              onClick={() => setLayout("split")}
              className="h-8 rounded-lg text-xs"
            >
              <Columns className="w-3.5 h-3.5 mr-1.5" /> Split
            </Button>
          )}
          <Button 
            size="sm" 
            variant={layout === "tabs" ? "secondary" : "ghost"} 
            onClick={() => setLayout("tabs")}
            className="h-8 rounded-lg text-xs"
          >
            <LayoutPanelTop className="w-3.5 h-3.5 mr-1.5" /> Tabs
          </Button>
          <Button 
            size="sm" 
            variant={layout === "slide" ? "secondary" : "ghost"} 
            onClick={() => setLayout("slide")}
            className="h-8 rounded-lg text-xs"
          >
            <PanelRight className="w-3.5 h-3.5 mr-1.5" /> Slide
          </Button>
        </div>

        {/* CONTEXTUAL ACTIONS */}
        <div className="flex justify-end shrink-0">
          {(layout === "slide" || isMobile) && (
             <Button size="sm" variant={slideOpen ? "default" : "outline"} onClick={() => setSlideOpen(!slideOpen)}>
               {slideOpen ? "Close Canvas" : "Open Canvas"}
             </Button>
          )}
          {layout === "tabs" && !isMobile && (
             <Button size="sm" variant="outline" onClick={() => setActiveTab(activeTab === "lab" ? "canvas" : "lab")}>
               Switch to {activeTab === "lab" ? "Canvas" : "Lab"}
             </Button>
          )}
        </div>
      </div>

      {/* LAYOUT RENDERING ENGINE */}
      <div className="flex-1 relative overflow-hidden flex">
        
        {/* OPTION A: SPLIT VIEW (Only on Large Screens) */}
        {layout === "split" && isLargeScreen && !isMobile && (
          <>
            <div className="w-1/2 h-full border-r overflow-hidden flex flex-col relative z-10">
              {labContent}
            </div>
            <div className="w-1/2 h-full overflow-hidden flex flex-col relative z-0">
              <Canvas />
            </div>
          </>
        )}

        {/* OPTION B: TABS VIEW (Default) */}
        {layout === "tabs" && !isMobile && (
          <div className="w-full h-full relative">
            {activeTab === "lab" ? labContent : <Canvas />}
          </div>
        )}

        {/* OPTION C: SLIDE VIEW (Overlays Canvas over Lab) */}
        {(layout === "slide" || isMobile) && (
          <>
            <div className="w-full h-full relative z-0">
              {labContent}
            </div>
            
            {/* The Sliding Canvas Overlay */}
            <div className={`absolute inset-y-0 right-0 w-full md:w-[75%] lg:w-[65%] border-l bg-background shadow-2xl transition-transform duration-300 ease-in-out z-50 flex flex-col ${slideOpen ? "translate-x-0" : "translate-x-full"}`}>
              <div className="h-10 border-b flex items-center justify-between px-4 bg-muted/20 shrink-0">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Canvas View</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSlideOpen(false)}><X className="h-3 w-3" /></Button>
              </div>
              <div className="flex-1 relative overflow-hidden">
                <Canvas />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}