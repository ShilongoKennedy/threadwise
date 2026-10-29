import { useState, useEffect } from "react";
import Canvas from "./Canvas";
import { DiscourseLab } from "./DiscourseLab";
import { useWorkspaces } from "@/lib/threadwise/workspaces";
import { emptySuite } from "@/lib/threadwise/advanced";
import { Button } from "@/components/ui/button";
import { Columns, LayoutPanelTop, PanelRight, X } from "lucide-react";

export function WorkspaceShell() {
  const [layout, setLayout] = useState<"split" | "tabs" | "slide">("split");
  const [activeTab, setActiveTab] = useState<"lab" | "canvas">("lab");
  const [slideOpen, setSlideOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const ws = useWorkspaces();
  const w = ws.workspaces.find((w) => w.id === ws.activeId);
  const canvas = w?.document.canvases.find((c) => c.id === w.document.activeCanvasId);
  
  const corpus = canvas?.suite?.discourse || undefined;
  const updateSuite = (patch: any) => { 
    if (canvas) ws.updateSuite(canvas.id, { ...(canvas.suite ?? emptySuite()), ...patch }); 
  };

  // RESPONSIVE LOGIC
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setLayout("slide");
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // LISTEN FOR "OPEN LAB"
  useEffect(() => {
    const handleOpenLab = () => {
      if (isMobile) {
        setSlideOpen(false); 
        return;
      }
      if (layout === "split" || layout === "tabs") {
        setLayout("tabs");
        setActiveTab("lab");
      }
      if (layout === "slide") {
        setSlideOpen(false); 
      }
    };
    window.addEventListener("threadwise:open-lab", handleOpenLab);
    return () => window.removeEventListener("threadwise:open-lab", handleOpenLab);
  }, [layout, isMobile]);

  // LISTEN FOR "VIEW CANVAS" (The "Planting Magic")
  useEffect(() => {
    const handleViewCanvas = () => {
      if (isMobile) {
        setSlideOpen(true);
        return;
      }
      if (layout === "tabs") {
        setActiveTab("canvas");
      }
      if (layout === "slide") {
        setSlideOpen(true);
      }
    };
    window.addEventListener("threadwise:view-canvas", handleViewCanvas);
    return () => window.removeEventListener("threadwise:view-canvas", handleViewCanvas);
  }, [layout, isMobile]);

  const labContent = (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-background">
      <DiscourseLab 
        corpus={corpus} 
        update={(discourse) => updateSuite({ discourse })} 
        onClose={() => { 
          if (layout === 'slide' || isMobile) setSlideOpen(false); 
          if (layout === 'tabs') setActiveTab('canvas');
        }} 
      />
    </div>
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <div className="h-14 border-b flex items-center px-4 justify-between shrink-0 bg-card z-[60]">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="font-display text-lg md:text-xl italic font-medium tracking-tight">Threadwise</span>
          <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded-md">Workspace</span>
        </div>
        
        {!isMobile && (
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border">
            <Button 
              size="sm" 
              variant={layout === "split" ? "secondary" : "ghost"} 
              onClick={() => setLayout("split")}
              className="h-8 rounded-lg text-xs"
            >
              <Columns className="w-3.5 h-3.5 mr-1.5" /> Split
            </Button>
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
        )}

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

      <div className="flex-1 relative overflow-hidden flex">
        {layout === "split" && !isMobile && (
          <>
            <div className="w-1/2 h-full border-r overflow-hidden flex flex-col relative z-10">
              {labContent}
            </div>
            <div className="w-1/2 h-full overflow-hidden flex flex-col relative z-0">
              <Canvas />
            </div>
          </>
        )}

        {layout === "tabs" && !isMobile && (
          <div className="w-full h-full relative">
            {activeTab === "lab" ? labContent : <Canvas />}
          </div>
        )}

        {(layout === "slide" || isMobile) && (
          <>
            <div className="w-full h-full relative z-0">
              {labContent}
            </div>
            <div className={`absolute inset-y-0 right-0 w-full md:w-[70%] lg:w-[60%] border-l bg-background shadow-2xl transition-transform duration-300 ease-in-out z-50 flex flex-col ${slideOpen ? "translate-x-0" : "translate-x-full"}`}>
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