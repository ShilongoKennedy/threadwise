import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Plus, RotateCcw, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type { Suite } from "@/lib/threadwise/advanced";
import type { Planning } from "@/lib/threadwise/planning";
import { scheduleEvents } from "@/lib/threadwise/planning";
import type { TEdge, TNode } from "@/lib/threadwise/store";
import {
  DEFAULT_SCENARIO,
  SCENARIO_FIELDS,
  dossier,
  emptyRunway,
  normalizeScenario,
  runScenario,
  runwayAnalysis,
  sensitivity,
  type ScenarioParams,
} from "@/lib/threadwise/strategy";

const INK = "var(--foreground)",
  MUTED = "var(--muted-foreground)",
  ACCENT = "var(--accent-ink)",
  BRASS = "var(--brass)",
  RULE = "var(--border)";
const money = (v: number) =>
  !Number.isFinite(v)
    ? "∞"
    : `${v < 0 ? "−" : ""}€${Math.abs(v) >= 1e6 ? `${(Math.abs(v) / 1e6).toFixed(1)}M` : Math.abs(v) >= 1e4 ? `${Math.round(Math.abs(v) / 1e3)}k` : Math.round(Math.abs(v)).toLocaleString()}`;
const axis = { fontSize: 10, fontFamily: "var(--font-mono)", fill: MUTED } as const;
const tip = {
  contentStyle: { background: "var(--card)", border: `1px solid ${RULE}`, borderRadius: 4, fontSize: 12 },
  labelStyle: { fontFamily: "var(--font-mono)", fontSize: 10, color: MUTED },
};

function Figure({ label, value, note, tone }: { label: string; value: string; note?: string | undefined; tone?: "accent" | "ok" | undefined }) {
  return (
    <div className="tw-figure">
      <span className="tw-kicker">{label}</span>
      <strong className={`font-display text-2xl ${tone === "accent" ? "text-accent-ink" : ""}`}>{value}</strong>
      {note && <span className="text-[11px] text-muted-foreground">{note}</span>}
    </div>
  );
}

