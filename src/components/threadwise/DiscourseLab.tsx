import { useMemo, useState, useRef, useEffect } from "react";
import { BookOpenText, Columns2, Hash, MapPin, Plus, X, Globe, Loader2, Check, Sparkles, AlertTriangle, Activity, ShieldAlert, Cpu, ArrowRight, Fingerprint, Crosshair, FileWarning, Eye, HelpCircle, Type, Highlighter, Target, GitMerge, Download, Trash2, Wand2, Search, FileSearch, GitCompare, FileUp, Terminal, Database, Network, AlertOctagon, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useThread } from "@/lib/threadwise/store";
import { streamTask } from "@/lib/threadwise/ai-client";
import { CODES, clip, countPhrase, emptyCorpus, topTerms, words, type CodeId, type Corpus, type DiscourseDoc } from "@/lib/threadwise/discourse";
import { readDocument } from "@/lib/threadwise/evidence";
import { archiveInsight } from "@/lib/threadwise/archivist";
import { toast } from "sonner";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, PolarRadiusAxis, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";

type View = "read" | "compare" | "count" | "investigate" | "archives";
const uid = () => crypto.randomUUID();
const codeLabel = (code: CodeId) => CODES.find((item) => item.id === code)?.label ?? code;

const COLORS = ["#C24A35", "#1A1A1A", "#E3D398", "#6B4C7A", "#2D6A65"];

const SAMPLE_TEXT = `"I was in a country somewhere in the Middle East, and also in Europe, and the people said, we took our gold out of the vaults in New York City and moved it to our country. You know what I said to him? I said, you have three armies within 400 miles who can come take your gold."

"That’s the real world. You’re not thinking clearly about safety. That gold is protected by the Atlantic, the Pacific, the United States military, the rule of law."

"But if we are not the preeminent military and economy, you will see our reserve status come down."`;

const LOADING_STEPS = [
  "INGESTING SOURCE...",
  "EXTRACTING ENTITIES...",
  "MAPPING RHETORICAL FALLACIES...",
  "SCORING NARRATIVE BIAS...",
  "DRAFTING EXECUTIVE SUMMARY..."
];

const sanitizeAnalysis = (res: any) => {
  if (!res) return null;
  const quantData = res.quantData || {};
  const radar = quantData.radar || {};
  
  return {
    ...res,
    executive_summary: res.executive_summary || "No summary generated.",
    conclusion: res.conclusion || "No conclusion generated.",
    entities: Array.isArray(res.entities) ? res.entities : [],
    evidence: Array.isArray(res.evidence) ? res.evidence : [],
    hypotheses: Array.isArray(res.hypotheses) ? res.hypotheses : [],
    questions: Array.isArray(res.questions) ? res.questions : [],
    questions_to_ask: Array.isArray(res.questions_to_ask) ? res.questions_to_ask : [],
    unstated_assumptions: Array.isArray(res.unstated_assumptions) ? res.unstated_assumptions : [],
    margin_notes: Array.isArray(res.margin_notes) ? res.margin_notes : [],
    quantData: {
      contradictionIndex: Number(quantData.contradictionIndex) || 50,
      radar: {
        bias: Number(radar.bias) || 50,
        omission: Number(radar.omission) || 50,
        urgency: Number(radar.urgency) || 50,
        motive: Number(radar.motive) || 50,
        evidence: Number(radar.evidence) || 50,
      }
    }
  };
};

