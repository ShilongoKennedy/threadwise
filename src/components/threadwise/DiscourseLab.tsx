import { useMemo, useState } from "react";
import { BookOpenText, Columns2, Hash, MapPin, Plus, Trash2, X, Globe, Loader2, Search, Check } from "lucide-react";
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
  const [view, setView] = useState<View>("read");
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
    
    // Give visual feedback
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
    <header className="tw-lab-head">
      <div><span className="tw-kicker">The reading room</span><h2>Discourse lab</h2></div>
      <nav>
        {([ ["read", "Read & code", BookOpenText], ["compare", "Compare", Columns2], ["count", "Count", Hash], ["investigate", "Investigate", Globe] ] as const).map(([id, label, Icon]) => 
          <Button key={id} size="sm" variant={view === id ? "secondary" : "ghost"} onClick={() => setView(id)}><Icon className="mr-1 h-4 w-4" />{label}</Button>
        )}
      </nav>
      <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close discourse lab"><X /></Button>
    </header>

    <div className="tw-lab-body">
      <aside className="tw-lab-ledger">
        <div><span className="tw-kicker">Collection · {docs.length}</span></div>
        <div className="tw-lab-add">
          <Input placeholder="Text title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}/>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Speaker" value={draft.speaker} onChange={(e) => setDraft({ ...draft, speaker: e.target.value })}/>
            <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })}/>
          </div>
          <Input placeholder="Audience / occasion" value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value })}/>
          <Textarea rows={5} placeholder="Paste a speech, transcript, or article…" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })}/>
          <Button size="sm" disabled={!draft.title.trim() || !draft.text.trim()} onClick={addDoc}><Plus className="mr-1 h-4 w-4" />Add text</Button>
        </div>
        <ol>
          {docs.map((doc) => 
            <li key={doc.id} data-active={doc.id === active?.id}>
              <button onClick={() => { setActiveId(doc.id); setView("read"); }}>
                <small>{doc.date || "undated"}</small>
                <b>{doc.title}</b>
                <span>{doc.speaker || "Unknown speaker"} · {corpus.annotations.filter((mark) => mark.docId === doc.id).length} marks</span>
              </button>
              <Button size="icon" variant="ghost" onClick={() => save({ docs: corpus.docs.filter((item) => item.id !== doc.id), annotations: corpus.annotations.filter((mark) => mark.docId !== doc.id) })} aria-label={`Remove ${doc.title}`}><Trash2 /></Button>
            </li>
          )}
        </ol>
      </aside>

      <main className="tw-lab-main">
        {/* EXISTING VIEWS */}
        {view === "read" && active && <div className="tw-lab-read"><article className="tw-lab-doc"><p className="tw-kicker">{active.speaker || "Unknown speaker"} · {active.date || "undated"}</p><h3>{active.title}</h3><p className="tw-lab-audience">{active.audience && `Addressed to: ${active.audience}`}</p><div className="tw-lab-text" onMouseUp={() => selectQuote(active)}>{active.text}</div></article><aside className="tw-lab-margin"><p className="tw-kicker">Margin</p><p>Select a passage to code it. Coded quotes become evidence you can place on the canvas.</p>{corpus.annotations.filter((mark) => mark.docId === active.id).map((mark) => <div className="tw-lab-note" key={mark.id} data-code={mark.code}><small>{codeLabel(mark.code)}</small><blockquote>“{clip(mark.quote, 150)}”</blockquote><Button size="sm" variant="ghost" onClick={() => plant(active, mark.quote, codeLabel(mark.code))}><MapPin className="mr-1 h-4 w-4" />Place</Button></div>)}</aside></div>}
        
        {view === "compare" && <div className="tw-lab-compare"><p className="tw-kicker">Compare two texts</p><div className="tw-lab-compare-pick">{[0, 1].map((index) => <select key={index} value={compareIds[index]} onChange={(e) => setCompareIds((value) => index === 0 ? [e.target.value, value[1]] : [value[0], e.target.value])}>{docs.map((doc) => <option key={doc.id} value={doc.id}>{doc.date} · {doc.title}</option>)}</select>)}</div><div className="tw-lab-split">{compared.map((doc) => <article className="tw-lab-doc" key={doc.id}><p className="tw-kicker">{doc.speaker} · {doc.date}</p><h3>{doc.title}</h3><div className="tw-lab-text" onMouseUp={() => selectQuote(doc)}>{doc.text}</div></article>)}</div></div>}
        
        {view === "count" && <div className="tw-lab-count"><h3>Language trajectory</h3><p>Track a phrase across texts. Rates are per 1,000 words, so texts of different lengths remain comparable.</p><form onSubmit={(e) => { e.preventDefault(); const value = term.trim().toLowerCase(); if (value && !terms.includes(value) && terms.length < 6) save({ terms: [...terms, value] }); setTerm(""); }}><Input value={term} placeholder="Track a word or phrase" onChange={(e) => setTerm(e.target.value)}/><Button>Track</Button></form><div className="tw-lab-terms">{terms.map((item) => <button key={item} onClick={() => save({ terms: terms.filter((phrase) => phrase !== item) })}>{item} ×</button>)}</div><div className="tw-lab-table">{termCounts.map(({ doc, values }) => <div key={doc.id}><b>{doc.date || "—"} · {doc.title}</b>{values.map((value) => <span key={value.phrase}>{value.phrase}: <strong>{value.rate}</strong> / 1k</span>)}</div>)}</div><section><h3>Most used words</h3>{docs.map((doc) => <div className="tw-lab-terms-list" key={doc.id}><b>{doc.title}</b>{topTerms(doc.text, 9).map(([word, count]) => <button key={word} onClick={() => setTerm(word)}>{word} <small>{count}</small></button>)}</div>)}</section></div>}

        {/* NEW INVESTIGATE VIEW (THE DOSSIER) */}
        {view === "investigate" && (
          <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto bg-background/50 border-l">
            <div className="mb-8 border-b pb-6">
              <h3 className="font-display text-3xl mb-2 flex items-center gap-2"><Globe className="text-primary"/> Intelligence Dossier</h3>
              <p className="text-muted-foreground text-sm max-w-2xl">Cross-reference multiple sources to reveal hidden connections, strategic motives, and unanswered questions. The AI acts as your intelligence analyst.</p>
            </div>

            <div className="space-y-3 mb-8 bg-muted/20 p-6 rounded-xl border">
              <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">Source Ingestion</h4>
              {urls.map((url, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs font-mono text-muted-foreground w-6">0{i+1}</span>
                  <Input 
                    value={url} 
                    placeholder="https://..." 
                    className="bg-background"
                    onChange={(e) => {
                      const newUrls = [...urls];
                      newUrls[i] = e.target.value;
                      setUrls(newUrls);
                    }} 
                  />
                  {urls.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => setUrls(urls.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex gap-4 pt-2">
                <Button variant="outline" size="sm" onClick={() => setUrls([...urls, ""])}>
                  <Plus className="mr-2 h-4 w-4" /> Add source
                </Button>
                <Button onClick={runInvestigation} disabled={isAnalyzing || urls.every(u => u.trim() === "")} className="flex-1 max-w-xs">
                  {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Search className="mr-2 h-4 w-4" /> Run Investigation</>}
                </Button>
              </div>
              {analysisError && <p className="text-destructive text-sm mt-2">{analysisError}</p>}
            </div>

            {analysis && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Executive Summary */}
                <section className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-xl">
                  <h4 className="font-mono text-xs uppercase tracking-widest text-primary mb-3">The Big Picture (Executive Summary)</h4>
                  <p className="font-display text-lg leading-relaxed text-foreground/90">{analysis.conclusion}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-primary/10">
                    <span className="text-xs font-mono text-muted-foreground py-1 mr-2">Key Actors:</span>
                    {analysis.entities?.map((entity: string, i: number) => (
                      <span key={i} className="px-2.5 py-0.5 bg-background border rounded text-xs font-medium">{entity}</span>
                    ))}
                  </div>
                </section>

                {/* Evidence Trail */}
                <section>
                  <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Documented Evidence</h4>
                  <div className="space-y-3">
                    {analysis.evidence?.map((item: any, i: number) => (
                      <div key={i} className="group flex gap-4 p-4 bg-background border rounded-lg hover:border-emerald-600/50 transition-colors">
                        <div className="flex-1">
                          <b className="block mb-1 text-sm">{item.title}</b>
                          <p className="text-muted-foreground text-sm leading-relaxed mb-2">{item.body}</p>
                          <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{item.source}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant={plantedIds[`ev-${i}`] ? "secondary" : "outline"}
                          className={`self-start ${plantedIds[`ev-${i}`] ? "text-emerald-600" : ""}`}
                          onClick={() => plantAnalysis(`ev-${i}`, "evidence", item.title, item.body, item.source)}
                        >
                          {plantedIds[`ev-${i}`] ? <><Check className="mr-1 h-3 w-3" /> Planted</> : <><MapPin className="mr-1 h-3 w-3" /> Plant</>}
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Hypotheses */}
                <section>
                  <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2"><Search className="h-4 w-4 text-purple-600" /> Strategic Motives & Hypotheses</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.hypotheses?.map((item: any, i: number) => (
                      <div key={i} className="flex flex-col p-5 bg-purple-50/50 border border-purple-100 rounded-lg">
                        <b className="block mb-2 text-sm text-purple-900">{item.title}</b>
                        <p className="text-sm text-purple-800/80 leading-relaxed mb-4 flex-1">{item.body}</p>
                        <Button 
                          size="sm" 
                          variant={plantedIds[`hyp-${i}`] ? "secondary" : "outline"}
                          className={`self-start ${plantedIds[`hyp-${i}`] ? "text-purple-600" : ""}`}
                          onClick={() => plantAnalysis(`hyp-${i}`, "hypothesis", item.title, item.body)}
                        >
                          {plantedIds[`hyp-${i}`] ? <><Check className="mr-1 h-3 w-3" /> Planted</> : <><MapPin className="mr-1 h-3 w-3" /> Plant</>}
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Questions */}
                <section>
                  <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2"><Search className="h-4 w-4 text-orange-600" /> The Blind Spots (Unanswered Questions)</h4>
                  <div className="space-y-3">
                    {analysis.questions?.map((item: any, i: number) => (
                      <div key={i} className="flex gap-4 p-4 bg-orange-50/50 border border-orange-100 rounded-lg">
                        <div className="flex-1">
                          <b className="block mb-1 text-sm text-orange-900">{item.title}</b>
                          <p className="text-sm text-orange-800/80 leading-relaxed">{item.body}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant={plantedIds[`q-${i}`] ? "secondary" : "outline"}
                          className={`self-start ${plantedIds[`q-${i}`] ? "text-orange-600" : ""}`}
                          onClick={() => plantAnalysis(`q-${i}`, "question", item.title, item.body)}
                        >
                          {plantedIds[`q-${i}`] ? <><Check className="mr-1 h-3 w-3" /> Planted</> : <><MapPin className="mr-1 h-3 w-3" /> Plant</>}
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>

              </div>
            )}
          </div>
        )}

      </main>
    </div>
    {selection && <div className="tw-lab-coder" role="toolbar">{CODES.map((code) => <button key={code.id} onClick={() => mark(code.id)}>{code.label}</button>)}<button onClick={() => { plant(selection.doc, selection.quote); setSelection(null); }}>Place evidence</button></div>}
  </div>;
}