/* ---------- 1. Scenario & sensitivity ---------- */
export function ScenarioTool({ suite, update, readOnly }: { suite: Suite; update: (p: Partial<Suite>) => void; readOnly: boolean }) {
  const p = normalizeScenario(suite.scenario);
  const set = (k: keyof ScenarioParams, v: number) => update({ scenario: { ...p, [k]: v } });
  const r = useMemo(() => runScenario(p), [JSON.stringify(p)]);
  const tornado = useMemo(() => sensitivity(p), [JSON.stringify(p)]);
  const be = r.rows.map((m) => ({ month: m.month, cumulative: Math.round(m.cumulative), revenue: Math.round(m.revenue), profit: Math.round(m.profit) }));
  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Move the drivers to see when the plan pays back and which assumption matters most. These are your estimates, not forecasts.
      </p>
      <div className="grid grid-cols-2 gap-px border bg-border sm:grid-cols-4">
        <Figure label="Break-even" value={r.breakEvenMonth ? `Month ${r.breakEvenMonth}` : "Not reached"} tone={r.breakEvenMonth ? undefined : "accent"} />
        <Figure label={`Month ${p.months} result`} value={money(r.final)} tone={r.final < 0 ? "accent" : undefined} />
        <Figure label="Deepest cash need" value={money(r.trough)} />
        <Figure label="Customers to cover fixed" value={Number.isFinite(r.breakEvenCustomers) ? Math.ceil(r.breakEvenCustomers).toLocaleString() : "Never"} note={`${money(r.contribution)} margin each`} />
      </div>
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {SCENARIO_FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-2 flex items-baseline justify-between text-xs">
              <span>{f.label}</span>
              <span className="font-mono text-[11px]">
                {f.unit === "€" ? money(p[f.key]) : `${p[f.key]}${f.unit ? ` ${f.unit}` : ""}`}
              </span>
            </span>
            <Slider
              aria-label={f.label}
              disabled={readOnly}
              min={f.min}
              max={f.max}
              step={f.step}
              value={[p[f.key]]}
              onValueChange={([v]) => v !== undefined && set(f.key, v)}
            />
          </label>
        ))}
      </div>
      <Button variant="ghost" size="sm" disabled={readOnly} onClick={() => update({ scenario: DEFAULT_SCENARIO })}>
        <RotateCcw /> Reset drivers
      </Button>
      <section>
        <h4 className="tw-kicker mb-2">Break-even curve · cumulative cash</h4>
        <div className="h-56">
          <ResponsiveContainer>
            <AreaChart data={be} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid stroke={RULE} vertical={false} />
              <XAxis dataKey="month" tick={axis} tickLine={false} axisLine={{ stroke: RULE }} />
              <YAxis tick={axis} tickFormatter={money} width={56} tickLine={false} axisLine={false} />
              <Tooltip {...tip} formatter={(v: number) => money(v)} labelFormatter={(m) => `Month ${m}`} />
              <ReferenceLine y={0} stroke={INK} />
              {r.breakEvenMonth && <ReferenceLine x={r.breakEvenMonth} stroke={ACCENT} strokeDasharray="4 3" label={{ value: "break-even", fill: ACCENT, fontSize: 10, position: "insideTopRight" }} />}
              <Area type="monotone" dataKey="cumulative" name="Cumulative" stroke={INK} fill={BRASS} fillOpacity={0.18} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section>
        <h4 className="tw-kicker mb-2">Sensitivity · ±20% on each driver</h4>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={tornado} layout="vertical" stackOffset="sign" margin={{ left: 16, right: 12 }}>
              <CartesianGrid stroke={RULE} horizontal={false} />
              <XAxis type="number" tick={axis} tickFormatter={money} tickLine={false} axisLine={{ stroke: RULE }} />
              <YAxis type="category" dataKey="label" tick={axis} width={156} tickLine={false} axisLine={false} />
              <Tooltip {...tip} formatter={(v: number) => money(v)} />
              <ReferenceLine x={0} stroke={INK} />
              <Bar dataKey="low" name="Driver −20%" fill={ACCENT} stackId="s" />
              <Bar dataKey="high" name="Driver +20%" fill={INK} stackId="s" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Most sensitive: <strong>{tornado[0]?.label}</strong>. Test that assumption first.
        </p>
      </section>
    </div>
  );
}

