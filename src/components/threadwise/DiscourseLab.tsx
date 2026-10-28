import { useMemo, useState } from "react";
import { BookOpenText, Columns2, Hash, MapPin, Plus, X, Globe, Loader2, Check, Sparkles, AlertTriangle, Activity, ShieldAlert, Cpu, ArrowRight, Fingerprint, Crosshair, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useThread } from "@/lib/threadwise/store";
import { streamTask } from "@/lib/threadwise/ai-client";
import { CODES, clip, countPhrase, emptyCorpus, topTerms, words, type CodeId, type Corpus, type DiscourseDoc } from "@/lib/threadwise/discourse";
import { toast } from "sonner";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, PolarRadiusAxis } from "recharts";

type View = "read" | "compare" | "count" | "investigate";
const uid = () => crypto.randomUUID();
const codeLabel = (code: CodeId) => CODES.find((item) => item.id === code)?.label ?? code;

export function DiscourseLab({ corpus: stored, update, onClose }: { corpus?: Corpus; update: (corpus: Corpus) => void; onClose: () => void }) {
  const corpus = stored ?? emptyCorpus();
  const s = useThread();
  const [view, setView] = useState<View>("investigate");
  const [activeId, setActiveId] = useState(corpus.docs[0]?.id ?? "");
  const [compareIds, setCompareIds] = useState<[string, string]>([corpus.docs[0]?.id ?? "", corpus.docs[1]?.id ?? ""]);
  const [draft, setDraft] = useState({ title: "", speaker: "", date: "", occasion: "", audience: "", text: "" });
  const [term, setTerm] = useState("");
  const [selection, setSelection] = useState<{ quote: string; doc: DiscourseDoc } | null>(null);
  
  const savedInv = (corpus as any).investigation || {};
  const [urls, setUrls] = useState<string[]>(savedInv.urls?.length ? savedInv.urls : [""]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [analysis, setAnalysis] = useState<any>(savedInv.analysis || null);
  const [plantedIds, setPlantedIds] = useState<Record<string, boolean>>({});

  const docs = [...corpus.docs].sort((a, b) => a.date.localeCompare(b.date));
  const active = docs.find((doc) => doc.id === activeId) ?? docs[0];
  const save = (patch: Partial<Corpus>) => update({ ...corpus, ...patch });
  
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

  const radarData = analysis?.quantData?.radar ? [
    { subject: "Bias", A: analysis.quantData.radar.bias },
    { subject: "Omission", A: analysis.quantData.radar.omission },
    { subject: "Urgency", A: analysis.quantData.radar.urgency },
    { subject: "Motive", A: analysis.quantData.radar.motive },
    { subject: "Evidence", A: analysis.quantData.radar.evidence },
  ] : [];

  const compared = compareIds.map((id) => docs.find((doc) => doc.id === id)).filter(Boolean) as DiscourseDoc[];
  const terms = corpus.terms;
  const termCounts = useMemo(() => docs.map((doc) => ({ doc, values: terms.map((phrase) => ({ phrase, n: countPhrase(doc.text, phrase), rate: words(doc.text).length ? Math.round(countPhrase(doc.text, phrase) / words(doc.text).length * 10000) / 10 : 0 })) })), [docs, terms]);

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
      <div className="relative flex flex-col items-center justify-center w-full h-full min-h-[140px]">
        <svg width="120" height="100" viewBox="0 0 120 100" className="overflow-visible">
          <path d={describeArc(cx, cy, radius, startAngle, endAngle)} fill="none" stroke="var(--border)" strokeWidth="8" strokeLinecap="round" />
          <path d={describeArc(cx, cy, radius, startAngle, angle)} fill="none" stroke="#C24A35" strokeWidth="8" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="4" fill="var(--foreground)" />
          <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute bottom-0 text-center">
          <span className="font-display text-4xl text-[#C24A35]">{score}</span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      </div>
    );
  };

  return (
    <div className="tw-lab fixed inset-0 z-50 flex flex-col bg-background font-sans" role="dialog" aria-modal="true">
      {/* BACKGROUND - Aligned with Canvas */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `linear-gradient(to right, var(--foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      <header className="relative z-10 flex items-center justify-between border-b px-6 py-4 bg-card">
        <div>
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Crosshair className="h-3 w-3" /> The Reading Room
          </span>
          <h2 className="font-display text-3xl text-foreground">Discourse Lab</h2>
        </div>
        <nav className="flex gap-1 bg-muted/50 p-1 rounded-xl border">
          {([ ["investigate", "Dossier", ShieldAlert], ["read", "Source Reading", BookOpenText], ["compare", "Text Diff", Columns2], ["count", "Metrics", Hash] ] as const).map(([id, label, Icon]) => (
            <Button key={id} size="sm" variant={view === id ? "secondary" : "ghost"} onClick={() => setView(id)} className={`rounded-lg transition-all ${view === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="mr-2 h-4 w-4" />{label}
            </Button>
          ))}
        </nav>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X /></Button>
      </header>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className="flex w-72 shrink-0 flex-col border-r bg-card/50">
          <div className="border-b p-5">
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
              <li key={doc.id} className={`group rounded-lg transition-all ${doc.id === active?.id ? "border bg-card shadow-sm" : "border border-transparent hover:bg-muted/50"}`}>
                <button className="w-full p-4 text-left" onClick={() => { setActiveId(doc.id); setView("read"); }}>
                  <small className="mb-1 block font-mono text-[10px] text-muted-foreground">{doc.date || "undated"}</small>
                  <b className="block truncate font-display text-sm text-foreground">{doc.title}</b>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-background/50">
          
          {view === "investigate" && (
            <div className="mx-auto max-w-6xl p-8 pb-24">
              
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <h3 className="mb-2 font-display text-4xl tracking-tight text-foreground">Intelligence Dossier</h3>
                  <p className="max-w-xl text-sm text-muted-foreground">Cross-reference global sources, extract quantitative sentiment signals, and map strategic blind spots.</p>
                </div>
              </div>

              {/* URL INPUT COMMAND BAR */}
              <div className="mb-10 flex items-center gap-2 rounded-xl border bg-card p-2 shadow-sm">
                <div className="flex flex-1 gap-2">
                  {urls.map((url, i) => (
                    <div key={i} className="relative flex-1">
                      <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={url} placeholder="https://foreignaffairs.com/..." className="h-11 border-transparent bg-muted/30 pl-11 font-mono text-sm focus-visible:ring-1 focus-visible:ring-ring" onChange={(e) => { const newUrls = [...urls]; newUrls[i] = e.target.value; setUrls(newUrls); }} />
                      {urls.length > 1 && <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2" onClick={() => setUrls(urls.filter((_, idx) => idx !== i))}><X className="h-3 w-3 text-muted-foreground" /></Button>}
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="icon" onClick={() => setUrls([...urls, ""])} className="h-11 w-11 shrink-0"><Plus className="h-4 w-4" /></Button>
                <Button onClick={runInvestigation} disabled={isAnalyzing || urls.every(u => u.trim() === "")} className="h-11 shrink-0 px-8">
                  {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <><Sparkles className="mr-2 h-4 w-4" /> Analyze Sources</>}
                </Button>
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
                  
                  {/* QUANT DASHBOARD ROW */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
                    
                    {/* Narrative Radar */}
                    <div className="flex flex-col rounded-xl border bg-card p-6 shadow-sm relative overflow-hidden h-auto">
                      <div className="mb-2 flex items-center gap-2 relative z-10">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Narrative Profile</h4>
                      </div>
                      <div className="h-64 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                            <PolarGrid stroke="var(--border)" strokeDasharray="3 3" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Analysis" dataKey="A" stroke="#C24A35" strokeWidth={2} fill="#C24A35" fillOpacity={0.1} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Entity Network */}
                    <div className="flex flex-col rounded-xl border bg-card p-6 shadow-sm relative overflow-hidden h-auto">
                      <div className="mb-6 flex items-center gap-2 relative z-10">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Key Actors</h4>
                      </div>
                      <div className="flex flex-1 flex-wrap content-start gap-2 relative z-10">
                        {analysis.entities?.map((entity: string, i: number) => {
                          const isCentral = i < 2;
                          const color = isCentral ? "bg-foreground text-background border-transparent" : "bg-muted/50 text-foreground border-border";
                          return (
                            <span key={i} className={`px-3 py-1.5 ${color} border rounded-md text-xs font-medium hover:-translate-y-0.5 transition-transform cursor-default`}>
                              {entity}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Contradiction Gauge */}
                    <div className="flex flex-col rounded-xl border bg-card p-6 shadow-sm relative overflow-hidden h-auto">
                      <div className="mb-2 flex items-center gap-2 relative z-10">
                        <ShieldAlert className="h-4 w-4 text-[#C24A35]" />
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Contradiction Index</h4>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center py-4">
                        <ContradictionGauge score={analysis.quantData?.contradictionIndex || 50} />
                        <p className="text-[10px] text-center font-mono uppercase tracking-widest text-muted-foreground mt-2">High friction detected</p>
                      </div>
                    </div>
                  </div>

                  {/* THE BIG PICTURE - Editorial Block */}
                  <section className="relative rounded-xl border bg-card p-10 shadow-sm mt-8 overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-1 bg-[#C24A35]" />
                    <div className="mb-6 flex items-center gap-3">
                      <div className="bg-muted p-2 rounded-lg"><FileWarning className="h-5 w-5 text-foreground" /></div>
                      <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">The Big Picture</h4>
                    </div>
                    <p className="font-display text-2xl leading-relaxed text-foreground first-letter:text-6xl first-letter:float-left first-letter:mr-3 first-letter:mt-1">{analysis.conclusion}</p>
                  </section>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-8">
                    {/* Evidence Trail */}
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

                    {/* Hypotheses & Blind Spots */}
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

          {/* READ VIEW */}
          {view === "read" && active && (
            <div className="mx-auto flex max-w-6xl gap-8 p-8 pb-24">
              <article className="flex-1 rounded-xl border bg-card p-12 shadow-sm relative">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{active.speaker || "Unknown speaker"} · {active.date || "undated"}</p>
                <h3 className="mb-8 font-display text-4xl leading-tight">{active.title}</h3>
                {active.audience && <p className="mb-8 rounded-lg bg-muted/50 p-4 text-sm"><b className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Addressed to</b> {active.audience}</p>}
                <div className="font-serif text-lg leading-loose text-foreground/80" onMouseUp={() => { const q = window.getSelection()?.toString().trim() ?? ""; if (q.length > 3) setSelection({ quote: q, doc: active }); }}>
                  {active.text}
                </div>
              </article>
              <aside className="w-80 shrink-0">
                <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground border-b pb-2">Margin Notes</p>
                {corpus.annotations.filter((mark) => mark.docId === active.id).length === 0 && <p className="text-sm leading-relaxed text-muted-foreground italic mt-4">Select a passage to code it. Coded quotes become evidence you can place on the canvas.</p>}
                <div className="space-y-3 mt-4">
                  {corpus.annotations.filter((mark) => mark.docId === active.id).map((mark) => (
                    <div className="rounded-xl border bg-card p-5 shadow-sm" key={mark.id} data-code={mark.code}>
                      <small className="mb-3 block font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{codeLabel(mark.code)}</small>
                      <blockquote className="mb-4 font-serif text-sm italic leading-relaxed text-foreground/80 border-l-2 border-[#C24A35] pl-3">“{clip(mark.quote, 150)}”</blockquote>
                      <Button size="sm" variant="outline" className="h-8 w-full rounded-md text-[10px] uppercase tracking-wider font-bold" onClick={() => plant(active, mark.quote, codeLabel(mark.code))}><MapPin className="mr-1 h-3 w-3" />Plant on Canvas</Button>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          )}

          {/* COMPARE VIEW */}
          {view === "compare" && (
            <div className="mx-auto max-w-7xl p-8 pb-24">
              <div className="mb-8">
                <h3 className="mb-2 font-display text-4xl">Compare Texts</h3>
                <p className="text-sm text-muted-foreground">Select two sources to compare their language and framing side-by-side.</p>
              </div>
              <div className="mb-8 grid grid-cols-2 gap-6">
                {[0, 1].map((index) => (
                  <select key={index} className="rounded-lg border bg-card p-3 text-sm font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" value={compareIds[index]} onChange={(e) => setCompareIds((value) => index === 0 ? [e.target.value, value[1]] : [value[0], e.target.value])}>
                    <option value="" disabled>Select a document</option>
                    {docs.map((doc) => <option key={doc.id} value={doc.id}>{doc.date} · {doc.title}</option>)}
                  </select>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-6">
                {compared.map((doc) => (
                  <article className="rounded-xl border bg-card p-10 shadow-sm" key={doc.id}>
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{doc.speaker} · {doc.date}</p>
                    <h3 className="mb-6 font-display text-2xl">{doc.title}</h3>
                    <div className="font-serif text-sm leading-relaxed text-foreground/70" onMouseUp={() => { const q = window.getSelection()?.toString().trim() ?? ""; if (q.length > 3) setSelection({ quote: q, doc }); }}>
                      {doc.text}
                    </div>
                  </article>
                ))}
                {compared.length < 2 && <div className="col-span-2 py-20 text-center font-display text-2xl text-muted-foreground">Select two documents to compare them.</div>}
              </div>
            </div>
          )}

          {/* METRICS VIEW */}
          {view === "count" && (
            <div className="mx-auto max-w-5xl p-8 pb-24">
              <div className="mb-10">
                <h3 className="mb-2 font-display text-4xl">Language Trajectory</h3>
                <p className="text-sm text-muted-foreground">Track phrases across texts. Rates are per 1,000 words, so texts of different lengths remain comparable.</p>
              </div>
              
              <form className="mb-8 flex gap-3" onSubmit={(e) => { e.preventDefault(); const value = term.trim().toLowerCase(); if (value && !terms.includes(value) && terms.length < 6) save({ terms: [...terms, value] }); setTerm(""); }}>
                <Input value={term} placeholder="Track a word or phrase (e.g. 'security', 'border')" onChange={(e) => setTerm(e.target.value)} className="h-12 text-base rounded-lg" />
                <Button className="h-12 px-8 text-base">Track</Button>
              </form>
              
              <div className="mb-12 flex flex-wrap gap-2">
                {terms.map((item) => (
                  <button key={item} className="flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted" onClick={() => save({ terms: terms.filter((phrase) => phrase !== item) })}>
                    {item} <X className="h-4 w-4" />
                  </button>
                ))}
              </div>

              <div className="mb-16 space-y-6 rounded-xl border bg-card p-8 shadow-sm">
                {termCounts.map(({ doc, values }) => (
                  <div key={doc.id} className="flex items-center justify-between border-b pb-6 last:border-0 last:pb-0">
                    <b className="font-display text-lg max-w-[300px] truncate">{doc.date || "—"} · {doc.title}</b>
                    <div className="flex gap-8">
                      {values.map((value) => (
                        <div key={value.phrase} className="text-right">
                          <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{value.phrase}</span>
                          <strong className="text-2xl text-foreground">{value.rate}</strong>
                          <span className="text-xs text-muted-foreground ml-1">/1k</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {terms.length === 0 && <p className="py-10 text-center font-display text-xl text-muted-foreground">Add a phrase above to see its frequency across documents.</p>}
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
      
      {/* SELECTION TOOLBAR */}
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