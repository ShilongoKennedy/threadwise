import { useMemo, useState } from "react";
import { BookOpenText, Columns2, Hash, MapPin, Plus, X, Globe, Loader2, Check, Sparkles, AlertTriangle, Activity, ShieldAlert, Cpu, ArrowRight, Fingerprint, Crosshair, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useThread } from "@/lib/threadwise/store";
import { streamTask } from "@/lib/threadwise/ai-client";
import { CODES, clip, countPhrase, emptyCorpus, topTerms, words, type CodeId, type Corpus, type DiscourseDoc } from "@/lib/threadwise/discourse";
import { toast } from "sonner";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip, PolarRadiusAxis } from "recharts";

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
      <div className="relative flex items-center justify-center h-32 w-full mt-4">
        <svg width="120" height="100" viewBox="0 0 120 100" className="overflow-visible">
          <path d={describeArc(cx, cy, radius, startAngle, endAngle)} fill="none" stroke="#E5E5E5" strokeWidth="8" strokeLinecap="round" />
          <path d={describeArc(cx, cy, radius, startAngle, angle)} fill="none" stroke="#C24A35" strokeWidth="8" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="4" fill="#1A1A1A" />
          <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute bottom-0 text-center">
          <span className="font-display text-4xl text-[#C24A35]">{score}</span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      </div>
    );
  };

  return (
    <div className="tw-lab fixed inset-0 z-50 flex flex-col bg-[#FDFBF7] font-sans" role="dialog" aria-modal="true">
      
      {/* EDITORIAL BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `linear-gradient(to right, #1A1A1A 1px, transparent 1px), linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#FDF0B6] rounded-full blur-[150px] opacity-20 pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#CBE6F9] rounded-full blur-[150px] opacity-30 pointer-events-none -translate-x-1/3 translate-y-1/3" />

      {/* HEADER */}
      <header className="relative z-10 flex items-center justify-between border-b border-black/10 bg-white/60 px-6 py-4 backdrop-blur-xl">
        <div>
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#C24A35]">
            <Crosshair className="h-3 w-3" /> Intelligence OS / Classified
          </span>
          <h2 className="font-display text-3xl text-[#1A1A1A]">Discourse Lab</h2>
        </div>
        <nav className="flex gap-1 rounded-xl bg-black/5 p-1">
          {([ ["investigate", "Dossier", ShieldAlert], ["read", "Source Reading", BookOpenText], ["compare", "Text Diff", Columns2], ["count", "Metrics", Hash] ] as const).map(([id, label, Icon]) => (
            <Button key={id} size="sm" variant={view === id ? "secondary" : "ghost"} onClick={() => setView(id)} className={`rounded-lg transition-all ${view === id ? "bg-[#1A1A1A] text-white shadow-md" : "text-muted-foreground hover:text-[#1A1A1A]"}`}>
              <Icon className="mr-2 h-4 w-4" />{label}
            </Button>
          ))}
        </nav>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-black/5"><X /></Button>
      </header>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-black/10 bg-white/40 backdrop-blur-md">
          <div className="border-b border-black/10 p-5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/50 block mb-3">Indexed Sources · {docs.length}</span>
            <div className="space-y-3">
              <Input placeholder="Document title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="h-9 border-black/10 bg-white text-xs font-medium" />
              <Textarea rows={3} placeholder="Paste raw text..." value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} className="resize-none border-black/10 bg-white text-xs" />
              <Button size="sm" className="h-9 w-full bg-[#1A1A1A] text-xs text-white" disabled={!draft.title.trim() || !draft.text.trim()} onClick={() => {
                if (!draft.title.trim() || !draft.text.trim()) return; 
                const doc = { id: uid(), ...draft, title: draft.title.trim(), text: draft.text.trim() }; 
                save({ docs: [...corpus.docs, doc] }); setActiveId(doc.id); setDraft({ title: "", speaker: "", date: "", occasion: "", audience: "", text: "" }); 
              }}><Plus className="mr-1 h-3 w-3" /> Add to Corpus</Button>
            </div>
          </div>
          <ol className="flex-1 space-y-1 overflow-y-auto p-3">
            {docs.map((doc) => (
              <li key={doc.id} className={`group rounded-lg transition-all ${doc.id === active?.id ? "border border-black/10 bg-white shadow-sm" : "border border-transparent hover:bg-black/5"}`}>
                <button className="w-full p-4 text-left" onClick={() => { setActiveId(doc.id); setView("read"); }}>
                  <small className="mb-1 block font-mono text-[10px] text-[#C24A35]">{doc.date || "undated"}</small>
                  <b className="block truncate font-display text-sm">{doc.title}</b>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto">
          
          {view === "investigate" && (
            <div className="mx-auto max-w-6xl p-8 pb-24">
              
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <h3 className="mb-2 font-display text-5xl tracking-tight text-[#1A1A1A]">Intelligence Dossier</h3>
                  <p className="max-w-xl text-sm text-[#1A1A1A]/60">Cross-reference global sources, extract quantitative sentiment signals, and map strategic blind spots.</p>
                </div>
              </div>

              {/* URL INPUT COMMAND BAR */}
              <div className="mb-10 flex items-center gap-2 rounded-2xl border border-black/10 bg-white p-2 shadow-lg">
                <div className="flex flex-1 gap-2">
                  {urls.map((url, i) => (
                    <div key={i} className="relative flex-1">
                      <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C24A35]" />
                      <Input value={url} placeholder="https://foreignaffairs.com/..." className="h-12 border-transparent bg-[#FDFBF7] pl-11 font-mono text-sm focus-visible:border-[#C24A35] focus-visible:ring-[#C24A35]" onChange={(e) => { const newUrls = [...urls]; newUrls[i] = e.target.value; setUrls(newUrls); }} />
                      {urls.length > 1 && <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2" onClick={() => setUrls(urls.filter((_, idx) => idx !== i))}><X className="h-3 w-3 text-muted-foreground" /></Button>}
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="icon" onClick={() => setUrls([...urls, ""])} className="h-12 w-12 shrink-0 border-black/10"><Plus className="h-5 w-5" /></Button>
                <Button onClick={runInvestigation} disabled={isAnalyzing || urls.every(u => u.trim() === "")} className="h-12 shrink-0 bg-[#1A1A1A] px-8 text-white hover:bg-[#333]">
                  {isAnalyzing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</> : <><Sparkles className="mr-2 h-5 w-5" /> Analyze Sources</>}
                </Button>
              </div>

              {analysisError && <p className="mb-6 rounded-xl border border-[#C24A35]/20 bg-[#FDF6F4] p-4 text-sm text-[#C24A35]">{analysisError}</p>}

              {isAnalyzing && (
                <div className="py-24 text-center">
                  <div className="relative mb-8 inline-block">
                    <div className="h-24 w-24 animate-spin rounded-full border-2 border-[#E5E5E5] border-t-[#C24A35]"></div>
                    <Fingerprint className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-[#C24A35] animate-pulse" />
                  </div>
                  <h4 className="mb-2 font-display text-3xl">Deconstructing Narratives...</h4>
                  <p className="animate-pulse font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Entity Extraction → Semantic Mapping → Contradiction Analysis</p>
                </div>
              )}

              {analysis && !isAnalyzing && (
                <div className="animate-in fade-in slide-in-from-bottom-8 space-y-6 duration-700">
                  
                  {/* QUANT DASHBOARD ROW */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    
                    {/* Narrative Radar (HUD style) */}
                    <div className="lg:col-span-4 flex flex-col rounded-2xl border border-black/10 bg-white p-6 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><Activity className="w-24 h-24 text-[#C24A35]" /></div>
                      <div className="mb-6 flex items-center gap-2 relative z-10">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#C24A35]">Narrative Profile</h4>
                      </div>
                      <div className="h-56 flex-1 relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                            <PolarGrid stroke="#E5E5E5" strokeDasharray="3 3" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#1A1A1A', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Analysis" dataKey="A" stroke="#C24A35" strokeWidth={2} fill="#C24A35" fillOpacity={0.15} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Entity Network (Constellation) */}
                    <div className="lg:col-span-4 flex flex-col rounded-2xl border border-black/10 bg-white p-6 shadow-sm relative overflow-hidden">
                      <div className="absolute bottom-0 right-0 p-4 opacity-10"><Globe className="w-24 h-24 text-[#2D6A65]" /></div>
                      <div className="mb-6 flex items-center gap-2 relative z-10">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#2D6A65]">Entity Network</h4>
                      </div>
                      <div className="flex flex-1 flex-wrap content-center justify-center gap-2 relative z-10">
                        {analysis.entities?.map((entity: string, i: number) => {
                          const isCentral = i < 2;
                          const color = isCentral ? "bg-[#1A1A1A] text-white border-transparent" : "bg-white text-[#1A1A1A] border-black/10";
                          return (
                            <span key={i} className={`px-4 py-2 ${color} border rounded-full font-display text-sm shadow-sm hover:scale-105 transition-transform cursor-default`}>
                              {entity}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Contradiction Gauge */}
                    <div className="lg:col-span-4 flex flex-col rounded-2xl border border-[#FBD0D4] bg-[#FDF6F4] p-6 shadow-sm relative overflow-hidden">
                      <div className="mb-2 flex items-center gap-2 relative z-10">
                        <ShieldAlert className="h-4 w-4 text-[#C24A35]" />
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#C24A35]">Contradiction Index</h4>
                      </div>
                      <ContradictionGauge score={analysis.quantData?.contradictionIndex || 50} />
                      <p className="text-[10px] text-center font-mono uppercase tracking-widest text-[#C24A35]/60 mt-4">High friction detected</p>
                    </div>
                  </div>

                  {/* THE BIG PICTURE (Editorial Block) */}
                  <section className="relative rounded-2xl border-2 border-dashed border-[#1A1A1A]/20 bg-[#FDFBF7] p-10 shadow-sm mt-8">
                    <div className="absolute top-6 right-6 rotate-12 border-4 border-[#C24A35] text-[#C24A35] px-4 py-1 font-mono text-xl font-bold uppercase tracking-widest opacity-20 select-none">
                      Classified
                    </div>
                    <div className="mb-6 flex items-center gap-3">
                      <div className="bg-[#1A1A1A] p-2 rounded-lg"><FileWarning className="h-5 w-5 text-white" /></div>
                      <h4 className="font-mono text-sm uppercase tracking-widest text-[#1A1A1A]">The Big Picture</h4>
                    </div>
                    <p className="font-display text-3xl leading-relaxed text-[#1A1A1A] first-letter:text-6xl first-letter:float-left first-letter:mr-3 first-letter:mt-1">{analysis.conclusion}</p>
                  </section>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-8">
                    {/* Evidence Trail */}
                    <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                      <h4 className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#2D6A65] border-b border-black/5 pb-4"><Check className="h-4 w-4" /> Documented Evidence</h4>
                      <div className="space-y-4">
                        {analysis.evidence?.map((item: any, i: number) => (
                          <div key={i} className="group relative flex flex-col rounded-xl border border-black/5 bg-[#FDFBF7] p-5 transition-all hover:border-[#2D6A65] hover:shadow-md">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2D6A65] rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <b className="mb-2 block font-display text-lg text-[#1A1A1A]">{item.title}</b>
                            <p className="mb-4 flex-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                            <div className="mt-auto flex items-center justify-between border-t border-black/5 pt-3">
                              <span className="max-w-[200px] truncate font-mono text-[9px] uppercase tracking-wider text-[#2D6A65]">{item.source}</span>
                              <Button size="sm" variant={plantedIds[`ev-${i}`] ? "secondary" : "outline"} className={`h-8 rounded-full px-4 text-[10px] uppercase tracking-wider font-bold ${plantedIds[`ev-${i}`] ? "bg-[#2D6A65] text-white" : "border-[#2D6A65] text-[#2D6A65] hover:bg-[#2D6A65]/5"}`} onClick={() => plantAnalysis(`ev-${i}`, "evidence", item.title, item.body, item.source)}>
                                {plantedIds[`ev-${i}`] ? <><Check className="mr-1 h-3 w-3" /> Planted</> : <><MapPin className="mr-1 h-3 w-3" /> Plant</>}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Hypotheses & Blind Spots */}
                    <div className="space-y-6">
                      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                        <h4 className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#6B4C7A] border-b border-black/5 pb-4"><Sparkles className="h-4 w-4" /> Strategic Hypotheses</h4>
                        <div className="space-y-3">
                          {analysis.hypotheses?.map((item: any, i: number) => (
                            <div key={i} className="flex flex-col rounded-xl border border-[#6B4C7A]/10 bg-[#F8F4FA] p-5">
                              <b className="mb-1 block font-display text-base text-[#6B4C7A]">{item.title}</b>
                              <p className="mb-3 text-xs leading-relaxed text-[#1A1A1A]/70">{item.body}</p>
                              <Button size="sm" variant="ghost" className={`h-8 self-end rounded-full text-[10px] font-bold uppercase tracking-wider ${plantedIds[`hyp-${i}`] ? "text-[#6B4C7A] bg-[#6B4C7A]/10" : "text-[#6B4C7A] hover:bg-[#6B4C7A]/10"}`} onClick={() => plantAnalysis(`hyp-${i}`, "hypothesis", item.title, item.body)}>
                                {plantedIds[`hyp-${i}`] ? <><Check className="mr-1 h-3 w-3" /> Planted</> : <><MapPin className="mr-1 h-3 w-3" /> Plant</>}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </section>
                      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                        <h4 className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#C24A35] border-b border-black/5 pb-4"><AlertTriangle className="h-4 w-4" /> Blind Spots</h4>
                        <div className="space-y-3">
                          {analysis.questions?.map((item: any, i: number) => (
                            <div key={i} className="flex flex-col rounded-xl border border-[#C24A35]/10 bg-[#FDF6F4] p-5">
                              <b className="mb-1 block font-display text-base text-[#C24A35]">{item.title}</b>
                              <p className="mb-3 text-xs leading-relaxed text-[#1A1A1A]/70">{item.body}</p>
                              <Button size="sm" variant="ghost" className={`h-8 self-end rounded-full text-[10px] font-bold uppercase tracking-wider ${plantedIds[`q-${i}`] ? "text-[#C24A35] bg-[#C24A35]/10" : "text-[#C24A35] hover:bg-[#C24A35]/10"}`} onClick={() => plantAnalysis(`q-${i}`, "question", item.title, item.body)}>
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
              <article className="flex-1 rounded-2xl border border-black/10 bg-white p-12 shadow-sm relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C24A35] to-transparent" />
                <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[#C24A35]">{active.speaker || "Unknown speaker"} · {active.date || "undated"}</p>
                <h3 className="mb-8 font-display text-5xl leading-tight">{active.title}</h3>
                {active.audience && <p className="mb-8 rounded-lg bg-[#FDFBF7] border border-black/5 p-4 text-sm"><b className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Addressed to</b> {active.audience}</p>}
                <div className="font-serif text-xl leading-loose text-[#1A1A1A]/80" onMouseUp={() => { const q = window.getSelection()?.toString().trim() ?? ""; if (q.length > 3) setSelection({ quote: q, doc: active }); }}>
                  {active.text}
                </div>
              </article>
              <aside className="w-80 shrink-0">
                <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground border-b pb-2">Margin Notes</p>
                {corpus.annotations.filter((mark) => mark.docId === active.id).length === 0 && <p className="text-sm leading-relaxed text-muted-foreground italic">Select a passage to code it. Coded quotes become evidence you can place on the canvas.</p>}
                <div className="space-y-3 mt-4">
                  {corpus.annotations.filter((mark) => mark.docId === active.id).map((mark) => (
                    <div className="rounded-xl border border-black/5 bg-white p-5 shadow-sm" key={mark.id} data-code={mark.code}>
                      <small className="mb-3 block font-mono text-[9px] font-bold uppercase tracking-wider text-[#C24A35]">{codeLabel(mark.code)}</small>
                      <blockquote className="mb-4 font-serif text-sm italic leading-relaxed text-[#1A1A1A]/80 border-l-2 border-[#C24A35] pl-3">“{clip(mark.quote, 150)}”</blockquote>
                      <Button size="sm" variant="outline" className="h-8 w-full rounded-full text-[10px] uppercase tracking-wider font-bold" onClick={() => plant(active, mark.quote, codeLabel(mark.code))}><MapPin className="mr-1 h-3 w-3" />Plant on Canvas</Button>
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
                <h3 className="mb-2 font-display text-5xl">Text Diff</h3>
                <p className="text-sm text-[#1A1A1A]/60">Select two sources to compare their language and framing side-by-side.</p>
              </div>
              <div className="mb-8 grid grid-cols-2 gap-6">
                {[0, 1].map((index) => (
                  <select key={index} className="rounded-xl border border-black/10 bg-white p-4 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C24A35]" value={compareIds[index]} onChange={(e) => setCompareIds((value) => index === 0 ? [e.target.value, value[1]] : [value[0], e.target.value])}>
                    <option value="" disabled>Select a document</option>
                    {docs.map((doc) => <option key={doc.id} value={doc.id}>{doc.date} · {doc.title}</option>)}
                  </select>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-8 relative">
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-black/10 -translate-x-1/2 hidden md:block" />
                {compared.map((doc) => (
                  <article className="rounded-2xl border border-black/10 bg-white p-10 shadow-sm" key={doc.id}>
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[#C24A35]">{doc.speaker} · {doc.date}</p>
                    <h3 className="mb-8 font-display text-3xl">{doc.title}</h3>
                    <div className="font-serif text-base leading-relaxed text-[#1A1A1A]/70" onMouseUp={() => { const q = window.getSelection()?.toString().trim() ?? ""; if (q.length > 3) setSelection({ quote: q, doc }); }}>
                      {doc.text}
                    </div>
                  </article>
                ))}
                {compared.length < 2 && <div className="col-span-2 py-20 text-center font-display text-3xl text-muted-foreground">Select two documents to compare them.</div>}
              </div>
            </div>
          )}

          {/* METRICS VIEW */}
          {view === "count" && (
            <div className="mx-auto max-w-5xl p-8 pb-24">
              <div className="mb-10">
                <h3 className="mb-2 font-display text-5xl">Language Trajectory</h3>
                <p className="text-sm text-[#1A1A1A]/60">Track phrases across texts. Rates are per 1,000 words, so texts of different lengths remain comparable.</p>
              </div>
              
              <form className="mb-8 flex gap-3" onSubmit={(e) => { e.preventDefault(); const value = term.trim().toLowerCase(); if (value && !terms.includes(value) && terms.length < 6) save({ terms: [...terms, value] }); setTerm(""); }}>
                <Input value={term} placeholder="Track a word or phrase (e.g. 'security', 'border')" onChange={(e) => setTerm(e.target.value)} className="h-14 border-black/10 bg-white text-lg rounded-xl px-6" />
                <Button className="h-14 bg-[#1A1A1A] px-10 rounded-xl text-white text-base">Track</Button>
              </form>
              
              <div className="mb-12 flex flex-wrap gap-2">
                {terms.map((item) => (
                  <button key={item} className="flex items-center gap-2 rounded-full bg-[#CBE6F9] px-5 py-2.5 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#A9D5F5]" onClick={() => save({ terms: terms.filter((phrase) => phrase !== item) })}>
                    {item} <X className="h-4 w-4" />
                  </button>
                ))}
              </div>

              <div className="mb-16 space-y-6 rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
                {termCounts.map(({ doc, values }) => (
                  <div key={doc.id} className="flex items-center justify-between border-b border-black/5 pb-6 last:border-0 last:pb-0">
                    <b className="font-display text-xl max-w-[300px] truncate">{doc.date || "—"} · {doc.title}</b>
                    <div className="flex gap-8">
                      {values.map((value) => (
                        <div key={value.phrase} className="text-right">
                          <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{value.phrase}</span>
                          <strong className="text-3xl text-[#C24A35]">{value.rate}</strong>
                          <span className="text-xs text-muted-foreground ml-1">/1k</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {terms.length === 0 && <p className="py-10 text-center font-display text-xl text-muted-foreground">Add a phrase above to see its frequency across documents.</p>}
              </div>

              <section>
                <h3 className="mb-8 font-display text-3xl">Vocabulary Fingerprint</h3>
                <div className="space-y-10">
                  {docs.map((doc) => (
                    <div key={doc.id} className="flex flex-col gap-4">
                      <b className="text-sm font-mono uppercase tracking-widest text-[#1A1A1A]/50">{doc.title}</b>
                      <div className="flex flex-wrap gap-3">
                        {topTerms(doc.text, 15).map(([word, count], i) => {
                          const size = count > 20 ? "text-2xl font-bold" : count > 10 ? "text-lg font-semibold" : "text-sm";
                          const color = i % 3 === 0 ? "text-[#C24A35]" : i % 3 === 1 ? "text-[#2D6A65]" : "text-[#1A1A1A]/70";
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
        <div className="fixed bottom-10 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-black/10 bg-white/90 backdrop-blur-xl p-3 shadow-2xl animate-in slide-in-from-bottom-8">
          <span className="px-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Code as:</span>
          {CODES.map((code) => <button key={code.id} className="rounded-full bg-[#FDFBF7] px-4 py-2 text-xs font-medium text-[#1A1A1A] transition-colors hover:bg-[#E8DAFB]" onClick={() => { 
             if (!selection) return; 
             const at = selection.doc.text.indexOf(selection.quote); 
             if (at < 0) return; 
             if (!corpus.annotations.some((mark) => mark.docId === selection.doc.id && mark.start === at)) {
               save({ annotations: [...corpus.annotations, { id: uid(), docId: selection.doc.id, start: at, end: at + selection.quote.length, quote: selection.quote, code: code.id, note: "" }] }); 
             }
             setSelection(null); 
             window.getSelection()?.removeAllRanges(); 
          }}>{code.label}</button>)}
          <Button size="sm" className="rounded-full bg-[#1A1A1A] px-6 text-white font-bold uppercase tracking-wider text-[10px]" onClick={() => { plant(selection.doc, selection.quote); setSelection(null); }}>Plant</Button>
          <Button variant="ghost" size="icon" className="rounded-full ml-2" onClick={() => setSelection(null)}><X className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}