import { useEffect, useRef, useState } from "react";
import { FileUp, Link2, Scissors, Square } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { addEvidence, readDocument, type Evidence } from "@/lib/threadwise/evidence";
import { streamTask } from "@/lib/threadwise/ai-client";
import { useThread } from "@/lib/threadwise/store";
import { useWorkspaces } from "@/lib/threadwise/workspaces";

export function EvidenceClipper({
  onClose,
  initialFile,
}: {
  onClose: () => void;
  initialFile?: File | undefined;
}) {
  const [mode, setMode] = useState<"url" | "text" | "document">("url");
  const [text, setText] = useState(""),
    [url, setUrl] = useState(""),
    [source, setSource] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [evidence, setEvidence] = useState<Evidence | null>(null);
  const abort = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [origin] = useState(() => {
    const w = useWorkspaces
      .getState()
      .workspaces.find((w) => w.id === useWorkspaces.getState().activeId);
    return {
      workspace: w?.id,
      canvas: w?.document.activeCanvasId,
      anchor: useThread.getState().selectedId,
    };
  });
  useEffect(() => () => abort.current?.abort(), []);
  const file = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    setEvidence(null);
    try {
      const extracted = await readDocument(file);
      if (extracted.length > 80_000)
        throw new Error("Select a shorter document or paste a relevant excerpt.");
      if (!extracted.trim()) throw new Error("This document has no readable text.");
      setText(extracted);
      setSource(file.name);
      setMode("document");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not read this document.");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (initialFile) void file(initialFile);
  }, [initialFile]);
  const extract = async () => {
    abort.current = new AbortController();
    setBusy(true);
    setError("");
    setEvidence(null);
    try {
      const output = await streamTask(
        {
          mode: "clip",
          ...(mode === "url" ? { url } : { text, source: source || "Pasted excerpt" }),
        },
        () => {},
        abort.current.signal,
      );
      const parsed = JSON.parse(output.replace(/^```(?:json)?\s*|\s*```$/g, "")) as Evidence;
      if (!parsed.title || !Array.isArray(parsed.takeaways) || !parsed.takeaways.length)
        throw new Error("No usable takeaways were extracted.");
      setEvidence(parsed);
    } catch (error) {
      if (!abort.current?.signal.aborted)
        setError(error instanceof Error ? error.message : "Could not extract takeaways.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">
            <Scissors className="h-5 w-5" />
            Evidence clipper
          </DialogTitle>
          <DialogDescription>
            {origin.anchor
              ? "Attach a cited note to the selected card."
              : "Bring a source into this canvas as a cited note."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex border-b">
          {(["url", "text", "document"] as const).map((value) => (
            <Button
              key={value}
              disabled={busy}
              variant={mode === value ? "secondary" : "ghost"}
              onClick={() => {
                setMode(value);
                setEvidence(null);
              }}
              className="capitalize"
            >
              {value === "url" ? "Web page" : value}
            </Button>
          ))}
        </div>
        {mode === "url" ? (
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Source URL"
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
        ) : (
          <>
            {mode === "document" && (
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload document"
                className="cursor-pointer border border-dashed p-6 text-center"
                onClick={() => fileInput.current?.click()}
                onKeyDown={(e) => {
                  if (["Enter", " "].includes(e.key)) fileInput.current?.click();
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void file(e.dataTransfer.files[0]);
                }}
              >
                <FileUp className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <span className="font-display">{source || "Drop a document"}</span>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".pdf,.docx,.txt,.md,.csv,.json,.html"
                  className="hidden"
                  onChange={(e) => void file(e.target.files?.[0])}
                />
              </div>
            )}
            <Input
              aria-label="Source citation"
              placeholder="Source title or citation"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
            <Textarea
              aria-label="Source excerpt"
              placeholder="Paste a source excerpt…"
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-accent-ink">
            {error}
          </p>
        )}
        {busy && <Shimmer>Reading the source…</Shimmer>}
        {evidence && (
          <div className="max-h-60 space-y-2 overflow-auto border-t pt-4">
            <h3 className="font-display text-xl">{evidence.title}</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              {evidence.takeaways.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
            <blockquote className="border-l-2 pl-3 text-sm italic text-muted-foreground">
              {evidence.excerpt}
            </blockquote>
            <p className="truncate font-mono text-[10px]">{evidence.source}</p>
          </div>
        )}
        <div className="flex justify-end gap-2">
          {busy ? (
            <Button variant="outline" onClick={() => abort.current?.abort()}>
              <Square />
              Stop
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={mode === "url" ? !url.trim() : !text.trim()}
              onClick={() => void extract()}
            >
              Extract takeaways
            </Button>
          )}
          {evidence && (
            <Button
              onClick={() => {
                const w = useWorkspaces
                  .getState()
                  .workspaces.find((w) => w.id === origin.workspace);
                if (
                  !w ||
                  w.id !== useWorkspaces.getState().activeId ||
                  w.document.activeCanvasId !== origin.canvas
                ) {
                  setError("Return to the original canvas before adding this note.");
                  return;
                }
                addEvidence(evidence, origin.anchor);
                onClose();
              }}
            >
              Add cited note
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
