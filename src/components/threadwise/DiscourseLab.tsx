import { useMemo, useState } from "react";
import { BookOpenText, Columns2, Hash, MapPin, Plus, X, Globe, Loader2, Check, Sparkles, AlertTriangle, Activity, ShieldAlert, Cpu, ArrowRight, Fingerprint, Crosshair, FileWarning, Eye, HelpCircle, Type, Highlighter, Target, GitMerge, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useThread } from "@/lib/threadwise/store";
import { streamTask } from "@/lib/threadwise/ai-client";
import { CODES, clip, countPhrase, emptyCorpus, topTerms, words, type CodeId, type Corpus, type DiscourseDoc } from "@/lib/threadwise/discourse";
import { toast } from "sonner";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, PolarRadiusAxis, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";

type View = "read" | "compare" | "count" | "investigate";
const uid = () => crypto.randomUUID();
const codeLabel = (code: CodeId) => CODES.find((item) => item.id === code)?.label ?? code;

const COLORS = ["#C24A35", "#1A1A1A", "#E3D398", "#6B4C7A", "#2D6A65"];

export function DiscourseLab({ corpus: stored, update, onClose }: { corpus?: Corpus; update: (corpus: Corpus) => void; onClose: () => void }) {
  const corpus = stored ?? emptyCorpus();
  const s = useThread();
  const [view, setView] = useState<View>("read");
  const [activeId, setActiveId] = useState(corpus.docs[0]?.id ?? "");
  const [compareIds, setCompareIds] = useState<[string, string]>([corpus.docs[0]?.id ?? "", corpus.docs[1]?.id ?? ""]);
  const [draft, setDraft] = useState({ title: "", speaker: "", date: "", occasion: "", audience: "", text: "" });
  const [term, setTerm] = useState("");
  const [selection, setSelection] = useState<{ quote: string; doc: DiscourseDoc } | null>(null);
  const [activeNote, setActiveNote] = useState<number | null>(null);
  const [rawView, setRawView] = useState(false);
  
  const savedInv = (corpus as any).investigation || {};
  const savedAnalyses = (corpus as any).analyses || {};
  const savedComparisons = (corpus as any).comparisons || {};
  
  const [urls, setUrls] = useState<string[]>(savedInv.urls?.length ? savedInv.urls : [""]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingSource, setIsAnalyzingSource] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  
  const [analysisError, setAnalysisError] = useState("");
  const [analysis, setAnalysis] = useState<any>(savedInv.analysis || null);
  const [plantedIds, setPlantedIds] = useState<Record<string, boolean>>({});

  const docs = [...corpus.docs].sort((a, b) => a.date.localeCompare(b.date));
  const active = docs.find((doc) => doc.id === activeId) ?? docs[0];
  const activeAnalysis = savedAnalyses[active?.id];

  const docA = docs.find((d) => d.id === compareIds[0]);
  const docB = docs.find((d) => d.id === compareIds[1]);
  const comparisonKey = `${compareIds[0]}_${compareIds[1]}`;
  const comparisonAnalysis = savedComparisons[comparisonKey];

  const save = (patch: Partial<Corpus>) => update({ ...corpus, ...patch });
  
  const deleteDoc = (id: string) => {
    if (!confirm("Delete this document and its analyses?")) return;
    const newDocs = corpus.docs.filter(d => d.id !== id);
    const newAnalyses = { ...savedAnalyses };
    delete newAnalyses[id];
    const newComparisons = { ...savedComparisons };
    Object.keys(newComparisons).forEach(key => {
      if (key.includes(id)) delete newComparisons[key];
    });
    
    update({ ...corpus, docs: newDocs, analyses: newAnalyses, comparisons: newComparisons } as any);
    if (activeId === id) setActiveId(newDocs[0]?.id ?? "");
  };

  const exportReport = (type: "forensic" | "cross-source" | "compare") => {
    let content = "";
    let filename = "";
    
    if (type === "forensic" && active && activeAnalysis) {
      filename = `${active.title.replace(/\s+/g, '-')}-forensic-analysis.md`;
      content = `# Forensic Analysis: ${active.title}\n\n`;
      content += `**Source:** ${active.speaker || "Unknown"} (${active.date || "Undated"})\n\n`;
      content += `## Executive Summary\n${activeAnalysis.executive_summary}\n\n`;
      content += `## Metrics\n- Contradiction Index: ${activeAnalysis.quantData.contradictionIndex}/100\n`;
      content += `- Bias: ${activeAnalysis.quantData.radar.bias}/100\n- Omission: ${activeAnalysis.quantData.radar.omission}/100\n- Urgency: ${activeAnalysis.quantData.radar.urgency}/100\n- Motive: ${activeAnalysis.quantData.radar.motive}/100\n- Evidence: ${activeAnalysis.quantData.radar.evidence}/100\n\n`;
      content += `## Forensic Margin Notes\n`;
      activeAnalysis.margin_notes.forEach((note: any) => {
        content += `### ${note.title} (${note.type})\n**Analysis:** ${note.analysis}\n> "${note.quote}"\n\n`;
      });
      content += `## Unstated Assumptions\n${activeAnalysis.unstated_assumptions.map((a: string) => `- ${a}`).join("\n")}\n\n`;
      content += `## The Dog That Didn't Bark\n${activeAnalysis.questions_to_ask.map((q: string) => `- ${q}`).join("\n")}\n`;
    } else if (type === "cross-source" && analysis) {
      filename = `cross-source-dossier.md`;
      content = `# Cross-Source Intelligence Dossier\n\n`;
      content += `## The Big Picture\n${analysis.conclusion}\n\n`;
      content += `## Metrics\n- Contradiction Index: ${analysis.quantData.contradictionIndex}/100\n\n`;
      content += `## Key Actors\n${analysis.entities.map((e: string) => `- ${e}`).join("\n")}\n\n`;
      content += `## Documented Evidence\n`;
      analysis.evidence.forEach((e: any) => { content += `### ${e.title}\n${e.body}\n*Source: ${e.source}*\n\n`; });
      content += `## Strategic Hypotheses\n`;
      analysis.hypotheses.forEach((h: any) => { content += `### ${h.title}\n${h.body}\n\n`; });
      content += `## Blind Spots\n`;
      analysis.questions.forEach((q: any) => { content += `### ${q.title}\n${q.body}\n\n`; });
    } else if (type === "compare" && docA && docB && comparisonAnalysis) {
      filename = `comparison-${docA.title.slice(0,10)}-vs-${docB.title.slice(0,10)}.md`;
      content = `# Comparative Analysis\n\n`;
      content += `**Source A:** ${docA.title}\n**Source B:** ${docB.title}\n\n`;
      content += `## Divergence Score: ${comparisonAnalysis.divergenceScore}/100\n\n`;
      content += `## Entity Matrix\n`;
      content += `### Shared Focus\n${comparisonAnalysis.shared_entities.map((e: string) => `- ${e}`).join("\n")}\n`;
      content += `### Only in A\n${comparisonAnalysis.unique_to_a.map((e: string) => `- ${e}`).join("\n")}\n`;
      content += `### Only in B\n${comparisonAnalysis.unique_to_b.map((e: string) => `- ${e}`).join("\n")}\n\n`;
      content += `## Flashpoints\n`;
      comparisonAnalysis.flashpoints.forEach((fp: any) => {
        content += `### ${fp.topic}\n**${docA.title}:** ${fp.text_a_view}\n**${docB.title}:** ${fp.text_b_view}\n\n`;
      });
    }

    if (!content) return;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Report exported successfully");
  };
  
  const plant = (doc: DiscourseDoc, quote: string, label = "Discourse evidence") => {
    const id = s.addNode("note", { x: 80 + s.nodes.length * 14, y: 90 + s.nodes.length * 12 });
    s.updateNode(id, (data) => ({ ...data, title: `“${clip(quote, 82)}”`, body: `“${quote}”\n\n— ${doc.title}${doc.speaker ? ` · ${doc.speaker}` : ""}${doc.date ? ` · ${doc.date}` : ""}\n\n${label}`, epistemic: "evidence", meta: { ...data.meta, source: doc.title } }));
    toast.success("Placed on canvas");
  };

  const plantAnalysis = (id: string, kind: "evidence" | "hypothesis" | "question", title: string, body: string, source?: string) => {
    const nodeKind = kind === "evidence" ? "note" : kind === "hypothesis" ? "idea" : "question";
    const nodeId = s.addNode(nodeKind, { x: 80 + s.nodes.length * 14, y: 90 + s.nodes.length * 12 });
    s.updateNode(nodeId, (data) => ({ 
      ...data, title, body, 
      epistemic: kind === "evidence" ? "evidence" : kind === "hypothesis" ? "hypothesis" : "unknown",
      meta: { ...data.meta, source: source || "Cross-Source Investigation" }
    }));
    setPlantedIds(prev => ({ ...prev, [id]: true }));
    toast.success("Planted on canvas");
  };

  const runInvestigation = async () => {
    const validUrls = urls.filter(u => u.trim().length > 5);
    if (validUrls.length === 0) return;
    setIsAnalyzing(true); setAnalysisError(""); setPlantedIds({});
    try {
      const output = await streamTask({ mode: "cross-source", urls: validUrls }, () => {});
      const res = JSON.parse(output);
      if (res.error) setAnalysisError(res.error);
      else {
        const enhancedAnalysis = { ...res.analysis, quantData: res.analysis.quantData || { contradictionIndex: 50, radar: { bias: 70, omission: 80, urgency: 40, motive: 90, evidence: 30 } } };
        setAnalysis(enhancedAnalysis);
        update({ ...corpus, investigation: { urls: validUrls, analysis: enhancedAnalysis } } as any);
      }
    } catch (e: any) { setAnalysisError(e.message || "The investigation failed."); } finally { setIsAnalyzing(false); }
  };

  const runSourceAnalysis = async () => {
    if (!active?.text) return;
    setIsAnalyzingSource(true); setAnalysisError(""); setActiveNote(null);
    try {
      const output = await streamTask({ mode: "analyze-source", text: active.text, source: active.title }, () => {});
      const res = JSON.parse(output);
      if (res.error) setAnalysisError(res.error);
      else {
        update({ ...corpus, analyses: { ...savedAnalyses, [active.id]: res.analysis } } as any);
      }
    } catch (e: any) { setAnalysisError(e.message || "The analysis failed."); } finally { setIsAnalyzingSource(false); }
  };

  const runComparison = async () => {
    if (!docA || !docB) return;
    setIsComparing(true); setAnalysisError("");
    try {
      const output = await streamTask({ mode: "compare", textA: docA.text, textB: docB.text, titleA: docA.title, titleB: docB.title }, () => {});
      const res = JSON.parse(output);
      if (res.error) setAnalysisError(res.error);
      else {
        update({ ...corpus, comparisons: { ...savedComparisons, [comparisonKey]: res.analysis } } as any);
      }
    } catch (e: any) { setAnalysisError(e.message || "The comparison failed."); } finally { setIsComparing(false); }
  };

  // --- HIGHLIGHTING LOGIC ---
  const escapeHtml = (unsafe: string) => unsafe.replace(/[&<"'>]/g, function(m) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'}[m] as string; });
  
  const getHighlightedText = (text: string, notes: any[]) => {
    if (!notes || !notes.length) return escapeHtml(text).replace(/\n/g, '<br/>');
    let result = escapeHtml(text);
    const sortedNotes = notes.map((note, i) => ({ ...note, originalIndex: i })).sort((a, b) => b.quote.length - a.quote.length);
    
    sortedNotes.forEach(note => {
      const escapedQuote = escapeHtml(note.quote).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuote})`, 'gi');
      let bgClass = ""; let borderClass = "";
      if (note.type === "contradiction") { bgClass = "bg-[#FBD0D4]/60"; borderClass = "border-b-2 border-[#C24A35]"; }
      else if (note.type === "fallacy") { bgClass = "bg-[#FDF0B6]/70"; borderClass = "border-b-2 border-[#E3D398]"; }
      else { bgClass = "bg-[#E8DAFB]/60"; borderClass = "border-b-2 border-[#6B4C7A]"; }
      result = result.replace(regex, `<span id="hl-${note.originalIndex}" data-note-index="${note.originalIndex}" class="${bgClass} ${borderClass} px-1 rounded-sm cursor-pointer transition-all hover:bg-opacity-100 hover:shadow-sm" title="${note.title}">$1</span>`);
    });
    return result.replace(/\n/g, '<br/>');
  };

  const handleTextClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'SPAN' && target.dataset.noteIndex) {
      const index = Number(target.dataset.noteIndex);
      setActiveNote(index);
      document.getElementById(`margin-note-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleMarginNoteClick = (index: number) => {
    setActiveNote(index);
    document.getElementById(`hl-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const sourceRadarData = activeAnalysis?.quantData?.radar ? [
    { subject: "Bias", A: activeAnalysis.quantData.radar.bias },
    { subject: "Omission", A: activeAnalysis.quantData.radar.omission },
    { subject: "Urgency", A: activeAnalysis.quantData.radar.urgency },
    { subject: "Motive", A: activeAnalysis.quantData.radar.motive },
    { subject: "Evidence", A: activeAnalysis.quantData.radar.evidence },
  ] : [];

  const compareRadarData = comparisonAnalysis?.radar ? [
    { subject: "Bias", A: comparisonAnalysis.radar.a.bias, B: comparisonAnalysis.radar.b.bias },
    { subject: "Omission", A: comparisonAnalysis.radar.a.omission, B: comparisonAnalysis.radar.b.omission },
    { subject: "Urgency", A: comparisonAnalysis.radar.a.urgency, B: comparisonAnalysis.radar.b.urgency },
    { subject: "Motive", A: comparisonAnalysis.radar.a.motive, B: comparisonAnalysis.radar.b.motive },
    { subject: "Evidence", A: comparisonAnalysis.radar.a.evidence, B: comparisonAnalysis.radar.b.evidence },
  ] : [];

  const terms = corpus.terms;
  const termCounts = useMemo(() => docs.map((doc) => ({ doc, values: terms.map((phrase) => ({ phrase, n: countPhrase(doc.text, phrase), rate: words(doc.text).length ? Math.round(countPhrase(doc.text, phrase) / words(doc.text).length * 10000) / 10 : 0 })) })), [docs, terms]);

  const chartData = useMemo(() => {
    return docs.map((doc) => {
      const data: any = { name: doc.title.slice(0, 15) + (doc.title.length > 15 ? "..." : "") };
      terms.forEach((t) => {
        const count = countPhrase(doc.text, t);
        data[t] = words(doc.text).length ? Math.round((count / words(doc.text).length) * 10000) / 10 : 0;
      });
      return data;
    });
  }, [docs, terms]);

  const ContradictionGauge = ({ score }: { score: number }) => {
    const radius = 50, cx = 60, cy = 60, startAngle = -210, endAngle = 30;
    const angle = startAngle + (endAngle - startAngle) * (score / 100);
    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
      const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
      return { x: centerX + radius * Math.cos(angleInRadians), y: centerY + radius * Math.sin(angleInRadians) };
    };
    const describeArc = (x: number, y: number, r: number, start: number, end: number) => {
      const startPt = polarToCartesian(x, y, r, end);
      const endPt = polarToCartesian(x, y, r, start);
      const largeArcFlag = end - start <= 180 ? "0" : "1";
      return ["M", startPt.x, startPt.y, "A", r, r, 0, largeArcFlag, 0, endPt.x, endPt.y].join(" ");
    };
    const needle = polarToCartesian(cx, cy, radius - 10, angle);
    return (
      <div className="relative flex flex-col items-center justify-center w-full h-full min-h-[120px]">
        <svg width="100" height="80" viewBox="0 0 120 100" className="overflow-visible">
          <path d={describeArc(cx, cy, radius, startAngle, endAngle)} fill="none" stroke="var(--muted)" strokeWidth="10" strokeLinecap="round" />
          <path d={describeArc(cx, cy, radius, startAngle, angle)} fill="none" stroke="#C24A35" strokeWidth="10" strokeLinecap="round" className="transition-all duration-1000 ease-out" />
          <circle cx={cx} cy={cy} r="5" fill="var(--foreground)" />
          <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="var(--foreground)" strokeWidth="2.5" strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute bottom-0 text-center">
          <span className="font-display text-4xl text-[#C24A35] tracking-tighter">{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-background font-sans relative overflow-hidden" role="region" aria-label="Discourse Lab">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `linear-gradient(to right, var(--foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      <header className="relative z-10 flex items-center justify-between border-b px-6 py-4 bg-card shrink-0">
        <div>
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Crosshair className="h-3 w-3" /> The Reading Room
          </span>
          <h2 className="font-display text-3xl text-foreground">Discourse Lab</h2>
        </div>
        <nav className="flex gap-1 bg-muted/50 p-1 rounded-xl border">
          {([ ["read", "Forensic Workbench", BookOpenText, !!activeAnalysis], ["investigate", "Cross-Source", Globe, !!analysis], ["compare", "Text Diff", Columns2, !!comparisonAnalysis], ["count", "Metrics", Hash, terms.length > 0] ] as const).map(([id, label, Icon, hasData]) => (
            <Button key={id} size="sm" variant={view === id ? "secondary" : "ghost"} onClick={() => setView(id)} className={`relative rounded-lg transition-all ${view === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="mr-2 h-4 w-4" />{label}
              {hasData && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#C24A35]" />}
            </Button>
          ))}
        </nav>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X /></Button>
      </header>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        <aside className="flex w-64 shrink-0 flex-col border-r bg-card/50">
          <div className="border-b p-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-3">Indexed Sources · {docs.length}</span>
            <div className="space-y-3">
              <Input placeholder="Document title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="h-9 text-xs font-medium" />
              <Textarea rows={3} placeholder="Paste raw text..." value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} className="resize-none text-xs" />
              <Button size="sm" className="h-9 w-full text-xs" disabled={!draft.title.trim() || !draft.text.trim()} onClick={() => {
                if (!draft.title.trim() || !draft.text.trim()) return; 
                const doc = { id: uid(), ...draft, title: draft.title.trim(), text: draft.text.trim() }; 
                save({ docs: [...corpus.docs, doc] }); setActiveId(doc.id); setDraft({ title: "", speaker: "", date: "", occasion: "", audience: "", text: "" }); 
              }}><Plus className="mr-1 h-3 w-3" /> Index Document</Button>
            </div>
          </div>
          <ol className="flex-1 space-y-1 overflow-y-auto p-3">
            {docs.map((doc) => (
              <li key={doc.id} className={`group relative rounded-lg transition-all ${doc.id === active?.id ? "border bg-card shadow-sm" : "border border-transparent hover:bg-muted/50"}`}>
                <button className="w-full p-4 pr-10 text-left" onClick={() => { setActiveId(doc.id); setView("read"); }}>
                  <small className="mb-1 block font-mono text-[10px] text-muted-foreground">{doc.date || "undated"}</small>
                  <b className="block truncate font-display text-sm text-foreground">{doc.title}</b>
                </button>
                <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ol>
        </aside>

        <main className="flex-1 overflow-y-auto bg-background/50">
          
          {view === "read" && active && (
            <div className="mx-auto max-w-7xl p-6 pb-24 h-full flex flex-col">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 shrink-0">
                <div className="min-w-0">
                  <h3 className="mb-2 font-display text-3xl leading-tight truncate">{active.title}</h3>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{active.speaker || "Unknown speaker"} · {active.date || "undated"}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {activeAnalysis && (
                    <>
                      <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => exportReport("forensic")} title="Export Analysis"><Download className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" className={`h-9 w-9 ${rawView ? 'bg-muted' : ''}`} onClick={() => setRawView(!rawView)} title={rawView ? "Show Highlights" : "Show Raw Text"}>
                        {rawView ? <Highlighter className="h-4 w-4" /> : <Type className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 border-dashed text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => { 
                        const newAnalyses = { ...savedAnalyses };
                        delete newAnalyses[active.id];
                        update({ ...corpus, analyses: newAnalyses } as any); 
                        setActiveNote(null);
                      }}>
                        Clear Analysis
                      </Button>
                    </>
                  )}
                  <Button onClick={runSourceAnalysis} disabled={isAnalyzingSource} className="h-9 px-6">
                    {isAnalyzingSource ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Fingerprint className="mr-2 h-4 w-4" /> Analyze Source</>}
                  </Button>
                </div>
              </div>

              {analysisError && <p className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive shrink-0">{analysisError}</p>}

              <div className="flex flex-1 flex-col xl:flex-row gap-6 min-h-0">
                <article className="flex-1 rounded-xl border bg-card p-8 shadow-sm overflow-y-auto relative min-h-[400px]">
                  <div 
                    className="font-serif text-lg leading-loose text-foreground/90 whitespace-pre-wrap selection:bg-[#CBE6F9]"
                    onClick={handleTextClick}
                    dangerouslySetInnerHTML={{ __html: (activeAnalysis && !rawView) ? getHighlightedText(active.text, activeAnalysis.margin_notes) : escapeHtml(active.text).replace(/\n/g, '<br/>') }}
                    onMouseUp={() => { const q = window.getSelection()?.toString().trim() ?? ""; if (q.length > 3 && !window.getSelection()?.toString().includes('\n')) setSelection({ quote: q, doc: active }); }}
                  />
                </article>

                <aside className="w-full xl:w-[400px] shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 pb-10">
                  {!activeAnalysis && !isAnalyzingSource && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8 border rounded-xl border-dashed bg-card/30">
                      <Fingerprint className="h-10 w-10 text-muted-foreground/50 mb-4" />
                      <h4 className="font-display text-xl mb-2">Awaiting Analysis</h4>
                      <p className="text-sm text-muted-foreground">Click "Analyze Source" to run forensic linguistics and extract hidden motives, biases, and contradictions.</p>
                    </div>
                  )}

                  {isAnalyzingSource && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8">
                      <Loader2 className="h-8 w-8 text-[#C24A35] animate-spin mb-4" />
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground animate-pulse">Extracting Motives → Mapping Fallacies → Measuring Bias</p>
                    </div>
                  )}

                  {activeAnalysis && (
                    <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-500">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                          <h4 className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Narrative Profile</h4>
                          <div className="h-32 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={sourceRadarData} margin={{ top: 5, right: 15, bottom: 5, left: 15 }}>
                                <PolarGrid stroke="var(--border)" strokeDasharray="2 2" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 8, fontFamily: 'var(--font-mono)' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Analysis" dataKey="A" stroke="#C24A35" strokeWidth={1.5} fill="#C24A35" fillOpacity={0.15} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col items-center justify-center">
                          <h4 className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1 w-full text-left">Contradiction</h4>
                          <ContradictionGauge score={activeAnalysis.quantData?.contradictionIndex || 50} />
                        </div>
                      </div>

                      <div className="rounded-xl border bg-[#FDFBF7] p-5 shadow-sm border-l-4 border-l-[#C24A35]">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#C24A35] mb-2">Executive Summary</h4>
                        <p className="font-display text-base leading-relaxed text-foreground">{activeAnalysis.executive_summary}</p>
                      </div>

                      <div>
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground border-b pb-2 mb-3">Forensic Margin Notes</h4>
                        <div className="space-y-3">
                          {activeAnalysis.margin_notes?.map((note: any, i: number) => {
                            const isActive = activeNote === i;
                            return (
                              <div 
                                key={i} 
                                id={`margin-note-${i}`}
                                onClick={() => handleMarginNoteClick(i)}
                                className={`rounded-lg border bg-card p-4 shadow-sm cursor-pointer transition-all duration-300 ${isActive ? "ring-2 ring-[#C24A35] shadow-md scale-[1.02]" : "hover:border-border-strong"}`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  {note.type === "contradiction" && <AlertTriangle className="h-3 w-3 text-[#C24A35]" />}
                                  {note.type === "fallacy" && <FileWarning className="h-3 w-3 text-[#E3D398]" />}
                                  {note.type === "motive" && <Eye className="h-3 w-3 text-[#6B4C7A]" />}
                                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{note.type}</span>
                                </div>
                                <b className="block font-display text-sm mb-1">{note.title}</b>
                                <p className="text-xs text-muted-foreground leading-relaxed mb-3">"{note.analysis}"</p>
                                <div className={`p-2 rounded text-[11px] font-serif italic text-foreground/70 border-l-2 ${isActive ? "border-[#C24A35] bg-[#FBD0D4]/20" : "border-muted-foreground/20 bg-muted/30"}`}>"{clip(note.quote, 60)}"</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground border-b pb-2 mb-3">Unstated Assumptions</h4>
                        <div className="space-y-2">
                          {activeAnalysis.unstated_assumptions?.map((text: string, i: number) => (
                            <div key={i} className="flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm">
                              <p className="text-xs text-foreground leading-relaxed">{text}</p>
                              <Button size="sm" variant="ghost" className="h-7 self-end text-[9px] uppercase tracking-wider text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); plantAnalysis(`asm-${i}`, "hypothesis", "Unstated Assumption", text, active.title); }}>
                                <MapPin className="mr-1 h-3 w-3" /> Plant
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground border-b pb-2 mb-3">The Dog That Didn't Bark</h4>
                        <div className="space-y-2">
                          {activeAnalysis.questions_to_ask?.map((text: string, i: number) => (
                            <div key={i} className="flex flex-col gap-2 rounded-lg border bg-[#FDF6F4] border-[#C24A35]/20 p-3 shadow-sm">
                              <div className="flex items-start gap-2">
                                <HelpCircle className="h-3 w-3 text-[#C24A35] shrink-0 mt-0.5" />
                                <p className="text-xs text-foreground leading-relaxed">{text}</p>
                              </div>
                              <Button size="sm" variant="ghost" className="h-7 self-end text-[9px] uppercase tracking-wider text-[#C24A35] hover:bg-[#C24A35]/10" onClick={(e) => { e.stopPropagation(); plantAnalysis(`q-${i}`, "question", "Missing Context", text, active.title); }}>
                                <MapPin className="mr-1 h-3 w-3" /> Plant
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </aside>
              </div>
            </div>
          )}

          {view === "investigate" && (
            <div className="mx-auto max-w-6xl p-6 pb-24">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h3 className="mb-2 font-display text-4xl tracking-tight text-foreground">Cross-Source Dossier</h3>
                  <p className="max-w-xl text-sm text-muted-foreground">Cross-reference global sources, extract quantitative sentiment signals, and map strategic blind spots.</p>
                </div>
                {analysis && (
                  <Button variant="outline" className="border-black/10" onClick={() => exportReport("cross-source")}>
                    <Download className="mr-2 h-4 w-4" /> Export Dossier
                  </Button>
                )}
              </div>

              <div className="mb-10 flex flex-col sm:flex-row items-center gap-2 rounded-xl border bg-card p-2 shadow-sm">
                <div className="flex flex-1 flex-col sm:flex-row gap-2 w-full">
                  {urls.map((url, i) => (
                    <div key={i} className="relative flex-1 w-full">
                      <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={url} placeholder="https://foreignaffairs.com/..." className="h-11 border-transparent bg-muted/30 pl-11 font-mono text-sm focus-visible:ring-1 focus-visible:ring-ring" onChange={(e) => { const newUrls = [...urls]; newUrls[i] = e.target.value; setUrls(newUrls); }} />
                      {urls.length > 1 && <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2" onClick={() => setUrls(urls.filter((_, idx) => idx !== i))}><X className="h-3 w-3 text-muted-foreground" /></Button>}
                    </div>
                  ))}
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                  <Button variant="outline" size="icon" onClick={() => setUrls([...urls, ""])} className="h-11 w-11 shrink-0"><Plus className="h-4 w-4" /></Button>
                  <Button onClick={runInvestigation} disabled={isAnalyzing || urls.every(u => u.trim() === "")} className="h-11 flex-1 sm:flex-none shrink-0 px-8">
                    {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <><Sparkles className="mr-2 h-4 w-4" /> Analyze Sources</>}
                  </Button>
                </div>
              </div>

              {analysisError && <p className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{analysisError}</p>}

              {isAnalyzing && (
                <div className="py-24 text-center">
                  <div className="relative mb-8 inline-block">
                    <div className="h-16 w-16 animate-spin rounded-full border-2 border-muted border-t-foreground"></div>
                    <Fingerprint className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-foreground animate-pulse" />
                  </div>
                  <h4 className="mb-2 font-display text-2xl text-foreground">Deconstructing Narratives...</h4>
                  <p className="animate-pulse font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Entity Extraction → Semantic Mapping → Contradiction Analysis</p>
                </div>
              )}

              {analysis && !isAnalyzing && (
                <div className="animate-in fade-in slide-in-from-bottom-8 space-y-6 duration-700">
                  <section className="relative rounded-xl border bg-card p-10 shadow-sm overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-1 bg-[#C24A35]" />
                    <div className="mb-4 flex items-center gap-3">
                      <div className="bg-muted p-2 rounded-lg"><FileWarning className="h-5 w-5 text-foreground" /></div>
                      <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">The Big Picture</h4>
                    </div>
                    <p className="font-display text-2xl md:text-3xl leading-relaxed text-foreground first-letter:text-6xl first-letter:float-left first-letter:mr-3 first-letter:mt-1">{analysis.conclusion}</p>
                  </section>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-12 items-stretch mt-8">
                    <div className="md:col-span-4 flex flex-col rounded-xl border bg-card p-5 shadow-sm h-[320px]">
                      <div className="mb-2 flex items-center justify-between relative z-10">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Narrative Profile</h4>
                        <Activity className="h-3 w-3 text-[#C24A35]" />
                      </div>
                      <div className="flex-1 w-full relative z-10 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={sourceRadarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                            <PolarGrid stroke="var(--border)" strokeDasharray="3 3" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Analysis" dataKey="A" stroke="#C24A35" strokeWidth={2} fill="#C24A35" fillOpacity={0.15} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col rounded-xl border bg-card p-5 shadow-sm h-[320px]">
                      <div className="mb-4 flex items-center justify-between relative z-10">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Key Actors</h4>
                        <Globe className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="flex-1 overflow-y-auto pr-2 relative z-10">
                        <div className="flex flex-col gap-2">
                          {analysis.entities?.map((entity: string, i: number) => {
                            const isCentral = i < 2;
                            const color = isCentral ? "bg-foreground text-background border-transparent" : "bg-muted/40 text-foreground border-border";
                            return (
                              <span key={i} className={`w-full px-3 py-2 ${color} border rounded-md text-xs font-medium truncate`} title={entity}>
                                {entity}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col rounded-xl border bg-card p-5 shadow-sm h-[320px]">
                      <div className="mb-2 flex items-center justify-between relative z-10">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Contradiction Index</h4>
                        <ShieldAlert className="h-3 w-3 text-[#C24A35]" />
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                        <ContradictionGauge score={analysis.quantData?.contradictionIndex || 50} />
                        <p className="text-[10px] text-center font-mono uppercase tracking-widest text-muted-foreground mt-4 border border-border px-3 py-1 rounded-full bg-muted/30">High friction detected</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-8">
                    <section className="rounded-xl border bg-card p-6 shadow-sm">
                      <h4 className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground border-b pb-4"><Check className="h-4 w-4" /> Documented Evidence</h4>
                      <div className="space-y-4">
                        {analysis.evidence?.map((item: any, i: number) => (
                          <div key={i} className="group relative flex flex-col rounded-lg border bg-background p-5 transition-all hover:border-border-strong hover:shadow-sm">
                            <b className="mb-2 block font-display text-base text-foreground">{item.title}</b>
                            <p className="mb-4 flex-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                            <div className="mt-auto flex items-center justify-between border-t pt-3">
                              <span className="max-w-[200px] truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{item.source}</span>
                              <Button size="sm" variant={plantedIds[`ev-${i}`] ? "secondary" : "outline"} className={`h-8 rounded-md px-4 text-[10px] uppercase tracking-wider font-bold ${plantedIds[`ev-${i}`] ? "bg-foreground text-background" : ""}`} onClick={() => plantAnalysis(`ev-${i}`, "evidence", item.title, item.body, item.source)}>
                                {plantedIds[`ev-${i}`] ? <><Check className="mr-1 h-3 w-3" /> Planted</> : <><MapPin className="mr-1 h-3 w-3" /> Plant</>}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <div className="space-y-6">
                      <section className="rounded-xl border bg-card p-6 shadow-sm">
                        <h4 className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground border-b pb-4"><Sparkles className="h-4 w-4" /> Strategic Hypotheses</h4>
                        <div className="space-y-3">
                          {analysis.hypotheses?.map((item: any, i: number) => (
                            <div key={i} className="flex flex-col rounded-lg border bg-background p-5">
                              <b className="mb-1 block font-display text-base text-foreground">{item.title}</b>
                              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                              <Button size="sm" variant="ghost" className={`h-8 self-end rounded-md text-[10px] font-bold uppercase tracking-wider ${plantedIds[`hyp-${i}`] ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`} onClick={() => plantAnalysis(`hyp-${i}`, "hypothesis", item.title, item.body)}>
                                {plantedIds[`hyp-${i}`] ? <><Check className="mr-1 h-3 w-3" /> Planted</> : <><MapPin className="mr-1 h-3 w-3" /> Plant</>}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </section>
                      <section className="rounded-xl border bg-card p-6 shadow-sm">
                        <h4 className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground border-b pb-4"><AlertTriangle className="h-4 w-4" /> Blind Spots</h4>
                        <div className="space-y-3">
                          {analysis.questions?.map((item: any, i: number) => (
                            <div key={i} className="flex flex-col rounded-lg border bg-background p-5">
                              <b className="mb-1 block font-display text-base text-[#C24A35]">{item.title}</b>
                              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                              <Button size="sm" variant="ghost" className={`h-8 self-end rounded-md text-[10px] font-bold uppercase tracking-wider ${plantedIds[`q-${i}`] ? "text-[#C24A35] bg-[#C24A35]/10" : "text-[#C24A35] hover:bg-[#C24A35]/10"}`} onClick={() => plantAnalysis(`q-${i}`, "question", item.title, item.body)}>
                                {plantedIds[`q-${i}`] ? <><Check className="mr-1 h-3 w-3" /> Planted</> : <><MapPin className="mr-1 h-3 w-3" /> Plant</>}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === "compare" && (
            <div className="mx-auto max-w-6xl p-6 pb-24">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h3 className="mb-2 font-display text-4xl tracking-tight text-foreground">Comparative Intelligence</h3>
                  <p className="max-w-xl text-sm text-muted-foreground">Cross-examine two narratives to reveal diverging framings, omissions, and direct contradictions.</p>
                </div>
                {comparisonAnalysis && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-9 border-dashed" onClick={() => exportReport("compare")}>
                      <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 border-dashed text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => { 
                      const newComparisons = { ...savedComparisons };
                      delete newComparisons[comparisonKey];
                      update({ ...corpus, comparisons: newComparisons } as any); 
                    }}>
                      Clear Comparison
                    </Button>
                  </div>
                )}
              </div>

              <div className="mb-8 flex flex-col md:flex-row items-end gap-4 rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[0, 1].map((index) => (
                    <div key={index}>
                      <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1 block">Source {index === 0 ? "A" : "B"}</label>
                      <select className="w-full rounded-md border bg-background p-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring" value={compareIds[index]} onChange={(e) => setCompareIds((value) => index === 0 ? [e.target.value, value[1]] : [value[0], e.target.value])}>
                        <option value="" disabled>Select a document</option>
                        {docs.map((doc) => <option key={doc.id} value={doc.id}>{doc.date} · {doc.title}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <Button onClick={runComparison} disabled={isComparing || !docA || !docB || docA.id === docB.id} className="h-[38px] px-6 w-full md:w-auto shrink-0">
                  {isComparing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Comparing...</> : <><GitMerge className="mr-2 h-4 w-4" /> Run Comparison</>}
                </Button>
              </div>

              {analysisError && <p className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{analysisError}</p>}

              {isComparing && (
                <div className="py-24 text-center">
                  <div className="relative mb-8 inline-block">
                    <div className="h-16 w-16 animate-spin rounded-full border-2 border-muted border-t-foreground"></div>
                    <Activity className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-foreground animate-pulse" />
                  </div>
                  <h4 className="mb-2 font-display text-2xl text-foreground">Cross-examining Narratives...</h4>
                  <p className="animate-pulse font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Mapping Entities → Detecting Omissions → Measuring Divergence</p>
                </div>
              )}

              {comparisonAnalysis && !isComparing && docA && docB && (
                <div className="animate-in fade-in slide-in-from-bottom-8 space-y-6 duration-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col items-center justify-center h-[320px]">
                      <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#C24A35] mb-4 text-center">Divergence Score</h4>
                      <ContradictionGauge score={comparisonAnalysis.divergenceScore} />
                      <p className="text-[10px] text-center font-mono uppercase tracking-widest text-muted-foreground mt-6 border border-border px-3 py-1 rounded-full bg-muted/30">
                        {comparisonAnalysis.divergenceScore > 70 ? "Fundamentally Opposed" : comparisonAnalysis.divergenceScore > 40 ? "Moderate Friction" : "Broad Alignment"}
                      </p>
                    </div>

                    <div className="md:col-span-2 rounded-xl border bg-card p-6 shadow-sm h-[320px]">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Comparative Narrative Profile</h4>
                      </div>
                      <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={compareRadarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                            <PolarGrid stroke="var(--border)" strokeDasharray="3 3" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name={docA.title} dataKey="A" stroke="#C24A35" strokeWidth={2} fill="#C24A35" fillOpacity={0.2} />
                            <Radar name={docB.title} dataKey="B" stroke="var(--foreground)" strokeWidth={2} fill="var(--foreground)" fillOpacity={0.1} />
                            <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'var(--font-mono)', paddingTop: '10px' }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <section className="rounded-xl border bg-card p-6 shadow-sm">
                    <h4 className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground border-b pb-4"><Target className="h-4 w-4" /> Entity Matrix</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h5 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3 text-center">Shared Focus</h5>
                        <div className="flex flex-col gap-2">
                          {comparisonAnalysis.shared_entities?.map((e: string, i: number) => (
                            <span key={i} className="w-full px-3 py-1.5 bg-muted text-foreground border rounded-md text-xs font-medium text-center truncate">{e}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-mono text-[10px] uppercase tracking-widest text-[#C24A35] mb-3 text-center">Only in {docA.title.slice(0, 15)}...</h5>
                        <div className="flex flex-col gap-2">
                          {comparisonAnalysis.unique_to_a?.map((e: string, i: number) => (
                            <span key={i} className="w-full px-3 py-1.5 bg-[#FBD0D4]/40 text-foreground border border-[#C24A35]/20 rounded-md text-xs font-medium text-center truncate">{e}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-mono text-[10px] uppercase tracking-widest text-foreground mb-3 text-center">Only in {docB.title.slice(0, 15)}...</h5>
                        <div className="flex flex-col gap-2">
                          {comparisonAnalysis.unique_to_b?.map((e: string, i: number) => (
                            <span key={i} className="w-full px-3 py-1.5 bg-[#CBE6F9]/40 text-foreground border border-foreground/20 rounded-md text-xs font-medium text-center truncate">{e}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-xl border bg-card p-6 shadow-sm">
                    <h4 className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground border-b pb-4"><AlertTriangle className="h-4 w-4" /> Flashpoints</h4>
                    <div className="space-y-4">
                      {comparisonAnalysis.flashpoints?.map((fp: any, i: number) => (
                        <div key={i} className="rounded-lg border bg-background overflow-hidden">
                          <div className="bg-muted/50 px-4 py-2 border-b font-display text-sm font-bold">{fp.topic}</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                            <div className="p-4">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-[#C24A35] block mb-2">{docA.title}</span>
                              <p className="text-xs leading-relaxed text-foreground/80">{fp.text_a_view}</p>
                            </div>
                            <div className="p-4">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-foreground block mb-2">{docB.title}</span>
                              <p className="text-xs leading-relaxed text-foreground/80">{fp.text_b_view}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {!comparisonAnalysis && !isComparing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {[docA, docB].map((doc, i) => doc && (
                    <article className="rounded-xl border bg-card p-8 shadow-sm" key={doc.id}>
                      <h3 className="mb-4 font-display text-2xl">{doc.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground line-clamp-[20]">{doc.text}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === "count" && (
            <div className="mx-auto max-w-5xl p-6 pb-24">
              <div className="mb-10 flex items-end justify-between">
                <div>
                  <h3 className="mb-2 font-display text-4xl">Language Trajectory</h3>
                  <p className="text-sm text-muted-foreground">Track phrases across texts. Rates are per 1,000 words, so texts of different lengths remain comparable.</p>
                </div>
              </div>
              
              <form className="mb-6 flex flex-col sm:flex-row gap-3" onSubmit={(e) => { e.preventDefault(); const value = term.trim().toLowerCase(); if (value && !terms.includes(value) && terms.length < 6) save({ terms: [...terms, value] }); setTerm(""); }}>
                <Input value={term} placeholder="Track a word or phrase (e.g. 'security', 'border')" onChange={(e) => setTerm(e.target.value)} className="h-12 text-base rounded-lg flex-1" />
                <Button className="h-12 px-8 text-base">Track</Button>
              </form>
              
              <div className="mb-10 flex flex-wrap gap-2">
                {terms.map((item, i) => (
                  <button key={item} className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted shadow-sm" onClick={() => save({ terms: terms.filter((phrase) => phrase !== item) })}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {item} <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>

              {terms.length > 0 && docs.length > 0 && (
                <div className="mb-12 rounded-xl border bg-card p-8 shadow-sm">
                  <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-6">Phrase Frequency (per 1k words)</h4>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                          cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                          contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--font-sans)' }}
                        />
                        {terms.map((t, i) => (
                          <Bar key={t} dataKey={t} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="mb-16 space-y-4 rounded-xl border bg-card p-6 shadow-sm">
                {termCounts.map(({ doc, values }) => (
                  <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 last:border-0 last:pb-0 gap-4">
                    <b className="font-display text-base max-w-[300px] truncate">{doc.date || "—"} · {doc.title}</b>
                    <div className="flex gap-6 flex-wrap">
                      {values.map((value, i) => (
                        <div key={value.phrase} className="text-right">
                          <span className="block font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{value.phrase}</span>
                          <strong className="text-xl" style={{ color: COLORS[i % COLORS.length] }}>{value.rate}</strong>
                          <span className="text-[10px] text-muted-foreground ml-1">/1k</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {terms.length === 0 && <p className="py-8 text-center font-display text-lg text-muted-foreground">Add a phrase above to see its frequency across documents.</p>}
              </div>

              <section>
                <h3 className="mb-8 font-display text-2xl">Vocabulary Fingerprint</h3>
                <div className="space-y-8">
                  {docs.map((doc) => (
                    <div key={doc.id} className="flex flex-col gap-4">
                      <b className="text-sm font-mono uppercase tracking-widest text-muted-foreground border-b pb-2">{doc.title}</b>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {topTerms(doc.text, 15).map(([word, count], i) => {
                          const size = count > 20 ? "text-2xl font-bold" : count > 10 ? "text-lg font-semibold" : "text-base";
                          const color = i % 3 === 0 ? "text-[#C24A35]" : i % 3 === 1 ? "text-foreground" : "text-muted-foreground";
                          return (
                            <button key={word} className={`${size} ${color} hover:opacity-60 transition-opacity font-display`} onClick={() => setTerm(word)} title={`${count} occurrences`}>
                              {word}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
      
      {selection && (
        <div className="fixed bottom-10 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-card p-2 shadow-lg animate-in slide-in-from-bottom-8">
          <span className="px-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Code as:</span>
          {CODES.map((code) => <button key={code.id} className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" onClick={() => { 
             if (!selection) return; 
             const at = selection.doc.text.indexOf(selection.quote); 
             if (at < 0) return; 
             if (!corpus.annotations.some((mark) => mark.docId === selection.doc.id && mark.start === at)) {
               save({ annotations: [...corpus.annotations, { id: uid(), docId: selection.doc.id, start: at, end: at + selection.quote.length, quote: selection.quote, code: code.id, note: "" }] }); 
             }
             setSelection(null); 
             window.getSelection()?.removeAllRanges(); 
          }}>{code.label}</button>)}
          <Button size="sm" className="rounded-md px-4 font-bold uppercase tracking-wider text-[10px]" onClick={() => { plant(selection.doc, selection.quote); setSelection(null); }}>Plant</Button>
          <Button variant="ghost" size="icon" className="rounded-full ml-1" onClick={() => setSelection(null)}><X className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}