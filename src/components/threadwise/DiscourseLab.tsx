import { useMemo, useState } from "react";
import { BookOpenText, Columns2, Hash, MapPin, Plus, Trash2, X, Globe, Loader2, Search, Check, Sparkles, FileText, AlertTriangle, Activity, ShieldAlert, Cpu, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useThread } from "@/lib/threadwise/store";
import { streamTask } from "@/lib/threadwise/ai-client";
import { CODES, clip, countPhrase, emptyCorpus, topTerms, words, type CodeId, type Corpus, type DiscourseDoc } from "@/lib/threadwise/discourse";
import { toast } from "sonner";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

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
      ...data, 
      title, 
      body, 
      epistemic: kind === "evidence" ? "evidence" : kind === "hypothesis" ? "hypothesis" : "unknown",
      meta: { ...data.meta, source: source || "Cross-Source Investigation" }
    }));
    setPlantedIds(prev => ({ ...prev, [id]: true }));
    toast.success("Planted on canvas");
  };

  const runInvestigation = async () => {
    const validUrls = urls.filter(u => u.trim().length > 5);
    if (validUrls.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisError("");
    setPlantedIds({});

    try {
      const output = await streamTask({ mode: "cross-source", urls: validUrls }, () => {});
      const res = JSON.parse(output);
      if (res.error) setAnalysisError(res.error);
      else {
        const enhancedAnalysis = { ...res.analysis, quantData: res.analysis.quantData || { contradictionIndex: 50 } };
        setAnalysis(enhancedAnalysis);
        update({ ...corpus, investigation: { urls: validUrls, analysis: enhancedAnalysis } } as any);
      }
    } catch (e: any) {
      setAnalysisError(e.message || "The investigation failed.");
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
    { subject: "Bias", A: 0, fullMark: 100 },
    { subject: "Omission", A: 0, fullMark: 100 },
    { subject: "Urgency", A: 0, fullMark: 100 },
    { subject: "Motive", A: 0, fullMark: 100 },
    { subject: "Evidence", A: 0, fullMark: 100 },
  ];

  const compared = compareIds.map((id) => docs.find((doc) => doc.id === id)).filter(Boolean) as DiscourseDoc[];
  const terms = corpus.terms;
  const termCounts = useMemo(() => docs.map((doc) => ({ doc, values: terms.map((phrase) => ({ phrase, n: countPhrase(doc.text, phrase), rate: words(doc.text).length ? Math.round(countPhrase(doc.text, phrase) / words(doc.text).length * 10000) / 10 : 0 })) })), [docs, terms]);

  return (
    <div className="tw-lab fixed inset-0 z-50 flex flex-col bg-[#FDFBF7] font-sans" role="dialog" aria-modal="true">
      
      {/* AMBIENT BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-[#FDF0B6] opacity-20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-[#CBE6F9] opacity-30 blur-[150px]" />
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
      </div>

      <header className="relative z-10 flex items-center justify-between border-b border-black/10 bg-white/60 px-6 py-4 backdrop-blur-xl">
        <div>
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#C24A35]">
            <Cpu className="h-3 w-3" /> Intelligence OS
          </span>
          <h2 className="font-display text-3xl text-[#1A1A1A]">Discourse Lab</h2>
        </div>
        <nav className="flex gap-1 rounded-xl bg-black/5 p-1">
          {([ ["investigate", "Analysis", Globe], ["read", "Read & code", BookOpenText], ["compare", "Compare", Columns2], ["count", "Metrics", Hash] ] as const).map(([id, label, Icon]) => (
            <Button key={id} size="sm" variant={view === id ? "secondary" : "ghost"} onClick={() => setView(id)} className={`rounded-lg transition-all ${view === id ? "bg-white text-[#1A1A1A] shadow-sm" : "text-muted-foreground hover:text-[#1A1A1A]"}`}>
              <Icon className="mr-2 h-4 w-4" />{label}
            </Button>
          ))}
        </nav>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-black/5"><X /></Button>
      </header>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-black/5 bg-white/40 backdrop-blur-md">
          <div className="border-b border-black/5 p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/50">Corpus · {docs.length}</span>
            </div>
            <div className="space-y-2">
              <Input placeholder="Document title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="h-8 border-black/10 bg-white text-xs" />
              <Textarea rows={3} placeholder="Paste raw text to index..." value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} className="resize-none border-black/10 bg-white text-xs" />
              <Button size="sm" className="h-8 w-full bg-[#1A1A1A] text-xs text-white" disabled={!draft.title.trim() || !draft.text.trim()} onClick={() => {
                if (!draft.title.trim() || !draft.text.trim()) return; 
                const doc = { id: uid(), ...draft, title: draft.title.trim(), text: draft.text.trim() }; 
                save({ docs: [...corpus.docs, doc] }); setActiveId(doc.id); 
                setDraft({ title: "", speaker: "", date: "", occasion: "", audience: "", text: "" }); 
              }}>
                <Plus className="mr-1 h-3 w-3" /> Index Document
              </Button>
            </div>
          </div>
          <ol className="flex-1 space-y-1 overflow-y-auto p-2">
            {docs.map((doc) => (
              <li key={doc.id} className={`group rounded-lg transition-colors ${doc.id === active?.id ? "border border-[#CBE6F9] bg-[#CBE6F9]/40" : "border border-transparent hover:bg-black/5"}`}>
                <button className="w-full p-3 text-left" onClick={() => { setActiveId(doc.id); setView("read"); }}>
                  <small className="mb-1 block font-mono text-[10px] text-muted-foreground">{doc.date || "undated"}</small>
                  <b className="block truncate font-display text-sm">{doc.title}</b>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto">
          
          {/* INVESTIGATE VIEW */}
          {view === "investigate" && (
            <div className="mx-auto max-w-6xl p-8 pb-24">
              
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <h3 className="mb-2 font-display text-4xl text-[#1A1A1A]">Intelligence Dossier</h3>
                  <p className="max-w-xl text-sm text-[#1A1A1A]/60">Cross-reference global sources, extract quantitative sentiment signals, and map strategic blind spots.</p>
                </div>
                {analysis && (
                  <Button variant="outline" className="border-black/10" onClick={() => { setAnalysis(null); update({ ...corpus, investigation: undefined } as any); }}>
                    Clear Analysis
                  </Button>
                )}
              </div>

              {/* URL INPUT COMMAND BAR */}
              <div className="mb-10 flex items-center gap-2 rounded-2xl border border-black/5 bg-white p-2 shadow-sm">
                <div className="flex flex-1 gap-2">
                  {urls.map((url, i) => (
                    <div key={i} className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        value={url} placeholder="https://foreignaffairs.com/..." 
                        className="border-transparent bg-[#FDFBF7] pl-9 focus-visible:border-[#C24A35] focus-visible:ring-[#C24A35]"
                        onChange={(e) => { const newUrls = [...urls]; newUrls[i] = e.target.value; setUrls(newUrls); }} 
                      />
                      {urls.length > 1 && (
                        <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2" onClick={() => setUrls(urls.filter((_, idx) => idx !== i))}>
                          <X className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="icon" onClick={() => setUrls([...urls, ""])} className="shrink-0 border-black/10">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button onClick={runInvestigation} disabled={isAnalyzing || urls.every(u => u.trim() === "")} className="shrink-0 bg-[#1A1A1A] px-6 text-white hover:bg-[#333]">
                  {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Sparkles className="mr-2 h-4 w-4" /> Run Investigation</>}
                </Button>
              </div>

              {analysisError && <p className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{analysisError}</p>}

              {isAnalyzing && (
                <div className="py-20 text-center">
                  <div className="relative mb-6 inline-block">
                    <div className="h-20 w-20 animate-spin rounded-full border-4 border-[#CBE6F9] border-t-[#C24A35]"></div>
                    <Activity className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-[#C24A35]" />
                  </div>
                  <h4 className="mb-2 font-display text-2xl">Running OSINT protocols...</h4>
                  <p className="animate-pulse font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Extracting Entities → Analyzing Sentiment → Mapping Contradictions</p>
                </div>
              )}

              {analysis && !isAnalyzing && (
                <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
                  
                  {/* QUANT DASHBOARD ROW */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    
                    {/* Narrative Radar */}
                    <div className="flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[#C24A35]" />
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Narrative Profile</h4>
                      </div>
                      <div className="h-56 flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                            <PolarGrid stroke="#E5E5E5" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }} />
                            <Radar name="Analysis" dataKey="A" stroke="#C24A35" fill="#C24A35" fillOpacity={0.15} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Key Actors */}
                    <div className="flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-[#2D6A65]" />
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Key Actors</h4>
                      </div>
                      <div className="flex flex-1 flex-wrap content-start gap-2">
                        {analysis.entities?.map((entity: string, i: number) => {
                          const colors = ["bg-[#CBE6F9]", "bg-[#FBD0D4]", "bg-[#FDF0B6]", "bg-[#E8DAFB]", "bg-[#C9E8C7]"];
                          return (
                            <span key={i} className={`px-3 py-1.5 ${colors[i % colors.length]} border border-black/5 rounded-lg text-xs font-medium text-[#1A1A1A] shadow-sm hover:-translate-y-0.5 transition-transform cursor-default`}>
                              {entity}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Contradiction Index - NOW WITH A WARM PASTEL BACKGROUND */}
                    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#FBD0D4] bg-[#FBD0D4]/40 p-6 shadow-sm">
                      <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-white opacity-40 blur-[40px]" />
                      <div className="mb-2 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-[#C24A35]" />
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#C24A35]">Contradiction Index</h4>
                      </div>
                      <div>
                        <div className="mb-1 font-display text-7xl tracking-tighter text-[#C24A35]">
                          {analysis.quantData?.contradictionIndex || 50}<span className="text-2xl text-[#C24A35]/40">/100</span>
                        </div>
                        <p className="text-xs leading-tight text-[#1A1A1A]/60">High friction detected between source narratives. Cross-referencing reveals intentional omissions.</p>
                      </div>
                    </div>
                  </div>

                  {/* THE BIG PICTURE */}
                  <section className="relative overflow-hidden rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
                    <div className="absolute left-0 top-0 h-full w-1 bg-[#C24A35]" />
                    <h4 className="mb-4 font-mono text-xs uppercase tracking-widest text-[#C24A35]">The Big Picture</h4>
                    <p className="font-display text-3xl leading-relaxed text-[#1A1A1A]">{analysis.conclusion}</p>
                  </section>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Evidence Trail */}
                    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                      <h4 className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#2D6A65]"><Check className="h-4 w-4" /> Documented Evidence</h4>
                      <div className="space-y-4">
                        {analysis.evidence?.map((item: any, i: number) => (
                          <div key={i} className="group flex flex-col rounded-xl border border-[#2D6A65]/20 bg-[#FDFBF7] p-4 transition-colors hover:border-[#2D6A65]">
                            <b className="mb-2 block text-sm text-[#1A1A1A]">{item.title}</b>
                            <p className="mb-4 flex-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                            <div className="mt-auto flex items-center justify-between border-t border-black/5 pt-3">
                              <span className="max-w-[150px] truncate rounded bg-[#2D6A65]/10 px-2 py-1 font-mono text-[9px] text-[#2D6A65]">{item.source}</span>
                              <Button size="sm" variant={plantedIds[`ev-${i}`] ? "secondary" : "outline"} className={`h-7 text-[10px] ${plantedIds[`ev-${i}`] ? "border-transparent bg-[#2D6A65]/10 text-[#2D6A65]" : ""}`} onClick={() => plantAnalysis(`ev-${i}`, "evidence", item.title, item.body, item.source)}>
                                {plantedIds[`ev-${i}`] ? <><Check className="mr-1 h-3 w-3" /> Planted</> : <><MapPin className="mr-1 h-3 w-3" /> Plant</>}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Hypotheses & Blind Spots */}
                    <div className="space-y-6">
                      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                        <h4 className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#6B4C7A]"><Sparkles className="h-4 w-4" /> Strategic Hypotheses</h4>
                        <div className="space-y-3">
                          {analysis.hypotheses?.map((item: any, i: number) => (
                            <div key={i} className="flex flex-col rounded-xl border border-[#6B4C7A]/20 bg-[#F8F4FA] p-4">
                              <b className="mb-1 block text-sm text-[#6B4C7A]">{item.title}</b>
                              <p className="mb-3 text-xs leading-relaxed text-[#1A1A1A]/70">{item.body}</p>
                              <Button size="sm" variant={plantedIds[`hyp-${i}`] ? "secondary" : "ghost"} className={`h-7 self-end text-[10px] ${plantedIds[`hyp-${i}`] ? "text-[#6B4C7A]" : "text-[#6B4C7A] hover:bg-[#6B4C7A]/10"}`} onClick={() => plantAnalysis(`hyp-${i}`, "hypothesis", item.title, item.body)}>
                                {plantedIds[`hyp-${i}`] ? <><Check className="mr-1 h-3 w-3" /> Planted</> : <><MapPin className="mr-1 h-3 w-3" /> Plant</>}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </section>
                      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                        <h4 className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#C24A35]"><AlertTriangle className="h-4 w-4" /> Blind Spots</h4>
                        <div className="space-y-3">
                          {analysis.questions?.map((item: any, i: number) => (
                            <div key={i} className="flex flex-col rounded-xl border border-[#C24A35]/20 bg-[#FDF6F4] p-4">
                              <b className="mb-1 block text-sm text-[#C24A35]">{item.title}</b>
                              <p className="mb-3 text-xs leading-relaxed text-[#1A1A1A]/70">{item.body}</p>
                              <Button size="sm" variant={plantedIds[`q-${i}`] ? "secondary" : "ghost"} className={`h-7 self-end text-[10px] ${plantedIds[`q-${i}`] ? "text-[#C24A35]" : "text-[#C24A35] hover:bg-[#C24A35]/10"}`} onClick={() => plantAnalysis(`q-${i}`, "question", item.title, item.body)}>
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
              <article className="flex-1 rounded-2xl border border-black/5 bg-white p-10 shadow-sm">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[#C24A35]">{active.speaker || "Unknown speaker"} · {active.date || "undated"}</p>
                <h3 className="mb-8 font-display text-4xl">{active.title}</h3>
                {active.audience && <p className="mb-8 rounded-lg bg-black/5 p-4 text-sm"><b className="mb-1 block font-mono text-[10px] uppercase tracking-widest">Addressed to</b> {active.audience}</p>}
                <div className="font-serif text-lg leading-loose text-[#1A1A1A]/80" onMouseUp={() => { const q = window.getSelection()?.toString().trim() ?? ""; if (q.length > 3) setSelection({ quote: q, doc: active }); }}>
                  {active.text}
                </div>
              </article>
              <aside className="w-80 shrink-0">
                <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Margin Notes</p>
                {corpus.annotations.filter((mark) => mark.docId === active.id).length === 0 && <p className="text-sm leading-relaxed text-muted-foreground">Select a passage to code it. Coded quotes become evidence you can place on the canvas.</p>}
                <div className="space-y-3">
                  {corpus.annotations.filter((mark) => mark.docId === active.id).map((mark) => (
                    <div className="rounded-r-lg border border-black/5 border-l-4 bg-white p-4 shadow-sm" key={mark.id} data-code={mark.code}>
                      <small className="mb-2 block font-mono text-[9px] uppercase tracking-wider text-[#C24A35]">{codeLabel(mark.code)}</small>
                      <blockquote className="mb-3 font-serif text-sm italic leading-relaxed text-[#1A1A1A]/80">“{clip(mark.quote, 150)}”</blockquote>
                      <Button size="sm" variant="outline" className="h-8 w-full text-xs" onClick={() => plant(active, mark.quote, codeLabel(mark.code))}><MapPin className="mr-1 h-3 w-3" />Place on Canvas</Button>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          )}

          {/* COMPARE VIEW */}
          {view === "compare" && (
            <div className="mx-auto max-w-6xl p-8 pb-24">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="mb-2 font-display text-4xl">Compare Texts</h3>
                  <p className="text-sm text-[#1A1A1A]/60">Select two sources to compare their language and framing side-by-side.</p>
                </div>
              </div>
              <div className="mb-6 grid grid-cols-2 gap-4">
                {[0, 1].map((index) => (
                  <select key={index} className="rounded-lg border border-black/10 bg-white p-3 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C24A35]" value={compareIds[index]} onChange={(e) => setCompareIds((value) => index === 0 ? [e.target.value, value[1]] : [value[0], e.target.value])}>
                    <option value="" disabled>Select a document</option>
                    {docs.map((doc) => <option key={doc.id} value={doc.id}>{doc.date} · {doc.title}</option>)}
                  </select>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-6">
                {compared.map((doc) => (
                  <article className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm" key={doc.id}>
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[#C24A35]">{doc.speaker} · {doc.date}</p>
                    <h3 className="mb-6 font-display text-2xl">{doc.title}</h3>
                    <div className="text-sm leading-relaxed text-[#1A1A1A]/70" onMouseUp={() => { const q = window.getSelection()?.toString().trim() ?? ""; if (q.length > 3) setSelection({ quote: q, doc }); }}>
                      {doc.text}
                    </div>
                  </article>
                ))}
                {compared.length < 2 && <div className="col-span-2 py-12 text-center font-display text-2xl text-muted-foreground">Select two documents to compare them.</div>}
              </div>
            </div>
          )}

          {/* METRICS VIEW */}
          {view === "count" && (
            <div className="mx-auto max-w-5xl p-8 pb-24">
              <div className="mb-8">
                <h3 className="mb-2 font-display text-4xl">Language Trajectory</h3>
                <p className="text-sm text-[#1A1A1A]/60">Track phrases across texts. Rates are per 1,000 words, so texts of different lengths remain comparable.</p>
              </div>
              
              <form className="mb-8 flex gap-2" onSubmit={(e) => { e.preventDefault(); const value = term.trim().toLowerCase(); if (value && !terms.includes(value) && terms.length < 6) save({ terms: [...terms, value] }); setTerm(""); }}>
                <Input value={term} placeholder="Track a word or phrase (e.g. 'security', 'border')" onChange={(e) => setTerm(e.target.value)} className="h-12 border-black/10 bg-white text-base" />
                <Button className="h-12 bg-[#1A1A1A] px-8 text-white">Track phrase</Button>
              </form>
              
              <div className="mb-10 flex flex-wrap gap-2">
                {terms.map((item) => (
                  <button key={item} className="flex items-center gap-2 rounded-full bg-[#CBE6F9] px-4 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#A9D5F5]" onClick={() => save({ terms: terms.filter((phrase) => phrase !== item) })}>
                    {item} <X className="h-4 w-4" />
                  </button>
                ))}
              </div>

              <div className="mb-12 space-y-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                {termCounts.map(({ doc, values }) => (
                  <div key={doc.id} className="flex items-center justify-between border-b border-black/5 pb-4 last:border-0 last:pb-0">
                    <b className="font-display text-lg">{doc.date || "—"} · {doc.title}</b>
                    <div className="flex gap-6">
                      {values.map((value) => <span key={value.phrase} className="text-sm"><span className="mr-1 font-mono text-[10px] uppercase text-muted-foreground">{value.phrase}</span> <strong className="text-lg text-[#C24A35]">{value.rate}</strong> <span className="text-xs text-muted-foreground">/ 1k</span></span>)}
                    </div>
                  </div>
                ))}
                {terms.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Add a phrase above to see its frequency across documents.</p>}
              </div>

              <section>
                <h3 className="mb-6 font-display text-2xl">Most Used Words</h3>
                <div className="space-y-8">
                  {docs.map((doc) => (
                    <div key={doc.id} className="flex flex-col gap-3">
                      <b className="text-sm text-[#1A1A1A]/60">{doc.title}</b>
                      <div className="flex flex-wrap gap-2">
                        {topTerms(doc.text, 12).map(([word, count]) => (
                          <button key={word} className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:border-black/30" onClick={() => setTerm(word)}>
                            {word} <small className="ml-1 text-muted-foreground">{count}</small>
                          </button>
                        ))}
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
        <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-black/10 bg-white p-2 shadow-xl animate-in slide-in-from-bottom-4">
          <span className="px-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Code as:</span>
          {CODES.map((code) => <button key={code.id} className="rounded-full bg-[#FDFBF7] px-3 py-1.5 text-xs font-medium text-[#1A1A1A] transition-colors hover:bg-[#E8DAFB]" onClick={() => { 
             if (!selection) return; 
             const at = selection.doc.text.indexOf(selection.quote); 
             if (at < 0) return; 
             if (!corpus.annotations.some((mark) => mark.docId === selection.doc.id && mark.start === at)) {
               save({ annotations: [...corpus.annotations, { id: uid(), docId: selection.doc.id, start: at, end: at + selection.quote.length, quote: selection.quote, code: code.id, note: "" }] }); 
             }
             setSelection(null); 
             window.getSelection()?.removeAllRanges(); 
          }}>{code.label}</button>)}
          <Button size="sm" className="rounded-full bg-[#1A1A1A] px-4 text-white" onClick={() => { plant(selection.doc, selection.quote); setSelection(null); }}>Plant Evidence</Button>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setSelection(null)}><X className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}