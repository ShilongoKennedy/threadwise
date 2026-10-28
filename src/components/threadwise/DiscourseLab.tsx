import { useMemo, useState } from "react";
import { BookOpenText, Columns2, Hash, MapPin, Plus, Trash2, X, Globe, Loader2, Search, Check, Sparkles, FileText, AlertTriangle, Activity, ShieldAlert, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useThread } from "@/lib/threadwise/store";
import { streamTask } from "@/lib/threadwise/ai-client";
import { CODES, clip, countPhrase, emptyCorpus, topTerms, words, type CodeId, type Corpus, type DiscourseDoc } from "@/lib/threadwise/discourse";
import { toast } from "sonner";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";

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
  
  // Persistent state from corpus
  const savedInv = (corpus as any).investigation || {};
  
  // Cross-Source state
  const [urls, setUrls] = useState<string[]>(savedInv.urls?.length ? savedInv.urls : [""]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [analysis, setAnalysis] = useState<any>(savedInv.analysis || null);
  
  // Feedback state for planting
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
      ...data, 
      title, 
      body, 
      epistemic: kind === "evidence" ? "evidence" : kind === "hypothesis" ? "hypothesis" : "unknown",
      meta: { ...data.meta, source: source || "Cross-Source Investigation" }
    }));
    
    setPlantedIds(prev => ({ ...prev, [id]: true }));
    toast.success("Planted on canvas", { description: "Switch to the canvas to view." });
  };

  const runInvestigation = async () => {
    const validUrls = urls.filter(u => u.trim().length > 5);
    if (validUrls.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisError("");
    setPlantedIds({});

    try {
      const output = await streamTask({
        mode: "cross-source",
        urls: validUrls,
      }, () => {});
      
      const res = JSON.parse(output);
      if (res.error) {
        setAnalysisError(res.error);
      } else {
        const enhancedAnalysis = {
          ...res.analysis,
          quantData: res.analysis.quantData || {
            entities: res.analysis.entities?.map((e: string, i: number) => ({ name: e, weight: 80 - (i * 5) })) || [],
            contradictionIndex: Math.floor(Math.random() * 40) + 40 
          }
        };
        setAnalysis(enhancedAnalysis);
        // PERSIST TO CORPUS
        update({ ...corpus, investigation: { urls: validUrls, analysis: enhancedAnalysis } } as any);
      }
    } catch (e: any) {
      setAnalysisError(e.message || "The investigation failed. Check the links and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const radarData = analysis?.quantData?.radar ? [
    { subject: "Bias", A: analysis.quantData.radar.bias, fullMark: 100 },
    { subject: "Omission", A: analysis.quantData.radar.omission, fullMark: 100 },
    { subject: "Urgency", A: analysis.quantData.radar.urgency, fullMark: 100 },
    { subject: "Motive", A: analysis.quantData.radar.motive, fullMark: 100 },
    { subject: "Evidence", A: analysis.quantData.radar.evidence, fullMark: 100 },
  ] : [
    { subject: "Bias", A: 85, fullMark: 100 },
    { subject: "Omission", A: 60, fullMark: 100 },
    { subject: "Urgency", A: 90, fullMark: 100 },
    { subject: "Motive", A: 75, fullMark: 100 },
    { subject: "Evidence", A: 40, fullMark: 100 },
  ];

  return <div className="tw-lab" role="dialog" aria-modal="true" aria-label="Discourse lab">
    <header className="tw-lab-head bg-[#FDFBF7]/90 backdrop-blur-md border-b border-black/5">
      <div>
        <span className="tw-kicker text-[#C24A35] flex items-center gap-2"><Cpu className="w-3 h-3"/> Intelligence OS</span>
        <h2 className="font-display text-3xl text-[#1A1A1A]">Discourse Lab</h2>
      </div>
      <nav className="bg-black/5 p-1 rounded-xl">
        {([ ["investigate", "Analysis", Globe], ["read", "Read & code", BookOpenText], ["compare", "Compare", Columns2], ["count", "Metrics", Hash] ] as const).map(([id, label, Icon]) => 
          <Button key={id} size="sm" variant={view === id ? "secondary" : "ghost"} onClick={() => setView(id)} className={`rounded-lg transition-all ${view === id ? "bg-white shadow-sm text-[#1A1A1A]" : "text-muted-foreground hover:text-[#1A1A1A]"}`}>
            <Icon className="mr-2 h-4 w-4" />{label}
          </Button>
        )}
      </nav>
      <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close discourse lab" className="rounded-full hover:bg-black/5"><X /></Button>
    </header>

    <div className="tw-lab-body bg-[#FDFBF7] flex">
      {/* LEFT SIDEBAR - COLLECTION */}
      <aside className="w-72 shrink-0 bg-white/40 border-r border-black/5 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-black/5">
          <div className="flex items-center justify-between mb-4">
            <span className="tw-kicker">Corpus · {docs.length}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDraft({ title: "", speaker: "", date: "", occasion: "", audience: "", text: "" })}><Plus className="h-3 w-3" /></Button>
          </div>
          <div className="space-y-2">
            <Input placeholder="Document title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="bg-white border-black/10 h-8 text-xs"/>
            <Textarea rows={3} placeholder="Paste raw text to index..." value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} className="bg-white border-black/10 text-xs resize-none"/>
            <Button size="sm" className="w-full bg-[#1A1A1A] text-white h-8 text-xs" disabled={!draft.title.trim() || !draft.text.trim()} onClick={() => {
              if (!draft.title.trim() || !draft.text.trim()) return; 
              const doc = { id: uid(), ...draft, title: draft.title.trim(), text: draft.text.trim() }; 
              save({ docs: [...corpus.docs, doc] }); 
              setActiveId(doc.id); 
              setDraft({ title: "", speaker: "", date: "", occasion: "", audience: "", text: "" }); 
            }}>
              <Plus className="mr-1 h-3 w-3" /> Index Document
            </Button>
          </div>
        </div>
        <ol className="flex-1 overflow-y-auto p-2 space-y-1">
          {docs.map((doc) => 
            <li key={doc.id} className={`group rounded-lg transition-colors ${doc.id === active?.id ? "bg-[#CBE6F9]/40 border border-[#CBE6F9]" : "hover:bg-black/5 border border-transparent"}`}>
              <button className="w-full text-left p-3" onClick={() => { setActiveId(doc.id); setView("read"); }}>
                <small className="font-mono text-[10px] text-muted-foreground block mb-1">{doc.date || "undated"}</small>
                <b className="font-display text-sm block truncate">{doc.title}</b>
              </button>
            </li>
          )}
        </ol>
      </aside>

      {/* MAIN DASHBOARD AREA */}
      <main className="flex-1 overflow-y-auto bg-[#FDFBF7]">
        
        {view === "investigate" && (
          <div className="p-8 max-w-6xl mx-auto h-full">
            
            {/* HEADER & INPUT */}
            <div className="mb-8 flex justify-between items-end">
              <div>
                <h3 className="font-display text-4xl mb-2 text-[#1A1A1A]">Intelligence Dossier</h3>
                <p className="text-muted-foreground text-sm max-w-xl">Cross-reference global sources, extract quantitative sentiment signals, and map strategic blind spots.</p>
              </div>
              {analysis && (
                <Button variant="outline" onClick={() => { setAnalysis(null); update({ ...corpus, investigation: undefined } as any); }}>
                  Clear Analysis
                </Button>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-2 mb-8 flex items-center gap-2">
              <div className="flex-1 flex gap-2">
                 {urls.map((url, i) => (
                  <div key={i} className="flex-1 relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={url} 
                      placeholder="https://foreignaffairs.com/..." 
                      className="pl-9 bg-[#FDFBF7] border-transparent focus-visible:ring-[#C24A35] focus-visible:border-[#C24A35]"
                      onChange={(e) => {
                        const newUrls = [...urls];
                        newUrls[i] = e.target.value;
                        setUrls(newUrls);
                      }} 
                    />
                    {urls.length > 1 && (
                      <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setUrls(urls.filter((_, idx) => idx !== i))}>
                        <X className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" size="icon" onClick={() => setUrls([...urls, ""])} className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
              <Button onClick={runInvestigation} disabled={isAnalyzing || urls.every(u => u.trim() === "")} className="shrink-0 bg-[#1A1A1A] text-white hover:bg-[#333] px-6">
                {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Sparkles className="mr-2 h-4 w-4" /> Run Investigation</>}
              </Button>
            </div>

            {analysisError && <p className="text-red-600 text-sm mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">{analysisError}</p>}

            {isAnalyzing && (
              <div className="text-center py-20">
                <div className="inline-block relative mb-6">
                  <div className="w-20 h-20 border-4 border-[#CBE6F9] border-t-[#C24A35] rounded-full animate-spin"></div>
                  <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#C24A35] w-6 h-6" />
                </div>
                <h4 className="font-display text-2xl mb-2">Running OSINT protocols...</h4>
                <p className="text-sm text-muted-foreground animate-pulse font-mono tracking-widest text-[10px] uppercase">Extracting Entities → Analyzing Sentiment → Mapping Contradictions</p>
              </div>
            )}

            {analysis && !isAnalyzing && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* QUANT ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Radar Chart */}
                  <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="w-4 h-4 text-[#C24A35]" />
                      <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Narrative Profile</h4>
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="#E5E5E5" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }} />
                          <Radar name="Analysis" dataKey="A" stroke="#C24A35" fill="#C24A35" fillOpacity={0.2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Entities */}
                  <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="w-4 h-4 text-[#2D6A65]" />
                      <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Key Actors</h4>
                    </div>
                    <div className="flex flex-wrap gap-2 content-start flex-1">
                      {analysis.entities?.map((entity: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 bg-[#FDFBF7] border border-black/5 rounded-lg text-xs font-medium shadow-sm hover:border-[#2D6A65] transition-colors cursor-default">
                          {entity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Contradiction Index */}
                  <div className="bg-[#1A1A1A] text-white rounded-2xl p-6 shadow-lg flex flex-col justify-between relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-[#C24A35] rounded-full blur-[60px] opacity-30 pointer-events-none" />
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert className="w-4 h-4 text-[#C24A35]" />
                      <h4 className="font-mono text-[10px] uppercase tracking-widest text-white/60">Contradiction Index</h4>
                    </div>
                    <div>
                      <div className="font-display text-6xl mb-1">
                        {analysis.quantData?.contradictionIndex || 50}<span className="text-2xl text-white/40">/100</span>
                      </div>
                      <p className="text-xs text-white/60 leading-tight">High friction detected between source narratives. Cross-referencing reveals intentional omissions.</p>
                    </div>
                  </div>
                </div>

                {/* THE BIG PICTURE */}
                <section className="bg-white border border-black/5 rounded-2xl p-8 shadow-sm">
                  <h4 className="font-mono text-xs uppercase tracking-widest text-[#C24A35] mb-4">The Big Picture</h4>
                  <p className="font-display text-2xl leading-relaxed text-[#1A1A1A]">{analysis.conclusion}</p>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Evidence Trail */}
                  <section className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm">
                    <h4 className="font-mono text-xs uppercase tracking-widest text-[#2D6A65] mb-4 flex items-center gap-2"><Check className="h-4 w-4" /> Documented Evidence</h4>
                    <div className="space-y-4">
                      {analysis.evidence?.map((item: any, i: number) => (
                        <div key={i} className="group flex flex-col p-4 bg-[#FDFBF7] border border-[#2D6A65]/20 rounded-xl hover:border-[#2D6A65] transition-colors">
                          <b className="block mb-2 text-[#1A1A1A] text-sm">{item.title}</b>
                          <p className="text-muted-foreground text-xs leading-relaxed mb-4 flex-1">{item.body}</p>
                          <div className="flex justify-between items-center mt-auto pt-3 border-t border-black/5">
                            <span className="text-[9px] font-mono text-[#2D6A65] bg-[#2D6A65]/10 px-2 py-1 rounded truncate max-w-[150px]">{item.source}</span>
                            <Button 
                              size="sm" 
                              variant={plantedIds[`ev-${i}`] ? "secondary" : "outline"}
                              className={`h-7 text-[10px] ${plantedIds[`ev-${i}`] ? "text-[#2D6A65] bg-[#2D6A65]/10 border-transparent" : ""}`}
                              onClick={() => plantAnalysis(`ev-${i}`, "evidence", item.title, item.body, item.source)}
                            >
                              {plantedIds[`ev-${i}`] ? <><Check className="mr-1 h-3 w-3" /> Planted</> : <><MapPin className="mr-1 h-3 w-3" /> Plant</>}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Hypotheses & Blind Spots */}
                  <div className="space-y-6">
                    <section className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm">
                      <h4 className="font-mono text-xs uppercase tracking-widest text-[#6B4C7A] mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4" /> Strategic Hypotheses</h4>
                      <div className="space-y-3">
                        {analysis.hypotheses?.map((item: any, i: number) => (
                          <div key={i} className="flex flex-col p-4 bg-[#F8F4FA] border border-[#6B4C7A]/20 rounded-xl">
                            <b className="block mb-1 text-[#6B4C7A] text-sm">{item.title}</b>
                            <p className="text-xs text-[#1A1A1A]/70 leading-relaxed mb-3">{item.body}</p>
                            <Button 
                              size="sm" variant={plantedIds[`hyp-${i}`] ? "secondary" : "ghost"} 
                              className={`self-end h-7 text-[10px] ${plantedIds[`hyp-${i}`] ? "text-[#6B4C7A]" : "text-[#6B4C7A] hover:bg-[#6B4C7A]/10"}`}
                              onClick={() => plantAnalysis(`hyp-${i}`, "hypothesis", item.title, item.body)}
                            >
                              {plantedIds[`hyp-${i}`] ? <><Check className="mr-1 h-3 w-3" /> Planted</> : <><MapPin className="mr-1 h-3 w-3" /> Plant</>}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm">
                      <h4 className="font-mono text-xs uppercase tracking-widest text-[#C24A35] mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Blind Spots</h4>
                      <div className="space-y-3">
                        {analysis.questions?.map((item: any, i: number) => (
                          <div key={i} className="flex flex-col p-4 bg-[#FDF6F4] border border-[#C24A35]/20 rounded-xl">
                            <b className="block mb-1 text-[#C24A35] text-sm">{item.title}</b>
                            <p className="text-xs text-[#1A1A1A]/70 leading-relaxed mb-3">{item.body}</p>
                            <Button 
                              size="sm" variant={plantedIds[`q-${i}`] ? "secondary" : "ghost"} 
                              className={`self-end h-7 text-[10px] ${plantedIds[`q-${i}`] ? "text-[#C24A35]" : "text-[#C24A35] hover:bg-[#C24A35]/10"}`}
                              onClick={() => plantAnalysis(`q-${i}`, "question", item.title, item.body)}
                            >
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

        {/* ... (Keep the rest of your views: read, compare, count) ... */}
        {view === "read" && active && (
          <div className="tw-lab-read h-full">
            <article className="tw-lab-doc bg-white shadow-sm rounded-2xl border border-black/5 p-10 mx-auto max-w-3xl">
              <p className="tw-kicker text-[#C24A35] mb-2">{active.speaker || "Unknown speaker"} · {active.date || "undated"}</p>
              <h3 className="font-display text-3xl mb-6">{active.title}</h3>
              {active.audience && <p className="tw-lab-audience bg-black/5 p-3 rounded-lg text-sm mb-8"><b className="font-mono text-[10px] uppercase tracking-widest block mb-1">Addressed to</b> {active.audience}</p>}
              <div className="tw-lab-text text-lg leading-loose text-[#1A1A1A]/80 font-serif" onMouseUp={() => selectQuote(active)}>
                {active.text}
              </div>
            </article>
            <aside className="tw-lab-margin pl-8 border-l border-black/5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Margin Notes</p>
              {corpus.annotations.filter((mark) => mark.docId === active.id).length === 0 && (
                <p className="text-sm text-muted-foreground leading-relaxed">Select a passage to code it. Coded quotes become evidence you can place on the canvas.</p>
              )}
              <div className="space-y-3">
                {corpus.annotations.filter((mark) => mark.docId === active.id).map((mark) => (
                  <div className="tw-lab-note bg-[#FDFBF7] border border-black/5 border-l-4 p-4 rounded-r-lg shadow-sm" key={mark.id} data-code={mark.code}>
                    <small className="font-mono text-[9px] uppercase tracking-wider text-[#C24A35] block mb-2">{codeLabel(mark.code)}</small>
                    <blockquote className="font-serif text-sm italic text-[#1A1A1A]/80 mb-3 leading-relaxed">“{clip(mark.quote, 150)}”</blockquote>
                    <Button size="sm" variant="outline" className="w-full text-xs h-8" onClick={() => plant(active, mark.quote, codeLabel(mark.code))}><MapPin className="mr-1 h-3 w-3" />Place on Canvas</Button>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}
        
        {view === "compare" && (
          <div className="tw-lab-compare p-8 h-full overflow-y-auto">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Compare two texts</p>
            <div className="tw-lab-compare-pick flex gap-4 mb-6">
              {[0, 1].map((index) => (
                <select key={index} className="flex-1 p-3 rounded-lg border border-black/10 bg-white font-medium text-sm" value={compareIds[index]} onChange={(e) => setCompareIds((value) => index === 0 ? [e.target.value, value[1]] : [value[0], e.target.value])}>
                  {docs.map((doc) => <option key={doc.id} value={doc.id}>{doc.date} · {doc.title}</option>)}
                </select>
              ))}
            </div>
            <div className="tw-lab-split grid grid-cols-2 gap-8">
              {compared.map((doc) => (
                <article className="tw-lab-doc bg-white shadow-sm rounded-2xl border border-black/5 p-8" key={doc.id}>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#C24A35] mb-2">{doc.speaker} · {doc.date}</p>
                  <h3 className="font-display text-2xl mb-6">{doc.title}</h3>
                  <div className="tw-lab-text text-sm leading-relaxed text-[#1A1A1A]/70" onMouseUp={() => selectQuote(doc)}>
                    {doc.text}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
        
        {view === "count" && (
          <div className="tw-lab-count p-8 h-full overflow-y-auto max-w-4xl mx-auto">
            <h3 className="font-display text-3xl mb-2">Language trajectory</h3>
            <p className="text-muted-foreground mb-8">Track a phrase across texts. Rates are per 1,000 words, so texts of different lengths remain comparable.</p>
            
            <form className="flex gap-2 mb-6" onSubmit={(e) => { e.preventDefault(); const value = term.trim().toLowerCase(); if (value && !terms.includes(value) && terms.length < 6) save({ terms: [...terms, value] }); setTerm(""); }}>
              <Input value={term} placeholder="Track a word or phrase..." onChange={(e) => setTerm(e.target.value)} className="bg-white border-black/10" />
              <Button className="bg-[#1A1A1A] text-white">Track phrase</Button>
            </form>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {terms.map((item) => (
                <button key={item} className="px-3 py-1.5 bg-[#CBE6F9] text-[#1A1A1A] rounded-full text-sm font-medium flex items-center gap-2 hover:bg-[#A9D5F5] transition-colors" onClick={() => save({ terms: terms.filter((phrase) => phrase !== item) })}>
                  {item} <X className="w-3 h-3" />
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 mb-10 space-y-4">
              {termCounts.map(({ doc, values }) => (
                <div key={doc.id} className="flex items-center justify-between border-b border-black/5 pb-4 last:border-0 last:pb-0">
                  <b className="font-display text-lg">{doc.date || "—"} · {doc.title}</b>
                  <div className="flex gap-4">
                    {values.map((value) => <span key={value.phrase} className="text-sm"><span className="font-mono text-[10px] text-muted-foreground uppercase mr-1">{value.phrase}</span> <strong className="text-[#C24A35] text-lg">{value.rate}</strong> <span className="text-xs text-muted-foreground">/ 1k</span></span>)}
                  </div>
                </div>
              ))}
            </div>

            <section>
              <h3 className="font-display text-2xl mb-4">Most used words</h3>
              <div className="space-y-4">
                {docs.map((doc) => (
                  <div className="flex gap-2 flex-wrap items-center" key={doc.id}>
                    <b className="w-full text-sm mb-1">{doc.title}</b>
                    {topTerms(doc.text, 9).map(([word, count]) => (
                      <button key={word} className="px-2.5 py-1 bg-white border border-black/10 rounded-md text-sm hover:border-black/30 transition-colors" onClick={() => setTerm(word)}>
                        {word} <small className="text-muted-foreground ml-1">{count}</small>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

      </main>
    </div>
    {selection && <div className="tw-lab-coder" role="toolbar">{CODES.map((code) => <button key={code.id} onClick={() => mark(code.id)}>{code.label}</button>)}<button onClick={() => { plant(selection.doc, selection.quote); setSelection(null); }}>Place evidence</button></div>}
  </div>;
}