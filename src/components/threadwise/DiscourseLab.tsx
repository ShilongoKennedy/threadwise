import { useMemo, useState } from "react";
import { BookOpenText, Columns2, Hash, MapPin, Plus, Trash2, X, Globe, Loader2, Search, Check, Sparkles, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useThread } from "@/lib/threadwise/store";
import { streamTask } from "@/lib/threadwise/ai-client";
import { CODES, clip, countPhrase, emptyCorpus, topTerms, words, type CodeId, type Corpus, type DiscourseDoc } from "@/lib/threadwise/discourse";
import { toast } from "sonner";

type View = "read" | "compare" | "count" | "investigate";
const uid = () => crypto.randomUUID();
const codeLabel = (code: CodeId) => CODES.find((item) => item.id === code)?.label ?? code;

export function DiscourseLab({ corpus: stored, update, onClose }: { corpus?: Corpus; update: (corpus: Corpus) => void; onClose: () => void }) {
  const corpus = stored ?? emptyCorpus();
  const s = useThread();
  const [view, setView] = useState<View>("investigate"); // Default to the main attraction
  const [activeId, setActiveId] = useState(corpus.docs[0]?.id ?? "");
  const [compareIds, setCompareIds] = useState<[string, string]>([corpus.docs[0]?.id ?? "", corpus.docs[1]?.id ?? ""]);
  const [draft, setDraft] = useState({ title: "", speaker: "", date: "", occasion: "", audience: "", text: "" });
  const [term, setTerm] = useState("");
  const [selection, setSelection] = useState<{ quote: string; doc: DiscourseDoc } | null>(null);
  
  // Cross-Source state
  const [urls, setUrls] = useState<string[]>([""]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  
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

  const addDoc = () => { if (!draft.title.trim() || !draft.text.trim()) return; const doc = { id: uid(), ...draft, title: draft.title.trim(), text: draft.text.trim() }; save({ docs: [...corpus.docs, doc] }); setActiveId(doc.id); setDraft({ title: "", speaker: "", date: "", occasion: "", audience: "", text: "" }); };
  const mark = (code: CodeId) => { if (!selection) return; const at = selection.doc.text.indexOf(selection.quote); if (at < 0) return; if (!corpus.annotations.some((mark) => mark.docId === selection.doc.id && mark.start === at)) save({ annotations: [...corpus.annotations, { id: uid(), docId: selection.doc.id, start: at, end: at + selection.quote.length, quote: selection.quote, code, note: "" }] }); setSelection(null); window.getSelection()?.removeAllRanges(); };
  const selectQuote = (doc: DiscourseDoc) => { const quote = window.getSelection()?.toString().trim() ?? ""; if (quote.length > 3) setSelection({ quote, doc }); };
  const compared = compareIds.map((id) => docs.find((doc) => doc.id === id)).filter(Boolean) as DiscourseDoc[];
  const terms = corpus.terms;
  const termCounts = useMemo(() => docs.map((doc) => ({ doc, values: terms.map((phrase) => ({ phrase, n: countPhrase(doc.text, phrase), rate: words(doc.text).length ? Math.round(countPhrase(doc.text, phrase) / words(doc.text).length * 10000) / 10 : 0 })) })), [docs, terms]);

  const runInvestigation = async () => {
    const validUrls = urls.filter(u => u.trim().length > 5);
    if (validUrls.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisError("");
    setAnalysis(null);
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
        setAnalysis(res.analysis);
      }
    } catch (e: any) {
      setAnalysisError(e.message || "The investigation failed. Check the links and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return <div className="tw-lab" role="dialog" aria-modal="true" aria-label="Discourse lab">
    <header className="tw-lab-head bg-[#FDFBF7]/90 backdrop-blur-md">
      <div>
        <span className="tw-kicker text-[#C24A35]">The Reading Room</span>
        <h2 className="font-display text-3xl text-[#1A1A1A]">Discourse Lab</h2>
      </div>
      <nav className="bg-black/5 p-1 rounded-xl">
        {([ ["investigate", "Investigate", Globe], ["read", "Read & code", BookOpenText], ["compare", "Compare", Columns2], ["count", "Count", Hash] ] as const).map(([id, label, Icon]) => 
          <Button key={id} size="sm" variant={view === id ? "secondary" : "ghost"} onClick={() => setView(id)} className={`rounded-lg transition-all ${view === id ? "bg-white shadow-sm text-[#1A1A1A]" : "text-muted-foreground hover:text-[#1A1A1A]"}`}>
            <Icon className="mr-2 h-4 w-4" />{label}
          </Button>
        )}
      </nav>
      <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close discourse lab" className="rounded-full hover:bg-black/5"><X /></Button>
    </header>

    <div className="tw-lab-body bg-[#FDFBF7]">
      <aside className="tw-lab-ledger bg-white/50 border-r border-black/5">
        <div><span className="tw-kicker">Collection · {docs.length}</span></div>
        <div className="tw-lab-add bg-white rounded-xl p-4 shadow-sm border border-black/5">
          <Input placeholder="Document title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="mb-2 bg-transparent border-black/10"/>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input placeholder="Speaker" value={draft.speaker} onChange={(e) => setDraft({ ...draft, speaker: e.target.value })} className="bg-transparent border-black/10"/>
            <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="bg-transparent border-black/10"/>
          </div>
          <Input placeholder="Audience / occasion" value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value })} className="mb-2 bg-transparent border-black/10"/>
          <Textarea rows={3} placeholder="Paste text here…" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} className="mb-2 bg-transparent border-black/10 text-xs"/>
          <Button size="sm" className="w-full bg-[#1A1A1A] text-white" disabled={!draft.title.trim() || !draft.text.trim()} onClick={addDoc}><Plus className="mr-2 h-4 w-4" />Add to collection</Button>
        </div>
        <ol className="mt-4 space-y-1">
          {docs.map((doc) => 
            <li key={doc.id} data-active={doc.id === active?.id} className={`group rounded-lg transition-colors ${doc.id === active?.id ? "bg-[#CBE6F9]/30 border border-[#CBE6F9]" : "hover:bg-black/5 border border-transparent"}`}>
              <button className="w-full text-left p-3" onClick={() => { setActiveId(doc.id); setView("read"); }}>
                <small className="font-mono text-[10px] text-muted-foreground block mb-1">{doc.date || "undated"}</small>
                <b className="font-display text-sm block truncate">{doc.title}</b>
                <span className="text-[10px] text-muted-foreground mt-1 block">{doc.speaker || "Unknown speaker"} · {corpus.annotations.filter((mark) => mark.docId === doc.id).length} marks</span>
              </button>
              <Button size="icon" variant="ghost" className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 h-6 w-6" onClick={() => save({ docs: corpus.docs.filter((item) => item.id !== doc.id), annotations: corpus.annotations.filter((mark) => mark.docId !== doc.id) })} aria-label={`Remove ${doc.title}`}><Trash2 className="h-3 w-3" /></Button>
            </li>
          )}
        </ol>
      </aside>

      <main className="tw-lab-main bg-[#FDFBF7]">
        
        {/* INVESTIGATE VIEW (The Main Attraction) */}
        {view === "investigate" && (
          <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto">
            <div className="mb-10 text-center">
              <h3 className="font-display text-4xl mb-3 text-[#1A1A1A]">Intelligence Dossier</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">Paste multiple news articles, speeches, or transcripts. The AI will cross-reference them to reveal hidden connections, strategic motives, and unanswered questions.</p>
            </div>

            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-black/5 p-6 mb-12">
              <div className="space-y-3 mb-6">
                {urls.map((url, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="text-xs font-mono text-muted-foreground w-6">0{i+1}</span>
                    <Input 
                      value={url} 
                      placeholder="https://..." 
                      className="bg-[#FDFBF7] border-black/10 focus-visible:ring-[#C24A35]"
                      onChange={(e) => {
                        const newUrls = [...urls];
                        newUrls[i] = e.target.value;
                        setUrls(newUrls);
                      }} 
                    />
                    {urls.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => setUrls(urls.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-4 pt-4 border-t border-black/5">
                <Button variant="outline" size="sm" onClick={() => setUrls([...urls, ""])} className="border-black/10">
                  <Plus className="mr-2 h-4 w-4" /> Add Source
                </Button>
                <Button onClick={runInvestigation} disabled={isAnalyzing || urls.every(u => u.trim() === "")} className="flex-1 bg-[#1A1A1A] text-white hover:bg-[#333]">
                  {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing Sources...</> : <><Sparkles className="mr-2 h-4 w-4" /> Run Investigation</>}
                </Button>
              </div>
              {analysisError && <p className="text-red-600 text-sm mt-4 p-3 bg-red-50 rounded-lg">{analysisError}</p>}
            </div>

            {isAnalyzing && (
              <div className="max-w-3xl mx-auto text-center py-12">
                <div className="inline-block relative">
                  <div className="w-24 h-24 border-4 border-[#CBE6F9] border-t-[#C24A35] rounded-full animate-spin mb-6"></div>
                  <Search className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#C24A35] w-8 h-8" />
                </div>
                <h4 className="font-display text-2xl mb-2">Reading the evidence...</h4>
                <p className="text-sm text-muted-foreground animate-pulse">Cross-referencing entities, extracting motives, and identifying contradictions.</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                
                {/* Executive Summary */}
                <section className="bg-[#1A1A1A] text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-[#C24A35] rounded-full blur-[100px] opacity-20 pointer-events-none" />
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-6 h-6 text-[#C24A35]" />
                    <h4 className="font-mono text-xs uppercase tracking-widest text-[#C24A35]">The Big Picture</h4>
                  </div>
                  <p className="font-display text-2xl leading-relaxed text-white/90">{analysis.conclusion}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/10">
                    <span className="text-xs font-mono text-white/40 py-1 mr-2">KEY ACTORS:</span>
                    {analysis.entities?.map((entity: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium border border-white/10">{entity}</span>
                    ))}
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Evidence Trail */}
                  <section>
                    <h4 className="font-mono text-xs uppercase tracking-widest text-[#2D6A65] mb-4 flex items-center gap-2"><Check className="h-4 w-4" /> Documented Evidence</h4>
                    <div className="space-y-4">
                      {analysis.evidence?.map((item: any, i: number) => (
                        <div key={i} className="group flex flex-col p-5 bg-white border border-[#2D6A65]/20 rounded-xl hover:border-[#2D6A65] transition-colors shadow-sm">
                          <b className="block mb-2 text-[#1A1A1A]">{item.title}</b>
                          <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-1">{item.body}</p>
                          <div className="flex justify-between items-center mt-auto pt-3 border-t border-black/5">
                            <span className="text-[10px] font-mono text-[#2D6A65] bg-[#2D6A65]/10 px-2 py-1 rounded">{item.source}</span>
                            <Button 
                              size="sm" 
                              variant={plantedIds[`ev-${i}`] ? "secondary" : "outline"}
                              className={`h-8 ${plantedIds[`ev-${i}`] ? "text-[#2D6A65] bg-[#2D6A65]/10" : ""}`}
                              onClick={() => plantAnalysis(`ev-${i}`, "evidence", item.title, item.body, item.source)}
                            >
                              {plantedIds[`ev-${i}`] ? <><Check className="mr-1 h-3 w-3" /> Planted</> : <><MapPin className="mr-1 h-3 w-3" /> Plant on Canvas</>}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Hypotheses */}
                  <section>
                    <h4 className="font-mono text-xs uppercase tracking-widest text-[#6B4C7A] mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4" /> Strategic Hypotheses</h4>
                    <div className="space-y-4">
                      {analysis.hypotheses?.map((item: any, i: number) => (
                        <div key={i} className="flex flex-col p-5 bg-[#F8F4FA] border border-[#6B4C7A]/20 rounded-xl hover:border-[#6B4C7A] transition-colors shadow-sm">
                          <b className="block mb-2 text-[#6B4C7A]">{item.title}</b>
                          <p className="text-sm text-[#1A1A1A]/70 leading-relaxed mb-4 flex-1">{item.body}</p>
                          <div className="flex justify-end mt-auto pt-3 border-t border-[#6B4C7A]/10">
                            <Button 
                              size="sm" 
                              variant={plantedIds[`hyp-${i}`] ? "secondary" : "outline"}
                              className={`h-8 ${plantedIds[`hyp-${i}`] ? "text-[#6B4C7A] bg-[#6B4C7A]/10" : "text-[#6B4C7A] border-[#6B4C7A]/30 hover:bg-[#6B4C7A]/10"}`}
                              onClick={() => plantAnalysis(`hyp-${i}`, "hypothesis", item.title, item.body)}
                            >
                              {plantedIds[`hyp-${i}`] ? <><Check className="mr-1 h-3 w-3" /> Planted</> : <><MapPin className="mr-1 h-3 w-3" /> Plant on Canvas</>}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Questions */}
                <section>
                  <h4 className="font-mono text-xs uppercase tracking-widest text-[#C24A35] mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> The Blind Spots</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.questions?.map((item: any, i: number) => (
                      <div key={i} className="flex flex-col p-5 bg-[#FDF6F4] border border-[#C24A35]/20 rounded-xl hover:border-[#C24A35] transition-colors shadow-sm">
                        <b className="block mb-2 text-[#C24A35]">{item.title}</b>
                        <p className="text-sm text-[#1A1A1A]/70 leading-relaxed mb-4 flex-1">{item.body}</p>
                        <div className="flex justify-end mt-auto pt-3 border-t border-[#C24A35]/10">
                          <Button 
                            size="sm" 
                            variant={plantedIds[`q-${i}`] ? "secondary" : "outline"}
                            className={`h-8 ${plantedIds[`q-${i}`] ? "text-[#C24A35] bg-[#C24A35]/10" : "text-[#C24A35] border-[#C24A35]/30 hover:bg-[#C24A35]/10"}`}
                            onClick={() => plantAnalysis(`q-${i}`, "question", item.title, item.body)}
                          >
                            {plantedIds[`q-${i}`] ? <><Check className="mr-1 h-3 w-3" /> Planted</> : <><MapPin className="mr-1 h-3 w-3" /> Plant on Canvas</>}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

              </div>
            )}
          </div>
        )}

        {/* READ & CODE VIEW */}
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
        
        {/* COMPARE VIEW */}
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
        
        {/* COUNT VIEW */}
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