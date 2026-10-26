import { createNodeData } from "./model";
import { useThread } from "./store";
export type Evidence = { title: string; takeaways: string[]; source: string; sourceTitle: string; excerpt: string };
export function addEvidence(evidence: Evidence, anchorId: string | null) {
  const s = useThread.getState();
  if (s.replayIndex !== null) return;
  const anchor = s.nodes.find((n) => n.id === anchorId);
  const id = crypto.randomUUID();
  const node = { id, type: "thread" as const, position: { x: (anchor?.position.x ?? 0) + 348, y: anchor?.position.y ?? 0 }, data: { ...createNodeData("note", evidence.title), body: evidence.takeaways.map((t) => `• ${t}`).join("\n"), meta: { source: evidence.source, sourceTitle: evidence.sourceTitle, excerpt: evidence.excerpt, capturedAt: new Date().toISOString() } } };
  useThread.setState({ nodes: [...s.nodes, node], edges: anchor ? [...s.edges, { id: crypto.randomUUID(), type: "relation", source: id, target: anchor.id, data: { relation: "supports" } }] : s.edges, selectedId: id });
  return id;
}
export async function readDocument(file: File): Promise<string> {
  if (/\.pdf$/i.test(file.name)) {
    const pdf = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdf.GlobalWorkerOptions.workerSrc = worker.default;
    const task = pdf.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
    const document = await task.promise;
    let text = "";
    for (let i = 1; i <= document.numPages; i++) {
      const page = await document.getPage(i); const content = await page.getTextContent();
      text += `\n[Page ${i}]\n${content.items.map((item) => "str" in item ? item.str : "").join(" ")}`;
    }
    await task.destroy();
    if (!text.trim()) throw new Error("This PDF has no selectable text. Paste a transcription instead.");
    return text;
  }
  if (/\.docx$/i.test(file.name)) {
    const mammoth = await import("mammoth/mammoth.browser");
    return (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
  }
  if (!/\.(txt|md|csv|json|html)$/i.test(file.name)) throw new Error("Choose a PDF, DOCX, TXT, Markdown, CSV, JSON or HTML document.");
  return file.text();
}