/* ---------- 2. Resource & runway ---------- */
export function RunwayTool({ suite, update, nodes, readOnly }: { suite: Suite; update: (p: Partial<Suite>) => void; nodes: TNode[]; readOnly: boolean }) {
  const plan = suite.runway ?? emptyRunway();
  const save = (patch: Partial<typeof plan>) => update({ runway: { ...plan, ...patch } });
  const r = runwayAnalysis(nodes, plan);
  const work = nodes.filter((n) => ["action", "experiment"].includes(n.data.kind));
  const n = (v: string) => Math.max(0, Number(v) || 0);
  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Tie people and money to the actions and experiments on this canvas. Owners match team names; durations and milestones come from each card.
      </p>
      <div className="grid grid-cols-2 gap-px border bg-border sm:grid-cols-4">
        <Figure label="Runway" value={Number.isFinite(r.runwayMonths) ? `${r.runwayMonths.toFixed(1)} mo` : "Unlimited"} tone={r.runwayMonths < 6 ? "accent" : undefined} note={r.cashOut ? `Cash out ${r.cashOut.toLocaleDateString()}` : undefined} />
        <Figure label="Team burn / mo" value={money(r.burn)} />
        <Figure label="Committed to open work" value={money(r.committed)} />
        <Figure label="Uncommitted capital" value={money(r.free)} tone={r.free < 0 ? "accent" : undefined} />
      </div>
      <label className="block max-w-xs text-xs">
        Available capital (€)
        <Input className="mt-1" type="number" min={0} disabled={readOnly} value={plan.capital || ""} onChange={(e) => save({ capital: n(e.target.value) })} />
      </label>
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="tw-kicker">Team capacity</h4>
          <Button size="sm" variant="outline" disabled={readOnly} onClick={() => save({ team: [...plan.team, { id: crypto.randomUUID(), name: "", monthlyCost: 0, daysPerMonth: 18 }] })}>
            <Plus /> Person
          </Button>
        </div>
        <div className="tw-matrix">
          <div className="tw-matrix-head"><span>Name</span><span>€ / month</span><span>Days / mo</span><span /></div>
          {plan.team.map((m) => (
            <div key={m.id} className="tw-matrix-row">
              <Input aria-label="Team member name" placeholder="Name" disabled={readOnly} value={m.name} onChange={(e) => save({ team: plan.team.map((x) => (x.id === m.id ? { ...x, name: e.target.value.slice(0, 60) } : x)) })} />
              <Input aria-label="Monthly cost" type="number" min={0} disabled={readOnly} value={m.monthlyCost || ""} onChange={(e) => save({ team: plan.team.map((x) => (x.id === m.id ? { ...x, monthlyCost: n(e.target.value) } : x)) })} />
              <Input aria-label="Days per month" type="number" min={0} max={31} disabled={readOnly} value={m.daysPerMonth || ""} onChange={(e) => save({ team: plan.team.map((x) => (x.id === m.id ? { ...x, daysPerMonth: Math.min(31, n(e.target.value)) } : x)) })} />
              <Button size="icon" variant="ghost" aria-label="Remove person" disabled={readOnly} onClick={() => save({ team: plan.team.filter((x) => x.id !== m.id) })}><Trash2 /></Button>
            </div>
          ))}
          {!plan.team.length && <p className="py-3 text-xs text-muted-foreground">Add the people who own work on this canvas.</p>}
        </div>
      </section>
      {r.people.length > 0 && (
        <section>
          <h4 className="tw-kicker mb-2">Allocation over the next {r.horizon.toFixed(1)} months</h4>
          <div className="space-y-3">
            {r.people.map((p) => {
              const pct = Number.isFinite(p.load) ? p.load * 100 : 100;
              return (
                <div key={p.id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{p.name || "Unnamed"} · {p.tasks} open</span>
                    <span className={`font-mono text-[11px] ${p.load > 1 ? "text-accent-ink" : ""}`}>
                      {p.demand}d / {Math.round(p.capacity)}d {p.load > 1 ? "· over capacity" : ""}
                    </span>
                  </div>
                  <div className="tw-load"><span style={{ width: `${Math.min(100, pct)}%` }} data-over={p.load > 1 || undefined} /></div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      <section>
        <h4 className="tw-kicker mb-2">Budget per action</h4>
        <div className="tw-matrix">
          {work.map((w) => (
            <div key={w.id} className="tw-matrix-row tw-matrix-row--budget">
              <span className="min-w-0 break-words text-sm">{w.data.title}<span className="block font-mono text-[10px] text-muted-foreground">{w.data.meta["owner"] || "no owner"} · {w.data.meta["milestone"] || "no milestone"} · {w.data.meta["dueDate"] || "no date"}</span></span>
              <Input aria-label={`Budget for ${w.data.title}`} type="number" min={0} placeholder="€" disabled={readOnly} value={plan.costs[w.id] || ""} onChange={(e) => save({ costs: { ...plan.costs, [w.id]: n(e.target.value) } })} />
            </div>
          ))}
          {!work.length && <p className="py-3 text-xs text-muted-foreground">Add action or experiment cards to allocate budget.</p>}
        </div>
      </section>
      {r.milestones.length > 0 && (
        <section>
          <h4 className="tw-kicker mb-2">Milestone timeline</h4>
          <ol className="tw-milestones">
            {r.milestones.map((m) => (
              <li key={m.name} data-risk={m.atRisk || undefined}>
                <span className="font-mono text-[10px] text-muted-foreground">{m.due || "undated"}</span>
                <strong className="font-display text-base">{m.name}</strong>
                <span className="text-xs text-muted-foreground">{m.done}/{m.total} done · {money(m.cost)}{m.atRisk ? " · due after cash runs out" : ""}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

/* ---------- 3. Executive dossier ---------- */
export function DossierTool({ suite, nodes, edges, planning, digest, title }: { suite: Suite; nodes: TNode[]; edges: TEdge[]; planning?: Planning; digest: string; title: string }) {
  const approved = (planning?.decisions ?? []).filter((d) => d.status === "approved");
  const signed = suite.seals.length > 0 || approved.length > 0;
  const d = dossier(nodes, edges);
  const events = scheduleEvents(nodes, planning?.decisions ?? []);
  if (!signed)
    return (
      <div className="tw-empty-note">
        <ShieldAlert className="h-6 w-6" />
        <p className="font-display text-lg">The dossier opens once a decision is signed.</p>
        <p className="text-sm text-muted-foreground">Sign it in Decision signature, or approve a conclusion in Plan &amp; facilitate.</p>
      </div>
    );
  const dist = (["fact", "evidence", "assumption", "hypothesis", "unknown"] as const).map((k) => ({ name: k, value: d.counts[k] }));
  const exportDossier = () => {
    const rows = suite.seals.map((s) => `<tr><td>${esc(s.signer)}</td><td>${new Date(s.at).toLocaleString()}</td><td>${s.digest === digest ? "Intact" : "Changed since signing"}</td><td><code>${s.digest}</code></td></tr>`).join("");
    const html = `<!doctype html><meta charset="utf-8"><title>${esc(title)} · Dossier</title><style>body{font:15px/1.5 Georgia,serif;max-width:780px;margin:48px auto;color:#222}h1{font-size:34px;margin:0}small,code,th{font:11px ui-monospace,monospace;letter-spacing:.06em}table{width:100%;border-collapse:collapse}td,th{border-top:1px solid #ccc;padding:6px;text-align:left;vertical-align:top}code{word-break:break-all}</style>
<small>POST-DECISION DOSSIER · ${new Date().toLocaleDateString()}</small><h1>${esc(title)}</h1>
<h2>Confidence: ${d.confidence}/100 — ${d.grade}</h2><p>${dist.map((x) => `${x.name}: ${x.value}`).join(" · ")}</p>
<h2>Risk radar</h2><p>${d.radar.map((x) => `${x.axis}: ${x.value}`).join(" · ")}</p>
<h2>Decisions</h2>${approved.map((a) => `<h3>${esc(a.title)}</h3><p>${esc(a.conclusion)}</p><p><em>Trade-offs:</em> ${esc(a.tradeoffs)}</p>`).join("") || "<p>—</p>"}
<h2>Roadmap</h2><table>${events.map((e) => `<tr><td>${e.date}</td><td>${esc(e.title)}</td></tr>`).join("") || "<tr><td>No dated milestones</td></tr>"}</table>
<h2>Sign-off certificate</h2><table><tr><th>Signer</th><th>When</th><th>Integrity</th><th>SHA-256</th></tr>${rows}</table><p><small>Current fingerprint ${digest}. Personal sign-off record; not a legal electronic signature.</small></p>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]+/gi, "-").slice(0, 60) || "decision"}-dossier.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="space-y-7">
      <header className="tw-dossier-head">
        <span className="tw-kicker">Post-decision dossier</span>
        <h4 className="font-display text-3xl leading-tight">{title}</h4>
        <Button size="sm" variant="outline" onClick={exportDossier}><Download /> Export dossier</Button>
      </header>
      <section className="grid gap-6 sm:grid-cols-[180px_minmax(0,1fr)]">
        <div className="tw-score">
          <span className="font-display text-6xl leading-none">{d.confidence}</span>
          <span className="tw-kicker mt-2">Confidence / 100</span>
          <span className="mt-1 text-sm">{d.grade}</span>
        </div>
        <div className="h-44">
          <ResponsiveContainer>
            <BarChart data={dist} margin={{ left: 0, right: 8 }}>
              <CartesianGrid stroke={RULE} vertical={false} />
              <XAxis dataKey="name" tick={axis} tickLine={false} axisLine={{ stroke: RULE }} />
              <YAxis allowDecimals={false} tick={axis} width={28} tickLine={false} axisLine={false} />
              <Tooltip {...tip} />
              <Bar dataKey="value" name="Cards">
                {dist.map((x, i) => <Cell key={x.name} fill={i < 2 ? INK : i < 4 ? BRASS : ACCENT} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <h4 className="tw-kicker mb-1">Risk radar</h4>
          <div className="h-60">
            <ResponsiveContainer>
              <RadarChart data={d.radar} outerRadius="72%">
                <PolarGrid stroke={RULE} />
                <PolarAngleAxis dataKey="axis" tick={axis} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="value" stroke={ACCENT} fill={ACCENT} fillOpacity={0.18} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h4 className="tw-kicker mb-2">Impact audit</h4>
          <dl className="tw-audit-list">
            <div><dt>Execution</dt><dd>{d.done}/{d.work} actions & experiments complete</dd></div>
            <div><dt>Fault lines</dt><dd>{d.faults ? `${d.faults} action${d.faults > 1 ? "s" : ""} still rest on unverified beliefs` : "None detected"}</dd></div>
            <div><dt>Unverified</dt><dd>{d.counts.assumption + d.counts.hypothesis + d.counts.unknown} cards still assumptions, hypotheses or unknowns</dd></div>
            {approved.map((a) => <div key={a.id}><dt>Decision</dt><dd><strong>{a.title}</strong>{a.reviewDate ? ` · review ${a.reviewDate}` : ""}</dd></div>)}
          </dl>
        </div>
      </section>
      <section>
        <h4 className="tw-kicker mb-2">Milestone roadmap</h4>
        {events.length ? (
          <ol className="tw-milestones">
            {events.slice(0, 12).map((e) => (
              <li key={e.id} data-risk={e.date < new Date().toISOString().slice(0, 10) || undefined}>
                <span className="font-mono text-[10px] text-muted-foreground">{e.date}</span>
                <strong className="font-display text-base">{e.title}</strong>
                <span className="text-xs text-muted-foreground">{e.kind}</span>
              </li>
            ))}
          </ol>
        ) : <p className="text-xs text-muted-foreground">Add due dates to actions to build the roadmap.</p>}
      </section>
      <section>
        <h4 className="tw-kicker mb-2">Sign-off certificate</h4>
        {suite.seals.length ? suite.seals.map((s) => {
          const intact = s.digest === digest;
          return (
            <div key={s.id} className="tw-certificate" data-broken={!intact || undefined}>
              {intact ? <ShieldCheck className="h-7 w-7" /> : <ShieldAlert className="h-7 w-7" />}
              <div className="min-w-0">
                <p className="font-display text-xl">{s.signer}</p>
                <p className="text-sm whitespace-pre-wrap break-words">{s.note}</p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-wider">{new Date(s.at).toLocaleString()} · {intact ? "Seal intact — graph unchanged" : "Seal broken — graph edited since signing"}</p>
                <p className="mt-1 break-all font-mono text-[9px] text-muted-foreground">SHA-256 {s.digest}</p>
              </div>
            </div>
          );
        }) : <p className="text-xs text-muted-foreground">Approved by conclusion only; add a signature for a tamper-evident certificate.</p>}
      </section>
    </div>
  );
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