const CinematicLoader = ({ mode }: { mode: "forensic" | "cross-source" }) => {
  const [step, setStep] = useState(0);
  const [hex, setHex] = useState<string[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => setStep(s => Math.min(s + 1, 4)), 1200);
    const hexInterval = setInterval(() => {
      const newHex = Array.from({ length: 8 }).map(() => Math.floor(Math.random()*16777215).toString(16).toUpperCase().padStart(6, '0'));
      setHex(newHex);
    }, 100);
    return () => { clearInterval(interval); clearInterval(hexInterval); };
  }, []);

  const isCross = mode === "cross-source";

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[400px] overflow-hidden rounded-xl bg-[#050505] border border-[#C24A35]/30 shadow-[inset_0_0_50px_rgba(194,74,53,0.1)]">
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.75) 50%), linear-gradient(90deg, rgba(255,0,0,0.06), rgba(0,255,0,0.02), rgba(0,0,255,0.06))', backgroundSize: '100% 4px, 3px 100%' }} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[300px] h-[300px] rounded-full bg-[#C24A35]/10 blur-[60px] animate-pulse" />
      </div>
      <div className="absolute left-4 top-0 bottom-0 flex flex-col justify-center opacity-20 pointer-events-none">
        {hex.map((h, i) => <span key={i} className="font-mono text-[8px] text-[#C24A35] leading-tight">{h}</span>)}
      </div>
      <div className="absolute right-4 top-0 bottom-0 flex flex-col justify-center opacity-20 pointer-events-none">
        {hex.slice().reverse().map((h, i) => <span key={i} className="font-mono text-[8px] text-[#C24A35] leading-tight">{h}</span>)}
      </div>
      <div className="relative z-10 w-full max-w-sm text-left font-mono">
        <div className="flex items-center gap-3 mb-6 pb-3 border-b border-[#C24A35]/30 text-[#C24A35]">
          {isCross ? <Network className="w-5 h-5 animate-pulse" /> : <Terminal className="w-5 h-5 animate-pulse" />}
          <span className="text-xs tracking-[0.2em] font-bold">
            {isCross ? "CROSS-SOURCE INGESTION" : "FORENSIC MAINFRAME"}
          </span>
        </div>
        <div className="space-y-3">
          {LOADING_STEPS.map((s, idx) => (
            <div key={idx} className={`flex items-start gap-2 text-[10px] transition-all duration-500 ${idx > step ? 'opacity-0 translate-y-2' : idx === step ? 'opacity-100 text-[#C24A35]' : 'opacity-40 text-[#75F09A]'}`}>
              <span className="shrink-0">{idx < step ? "[OK]" : idx === step ? "[>>]" : "[  ]"}</span>
              <span className={idx === step ? "animate-pulse" : ""}>{s}</span>
            </div>
          ))}
        </div>
        {step >= 4 && (
          <div className="mt-8 border border-[#C24A35]/50 bg-[#C24A35]/10 p-3 text-center text-xs font-bold tracking-widest text-[#C24A35] animate-pulse">
            SYNTHESIS COMPLETE
          </div>
        )}
      </div>
    </div>
  );
};

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
  const [isDragging, setIsDragging] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  
  const [consensusMode, setConsensusMode] = useState(false);

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

  const [archiveQuery, setArchiveQuery] = useState("");
  const [isSearchingArchive, setIsSearchingArchive] = useState(false);
  const [archiveResult, setArchiveResult] = useState<any>(null);
  const [archiveError, setArchiveError] = useState("");

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

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setIsReadingFile(true);
    try {
      const text = await readDocument(file);
      if (!text.trim()) throw new Error("No readable text found in this file.");
      
      const newDoc = { 
        id: uid(), 
        title: file.name.replace(/\.[^/.]+$/, ""), 
        speaker: "", 
        date: new Date().toISOString().split('T')[0], 
        text: text.slice(0, 50000)
      };
      
      save({ docs: [...corpus.docs, newDoc] });
      setActiveId(newDoc.id);
      toast.success("Document indexed successfully");
      
      setTimeout(() => { document.getElementById("analyze-source-btn")?.click(); }, 100);
      
    } catch (err: any) {
      toast.error(err.message || "Failed to read document");
    } finally {
      setIsReadingFile(false);
      setIsDragging(false);
    }
  };

  const loadSample = () => {
    const newDoc = { id: uid(), title: "Jamie Dimon on Gold & Military", speaker: "Jamie Dimon", date: "2024-01-01", text: SAMPLE_TEXT };
    save({ docs: [...corpus.docs, newDoc] });
    setActiveId(newDoc.id);
    setTimeout(() => { document.getElementById("analyze-source-btn")?.click(); }, 100);
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
      
      if (activeAnalysis.consensus) {
        content += `## Multi-Model Consensus\n`;
        content += `**OpenAI Contradiction Index:** ${activeAnalysis.consensus.openai.quantData.contradictionIndex}/100\n\n`;
        content += `### Disagreements:\n${activeAnalysis.consensus.disagreements.map((d: string) => `- ${d}`).join("\n")}\n\n`;
      }

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
  
  const plantToCanvas = async (title: string, body: string, kind: "evidence" | "hypothesis" | "question", sourceTitle: string) => {
    const nodeKind = kind === "evidence" ? "note" : kind === "hypothesis" ? "idea" : "question";
    const epistemic = kind === "evidence" ? "evidence" : kind === "hypothesis" ? "hypothesis" : "unknown";
    
    // 1. Create / Find Dossier Anchor
    let dossierId = useThread.getState().nodes.find(n => n.data.meta.dossier === "true" && n.data.meta.source === sourceTitle)?.id;
    if (!dossierId) {
        dossierId = s.addNode("note", { x: -450, y: 100 + useThread.getState().nodes.length * 200 });
        s.updateNode(dossierId, { title: `DOSSIER: ${sourceTitle}`, body: "Source document anchor.", epistemic: "fact", meta: { dossier: "true", source: sourceTitle } });
    }

    // 2. Create Insight
    const nodeId = s.addNode(nodeKind, { x: 80 + useThread.getState().nodes.length * 14, y: 90 + useThread.getState().nodes.length * 12 });
    s.updateNode(nodeId, { title, body, epistemic, meta: { source: sourceTitle } });

    // 3. Connect Insight to Dossier
    s.connect({ source: dossierId, target: nodeId, sourceHandle: null, targetHandle: null }, "leads_to");

    // 4. Archive to Cloudflare
    void archiveInsight(nodeId, `${title}\n\n${body}`, { source: sourceTitle, type: kind });

    // 5. Smart Wiring
    toast.loading("Planted. Auto-wiring...", { id: "autowire" });
    try {
        const others = useThread.getState().nodes.filter(n => n.id !== nodeId && n.id !== dossierId).map(n => ({ id: n.id, title: n.data.title, body: n.data.body }));
        if (others.length > 0) {
            const output = await streamTask({ mode: "find-connections", text: `${title}\n\n${body}`, nodes: others }, () => {});
            const res = JSON.parse(output);
            if (res.connections && Array.isArray(res.connections)) {
                let count = 0;
                res.connections.forEach((c: any) => {
                    if (useThread.getState().nodes.some(n => n.id === c.targetId) && c.targetId !== nodeId) {
                        s.connect({ source: nodeId, target: c.targetId, sourceHandle: null, targetHandle: null }, c.relation);
                        count++;
                    }
                });
                toast.success(`Planted & wired ${count} connection${count === 1 ? '' : 's'}.`, { id: "autowire" });
            } else {
                toast.success("Planted.", { id: "autowire" });
            }
        } else {
            toast.success("Planted.", { id: "autowire" });
        }
    } catch (e) {
        toast.success("Planted. (Auto-wire unavailable)", { id: "autowire" });
    }
  };

  const plant = (doc: DiscourseDoc, quote: string, label = "Discourse evidence") => {
    const nodeTitle = `“${clip(quote, 82)}”`;
    const nodeBody = `“${quote}”\n\n— ${doc.title}${doc.speaker ? ` · ${doc.speaker}` : ""}${doc.date ? ` · ${doc.date}` : ""}\n\n${label}`;
    void plantToCanvas(nodeTitle, nodeBody, "evidence", doc.title);
  };

  const plantAnalysis = (id: string, kind: "evidence" | "hypothesis" | "question", title: string, body: string, source?: string) => {
    setPlantedIds(prev => ({ ...prev, [id]: true }));
    void plantToCanvas(title, body, kind, source || "Cross-Source Investigation");
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
        const clean = sanitizeAnalysis(res.analysis);
        setAnalysis(clean);
        update({ ...corpus, investigation: { urls: validUrls, analysis: clean } } as any);
      }
    } catch (e: any) { setAnalysisError(e.message || "The investigation failed."); } finally { setIsAnalyzing(false); }
  };

  const runSourceAnalysis = async () => {
    if (!active?.text) return;
    setIsAnalyzingSource(true); setAnalysisError(""); setActiveNote(null);
    try {
      const mode = consensusMode ? "analyze-source-consensus" : "analyze-source";
      const output = await streamTask({ mode, text: active.text, source: active.title }, () => {});
      const res = JSON.parse(output);
      if (res.error) setAnalysisError(res.error);
      else {
        const clean = sanitizeAnalysis(res.analysis);
        if (res.analysis.consensus) {
            clean.consensus = res.analysis.consensus;
        }
        update({ ...corpus, analyses: { ...savedAnalyses, [active.id]: clean } } as any);
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

  const runArchiveSearch = async () => {
    if (!archiveQuery.trim()) return;
    setIsSearchingArchive(true); setArchiveError(""); setArchiveResult(null);
    try {
      const output = await streamTask({ mode: "ask-archives", text: archiveQuery }, () => {});
      const res = JSON.parse(output);
      if (res.error) setArchiveError(res.error);
      else setArchiveResult(res.analysis);
    } catch (e: any) {
      setArchiveError(e.message || "The archive search failed.");
    } finally {
      setIsSearchingArchive(false);
    }
  };

  const escapeHtml = (unsafe: string) => unsafe.replace(/[&<"'>]/g, function(m) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'}[m] as string; });
  
  const getHighlightedText = (text: string, notes: any[]) => {
    if (!notes || !notes.length) return escapeHtml(text).replace(/\n/g, '<br/>');
    let result = escapeHtml(text);
    const sortedNotes = notes
      .filter((note) => typeof note.quote === "string" && note.quote.length > 0)
      .map((note, i) => ({ ...note, originalIndex: i }))
      .sort((a, b) => b.quote.length - a.quote.length);
    
    sortedNotes.forEach(note => {
      const escapedQuote = escapeHtml(note.quote).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuote})`, 'gi');
      let bgClass = ""; let borderClass = "";
      if (note.type === "contradiction") { bgClass = "bg-[#FBD0D4]/60"; borderClass = "border-b-2 border-[#C24A35]"; }
      else if (note.type === "fallacy") { bgClass = "bg-[#FDF0B6]/70"; borderClass = "border-b-2 border-[#E3D398]"; }
      else { bgClass = "bg-[#E8DAFB]/60"; borderClass = "border-b-2 border-[#6B4C7A]"; }
      
      const escapedTitle = escapeHtml(note.title || "Observation");
      
      result = result.replace(regex, (match) => 
        `<span id="hl-${note.originalIndex}" data-note-index="${note.originalIndex}" class="${bgClass} ${borderClass} px-1 rounded-sm cursor-pointer transition-all hover:bg-opacity-100 hover:shadow-sm" title="${escapedTitle}">${match}</span>`
      );
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

  const TacticalGauge = ({ score, label = "Contradiction" }: { score: number, label?: string }) => {
    const radius = 46, cx = 60, cy = 60, startAngle = -210, endAngle = 30;
    const angle = startAngle + (endAngle - startAngle) * (Math.max(0, Math.min(100, score)) / 100);
    
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
    
    const needle = polarToCartesian(cx, cy, radius - 8, angle);

    const ticks = Array.from({ length: 21 }).map((_, i) => {
      const tickAngle = startAngle + (endAngle - startAngle) * (i / 20);
      const isMajor = i % 5 === 0;
      const p1 = polarToCartesian(cx, cy, radius + 6, tickAngle);
      const p2 = polarToCartesian(cx, cy, radius + (isMajor ? 12 : 8), tickAngle);
      return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={isMajor ? "var(--foreground)" : "var(--muted-foreground)"} strokeWidth={isMajor ? 2 : 1} />;
    });

    return (
      <div className="relative flex flex-col items-center justify-center w-full h-full min-h-[160px] rounded-xl bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] border border-black shadow-inner overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #fff 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
        
        <svg width="100%" height="100%" viewBox="0 0 120 110" className="absolute inset-0 z-10">
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id="needleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C24A35" />
              <stop offset="100%" stopColor="#FF5E3A" />
            </linearGradient>
          </defs>

          <path d={describeArc(cx, cy, radius, 75, endAngle)} fill="none" stroke="#C24A35" strokeWidth="10" strokeLinecap="round" opacity={0.6} />
          <path d={describeArc(cx, cy, radius, startAngle, endAngle)} fill="none" stroke="#333" strokeWidth="10" strokeLinecap="round" />
          {ticks}
          <path d={describeArc(cx, cy, radius, startAngle, angle)} fill="none" stroke="#C24A35" strokeWidth="10" strokeLinecap="round" filter="url(#glow)" className="transition-all duration-1000 ease-out" />
          
          <g className="transition-all duration-1000 ease-out">
            <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="url(#needleGrad)" strokeWidth="3" strokeLinecap="round" filter="url(#glow)" />
            <circle cx={cx} cy={cy} r="8" fill="#1A1A1A" stroke="#444" strokeWidth="2" />
            <circle cx={cx} cy={cy} r="3" fill="#FF5E3A" filter="url(#glow)" />
          </g>
        </svg>
        
        <div className="absolute bottom-3 z-20 flex flex-col items-center">
          <span className="font-mono text-[8px] uppercase tracking-widest text-[#C24A35]/80 mb-1">{label}</span>
          <span className="font-display text-3xl text-[#FF5E3A] leading-none" style={{ textShadow: "0 0 15px rgba(255,94,58,0.6)" }}>{score}</span>
        </div>
      </div>
    );
  };

  const TacticalRadar = ({ data }: { data: any[] }) => {
    return (
      <div className="relative w-full h-full min-h-[160px] rounded-xl bg-[#0A0A0A] border border-black overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 opacity-20" style={{ 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', 
          backgroundSize: '10px 10px' 
        }} />
        
        <div className="absolute inset-0 rounded-full border border-[#75F09A]/10 animate-[spin_4s_linear_infinite] origin-center" style={{ background: 'conic-gradient(from 0deg at 50% 50%, rgba(117,240,154,0.1) 0deg, transparent 90deg)' }} />

        <div className="relative z-10 w-full h-full p-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#75F09A" strokeDasharray="1 4" opacity={0.3} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#75F09A', fontSize: 8, fontFamily: 'var(--font-mono)', opacity: 0.7 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Analysis" dataKey="A" stroke="#75F09A" strokeWidth={1.5} fill="#75F09A" fillOpacity={0.15} 
                dot={{ r: 2, fill: '#0A0A0A', stroke: '#75F09A', strokeWidth: 1.5 }} 
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="absolute top-2 left-3 font-mono text-[8px] uppercase tracking-widest text-[#75F09A]/60">
          SIGNAL_ACQ // NARRATIVE
        </div>
        <div className="absolute top-2 right-3 flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#75F09A] animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#75F09A]/40" />
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-background font-sans relative overflow-hidden" role="region" aria-label="Discourse Lab">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `linear-gradient(to right, var(--foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      <header className="relative z-10 flex items-center justify-between border-b px-6 py-4 bg-[#FDFBF7] shrink-0">
        <div>
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Crosshair className="h-3 w-3" /> The Reading Room
          </span>
          <h2 className="font-display text-3xl text-foreground">Discourse Lab</h2>
        </div>
        <nav className="flex gap-1 bg-black/5 p-1 rounded-xl border border-black/10">
          {([ ["read", "Forensic Workbench", BookOpenText, !!activeAnalysis], ["investigate", "Cross-Source", Globe, !!analysis], ["compare", "Text Diff", Columns2, !!comparisonAnalysis], ["count", "Metrics", Hash, terms.length > 0], ["archives", "Ask Archives", Database, !!archiveResult] ] as const).map(([id, label, Icon, hasData]) => (
            <Button key={id} size="sm" variant={view === id ? "secondary" : "ghost"} onClick={() => setView(id)} className={`relative rounded-lg transition-all ${view === id ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-black/5"}`}>
              <Icon className="mr-2 h-4 w-4" />{label}
              {hasData && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#C24A35]" />}
            </Button>
          ))}
        </nav>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X /></Button>
      </header>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        <aside className="flex w-[300px] shrink-0 flex-col border-r bg-[#FDFBF7]">
          <div 
            className={`border-b border-black/10 p-5 bg-white/40 transition-colors ${isDragging ? "bg-[#CBE6F9]/50 border-[#CBE6F9]" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-black/50">Document Intake</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => fileInput.current?.click()} title="Upload Document">
                {isReadingFile ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
              </Button>
              <input 
                type="file" 
                ref={fileInput} 
                className="hidden" 
                accept=".pdf,.docx,.txt,.md" 
                onChange={(e) => handleFile(e.target.files?.[0])} 
              />
            </div>
            <div className="space-y-3">
              <Input placeholder="Document title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="h-9 text-xs font-display border-black/10 bg-white focus-visible:ring-black/20" />
              <Textarea rows={3} placeholder={isDragging ? "Drop file to extract text..." : "Paste raw text or drag a file..."} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} className="resize-none text-xs border-black/10 bg-white focus-visible:ring-black/20" />
              <Button size="sm" className="h-9 w-full text-[10px] font-mono uppercase tracking-wider bg-foreground text-background hover:bg-foreground/90" disabled={!draft.title.trim() || !draft.text.trim()} onClick={() => {
                if (!draft.title.trim() || !draft.text.trim()) return; 
                const doc = { id: uid(), ...draft, title: draft.title.trim(), text: draft.text.trim() }; 
                save({ docs: [...corpus.docs, doc] }); setActiveId(doc.id); setDraft({ title: "", speaker: "", date: "", occasion: "", audience: "", text: "" }); 
              }}><Plus className="mr-2 h-3 w-3" /> Index Document</Button>
            </div>
          </div>

          <ol className="flex-1 space-y-2 overflow-y-auto p-3">
            {docs.map((doc, index) => (
              <li key={doc.id} className={`group relative border transition-all duration-200 ${doc.id === active?.id ? "border-[#1A1A1A] bg-white shadow-md" : "border-black/5 bg-transparent hover:border-black/20 hover:bg-white/60"}`}>
                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-opacity ${doc.id === active?.id ? "bg-[#C24A35] opacity-100" : "bg-black opacity-0 group-hover:opacity-20"}`} />
                <button className="w-full text-left p-4 pl-5" onClick={() => { setActiveId(doc.id); setView("read"); }}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-black/40">File {String(index + 1).padStart(3, '0')}</span>
                    <span className="font-mono text-[9px] text-black/40 border border-black/10 px-1.5 py-0.5 rounded-sm bg-[#FDFBF7]">{doc.date || "UNDATED"}</span>
                  </div>
                  <b className="block font-display text-base leading-tight text-[#1A1A1A] group-hover:text-black">{doc.title}</b>
                  <span className="block mt-1.5 text-[9px] font-mono text-black/50 uppercase tracking-wider truncate">{doc.speaker || "Unknown Speaker"}</span>
                </button>
                <Button variant="ghost" size="icon" className="absolute right-2 bottom-2 h-7 w-7 opacity-0 group-hover:opacity-100 text-black/30 hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ol>
        </aside>

        <main className="flex-1 overflow-y-auto bg-[#FDFBF7]">
          
          {view === "read" && active && (
            <div className="mx-auto max-w-7xl p-6 pb-24 h-full flex flex-col">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 shrink-0 border-b border-black/10 pb-6">
                <div className="min-w-0">
                  <h3 className="mb-2 font-display text-4xl leading-tight truncate text-black">{active.title}</h3>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-black/50">{active.speaker || "Unknown speaker"} · {active.date || "undated"}</p>
                </div>
                <div className="flex gap-2 shrink-0 items-center">
                  {activeAnalysis && (
                    <>
                      <Button variant="outline" size="icon" className="h-9 w-9 border-black/10 hover:bg-black/5" onClick={() => exportReport("forensic")} title="Export Analysis"><Download className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" className={`h-9 w-9 border-black/10 hover:bg-black/5 ${rawView ? 'bg-black/5' : ''}`} onClick={() => setRawView(!rawView)} title={rawView ? "Show Highlights" : "Show Raw Text"}>
                        {rawView ? <Highlighter className="h-4 w-4" /> : <Type className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 border-dashed border-black/20 text-black/60 hover:text-destructive hover:bg-destructive/10" onClick={() => { 
                        const newAnalyses = { ...savedAnalyses };
                        delete newAnalyses[active.id];
                        update({ ...corpus, analyses: newAnalyses } as any); 
                        setActiveNote(null);
                      }}>
                        Clear Analysis
                      </Button>
                    </>
                  )}
                  
                  <div className="flex items-center gap-2 border border-black/10 rounded-lg pl-3 pr-1 h-9 bg-white">
                    <label htmlFor="consensus" className="text-[10px] font-mono uppercase tracking-wider cursor-pointer text-black/70">Consensus</label>
                    <button
                      id="consensus"
                      type="button"
                      role="switch"
                      aria-checked={consensusMode}
                      onClick={() => setConsensusMode(!consensusMode)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${consensusMode ? 'bg-[#C24A35]' : 'bg-black/20'}`}
                    >
                      <span className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${consensusMode ? 'translate-x-2' : '-translate-x-2'}`} />
                    </button>
                  </div>

                  <Button id="analyze-source-btn" onClick={runSourceAnalysis} disabled={isAnalyzingSource} className="h-9 px-6 bg-[#1A1A1A] text-white hover:bg-black rounded-lg shadow-sm">
                    {isAnalyzingSource ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Fingerprint className="mr-2 h-4 w-4" /> Analyze Source</>}
                  </Button>
                </div>
              </div>

              {analysisError && <p className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive shrink-0">{analysisError}</p>}

              <div className="flex flex-1 flex-col xl:flex-row gap-6 min-h-0">
                <article className="flex-1 rounded-xl border border-black/10 bg-[#FDFBF7] p-8 shadow-sm overflow-y-auto relative min-h-[400px]">
                  <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  <div 
                    className="relative z-10 font-serif text-[17px] leading-loose text-black/80 whitespace-pre-wrap selection:bg-[#CBE6F9]"
                    onClick={handleTextClick}
                    dangerouslySetInnerHTML={{ __html: (activeAnalysis && !rawView) ? getHighlightedText(active.text, activeAnalysis.margin_notes) : escapeHtml(active.text).replace(/\n/g, '<br/>') }}
                    onMouseUp={() => { const q = window.getSelection()?.toString().trim() ?? ""; if (q.length > 3 && !window.getSelection()?.toString().includes('\n')) setSelection({ quote: q, doc: active }); }}
                  />
                </article>

                <aside className="w-full xl:w-[420px] shrink-0 flex flex-col gap-5 overflow-y-auto pr-2 pb-10">
                  {!activeAnalysis && !isAnalyzingSource && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 border border-black/10 rounded-xl border-dashed bg-white/40">
                      <Wand2 className="h-10 w-10 text-[#C24A35] mb-4" />
                      <h4 className="font-display text-xl mb-2 text-black">Awaiting Analysis</h4>
                      <p className="text-sm text-black/60 mb-6">Click "Analyze Source" to run forensic linguistics and extract hidden motives, biases, and contradictions.</p>
                      <Button onClick={loadSample} variant="outline" className="bg-white border-black/10 text-black hover:bg-black/5 rounded-lg">
                        <Sparkles className="w-4 h-4 mr-2 text-[#C24A35]" /> Try a sample speech
                      </Button>
                    </div>
                  )}

                  {isAnalyzingSource && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] w-full">
                      <CinematicLoader mode="forensic" />
                    </div>
                  )}

                  {activeAnalysis && (
                    <div className="animate-in fade-in slide-in-from-right-4 space-y-5 duration-500">
                      
                      {activeAnalysis.consensus && (
                        <div className="rounded-xl border border-[#E3D398] bg-[#FDF0B6]/30 p-4 shadow-sm">
                          <h4 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A] mb-3">
                            <Network className="h-4 w-4" /> Multi-Model Consensus
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-2 mb-4 text-center">
                            <div className="bg-white/60 rounded border border-black/5 p-2">
                              <span className="block text-[9px] font-mono text-black/50 uppercase">DeepSeek</span>
                              <span className="font-display text-2xl text-black">{activeAnalysis.quantData.contradictionIndex}</span>
                            </div>
                            <div className="bg-white/60 rounded border border-black/5 p-2">
                              <span className="block text-[9px] font-mono text-black/50 uppercase">OpenAI</span>
                              <span className="font-display text-2xl text-black">{activeAnalysis.consensus.openai.quantData.contradictionIndex}</span>
                            </div>
                          </div>

                          {activeAnalysis.consensus.disagreements.length > 0 ? (
                             <ul className="space-y-2 text-xs text-black/70">
                               {activeAnalysis.consensus.disagreements.map((d: string, i: number) => (
                                 <li key={i} className="flex gap-2">
                                   <AlertTriangle className="h-3 w-3 text-[#C24A35] shrink-0 mt-0.5" />
                                   <span>{d}</span>
                                 </li>
                               ))}
                             </ul>
                          ) : (
                            <p className="text-[10px] text-center text-black/50 font-mono uppercase">Models broadly agree</p>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl border border-black/10 bg-white p-3 shadow-sm">
                          <TacticalRadar data={sourceRadarData} />
                        </div>
                        <div className="rounded-xl border border-black/10 bg-white p-3 shadow-sm flex flex-col items-center justify-center">
                          <TacticalGauge score={activeAnalysis.quantData?.contradictionIndex || 50} />
                        </div>
                      </div>

                      <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm border-l-4 border-l-[#C24A35]">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#C24A35] mb-2">Executive Summary</h4>
                        <p className="font-display text-base leading-relaxed text-black/90">{activeAnalysis.executive_summary}</p>
                      </div>

                      <div>
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-black/50 border-b border-black/10 pb-2 mb-3">Forensic Margin Notes</h4>
                        <div className="space-y-3">
                          {activeAnalysis.margin_notes?.map((note: any, i: number) => {
                            const isActive = activeNote === i;
                            return (
                              <div 
                                key={i} 
                                id={`margin-note-${i}`}
                                onClick={() => handleMarginNoteClick(i)}
                                className={`rounded-lg border bg-white p-4 shadow-sm cursor-pointer transition-all duration-300 ${isActive ? "ring-2 ring-[#C24A35] shadow-md scale-[1.02] border-transparent" : "border-black/10 hover:border-black/20"}`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  {note.type === "contradiction" && <AlertTriangle className="h-3 w-3 text-[#C24A35]" />}
                                  {note.type === "fallacy" && <FileWarning className="h-3 w-3 text-[#E3D398]" />}
                                  {note.type === "motive" && <Eye className="h-3 w-3 text-[#6B4C7A]" />}
                                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-black/40">{note.type}</span>
                                </div>
                                <b className="block font-display text-sm mb-1 text-black">{note.title}</b>
                                <p className="text-xs text-black/60 leading-relaxed mb-3">"{note.analysis}"</p>
                                <div className={`p-2 rounded text-[11px] font-serif italic text-black/70 border-l-2 ${isActive ? "border-[#C24A35] bg-[#FBD0D4]/20" : "border-black/10 bg-black/5"}`}>"{clip(note.quote, 60)}"</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-black/50 border-b border-black/10 pb-2 mb-3">Unstated Assumptions</h4>
                        <div className="space-y-2">
                          {activeAnalysis.unstated_assumptions?.map((text: string, i: number) => (
                            <div key={i} className="flex flex-col gap-2 rounded-lg border border-black/10 bg-white p-3 shadow-sm">
                              <p className="text-xs text-black/80 leading-relaxed">{text}</p>
                              <Button size="sm" variant="ghost" className="h-7 self-end text-[9px] uppercase tracking-wider text-black/40 hover:text-black hover:bg-black/5" onClick={(e) => { e.stopPropagation(); plantAnalysis(`asm-${i}`, "hypothesis", "Unstated Assumption", text, active.title); }}>
                                <Share2 className="mr-1 h-3 w-3" /> Plant & Wire
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-black/50 border-b border-black/10 pb-2 mb-3">The Dog That Didn't Bark</h4>
                        <div className="space-y-2">
                          {activeAnalysis.questions_to_ask?.map((text: string, i: number) => (
                            <div key={i} className="flex flex-col gap-2 rounded-lg border border-[#C24A35]/20 bg-[#FDF6F4] p-3 shadow-sm">
                              <div className="flex items-start gap-2">
                                <HelpCircle className="h-3 w-3 text-[#C24A35] shrink-0 mt-0.5" />
                                <p className="text-xs text-black/80 leading-relaxed">{text}</p>
                              </div>
                              <Button size="sm" variant="ghost" className="h-7 self-end text-[9px] uppercase tracking-wider text-[#C24A35] hover:bg-[#C24A35]/10" onClick={(e) => { e.stopPropagation(); plantAnalysis(`q-${i}`, "question", "Missing Context", text, active.title); }}>
                                <Share2 className="mr-1 h-3 w-3" /> Plant & Wire
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
                  <h3 className="mb-2 font-display text-4xl tracking-tight text-black">Cross-Source Dossier</h3>
                  <p className="max-w-xl text-sm text-black/60">Cross-reference global sources, extract quantitative sentiment signals, and map strategic blind spots.</p>
                </div>
                {analysis && (
                  <Button variant="outline" className="border-black/10 bg-white hover:bg-black/5" onClick={() => exportReport("cross-source")}>
                    <Download className="mr-2 h-4 w-4" /> Export Dossier
                  </Button>
                )}
              </div>

              <div className="mb-10 flex flex-col sm:flex-row items-center gap-2 rounded-xl border border-black/10 bg-white p-2 shadow-sm">
                <div className="flex flex-1 flex-col sm:flex-row gap-2 w-full">
                  {urls.map((url, i) => (
                    <div key={i} className="relative flex-1 w-full">
                      <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
                      <Input value={url} placeholder="https://foreignaffairs.com/..." className="h-11 border-transparent bg-black/5 pl-11 font-mono text-sm focus-visible:ring-1 focus-visible:ring-black/20" onChange={(e) => { const newUrls = [...urls]; newUrls[i] = e.target.value; setUrls(newUrls); }} />
                      {urls.length > 1 && <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 hover:bg-black/10" onClick={() => setUrls(urls.filter((_, idx) => idx !== i))}><X className="h-3 w-3 text-black/40" /></Button>}
                    </div>
                  ))}
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                  <Button variant="outline" size="icon" onClick={() => setUrls([...urls, ""])} className="h-11 w-11 shrink-0 border-black/10 bg-white hover:bg-black/5"><Plus className="h-4 w-4" /></Button>
                  <Button onClick={runInvestigation} disabled={isAnalyzing || urls.every(u => u.trim() === "")} className="h-11 flex-1 sm:flex-none shrink-0 px-8 bg-[#1A1A1A] text-white hover:bg-black rounded-lg">
                    {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <><Sparkles className="mr-2 h-4 w-4" /> Analyze Sources</>}
                  </Button>
                </div>
              </div>

              {analysisError && <p className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{analysisError}</p>}

              {isAnalyzing && (
                <div className="py-12 w-full flex justify-center">
                  <div className="w-full max-w-2xl">
                    <CinematicLoader mode="cross-source" />
                  </div>
                </div>
              )}

              {!analysis && !isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-black/10 rounded-2xl border-dashed bg-white/40 mt-8">
                  <div className="w-16 h-16 bg-[#CBE6F9] rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-black/5">
                    <Globe className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="font-display text-3xl mb-3 text-black">Read the whole world.</h3>
                  <p className="text-sm text-black/60 max-w-md mx-auto leading-relaxed">
                    Paste URLs from different news sources, speeches, or reports. The AI will read them all and synthesize a unified intelligence dossier, highlighting where they agree and where they lie.
                  </p>
                </div>
              )}

              {analysis && !isAnalyzing && (
                <div className="animate-in fade-in slide-in-from-bottom-8 space-y-6 duration-700">
                  <section className="relative rounded-xl border border-black/10 bg-white p-10 shadow-sm overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-1.5 bg-[#C24A35]" />
                    <div className="mb-4 flex items-center gap-3">
                      <div className="bg-black/5 p-2 rounded-lg"><FileWarning className="h-5 w-5 text-black" /></div>
                      <h4 className="font-mono text-xs uppercase tracking-widest text-black/50">The Big Picture</h4>
                    </div>
                    <p className="font-display text-2xl md:text-3xl leading-relaxed text-black/90 first-letter:text-7xl first-letter:float-left first-letter:mr-4 first-letter:mt-1">{analysis.conclusion}</p>
                  </section>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-12 items-stretch mt-8">
                    <div className="md:col-span-4 flex flex-col rounded-xl border border-black/10 bg-white p-5 shadow-sm h-[320px]">
                      <div className="mb-2 flex items-center justify-between relative z-10">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-black/50">Narrative Profile</h4>
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

                    <div className="md:col-span-4 flex flex-col rounded-xl border border-black/10 bg-white p-5 shadow-sm h-[320px]">
                      <div className="mb-4 flex items-center justify-between relative z-10">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-black/50">Key Actors</h4>
                        <Globe className="h-3 w-3 text-black/40" />
                      </div>
                      <div className="flex-1 overflow-y-auto pr-2 relative z-10">
                        <div className="flex flex-col gap-2">
                          {analysis.entities?.map((entity: string, i: number) => {
                            const isCentral = i < 2;
                            const color = isCentral ? "bg-foreground text-background border-transparent" : "bg-black/5 text-black border-black/10";
                            return (
                              <span key={i} className={`w-full px-3 py-2 ${color} border rounded-md text-xs font-medium truncate`} title={entity}>
                                {entity}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col rounded-xl border border-black/10 bg-white p-5 shadow-sm h-[320px]">
                      <div className="mb-2 flex items-center justify-between relative z-10">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-black/50">Contradiction Index</h4>
                        <ShieldAlert className="h-3 w-3 text-[#C24A35]" />
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                        <TacticalGauge score={analysis.quantData?.contradictionIndex || 50} />
                        <p className="text-[10px] text-center font-mono uppercase tracking-widest text-black/50 mt-4 border border-black/10 px-3 py-1 rounded-full bg-black/5">High friction detected</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-8">
                    <section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                      <h4 className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-black/50 border-b border-black/10 pb-4"><Check className="h-4 w-4" /> Documented Evidence</h4>
                      <div className="space-y-4">
                        {analysis.evidence?.map((item: any, i: number) => (
                          <div key={i} className="group relative flex flex-col rounded-lg border border-black/10 bg-[#FDFBF7] p-5 transition-all hover:border-black/20 hover:shadow-sm">
                            <b className="mb-2 block font-display text-base text-black">{item.title}</b>
                            <p className="mb-4 flex-1 text-xs leading-relaxed text-black/60">{item.body}</p>
                            <div className="mt-auto flex items-center justify-between border-t border-black/10 pt-3">
                              <span className="max-w-[200px] truncate font-mono text-[9px] uppercase tracking-wider text-black/40">{item.source}</span>
                              <Button size="sm" variant={plantedIds[`ev-${i}`] ? "secondary" : "outline"} className={`h-8 rounded-md px-4 text-[10px] uppercase tracking-wider font-bold ${plantedIds[`ev-${i}`] ? "bg-black text-white" : "border-black/20"}`} onClick={() => plantAnalysis(`ev-${i}`, "evidence", item.title, item.body, item.source)}>
                                {plantedIds[`ev-${i}`] ? <><Check className="mr-1 h-3 w-3" /> Planted</> : <><Share2 className="mr-1 h-3 w-3" /> Plant & Wire</>}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <div className="space-y-6">
                      <section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                        <h4 className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-black/50 border-b border-black/10 pb-4"><Sparkles className="h-4 w-4" /> Strategic Hypotheses</h4>
                        <div className="space-y-3">
                          {analysis.hypotheses?.map((item: any, i: number) => (
                            <div key={i} className="flex flex-col rounded-lg border border-black/10 bg-[#FDFBF7] p-5">
                              <b className="mb-1 block font-display text-base text-black">{item.title}</b>
                              <p className="mb-3 text-xs leading-relaxed text-black/60">{item.body}</p>
                              <Button size="sm" variant="ghost" className={`h-8 self-end rounded-md text-[10px] font-bold uppercase tracking-wider ${plantedIds[`hyp-${i}`] ? "text-black bg-black/5" : "text-black/50 hover:text-black hover:bg-black/5"}`} onClick={() => plantAnalysis(`hyp-${i}`, "hypothesis", item.title, item.body)}>
                                {plantedIds[`hyp-${i}`] ? <><Check className="mr-1 h-3 w-3" /> Planted</> : <><Share2 className="mr-1 h-3 w-3" /> Plant & Wire</>}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </section>
                      <section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                        <h4 className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-black/50 border-b border-black/10 pb-4"><AlertTriangle className="h-4 w-4" /> Blind Spots</h4>
                        <div className="space-y-3">
                          {analysis.questions?.map((item: any, i: number) => (
                            <div key={i} className="flex flex-col rounded-lg border border-[#C24A35]/20 bg-[#FDF6F4] p-5">
                              <b className="mb-1 block font-display text-base text-[#C24A35]">{item.title}</b>
                              <p className="mb-3 text-xs leading-relaxed text-black/60">{item.body}</p>
                              <Button size="sm" variant="ghost" className={`h-8 self-end rounded-md text-[10px] font-bold uppercase tracking-wider ${plantedIds[`q-${i}`] ? "text-[#C24A35] bg-[#C24A35]/10" : "text-[#C24A35] hover:bg-[#C24A35]/10"}`} onClick={() => plantAnalysis(`q-${i}`, "question", item.title, item.body)}>
                                {plantedIds[`q-${i}`] ? <><Check className="mr-1 h-3 w-3" /> Planted</> : <><Share2 className="mr-1 h-3 w-3" /> Plant & Wire</>}
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
                  <h3 className="mb-2 font-display text-4xl tracking-tight text-black">Comparative Intelligence</h3>
                  <p className="max-w-xl text-sm text-black/60">Cross-examine two narratives to reveal diverging framings, omissions, and direct contradictions.</p>
                </div>
                {comparisonAnalysis && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-9 border-black/10 bg-white hover:bg-black/5" onClick={() => exportReport("compare")}>
                      <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 border-dashed border-black/20 text-black/50 hover:text-destructive hover:bg-destructive/10" onClick={() => { 
                      const newComparisons = { ...savedComparisons };
                      delete newComparisons[comparisonKey];
                      update({ ...corpus, comparisons: newComparisons } as any); 
                    }}>
                      Clear Comparison
                    </Button>
                  </div>
                )}
              </div>

              {docs.length < 2 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-black/10 rounded-2xl border-dashed bg-white/40 mt-8">
                  <div className="w-16 h-16 bg-[#E8DAFB] rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-black/5">
                    <Columns2 className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="font-display text-3xl mb-3 text-black">Find the friction.</h3>
                  <p className="text-sm text-black/60 max-w-md mx-auto leading-relaxed">
                    You need at least two indexed documents to run a comparison. Go back to the Forensic Workbench and index another source to see how their narratives diverge.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-8 flex flex-col md:flex-row items-end gap-4 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[0, 1].map((index) => (
                        <div key={index}>
                          <label className="text-[10px] font-mono uppercase tracking-widest text-black/50 mb-1 block">Source {index === 0 ? "A" : "B"}</label>
                          <select className="w-full rounded-md border border-black/10 bg-[#FDFBF7] p-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black/20" value={compareIds[index]} onChange={(e) => setCompareIds((value) => index === 0 ? [e.target.value, value[1]] : [value[0], e.target.value])}>
                            <option value="" disabled>Select a document</option>
                            {docs.map((doc) => <option key={doc.id} value={doc.id}>{doc.date} · {doc.title}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                    <Button onClick={runComparison} disabled={isComparing || !docA || !docB || docA.id === docB.id} className="h-[38px] px-6 w-full md:w-auto shrink-0 bg-[#1A1A1A] text-white hover:bg-black rounded-lg">
                      {isComparing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Comparing...</> : <><GitMerge className="mr-2 h-4 w-4" /> Run Comparison</>}
                    </Button>
                  </div>

                  {analysisError && <p className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{analysisError}</p>}

                  {isComparing && (
                    <div className="py-24 text-center">
                      <div className="relative mb-8 inline-block">
                        <div className="h-16 w-16 animate-spin rounded-full border-2 border-black/10 border-t-black"></div>
                        <Activity className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-black animate-pulse" />
                      </div>
                      <h4 className="mb-2 font-display text-2xl text-black">Cross-examining Narratives...</h4>
                      <p className="animate-pulse font-mono text-[10px] uppercase tracking-widest text-black/50">Mapping Entities → Detecting Omissions → Measuring Divergence</p>
                    </div>
                  )}

                  {comparisonAnalysis && !isComparing && docA && docB && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 space-y-6 duration-700">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                        <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm flex flex-col items-center justify-center h-[320px]">
                          <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#C24A35] mb-4 text-center">Divergence Score</h4>
                          <TacticalGauge score={comparisonAnalysis.divergenceScore} label="Divergence" />
                          <p className="text-[10px] text-center font-mono uppercase tracking-widest text-black/50 mt-6 border border-black/10 px-3 py-1 rounded-full bg-black/5">
                            {comparisonAnalysis.divergenceScore > 70 ? "Fundamentally Opposed" : comparisonAnalysis.divergenceScore > 40 ? "Moderate Friction" : "Broad Alignment"}
                          </p>
                        </div>

                        <div className="md:col-span-2 rounded-xl border border-black/10 bg-white p-6 shadow-sm h-[320px]">
                          <div className="mb-2 flex items-center justify-between">
                            <h4 className="font-mono text-[10px] uppercase tracking-widest text-black/50">Comparative Narrative Profile</h4>
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

                      <section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                        <h4 className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-black/50 border-b border-black/10 pb-4"><Target className="h-4 w-4" /> Entity Matrix</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <h5 className="font-mono text-[10px] uppercase tracking-widest text-black/50 mb-3 text-center">Shared Focus</h5>
                            <div className="flex flex-col gap-2">
                              {comparisonAnalysis.shared_entities?.map((e: string, i: number) => (
                                <span key={i} className="w-full px-3 py-1.5 bg-black/5 text-black border border-black/10 rounded-md text-xs font-medium text-center truncate">{e}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h5 className="font-mono text-[10px] uppercase tracking-widest text-[#C24A35] mb-3 text-center">Only in {docA.title.slice(0, 15)}...</h5>
                            <div className="flex flex-col gap-2">
                              {comparisonAnalysis.unique_to_a?.map((e: string, i: number) => (
                                <span key={i} className="w-full px-3 py-1.5 bg-[#FBD0D4]/40 text-black border border-[#C24A35]/20 rounded-md text-xs font-medium text-center truncate">{e}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h5 className="font-mono text-[10px] uppercase tracking-widest text-black mb-3 text-center">Only in {docB.title.slice(0, 15)}...</h5>
                            <div className="flex flex-col gap-2">
                              {comparisonAnalysis.unique_to_b?.map((e: string, i: number) => (
                                <span key={i} className="w-full px-3 py-1.5 bg-[#CBE6F9]/40 text-black border border-black/20 rounded-md text-xs font-medium text-center truncate">{e}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                        <h4 className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-black/50 border-b border-black/10 pb-4"><AlertTriangle className="h-4 w-4" /> Flashpoints</h4>
                        <div className="space-y-4">
                          {comparisonAnalysis.flashpoints?.map((fp: any, i: number) => (
                            <div key={i} className="rounded-lg border border-black/10 bg-[#FDFBF7] overflow-hidden">
                              <div className="bg-black/5 px-4 py-2 border-b border-black/10 font-display text-sm font-bold text-black">{fp.topic}</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/10">
                                <div className="p-4">
                                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#C24A35] block mb-2">{docA.title}</span>
                                  <p className="text-xs leading-relaxed text-black/80">{fp.text_a_view}</p>
                                </div>
                                <div className="p-4">
                                  <span className="font-mono text-[9px] uppercase tracking-wider text-black block mb-2">{docB.title}</span>
                                  <p className="text-xs leading-relaxed text-black/80">{fp.text_b_view}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}

                  {!comparisonAnalysis && !isComparing && (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-black/10 rounded-2xl border-dashed bg-white/40 mt-8">
                      <div className="w-16 h-16 bg-[#FDF0B6] rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-black/5">
                        <GitCompare className="w-8 h-8 text-black" />
                      </div>
                      <h3 className="font-display text-3xl mb-3 text-black">Ready to compare.</h3>
                      <p className="text-sm text-black/60 max-w-md mx-auto leading-relaxed">
                        Select two sources above and run the comparison to see the divergence score, entity matrix, and direct flashpoints.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {view === "count" && (
            <div className="mx-auto max-w-5xl p-6 pb-24">
              <div className="mb-10 flex items-end justify-between">
                <div>
                  <h3 className="mb-2 font-display text-4xl text-black">Language Trajectory</h3>
                  <p className="text-sm text-black/60">Track phrases across texts. Rates are per 1,000 words, so texts of different lengths remain comparable.</p>
                </div>
              </div>
              
              <form className="mb-6 flex flex-col sm:flex-row gap-3" onSubmit={(e) => { e.preventDefault(); const value = term.trim().toLowerCase(); if (value && !terms.includes(value) && terms.length < 6) save({ terms: [...terms, value] }); setTerm(""); }}>
                <Input value={term} placeholder="Track a word or phrase (e.g. 'security', 'border')" onChange={(e) => setTerm(e.target.value)} className="h-12 text-base rounded-lg flex-1 border-black/10 bg-white focus-visible:ring-black/20" />
                <Button className="h-12 px-8 text-base bg-[#1A1A1A] text-white hover:bg-black rounded-lg">Track</Button>
              </form>
              
              <div className="mb-10 flex flex-wrap gap-2">
                {terms.map((item, i) => (
                  <button key={item} className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/5 shadow-sm" onClick={() => save({ terms: terms.filter((phrase) => phrase !== item) })}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {item} <X className="h-4 w-4 text-black/40" />
                  </button>
                ))}
              </div>

              {terms.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 px-4 text-center border border-black/10 rounded-2xl border-dashed bg-white/40">
                  <div className="w-16 h-16 bg-[#CBE6F9] rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-black/5">
                    <Hash className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="font-display text-3xl mb-3 text-black">Measure the narrative.</h3>
                  <p className="text-sm text-black/60 max-w-md mx-auto leading-relaxed">
                    Type a word or phrase above (like "security" or "economy") to visualize how often it appears across your sources.
                  </p>
                </div>
              )}

              {terms.length > 0 && docs.length > 0 && (
                <div className="mb-12 rounded-xl border border-black/10 bg-white p-8 shadow-sm">
                  <h4 className="font-mono text-[10px] uppercase tracking-widest text-black/50 mb-6">Phrase Frequency (per 1k words)</h4>
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

              <div className="mb-16 space-y-4 rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                {termCounts.map(({ doc, values }) => (
                  <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/10 pb-4 last:border-0 last:pb-0 gap-4">
                    <b className="font-display text-base max-w-[300px] truncate text-black">{doc.date || "—"} · {doc.title}</b>
                    <div className="flex gap-6 flex-wrap">
                      {values.map((value, i) => (
                        <div key={value.phrase} className="text-right">
                          <span className="block font-mono text-[9px] uppercase tracking-widest text-black/40 mb-1">{value.phrase}</span>
                          <strong className="text-xl" style={{ color: COLORS[i % COLORS.length] }}>{value.rate}</strong>
                          <span className="text-[10px] text-black/40 ml-1">/1k</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {terms.length === 0 && <p className="py-8 text-center font-display text-lg text-black/50">Add a phrase above to see its frequency across documents.</p>}
              </div>

              <section>
                <h3 className="mb-8 font-display text-2xl text-black">Vocabulary Fingerprint</h3>
                <div className="space-y-8">
                  {docs.map((doc) => (
                    <div key={doc.id} className="flex flex-col gap-4">
                      <b className="text-sm font-mono uppercase tracking-widest text-black/50 border-b border-black/10 pb-2">{doc.title}</b>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {topTerms(doc.text, 15).map(([word, count], i) => {
                          const size = count > 20 ? "text-2xl font-bold" : count > 10 ? "text-lg font-semibold" : "text-base";
                          const color = i % 3 === 0 ? "text-[#C24A35]" : i % 3 === 1 ? "text-black" : "text-black/50";
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

          {view === "archives" && (
            <div className="mx-auto max-w-4xl p-6 pb-24">
              <div className="mb-8">
                <h3 className="mb-2 font-display text-4xl tracking-tight text-black">Ask the Archives</h3>
                <p className="max-w-xl text-sm text-black/60">Query your long-term memory. The AI will search across everything you have planted to the canvas and synthesize a historical intelligence report.</p>
              </div>

              <form className="mb-10 flex flex-col sm:flex-row gap-2" onSubmit={(e) => { e.preventDefault(); runArchiveSearch(); }}>
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
                  <Input value={archiveQuery} onChange={(e) => setArchiveQuery(e.target.value)} placeholder="e.g. What did the UN say about Haiti's arms embargo?" className="h-11 border-black/10 bg-white pl-11 font-mono text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-black/20" />
                </div>
                <Button type="submit" disabled={isSearchingArchive || !archiveQuery.trim()} className="h-11 px-8 bg-[#1A1A1A] text-white hover:bg-black rounded-lg">
                  {isSearchingArchive ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...</> : <><Database className="mr-2 h-4 w-4" /> Query Archives</>}
                </Button>
              </form>

              {archiveError && <p className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{archiveError}</p>}

              {archiveResult && !isSearchingArchive && (
                <div className="animate-in fade-in slide-in-from-bottom-8 space-y-6 duration-700">
                  <section className="relative rounded-xl border border-black/10 bg-white p-10 shadow-sm overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-1.5 bg-black" />
                    <div className="mb-4 flex items-center gap-3">
                      <div className="bg-black/5 p-2 rounded-lg"><BookOpenText className="h-5 w-5 text-black" /></div>
                      <h4 className="font-mono text-xs uppercase tracking-widest text-black/50">Synthesized Intelligence</h4>
                    </div>
                    <div className="font-serif text-lg leading-relaxed text-black/90 whitespace-pre-wrap">{archiveResult.answer}</div>
                  </section>

                  {archiveResult.sources && archiveResult.sources.length > 0 && (
                    <section className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                      <h4 className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-black/50 border-b border-black/10 pb-4"><Database className="h-4 w-4" /> Raw Archive Sources</h4>
                      <div className="space-y-3">
                        {archiveResult.sources.map((source: any, i: number) => (
                          <div key={i} className="flex flex-col rounded-lg border border-black/10 bg-[#FDFBF7] p-4 text-xs">
                            <span className="font-mono text-[10px] uppercase text-black/40 mb-2">Match Score: {(source.score * 100).toFixed(1)}%</span>
                            <p className="whitespace-pre-wrap text-black/70">{source.metadata?.text || "No text recorded"}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
              
              {!archiveResult && !isSearchingArchive && (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-black/10 rounded-2xl border-dashed bg-white/40 mt-8">
                  <div className="w-16 h-16 bg-black/5 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-black/5">
                    <Database className="w-8 h-8 text-black/40" />
                  </div>
                  <h3 className="font-display text-3xl mb-3 text-black">Search your memory.</h3>
                  <p className="text-sm text-black/60 max-w-md mx-auto leading-relaxed">
                    Every time you plant a card, it gets archived. Query the database to connect the dots across weeks of research.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      
      {selection && (
        <div className="fixed bottom-10 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-black/10 bg-white p-2 shadow-xl animate-in slide-in-from-bottom-8">
          <span className="px-4 font-mono text-[10px] uppercase tracking-widest text-black/50">Code as:</span>
          {CODES.map((code) => <button key={code.id} className="rounded-md px-3 py-1.5 text-xs font-medium text-black/60 transition-colors hover:bg-black/5 hover:text-black" onClick={() => { 
             if (!selection) return; 
             const at = selection.doc.text.indexOf(selection.quote); 
             if (at < 0) return; 
             if (!corpus.annotations.some((mark) => mark.docId === selection.doc.id && mark.start === at)) {
               save({ annotations: [...corpus.annotations, { id: uid(), docId: selection.doc.id, start: at, end: at + selection.quote.length, quote: selection.quote, code: code.id, note: "" }] }); 
             }
             setSelection(null); 
             window.getSelection()?.removeAllRanges(); 
          }}>{code.label}</button>)}
          <Button size="sm" className="rounded-md px-4 font-bold uppercase tracking-wider text-[10px] bg-[#1A1A1A] text-white hover:bg-black" onClick={() => { plant(selection.doc, selection.quote); setSelection(null); }}>Plant</Button>
          <Button variant="ghost" size="icon" className="rounded-full ml-1 hover:bg-black/5" onClick={() => setSelection(null)}><X className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}