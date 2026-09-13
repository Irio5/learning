/* ============================================================================
   Capitoli «backend avanzato»: VM, Kubernetes, Terraform, ambienti, feature flag
   (Infrastruttura) · Kafka, outbox/CDC, Temporal (System Design) · data
   modelling avanzato (SQL & Database) · OAuth flussi & scope (Auth & sicurezza)
   · una sfida per gruppo. Bilingue IT/EN via T() da i18n.js.

   Non è una sezione: i capitoli finiscono in sezioni esistenti. Lesson.jsx
   importa BK_MOD e piazza ogni voce nel punto giusto di MODULES; quiz,
   glossario e flashcard arrivano da BK_QUIZZES() / BK_GLOSSARY / BK_FLASHCARDS.

   ponytail: i primitivi UI sono duplicati da Lesson.jsx invece di importati —
   niente import circolare, file cancellabile in un colpo. Se servono in un
   terzo file, estrarli in src/ui.jsx.
   ========================================================================== */
import React, { useState, useEffect, useMemo } from "react";
import {
  Server, Boxes, FileCode2, Layers3, ToggleRight, Trophy, Rows4, Inbox, History,
  TableProperties, CalendarRange, Route, CheckCircle2, RotateCcw, Lightbulb,
  HelpCircle, Zap, PenLine, Shuffle, Table2, Wrench, CheckSquare, Square,
  AlertTriangle, Play, Plus, Minus, Power, Send, KeyRound,
} from "lucide-react";
import {
  partitionFor, assignPartitions, plan, planSummary, bucket, evaluate, reconcile,
  inconsistencies, scdRows, salesByCity, fold, runWorkflow,
} from "./backend-avanzato-core.js";
import { T, memoByLang } from "./i18n.js";

/* I simulatori tengono in stato testo già tradotto (log, righe calcolate):
   <Sim key={langKey()} /> li rimonta puliti quando cambia la lingua. */
const langKey = () => T("it", "en");

/* ---------------- primitivi (copia da Lesson.jsx, vedi nota sopra) --------- */

const TONE = {
  zinc: { pill: "bg-zinc-800 text-zinc-300 border-zinc-700", border: "border-zinc-800", text: "text-zinc-300" },
  indigo: { pill: "bg-indigo-950 text-indigo-300 border-indigo-800", border: "border-indigo-900", text: "text-indigo-300" },
  emerald: { pill: "bg-emerald-950 text-emerald-300 border-emerald-800", border: "border-emerald-900", text: "text-emerald-300" },
  blue: { pill: "bg-blue-950 text-blue-300 border-blue-800", border: "border-blue-900", text: "text-blue-300" },
  amber: { pill: "bg-amber-950 text-amber-300 border-amber-800", border: "border-amber-900", text: "text-amber-300" },
  red: { pill: "bg-red-950 text-red-300 border-red-800", border: "border-red-900", text: "text-red-300" },
};

function Pill({ children, tone = "zinc" }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-mono ${TONE[tone].pill}`}>{children}</span>;
}

function Card({ children, className = "", tone }) {
  const b = tone ? TONE[tone].border : "border-zinc-800";
  return <div className={`bg-zinc-900 border ${b} rounded-xl p-4 shadow-soft ${className}`}>{children}</div>;
}

function Lead({ children }) {
  return <p className="text-zinc-300 leading-relaxed text-[15px]">{children}</p>;
}

function Note({ children, icon: Icon = Zap, tone = "indigo" }) {
  const colors = {
    indigo: "border-indigo-800 bg-indigo-950 text-indigo-200",
    amber: "border-amber-800 bg-amber-950 text-amber-200",
    emerald: "border-emerald-800 bg-emerald-950 text-emerald-200",
    red: "border-red-800 bg-red-950 text-red-200",
  };
  return (
    <div className={`flex gap-2 rounded-lg border px-3 py-2 text-sm ${colors[tone]}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

function Takeaway({ children }) {
  return (
    <div className="mt-7 rounded-xl border border-indigo-900 bg-zinc-900 p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Lightbulb size={15} className="text-indigo-400" />
        <span className="text-xs uppercase tracking-wide text-indigo-400 font-mono">{T("Da ricordare", "Worth remembering")}</span>
      </div>
      <div className="text-sm text-zinc-300 leading-relaxed">{children}</div>
    </div>
  );
}

function Analogy({ children }) {
  return (
    <div className="flex gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm">
      <Lightbulb size={15} className="text-amber-400 mt-0.5 shrink-0" />
      <div className="leading-relaxed text-zinc-300">
        <span className="text-[11px] uppercase tracking-wide text-amber-400 font-mono mr-2">{T("Analogia", "Analogy")}</span>
        {children}
      </div>
    </div>
  );
}

function Predict({ question, options, answer, explain }) {
  const [pick, setPick] = useState(null);
  return (
    <div className="rounded-xl border border-indigo-900 bg-zinc-900 p-4">
      <div className="flex items-center gap-2 mb-2">
        <HelpCircle size={15} className="text-indigo-400" />
        <span className="text-xs uppercase tracking-wide text-indigo-400 font-mono">{T("Prevedi, poi prova", "Predict, then check")}</span>
      </div>
      <div className="text-sm text-zinc-200 mb-3 leading-relaxed">{question}</div>
      <div className="grid gap-1.5">
        {options.map((o, i) => {
          const chosen = pick === i, show = pick !== null, right = i === answer;
          const cls = show && right ? "border-emerald-700 bg-emerald-950 text-emerald-200"
            : show && chosen && !right ? "border-red-800 bg-red-950 text-red-200"
            : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-600";
          return <button key={i} disabled={pick !== null} onClick={() => setPick(i)}
            className={`text-left text-sm rounded-lg border px-3 py-2 transition-colors disabled:cursor-default ${cls}`}>{o}</button>;
        })}
      </div>
      {pick !== null && (
        <div className="mt-3 text-xs leading-relaxed text-zinc-300">
          {pick === answer ? <span className="text-emerald-300 font-medium">{T("Esatto. ", "Correct. ")}</span> : <span className="text-amber-300 font-medium">{T("Intuizione comune, ma no. ", "Common intuition, but no. ")}</span>}
          {explain} <span className="text-indigo-300">{T("Ora provalo qui sotto.", "Now try it below.")}</span>
        </div>
      )}
    </div>
  );
}

function Btn({ children, active, onClick, tone = "default", disabled }) {
  const base = "px-3 py-2 rounded-md text-sm font-medium transition-all border disabled:opacity-40";
  const styles = active
    ? "bg-indigo-600 border-indigo-500 text-white"
    : tone === "ghost"
    ? "bg-transparent border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600"
    : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white";
  return <button onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>{children}</button>;
}

function Code({ children }) {
  return <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-[12.5px] text-zinc-300 whitespace-pre-wrap overflow-x-auto">{children}</pre>;
}

function Label({ children }) {
  return <div className="text-xs text-zinc-500 font-mono mb-2">{children}</div>;
}

const store = {
  get(k, fb) { try { const v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); } catch { return fb; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage bloccato */ } },
};

function Griglia({ intestazioni, righe }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-zinc-950">
            {intestazioni.map((h, i) => (
              <th key={i} className="text-left font-mono text-[11px] uppercase tracking-wider text-zinc-500 px-3 py-2 border-b border-zinc-800">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {righe.map((r, i) => (
            <tr key={i} className="border-b border-zinc-800/60 last:border-0 align-top">
              {r.map((c, j) => (
                <td key={j} className={`px-3 py-1.5 leading-relaxed ${j === 0 ? "text-zinc-400 font-mono text-[12px]" : "text-zinc-300"}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- drill: guscio comune + tre tipi guidati dai dati -------- */

function useSolved(id, tot) {
  const [done, setDone] = useState(() => new Set(store.get(`bk:${id}`, [])));
  const mark = (i) => setDone((s) => {
    if (s.has(i)) return s;
    const n = new Set(s).add(i);
    store.set(`bk:${id}`, [...n]);
    return n;
  });
  const reset = () => { setDone(new Set()); store.set(`bk:${id}`, []); };
  return [done, mark, reset];
}

function DrillShell({ titolo, icon: Icon = PenLine, intro, fatti, tot, onReset, children }) {
  const finito = fatti === tot && tot > 0;
  return (
    <Card tone={finito ? "emerald" : undefined} className="mt-4">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {finito ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> : <Icon size={16} className="text-indigo-400 shrink-0" />}
        <span className="text-[15px] text-zinc-100 font-medium">{titolo}</span>
        <span className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[11px] text-zinc-500">{fatti}/{tot}</span>
          <button onClick={onReset} title={T("ricomincia", "start over")} className="text-zinc-600 hover:text-zinc-300 transition-colors">
            <RotateCcw size={13} />
          </button>
        </span>
      </div>
      {intro && <p className="text-[13px] text-zinc-400 leading-relaxed mb-3">{intro}</p>}
      {children}
    </Card>
  );
}

/* ScegliForma — items: { pre, opts:[...], ok, post, perche } */
function ScegliForma({ id, titolo, intro, items }) {
  const [done, mark, reset] = useSolved(id, items.length);
  const [pick, setPick] = useState({});
  return (
    <DrillShell titolo={titolo} intro={intro} fatti={done.size} tot={items.length} onReset={() => { reset(); setPick({}); }}>
      <div className="space-y-3">
        {items.map((it, i) => {
          // un'opzione scelta nell'altra lingua non è tra le opts: conta come non scelta
          const p = it.opts.includes(pick[i]) ? pick[i] : undefined;
          const scelto = p ?? (done.has(i) ? it.ok : undefined);
          const giusto = scelto === it.ok;
          return (
            <div key={i} className={`rounded-lg border px-3 py-2.5 transition-colors ${giusto ? "border-emerald-900 bg-emerald-950/30" : scelto ? "border-red-900 bg-red-950/20" : "border-zinc-800 bg-zinc-950"}`}>
              <div className="flex items-center gap-1.5 flex-wrap text-[14px] text-zinc-200 leading-relaxed">
                <span>{it.pre}</span>
                {it.opts.map((o) => {
                  const sel = scelto === o;
                  const cls = sel && giusto ? "border-emerald-600 bg-emerald-900 text-emerald-100"
                    : sel ? "border-red-700 bg-red-950 text-red-200"
                    : giusto ? "border-zinc-800 bg-zinc-900 text-zinc-600"
                    : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-indigo-600 hover:text-white";
                  return (
                    <button key={o} disabled={giusto}
                      onClick={() => { setPick((q) => ({ ...q, [i]: o })); if (o === it.ok) mark(i); }}
                      className={`px-2 py-0.5 rounded-md border font-mono text-[13px] transition-colors disabled:cursor-default ${cls}`}>
                      {o}
                    </button>
                  );
                })}
                {it.post && <span>{it.post}</span>}
              </div>
              {scelto && (
                <div className={`mt-2 text-[12.5px] leading-relaxed ${giusto ? "text-emerald-300" : "text-amber-300"}`}>
                  {giusto ? "" : <span className="font-medium">{T("Non ancora. ", "Not yet. ")}</span>}{it.perche}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DrillShell>
  );
}

function mescola(a) {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; }
  return c;
}

/* Riordina — items: { it, seq:[passi nell'ordine giusto], perche } */
function RiordinaRiga({ it, risolto, onOk }) {
  const [pool, setPool] = useState(() => mescola(it.seq.map((c, i) => ({ c, i }))));
  const [riga, setRiga] = useState([]);
  const [sol, setSol] = useState(false);
  const completo = riga.length === it.seq.length;
  const giusto = completo && riga.every((x, k) => x.i === k);
  useEffect(() => { if (giusto) onOk(); }, [giusto]); // eslint-disable-line react-hooks/exhaustive-deps
  const ok = giusto || risolto;
  const mostrati = ok && !giusto ? it.seq.map((c, i) => ({ c, i })) : riga;
  // ordine sbagliato: rosso solo sui passi fuori posto (x.i è la posizione giusta)
  const sbagliato = completo && !giusto;
  const fuori = sbagliato ? riga.filter((x, k) => x.i !== k).length : 0;
  function pulisci() { setPool(mescola(it.seq.map((c, i) => ({ c, i })))); setRiga([]); setSol(false); }
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${ok ? "border-emerald-900 bg-emerald-950/30" : "border-zinc-800 bg-zinc-950"}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[12.5px] text-zinc-400">{it.it}</span>
        {!ok && <button onClick={() => setSol((s) => !s)} className="ml-auto text-[11px] text-zinc-500 hover:text-zinc-200 underline underline-offset-2">{sol ? T("nascondi soluzione", "hide solution") : T("mostra soluzione", "show solution")}</button>}
        <button onClick={pulisci} className={`${ok ? "ml-auto " : ""}text-zinc-600 hover:text-zinc-300`} title={T("svuota", "clear")}><RotateCcw size={12} /></button>
      </div>
      <div className={`min-h-[38px] rounded-md border border-dashed px-2 py-1.5 flex items-center gap-1.5 flex-wrap mb-2 ${ok ? "border-emerald-800" : "border-zinc-700"}`}>
        {mostrati.length === 0 && <span className="text-[12px] text-zinc-600">{T("clicca i passi nell'ordine giusto…", "click the steps in the right order…")}</span>}
        {mostrati.map((x, k) => (
          <button key={x.i} onClick={() => !ok && (setRiga((r) => r.filter((y) => y.i !== x.i)), setPool((p) => [...p, x]))}
            className={`px-2 py-0.5 rounded-md border text-[13px] ${ok ? "border-emerald-700 bg-emerald-900 text-emerald-100 cursor-default"
              : sbagliato ? (x.i === k ? "border-emerald-800 bg-emerald-950 text-emerald-200 hover:border-red-600" : "border-red-700 bg-red-950 text-red-200 hover:border-red-500")
              : "border-indigo-700 bg-indigo-950 text-indigo-100 hover:border-red-600"}`}>
            <span className="font-mono text-[10px] opacity-60 mr-1">{k + 1}</span>{x.c}
          </button>
        ))}
      </div>
      {sol && !ok && (
        <div className="mb-2 text-[12.5px] text-zinc-300 leading-relaxed">
          <span className="font-mono text-[11px] text-zinc-500">{T("soluzione · ", "solution · ")}</span>
          {it.seq.map((c, k) => <span key={k} className="mr-2"><span className="font-mono text-[10px] text-zinc-500">{k + 1}</span> {c}</span>)}
        </div>
      )}
      {!ok && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {pool.map((x) => (
            <button key={x.i} onClick={() => { setPool((p) => p.filter((y) => y.i !== x.i)); setRiga((r) => [...r, x]); }}
              className="px-2 py-0.5 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-300 text-[13px] hover:border-indigo-600 hover:text-white transition-colors">
              {x.c}
            </button>
          ))}
        </div>
      )}
      {sbagliato && <div className="mt-2 text-[12.5px] text-amber-300 leading-relaxed"><span className="font-medium">{T(
        `Non ancora: ${fuori === 1 ? "1 passo è fuori posto" : `${fuori} passi sono fuori posto`} (in rosso) — cliccali per rimetterli tra i disponibili. `,
        `Not yet: ${fuori === 1 ? "1 step is out of place" : `${fuori} steps are out of place`} (in red) — click them to put them back in the pool. `
      )}</span>{it.perche}</div>}
      {ok && <div className="mt-1 text-[12.5px] text-emerald-300 leading-relaxed">{it.perche}</div>}
    </div>
  );
}

/* La riga tiene in stato i passi mescolati: la chiave con la lingua la rimonta
   quando si cambia lingua, così i passi sono sempre quelli tradotti. */
function Riordina({ id, titolo, intro, items }) {
  const [done, mark, reset] = useSolved(id, items.length);
  const [gen, setGen] = useState(0);
  return (
    <DrillShell titolo={titolo} icon={Shuffle} intro={intro} fatti={done.size} tot={items.length} onReset={() => { reset(); setGen((g) => g + 1); }}>
      <div className="space-y-3">
        {items.map((it, i) => <RiordinaRiga key={`${langKey()}-${gen}-${i}`} it={it} risolto={done.has(i)} onOk={() => mark(i)} />)}
      </div>
    </DrillShell>
  );
}

/* Cloze — items: { pre, ok: "…" | [...alternative], post, aiuto, perche } */
const norm = (s) => s.toLowerCase().replace(/[`'"«»]/g, "").replace(/\s+/g, " ").trim().replace(/[.;:!?]+$/, "");
const judge = (val, ok) => (Array.isArray(ok) ? ok : [ok]).some((o) => norm(o) === norm(val));

function ClozeRiga({ it, risolto, onOk }) {
  const [val, setVal] = useState("");
  const [esito, setEsito] = useState(risolto ? "ok" : null);
  const [visto, setVisto] = useState(false);
  const atteso = Array.isArray(it.ok) ? it.ok[0] : it.ok;
  function controlla() {
    if (!val.trim()) return;
    const v = judge(val, it.ok) ? "ok" : "ko";
    setEsito(v);
    if (v === "ok") onOk();
  }
  const ok = esito === "ok";
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${ok ? "border-emerald-900 bg-emerald-950/30" : esito === "ko" ? "border-red-900 bg-red-950/20" : "border-zinc-800 bg-zinc-950"}`}>
      <div className="flex items-center gap-2 flex-wrap text-[14px] text-zinc-200 leading-relaxed">
        <span>{it.pre}</span>
        <input value={ok ? atteso : val} onChange={(e) => { setVal(e.target.value); setEsito(null); }}
          onKeyDown={(e) => e.key === "Enter" && controlla()} disabled={ok} placeholder={it.aiuto || "…"}
          size={Math.max(6, atteso.length + 2)}
          className={`px-2 py-0.5 rounded-md border bg-zinc-900 font-mono text-[13px] outline-none transition-colors disabled:opacity-100 ${ok ? "border-emerald-700 text-emerald-200" : esito === "ko" ? "border-red-700 text-red-200" : "border-zinc-700 text-zinc-100 focus:border-indigo-500"}`} />
        {it.post && <span>{it.post}</span>}
        {!ok && <button onClick={controlla} className="px-2 py-0.5 rounded-md border border-zinc-700 bg-zinc-900 text-[12px] text-zinc-300 hover:border-indigo-600 hover:text-white transition-colors">{T("controlla", "check")}</button>}
      </div>
      {ok && <div className="mt-2 text-[12.5px] text-emerald-300 leading-relaxed">{it.perche}</div>}
      {esito === "ko" && (
        <div className="mt-2 text-[12.5px] text-amber-300 leading-relaxed">
          <span className="font-medium">{T("Non ancora. ", "Not yet. ")}</span>{it.perche}
          <button onClick={() => setVisto(true)} className="ml-2 underline text-zinc-500 hover:text-zinc-300">{T("mostra la risposta", "show the answer")}</button>
          {visto && <span className="ml-2 font-mono text-zinc-300">{atteso}</span>}
        </div>
      )}
    </div>
  );
}

function Cloze({ id, titolo, intro, items }) {
  const [done, mark, reset] = useSolved(id, items.length);
  const [gen, setGen] = useState(0);
  return (
    <DrillShell titolo={titolo} icon={PenLine} intro={intro} fatti={done.size} tot={items.length} onReset={() => { reset(); setGen((g) => g + 1); }}>
      <div className="space-y-3">
        {items.map((it, i) => <ClozeRiga key={`${gen}-${i}`} it={it} risolto={done.has(i)} onOk={() => mark(i)} />)}
      </div>
    </DrillShell>
  );
}

/* TabellaViva — due assi cliccabili, la cella mostra l'esito evidenziato + perché.
   celle: { "ka|kb": { forma, nota, tone? } } */
function TabellaViva({ titolo, intro, assi, celle }) {
  const [a, setA] = useState(assi.a.opts[0].k);
  const [b, setB] = useState(assi.b.opts[0].k);
  const c = celle[`${a}|${b}`];
  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Table2 size={16} className="text-indigo-400 shrink-0" />
        <span className="text-[15px] text-zinc-100 font-medium">{titolo}</span>
      </div>
      {intro && <p className="text-[13px] text-zinc-400 leading-relaxed mb-3">{intro}</p>}
      {[["a", assi.a, a, setA], ["b", assi.b, b, setB]].map(([key, asse, val, set]) => (
        <div key={key} className="mb-2.5">
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-600 mb-1">{asse.label}</div>
          <div className="flex gap-1.5 flex-wrap">
            {asse.opts.map((o) => (
              <button key={o.k} onClick={() => set(o.k)}
                className={`px-2.5 py-1 rounded-md border text-[13px] transition-colors ${val === o.k ? "border-indigo-500 bg-indigo-950 text-white" : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100"}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      {c && (
        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3">
          <span key={`${a}|${b}`} className={`anim-rise inline-block px-2 py-0.5 rounded-md border text-[15px] font-medium ${c.tone ? TONE[c.tone].pill : "border-indigo-600 bg-indigo-950 text-indigo-100"}`}>{c.forma}</span>
          <div className="mt-2 text-[13px] text-zinc-300 leading-relaxed">{c.nota}</div>
        </div>
      )}
    </Card>
  );
}

/* Sfida — componi la soluzione, l'app dice cosa manca e cosa è di troppo.
   Copia di DesignChallenge (Lesson.jsx). pool: { id, label, role: essential|optional|wrong, why } */
function Sfida({ brief, pool, reference }) {
  const [sel, setSel] = useState({});
  const [checked, setChecked] = useState(false);
  const essentials = pool.filter((p) => p.role === "essential");
  const gotEss = essentials.filter((p) => sel[p.id]).length;
  const wrongPicked = pool.filter((p) => p.role === "wrong" && sel[p.id]).length;
  const allGood = checked && gotEss === essentials.length && wrongPicked === 0;
  const feedback = pool.filter((p) => p.role === "essential" || sel[p.id]);
  return (
    <div className="rounded-xl border border-indigo-900 bg-zinc-900 p-4">
      <div className="flex items-center gap-2 mb-2"><Wrench size={15} className="text-indigo-400" /><span className="text-xs uppercase tracking-wide text-indigo-400 font-mono">{T("Sfida: componila tu", "Challenge: put it together yourself")}</span></div>
      <div className="text-sm text-zinc-200 mb-1 leading-relaxed">{brief}</div>
      <p className="text-xs text-zinc-500 mb-3">{T(
        <>Prima pensala <span className="text-zinc-400">da zero</span>. Poi seleziona i pezzi che ci metteresti e premi «Verifica»: ti dico cosa manca e cosa è di troppo, con il perché.</>,
        <>First think it through <span className="text-zinc-400">from scratch</span>. Then pick the pieces you'd use and hit “Check”: I'll tell you what's missing and what's too much, and why.</>
      )}</p>
      <div className="grid sm:grid-cols-2 gap-1.5 mb-3">
        {pool.map((p) => {
          const on = !!sel[p.id];
          let cls = on ? "border-indigo-600 bg-indigo-950 text-indigo-100" : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-600";
          if (checked) {
            if (p.role === "essential" && on) cls = "border-emerald-700 bg-emerald-950 text-emerald-200";
            else if (p.role === "essential" && !on) cls = "border-red-800 bg-red-950 text-red-200";
            else if (p.role === "wrong" && on) cls = "border-red-800 bg-red-950 text-red-200";
            else if (p.role === "optional" && on) cls = "border-blue-800 bg-blue-950 text-blue-200";
          }
          return (
            <button key={p.id} disabled={checked} onClick={() => setSel((s) => ({ ...s, [p.id]: !s[p.id] }))}
              className={`text-left text-xs rounded-lg border px-3 py-2 transition-colors flex items-center gap-2 disabled:cursor-default ${cls}`}>
              {on ? <CheckSquare size={14} className="shrink-0" /> : <Square size={14} className="shrink-0 text-zinc-600" />}
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>
      {!checked && <button onClick={() => setChecked(true)} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">{T("Verifica", "Check")}</button>}
      {checked && (
        <div className="space-y-2">
          <div className={`text-sm font-medium ${allGood ? "text-emerald-300" : "text-amber-300"}`}>{allGood
            ? T("Solida: tutti gli essenziali, niente di troppo.", "Solid: every essential, nothing extra.")
            : T(`Essenziali presi: ${gotEss}/${essentials.length}${wrongPicked ? ` · ${wrongPicked} da evitare` : ""}. Rivedi i punti qui sotto.`,
                `Essentials picked: ${gotEss}/${essentials.length}${wrongPicked ? ` · ${wrongPicked} to avoid` : ""}. Go through the points below.`)}</div>
          <div className="space-y-1.5">
            {feedback.map((p) => (
              <div key={p.id} className="text-xs leading-relaxed text-zinc-400">
                <span className={`font-mono mr-1 ${p.role === "essential" ? (sel[p.id] ? "text-emerald-300" : "text-red-300") : p.role === "wrong" ? "text-red-300" : "text-blue-300"}`}>
                  {p.role === "essential" ? (sel[p.id] ? T("✓ giusto", "✓ right") : T("✗ mancava", "✗ missing")) : p.role === "wrong" ? T("✗ da evitare", "✗ avoid") : T("≈ opzionale", "≈ optional")}
                </span>
                <span className="text-zinc-200">{p.label}</span> — {p.why}
              </div>
            ))}
          </div>
          {reference && <div className="text-xs text-zinc-400 leading-relaxed rounded-lg border border-zinc-800 bg-zinc-950 p-3"><span className="text-indigo-300 font-mono">{T("Soluzione di riferimento — ", "Reference solution — ")}</span>{reference}</div>}
          <button onClick={() => { setChecked(false); setSel({}); }} className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1"><RotateCcw size={12} /> {T("riprova da capo", "start over")}</button>
        </div>
      )}
    </div>
  );
}

/* Selettore-esplicativo: griglia di bottoni, sotto la scheda della scelta */
function Selettore({ label, opts, render, cols = "sm:grid-cols-4" }) {
  const [k, setK] = useState(opts[0].k);
  const cur = opts.find((o) => o.k === k);
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div className={`grid grid-cols-2 ${cols} gap-2`}>
        {opts.map((o) => (
          <button key={o.k} onClick={() => setK(o.k)}
            className={`rounded-lg border px-3 py-2 text-left transition-all ${k === o.k ? "border-indigo-500 bg-indigo-950" : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"}`}>
            <div className="text-[13px] text-zinc-100 leading-tight">{o.label}</div>
            {o.sub && <div className="text-[10.5px] text-zinc-500 font-mono mt-0.5">{o.sub}</div>}
          </button>
        ))}
      </div>
      <div key={k} className="anim-rise mt-2">{render(cur)}</div>
    </div>
  );
}

/* ==========================================================================
   INFRASTRUTTURA · 1 — VM & hypervisor
   ========================================================================== */

const WHO = { tuo: "border-indigo-800 bg-indigo-950 text-indigo-100", provider: "border-zinc-800 bg-zinc-950 text-zinc-500", condiviso: "border-amber-900 bg-amber-950 text-amber-200" };
const WHO_EN = { tuo: "yours", provider: "provider", condiviso: "shared" };

const VM_OPTS = memoByLang(() => [
  { k: "bare", label: "Bare metal", sub: T("il server fisico", "the physical server"),
    layers: [[T("La tua app", "Your app"), "tuo"], [T("Librerie & runtime", "Libraries & runtime"), "tuo"], [T("Sistema operativo + kernel", "Operating system + kernel"), "tuo"], ["Hardware", "tuo"]],
    avvio: T("minuti di boot (settimane, se il server lo devi comprare)", "minutes to boot (weeks, if you have to buy the server)"),
    iso: T("totale: la macchina è solo tua", "total: the machine is yours alone"),
    paghi: T("l'hardware, acceso o spento", "the hardware, on or off"),
    quando: T("carichi enormi e stabili, hardware particolare (GPU dedicate), licenze legate al ferro. Raro, per una startup.", "huge, steady workloads, special hardware (dedicated GPUs), licences tied to the metal. Rare for a startup.") },
  { k: "vm", label: T("Macchina virtuale", "Virtual machine"), sub: "EC2, droplet, VPS",
    layers: [[T("La tua app", "Your app"), "tuo"], [T("Librerie & runtime", "Libraries & runtime"), "tuo"], [T("OS guest + il SUO kernel", "Guest OS + ITS OWN kernel"), "tuo"], ["Hypervisor (KVM, Nitro)", "provider"], ["Hardware", "provider"]],
    avvio: T("30–90 s: boota un sistema operativo intero", "30–90 s: it boots a whole operating system"),
    iso: T("forte: ogni VM ha il suo kernel, il confine è l'hypervisor", "strong: every VM has its own kernel, the boundary is the hypervisor"),
    paghi: T("al secondo finché è accesa — anche se non fa niente", "per second while it's on — even if it does nothing"),
    quando: T("ti serve l'OS (driver, Windows, tuning del kernel), processi sempre accesi, un database gestito da te.", "you need the OS (drivers, Windows, kernel tuning), always-on processes, a database you run yourself.") },
  { k: "container", label: "Container", sub: T("Docker su una VM", "Docker on a VM"),
    layers: [[T("La tua app", "Your app"), "tuo"], [T("Librerie (nell'immagine)", "Libraries (in the image)"), "tuo"], [T("Kernel dell'host — condiviso", "Host kernel — shared"), "condiviso"], [T("OS host / VM", "Host OS / VM"), "provider"], ["Hypervisor + hardware", "provider"]],
    avvio: T("sotto il secondo: è un processo, non un OS", "under a second: it's a process, not an OS"),
    iso: T("media: kernel in comune con gli altri container sulla stessa macchina", "medium: kernel shared with the other containers on the same machine"),
    paghi: T("la VM sotto (tua o della piattaforma)", "the VM underneath (yours or the platform's)"),
    quando: T("tante copie identiche della stessa app, portabilità laptop→prod, Kubernetes.", "many identical copies of the same app, laptop→prod portability, Kubernetes.") },
  { k: "serverless", label: "Serverless", sub: "Lambda, Vercel Functions",
    layers: [[T("La tua funzione", "Your function"), "tuo"], ["Runtime (Node, Python)", "provider"], ["microVM (Firecracker)", "provider"], ["Hypervisor + hardware", "provider"]],
    avvio: T("millisecondi se «calda», 100 ms–qualche secondo di cold start", "milliseconds when “warm”, 100 ms to a few seconds of cold start"),
    iso: T("una microVM per ambiente di esecuzione, gestita dal provider", "one microVM per execution environment, managed by the provider"),
    paghi: T("per invocazione e millisecondi: zero a riposo", "per invocation and millisecond: zero when idle"),
    quando: T("carichi a picchi, webhook, glue code. No per job lunghi (Lambda si ferma a 15 minuti) o connessioni sempre aperte.", "spiky workloads, webhooks, glue code. Not for long jobs (Lambda stops at 15 minutes) or always-open connections.") },
]);

function VmModule() {
  return (
    <div className="space-y-4">
      <Lead>{T(
        <>Una <span className="text-white font-medium">macchina virtuale</span> è un computer finto dentro uno vero: l'<span className="text-white font-medium">hypervisor</span> divide
        CPU, RAM e disco di un server fisico tra più «ospiti», ognuno con il <span className="text-white">suo sistema operativo completo</span>. Un'istanza EC2, una droplet,
        il VPS da 5 € al mese: sono tutte VM. Container e serverless non la sostituiscono — ci girano <span className="text-white">sopra</span>.</>,
        <>A <span className="text-white font-medium">virtual machine</span> is a fake computer inside a real one: the <span className="text-white font-medium">hypervisor</span> splits
        the CPU, RAM and disk of a physical server among several “guests”, each with <span className="text-white">its own complete operating system</span>. An EC2 instance, a droplet,
        the €5-a-month VPS: they're all VMs. Containers and serverless don't replace it — they run <span className="text-white">on top</span> of it.</>
      )}</Lead>
      <Analogy>{T(
        <>Un palazzo. L'hardware è l'edificio; l'hypervisor è l'impresa che lo divide in <span className="text-zinc-100">appartamenti con muri portanti</span> — ogni VM ha la
        sua cucina e il suo impianto (il kernel). I container sono <span className="text-zinc-100">stanze in coabitazione</span> dentro un appartamento: porta chiusa a
        chiave, ma cucina in comune. Il serverless è la camera d'albergo a ore.</>,
        <>An apartment block. The hardware is the building; the hypervisor is the builder who splits it into <span className="text-zinc-100">flats with load-bearing walls</span> — every VM has
        its own kitchen and wiring (the kernel). Containers are <span className="text-zinc-100">rooms in a flat share</span>: a lockable door,
        but a shared kitchen. Serverless is a hotel room by the hour.</>
      )}</Analogy>
      <Predict
        question={T("La tua app Python gira su una VM Ubuntu. La metti in un container, sulla stessa VM. Quanti kernel Linux stanno lavorando per la tua app?", "Your Python app runs on an Ubuntu VM. You put it in a container, on the same VM. How many Linux kernels are working for your app?")}
        options={T(["Due: quello della VM e quello del container", "Uno: il container usa il kernel della VM", "Zero: un container non ha bisogno di kernel"], ["Two: the VM's and the container's", "One: the container uses the VM's kernel", "Zero: a container doesn't need a kernel"])}
        answer={1}
        explain={T("Un container è un processo isolato (namespaces + cgroups) sul kernel dell'host — qui la VM. Per questo parte in un attimo, e per questo un container Windows non gira su un kernel Linux.", "A container is an isolated process (namespaces + cgroups) on the host's kernel — here, the VM's. That's why it starts in an instant, and why a Windows container won't run on a Linux kernel.")}
      />
      <Card>
        <Selettore label={T("dove gira il tuo codice · clicca e guarda chi possiede ogni strato", "where your code runs · click and see who owns each layer")} opts={VM_OPTS()} render={(o) => (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              {o.layers.map(([l, who]) => (
                <div key={l} className={`flex items-center rounded-md border px-3 py-1.5 text-[13px] ${WHO[who]}`}>
                  <span>{l}</span><span className="ml-auto font-mono text-[10px] uppercase tracking-wide">{T(who, WHO_EN[who])}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 text-[13px] leading-relaxed">
              <div><span className="font-mono text-emerald-300">{T("avvio · ", "startup · ")}</span><span className="text-zinc-300">{o.avvio}</span></div>
              <div><span className="font-mono text-blue-300">{T("isolamento · ", "isolation · ")}</span><span className="text-zinc-300">{o.iso}</span></div>
              <div><span className="font-mono text-amber-300">{T("paghi · ", "you pay · ")}</span><span className="text-zinc-300">{o.paghi}</span></div>
              <div><span className="font-mono text-indigo-300">{T("quando · ", "when · ")}</span><span className="text-zinc-300">{o.quando}</span></div>
            </div>
          </div>
        )} />
      </Card>
      <Card>
        <Label>{T("i pezzi di una VM, come li trovi in console", "the parts of a VM, as you find them in the console")}</Label>
        <Griglia intestazioni={T(["pezzo", "cos'è", "la trappola"], ["part", "what it is", "the trap"])} righe={T([
          ["immagine (AMI)", "Snapshot di un disco con l'OS già installato: ogni VM nasce da lì.", "Un'immagine vecchia di un anno nasce con un anno di patch di sicurezza mancanti."],
          ["tipo d'istanza", "La taglia: t3.small = 2 vCPU e 2 GiB di RAM.", "Le t3 sono «burstable»: finito il credito CPU rallentano. Ottime per carichi a picchi, non per CPU piena h24."],
          ["disco (EBS)", "Volume di rete agganciato alla VM: vive a parte.", "Il disco locale (instance store) si svuota quando la VM si ferma: niente dati importanti lì."],
          ["security group", "Il firewall della VM: quali porte, da quali IP.", "22 (SSH) aperta a 0.0.0.0/0 = bot che provano password tutto il giorno."],
          ["chiave SSH", "La pubblica sta sulla VM, la privata sul tuo laptop.", "Una chiave condivisa dal team non si può revocare a una persona sola."],
        ], [
          ["image (AMI)", "A snapshot of a disk with the OS already installed: every VM is born from it.", "A year-old image is born missing a year of security patches."],
          ["instance type", "The size: t3.small = 2 vCPUs and 2 GiB of RAM.", "t3s are “burstable”: once the CPU credit runs out they slow down. Great for spiky loads, not for 24/7 full CPU."],
          ["disk (EBS)", "A network volume attached to the VM: it lives separately.", "The local disk (instance store) is wiped when the VM stops: no important data there."],
          ["security group", "The VM's firewall: which ports, from which IPs.", "22 (SSH) open to 0.0.0.0/0 = bots trying passwords all day long."],
          ["SSH key", "The public one sits on the VM, the private one on your laptop.", "A key shared by the whole team can't be revoked for just one person."],
        ])} />
      </Card>
      <Card>
        <Label>{T("una VM nasce così · e si configura da sola al primo avvio", "this is how a VM is born · and it configures itself on first boot")}</Label>
        <Code>{T(`# nascita (AWS CLI)
aws ec2 run-instances \\
  --image-id ami-0abc1234 \\          # Ubuntu 24.04
  --instance-type t3.small \\         # 2 vCPU, 2 GiB
  --key-name irio-laptop \\           # chiave SSH
  --security-group-ids sg-0web \\     # porte 22 e 443
  --user-data file://cloud-init.yaml

# cloud-init.yaml — eseguito al primo boot, niente click
#cloud-config
packages: [docker.io]
runcmd:
  - systemctl enable --now docker
  - docker run -d -p 80:8000 registry/app:1.4.2

# entrarci (per guardare, non per configurare)
ssh -i ~/.ssh/irio-laptop.pem ubuntu@3.121.45.10`, `# birth (AWS CLI)
aws ec2 run-instances \\
  --image-id ami-0abc1234 \\          # Ubuntu 24.04
  --instance-type t3.small \\         # 2 vCPU, 2 GiB
  --key-name irio-laptop \\           # SSH key
  --security-group-ids sg-0web \\     # ports 22 and 443
  --user-data file://cloud-init.yaml

# cloud-init.yaml — runs on first boot, no clicking
#cloud-config
packages: [docker.io]
runcmd:
  - systemctl enable --now docker
  - docker run -d -p 80:8000 registry/app:1.4.2

# getting in (to look, not to configure)
ssh -i ~/.ssh/irio-laptop.pem ubuntu@3.121.45.10`)}</Code>
      </Card>
      <Note tone="amber" icon={AlertTriangle}>{T(
        <><span className="font-medium">Pet vs cattle.</span> Una VM sistemata a mano via SSH diventa un <span className="text-white">pet</span>: unica, nessuno sa più come è stata
        fatta, e il giorno che muore muore la configurazione con lei. Se invece nasce da immagine + cloud-init (e la descrivi in Terraform, prossimo capitolo), è
        <span className="text-white"> cattle</span>: la distruggi e ne nasce una identica. SSH serve per guardare, non per configurare.</>,
        <><span className="font-medium">Pets vs cattle.</span> A VM set up by hand over SSH becomes a <span className="text-white">pet</span>: unique, nobody remembers how it was
        built, and the day it dies its configuration dies with it. If instead it's born from an image + cloud-init (and described in Terraform, next chapter), it's
        <span className="text-white"> cattle</span>: you destroy it and an identical one is born. SSH is for looking, not for configuring.</>
      )}</Note>
      <ScegliForma id="vm-dove" titolo={T("Dove lo faresti girare?", "Where would you run it?")} intro={T("Cinque carichi veri. Scegli e leggi il perché — anche quando indovini.", "Five real workloads. Pick one and read why — even when you get it right.")} items={T([
        { pre: "Un job notturno che ricalcola i report per 3 ore →", opts: ["Lambda", "container o VM"], ok: "container o VM", perche: "Lambda si ferma a 15 minuti. Un batch lungo va su un container schedulato (ECS, Cloud Run Jobs, un CronJob Kubernetes) o su una VM." },
        { pre: "Il webhook di Stripe, 50 chiamate al giorno →", opts: ["VM sempre accesa", "serverless"], ok: "serverless", perche: "Traffico sporadico: con una VM paghi 24 ore per 50 richieste. Il serverless scala a zero e paghi le invocazioni." },
        { pre: "Postgres gestito da te, 500 GB di dati →", opts: ["container senza volume", "VM con disco persistente"], ok: "VM con disco persistente", perche: "Un database vuole disco che sopravvive e prestazioni prevedibili. Ancora meglio: un DB gestito (RDS, Neon) e il disco non è più un tuo problema." },
        { pre: "30 istanze identiche della stessa API dietro un load balancer →", opts: ["30 VM configurate via SSH", "container da un'immagine"], ok: "container da un'immagine", perche: "Un'immagine, 30 copie identiche che partono in un secondo. 30 VM sistemate a mano sono 30 pet diversi fra loro." },
        { pre: "Un software legacy che vuole Windows Server e un driver di sistema →", opts: ["container Linux", "VM"], ok: "VM", perche: "Un container condivide il kernel dell'host: un kernel Linux non fa girare Windows né carica driver arbitrari. Serve un OS intero, cioè una VM." },
      ], [
        { pre: "A nightly job that recomputes reports for 3 hours →", opts: ["Lambda", "container or VM"], ok: "container or VM", perche: "Lambda stops at 15 minutes. A long batch goes on a scheduled container (ECS, Cloud Run Jobs, a Kubernetes CronJob) or on a VM." },
        { pre: "The Stripe webhook, 50 calls a day →", opts: ["always-on VM", "serverless"], ok: "serverless", perche: "Sporadic traffic: with a VM you pay 24 hours for 50 requests. Serverless scales to zero and you pay per invocation." },
        { pre: "Postgres you run yourself, 500 GB of data →", opts: ["container with no volume", "VM with a persistent disk"], ok: "VM with a persistent disk", perche: "A database wants a disk that survives and predictable performance. Even better: a managed DB (RDS, Neon) and the disk stops being your problem." },
        { pre: "30 identical instances of the same API behind a load balancer →", opts: ["30 VMs configured over SSH", "containers from one image"], ok: "containers from one image", perche: "One image, 30 identical copies that start in a second. 30 hand-tuned VMs are 30 pets, all different from each other." },
        { pre: "A legacy application that wants Windows Server and a system driver →", opts: ["Linux container", "VM"], ok: "VM", perche: "A container shares the host's kernel: a Linux kernel can't run Windows or load arbitrary drivers. You need a whole OS, i.e. a VM." },
      ])} />
      <Cloze id="vm-pezzi" titolo={T("Riconosci i pezzi", "Name the parts")} items={T([
        { pre: "Il software che divide un server fisico in più VM si chiama", ok: "hypervisor", perche: "KVM, Xen, Hyper-V, VMware ESXi. Su AWS è Nitro, basato su KVM." },
        { pre: "Il firewall di una VM su AWS: security", ok: "group", perche: "Regole in ingresso/uscita per porta e sorgente. Di default tutto chiuso in ingresso." },
        { pre: "In ssh -i chiave.pem, il file è la chiave", ok: "privata", perche: "La pubblica sta sulla VM (in ~/.ssh/authorized_keys); la privata non lascia mai il tuo laptop." },
        { pre: "Lo script eseguito al primo boot che installa e configura la VM:", ok: ["cloud-init", "cloudinit", "user-data"], perche: "cloud-init legge lo user-data: pacchetti, file, comandi. È ciò che trasforma un pet in cattle." },
      ], [
        { pre: "The software that splits a physical server into several VMs is called the", ok: "hypervisor", perche: "KVM, Xen, Hyper-V, VMware ESXi. On AWS it's Nitro, based on KVM." },
        { pre: "The firewall of a VM on AWS: security", ok: "group", perche: "Inbound/outbound rules by port and source. By default all inbound traffic is blocked." },
        { pre: "In ssh -i key.pem, the file is the", ok: "private", post: "key", perche: "The public key sits on the VM (in ~/.ssh/authorized_keys); the private one never leaves your laptop." },
        { pre: "The script run on first boot that installs and configures the VM:", ok: ["cloud-init", "cloudinit", "user-data"], perche: "cloud-init reads the user-data: packages, files, commands. It's what turns a pet into cattle." },
      ])} />
      <Takeaway>{T(
        <>Tre domande per scegliere dove gira: <span className="text-white">mi serve un OS intero</span> (kernel, driver, Windows)? → VM. <span className="text-white">Voglio N copie
        identiche che partono in un secondo</span>? → container (su VM che qualcuno gestisce). <span className="text-white">Il carico è a picchi e ogni richiesta è breve</span>? →
        serverless. E qualunque cosa scegli: se non sai ricostruirla da un file, non ce l'hai.</>,
        <>Three questions to pick where it runs: <span className="text-white">do I need a whole OS</span> (kernel, drivers, Windows)? → VM. <span className="text-white">Do I want N identical
        copies that start in a second</span>? → containers (on VMs someone manages). <span className="text-white">Is the load spiky and every request short</span>? →
        serverless. And whatever you choose: if you can't rebuild it from a file, you don't really have it.</>
      )}</Takeaway>
    </div>
  );
}

/* ==========================================================================
   INFRASTRUTTURA · 2 — Kubernetes
   ========================================================================== */

const K8S_NODES = ["node-a", "node-b", "node-c"];

function K8sSim() {
  const [nodes, setNodes] = useState(K8S_NODES.map((name) => ({ name, up: true })));
  const [replicas, setReplicas] = useState(3);
  const [version, setVersion] = useState("1.4");
  const [st, setSt] = useState(() => reconcile({ nodes: K8S_NODES.map((name) => ({ name, up: true })), pods: [], replicas: 3, version: "1.4", nextId: 1 }));
  const [log, setLog] = useState(() => st.log);

  // il controller: finché reale ≠ desiderato, un giro ogni 700 ms
  useEffect(() => {
    if (st.converged && st.pods.every((p) => nodes.find((n) => n.name === p.node)?.up)) return;
    const t = setTimeout(() => {
      const next = reconcile({ nodes, pods: st.pods, replicas, version, nextId: st.nextId });
      setSt(next);
      if (next.log.length) setLog((l) => [...next.log, ...l].slice(0, 14));
    }, 700);
    return () => clearTimeout(t);
  }, [st, nodes, replicas, version]);

  const kick = (patch) => setSt((s) => ({ ...s, converged: false, ...patch }));
  function kill() {
    const p = st.pods[0];
    if (!p) return;
    setLog((l) => [`kubectl delete pod ${p.id}`, ...l].slice(0, 14));
    kick({ pods: st.pods.slice(1) });
  }
  function toggleNode(name) { setNodes((ns) => ns.map((n) => (n.name === name ? { ...n, up: !n.up } : n))); kick({}); }
  function reset() {
    const ns = K8S_NODES.map((name) => ({ name, up: true }));
    const s0 = reconcile({ nodes: ns, pods: [], replicas: 3, version: "1.4", nextId: 1 });
    setNodes(ns); setReplicas(3); setVersion("1.4"); setSt(s0); setLog(s0.log);
  }

  const converged = st.converged && st.pods.every((p) => nodes.find((n) => n.name === p.node)?.up);
  return (
    <Card>
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="text-xs text-zinc-500 font-mono">replicas</span>
        <Btn tone="ghost" onClick={() => { setReplicas((r) => Math.max(0, r - 1)); kick({}); }}><Minus size={13} /></Btn>
        <span className="font-mono text-lg text-indigo-200 w-5 text-center">{replicas}</span>
        <Btn tone="ghost" onClick={() => { setReplicas((r) => Math.min(6, r + 1)); kick({}); }}><Plus size={13} /></Btn>
        <span className="text-xs text-zinc-500 font-mono ml-3">image</span>
        {["1.4", "1.5"].map((v) => <Btn key={v} active={version === v} onClick={() => { setVersion(v); kick({}); }}>app:{v}</Btn>)}
        <button onClick={kill} className="ml-auto px-3 py-2 rounded-md border border-red-900 bg-red-950 text-red-200 text-sm hover:border-red-700">{T("uccidi un pod", "kill a pod")}</button>
        <button onClick={reset} className="text-zinc-500 hover:text-zinc-300" title="reset"><RotateCcw size={14} /></button>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {nodes.map((n) => (
          <div key={n.name} className={`rounded-lg border p-2 min-h-[110px] ${n.up ? "border-zinc-800 bg-zinc-950" : "border-red-900 bg-red-950/30"}`}>
            <div className="flex items-center gap-1 mb-2">
              <Server size={12} className={n.up ? "text-zinc-500" : "text-red-400"} />
              <span className="font-mono text-[11px] text-zinc-400">{n.name}</span>
              <button onClick={() => toggleNode(n.name)} title={n.up ? T("spegni il nodo", "power off the node") : T("riaccendi", "power it back on")} className={`ml-auto ${n.up ? "text-zinc-600 hover:text-red-400" : "text-red-400 hover:text-emerald-400"}`}><Power size={12} /></button>
            </div>
            <div className="flex flex-col gap-1">
              {st.pods.filter((p) => p.node === n.name).map((p) => (
                <span key={p.id} className={`anim-rise font-mono text-[10.5px] rounded border px-1.5 py-0.5 ${p.version === version ? "border-emerald-800 bg-emerald-950 text-emerald-200" : "border-amber-800 bg-amber-950 text-amber-200"}`}>{p.id} · v{p.version}</span>
              ))}
              {!n.up && <span className="text-[10.5px] text-red-300">NotReady</span>}
            </div>
          </div>
        ))}
      </div>
      <div className={`text-[12px] font-mono mb-2 ${converged ? "text-emerald-300" : "text-amber-300"}`}>
        {converged
          ? T(`✓ reale = desiderato: ${replicas} pod v${version}`, `✓ actual = desired: ${replicas} pods v${version}`)
          : T(`≠ il controller sta riconciliando… (${st.pods.length} pod, voluti ${replicas} v${version})`, `≠ the controller is reconciling… (${st.pods.length} pods, wanted ${replicas} v${version})`)}
      </div>
      <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-mono text-[11.5px] text-zinc-400 whitespace-pre-wrap max-h-36 overflow-y-auto">{log.join("\n") || "—"}</pre>
      <p className="text-[11px] text-zinc-600 mt-2">{T(
        "Semplificato: qui i pod sono pronti appena creati e un nodo spento perde i pod all'istante. Nella realtà ci sono le probe e circa 5 minuti prima che K8s dichiari morto un nodo.",
        "Simplified: here pods are ready as soon as they're created and a powered-off node loses its pods instantly. In reality there are probes and about 5 minutes before K8s declares a node dead."
      )}</p>
      <div className="mt-3"><Label>{T("il desiderato che stai modificando · app.yaml", "the desired state you're editing · app.yaml")}</Label>
        <Code>{`apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  replicas: ${replicas}
  selector:
    matchLabels: { app: web }
  strategy:
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
  template:
    metadata:
      labels: { app: web }
    spec:
      containers:
        - name: web
          image: registry/app:${version}
          ports: [{ containerPort: 8000 }]
          readinessProbe:
            httpGet: { path: /health, port: 8000 }
---
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector: { app: web }      # ${T("trova i pod per etichetta", "finds the pods by label")}
  ports: [{ port: 80, targetPort: 8000 }]`}</Code>
      </div>
    </Card>
  );
}

function K8sModule() {
  return (
    <div className="space-y-4">
      <Lead>{T(
        <>Kubernetes tiene in vita i tuoi container su un gruppo di macchine. Non gli dici «avvia questo container su quel server»: <span className="text-white font-medium">dichiari
        lo stato desiderato</span> («3 copie di <span className="font-mono">app:1.4</span>, raggiungibili sulla porta 80») e un controller confronta di continuo desiderato e reale,
        e agisce per chiudere la differenza. È il <span className="text-white font-medium">reconciliation loop</span>, ed è tutta l'idea.</>,
        <>Kubernetes keeps your containers alive across a group of machines. You don't tell it “start this container on that server”: you <span className="text-white font-medium">declare
        the desired state</span> (“3 copies of <span className="font-mono">app:1.4</span>, reachable on port 80”) and a controller keeps comparing desired and actual,
        and acts to close the gap. That's the <span className="text-white font-medium">reconciliation loop</span>, and it's the whole idea.</>
      )}</Lead>
      <Analogy>{T(
        "Il termostato. Imposti 21° (desiderato), lui misura (reale) e accende o spegne finché coincidono. Non gli dici «accendi la caldaia per 20 minuti». Apri la finestra? Se ne accorge e reagisce da solo.",
        "The thermostat. You set 21° (desired), it measures (actual) and switches on or off until they match. You don't tell it “run the boiler for 20 minutes”. Open the window? It notices and reacts on its own."
      )}</Analogy>
      <Predict
        question={T("Deployment con replicas: 3. Lanci kubectl delete pod su uno dei tre. Cosa succede?", "A Deployment with replicas: 3. You run kubectl delete pod on one of the three. What happens?")}
        options={T(["Restano 2 pod finché non rifai il deploy", "In pochi secondi c'è di nuovo un terzo pod, con un nome diverso", "Il Deployment va in errore e si ferma"], ["You're left with 2 pods until you redeploy", "Within seconds there's a third pod again, with a different name", "The Deployment errors out and stops"])}
        answer={1}
        explain={T("Il controller vede 2 ≠ 3 e crea un pod nuovo. Il nome cambia perché i pod sono usa-e-getta: non ne curi uno, lo sostituisci. Infatti «cancella il pod» è il modo standard di riavviarlo.", "The controller sees 2 ≠ 3 and creates a new pod. The name changes because pods are disposable: you don't nurse one, you replace it. In fact “delete the pod” is the standard way to restart it.")}
      />
      <K8sSim key={langKey()} />
      <Note tone="indigo" icon={Lightbulb}>{T(
        <>Prova in quest'ordine: <span className="text-white">uccidi un pod</span> · <span className="text-white">spegni node-a</span> (i suoi pod rinascono altrove) · passa a
        <span className="font-mono"> app:1.5</span> e guarda il rolling update: <span className="text-white">prima nasce un pod nuovo, poi muore un vecchio</span>, e i pod non
        scendono mai sotto 3 — è <span className="font-mono">maxUnavailable: 0</span>.</>,
        <>Try it in this order: <span className="text-white">kill a pod</span> · <span className="text-white">power off node-a</span> (its pods are reborn elsewhere) · switch to
        <span className="font-mono"> app:1.5</span> and watch the rolling update: <span className="text-white">first a new pod is born, then an old one dies</span>, and the pods never
        drop below 3 — that's <span className="font-mono">maxUnavailable: 0</span>.</>
      )}</Note>
      <Card>
        <Label>{T("i cinque oggetti da riconoscere", "the five objects to recognise")}</Label>
        <Griglia intestazioni={T(["oggetto", "cosa fa", "da ricordare"], ["object", "what it does", "worth remembering"])} righe={T([
          ["Pod", "Uno o più container che nascono e muoiono insieme.", "IP effimero: nessuno deve puntare a un pod."],
          ["Deployment", "Il desiderato: immagine, repliche, strategia di rilascio.", "È lui che fai «apply»; i pod sono una conseguenza."],
          ["Service", "Nome e IP stabili davanti a un gruppo di pod, trovati per label.", "I pod cambiano, il Service no: gli altri servizi chiamano lui."],
          ["Ingress", "HTTP dall'esterno → Service, per host e percorso, con TLS.", "api.miosito.it/v1 → Service api."],
          ["ConfigMap / Secret", "Config e segreti iniettati come variabili o file.", "Un Secret è base64, non cifrato: attiva la cifratura a riposo o usa un secret manager."],
        ], [
          ["Pod", "One or more containers that are born and die together.", "Ephemeral IP: nobody should point at a pod."],
          ["Deployment", "The desired state: image, replicas, rollout strategy.", "It's the thing you “apply”; pods are a consequence."],
          ["Service", "A stable name and IP in front of a group of pods, found by label.", "Pods change, the Service doesn't: other services call it."],
          ["Ingress", "HTTP from outside → Service, by host and path, with TLS.", "api.mysite.com/v1 → Service api."],
          ["ConfigMap / Secret", "Config and secrets injected as variables or files.", "A Secret is base64, not encrypted: turn on encryption at rest or use a secret manager."],
        ])} />
      </Card>
      <Note tone="amber" icon={AlertTriangle}>{T(
        <><span className="font-medium">readinessProbe ≠ livenessProbe.</span> Readiness: «posso ricevere traffico?» — se no, il Service ti toglie dal giro ma non ti uccide.
        Liveness: «sei vivo?» — se no, ti riavvia. La trappola: una liveness che controlla il database. Il DB rallenta, falliscono tutte, K8s <span className="text-white">riavvia
        tutti i pod insieme</span> e il rallentamento diventa un'interruzione. La liveness controlla solo il processo.</>,
        <><span className="font-medium">readinessProbe ≠ livenessProbe.</span> Readiness: “can I take traffic?” — if not, the Service takes you out of rotation but doesn't kill you.
        Liveness: “are you alive?” — if not, it restarts you. The trap: a liveness probe that checks the database. The DB slows down, they all fail, K8s <span className="text-white">restarts
        every pod at once</span> and a slowdown becomes an outage. Liveness checks the process only.</>
      )}</Note>
      <Card>
        <Label>{T("i comandi che userai davvero", "the commands you'll actually use")}</Label>
        <Code>{T(`kubectl apply -f app.yaml            # dichiari il desiderato
kubectl get pods -o wide             # il reale: dove sta ogni pod
kubectl rollout status deploy/app    # segui il rolling update
kubectl rollout undo deploy/app      # torna alla revisione precedente
kubectl logs -f deploy/app           # log di un pod del deployment
kubectl scale deploy/app --replicas=5`, `kubectl apply -f app.yaml            # declare the desired state
kubectl get pods -o wide             # the actual state: where each pod is
kubectl rollout status deploy/app    # follow the rolling update
kubectl rollout undo deploy/app      # go back to the previous revision
kubectl logs -f deploy/app           # logs of one of the deployment's pods
kubectl scale deploy/app --replicas=5`)}</Code>
      </Card>
      <Note tone="emerald" icon={CheckCircle2}>{T(
        <><span className="font-medium">Ti serve davvero?</span> Per un'API e un worker, un PaaS (Cloud Run, Render, ECS) ti dà rolling update, scaling e health check senza un
        cluster da gestire. Kubernetes ripaga quando hai molti servizi, più team, o devi girare uguale su cloud diversi.</>,
        <><span className="font-medium">Do you really need it?</span> For one API and one worker, a PaaS (Cloud Run, Render, ECS) gives you rolling updates, scaling and health checks with no
        cluster to run. Kubernetes pays off when you have many services, several teams, or must run the same way on different clouds.</>
      )}</Note>
      <ScegliForma id="k8s-oggetto" titolo={T("Quale oggetto?", "Which object?")} items={T([
        { pre: "Un nome stabile per raggiungere i pod anche quando vengono ricreati →", opts: ["Pod", "Service", "Ingress"], ok: "Service", perche: "Il Service seleziona i pod per label e tiene un indirizzo fisso davanti a loro." },
        { pre: "Esporre api.miosito.it/v1 in HTTPS al mondo →", opts: ["Service", "Ingress", "ConfigMap"], ok: "Ingress", perche: "L'Ingress instrada HTTP per host e percorso verso i Service, e termina il TLS." },
        { pre: "Passare da app:1.4 a app:1.5 senza downtime →", opts: ["Pod", "Deployment", "Secret"], ok: "Deployment", perche: "Cambi l'immagine nel Deployment; lui fa il rolling update secondo la sua strategia." },
        { pre: "La password del DB dentro il container →", opts: ["ConfigMap", "Secret", "Ingress"], ok: "Secret", perche: "Secret, montato come variabile o file. Ricorda: base64 non è cifratura." },
        { pre: "Il pod risponde ma sta ancora caricando: niente traffico finché non è pronto →", opts: ["livenessProbe", "readinessProbe"], ok: "readinessProbe", perche: "Readiness decide se ricevi traffico. Una liveness qui ti farebbe riavviare in loop durante il caricamento." },
      ], [
        { pre: "A stable name to reach the pods even when they get recreated →", opts: ["Pod", "Service", "Ingress"], ok: "Service", perche: "The Service selects pods by label and keeps a fixed address in front of them." },
        { pre: "Expose api.mysite.com/v1 over HTTPS to the world →", opts: ["Service", "Ingress", "ConfigMap"], ok: "Ingress", perche: "The Ingress routes HTTP by host and path to the Services, and terminates TLS." },
        { pre: "Go from app:1.4 to app:1.5 with no downtime →", opts: ["Pod", "Deployment", "Secret"], ok: "Deployment", perche: "You change the image in the Deployment; it does the rolling update according to its strategy." },
        { pre: "The DB password inside the container →", opts: ["ConfigMap", "Secret", "Ingress"], ok: "Secret", perche: "A Secret, mounted as a variable or a file. Remember: base64 isn't encryption." },
        { pre: "The pod responds but is still loading: no traffic until it's ready →", opts: ["livenessProbe", "readinessProbe"], ok: "readinessProbe", perche: "Readiness decides whether you get traffic. A liveness probe here would restart you in a loop while loading." },
      ])} />
      <Riordina id="k8s-rolling" titolo={T("Il rolling update, in ordine", "The rolling update, in order")} intro={T("3 repliche, maxSurge 1, maxUnavailable 0.", "3 replicas, maxSurge 1, maxUnavailable 0.")} items={T([
        { it: "Da app:1.4 ad app:1.5", seq: ["crea 1 pod v1.5", "attendi che sia ready", "togli 1 pod v1.4", "ripeti finché i v1.4 sono zero"], perche: "Prima aggiungi, poi togli: la capacità non scende mai sotto 3. Con maxUnavailable 1 potresti togliere prima e andare più veloce, a costo di un momento a 2 pod." },
      ], [
        { it: "From app:1.4 to app:1.5", seq: ["create 1 v1.5 pod", "wait until it's ready", "remove 1 v1.4 pod", "repeat until there are no v1.4 pods left"], perche: "Add first, then remove: capacity never drops below 3. With maxUnavailable 1 you could remove first and go faster, at the cost of a moment with 2 pods." },
      ])} />
      <Cloze id="k8s-cmd" titolo={T("kubectl a memoria", "kubectl by heart")} items={T([
        { pre: "kubectl", ok: "apply", post: "-f app.yaml", perche: "apply confronta il file con lo stato del cluster e applica la differenza: dichiarativo." },
        { pre: "kubectl rollout", ok: "undo", post: "deploy/app   # torna alla versione di prima", perche: "Il Deployment conserva le revisioni precedenti: il rollback è un comando." },
        { pre: "kubectl", ok: "get", post: "pods   # elenca i pod", perche: "get per elencare, describe per il dettaglio e gli eventi (è lì che trovi perché un pod non parte)." },
      ], [
        { pre: "kubectl", ok: "apply", post: "-f app.yaml", perche: "apply compares the file with the cluster state and applies the difference: declarative." },
        { pre: "kubectl rollout", ok: "undo", post: "deploy/app   # back to the previous version", perche: "The Deployment keeps its previous revisions: a rollback is one command." },
        { pre: "kubectl", ok: "get", post: "pods   # list the pods", perche: "get to list, describe for detail and events (that's where you find out why a pod won't start)." },
      ])} />
      <Takeaway>{T(
        <>Kubernetes = <span className="text-white">stato desiderato + un loop che lo insegue</span>. Pensa in oggetti: Deployment (cosa gira, quante copie), Service (come lo trovi),
        Ingress (come ci arrivi da fuori), Secret/ConfigMap (con che config). I pod sono usa-e-getta. La liveness non guarda mai le dipendenze. E prima di adottarlo
        chiediti se un PaaS non ti dà il 90% del risultato al 10% del costo operativo.</>,
        <>Kubernetes = <span className="text-white">desired state + a loop that chases it</span>. Think in objects: Deployment (what runs, how many copies), Service (how you find it),
        Ingress (how you reach it from outside), Secret/ConfigMap (with what config). Pods are disposable. Liveness never looks at dependencies. And before adopting it,
        ask yourself whether a PaaS gives you 90% of the result at 10% of the operational cost.</>
      )}</Takeaway>
    </div>
  );
}

/* ==========================================================================
   INFRASTRUTTURA · 3 — Terraform & IaC
   ========================================================================== */

const TF_REAL = {
  "aws_instance.web": { ami: "ubuntu-22.04", instance_type: "t3.small", tag_env: "prod" },
  "aws_s3_bucket.logs": { bucket: "irio-logs" },
  "aws_db_instance.old_reports": { engine: "postgres", instance_class: "db.t3.micro" },
};
const TF_SYM = { create: ["+", "text-emerald-300", "will be created"], update: ["~", "text-amber-300", "will be updated in-place"], replace: ["-/+", "text-red-300", "must be replaced"], delete: ["-", "text-red-300", "will be destroyed"] };

function TfPlan() {
  const [cfg, setCfg] = useState({ medium: false, ami24: false, fatture: false, dropDb: false, drift: false });
  const t = (k) => setCfg((c) => ({ ...c, [k]: !c[k] }));
  const real = useMemo(() => (cfg.drift ? { ...TF_REAL, "aws_instance.web": { ...TF_REAL["aws_instance.web"], tag_env: "test" } } : TF_REAL), [cfg.drift]);
  const inv = T("fatture", "invoices");
  const desired = useMemo(() => {
    const d = {
      "aws_instance.web": { ami: cfg.ami24 ? "ubuntu-24.04" : "ubuntu-22.04", instance_type: cfg.medium ? "t3.medium" : "t3.small", tag_env: "prod" },
      "aws_s3_bucket.logs": { bucket: "irio-logs" },
    };
    if (!cfg.dropDb) d["aws_db_instance.old_reports"] = TF_REAL["aws_db_instance.old_reports"];
    if (cfg.fatture) d[`aws_s3_bucket.${inv}`] = { bucket: `irio-${inv}` };
    return d;
  }, [cfg, inv]);
  const ops = plan(real, desired);
  const sum = planSummary(ops);
  const toggles = [
    ["medium", "instance_type: t3.small → t3.medium"],
    ["ami24", "ami: Ubuntu 22.04 → 24.04"],
    ["fatture", T("aggiungi il bucket «fatture»", "add the “invoices” bucket")],
    ["dropDb", T("togli dal file il DB old_reports", "remove the old_reports DB from the file")],
    ["drift", T("qualcuno ha cambiato a mano il tag env in console", "someone changed the env tag by hand in the console")],
  ];
  const hcl = Object.entries(desired).map(([addr, a]) => {
    const [type, name] = addr.split(".");
    const body = Object.entries(a).map(([k, v]) => (k === "tag_env" ? `  tags = { Env = "${v}" }` : `  ${k} = "${v}"`)).join("\n");
    return `resource "${type}" "${name}" {\n${body}\n}`;
  }).join("\n\n");
  return (
    <Card>
      <Label>{T("modifica il file (o il mondo) · il plan si ricalcola", "change the file (or the world) · the plan recalculates")}</Label>
      <div className="grid sm:grid-cols-2 gap-1.5 mb-3">
        {toggles.map(([k, l]) => (
          <button key={k} onClick={() => t(k)} className={`text-left text-[12.5px] rounded-lg border px-3 py-2 flex items-center gap-2 transition-colors ${cfg[k] ? (k === "drift" ? "border-amber-700 bg-amber-950 text-amber-100" : "border-indigo-600 bg-indigo-950 text-indigo-100") : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600"}`}>
            {cfg[k] ? <CheckSquare size={13} className="shrink-0" /> : <Square size={13} className="shrink-0 text-zinc-600" />}{l}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><Label>{T("main.tf (il desiderato)", "main.tf (the desired state)")}</Label><Code>{hcl}</Code></div>
        <div>
          <Label>$ terraform plan</Label>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-[12px] leading-relaxed min-h-[120px]">
            {ops.length === 0 && <div className="text-emerald-300">No changes. Your infrastructure matches the configuration.</div>}
            {ops.map((o) => {
              const [sym, cls, txt] = TF_SYM[o.op];
              return (
                <div key={o.addr} className="mb-2">
                  <div className="text-zinc-500"># {o.addr} {txt}</div>
                  <div className={cls}>{sym} {o.addr.replace(".", ' "')}" {"{"}</div>
                  {o.diff.map((d) => (
                    <div key={d.k} className={`pl-4 ${cls}`}>{o.op === "create" ? "+" : "~"} {d.k} = {d.from != null && o.op !== "create" ? `"${d.from}" → ` : ""}"{d.to ?? "null"}"{d.forces && <span className="text-red-400"> # forces replacement</span>}</div>
                  ))}
                  <div className={cls}>{"}"}</div>
                </div>
              );
            })}
            <div className="text-zinc-300 mt-2">Plan: <span className="text-emerald-300">{sum.add} to add</span>, <span className="text-amber-300">{sum.change} to change</span>, <span className="text-red-300">{sum.destroy} to destroy</span>.</div>
          </div>
        </div>
      </div>
      {cfg.drift && <p className="text-[12px] text-amber-300 mt-2 leading-relaxed">{T(
        <>Drift: il file dice <span className="font-mono">Env = "prod"</span>, il mondo dice <span className="font-mono">"test"</span>. Il prossimo apply rimette «prod» e cancella la modifica fatta a mano — senza chiedere a chi l'ha fatta.</>,
        <>Drift: the file says <span className="font-mono">Env = "prod"</span>, the world says <span className="font-mono">"test"</span>. The next apply puts “prod” back and wipes the manual change — without asking whoever made it.</>
      )}</p>}
      {cfg.ami24 && <p className="text-[12px] text-red-300 mt-2 leading-relaxed">{T(
        <>L'ami non si cambia su un'istanza esistente: <span className="font-mono">-/+</span> = distrugge e ricrea. Nuova VM, nuovo IP, disco locale perso. Leggi il plan prima dell'apply.</>,
        <>You can't change the ami of an existing instance: <span className="font-mono">-/+</span> = destroy and recreate. New VM, new IP, local disk lost. Read the plan before the apply.</>
      )}</p>}
    </Card>
  );
}

function TerraformModule() {
  return (
    <div className="space-y-4">
      <Lead>{T(
        <><span className="text-white font-medium">Infrastructure as Code</span>: invece di cliccare nella console di AWS descrivi in un file cosa deve esistere — una VM, un bucket, un
        database. Terraform confronta il file con ciò che esiste davvero e ti mostra il <span className="text-white font-medium">piano</span> — cosa creerà, modificherà, distruggerà —
        prima di toccare qualcosa. È il <span className="font-mono">git diff</span> dell'infrastruttura, e ti dà la cosa che la console non ti darà mai: staging e prod
        costruiti dallo <span className="text-white">stesso</span> codice.</>,
        <><span className="text-white font-medium">Infrastructure as Code</span>: instead of clicking around the AWS console you describe in a file what must exist — a VM, a bucket, a
        database. Terraform compares the file with what actually exists and shows you the <span className="text-white font-medium">plan</span> — what it will create, change, destroy —
        before touching anything. It's the <span className="font-mono">git diff</span> of infrastructure, and it gives you the one thing the console never will: staging and prod
        built from the <span className="text-white">same</span> code.</>
      )}</Lead>
      <Analogy>{T(
        <>La lista della spesa e il frigo. Il file <span className="font-mono">.tf</span> è la lista di ciò che deve esserci; lo <span className="text-zinc-100">state</span> è
        l'inventario dell'ultimo controllo. <span className="text-zinc-100">plan</span> confronta: «compra il latte, butta lo yogurt scaduto». <span className="text-zinc-100">apply</span> va a fare la spesa.</>,
        <>The shopping list and the fridge. The <span className="font-mono">.tf</span> file is the list of what should be there; the <span className="text-zinc-100">state</span> is
        the inventory from the last check. <span className="text-zinc-100">plan</span> compares: “buy milk, bin the expired yoghurt”. <span className="text-zinc-100">apply</span> goes shopping.</>
      )}</Analogy>
      <Predict
        question={T("Nel file cambi l'ami (l'immagine) della VM di produzione e lanci terraform apply. Cosa succede alla VM?", "In the file you change the ami (the image) of the production VM and run terraform apply. What happens to the VM?")}
        options={T(["Viene aggiornata al volo, senza interruzione", "Viene distrutta e ricreata: nuova VM, nuovo IP, disco locale perso", "Terraform si rifiuta: l'immagine non si può cambiare"], ["It's updated on the fly, with no interruption", "It's destroyed and recreated: new VM, new IP, local disk lost", "Terraform refuses: the image can't be changed"])}
        answer={1}
        explain={T("Alcuni attributi non si cambiano su una risorsa esistente, e l'immagine di un'istanza è uno di questi. Il plan lo segna -/+ con «forces replacement». Per questo il plan si legge riga per riga.", "Some attributes can't be changed on an existing resource, and an instance's image is one of them. The plan marks it -/+ with “forces replacement”. That's why you read the plan line by line.")}
      />
      <TfPlan key={langKey()} />
      <Card>
        <Label>{T("il ciclo di vita", "the lifecycle")}</Label>
        <Code>{T(`terraform init       # scarica i provider, collega il backend dello state
terraform plan       # il diff:  +  crea   ~  modifica   -/+  ricrea   -  distrugge
terraform apply      # esegue il piano (chiede conferma)
terraform destroy    # distrugge tutto ciò che è nello state

# stesso codice, ambienti diversi
terraform apply -var-file=staging.tfvars
terraform apply -var-file=prod.tfvars`, `terraform init       # downloads the providers, connects the state backend
terraform plan       # the diff:  +  create   ~  change   -/+  recreate   -  destroy
terraform apply      # runs the plan (asks for confirmation)
terraform destroy    # destroys everything in the state

# same code, different environments
terraform apply -var-file=staging.tfvars
terraform apply -var-file=prod.tfvars`)}</Code>
      </Card>
      <Note tone="amber" icon={AlertTriangle}>{T(
        <><span className="font-medium">Lo state.</span> <span className="font-mono">terraform.tfstate</span> collega ogni risorsa del file al suo id reale
        (<span className="font-mono">aws_instance.web</span> → <span className="font-mono">i-0abc…</span>). Va in un <span className="text-white">backend remoto con lock</span> (S3 +
        lock, Terraform Cloud): mai in git — contiene segreti in chiaro — e mai due apply insieme sullo stesso state.</>,
        <><span className="font-medium">The state.</span> <span className="font-mono">terraform.tfstate</span> links each resource in the file to its real id
        (<span className="font-mono">aws_instance.web</span> → <span className="font-mono">i-0abc…</span>). It goes in a <span className="text-white">remote backend with a lock</span> (S3 +
        lock, Terraform Cloud): never in git — it holds secrets in plain text — and never two applies at once on the same state.</>
      )}</Note>
      <Note tone="red" icon={Power}>{T(
        <>Togli una risorsa dal file e Terraform la <span className="text-white">distrugge</span>. Sulle risorse che non devono morire (il DB di prod) si mette
        <span className="font-mono"> lifecycle {"{"} prevent_destroy = true {"}"}</span>: il plan fallisce invece di cancellare.</>,
        <>Remove a resource from the file and Terraform <span className="text-white">destroys</span> it. On resources that must never die (the prod DB) you add
        <span className="font-mono"> lifecycle {"{"} prevent_destroy = true {"}"}</span>: the plan fails instead of deleting.</>
      )}</Note>
      <ScegliForma id="tf-simbolo" titolo={T("Che simbolo mostra il plan?", "Which symbol does the plan show?")} items={T([
        { pre: "Aggiungi un bucket nuovo al file →", opts: ["+", "~", "-/+", "-"], ok: "+", perche: "Risorsa nel file ma non nello state: create." },
        { pre: "Cambi instance_type da t3.small a t3.medium →", opts: ["+", "~", "-/+", "-"], ok: "~", perche: "In-place: AWS ferma e riavvia l'istanza, ma resta la stessa risorsa con lo stesso id (breve interruzione, niente dati persi sul volume EBS)." },
        { pre: "Cambi il nome di un bucket S3 →", opts: ["+", "~", "-/+", "-"], ok: "-/+", perche: "Il nome di un bucket è immutabile: ricreazione. E se il bucket non è vuoto, la distruzione fallisce (a meno di force_destroy)." },
        { pre: "Togli dal file la risorsa del database →", opts: ["+", "~", "-/+", "-"], ok: "-", perche: "Nello state ma non più nel file: destroy. Per questo esiste prevent_destroy." },
      ], [
        { pre: "You add a new bucket to the file →", opts: ["+", "~", "-/+", "-"], ok: "+", perche: "In the file but not in the state: create." },
        { pre: "You change instance_type from t3.small to t3.medium →", opts: ["+", "~", "-/+", "-"], ok: "~", perche: "In-place: AWS stops and restarts the instance, but it stays the same resource with the same id (short interruption, no data lost on the EBS volume)." },
        { pre: "You change the name of an S3 bucket →", opts: ["+", "~", "-/+", "-"], ok: "-/+", perche: "A bucket's name is immutable: recreation. And if the bucket isn't empty, the destroy fails (unless force_destroy)." },
        { pre: "You remove the database resource from the file →", opts: ["+", "~", "-/+", "-"], ok: "-", perche: "In the state but no longer in the file: destroy. That's what prevent_destroy is for." },
      ])} />
      <Cloze id="tf-parole" titolo={T("Il vocabolario", "The vocabulary")} items={T([
        { pre: "terraform", ok: "plan", post: "   # mostra cosa cambierebbe, senza toccare nulla", perche: "Il plan è gratuito e sicuro: in CI si lancia su ogni PR e si allega alla review." },
        { pre: "Il file che collega risorse del codice e id reali: terraform.", ok: "tfstate", perche: "Perdi lo state e Terraform non sa più cosa possiede: vorrebbe ricreare tutto." },
        { pre: "Una modifica fatta a mano in console, che il codice non conosce:", ok: "drift", perche: "Il plan la mostra come differenza; l'apply la annulla." },
      ], [
        { pre: "terraform", ok: "plan", post: "   # shows what would change, without touching anything", perche: "The plan is free and safe: in CI it runs on every PR and gets attached to the review." },
        { pre: "The file that links resources in the code to real ids: terraform.", ok: "tfstate", perche: "Lose the state and Terraform no longer knows what it owns: it would want to recreate everything." },
        { pre: "A manual change made in the console that the code doesn't know about:", ok: "drift", perche: "The plan shows it as a difference; the apply reverts it." },
      ])} />
      <Takeaway>{T(
        <>IaC = <span className="text-white">il file è la verità, la console è in sola lettura</span>. Ciclo: plan → leggi → apply. Nel plan cerca <span className="font-mono">-/+</span> e
        <span className="font-mono"> -</span>: sono le righe che fanno danni. State remoto con lock, mai in git. Ogni click in console è drift che il prossimo apply cancellerà.</>,
        <>IaC = <span className="text-white">the file is the truth, the console is read-only</span>. Loop: plan → read → apply. In the plan look for <span className="font-mono">-/+</span> and
        <span className="font-mono"> -</span>: those are the lines that do damage. Remote state with a lock, never in git. Every click in the console is drift the next apply will wipe.</>
      )}</Takeaway>
    </div>
  );
}

/* ==========================================================================
   INFRASTRUTTURA · 4 — Dev, staging, prod
   ========================================================================== */

const AMB = {
  dev: {
    dati: [["seed finti", "Uno script ripetibile (make seed): 20 utenti e qualche ordine. Mai una copia di prod sul laptop: sono dati personali su un portatile."],
      ["fake seed data", "A repeatable script (make seed): 20 users and a few orders. Never a copy of prod on a laptop: that's personal data on a portable machine."]],
    segreti: [["chiavi di test", "Stripe in modalità test (sk_test_…), sandbox dei provider. Nel .env locale, che sta in .gitignore."],
      ["test keys", "Stripe in test mode (sk_test_…), provider sandboxes. In the local .env, which is in .gitignore."]],
    deploy: [["a ogni salvataggio", "Hot reload o docker compose up. Nessun cancello: qui si rompe."],
      ["on every save", "Hot reload or docker compose up. No gate: this is where things break."]],
    accesso: [["solo tu", "Il tuo laptop, o un ambiente personale."],
      ["just you", "Your laptop, or a personal environment."]],
    osserv: [["console e debugger", "Log verbosi (DEBUG), stack trace a schermo."],
      ["console and debugger", "Verbose logs (DEBUG), stack traces on screen."]],
    costo: [["~zero", "Il laptop, o un'istanza piccola spenta la notte."],
      ["~zero", "The laptop, or a small instance switched off at night."]],
  },
  preview: {
    dati: [["seed o branch del DB", "Un ambiente usa-e-getta per ogni PR (Vercel, Render): DB effimero con seed, o un branch del DB (Neon)."],
      ["seed or DB branch", "A throwaway environment for each PR (Vercel, Render): an ephemeral DB with seed data, or a DB branch (Neon)."]],
    segreti: [["come staging", "Mai chiavi di prod in un ambiente che nasce da una PR: chiunque apra una PR potrebbe leggerle."],
      ["like staging", "Never prod keys in an environment born from a PR: anyone who opens a PR could read them."]],
    deploy: [["a ogni push sulla PR", "Un URL per PR: chi fa review clicca e prova invece di immaginare."],
      ["on every push to the PR", "One URL per PR: reviewers click and try instead of imagining."]],
    accesso: [["chi fa review", "Link protetto: product e design vedono la modifica prima del merge."],
      ["reviewers", "A protected link: product and design see the change before the merge."]],
    osserv: [["minima", "Log base. Muore alla chiusura della PR."],
      ["minimal", "Basic logs. It dies when the PR is closed."]],
    costo: [["a ore", "Scala a zero o si distrugge dopo il merge."],
      ["by the hour", "Scales to zero or is destroyed after the merge."]],
  },
  staging: {
    dati: [["prod anonimizzata", "Stessa taglia e forma di prod, con nomi, email e IBAN mascherati. Migration e query lente si provano solo qui."],
      ["anonymised prod", "Same size and shape as prod, with names, emails and IBANs masked. Migrations and slow queries can only be tested here."]],
    segreti: [["chiavi separate", "Stessi provider, credenziali diverse da prod. Chiave condivisa staging/prod = un test che addebita un cliente vero."],
      ["separate keys", "Same providers, credentials different from prod. A key shared between staging and prod = a test that charges a real customer."]],
    deploy: [["a ogni merge su main", "La CI ci porta l'immagine appena i test passano: è il cancello prima di prod."],
      ["on every merge to main", "CI ships the image there as soon as the tests pass: it's the gate before prod."]],
    accesso: [["team e QA", "Dietro login o VPN: non indicizzato, non raggiungibile dai clienti."],
      ["team and QA", "Behind a login or VPN: not indexed, not reachable by customers."]],
    osserv: [["come prod", "Stessi dashboard e alert, soglie più morbide. Se il monitoring lo provi in prod, è tardi."],
      ["like prod", "Same dashboards and alerts, softer thresholds. If you first test your monitoring in prod, it's too late."]],
    costo: [["ridotto", "Stessa architettura, taglie minori. Architettura diversa = test inutile."],
      ["reduced", "Same architecture, smaller sizes. A different architecture = a useless test."]],
  },
  prod: {
    dati: [["dati veri", "Accesso minimo, audit log, backup testati: un backup mai ripristinato non è un backup."],
      ["real data", "Minimal access, audit logs, tested backups: a backup that's never been restored isn't a backup."]],
    segreti: [["secret manager", "Vault o AWS Secrets Manager, ruotati, letti solo dal servizio che li usa. Nessuno li incolla in chat."],
      ["secret manager", "Vault or AWS Secrets Manager, rotated, read only by the service that uses them. Nobody pastes them into chat."]],
    deploy: [["promozione con approvazione", "La STESSA immagine provata in staging (stesso digest), non una ricostruita. Rilascio rolling/canary, rollback pronto."],
      ["promotion with approval", "The SAME image tested in staging (same digest), not a rebuilt one. Rolling/canary release, rollback ready."]],
    accesso: [["gli utenti", "Chi può fare deploy o entrare nel DB è una lista corta e tracciata."],
      ["the users", "Who can deploy or get into the DB is a short, tracked list."]],
    osserv: [["alert che svegliano", "SLO, reperibilità, log strutturati a livello INFO: niente DEBUG (costa e rischia di loggare dati personali)."],
      ["alerts that wake people up", "SLOs, on-call, structured logs at INFO level: no DEBUG (it's costly and risks logging personal data)."]],
    costo: [["pieno", "Dimensionato per il picco, su più zone."],
      ["full", "Sized for the peak, across several zones."]],
  },
};
const AMB_CELLE = memoByLang(() => {
  const out = {};
  for (const [a, row] of Object.entries(AMB)) for (const [b, pair] of Object.entries(row)) {
    const [forma, nota] = T(pair[0], pair[1]);
    out[`${a}|${b}`] = { forma, nota };
  }
  return out;
});

const STAGES = ["build", "staging", "prod"];

function Promozione() {
  const [at, setAt] = useState(0);
  const [rebuild, setRebuild] = useState(false);
  const digest = (i) => (rebuild && i === 2 ? "sha256:4be1…c07" : "sha256:9f2c…a41");
  return (
    <Card>
      <Label>{T("build once, deploy many · promuovi la stessa immagine", "build once, deploy many · promote the same image")}</Label>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {STAGES.map((s, i) => (
          <div key={s} className={`rounded-lg border px-3 py-2 ${i <= at ? (i === 2 && rebuild ? "border-red-800 bg-red-950/40" : "border-emerald-900 bg-emerald-950/30") : "border-zinc-800 bg-zinc-950 opacity-50"}`}>
            <div className="font-mono text-[12px] text-zinc-200">{s}</div>
            <div className="font-mono text-[10.5px] text-zinc-400 mt-1">{i <= at ? `app@${digest(i)}` : "—"}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <button disabled={at >= 2} onClick={() => setAt((x) => x + 1)} className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white text-sm">{T("promuovi ▶", "promote ▶")}</button>
        <button onClick={() => setAt(0)} className="text-zinc-500 hover:text-zinc-300"><RotateCcw size={13} /></button>
        <label className="flex items-center gap-2 text-xs text-zinc-400 font-mono ml-auto cursor-pointer">
          <input type="checkbox" checked={rebuild} onChange={(e) => setRebuild(e.target.checked)} className="accent-red-500" /> {T("per prod ricostruisco l'immagine", "I rebuild the image for prod")}
        </label>
      </div>
      {at === 2 && (
        <p className={`text-[12.5px] mt-2 leading-relaxed ${rebuild ? "text-red-300" : "text-emerald-300"}`}>
          {rebuild
            ? T("Digest diverso: in prod gira un'immagine che nessuno ha mai provato. Una dipendenza aggiornata nel frattempo, un'immagine base cambiata, e staging non ti ha protetto da niente.",
                "Different digest: prod is running an image nobody has ever tested. A dependency updated in the meantime, a changed base image, and staging protected you from nothing.")
            : T("Stesso digest dall'inizio alla fine: ciò che è stato provato in staging è bit per bit ciò che gira in prod. Cambiano solo le variabili d'ambiente.",
                "Same digest from start to finish: what was tested in staging is, bit for bit, what runs in prod. Only the environment variables change.")}
        </p>
      )}
    </Card>
  );
}

function AmbientiModule() {
  return (
    <div className="space-y-4">
      <Lead>{T(
        <>Più copie dello stesso sistema con scopi diversi: <span className="text-white font-medium">dev</span> per rompere, <span className="text-white font-medium">staging</span> per
        provare come se fosse vero, <span className="text-white font-medium">prod</span> per gli utenti (più i <span className="text-white">preview</span>, uno per PR). La regola che
        le tiene insieme: <span className="text-white">stessa immagine, stessa infrastruttura</span> — cambiano solo config, dati e chi le può toccare. Ogni differenza tra
        staging e prod è un bug che scoprirai in prod.</>,
        <>Several copies of the same system with different purposes: <span className="text-white font-medium">dev</span> for breaking things, <span className="text-white font-medium">staging</span> for
        rehearsing as if it were real, <span className="text-white font-medium">prod</span> for the users (plus <span className="text-white">previews</span>, one per PR). The rule that
        holds them together: <span className="text-white">same image, same infrastructure</span> — only config, data and who can touch them change. Every difference between
        staging and prod is a bug you'll discover in prod.</>
      )}</Lead>
      <Analogy>{T(
        <>Il teatro. Dev sono le prove in sala col copione in mano: ti fermi e ricominci. Staging è la <span className="text-zinc-100">prova generale</span>, con costumi, luci e
        palco veri ma senza pubblico. Prod è la prima. Una prova generale in un altro teatro, con altre luci, non ti dice niente sulla prima.</>,
        <>The theatre. Dev is rehearsal in the practice room, script in hand: you stop and start again. Staging is the <span className="text-zinc-100">dress rehearsal</span>, with real costumes, lights and
        stage but no audience. Prod is opening night. A dress rehearsal in a different theatre, with different lights, tells you nothing about opening night.</>
      )}</Analogy>
      <Predict
        question={T("Una migration funziona in dev e in staging, ma in prod blocca la tabella orders per 4 minuti. La causa più probabile?", "A migration works in dev and in staging, but in prod it locks the orders table for 4 minutes. The most likely cause?")}
        options={T(["Un bug di Postgres presente solo in prod", "Staging ha 2.000 righe, prod 40 milioni: stesso codice, dati di taglia diversa", "In prod la migration è partita due volte"], ["A Postgres bug that only exists in prod", "Staging has 2,000 rows, prod 40 million: same code, data of a different size", "In prod the migration ran twice"])}
        answer={1}
        explain={T("È il divario più comune: il codice è uguale, i dati no. Per questo staging si popola con dati di taglia realistica (anonimizzati) e le migration pesanti si provano lì. Vedi «Migrazioni senza downtime».", "It's the most common gap: the code is the same, the data isn't. That's why staging is filled with realistically sized (anonymised) data and heavy migrations are tested there. See “Zero-downtime migrations”.")}
      />
      <TabellaViva titolo={T("Quattro ambienti, sei aspetti", "Four environments, six aspects")} intro={T("Scegli un ambiente e un aspetto: cosa cambia e perché.", "Pick an environment and an aspect: what changes and why.")}
        assi={{
          a: { label: T("ambiente", "environment"), opts: [{ k: "dev", label: "dev" }, { k: "preview", label: T("preview (per PR)", "preview (per PR)") }, { k: "staging", label: "staging" }, { k: "prod", label: "prod" }] },
          b: { label: T("aspetto", "aspect"), opts: [{ k: "dati", label: T("dati", "data") }, { k: "segreti", label: T("segreti", "secrets") }, { k: "deploy", label: T("quando si deploya", "when it's deployed") }, { k: "accesso", label: T("chi accede", "who has access") }, { k: "osserv", label: T("osservabilità", "observability") }, { k: "costo", label: T("costo", "cost") }] },
        }}
        celle={AMB_CELLE()} />
      <Promozione />
      <Card>
        <Label>{T("stessa immagine, variabili diverse", "same image, different variables")}</Label>
        <Code>{`# staging
DATABASE_URL=postgres://staging-db.internal/app
STRIPE_KEY=sk_test_…
LOG_LEVEL=info
FEATURE_NEW_CHECKOUT=true

# ${T("prod — iniettate dal secret manager, non da un file", "prod — injected by the secret manager, not from a file")}
DATABASE_URL=postgres://prod-db.internal/app
STRIPE_KEY=sk_live_…
LOG_LEVEL=info
FEATURE_NEW_CHECKOUT=false`}</Code>
      </Card>
      <Note tone="red" icon={AlertTriangle}>{T(
        <><span className="font-mono">if (env === "production")</span> nel codice è un campanello d'allarme: il comportamento deve dipendere dalla <span className="text-white">config</span>
        (un flag, un URL), non dal nome dell'ambiente. Altrimenti staging esegue codice diverso da prod e non prova niente.</>,
        <><span className="font-mono">if (env === "production")</span> in the code is a red flag: behaviour should depend on <span className="text-white">config</span>
        (a flag, a URL), not on the name of the environment. Otherwise staging runs different code from prod and proves nothing.</>
      )}</Note>
      <ScegliForma id="amb-quale" titolo={T("Quale ambiente?", "Which environment?")} items={T([
        { pre: "Il PM vuole vedere la nuova pagina prezzi prima del merge →", opts: ["dev", "preview", "staging", "prod"], ok: "preview", perche: "Un URL per quella PR, isolato, che sparisce dopo il merge." },
        { pre: "Provare la migration che aggiunge un indice su 40 milioni di righe →", opts: ["dev", "preview", "staging", "prod"], ok: "staging", perche: "Serve la taglia vera dei dati: in dev l'indice si crea in 30 ms e non ti dice nulla." },
        { pre: "Riprodurre un bug segnalato da un cliente →", opts: ["copio i suoi dati sul laptop", "staging con dati anonimizzati"], ok: "staging con dati anonimizzati", perche: "I dati del cliente non lasciano l'ambiente protetto. Se serve il suo caso esatto, lo si ricrea anonimizzato." },
        { pre: "Dove si usa sk_live_ …?", opts: ["staging", "prod", "entrambi"], ok: "prod", perche: "Solo prod. Una chiave live in staging vuol dire che un test può muovere soldi veri." },
      ], [
        { pre: "The PM wants to see the new pricing page before the merge →", opts: ["dev", "preview", "staging", "prod"], ok: "preview", perche: "One URL for that PR, isolated, which disappears after the merge." },
        { pre: "Test the migration that adds an index on 40 million rows →", opts: ["dev", "preview", "staging", "prod"], ok: "staging", perche: "You need the real data size: in dev the index builds in 30 ms and tells you nothing." },
        { pre: "Reproduce a bug a customer reported →", opts: ["copy their data to my laptop", "staging with anonymised data"], ok: "staging with anonymised data", perche: "Customer data doesn't leave the protected environment. If you need their exact case, you recreate it anonymised." },
        { pre: "Where is sk_live_ … used?", opts: ["staging", "prod", "both"], ok: "prod", perche: "Prod only. A live key in staging means a test can move real money." },
      ])} />
      <Riordina id="amb-promozione" titolo={T("Dal merge a prod", "From merge to prod")} items={T([
        { it: "La strada di una modifica", seq: ["merge su main", "CI: test e build dell'immagine", "deploy su staging", "smoke test e QA", "approvazione", "la stessa immagine in prod"], perche: "L'immagine si costruisce una volta sola, all'inizio. Da lì in poi si promuove, non si ricostruisce." },
      ], [
        { it: "The journey of a change", seq: ["merge to main", "CI: tests and image build", "deploy to staging", "smoke tests and QA", "approval", "the same image in prod"], perche: "The image is built once, at the start. From there on it's promoted, never rebuilt." },
      ])} />
      <Takeaway>{T(
        <>Parità prima di tutto: <span className="text-white">stessa immagine (stesso digest), stessa infrastruttura, dati di taglia vera in staging</span>. Diversi solo config,
        segreti e accessi — con chiavi separate per ogni ambiente, sempre. E il codice non chiede mai «in che ambiente sono?»: legge la config.</>,
        <>Parity above all: <span className="text-white">same image (same digest), same infrastructure, real-sized data in staging</span>. Only config,
        secrets and access differ — with separate keys for every environment, always. And the code never asks “which environment am I in?”: it reads the config.</>
      )}</Takeaway>
    </div>
  );
}

/* ==========================================================================
   INFRASTRUTTURA · 5 — Feature flag
   ========================================================================== */

const FLAG_USERS = [
  ["u101", "Anna", "anna@azienda.it", "IT"], ["u102", "Bruno", "bruno@gmail.com", "IT"], ["u103", "Chiara", "chiara@libero.it", "IT"], ["u104", "Dario", "dario@azienda.it", "IT"],
  ["u105", "Elena", "elena@outlook.com", "DE"], ["u106", "Fabio", "fabio@gmail.com", "IT"], ["u107", "Giulia", "giulia@gmail.com", "ES"], ["u108", "Hans", "hans@web.de", "DE"],
  ["u109", "Irene", "irene@gmail.com", "IT"], ["u110", "Luca", "luca@tiscali.it", "IT"], ["u111", "Marta", "marta@gmail.com", "FR"], ["u112", "Nico", "nico@gmail.com", "IT"],
  ["u113", "Olga", "olga@mail.ru", "DE"], ["u114", "Paolo", "paolo@gmail.com", "IT"], ["u115", "Rita", "rita@yahoo.it", "IT"], ["u116", "Sara", "sara@gmail.com", "ES"],
  ["u117", "Tommaso", "tommy@gmail.com", "IT"], ["u118", "Ugo", "ugo@libero.it", "IT"], ["u119", "Vera", "vera@gmail.com", "DE"], ["u120", "Zeno", "zeno@gmail.com", "IT"],
].map(([id, nome, email, country]) => ({ id, nome, email, country }));

function FlagLab() {
  const [on, setOn] = useState(true);
  const [staff, setStaff] = useState(true);
  const [soloIt, setSoloIt] = useState(false);
  const [rollout, setRollout] = useState(20);
  const [random, setRandom] = useState(false);
  const [req, setReq] = useState(0); // «richieste»: in modalità random ogni refresh ripesca
  const flag = { key: "new-checkout", on, staffDomain: staff ? "azienda.it" : null, countries: soloIt ? ["IT"] : [], rollout };
  const res = useMemo(() => FLAG_USERS.map((u) => {
    if (!random) return { u, ...evaluate(flag, u) };
    const r = Math.floor(Math.random() * 100);
    return { u, on: on && r < rollout, why: `random ${r}` };
  }), [on, staff, soloIt, rollout, random, req]); // eslint-disable-line react-hooks/exhaustive-deps
  const n = res.filter((r) => r.on).length;
  return (
    <Card>
      <Label>{T("flag «new-checkout» · 20 utenti veri, valutati come farebbe l'SDK", "flag “new-checkout” · 20 real users, evaluated the way the SDK would")}</Label>
      <div className="grid sm:grid-cols-2 gap-2 mb-3 text-[12.5px]">
        {[[on, setOn, T("flag acceso (kill switch)", "flag on (kill switch)")], [staff, setStaff, T("dipendenti @azienda.it sempre dentro", "employees @azienda.it always in")], [soloIt, setSoloIt, T("solo utenti in Italia", "users in Italy only")], [random, setRandom, T("sbaglio apposta: Math.random() invece dell'hash", "deliberate mistake: Math.random() instead of the hash")]].map(([v, set, l]) => (
          <button key={l} onClick={() => set(!v)} className={`text-left rounded-lg border px-3 py-2 flex items-center gap-2 transition-colors ${v ? "border-indigo-600 bg-indigo-950 text-indigo-100" : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600"}`}>
            {v ? <CheckSquare size={13} className="shrink-0" /> : <Square size={13} className="shrink-0 text-zinc-600" />}{l}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-mono text-zinc-500 shrink-0">rollout {rollout}%</span>
        <input type="range" min={0} max={100} step={5} value={rollout} onChange={(e) => setRollout(+e.target.value)} className="flex-1 accent-indigo-500" />
        <button onClick={() => setReq((x) => x + 1)} className="px-3 py-1.5 rounded-md border border-zinc-700 text-zinc-300 text-xs hover:border-indigo-600 shrink-0">{T("nuova richiesta ↻", "new request ↻")}</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {res.map(({ u, on: vis, why }) => (
          <div key={u.id} className={`rounded-md border px-2 py-1.5 ${vis ? "border-emerald-800 bg-emerald-950/50" : "border-zinc-800 bg-zinc-950"}`}>
            <div className="flex items-center gap-1"><span className={`text-[12px] ${vis ? "text-emerald-200" : "text-zinc-400"}`}>{u.nome}</span><span className="ml-auto font-mono text-[9.5px] text-zinc-600">{u.country}</span></div>
            <div className="font-mono text-[9.5px] text-zinc-500 leading-tight">{why}</div>
          </div>
        ))}
      </div>
      <p className={`text-[12.5px] mt-3 leading-relaxed ${random ? "text-red-300" : "text-zinc-400"}`}>
        {random
          ? T("Premi «nuova richiesta»: la stessa persona vede il checkout nuovo, poi quello vecchio, poi di nuovo il nuovo. Carrello che cambia faccia a ogni refresh, metriche dell'esperimento inutilizzabili.",
              "Hit “new request”: the same person sees the new checkout, then the old one, then the new one again. A cart that changes face on every refresh, and experiment metrics you can't use.")
          : T(<>Vedono il checkout nuovo <span className="text-white">{n}/20</span>. Il bucket è <span className="font-mono">hash("new-checkout:" + userId) % 100</span>: sempre lo stesso per quella persona. Alza il rollout: chi era dentro resta dentro.</>,
              <><span className="text-white">{n}/20</span> see the new checkout. The bucket is <span className="font-mono">hash("new-checkout:" + userId) % 100</span>: always the same for that person. Raise the rollout: whoever was in stays in.</>)}
      </p>
    </Card>
  );
}

function FlagsModule() {
  return (
    <div className="space-y-4">
      <Lead>{T(
        <>Un feature flag <span className="text-white font-medium">separa il deploy dal rilascio</span>: il codice nuovo va in produzione spento, dietro un <span className="font-mono">if</span>,
        e lo accendi dopo — ai dipendenti, poi al 5% degli utenti, poi a tutti — senza un nuovo deploy. Se qualcosa va storto lo spegni in un secondo, invece di fare rollback.</>,
        <>A feature flag <span className="text-white font-medium">separates the deploy from the release</span>: the new code goes to production switched off, behind an <span className="font-mono">if</span>,
        and you turn it on later — for employees, then 5% of users, then everyone — without a new deploy. If something goes wrong you switch it off in a second, instead of rolling back.</>
      )}</Lead>
      <Analogy>{T(
        "Il quadro elettrico. L'impianto (il codice) è già tutto murato; decidi stanza per stanza quando dare corrente. Se una stanza fa scintille abbassi quella levetta, senza togliere la luce a tutta la casa.",
        "The fuse box. The wiring (the code) is already in the walls; you decide room by room when to switch the power on. If one room sparks, you flip that switch, without cutting the lights in the whole house."
      )}</Analogy>
      <Predict
        question={T("Rollout al 10%: Anna vede la feature nuova. Porti il rollout al 30%. Anna la vede ancora?", "Rollout at 10%: Anna sees the new feature. You take the rollout to 30%. Does Anna still see it?")}
        options={T(["Dipende: a ogni valutazione si ripesca a caso", "Sì: con un bucket da hash stabile, il 30% contiene sempre il 10% di prima", "No: cambiando la percentuale si ricomincia da zero"], ["It depends: every evaluation draws at random again", "Yes: with a stable hash bucket, the 30% always contains the earlier 10%", "No: changing the percentage starts over from scratch"])}
        answer={1}
        explain={T("bucket = hash(flag + userId) % 100, fisso per quella persona. 10% = bucket sotto 10; 30% = bucket sotto 30, che include tutti quelli sotto 10. Con un random a ogni richiesta, Anna vedrebbe la feature apparire e sparire a ogni refresh.", "bucket = hash(flag + userId) % 100, fixed for that person. 10% = bucket below 10; 30% = bucket below 30, which includes everyone below 10. With a random draw on every request, Anna would see the feature appear and vanish on every refresh.")}
      />
      <FlagLab key={langKey()} />
      <Card>
        <Label>{T("quattro tipi di flag · durano tempi diversi", "four kinds of flag · they live for different lengths of time")}</Label>
        <Griglia intestazioni={T(["tipo", "a cosa serve", "vita"], ["kind", "what it's for", "lifespan"])} righe={T([
          ["release", "Rilasciare a poco a poco una feature nuova.", "Settimane. Poi si toglie."],
          ["esperimento", "A/B test: due varianti, misuri la conversione.", "Fino alla significatività statistica."],
          ["ops / kill switch", "Spegnere una parte costosa sotto carico (raccomandazioni, export).", "Permanente, e va provato."],
          ["permesso", "Feature del piano Enterprise, beta per un cliente.", "Lunga: è più config che flag."],
        ], [
          ["release", "Roll out a new feature gradually.", "Weeks. Then it's removed."],
          ["experiment", "A/B test: two variants, you measure conversion.", "Until statistical significance."],
          ["ops / kill switch", "Switch off an expensive part under load (recommendations, exports).", "Permanent, and it must be tested."],
          ["permission", "An Enterprise-plan feature, a beta for one customer.", "Long: it's more config than flag."],
        ])} />
      </Card>
      <Card>
        <Label>{T("nel codice · valutazione lato server", "in the code · server-side evaluation")}</Label>
        <Code>{`if (flags.isOn("new-checkout", { userId: user.id, email: user.email, country: user.country })) {
  return newCheckout(cart);
}
return oldCheckout(cart);   // ${T("resta finché il flag non è al 100% da un po'", "stays until the flag has been at 100% for a while")}`}</Code>
      </Card>
      <Note tone="amber" icon={AlertTriangle}>{T(
        <><span className="font-medium">Il debito dei flag.</span> Ogni flag raddoppia i percorsi possibili: 10 flag sono 1.024 combinazioni che nessuno ha provato. Un release flag
        nasce con una data di morte: al 100% da due settimane → togli l'<span className="font-mono">if</span> e il ramo vecchio. Knight Capital, 2012: un flag riciclato riaccese
        codice morto da anni — 440 milioni di dollari persi in 45 minuti.</>,
        <><span className="font-medium">Flag debt.</span> Every flag doubles the possible paths: 10 flags are 1,024 combinations nobody has tested. A release flag
        is born with a date of death: at 100% for two weeks → remove the <span className="font-mono">if</span> and the old branch. Knight Capital, 2012: a recycled flag reactivated
        code that had been dead for years — 440 million dollars lost in 45 minutes.</>
      )}</Note>
      <Note tone="red" icon={KeyRound}>{T(
        <>Un flag valutato <span className="text-white">nel browser</span> è visibile a chiunque apra i DevTools: mai usarlo per nascondere prezzi, feature a pagamento o permessi. Il
        controllo vero sta sul server.</>,
        <>A flag evaluated <span className="text-white">in the browser</span> is visible to anyone who opens DevTools: never use it to hide prices, paid features or permissions. The
        real check lives on the server.</>
      )}</Note>
      <ScegliForma id="flag-tipo" titolo={T("Che tipo di flag?", "What kind of flag?")} items={T([
        { pre: "Spegnere il ricalcolo delle raccomandazioni quando il DB soffre →", opts: ["release", "kill switch", "esperimento"], ok: "kill switch", perche: "Flag operativo, permanente: serve il giorno del picco, quindi va provato prima di quel giorno." },
        { pre: "Checkout nuovo: prima ai dipendenti, poi 5%, 25%, 100% →", opts: ["release", "kill switch", "esperimento"], ok: "release", perche: "Rilascio progressivo; al 100% stabile si rimuove." },
        { pre: "Due pagine prezzi, misuro quale converte di più →", opts: ["release", "permesso", "esperimento"], ok: "esperimento", perche: "Assegnazione stabile (hash!) e una metrica decisa prima di partire." },
      ], [
        { pre: "Switch off the recommendations recompute when the DB is struggling →", opts: ["release", "kill switch", "experiment"], ok: "kill switch", perche: "An ops flag, permanent: you need it on peak day, so it has to be tested before that day." },
        { pre: "New checkout: first employees, then 5%, 25%, 100% →", opts: ["release", "kill switch", "experiment"], ok: "release", perche: "Progressive rollout; once stable at 100% it's removed." },
        { pre: "Two pricing pages, I measure which one converts better →", opts: ["release", "permission", "experiment"], ok: "experiment", perche: "Stable assignment (hash!) and a metric decided before you start." },
      ])} />
      <Riordina id="flag-rollout" titolo={T("Un rollout fatto bene", "A rollout done right")} items={T([
        { it: "Dal merge al codice pulito", seq: ["deploy con il flag spento", "acceso per i dipendenti", "5% degli utenti, guardi le metriche", "50%", "100%", "rimuovi il flag e il codice vecchio"], perche: "Ogni gradino è un momento per guardare errori e metriche. L'ultimo passo è quello che tutti dimenticano." },
      ], [
        { it: "From merge to clean code", seq: ["deploy with the flag off", "on for employees", "5% of users, watch the metrics", "50%", "100%", "remove the flag and the old code"], perche: "Every step is a moment to look at errors and metrics. The last step is the one everybody forgets." },
      ])} />
      <Cloze id="flag-parole" titolo={T("Completa", "Fill in the blank")} items={T([
        { pre: "bucket = hash(flag + userId) %", ok: "100", perche: "Un numero da 0 a 99 fisso per persona e per flag: il rollout è «bucket sotto la percentuale»." },
        { pre: "Un flag permette di separare il deploy dal", ok: "rilascio", perche: "Deploy = il codice è in prod. Rilascio = gli utenti lo vedono. Due momenti, due decisioni." },
      ], [
        { pre: "bucket = hash(flag + userId) %", ok: "100", perche: "A number from 0 to 99, fixed per person and per flag: the rollout is “bucket below the percentage”." },
        { pre: "A flag lets you separate the deploy from the", ok: "release", perche: "Deploy = the code is in prod. Release = users see it. Two moments, two decisions." },
      ])} />
      <Takeaway>{T(
        <><span className="text-white">Deploy ≠ rilascio.</span> Il flag si valuta lato server, con un bucket da hash stabile (così il 30% contiene il 10%). Kill switch per le parti
        costose, provati prima del giorno in cui servono. E ogni release flag ha una data di morte: al 100% → si toglie l'<span className="font-mono">if</span>.</>,
        <><span className="text-white">Deploy ≠ release.</span> The flag is evaluated server-side, with a stable hash bucket (so the 30% contains the 10%). Kill switches for the expensive
        parts, tested before the day you need them. And every release flag has a date of death: at 100% → the <span className="font-mono">if</span> comes out.</>
      )}</Takeaway>
    </div>
  );
}

/* ==========================================================================
   INFRASTRUTTURA · Sfida
   ========================================================================== */

function SfInfraModule() {
  return (
    <div className="space-y-4">
      <Lead>{T(
        <>Chiude il gruppo VM → Kubernetes → Terraform → ambienti → flag. Niente di nuovo da imparare: devi <span className="text-white font-medium">mettere i pezzi insieme</span> e
        accorgerti di quelli di troppo — che è la cosa più difficile.</>,
        <>This wraps up the VM → Kubernetes → Terraform → environments → flags group. Nothing new to learn: you have to <span className="text-white font-medium">put the pieces together</span> and
        spot the ones that don't belong — which is the hardest part.</>
      )}</Lead>
      <Sfida
        brief={T("Un'API Python (FastAPI) + Postgres gira sul tuo laptop. Deve andare in produzione per 2.000 clienti B2B, con un ambiente dove il team prova le modifiche e zero downtime ai rilasci. Scegli i pezzi.",
          "A Python API (FastAPI) + Postgres runs on your laptop. It has to go to production for 2,000 B2B customers, with an environment where the team tests changes and zero downtime on releases. Pick the pieces.")}
        pool={T([
          { id: "img", label: "Immagine Docker costruita una volta in CI", role: "essential", why: "Un solo artefatto (un digest) che gira identico in staging e prod." },
          { id: "stg", label: "Staging con dati anonimizzati di taglia reale", role: "essential", why: "Senza, le migration e le query lente le scopri in prod." },
          { id: "tf", label: "Infrastruttura descritta in Terraform", role: "essential", why: "Staging e prod nascono dallo stesso codice: parità garantita, niente pet." },
          { id: "db", label: "Postgres gestito (RDS/Neon) con backup testati", role: "essential", why: "Backup, patch e failover non sono il tuo mestiere." },
          { id: "sec", label: "Segreti nel secret manager, separati per ambiente", role: "essential", why: "Una chiave di prod in staging è un incidente in attesa." },
          { id: "roll", label: "Rilascio rolling o canary con health check", role: "essential", why: "Zero downtime: le istanze vecchie servono finché le nuove non sono pronte." },
          { id: "k8s", label: "Kubernetes", role: "optional", why: "Funziona, ma per un'API e un DB un PaaS o ECS/Cloud Run ti dà rolling update e scaling senza gestire un cluster. Sensato quando i servizi diventano molti." },
          { id: "flag", label: "Feature flag per le funzioni rischiose", role: "optional", why: "Ottimi per rilasciare a poco a poco; non indispensabili dal giorno uno." },
          { id: "prev", label: "Un preview environment per ogni PR", role: "optional", why: "Accelera la review; si aggiunge quando il team cresce." },
          { id: "ssh", label: "Una VM configurata a mano via SSH", role: "wrong", why: "Un pet: nessuno sa ricostruirla, e staging non le somiglierà mai." },
          { id: "copy", label: "Copia del DB di prod sul laptop per fare i test", role: "wrong", why: "Dati personali di clienti su un portatile: una violazione GDPR in attesa di succedere." },
          { id: "keys", label: "Stesse chiavi API per staging e prod", role: "wrong", why: "Un test in staging può mandare email o addebitare clienti veri." },
          { id: "vol", label: "Postgres in un container senza volume persistente", role: "wrong", why: "Il container muore, i dati muoiono con lui." },
          { id: "envif", label: "if (env === 'production') sparsi nel codice", role: "wrong", why: "Staging esegue codice diverso da prod: la prova generale non prova niente." },
        ], [
          { id: "img", label: "A Docker image built once in CI", role: "essential", why: "A single artefact (one digest) that runs identically in staging and prod." },
          { id: "stg", label: "Staging with anonymised, real-sized data", role: "essential", why: "Without it, you discover migrations and slow queries in prod." },
          { id: "tf", label: "Infrastructure described in Terraform", role: "essential", why: "Staging and prod are born from the same code: guaranteed parity, no pets." },
          { id: "db", label: "Managed Postgres (RDS/Neon) with tested backups", role: "essential", why: "Backups, patches and failover aren't your job." },
          { id: "sec", label: "Secrets in a secret manager, separate per environment", role: "essential", why: "A prod key in staging is an incident waiting to happen." },
          { id: "roll", label: "Rolling or canary release with health checks", role: "essential", why: "Zero downtime: the old instances serve until the new ones are ready." },
          { id: "k8s", label: "Kubernetes", role: "optional", why: "It works, but for one API and one DB a PaaS or ECS/Cloud Run gives you rolling updates and scaling without running a cluster. Sensible once services multiply." },
          { id: "flag", label: "Feature flags for the risky features", role: "optional", why: "Great for gradual releases; not essential from day one." },
          { id: "prev", label: "A preview environment for every PR", role: "optional", why: "Speeds up review; added when the team grows." },
          { id: "ssh", label: "A VM configured by hand over SSH", role: "wrong", why: "A pet: nobody can rebuild it, and staging will never look like it." },
          { id: "copy", label: "A copy of the prod DB on the laptop for testing", role: "wrong", why: "Customers' personal data on a laptop: a GDPR breach waiting to happen." },
          { id: "keys", label: "The same API keys for staging and prod", role: "wrong", why: "A test in staging can email or charge real customers." },
          { id: "vol", label: "Postgres in a container with no persistent volume", role: "wrong", why: "The container dies, and the data dies with it." },
          { id: "envif", label: "if (env === 'production') scattered through the code", role: "wrong", why: "Staging runs different code from prod: the dress rehearsal rehearses nothing." },
        ])}
        reference={T("CI: test → build dell'immagine (un digest) → deploy su staging (Terraform, dati anonimizzati) → smoke test → approvazione → la stessa immagine in prod con rolling update e health check. Postgres gestito con backup, segreti nel secret manager per ambiente, feature flag per le parti rischiose. Kubernetes solo quando i servizi crescono.",
          "CI: tests → image build (one digest) → deploy to staging (Terraform, anonymised data) → smoke tests → approval → the same image in prod with a rolling update and health checks. Managed Postgres with backups, secrets in the secret manager per environment, feature flags for the risky parts. Kubernetes only once the services grow.")}
      />
      <Takeaway>{T(
        <>Il filo che lega tutto il gruppo: <span className="text-white">niente si fa a mano, e tutto esiste in più copie identiche</span>. Immagine una volta, infrastruttura da
        codice, config dall'ambiente, rilascio separato dal deploy. Ogni pezzo «da evitare» qui sopra rompe uno di questi quattro principi.</>,
        <>The thread running through the whole group: <span className="text-white">nothing is done by hand, and everything exists in several identical copies</span>. Image built once, infrastructure from
        code, config from the environment, release separate from deploy. Every “avoid” piece above breaks one of those four principles.</>
      )}</Takeaway>
    </div>
  );
}

/* ==========================================================================
   SYSTEM DESIGN · 1 — Kafka
   ========================================================================== */

// Le chiavi sono tradotte: il simulatore si rimonta al cambio lingua (langKey),
// quindi le partizioni restano coerenti dentro una lingua. Il colore segue la lettera.
const kKeys = () => T(["cliente-A", "cliente-B", "cliente-C", "cliente-D"], ["customer-A", "customer-B", "customer-C", "customer-D"]);
const K_TONE = { A: "indigo", B: "emerald", C: "amber", D: "blue" };
const kTone = (key) => K_TONE[key.slice(-1)];
const N_PART = 3;

function kafkaInit() {
  const parts = Array.from({ length: N_PART }, () => []);
  const [a, b, c] = kKeys();
  let n = 1, rr = 0;
  for (const key of [a, b, a, c, null, b]) {
    const p = key ? partitionFor(key, N_PART) : rr++ % N_PART;
    parts[p].push({ key, val: `${T("ordine", "order")} #${n++}` });
  }
  return { parts, n, rr, fat: Array(N_PART).fill(0), ana: Array(N_PART).fill(0), log: [] };
}

function KafkaSim() {
  const [s, setS] = useState(kafkaInit);
  const [nc, setNc] = useState(2);
  const consumers = Array.from({ length: nc }, (_, i) => `c${i + 1}`);
  const asg = assignPartitions(N_PART, consumers);
  const push = (st, lines) => ({ ...st, log: [...lines, ...st.log].slice(0, 12) });
  const billing = T("fatturazione", "billing");

  function produce(key) {
    setS((st) => {
      const p = key ? partitionFor(key, N_PART) : st.rr % N_PART;
      const parts = st.parts.map((x, i) => (i === p ? [...x, { key, val: `${T("ordine", "order")} #${st.n}` }] : x));
      return push({ ...st, parts, n: st.n + 1, rr: key ? st.rr : st.rr + 1 }, [`produce key=${key ?? "null"} → p${p}@${st.parts[p].length}${key ? "" : T("  (senza chiave: round-robin)", "  (no key: round-robin)")}`]);
    });
  }
  function pollFat() {
    setS((st) => {
      const fat = [...st.fat], lines = [];
      for (const c of consumers) for (const p of asg[c]) {
        const m = st.parts[p][fat[p]];
        if (m) { lines.push(T(`${billing}/${c} legge p${p}@${fat[p]} (${m.key ?? "null"} · ${m.val}) → commit ${fat[p] + 1}`, `${billing}/${c} reads p${p}@${fat[p]} (${m.key ?? "null"} · ${m.val}) → commit ${fat[p] + 1}`)); fat[p]++; }
      }
      const idle = consumers.filter((c) => !asg[c].length);
      if (idle.length) lines.push(T(`${idle.join(", ")}: nessuna partizione assegnata, fermo`, `${idle.join(", ")}: no partition assigned, idle`));
      return push({ ...st, fat }, lines.length ? lines : [T(`${billing}: niente di nuovo (lag 0)`, `${billing}: nothing new (lag 0)`)]);
    });
  }
  function pollAna() {
    setS((st) => {
      const lines = [];
      st.parts.forEach((x, p) => { if (x.length > st.ana[p]) lines.push(T(`analytics/c1 legge p${p}@${st.ana[p]}…${x.length - 1}`, `analytics/c1 reads p${p}@${st.ana[p]}…${x.length - 1}`)); });
      return push({ ...st, ana: st.parts.map((x) => x.length) }, lines.length ? lines : [T("analytics: niente di nuovo", "analytics: nothing new")]);
    });
  }
  const replay = () => setS((st) => push({ ...st, fat: Array(N_PART).fill(0) }, [T(`${billing}: offset riportati a 0 → rilegge tutto (i messaggi erano ancora lì)`, `${billing}: offsets reset to 0 → it rereads everything (the messages were still there)`)]));

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className="text-xs font-mono text-zinc-500 mr-1">{T("produci con key", "produce with key")}</span>
        {kKeys().map((k) => (
          <button key={k} onClick={() => produce(k)} className={`px-2 py-1 rounded-md border font-mono text-[11.5px] ${TONE[kTone(k)].pill} hover:brightness-125`}>{k}</button>
        ))}
        <button onClick={() => produce(null)} className="px-2 py-1 rounded-md border font-mono text-[11.5px] border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200">null</button>
        <button onClick={() => { setS(kafkaInit()); setNc(2); }} className="ml-auto text-zinc-500 hover:text-zinc-300" title="reset"><RotateCcw size={14} /></button>
      </div>
      <Label>{T("topic «ordini» · 3 partizioni · ▲ offset di fatturazione · △ offset di analytics", "topic “orders” · 3 partitions · ▲ billing offset · △ analytics offset")}</Label>
      <div className="space-y-1.5 mb-3">
        {s.parts.map((msgs, p) => {
          const owner = consumers.find((c) => asg[c].includes(p));
          return (
            <div key={p} className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-zinc-500 w-6 shrink-0">p{p}</span>
              <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar rounded-md border border-zinc-800 bg-zinc-950 p-1 min-h-[42px]">
                {msgs.map((m, off) => (
                  <div key={off} className="relative shrink-0">
                    <div className={`anim-rise rounded border px-1.5 py-0.5 font-mono text-[10px] leading-tight ${m.key ? TONE[kTone(m.key)].pill : "border-zinc-700 bg-zinc-900 text-zinc-400"} ${off < s.fat[p] ? "opacity-45" : ""}`}>
                      <div>@{off}</div><div>{m.key ? m.key.slice(-1) : "∅"}</div>
                    </div>
                    {off === s.fat[p] && <span className="absolute -bottom-1 left-0 text-[9px] text-indigo-300">▲</span>}
                    {off === s.ana[p] && <span className="absolute -bottom-1 right-0 text-[9px] text-amber-300">△</span>}
                  </div>
                ))}
                {s.fat[p] === msgs.length && <span className="self-end text-[9px] text-indigo-300">▲</span>}
              </div>
              <span className="font-mono text-[10.5px] w-24 shrink-0 text-right"><span className="text-zinc-400">{owner ?? "—"}</span> <span className={msgs.length - s.fat[p] ? "text-amber-300" : "text-zinc-600"}>lag {msgs.length - s.fat[p]}</span></span>
            </div>
          );
        })}
      </div>
      <div className="grid sm:grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg border border-indigo-900 bg-zinc-950 p-2.5">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[12px] text-indigo-200 font-mono">group «{billing}»</span>
            <span className="ml-auto flex items-center gap-1">
              <button onClick={() => setNc((x) => Math.max(1, x - 1))} className="text-zinc-500 hover:text-zinc-200"><Minus size={12} /></button>
              <span className="font-mono text-[11px] text-zinc-300">{nc} consumer</span>
              <button onClick={() => setNc((x) => Math.min(4, x + 1))} className="text-zinc-500 hover:text-zinc-200"><Plus size={12} /></button>
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 mb-2">{consumers.map((c) => `${c}→${asg[c].length ? asg[c].map((p) => "p" + p).join(",") : "∅"}`).join("  ")}</div>
          <div className="flex gap-1.5">
            <button onClick={pollFat} className="flex-1 px-2 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[12px]">poll + commit</button>
            <button onClick={replay} className="px-2 py-1 rounded-md border border-zinc-700 text-zinc-300 text-[12px] hover:border-indigo-600">{T("replay da 0", "replay from 0")}</button>
          </div>
        </div>
        <div className="rounded-lg border border-amber-900 bg-zinc-950 p-2.5">
          <div className="text-[12px] text-amber-200 font-mono mb-2">group «analytics» · 1 consumer</div>
          <div className="text-[11px] text-zinc-400 mb-2">{T("Offset suoi, indipendenti: legge gli stessi messaggi senza toglierli a nessuno.", "Its own independent offsets: it reads the same messages without taking them away from anyone.")}</div>
          <button onClick={pollAna} className="w-full px-2 py-1 rounded-md border border-amber-800 bg-amber-950 text-amber-100 text-[12px]">{T("leggi tutto", "read everything")}</button>
        </div>
      </div>
      <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-mono text-[11.5px] text-zinc-400 whitespace-pre-wrap max-h-32 overflow-y-auto">{s.log.join("\n") || T("produci qualche messaggio, poi fai poll…", "produce a few messages, then poll…")}</pre>
    </Card>
  );
}

function KafkaModule() {
  const spostati = kKeys().filter((k) => partitionFor(k, 3) !== partitionFor(k, 4));
  const moved = spostati.length
    ? <> {T("cambiano partizione", "change partition:")}{spostati.map((k) => <span key={k} className="font-mono"> {k} (p{partitionFor(k, 3)}→p{partitionFor(k, 4)})</span>)}</>
    : T(" alcune chiavi cambiano partizione", " some keys change partition");
  return (
    <div className="space-y-4">
      <Lead>{T(
        <>Una coda classica (SQS, RabbitMQ) consegna un messaggio e lo cancella. Kafka no: è un <span className="text-white font-medium">log</span> — un file in cui i messaggi si
        aggiungono in fondo e <span className="text-white">restano</span>, per giorni o settimane. Chi legge tiene solo un segnalibro, l'<span className="text-white font-medium">offset</span>.
        Così dieci sistemi diversi leggono gli stessi eventi, ognuno al suo ritmo, e chiunque può tornare indietro e rileggere.</>,
        <>A classic queue (SQS, RabbitMQ) delivers a message and deletes it. Kafka doesn't: it's a <span className="text-white font-medium">log</span> — a file where messages are
        appended at the end and <span className="text-white">stay</span>, for days or weeks. Readers only keep a bookmark, the <span className="text-white font-medium">offset</span>.
        So ten different systems read the same events, each at its own pace, and anyone can go back and reread.</>
      )}</Lead>
      <Analogy>{T(
        <>Una coda è la cassetta delle lettere: prendi la lettera ed è sparita. Kafka è il <span className="text-zinc-100">diario di bordo</span> di una nave: si scrive solo in fondo,
        nessuno strappa pagine; il capitano, il cuoco e l'assicuratore lo leggono ognuno col proprio segnalibro.</>,
        <>A queue is a letterbox: you take the letter and it's gone. Kafka is a ship's <span className="text-zinc-100">logbook</span>: you only write at the end,
        nobody tears out pages; the captain, the cook and the insurer each read it with their own bookmark.</>
      )}</Analogy>
      <Predict
        question={T("Topic ordini con 3 partizioni. Il consumer group «fatturazione» ha 4 consumer. Quanti leggono davvero?", "An orders topic with 3 partitions. The “billing” consumer group has 4 consumers. How many actually read?")}
        options={T(["4: Kafka divide i messaggi tra tutti", "3: ogni partizione va a un solo consumer del gruppo, il quarto resta fermo", "1: gli altri sono di riserva"], ["4: Kafka splits the messages among all of them", "3: each partition goes to a single consumer in the group, the fourth sits idle", "1: the others are on standby"])}
        answer={1}
        explain={T("Dentro un gruppo, ogni partizione ha UN solo consumer: è così che Kafka mantiene l'ordine. Il parallelismo di un gruppo si ferma al numero di partizioni; il quarto consumer subentra solo se un altro cade.", "Within a group, each partition has ONE consumer: that's how Kafka preserves order. A group's parallelism stops at the number of partitions; the fourth consumer only steps in if another one fails.")}
      />
      <KafkaSim key={langKey()} />
      <Note tone="indigo" icon={Lightbulb}>{T(
        <>Prova: produci più volte con <span className="font-mono">cliente-A</span> — finisce <span className="text-white">sempre nella stessa partizione</span>, quindi i suoi ordini
        restano in fila. Porta fatturazione a 4 consumer: uno resta a <span className="font-mono">∅</span>. Poi fai «replay da 0»: i messaggi sono ancora tutti lì.</>,
        <>Try it: produce several times with <span className="font-mono">customer-A</span> — it <span className="text-white">always lands in the same partition</span>, so their orders
        stay in line. Take billing to 4 consumers: one stays at <span className="font-mono">∅</span>. Then hit “replay from 0”: the messages are all still there.</>
      )}</Note>
      <Note tone="amber" icon={AlertTriangle}>{T(
        <><span className="font-medium">Aggiungere partizioni rimescola le chiavi.</span> La partizione è <span className="font-mono">hash(key) % N</span>: passando da 3 a 4
        {moved}. Per un po' i nuovi eventi di quel cliente stanno in una partizione diversa dai vecchi: l'ordine non è più garantito. Le partizioni si dimensionano all'inizio.</>,
        <><span className="font-medium">Adding partitions reshuffles the keys.</span> The partition is <span className="font-mono">hash(key) % N</span>: going from 3 to 4,
        {moved}. For a while that customer's new events sit in a different partition from the old ones: ordering is no longer guaranteed. Size your partitions up front.</>
      )}</Note>
      <Card>
        <Label>{T("garanzie di consegna · dipendono da quando fai commit", "delivery guarantees · they depend on when you commit")}</Label>
        <Griglia intestazioni={T(["", "come", "se crashi a metà"], ["", "how", "if you crash halfway"])} righe={T([
          ["at-most-once", "commit, poi elabori", "il messaggio è perso"],
          ["at-least-once", "elabori, poi commit", "lo rielabori → serve idempotenza. Il default sensato."],
          ["exactly-once", "producer idempotente + transazioni Kafka", "vale da topic a topic dentro Kafka. Verso un DB esterno torni ad at-least-once + idempotenza."],
        ], [
          ["at-most-once", "commit, then process", "the message is lost"],
          ["at-least-once", "process, then commit", "you process it again → you need idempotency. The sensible default."],
          ["exactly-once", "idempotent producer + Kafka transactions", "holds from topic to topic inside Kafka. Towards an external DB you're back to at-least-once + idempotency."],
        ])} />
      </Card>
      <Card>
        <Label>{T("producer e consumer, in Python (confluent-kafka)", "producer and consumer, in Python (confluent-kafka)")}</Label>
        <Code>{T(`p.produce("ordini", key=ordine["cliente_id"], value=json.dumps(ordine))
# stessa chiave → stessa partizione → ordine garantito per quel cliente

c = Consumer({
    "bootstrap.servers": "kafka:9092",
    "group.id": "fatturazione",        # i consumer del gruppo si dividono le partizioni
    "auto.offset.reset": "earliest",   # gruppo nuovo: parti dall'inizio
    "enable.auto.commit": False,       # commit solo dopo aver elaborato
})
c.subscribe(["ordini"])
while True:
    msg = c.poll(1.0)
    if msg is None:
        continue
    emetti_fattura(json.loads(msg.value()))   # idempotente per order_id!
    c.commit(msg)                             # at-least-once`, `p.produce("orders", key=order["customer_id"], value=json.dumps(order))
# same key → same partition → ordering guaranteed for that customer

c = Consumer({
    "bootstrap.servers": "kafka:9092",
    "group.id": "billing",             # the group's consumers share out the partitions
    "auto.offset.reset": "earliest",   # new group: start from the beginning
    "enable.auto.commit": False,       # commit only after processing
})
c.subscribe(["orders"])
while True:
    msg = c.poll(1.0)
    if msg is None:
        continue
    issue_invoice(json.loads(msg.value()))    # idempotent per order_id!
    c.commit(msg)                             # at-least-once`)}</Code>
      </Card>
      <Card>
        <Label>{T("Kafka o una coda?", "Kafka or a queue?")}</Label>
        <Griglia intestazioni={T(["", "Kafka (log)", "SQS / RabbitMQ (coda)"], ["", "Kafka (log)", "SQS / RabbitMQ (queue)"])} righe={T([
          ["lettura", "tanti gruppi, ognuno col suo offset", "consumato = sparito per tutti"],
          ["ordine", "per partizione (cioè per chiave)", "FIFO opzionale, a costo di throughput"],
          ["retention", "giorni o per sempre: replay", "fino al consumo"],
          ["operatività", "cluster pesante (o gestito: MSK, Confluent)", "SQS: praticamente zero"],
          ["quando", "flussi di eventi, più lettori, CDC, analytics", "lavori da smaltire: email, resize, export"],
        ], [
          ["reading", "many groups, each with its own offset", "consumed = gone for everyone"],
          ["ordering", "per partition (i.e. per key)", "optional FIFO, at the cost of throughput"],
          ["retention", "days or forever: replay", "until consumed"],
          ["operations", "a heavy cluster (or managed: MSK, Confluent)", "SQS: practically zero"],
          ["when", "event streams, several readers, CDC, analytics", "jobs to work through: emails, resizes, exports"],
        ])} />
      </Card>
      <Note tone="amber" icon={AlertTriangle}>{T(
        <><span className="font-medium">Rebalance.</span> Quando un consumer entra o esce, il gruppo si ferma un attimo e ridistribuisce le partizioni. Un consumer troppo lento
        (supera <span className="font-mono">max.poll.interval.ms</span>) viene dato per morto: le sue partizioni passano a un altro, che rilegge dall'ultimo commit → duplicati.</>,
        <><span className="font-medium">Rebalance.</span> When a consumer joins or leaves, the group pauses briefly and redistributes the partitions. A consumer that's too slow
        (exceeds <span className="font-mono">max.poll.interval.ms</span>) is declared dead: its partitions go to another one, which rereads from the last commit → duplicates.</>
      )}</Note>
      <ScegliForma id="kafka-scelte" titolo={T("Decisioni da Kafka", "Kafka decisions")} items={T([
        { pre: "Gli eventi di un cliente vanno elaborati in ordine. La chiave del messaggio è →", opts: ["null", "cliente_id", "timestamp"], ok: "cliente_id", perche: "Stessa chiave, stessa partizione, stesso consumer: ordine garantito per quel cliente e parallelismo tra clienti diversi." },
        { pre: "Analytics vuole rileggere gli ordini degli ultimi 7 giorni →", opts: ["impossibile, già consumati", "nuovo consumer group dall'offset più vecchio"], ok: "nuovo consumer group dall'offset più vecchio", perche: "Consumare non cancella: finché la retention li tiene, un gruppo nuovo li rilegge tutti." },
        { pre: "6 partizioni, vuoi più di 6 consumer che lavorano →", opts: ["aggiungi consumer al gruppo", "aumenta le partizioni (e accetti il rimescolamento)"], ok: "aumenta le partizioni (e accetti il rimescolamento)", perche: "Il settimo consumer resterebbe fermo. Più parallelismo = più partizioni." },
        { pre: "Elabori, poi commit. Crash dopo l'elaborazione, prima del commit →", opts: ["messaggio perso", "messaggio rielaborato"], ok: "messaggio rielaborato", perche: "Al riavvio si riparte dall'ultimo offset committato: at-least-once. Per questo il consumer dev'essere idempotente." },
      ], [
        { pre: "A customer's events must be processed in order. The message key is →", opts: ["null", "customer_id", "timestamp"], ok: "customer_id", perche: "Same key, same partition, same consumer: ordering guaranteed for that customer and parallelism across different customers." },
        { pre: "Analytics wants to reread the last 7 days of orders →", opts: ["impossible, already consumed", "a new consumer group from the oldest offset"], ok: "a new consumer group from the oldest offset", perche: "Consuming doesn't delete: as long as retention keeps them, a new group rereads them all." },
        { pre: "6 partitions, you want more than 6 consumers working →", opts: ["add consumers to the group", "increase the partitions (and accept the reshuffle)"], ok: "increase the partitions (and accept the reshuffle)", perche: "The seventh consumer would sit idle. More parallelism = more partitions." },
        { pre: "Process, then commit. Crash after processing, before the commit →", opts: ["message lost", "message processed again"], ok: "message processed again", perche: "On restart you resume from the last committed offset: at-least-once. That's why the consumer must be idempotent." },
      ])} />
      <Cloze id="kafka-parole" titolo={T("Il vocabolario", "The vocabulary")} items={T([
        { pre: "Il segnalibro di un gruppo in una partizione:", ok: "offset", perche: "Un numero crescente per partizione. Il commit salva fin dove sei arrivato." },
        { pre: "Messaggi prodotti meno messaggi letti da un gruppo: il consumer", ok: "lag", perche: "La metrica da mettere in dashboard: se cresce, i consumer non stanno al passo." },
        { pre: "Consumer che si dividono le partizioni di un topic formano un consumer", ok: "group", perche: "Gruppi diversi leggono tutto indipendentemente; dentro un gruppo si dividono il lavoro." },
      ], [
        { pre: "A group's bookmark in a partition:", ok: "offset", perche: "An increasing number per partition. The commit saves how far you've got." },
        { pre: "Messages produced minus messages read by a group: consumer", ok: "lag", perche: "The metric to put on a dashboard: if it grows, the consumers aren't keeping up." },
        { pre: "Consumers that share out a topic's partitions form a consumer", ok: "group", perche: "Different groups read everything independently; within a group they split the work." },
      ])} />
      <Takeaway>{T(
        <>Kafka è un <span className="text-white">log, non una coda</span>: i messaggi restano e ognuno legge col suo offset. Ordine solo dentro una partizione → la chiave è ciò che
        deve restare in fila (cliente, ordine). Parallelismo = numero di partizioni. Consegna at-least-once → consumer idempotenti. E se hai solo lavori da smaltire, una coda
        semplice costa molto meno.</>,
        <>Kafka is a <span className="text-white">log, not a queue</span>: messages stay and everyone reads with their own offset. Ordering only within a partition → the key is whatever
        must stay in line (customer, order). Parallelism = number of partitions. At-least-once delivery → idempotent consumers. And if all you have is jobs to work through, a simple
        queue costs far less.</>
      )}</Takeaway>
    </div>
  );
}

/* ==========================================================================
   SYSTEM DESIGN · 2 — Outbox & CDC
   ========================================================================== */

const OB_CELLE = memoByLang(() => ({
  "cp|none": { forma: T("✓ coerente", "✓ consistent"), tone: "emerald", nota: T("Funziona finché va tutto bene — ed è per questo che il bug arriva in produzione.", "It works as long as everything goes well — which is exactly why the bug reaches production.") },
  "cp|mid": { forma: T("✗ evento perso", "✗ event lost"), tone: "red", nota: T("Ordine nel DB, nessun evento: il magazzino non spedisce, l'email non parte. E nessun log d'errore, perché il processo è morto.", "Order in the DB, no event: the warehouse doesn't ship, the email doesn't go out. And no error log, because the process died.") },
  "cp|down": { forma: T("✗ ordine salvato, evento no", "✗ order saved, event not"), tone: "red", nota: T("Il publish fallisce dopo il commit: o rispondi errore (il client ritenta e crea un secondo ordine) o rispondi ok e l'evento è perso.", "The publish fails after the commit: either you return an error (the client retries and creates a second order) or you return ok and the event is lost.") },
  "pc|none": { forma: T("✓ coerente", "✓ consistent"), tone: "emerald", nota: T("Come sopra: il caso felice non dimostra niente.", "As above: the happy path proves nothing.") },
  "pc|mid": { forma: T("✗ evento fantasma", "✗ ghost event"), tone: "red", nota: T("Evento pubblicato, commit mai avvenuto: il magazzino spedisce un ordine che nel DB non esiste.", "Event published, commit never happened: the warehouse ships an order that doesn't exist in the DB.") },
  "pc|down": { forma: T("✗ checkout fermo", "✗ checkout down"), tone: "red", nota: T("Kafka giù = non accetti ordini. Hai legato la disponibilità del checkout a quella del broker.", "Kafka down = you can't take orders. You've tied the checkout's availability to the broker's.") },
  "ob|none": { forma: T("✓ coerente", "✓ consistent"), tone: "emerald", nota: T("Ordine e riga in outbox nella stessa transazione; il relay pubblica e segna la riga come inviata.", "Order and outbox row in the same transaction; the relay publishes and marks the row as sent.") },
  "ob|mid": { forma: T("✓ coerente (al più un duplicato)", "✓ consistent (at most one duplicate)"), tone: "emerald", nota: T("Crash prima del commit: né ordine né evento. Dopo: entrambi, e il relay pubblicherà. Se il relay muore tra publish e «segna inviato», ripubblica → duplicato → consumer idempotenti.", "Crash before the commit: neither order nor event. After: both, and the relay will publish. If the relay dies between publish and “mark as sent”, it republishes → duplicate → idempotent consumers.") },
  "ob|down": { forma: T("✓ in ritardo, niente perso", "✓ late, nothing lost"), tone: "emerald", nota: T("Gli ordini si accettano; gli eventi aspettano nella tabella outbox e partono quando Kafka torna.", "Orders are accepted; the events wait in the outbox table and go out when Kafka comes back.") },
}));

function OutboxModule() {
  return (
    <div className="space-y-4">
      <Lead>{T(
        <>Salvi l'ordine nel DB e pubblichi <span className="font-mono">OrdineCreato</span> su Kafka. Sono <span className="text-white font-medium">due sistemi</span>, e nessuna
        transazione li copre entrambi: se crashi in mezzo, il DB dice una cosa e il resto del mondo un'altra. È il <span className="text-white font-medium">dual-write problem</span>.
        La soluzione standard è l'<span className="text-white font-medium">outbox</span>: scrivi l'evento nello stesso DB, nella stessa transazione, e un processo separato lo pubblica.</>,
        <>You save the order in the DB and publish <span className="font-mono">OrderCreated</span> to Kafka. Those are <span className="text-white font-medium">two systems</span>, and no
        transaction covers both: if you crash in between, the DB says one thing and the rest of the world another. That's the <span className="text-white font-medium">dual-write problem</span>.
        The standard fix is the <span className="text-white font-medium">outbox</span>: you write the event to the same DB, in the same transaction, and a separate process publishes it.</>
      )}</Lead>
      <Analogy>{T(
        <>Il vassoio della posta in uscita. Invece di spedire la lettera tu e sperare di ricordartelo, la metti nel vassoio <span className="text-zinc-100">nello stesso gesto</span> in
        cui archivi la pratica. Il fattorino (il relay) passa e spedisce ciò che trova; se passa due volte, al massimo la spedisce due volte — mai zero.</>,
        <>The outgoing-mail tray. Instead of posting the letter yourself and hoping you remember, you drop it in the tray <span className="text-zinc-100">in the same motion</span> as
        you file the case. The courier (the relay) comes by and sends whatever it finds; if it comes by twice, at worst it sends it twice — never zero times.</>
      )}</Analogy>
      <Predict
        question={T("Il codice fa db.commit(ordine) e poi kafka.publish(evento). Il processo muore esattamente tra le due righe. Risultato?", "The code does db.commit(order) and then kafka.publish(event). The process dies exactly between the two lines. Result?")}
        options={T(["Kafka riceve comunque l'evento, è asincrono", "Ordine salvato, evento mai pubblicato: magazzino ed email non sapranno mai dell'ordine", "Il DB fa rollback automatico"], ["Kafka gets the event anyway, it's asynchronous", "Order saved, event never published: the warehouse and the email will never know about the order", "The DB rolls back automatically"])}
        answer={1}
        explain={T("Il commit è avvenuto e nessuno ripubblicherà l'evento. Invertire le righe non aiuta: se il commit fallisce dopo il publish, hai annunciato un ordine che non esiste.", "The commit happened and nobody will republish the event. Swapping the lines doesn't help: if the commit fails after the publish, you've announced an order that doesn't exist.")}
      />
      <TabellaViva titolo={T("Tre strategie contro tre guasti", "Three strategies against three failures")} intro={T("Scegli la strategia e cosa va storto.", "Pick the strategy and what goes wrong.")}
        assi={{
          a: { label: T("strategia", "strategy"), opts: [{ k: "cp", label: T("commit, poi publish", "commit, then publish") }, { k: "pc", label: T("publish, poi commit", "publish, then commit") }, { k: "ob", label: T("outbox (stessa transazione)", "outbox (same transaction)") }] },
          b: { label: T("guasto", "failure"), opts: [{ k: "none", label: T("nessuno", "none") }, { k: "mid", label: T("crash tra i due passi", "crash between the two steps") }, { k: "down", label: T("Kafka giù 10 minuti", "Kafka down for 10 minutes") }] },
        }}
        celle={OB_CELLE()} />
      <Card>
        <Label>{T("l'outbox · o entrambe le righe, o nessuna", "the outbox · either both rows, or neither")}</Label>
        <Code>{`BEGIN;
INSERT INTO orders (id, customer_id, total) VALUES ('o_91', 'c_7', 120.00);
INSERT INTO outbox (id, aggregate_id, type, payload)
  VALUES (gen_random_uuid(), 'o_91', '${T("OrdineCreato", "OrderCreated")}', '{"total": 120.00}');
COMMIT;

-- ${T("il relay, versione polling", "the relay, polling version")}
SELECT * FROM outbox WHERE published_at IS NULL
  ORDER BY created_at LIMIT 100
  FOR UPDATE SKIP LOCKED;          -- ${T("più relay senza pestarsi i piedi", "several relays without stepping on each other")}
-- ${T("publish su Kafka (key = aggregate_id), poi:", "publish to Kafka (key = aggregate_id), then:")}
UPDATE outbox SET published_at = now() WHERE id = ANY(:${T("pubblicati", "published")});`}</Code>
      </Card>
      <Card>
        <Label>{T("chi pubblica le righe dell'outbox", "who publishes the outbox rows")}</Label>
        <Griglia intestazioni={["", "polling", "CDC (Debezium)"]} righe={T([
          ["come", "query ogni N secondi sulle righe non pubblicate", "legge il WAL di Postgres: ogni INSERT in outbox diventa un messaggio"],
          ["latenza", "secondi (l'intervallo di polling)", "sotto il secondo"],
          ["carico sul DB", "query continue", "quasi nullo: legge il log che il DB scrive comunque"],
          ["operatività", "venti righe di codice", "Kafka Connect + Debezium da gestire"],
          ["quando", "per partire", "quando il volume cresce"],
        ], [
          ["how", "a query every N seconds on unpublished rows", "reads Postgres's WAL: every INSERT into outbox becomes a message"],
          ["latency", "seconds (the polling interval)", "under a second"],
          ["load on the DB", "constant queries", "almost none: it reads the log the DB writes anyway"],
          ["operations", "twenty lines of code", "Kafka Connect + Debezium to run"],
          ["when", "to get started", "when volume grows"],
        ])} />
      </Card>
      <Note tone="indigo" icon={Lightbulb}>{T(
        <><span className="font-medium">CDC senza outbox</span> serve a replicare dati: ogni modifica di <span className="font-mono">products</span> finisce in Elasticsearch, nel data
        warehouse, in una cache. Ma pubblicare le tabelle interne trasforma il tuo schema in un contratto pubblico: rinomini una colonna e rompi tre team. L'outbox pubblica
        <span className="text-white"> eventi di dominio</span>, pensati per chi sta fuori.</>,
        <><span className="font-medium">CDC without an outbox</span> is for replicating data: every change to <span className="font-mono">products</span> ends up in Elasticsearch, in the data
        warehouse, in a cache. But publishing your internal tables turns your schema into a public contract: rename a column and you break three teams. The outbox publishes
        <span className="text-white"> domain events</span>, designed for outside readers.</>
      )}</Note>
      <Note tone="emerald" icon={CheckCircle2}>{T(
        <><span className="font-medium">Dall'altra parte: l'inbox.</span> Il consumer salva <span className="font-mono">event_id</span> in una tabella
        <span className="font-mono"> processed_events</span> (chiave primaria) nella stessa transazione dell'effetto. Evento già visto → conflitto → si salta. È così che «almeno una
        volta» diventa «effetto una volta sola».</>,
        <><span className="font-medium">On the other side: the inbox.</span> The consumer saves <span className="font-mono">event_id</span> in a
        <span className="font-mono"> processed_events</span> table (primary key) in the same transaction as the effect. Event already seen → conflict → skipped. That's how “at least
        once” becomes “effect exactly once”.</>
      )}</Note>
      <ScegliForma id="outbox-casi" titolo={T("Cosa succede, cosa usi", "What happens, what you use")} items={T([
        { pre: "Il relay pubblica l'evento e crasha prima di segnare published_at. Al riavvio →", opts: ["l'evento è perso", "l'evento viene ripubblicato"], ok: "l'evento viene ripubblicato", perche: "At-least-once: la riga risulta ancora non pubblicata. Il consumer deduplica per event_id." },
        { pre: "Tenere un indice di ricerca allineato a products senza toccare il codice dell'app →", opts: ["outbox", "CDC sulla tabella"], ok: "CDC sulla tabella", perche: "Replica di dati, non evento di dominio: Debezium legge il WAL e l'app non sa nemmeno che esiste." },
        { pre: "Gli eventi di uno stesso ordine devono arrivare in ordine →", opts: ["key = aggregate_id", "key casuale"], ok: "key = aggregate_id", perche: "Stesso ordine → stessa partizione → stesso ordine di lettura. Vedi il capitolo Kafka." },
      ], [
        { pre: "The relay publishes the event and crashes before setting published_at. On restart →", opts: ["the event is lost", "the event is published again"], ok: "the event is published again", perche: "At-least-once: the row still shows as unpublished. The consumer dedupes by event_id." },
        { pre: "Keep a search index in sync with products without touching the app code →", opts: ["outbox", "CDC on the table"], ok: "CDC on the table", perche: "Data replication, not a domain event: Debezium reads the WAL and the app doesn't even know it exists." },
        { pre: "Events for the same order must arrive in sequence →", opts: ["key = aggregate_id", "random key"], ok: "key = aggregate_id", perche: "Same order → same partition → same reading order. See the Kafka chapter." },
      ])} />
      <Riordina id="outbox-flusso" titolo={T("Il percorso di un evento", "The journey of an event")} items={T([
        { it: "Dall'ordine al topic", seq: ["BEGIN", "INSERT ordine", "INSERT riga outbox", "COMMIT", "il relay legge l'outbox", "publish su Kafka", "segna come pubblicato"], perche: "Il commit è il punto di non ritorno: da lì l'evento esiste ed è solo questione di tempo perché parta." },
      ], [
        { it: "From the order to the topic", seq: ["BEGIN", "INSERT order", "INSERT outbox row", "COMMIT", "the relay reads the outbox", "publish to Kafka", "mark as published"], perche: "The commit is the point of no return: from there the event exists and it's only a matter of time before it goes out." },
      ])} />
      <Cloze id="outbox-parole" titolo={T("Completa", "Fill in the blank")} items={T([
        { pre: "Debezium legge il", ok: ["WAL", "write-ahead log"], post: "di Postgres", perche: "Il write-ahead log: il registro di ogni modifica che Postgres scrive comunque per la durabilità e le repliche." },
        { pre: "Un consumer che ignora un evento già visto è", ok: ["idempotente"], perche: "Elaborarlo due volte ha lo stesso effetto di elaborarlo una." },
      ], [
        { pre: "Debezium reads Postgres's", ok: ["WAL", "write-ahead log"], perche: "The write-ahead log: the record of every change that Postgres writes anyway for durability and replication." },
        { pre: "A consumer that ignores an event it has already seen is", ok: ["idempotent"], perche: "Processing it twice has the same effect as processing it once." },
      ])} />
      <Takeaway>{T(
        <>Mai due scritture su due sistemi sperando che vadano entrambe. <span className="text-white">Stato + evento nella stessa transazione</span> (outbox), pubblicati da un relay
        (polling per partire, CDC quando cresci). La garanzia è at-least-once → <span className="text-white">consumer idempotenti per event_id</span>. CDC puro per replicare dati;
        outbox per pubblicare eventi di dominio.</>,
        <>Never two writes to two systems hoping both succeed. <span className="text-white">State + event in the same transaction</span> (outbox), published by a relay
        (polling to start, CDC as you grow). The guarantee is at-least-once → <span className="text-white">consumers idempotent by event_id</span>. Plain CDC to replicate data;
        the outbox to publish domain events.</>
      )}</Takeaway>
    </div>
  );
}

/* ==========================================================================
   SYSTEM DESIGN · 3 — Temporal
   ========================================================================== */

// passi del workflow: nomi tradotti, TemporalSim si rimonta al cambio lingua
const tCode = () => T(
  [{ k: "addebita", kind: "activity" }, { k: "prenota magazzino", kind: "activity" }, { k: "approvazione", kind: "signal" }, { k: "spedisci", kind: "activity" }, { k: "email", kind: "activity" }],
  [{ k: "charge", kind: "activity" }, { k: "reserve stock", kind: "activity" }, { k: "approval", kind: "signal" }, { k: "ship", kind: "activity" }, { k: "email", kind: "activity" }]
);
const T_LOG_TONE = { run: "text-emerald-300", replay: "text-blue-300", crash: "text-red-300", wait: "text-amber-300", signal: "text-indigo-300", err: "text-red-300", done: "text-emerald-300" };

function TemporalSim() {
  const [history, setHistory] = useState([]);
  const [log, setLog] = useState([]);
  const [status, setStatus] = useState("idle");
  const [crashAt, setCrashAt] = useState(2);
  const [armed, setArmed] = useState(true);
  const [signals, setSignals] = useState([]);
  const [changed, setChanged] = useState(false);
  const fraud = T("antifrode", "antifraud");
  const approval = T("approvazione", "approval");
  const code = changed ? [{ k: fraud, kind: "activity" }, ...tCode()] : tCode();

  function run(sig = signals) {
    const r = runWorkflow(code, history, { crashAt: armed ? crashAt : null, signals: sig });
    if (r.status === "crashed") setArmed(false);
    setHistory(r.history); setLog(r.log); setStatus(r.status);
  }
  function signal() { const s = [...signals, approval]; setSignals(s); run(s); }
  function reset() { setHistory([]); setLog([]); setStatus("idle"); setArmed(true); setSignals([]); setChanged(false); }

  const btn = status === "idle" ? T("▶ avvia il workflow", "▶ start the workflow") : status === "crashed" ? T("▶ un altro worker riprende", "▶ another worker picks it up") : T("▶ riesegui", "▶ run again");
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 mb-3 text-[12px]">
        <span className="font-mono text-zinc-500">{T("crash dopo il passo", "crash after step")}</span>
        {[null, 1, 2, 4].map((c) => (
          <button key={String(c)} onClick={() => { setCrashAt(c); setArmed(true); }} className={`px-2 py-1 rounded-md border font-mono ${crashAt === c ? "border-red-700 bg-red-950 text-red-200" : "border-zinc-800 bg-zinc-950 text-zinc-400"}`}>{c ?? T("mai", "never")}</button>
        ))}
        <button onClick={reset} className="ml-auto text-zinc-500 hover:text-zinc-300" title="reset"><RotateCcw size={14} /></button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>{T("il codice del workflow", "the workflow code")}</Label>
          <div className="space-y-1">
            {code.map((s, i) => {
              const done = i < history.length;
              return (
                <div key={s.k} className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[12.5px] ${done ? "border-emerald-900 bg-emerald-950/40 text-emerald-200" : "border-zinc-800 bg-zinc-950 text-zinc-400"} ${s.k === fraud ? "ring-1 ring-amber-700" : ""}`}>
                  <span className="font-mono text-[10px] opacity-60">{i + 1}</span>
                  <span className="font-mono">{s.kind === "signal" ? `wait_condition(${s.k})` : `execute_activity(${s.k})`}</span>
                  {done && <CheckCircle2 size={12} className="ml-auto" />}
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <Label>{T("event history (persistita sul server Temporal)", "event history (persisted on the Temporal server)")}</Label>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-mono text-[11px] leading-relaxed min-h-[150px]">
            {status !== "idle" && <div className="text-zinc-500">WorkflowExecutionStarted</div>}
            {history.map((h, i) => (
              <div key={i} className={h.kind === "signal" ? "text-indigo-300" : "text-emerald-300"}>{h.kind === "signal" ? `WorkflowExecutionSignaled · ${h.k}` : `ActivityTaskCompleted · ${h.k}`}</div>
            ))}
            {status === "done" && <div className="text-zinc-500">WorkflowExecutionCompleted</div>}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <button disabled={status === "done" || status === "waiting"} onClick={() => run()} className="flex-1 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white text-sm">{btn}</button>
        <button disabled={status !== "waiting"} onClick={signal} className="px-3 py-1.5 rounded-md border border-indigo-700 bg-indigo-950 text-indigo-100 disabled:opacity-30 text-sm flex items-center gap-1.5"><Send size={13} /> signal «{approval}»</button>
        <button disabled={!history.length || changed} onClick={() => { setChanged(true); setStatus("crashed"); setLog([{ t: "err", m: T(`deploy: nuovo codice con «${fraud}» come primo passo — il run in corso non è finito`, `deploy: new code with “${fraud}” as the first step — the running execution hasn't finished`) }]); }} className="px-3 py-1.5 rounded-md border border-amber-800 bg-amber-950 text-amber-100 disabled:opacity-30 text-sm">{T(`deploy: aggiungo «${fraud}» in testa`, `deploy: add “${fraud}” at the top`)}</button>
      </div>
      <div className="mt-3 space-y-0.5">
        {log.map((l, i) => <div key={i} className={`font-mono text-[11.5px] ${T_LOG_TONE[l.t]}`}>{l.m}</div>)}
      </div>
    </Card>
  );
}

function TemporalModule() {
  return (
    <div className="space-y-4">
      <Lead>{T(
        <>Temporal ti fa scrivere un processo che dura ore o settimane — addebita, aspetta un'approvazione, spedisci, scrivi dopo 3 giorni — <span className="text-white font-medium">come
        se fosse una funzione normale</span>. Ogni passo completato finisce in una <span className="text-white font-medium">event history</span> persistita; se il worker muore, un altro
        rilegge la history e riprende da lì. Il prezzo: il codice del workflow deve essere <span className="text-white font-medium">deterministico</span>. (In «Produzione · harness &
        Temporal» l'hai visto applicato agli agenti; qui c'è la meccanica.)</>,
        <>Temporal lets you write a process that lasts hours or weeks — charge, wait for an approval, ship, write back 3 days later — <span className="text-white font-medium">as
        if it were an ordinary function</span>. Every completed step goes into a persisted <span className="text-white font-medium">event history</span>; if the worker dies, another one
        rereads the history and picks up from there. The price: the workflow code must be <span className="text-white font-medium">deterministic</span>. (In “Production · harness &
        Temporal” you saw it applied to agents; here are the mechanics.)</>
      )}</Lead>
      <Analogy>{T(
        <>Il navigatore che registra ogni svolta. Se si spegne a metà viaggio non ti rimanda a casa: rilegge il registro («destra, poi dritto») <span className="text-zinc-100">senza
        rifare la strada</span>, e ti guida dalla prossima svolta. Ma se nel frattempo gli cambi la mappa, il registro non torna più.</>,
        <>A satnav that records every turn. If it switches off halfway it doesn't send you back home: it rereads the log (“right, then straight on”) <span className="text-zinc-100">without
        driving the route again</span>, and guides you from the next turn. But if you change its map in the meantime, the log no longer adds up.</>
      )}</Analogy>
      <Predict
        question={T("Workflow: addebita → prenota magazzino → … Il worker crasha subito dopo «prenota magazzino». Un altro worker riprende. Quante volte è stato addebitato il cliente?", "Workflow: charge → reserve stock → … The worker crashes right after “reserve stock”. Another worker picks it up. How many times has the customer been charged?")}
        options={T(["Due: il workflow riparte dall'inizio", "Una: nel replay «addebita» restituisce il risultato salvato nella history, senza rieseguirlo", "Zero: il crash annulla tutto"], ["Twice: the workflow starts over from the beginning", "Once: in the replay “charge” returns the result saved in the history, without running again", "Zero: the crash undoes everything"])}
        answer={1}
        explain={T("Il replay riesegue il codice del workflow, ma ogni activity già completata viene «risposta» dalla history. Attenzione però: se il crash avviene DURANTE un'activity, quella viene ritentata — per questo le activity devono essere idempotenti.", "The replay re-runs the workflow code, but every activity that already completed is “answered” from the history. Careful though: if the crash happens DURING an activity, that activity is retried — which is why activities must be idempotent.")}
      />
      <TemporalSim key={langKey()} />
      <Note tone="indigo" icon={Lightbulb}>{T(
        <>Prova in quest'ordine: <span className="text-white">avvia</span> (crash dopo il passo 2) → <span className="text-white">riprendi</span>: i primi due passi sono <span className="text-blue-300">riletti</span>,
        non rieseguiti, poi il workflow si ferma ad aspettare → <span className="text-white">manda il signal</span>. Poi reset e prova il <span className="text-white">deploy a metà run</span>.</>,
        <>Try it in this order: <span className="text-white">start</span> (crash after step 2) → <span className="text-white">resume</span>: the first two steps are <span className="text-blue-300">replayed</span>,
        not re-run, then the workflow stops to wait → <span className="text-white">send the signal</span>. Then reset and try the <span className="text-white">mid-run deploy</span>.</>
      )}</Note>
      <Card>
        <Label>{T("lo stesso workflow, in Python (temporalio)", "the same workflow, in Python (temporalio)")}</Label>
        <Code>{T(`@workflow.defn
class OrdineWorkflow:
    def __init__(self) -> None:
        self.approvato = False

    @workflow.signal
    def approva(self) -> None:
        self.approvato = True

    @workflow.run
    async def run(self, ordine: Ordine) -> str:
        opts = dict(start_to_close_timeout=timedelta(seconds=30),
                    retry_policy=RetryPolicy(maximum_attempts=5))
        await workflow.execute_activity(addebita, ordine, **opts)
        await workflow.execute_activity(prenota_magazzino, ordine, **opts)
        await workflow.wait_condition(lambda: self.approvato)   # anche per giorni
        await workflow.execute_activity(spedisci, ordine, **opts)
        await asyncio.sleep(3 * 24 * 3600)   # in un workflow è un timer durevole
        await workflow.execute_activity(email_recensione, ordine, **opts)
        return "completato"`, `@workflow.defn
class OrderWorkflow:
    def __init__(self) -> None:
        self.approved = False

    @workflow.signal
    def approve(self) -> None:
        self.approved = True

    @workflow.run
    async def run(self, order: Order) -> str:
        opts = dict(start_to_close_timeout=timedelta(seconds=30),
                    retry_policy=RetryPolicy(maximum_attempts=5))
        await workflow.execute_activity(charge, order, **opts)
        await workflow.execute_activity(reserve_stock, order, **opts)
        await workflow.wait_condition(lambda: self.approved)    # even for days
        await workflow.execute_activity(ship, order, **opts)
        await asyncio.sleep(3 * 24 * 3600)   # inside a workflow it's a durable timer
        await workflow.execute_activity(review_email, order, **opts)
        return "completed"`)}</Code>
      </Card>
      <Card>
        <Label>{T("workflow e activity · due regole diverse", "workflow and activity · two different rules")}</Label>
        <Griglia intestazioni={["", "workflow", "activity"]} righe={T([
          ["contiene", "l'orchestrazione: ordine dei passi, if, attese", "il lavoro vero: API, DB, email, LLM"],
          ["se il worker muore", "viene rigiocato dalla history", "viene ritentata secondo la retry policy"],
          ["durata", "giorni, mesi", "secondi o minuti, con timeout"],
          ["regola", "deterministico: niente I/O, niente ora, niente random", "idempotente: può girare due volte"],
        ], [
          ["contains", "the orchestration: order of steps, ifs, waits", "the real work: APIs, DB, email, LLMs"],
          ["if the worker dies", "it's replayed from the history", "it's retried according to the retry policy"],
          ["duration", "days, months", "seconds or minutes, with a timeout"],
          ["rule", "deterministic: no I/O, no clock, no random", "idempotent: it may run twice"],
        ])} />
      </Card>
      <Card>
        <Label>{T("quando Temporal, quando no", "when Temporal, when not")}</Label>
        <Griglia intestazioni={T(["situazione", "strumento"], ["situation", "tool"])} righe={T([
          ["un lavoro singolo e indipendente (manda un'email)", "una coda"],
          ["una cosa periodica e semplice (report ogni notte)", "un cron"],
          ["più passi, attese di giorni, compensazioni se un passo fallisce", "Temporal"],
          ["tabella di stati + cron che la scandisce + code + retry scritti a mano", "è Temporal reinventato male"],
        ], [
          ["a single, independent job (send an email)", "a queue"],
          ["something simple and periodic (a nightly report)", "a cron"],
          ["several steps, waits of days, compensations if a step fails", "Temporal"],
          ["a status table + a cron that scans it + queues + hand-written retries", "that's Temporal reinvented badly"],
        ])} />
      </Card>
      <Note tone="amber" icon={AlertTriangle}>{T(
        <><span className="font-medium">Versioning.</span> Cambiare il codice di un workflow con dei run ancora in volo rompe il replay (NonDeterminismError: l'hai visto sopra). Si ramifica
        con <span className="font-mono">workflow.patched("antifrode")</span> — i run vecchi prendono il ramo vecchio, i nuovi quello nuovo — oppure si fanno girare worker diversi per le
        versioni diverse.</>,
        <><span className="font-medium">Versioning.</span> Changing a workflow's code while runs are still in flight breaks the replay (NonDeterminismError: you saw it above). You branch
        with <span className="font-mono">workflow.patched("antifraud")</span> — old runs take the old branch, new ones the new branch — or you run different workers for the
        different versions.</>
      )}</Note>
      <ScegliForma id="temporal-det" titolo={T("Si può scrivere dentro il workflow?", "Can you write it inside the workflow?")} intro={T("La regola del determinismo, caso per caso.", "The determinism rule, case by case.")} items={T([
        { pre: "datetime.now() per decidere se l'ordine è scaduto →", opts: ["sì", "no → workflow.now()"], ok: "no → workflow.now()", perche: "Nel replay datetime.now() darebbe un'ora diversa e il codice potrebbe prendere un altro ramo. workflow.now() restituisce l'ora registrata nella history." },
        { pre: "requests.get(...) per leggere il tasso di cambio →", opts: ["sì", "no → in un'activity"], ok: "no → in un'activity", perche: "L'I/O va nelle activity, il cui risultato finisce nella history. Nel workflow, al replay, rifaresti la chiamata e potresti ottenere un valore diverso." },
        { pre: "random.random() per l'A/B test →", opts: ["sì", "no → workflow.random()"], ok: "no → workflow.random()", perche: "workflow.random() è un generatore con seme fisso per quel run: stesso numero a ogni replay." },
        { pre: "if ordine.totale > 1000: su un input del workflow →", opts: ["sì", "no"], ok: "sì", perche: "Deterministico: stesso input, stesso ramo, in ogni replay." },
        { pre: "await asyncio.sleep(3 giorni) →", opts: ["sì", "no → cron"], ok: "sì", perche: "Dentro un workflow è un timer di Temporal: non tiene occupato nessun worker per 3 giorni e sopravvive ai crash." },
      ], [
        { pre: "datetime.now() to decide whether the order has expired →", opts: ["yes", "no → workflow.now()"], ok: "no → workflow.now()", perche: "In the replay datetime.now() would return a different time and the code could take another branch. workflow.now() returns the time recorded in the history." },
        { pre: "requests.get(...) to read the exchange rate →", opts: ["yes", "no → in an activity"], ok: "no → in an activity", perche: "I/O goes in activities, whose result ends up in the history. In the workflow, on replay, you'd make the call again and could get a different value." },
        { pre: "random.random() for the A/B test →", opts: ["yes", "no → workflow.random()"], ok: "no → workflow.random()", perche: "workflow.random() is a generator with a fixed seed for that run: the same number on every replay." },
        { pre: "if order.total > 1000: on a workflow input →", opts: ["yes", "no"], ok: "yes", perche: "Deterministic: same input, same branch, on every replay." },
        { pre: "await asyncio.sleep(3 days) →", opts: ["yes", "no → cron"], ok: "yes", perche: "Inside a workflow it's a Temporal timer: it doesn't tie up any worker for 3 days and it survives crashes." },
      ])} />
      <Riordina id="temporal-replay" titolo={T("Crash e ripresa, in ordine", "Crash and recovery, in order")} items={T([
        { it: "Cosa succede davvero", seq: ["il worker esegue il workflow", "chiama un'activity", "l'activity completa", "il server scrive ActivityTaskCompleted", "il worker muore", "un altro worker rigioca la history", "riprende dal passo successivo"], perche: "La history sta sul server Temporal, non sul worker: i worker sono intercambiabili e senza stato." },
      ], [
        { it: "What really happens", seq: ["the worker runs the workflow", "it calls an activity", "the activity completes", "the server writes ActivityTaskCompleted", "the worker dies", "another worker replays the history", "it resumes from the next step"], perche: "The history lives on the Temporal server, not on the worker: workers are interchangeable and stateless." },
      ])} />
      <Cloze id="temporal-parole" titolo={T("Il vocabolario", "The vocabulary")} items={T([
        { pre: "Un messaggio esterno che sblocca un workflow in attesa:", ok: "signal", perche: "Il pulsante «approva» dell'auditor o del manager arriva al workflow come signal." },
        { pre: "Leggere lo stato di un workflow in corso senza modificarlo: una", ok: "query", perche: "Le query leggono, i signal (e gli update) scrivono." },
        { pre: "Le activity possono essere ritentate, quindi devono essere", ok: ["idempotenti", "idempotente"], perche: "Un addebito ritentato non deve addebitare due volte: chiave di idempotenza verso il provider." },
      ], [
        { pre: "An external message that unblocks a waiting workflow:", ok: "signal", perche: "The auditor's or manager's “approve” button reaches the workflow as a signal." },
        { pre: "Reading the state of a running workflow without changing it: a", ok: "query", perche: "Queries read, signals (and updates) write." },
        { pre: "Activities can be retried, so they must be", ok: ["idempotent"], perche: "A retried charge must not charge twice: an idempotency key towards the provider." },
      ])} />
      <Takeaway>{T(
        <><span className="text-white">Workflow = orchestrazione deterministica</span>, rigiocata dalla history; <span className="text-white">activity = il lavoro vero</span>, ritentata → idempotente.
        Nel workflow niente ora, random o rete: <span className="font-mono">workflow.now()</span>, <span className="font-mono">workflow.random()</span>, activity. Signal per gli umani, timer
        durevoli per le attese. Cambi il codice con run in volo? <span className="font-mono">patched</span>, o il replay si rompe.</>,
        <><span className="text-white">Workflow = deterministic orchestration</span>, replayed from the history; <span className="text-white">activity = the real work</span>, retried → idempotent.
        In the workflow no clock, random or network: <span className="font-mono">workflow.now()</span>, <span className="font-mono">workflow.random()</span>, activities. Signals for humans, durable
        timers for waits. Changing the code with runs in flight? <span className="font-mono">patched</span>, or the replay breaks.</>
      )}</Takeaway>
    </div>
  );
}

/* ==========================================================================
   SYSTEM DESIGN · Sfida eventi
   ========================================================================== */

function SfEventiModule() {
  return (
    <div className="space-y-4">
      <Lead>{T(
        "Chiude il gruppo Kafka → outbox → Temporal. Un caso solo, che li chiede tutti e tre. La trappola è usare lo strumento giusto nel posto sbagliato.",
        "This wraps up the Kafka → outbox → Temporal group. A single case that needs all three. The trap is using the right tool in the wrong place."
      )}</Lead>
      <Sfida
        brief={T("E-commerce. Al checkout devi salvare l'ordine, addebitare, riservare la merce, mandare la conferma e, 7 giorni dopo, chiedere una recensione. Antifrode e analytics vogliono leggere tutti gli ordini. Se l'addebito fallisce dopo la prenotazione, la prenotazione va annullata.",
          "E-commerce. At checkout you must save the order, charge, reserve the goods, send the confirmation and, 7 days later, ask for a review. Antifraud and analytics want to read every order. If the charge fails after the reservation, the reservation must be cancelled.")}
        pool={T([
          { id: "ob", label: "Outbox nella transazione dell'ordine", role: "essential", why: "OrdineCreato non può perdersi né precedere il commit." },
          { id: "topic", label: "Topic Kafka «ordini» con key = order_id", role: "essential", why: "Antifrode e analytics leggono in modo indipendente, ognuno col suo gruppo; eventi di uno stesso ordine in fila." },
          { id: "wf", label: "Workflow Temporal: addebito → magazzino → email → timer 7 giorni", role: "essential", why: "Più passi, un'attesa lunga, una compensazione: è esattamente il suo caso d'uso." },
          { id: "comp", label: "Compensazione: se l'addebito fallisce, annulla la prenotazione", role: "essential", why: "È una saga: senza, la merce resta bloccata per sempre." },
          { id: "idem", label: "Consumer e activity idempotenti (dedup per id)", role: "essential", why: "Tutto qui è at-least-once: duplicati garantiti, prima o poi." },
          { id: "cdc", label: "Debezium (CDC) come relay dell'outbox", role: "optional", why: "Meglio del polling quando il volume cresce; all'inizio il polling basta." },
          { id: "dlt", label: "Dead-letter topic per gli eventi che falliscono sempre", role: "optional", why: "Un evento malformato non deve bloccare una partizione." },
          { id: "dw", label: "Scrivere nel DB e poi pubblicare su Kafka nello stesso handler", role: "wrong", why: "Dual write: il crash in mezzo perde l'evento." },
          { id: "cron", label: "Un cron ogni minuto che cerca gli ordini di 7 giorni fa", role: "wrong", why: "Funziona, ma riscrivi a mano stato, retry e idempotenza che il timer durevole ti dà gratis." },
          { id: "2pc", label: "Transazione distribuita (2PC) tra DB, Kafka e pagamenti", role: "wrong", why: "Il provider di pagamento non partecipa a un 2PC, e il 2PC blocca tutto se un partecipante rallenta." },
          { id: "sqs", label: "Una sola coda SQS letta sia da antifrode sia da analytics", role: "wrong", why: "Si contendono i messaggi: ciò che legge uno, l'altro non lo vede mai." },
        ], [
          { id: "ob", label: "An outbox in the order's transaction", role: "essential", why: "OrderCreated can't get lost or precede the commit." },
          { id: "topic", label: "A Kafka topic “orders” with key = order_id", role: "essential", why: "Antifraud and analytics read independently, each with its own group; events for the same order in sequence." },
          { id: "wf", label: "A Temporal workflow: charge → warehouse → email → 7-day timer", role: "essential", why: "Several steps, a long wait, a compensation: that's exactly its use case." },
          { id: "comp", label: "Compensation: if the charge fails, cancel the reservation", role: "essential", why: "It's a saga: without it, the goods stay blocked forever." },
          { id: "idem", label: "Idempotent consumers and activities (dedup by id)", role: "essential", why: "Everything here is at-least-once: duplicates are guaranteed, sooner or later." },
          { id: "cdc", label: "Debezium (CDC) as the outbox relay", role: "optional", why: "Better than polling once volume grows; at first polling is enough." },
          { id: "dlt", label: "A dead-letter topic for events that always fail", role: "optional", why: "A malformed event mustn't block a partition." },
          { id: "dw", label: "Write to the DB and then publish to Kafka in the same handler", role: "wrong", why: "Dual write: a crash in between loses the event." },
          { id: "cron", label: "A cron every minute that looks for 7-day-old orders", role: "wrong", why: "It works, but you rewrite by hand the state, retries and idempotency that the durable timer gives you for free." },
          { id: "2pc", label: "A distributed transaction (2PC) across the DB, Kafka and payments", role: "wrong", why: "The payment provider doesn't take part in a 2PC, and 2PC blocks everything if one participant slows down." },
          { id: "sqs", label: "A single SQS queue read by both antifraud and analytics", role: "wrong", why: "They compete for the messages: whatever one reads, the other never sees." },
        ])}
        reference={T("Transazione: ordine + riga outbox → relay (polling, poi Debezium) → topic «ordini» (key = order_id) letto da antifrode e analytics con gruppi separati. Il servizio ordini consuma OrdineCreato e avvia un workflow Temporal: addebita → prenota (compensazione: annulla se l'addebito fallisce) → email → timer 7 giorni → email recensione. Activity e consumer idempotenti.",
          "Transaction: order + outbox row → relay (polling, then Debezium) → topic “orders” (key = order_id) read by antifraud and analytics with separate groups. The orders service consumes OrderCreated and starts a Temporal workflow: charge → reserve (compensation: cancel if the charge fails) → email → 7-day timer → review email. Idempotent activities and consumers.")}
      />
      <Takeaway>{T(
        <>La divisione dei compiti: <span className="text-white">l'outbox garantisce che l'evento esista</span>, <span className="text-white">Kafka lo distribuisce a chiunque lo voglia</span>,
        <span className="text-white"> Temporal porta avanti il processo</span> passo dopo passo. Tre problemi diversi, tre strumenti — e l'idempotenza sotto tutti e tre.</>,
        <>The division of labour: <span className="text-white">the outbox guarantees the event exists</span>, <span className="text-white">Kafka distributes it to whoever wants it</span>,
        <span className="text-white"> Temporal drives the process</span> step by step. Three different problems, three tools — and idempotency underneath all three.</>
      )}</Takeaway>
    </div>
  );
}

/* ==========================================================================
   SQL & DATABASE · 1 — Progettare lo schema
   ========================================================================== */

const DM_ORD = memoByLang(() => [
  { id: 1, cliente: "c1", nome: "Anna Rossi", email: "anna@rossi.it", prodotto: T("Tappetino yoga", "Yoga mat"), prezzo: 29 },
  { id: 2, cliente: "c2", nome: "Bruno Galli", email: "bruno@galli.it", prodotto: "Kettlebell 8 kg", prezzo: 39 },
  { id: 3, cliente: "c1", nome: "Anna Rossi", email: "anna@rossi.it", prodotto: T("Borraccia", "Water bottle"), prezzo: 15 },
  { id: 4, cliente: "c3", nome: "Carla Neri", email: "carla@neri.it", prodotto: T("Tappetino yoga", "Yoga mat"), prezzo: 29 },
  { id: 5, cliente: "c1", nome: "Anna Rossi", email: "anna@rossi.it", prodotto: T("Fascia elastica", "Resistance band"), prezzo: 12 },
]);
const NUOVA_EMAIL = "anna.rossi@gmail.com";

/* Le chiavi delle righe restano in italiano (le usa la logica); in inglese
   cambia solo l'intestazione mostrata. */
const COL_EN = {
  cliente: "customer", nome: "name", prodotto: "product", prezzo: "price", cliente_id: "customer_id",
  prezzo_pagato: "price_paid", citta: "city", data: "date", importo: "amount",
};

function MiniTable({ cols, rows, bad = () => false }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-[11.5px] font-mono">
        <thead><tr className="bg-zinc-950">{cols.map((c) => <th key={c} className="text-left text-zinc-500 px-2 py-1 border-b border-zinc-800 font-normal">{T(c, COL_EN[c])}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={`border-b border-zinc-800/60 last:border-0 ${bad(r) ? "bg-red-950/50 text-red-200" : "text-zinc-300"}`}>
              {cols.map((c) => <td key={c} className="px-2 py-1 whitespace-nowrap">{String(r[c])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AnomalieLab() {
  const [norm, setNorm] = useState(false);
  const [act, setAct] = useState({ email: false, del: false, ins: false });
  const [last, setLast] = useState(null);
  const fai = (k) => { setAct((a) => ({ ...a, [k]: true })); setLast(k); };

  const denorm = DM_ORD().filter((r) => !(act.del && r.id === 2)).map((r) => (act.email && r.id === 5 ? { ...r, email: NUOVA_EMAIL } : r));
  const due = inconsistencies(denorm, "cliente", ["email"]);
  const clienti = [
    { id: "c1", nome: "Anna Rossi", email: act.email ? NUOVA_EMAIL : "anna@rossi.it" },
    { id: "c2", nome: "Bruno Galli", email: "bruno@galli.it" },
    { id: "c3", nome: "Carla Neri", email: "carla@neri.it" },
    ...(act.ins ? [{ id: "c4", nome: "Dario Conti", email: "dario@conti.it" }] : []),
  ];
  const ordini = DM_ORD().filter((r) => !(act.del && r.id === 2)).map((r) => ({ id: r.id, cliente_id: r.cliente, prodotto: r.prodotto, prezzo_pagato: r.prezzo }));

  const MSG = {
    denorm: {
      email: ["red", T("Hai aggiornato una riga su tre: per il DB Anna ha due email, e quale leggi dipende dalla query. Nessun vincolo te lo impedisce.", "You updated one row out of three: as far as the DB knows, Anna has two emails, and which one you read depends on the query. No constraint stops you.")],
      del: ["red", T("Bruno non esiste più da nessuna parte: cancellando il suo unico ordine hai cancellato anche il cliente. Anomalia di cancellazione.", "Bruno no longer exists anywhere: by deleting his only order you also deleted the customer. A deletion anomaly.")],
      ins: ["red", T("Non puoi: ogni riga è un ordine. Per registrare Dario dovresti inventare un ordine con prodotto e prezzo vuoti. Anomalia di inserimento.", "You can't: every row is an order. To register Dario you'd have to invent an order with an empty product and price. An insertion anomaly.")],
    },
    norm: {
      email: ["emerald", T("Una riga in clienti, una sola UPDATE: tutti gli ordini di Anna vedono la nuova email tramite cliente_id.", "One row in customers, a single UPDATE: all of Anna's orders see the new email through customer_id.")],
      del: ["emerald", T("L'ordine è sparito, Bruno no: il cliente vive nella sua tabella, indipendente dagli ordini.", "The order is gone, Bruno isn't: the customer lives in their own table, independent of the orders.")],
      ins: ["emerald", T("Una riga in clienti e basta: un cliente senza ordini è un fatto legittimo.", "One row in customers and that's it: a customer with no orders is a perfectly legitimate fact.")],
    },
  };
  const m = last && MSG[norm ? "norm" : "denorm"][last];
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Btn active={!norm} onClick={() => setNorm(false)}>{T("una tabella «ordini»", "one “orders” table")}</Btn>
        <Btn active={norm} onClick={() => setNorm(true)}>{T("normalizzato", "normalised")}</Btn>
        <button onClick={() => { setAct({ email: false, del: false, ins: false }); setLast(null); }} className="ml-auto text-zinc-500 hover:text-zinc-300" title="reset"><RotateCcw size={14} /></button>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <button onClick={() => fai("email")} className="px-2.5 py-1.5 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-300 text-[12px] hover:border-indigo-600">{T("Anna cambia email (aggiorni l'ordine #5)", "Anna changes email (you update order #5)")}</button>
        <button onClick={() => fai("del")} className="px-2.5 py-1.5 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-300 text-[12px] hover:border-indigo-600">{T("cancella l'ordine #2", "delete order #2")}</button>
        <button onClick={() => fai("ins")} className="px-2.5 py-1.5 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-300 text-[12px] hover:border-indigo-600">{T("registra Dario, ancora senza ordini", "register Dario, who has no orders yet")}</button>
      </div>
      {!norm ? (
        <MiniTable cols={["id", "cliente", "nome", "email", "prodotto", "prezzo"]} rows={denorm} bad={(r) => due.includes(r.cliente)} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-2">
          <div><Label>{T("clienti", "customers")}</Label><MiniTable cols={["id", "nome", "email"]} rows={clienti} /></div>
          <div><Label>{T("ordini", "orders")}</Label><MiniTable cols={["id", "cliente_id", "prodotto", "prezzo_pagato"]} rows={ordini} /></div>
        </div>
      )}
      {m && <div key={`${norm}-${last}`} className={`anim-rise mt-3 text-[12.5px] leading-relaxed ${m[0] === "red" ? "text-red-300" : "text-emerald-300"}`}>{m[1]}</div>}
      {!norm && due.length > 0 && <div className="mt-1 text-[11.5px] font-mono text-red-400">{T(`inconsistenze trovate: cliente ${due.join(", ")} ha più di un'email`, `inconsistencies found: customer ${due.join(", ")} has more than one email`)}</div>}
    </Card>
  );
}

const DOC_CELLE = memoByLang(() => ({
  "form|tab": { forma: T("≈ funziona, a fatica", "≈ works, with effort"), tone: "amber", nota: T("Cinque tabelle e cinque JOIN per rileggere un oggetto che non interroghi mai a pezzi.", "Five tables and five JOINs to reread an object you never query piece by piece.") },
  "form|doc": { forma: T("✓ un documento", "✓ a document"), tone: "emerald", nota: T("Letto e scritto sempre intero, nessuno lo filtra per campo: il caso ideale per un documento (o una colonna JSONB).", "Always read and written whole, nobody filters it by field: the ideal case for a document (or a JSONB column).") },
  "attr|tab": { forma: T("≈ 40 colonne quasi vuote", "≈ 40 mostly empty columns"), tone: "amber", nota: T("Taglia per le scarpe, pollici per le TV: o colonne piene di NULL, o il famigerato modello EAV (entità-attributo-valore), illeggibile.", "Size for shoes, inches for TVs: either columns full of NULLs, or the infamous EAV (entity-attribute-value) model, unreadable.") },
  "attr|doc": { forma: T("✓ ibrido", "✓ hybrid"), tone: "emerald", nota: T("Colonne fisse per ciò che è comune (nome, prezzo, categoria) + JSONB per gli attributi variabili, con indice GIN se ci filtri.", "Fixed columns for what's common (name, price, category) + JSONB for the variable attributes, with a GIN index if you filter on them.") },
  "report|tab": { forma: T("✓ il suo mestiere", "✓ its bread and butter"), tone: "emerald", nota: T("Fatturato per cliente per mese: GROUP BY e JOIN sono esattamente ciò che il relazionale fa meglio.", "Revenue per customer per month: GROUP BY and JOIN are exactly what the relational model does best.") },
  "report|doc": { forma: T("✗ scomodo e lento", "✗ awkward and slow"), tone: "red", nota: T("Dati annidati dentro milioni di documenti: ogni aggregazione diventa una pipeline complicata.", "Data nested inside millions of documents: every aggregation becomes a complicated pipeline.") },
  "rel|tab": { forma: T("✓ vincoli veri", "✓ real constraints"), tone: "emerald", nota: T("Chiavi esterne e vincoli garantiscono che un ordine punti a un cliente che esiste.", "Foreign keys and constraints guarantee that an order points to a customer that exists.") },
  "rel|doc": { forma: T("✗ le anomalie di sopra", "✗ the anomalies from above"), tone: "red", nota: T("Copi il cliente dentro ogni ordine: le anomalie di aggiornamento tornano, e stavolta nessun vincolo le ferma.", "You copy the customer into every order: the update anomalies come back, and this time no constraint stops them.") },
}));

function DmSchemaModule() {
  return (
    <div className="space-y-4">
      <Lead>{T(
        <>In «Modellare i dati» hai visto la regola: <span className="text-white font-medium">ogni fatto ha una sola casa</span>. Qui vedi cosa succede quando la violi — le
        <span className="text-white font-medium"> anomalie</span> — e le due domande che guidano davvero uno schema: <span className="text-white">da cosa dipende ogni fatto</span>
        (normalizzazione) e <span className="text-white">come verranno letti i dati</span> (che a volte ti fa denormalizzare apposta, o scegliere un documento).</>,
        <>In “Modelling the data” you saw the rule: <span className="text-white font-medium">every fact has exactly one home</span>. Here you see what happens when you break it — the
        <span className="text-white font-medium"> anomalies</span> — and the two questions that really drive a schema: <span className="text-white">what each fact depends on</span>
        (normalisation) and <span className="text-white">how the data will be read</span> (which sometimes makes you denormalise on purpose, or pick a document).</>
      )}</Lead>
      <Analogy>{T(
        "La rubrica. Se scrivi il numero di Anna su ogni biglietto d'auguri invece che in rubrica, quando cambia numero devi ritrovare tutti i biglietti. Ne dimentichi uno e hai due verità — e nessuno ti avvisa.",
        "The address book. If you write Anna's number on every greeting card instead of in the address book, when she changes number you have to find every card. Forget one and you have two truths — and nobody warns you."
      )}</Analogy>
      <Predict
        question={T("Tabella ordini con cliente_id, cliente_email, prodotto, prezzo. Anna ha 3 ordini. Cambia email e aggiorni solo la riga dell'ultimo ordine. Che email ha Anna?", "An orders table with customer_id, customer_email, product, price. Anna has 3 orders. She changes email and you only update the row of her latest order. What is Anna's email?")}
        options={T(["La nuova: il DB tiene la più recente", "Dipende da quale riga leggi: il DB ha due verità", "Nessuna: il DB blocca l'aggiornamento parziale"], ["The new one: the DB keeps the most recent", "It depends which row you read: the DB has two truths", "Neither: the DB blocks the partial update"])}
        answer={1}
        explain={T("Niente lega le tre righe fra loro: il DB salva quello che gli dici. È l'anomalia di aggiornamento — un fatto ripetuto in N posti, che prima o poi divergono.", "Nothing ties the three rows together: the DB stores what you tell it. It's the update anomaly — one fact repeated in N places, which sooner or later diverge.")}
      />
      <AnomalieLab />
      <Card>
        <Label>{T("le forme normali, in pratica · «la chiave, tutta la chiave, nient'altro che la chiave»", "normal forms, in practice · “the key, the whole key, and nothing but the key”")}</Label>
        <Griglia intestazioni={T(["forma", "la regola", "esempio che la viola"], ["form", "the rule", "an example that breaks it"])} righe={T([
          ["1NF", "Un valore per cella, niente liste in una colonna.", "tags = 'urgente,b2b,italia' → tabella order_tags (o un array con indice)."],
          ["2NF", "Con una chiave composta, ogni colonna dipende da TUTTA la chiave.", "order_items(order_id, product_id, product_name): il nome dipende solo da product_id → sta in products."],
          ["3NF", "Nessuna colonna dipende da un'altra colonna non chiave.", "ordini(cliente_id, cliente_email): l'email dipende dal cliente → sta in clienti."],
        ], [
          ["1NF", "One value per cell, no lists in a column.", "tags = 'urgent,b2b,italy' → an order_tags table (or an array with an index)."],
          ["2NF", "With a composite key, every column depends on the WHOLE key.", "order_items(order_id, product_id, product_name): the name depends only on product_id → it belongs in products."],
          ["3NF", "No column depends on another non-key column.", "orders(customer_id, customer_email): the email depends on the customer → it belongs in customers."],
        ])} />
      </Card>
      <Note tone="amber" icon={AlertTriangle}>{T(
        <><span className="font-medium">Il prezzo nella riga d'ordine non è una copia.</span> <span className="font-mono">order_items.unit_price</span> sembra un duplicato di
        <span className="font-mono"> products.price</span>, ma è un <span className="text-white">fatto diverso</span>: il prezzo <span className="text-white">pagato</span> quel giorno, contro il prezzo
        di listino di oggi. Se lo leggi con una JOIN, al prossimo cambio di listino la fattura di ieri cambia. Le denormalizzazioni vere, invece — un contatore
        <span className="font-mono"> comments_count</span>, una tabella per i report — si fanno sapendo chi le tiene allineate.</>,
        <><span className="font-medium">The price on the order line isn't a copy.</span> <span className="font-mono">order_items.unit_price</span> looks like a duplicate of
        <span className="font-mono"> products.price</span>, but it's a <span className="text-white">different fact</span>: the price <span className="text-white">paid</span> that day, versus today's list
        price. If you read it through a JOIN, yesterday's invoice changes at the next price-list update. Real denormalisations, on the other hand — a
        <span className="font-mono"> comments_count</span> counter, a reporting table — are done knowing who keeps the copies in sync.</>
      )}</Note>
      <TabellaViva titolo={T("Documento o tabelle?", "Document or tables?")} intro={T("Decide il modo in cui leggi i dati, non la moda.", "The way you read the data decides, not fashion.")}
        assi={{
          a: { label: T("i dati", "the data"), opts: [{ k: "form", label: T("config di un form, letta intera", "a form's config, read whole") }, { k: "attr", label: T("attributi diversi per categoria", "different attributes per category") }, { k: "report", label: T("fatturato per cliente per mese", "revenue per customer per month") }, { k: "rel", label: T("clienti ↔ ordini ↔ prodotti", "customers ↔ orders ↔ products") }] },
          b: { label: T("modello", "model"), opts: [{ k: "tab", label: T("tabelle relazionali", "relational tables") }, { k: "doc", label: T("documento / JSONB", "document / JSONB") }] },
        }}
        celle={DOC_CELLE()} />
      <Card>
        <Label>{T("l'ibrido che userai più spesso · Postgres", "the hybrid you'll use most often · Postgres")}</Label>
        <Code>{`CREATE TABLE products (
  id           bigint PRIMARY KEY,
  name         text    NOT NULL,
  category     text    NOT NULL,
  price_cents  integer NOT NULL CHECK (price_cents >= 0),   -- ${T("soldi: interi, mai float", "money: integers, never floats")}
  attrs        jsonb   NOT NULL DEFAULT '{}'                -- ${T("taglia, pollici, colore…", "size, inches, colour…")}
);
CREATE INDEX ON products USING gin (attrs);

SELECT name FROM products WHERE attrs @> '{"${T("taglia", "size")}": 42}';`}</Code>
      </Card>
      <ScegliForma id="dm-schema" titolo={T("Resta o si sposta?", "Does it stay or move?")} items={T([
        { pre: "order_items(order_id, product_id, product_name, qty): product_name →", opts: ["resta, serve nel report", "va in products"], ok: "va in products", perche: "Dipende solo da product_id, non da tutta la chiave (2NF). Nel report lo prendi con una JOIN." },
        { pre: "order_items.unit_price, copiato al momento dell'ordine →", opts: ["denormalizzazione da togliere", "resta: è il prezzo pagato"], ok: "resta: è il prezzo pagato", perche: "Il listino cambierà, quanto ha pagato il cliente no. Due fatti, due colonne." },
        { pre: "clienti.tags = 'vip,newsletter' →", opts: ["va bene, è compatto", "viola 1NF"], ok: "viola 1NF", perche: "Non puoi indicizzarlo né contare «quanti vip» senza parsare stringhe. Tabella a parte, o un array text[] con indice GIN." },
        { pre: "clienti(cap, città): il CAP determina la città, quindi tabella a parte?", opts: ["sì, è 3NF", "no, non è una vera dipendenza"], ok: "no, non è una vera dipendenza", perche: "In Italia molti CAP coprono più comuni: il CAP non determina la città. Si normalizza sulle dipendenze reali del dominio, non su quelle che sembrano ovvie." },
      ], [
        { pre: "order_items(order_id, product_id, product_name, qty): product_name →", opts: ["stays, the report needs it", "moves to products"], ok: "moves to products", perche: "It depends only on product_id, not on the whole key (2NF). In the report you get it with a JOIN." },
        { pre: "order_items.unit_price, copied at order time →", opts: ["denormalisation to remove", "stays: it's the price paid"], ok: "stays: it's the price paid", perche: "The price list will change, what the customer paid won't. Two facts, two columns." },
        { pre: "customers.tags = 'vip,newsletter' →", opts: ["fine, it's compact", "breaks 1NF"], ok: "breaks 1NF", perche: "You can't index it or count “how many VIPs” without parsing strings. A separate table, or a text[] array with a GIN index." },
        { pre: "customers(postcode, city): the postcode determines the city, so a separate table?", opts: ["yes, it's 3NF", "no, it's not a real dependency"], ok: "no, it's not a real dependency", perche: "In Italy many postcodes cover several towns: the postcode doesn't determine the city. You normalise on the domain's real dependencies, not on the ones that look obvious." },
      ])} />
      <Cloze id="dm-schema-parole" titolo={T("Completa", "Fill in the blank")} items={T([
        { pre: "«La chiave, tutta la chiave, nient'altro che la", ok: "chiave", post: "»", perche: "1NF (la chiave identifica la riga), 2NF (tutta la chiave), 3NF (niente dipendenze fra colonne non chiave)." },
        { pre: "Il tipo di Postgres per dati semistrutturati, indicizzabile con GIN:", ok: "jsonb", perche: "jsonb (binario) e non json (testo): si indicizza e si interroga con operatori come @>." },
      ], [
        { pre: "“The key, the whole key, and nothing but the", ok: "key", post: "”", perche: "1NF (the key identifies the row), 2NF (the whole key), 3NF (no dependencies between non-key columns)." },
        { pre: "The Postgres type for semi-structured data, indexable with GIN:", ok: "jsonb", perche: "jsonb (binary), not json (text): it can be indexed and queried with operators like @>." },
      ])} />
      <Takeaway>{T(
        <>Uno schema si progetta con due domande: <span className="text-white">da cosa dipende ogni fatto?</span> — mettilo lì, una volta sola; <span className="text-white">come verrà
        letto?</span> — se sempre in blocco e senza vincoli, un documento (o una colonna JSONB) va bene. Denormalizza solo sapendo chi tiene allineate le copie. E il prezzo
        pagato non è una copia del listino: è un altro fatto.</>,
        <>A schema is designed with two questions: <span className="text-white">what does each fact depend on?</span> — put it there, once; <span className="text-white">how will it be
        read?</span> — if always as a whole and with no constraints, a document (or a JSONB column) is fine. Denormalise only when you know who keeps the copies in sync. And the price
        paid isn't a copy of the price list: it's a different fact.</>
      )}</Takeaway>
    </div>
  );
}

/* ==========================================================================
   SQL & DATABASE · 2 — Dati nel tempo & analisi
   ========================================================================== */

const STAR = memoByLang(() => ({
  fact: { label: T("fact_vendite", "fact_sales"), tone: "indigo",
    cols: T(["data_key → dim_data", "cliente_key → dim_cliente", "prodotto_key → dim_prodotto", "negozio_key → dim_negozio", "quantita", "importo"], ["date_key → dim_date", "customer_key → dim_customer", "product_key → dim_product", "store_key → dim_store", "quantity", "amount"]),
    q: T("Una riga per ogni riga di scontrino: il fatto misurabile. Lunghissima (miliardi di righe) e stretta: solo chiavi e numeri.", "One row per receipt line: the measurable fact. Very long (billions of rows) and narrow: just keys and numbers.") },
  data: { label: T("dim_data", "dim_date"), tone: "blue",
    cols: T(["data_key", "data", "giorno_settimana", "mese", "trimestre", "anno", "festivo"], ["date_key", "date", "day_of_week", "month", "quarter", "year", "holiday"]),
    q: T("«Vendite nei weekend di dicembre»: il calendario precalcolato una volta, così nessuno fa acrobazie con le date nelle query.", "“Sales on December weekends”: the calendar precomputed once, so nobody does date acrobatics in their queries.") },
  cliente: { label: T("dim_cliente", "dim_customer"), tone: "emerald",
    cols: T(["cliente_key", "cliente_id (dell'app)", "nome", "città", "regione", "segmento", "valid_from", "valid_to"], ["customer_key", "customer_id (from the app)", "name", "city", "region", "segment", "valid_from", "valid_to"]),
    q: T("«Fatturato per regione e segmento»: le descrizioni per filtrare e raggruppare. valid_from/valid_to servono a conservare la storia (SCD 2, qui sotto).", "“Revenue by region and segment”: the descriptions you filter and group by. valid_from/valid_to are there to keep history (SCD 2, below).") },
  prodotto: { label: T("dim_prodotto", "dim_product"), tone: "amber",
    cols: T(["prodotto_key", "sku", "nome", "categoria", "marca"], ["product_key", "sku", "name", "category", "brand"]),
    q: T("«Quali categorie crescono?»: la gerarchia prodotto → categoria → reparto, già appiattita.", "“Which categories are growing?”: the product → category → department hierarchy, already flattened.") },
  negozio: { label: T("dim_negozio", "dim_store"), tone: "red",
    cols: T(["negozio_key", "nome", "città", "area", "apertura"], ["store_key", "name", "city", "area", "opened"]),
    q: T("«Negozi aperti da meno di un anno contro gli altri»: gli attributi del punto vendita.", "“Stores open for less than a year versus the rest”: the attributes of the point of sale.") },
}));
const STAR_POS = { data: "col-start-2 row-start-1", cliente: "col-start-1 row-start-2", fact: "col-start-2 row-start-2", prodotto: "col-start-3 row-start-2", negozio: "col-start-2 row-start-3" };

function StarSchema() {
  const [k, setK] = useState("fact");
  const star = STAR();
  const cur = star[k];
  return (
    <Card>
      <Label>{T("star schema · clicca una tabella", "star schema · click a table")}</Label>
      <div className="grid grid-cols-3 grid-rows-3 gap-2 mb-3">
        {Object.entries(star).map(([key, t]) => (
          <button key={key} onClick={() => setK(key)} className={`${STAR_POS[key]} rounded-lg border px-2 py-2.5 font-mono text-[12px] transition-all ${k === key ? `${TONE[t.tone].pill} ring-1 ring-indigo-500` : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600"} ${key === "fact" ? "font-semibold" : ""}`}>{t.label}</button>
        ))}
      </div>
      <div key={k} className="anim-rise rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5">
        <div className="font-mono text-[11.5px] text-zinc-400 mb-1.5">{cur.cols.join(" · ")}</div>
        <div className="text-[13px] text-zinc-300 leading-relaxed">{cur.q}</div>
      </div>
    </Card>
  );
}

const SCD_CHANGES = memoByLang(() => [{ from: "2024-01-01", citta: T("Milano", "Milan") }, { from: "2026-03-01", citta: T("Berlino", "Berlin") }]);
const SCD_FACTS = [{ date: "2025-06-10", importo: 80 }, { date: "2025-11-02", importo: 120 }, { date: "2026-05-20", importo: 200 }];

function ScdLab() {
  const [type, setType] = useState(1);
  const rows = scdRows(SCD_CHANGES(), type);
  const tot = salesByCity(SCD_FACTS, rows);
  return (
    <Card>
      <Label>{T("Anna si trasferisce da Milano a Berlino il 1° marzo 2026", "Anna moves from Milan to Berlin on 1 March 2026")}</Label>
      <div className="flex gap-2 mb-3">
        <Btn active={type === 1} onClick={() => setType(1)}>{T("SCD tipo 1 · sovrascrivi", "SCD type 1 · overwrite")}</Btn>
        <Btn active={type === 2} onClick={() => setType(2)}>{T("SCD tipo 2 · versiona", "SCD type 2 · version")}</Btn>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>{T("dim_cliente (Anna)", "dim_customer (Anna)")}</Label>
          <MiniTable cols={["citta", "valid_from", "valid_to", "is_current"]} rows={rows.map((r) => ({ citta: r.citta, valid_from: r.from, valid_to: r.to ?? "NULL", is_current: r.current }))} />
          <div className="mt-2"><Label>{T("fact_vendite (Anna)", "fact_sales (Anna)")}</Label>
            <MiniTable cols={["data", "importo"]} rows={SCD_FACTS.map((f) => ({ data: f.date, importo: `${f.importo} €` }))} />
          </div>
        </div>
        <div>
          <Label>{T("report · vendite per città", "report · sales by city")}</Label>
          <div className="space-y-1.5">
            {Object.entries(tot).map(([c, v]) => (
              <div key={c} className="anim-rise flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5">
                <span className="text-[13px] text-zinc-200">{c}</span><span className="ml-auto font-mono text-indigo-200">{v} €</span>
              </div>
            ))}
          </div>
          <p className={`text-[12.5px] mt-3 leading-relaxed ${type === 1 ? "text-red-300" : "text-emerald-300"}`}>
            {type === 1
              ? T("Gli acquisti del 2025, fatti a Milano, risultano fatti a Berlino: hai riscritto il passato con un UPDATE. Nessun errore, solo un report sbagliato.",
                  "The 2025 purchases, made in Milan, now show up as made in Berlin: you rewrote the past with an UPDATE. No error, just a wrong report.")
              : T("Ogni vendita si aggancia alla versione di Anna valida in quella data: 200 € a Milano, 200 € a Berlino. Il passato resta com'era.",
                  "Each sale attaches to the version of Anna valid on that date: €200 in Milan, €200 in Berlin. The past stays as it was.")}
          </p>
        </div>
      </div>
    </Card>
  );
}

const CONTO = [
  { t: "ContoAperto" }, { t: "Depositato", n: 500 }, { t: "Prelevato", n: 120 }, { t: "Depositato", n: 80 }, { t: "Prelevato", n: 300 },
];
const EV_EN = { ContoAperto: "AccountOpened", Depositato: "Deposited", Prelevato: "Withdrawn" };

function EventiConto() {
  const [k, setK] = useState(CONTO.length);
  const st = fold(CONTO.slice(0, k));
  return (
    <Card>
      <Label>{T("event sourcing · lo stato non si salva, si ricava dagli eventi", "event sourcing · state isn't stored, it's derived from the events")}</Label>
      <div className="flex gap-1.5 flex-wrap mb-3">
        {CONTO.map((e, i) => (
          <span key={i} className={`font-mono text-[11.5px] rounded-md border px-2 py-1 ${i < k ? "border-indigo-700 bg-indigo-950 text-indigo-100" : "border-zinc-800 bg-zinc-950 text-zinc-600"}`}>{i + 1}. {T(e.t, EV_EN[e.t])}{e.n ? ` ${e.n}` : ""}</span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-zinc-500 shrink-0">{T(`rigioca fino all'evento ${k}`, `replay up to event ${k}`)}</span>
        <input type="range" min={0} max={CONTO.length} value={k} onChange={(e) => setK(+e.target.value)} className="flex-1 accent-indigo-500" />
        <span className="font-mono text-lg text-indigo-200 shrink-0">{st.saldo} €</span>
      </div>
      <p className="text-[12.5px] text-zinc-400 mt-2 leading-relaxed">{T(
        <>«Quanto aveva Anna dopo il secondo movimento?» ha una risposta esatta: rigiochi fino a lì. Con una colonna <span className="font-mono">saldo</span> aggiornata a ogni movimento, quella domanda non ha più risposta.</>,
        <>“How much did Anna have after the second transaction?” has an exact answer: you replay up to there. With a <span className="font-mono">balance</span> column updated on every transaction, that question no longer has an answer.</>
      )}</p>
    </Card>
  );
}

function DmTempoModule() {
  return (
    <div className="space-y-4">
      <Lead>{T(
        <>Il DB dell'app risponde a «qual è lo stato <span className="text-white">adesso</span>?», un utente alla volta (<span className="text-white font-medium">OLTP</span>). Le domande del
        business sono diverse: «fatturato per regione per trimestre negli ultimi tre anni» — milioni di righe, poche colonne, e soprattutto il <span className="text-white">passato</span>
        (<span className="text-white font-medium">OLAP</span>). Due problemi: modellare per l'analisi (star schema) e non perdere la storia (SCD, audit, event sourcing).</>,
        <>The app's DB answers “what is the state <span className="text-white">right now</span>?”, one user at a time (<span className="text-white font-medium">OLTP</span>). The business's
        questions are different: “revenue by region by quarter over the last three years” — millions of rows, few columns, and above all the <span className="text-white">past</span>
        (<span className="text-white font-medium">OLAP</span>). Two problems: modelling for analysis (star schema) and not losing history (SCD, audit, event sourcing).</>
      )}</Lead>
      <Analogy>{T(
        "L'OLTP è la cassa del negozio: veloce, uno scontrino alla volta. L'OLAP è il commercialista a fine anno: legge tutti gli scontrini e li raggruppa in cento modi. Non vuoi che il commercialista lavori alla cassa mentre la gente fa la coda.",
        "OLTP is the shop till: fast, one receipt at a time. OLAP is the accountant at year end: they read every receipt and group them a hundred ways. You don't want the accountant working at the till while people are queuing."
      )}</Analogy>
      <Predict
        question={T("Anna viveva a Milano; a marzo 2026 si trasferisce a Berlino e fai UPDATE clienti SET città = 'Berlino'. Il report «vendite per città 2025» dove mette i suoi acquisti del 2025?", "Anna lived in Milan; in March 2026 she moves to Berlin and you run UPDATE customers SET city = 'Berlin'. Where does the “2025 sales by city” report put her 2025 purchases?")}
        options={T(["Milano: il report usa la data dell'ordine", "Berlino: la JOIN prende la città di oggi, il passato è stato sovrascritto", "Metà e metà"], ["Milan: the report uses the order date", "Berlin: the JOIN takes today's city, the past has been overwritten", "Half and half"])}
        answer={1}
        explain={T("La JOIN tra ordini e clienti legge il valore attuale. Hai riscritto la storia senza accorgertene. La SCD tipo 2 risolve: una riga per ogni versione del cliente, con validità.", "The JOIN between orders and customers reads the current value. You rewrote history without noticing. SCD type 2 fixes it: one row per version of the customer, with a validity period.")}
      />
      <ScdLab />
      <Card>
        <Label>{T("due mondi, due modelli", "two worlds, two models")}</Label>
        <Griglia intestazioni={T(["", "OLTP · l'app", "OLAP · l'analisi"], ["", "OLTP · the app", "OLAP · analysis"])} righe={T([
          ["domanda tipica", "l'ordine 91 di Anna", "fatturato per regione per trimestre"],
          ["righe per query", "poche, per chiave", "milioni, su poche colonne"],
          ["scritture", "tante, piccole, concorrenti", "carichi a lotti (ETL/ELT), di notte o in streaming"],
          ["modello", "normalizzato (3NF)", "star schema: fact + dimensioni"],
          ["motore", "a righe: Postgres, MySQL", "colonnare: BigQuery, Snowflake, ClickHouse"],
        ], [
          ["typical question", "Anna's order 91", "revenue by region by quarter"],
          ["rows per query", "few, by key", "millions, over few columns"],
          ["writes", "many, small, concurrent", "batch loads (ETL/ELT), overnight or streaming"],
          ["model", "normalised (3NF)", "star schema: facts + dimensions"],
          ["engine", "row-based: Postgres, MySQL", "columnar: BigQuery, Snowflake, ClickHouse"],
        ])} />
      </Card>
      <StarSchema />
      <Card>
        <Label>{T("la forma di ogni query analitica · fact + JOIN alle dimensioni + GROUP BY", "the shape of every analytical query · fact + JOINs to the dimensions + GROUP BY")}</Label>
        <Code>{T(`SELECT d.anno, d.trimestre, c.regione, SUM(f.importo) AS fatturato
FROM fact_vendite f
JOIN dim_data    d ON d.data_key    = f.data_key
JOIN dim_cliente c ON c.cliente_key = f.cliente_key   -- la versione valida quel giorno
WHERE d.anno >= 2024
GROUP BY d.anno, d.trimestre, c.regione;`, `SELECT d.year, d.quarter, c.region, SUM(f.amount) AS revenue
FROM fact_sales f
JOIN dim_date     d ON d.date_key     = f.date_key
JOIN dim_customer c ON c.customer_key = f.customer_key   -- the version valid on that day
WHERE d.year >= 2024
GROUP BY d.year, d.quarter, c.region;`)}</Code>
      </Card>
      <EventiConto />
      <Card>
        <Label>{T("conservare la storia · dal più semplice al più radicale", "keeping history · from the simplest to the most radical")}</Label>
        <Griglia intestazioni={T(["tecnica", "cosa conserva", "attenzione"], ["technique", "what it keeps", "watch out"])} righe={T([
          ["colonne di audit", "created_at, updated_at, created_by", "Dicono quando, non cosa c'era prima."],
          ["soft delete", "deleted_at invece di DELETE", "Ogni query deve filtrarlo; gli UNIQUE vanno resi parziali; e per il GDPR non è una cancellazione."],
          ["tabella history", "una copia della riga a ogni modifica (trigger)", "Chi ha cambiato cosa e quando: l'audit trail vero."],
          ["SCD tipo 2", "una riga per versione, con validità", "Per le dimensioni che cambiano e contano nei report."],
          ["event sourcing", "solo gli eventi; lo stato è derivato", "Potente dove lo storico È il dominio (soldi, magazzino). Ogni lettura diventa una proiezione da mantenere: non è il default."],
        ], [
          ["audit columns", "created_at, updated_at, created_by", "They say when, not what was there before."],
          ["soft delete", "deleted_at instead of DELETE", "Every query must filter it; UNIQUEs have to become partial; and under GDPR it isn't a deletion."],
          ["history table", "a copy of the row on every change (trigger)", "Who changed what and when: the real audit trail."],
          ["SCD type 2", "one row per version, with validity", "For dimensions that change and matter in reports."],
          ["event sourcing", "only the events; state is derived", "Powerful where history IS the domain (money, inventory). Every read becomes a projection to maintain: it's not the default."],
        ])} />
        <div className="mt-3"><Code>{`-- ${T("soft delete fatto bene: l'email torna libera quando l'utente è cancellato", "soft delete done right: the email becomes free again once the user is deleted")}
ALTER TABLE users ADD COLUMN deleted_at timestamptz;
CREATE UNIQUE INDEX ${T("users_email_attivi", "users_email_active")} ON users (email) WHERE deleted_at IS NULL;`}</Code></div>
      </Card>
      <ScegliForma id="dm-tempo" titolo={T("Quale strumento?", "Which tool?")} items={T([
        { pre: "La finanza vuole il fatturato per regione degli ultimi 5 anni, ogni mattina →", opts: ["query sul Postgres dell'app", "data warehouse con star schema"], ok: "data warehouse con star schema", perche: "Scansioni enormi sul DB che serve gli utenti = app lenta per tutti. Si copia a lotti in un motore colonnare fatto per quello." },
        { pre: "Vuoi sapere il prezzo di listino in vigore in ogni data →", opts: ["SCD tipo 1", "SCD tipo 2"], ok: "SCD tipo 2", perche: "Ogni cambio di prezzo è una nuova riga con valid_from/valid_to." },
        { pre: "Correggi un refuso nel nome di un cliente →", opts: ["SCD tipo 1", "SCD tipo 2"], ok: "SCD tipo 1", perche: "Un refuso non è storia: nessuno vuole un report che separa «Mraio» da «Mario». Si sovrascrive." },
        { pre: "Un conto dove ogni movimento dev'essere ricostruibile e mai modificato →", opts: ["UPDATE saldo", "eventi append-only + saldo derivato"], ok: "eventi append-only + saldo derivato", perche: "Lo storico è il dominio: il saldo è una proiezione degli eventi, ricalcolabile in qualsiasi momento." },
        { pre: "Cosa va nella tabella fact?", opts: ["nome e città del cliente", "importi e chiavi verso le dimensioni"], ok: "importi e chiavi verso le dimensioni", perche: "La fact è stretta: misure e chiavi. Le descrizioni stanno nelle dimensioni, una volta sola." },
      ], [
        { pre: "Finance wants revenue by region for the last 5 years, every morning →", opts: ["a query on the app's Postgres", "a data warehouse with a star schema"], ok: "a data warehouse with a star schema", perche: "Huge scans on the DB that serves the users = a slow app for everyone. You copy it in batches into a columnar engine built for that." },
        { pre: "You want to know the list price in force on every date →", opts: ["SCD type 1", "SCD type 2"], ok: "SCD type 2", perche: "Every price change is a new row with valid_from/valid_to." },
        { pre: "You fix a typo in a customer's name →", opts: ["SCD type 1", "SCD type 2"], ok: "SCD type 1", perche: "A typo isn't history: nobody wants a report that separates “Mraio” from “Mario”. You overwrite it." },
        { pre: "An account where every transaction must be reconstructable and never changed →", opts: ["UPDATE balance", "append-only events + derived balance"], ok: "append-only events + derived balance", perche: "History is the domain: the balance is a projection of the events, recomputable at any time." },
        { pre: "What goes in the fact table?", opts: ["the customer's name and city", "amounts and keys to the dimensions"], ok: "amounts and keys to the dimensions", perche: "The fact table is narrow: measures and keys. The descriptions live in the dimensions, once." },
      ])} />
      <Cloze id="dm-tempo-parole" titolo={T("Il vocabolario", "The vocabulary")} items={T([
        { pre: "La tabella centrale dello star schema, con le misure: tabella", ok: "fact", perche: "Fatti misurabili (importo, quantità), circondati dalle dimensioni che li descrivono." },
        { pre: "Soft delete: invece di DELETE si valorizza la colonna", ok: ["deleted_at"], perche: "E da quel momento ogni query deve ricordarsi WHERE deleted_at IS NULL (una view aiuta)." },
        { pre: "Nella SCD tipo 2, la versione attuale ha valid_to NULL e il flag is_", ok: "current", perche: "Così la query «stato attuale» non deve confrontare date." },
      ], [
        { pre: "The central table of a star schema, holding the measures: the", ok: "fact", post: "table", perche: "Measurable facts (amount, quantity), surrounded by the dimensions that describe them." },
        { pre: "Soft delete: instead of DELETE you set the column", ok: ["deleted_at"], perche: "And from then on every query has to remember WHERE deleted_at IS NULL (a view helps)." },
        { pre: "In SCD type 2, the current version has valid_to NULL and the flag is_", ok: "current", perche: "So the “current state” query doesn't have to compare dates." },
      ])} />
      <Takeaway>{T(
        <>Due domande prima di modellare: <span className="text-white">chi legge?</span> — l'app, un record alla volta (OLTP, normalizzato) o l'analisi, milioni di righe (OLAP, star schema
        su un motore colonnare). <span className="text-white">Il passato conta?</span> — allora non sovrascrivere: SCD 2 per le dimensioni che cambiano, tabella history per l'audit,
        event sourcing solo dove lo storico è il dominio.</>,
        <>Two questions before you model: <span className="text-white">who reads it?</span> — the app, one record at a time (OLTP, normalised) or analysis, millions of rows (OLAP, star schema
        on a columnar engine). <span className="text-white">Does the past matter?</span> — then don't overwrite: SCD 2 for dimensions that change, a history table for audit,
        event sourcing only where history is the domain.</>
      )}</Takeaway>
    </div>
  );
}

/* ==========================================================================
   SQL & DATABASE · Sfida
   ========================================================================== */

function SfDatiModule() {
  return (
    <div className="space-y-4">
      <Lead>{T(
        "Chiude i due capitoli di data modelling, e usa anche «Modellare i dati» e «Relazioni & transazioni». Un dominio piccolo ma vero, con dentro tutte le trappole di prima.",
        "This wraps up the two data-modelling chapters, and also draws on “Modelling the data” and “Relations & transactions”. A small but real domain, with every earlier trap inside it."
      )}</Lead>
      <Sfida
        brief={T("Catena di palestre con più sedi: iscritti, abbonamenti (mensile o annuale, il listino cambia nel tempo), prenotazioni ai corsi con posti limitati, ingressi col badge. La direzione vuole i report su incassi e presenze per sede degli ultimi 3 anni.",
          "A gym chain with several locations: members, memberships (monthly or yearly, the price list changes over time), class bookings with limited places, badge check-ins. Management wants reports on takings and attendance per location for the last 3 years.")}
        pool={T([
          { id: "tab", label: "Tabelle members, plans, subscriptions, classes, bookings con chiavi esterne", role: "essential", why: "Ogni fatto nella sua casa, collegato per id." },
          { id: "prezzo", label: "Prezzo pagato salvato in subscriptions", role: "essential", why: "Il listino cambia, quanto ha pagato Marco a gennaio no." },
          { id: "uniq", label: "UNIQUE(class_id, member_id) + controllo della capienza in transazione", role: "essential", why: "Niente doppie prenotazioni; i posti limitati sono una contesa (come i biglietti in «Ticketmaster»)." },
          { id: "ingr", label: "Ingressi come tabella append-only (member_id, sede_id, timestamp)", role: "essential", why: "Fatti che non cambiano: si aggiungono, non si modificano." },
          { id: "star", label: "Report su star schema: fact_ingressi, fact_incassi + dim_data, dim_sede, dim_member", role: "essential", why: "Tre anni di storico e aggregazioni per sede: lavoro da OLAP, non dal DB dell'app." },
          { id: "scd", label: "SCD tipo 2 su dim_member (sede di riferimento, livello)", role: "optional", why: "Utile se i report per sede devono seguire i trasferimenti degli iscritti." },
          { id: "json", label: "JSONB per le preferenze dell'iscritto (notifiche, lingua)", role: "optional", why: "Dati letti in blocco e mai filtrati: il caso buono per un documento." },
          { id: "lista", label: "Colonna corsi_prenotati = 'yoga,pilates' in members", role: "wrong", why: "Viola 1NF: non puoi contare i posti né fare JOIN." },
          { id: "doc", label: "Un solo documento JSON per iscritto con dentro abbonamenti e ingressi", role: "wrong", why: "Cresce senza limite, nessun vincolo, report impossibili." },
          { id: "join", label: "subscriptions legge il prezzo con una JOIN su plans.prezzo_attuale", role: "wrong", why: "A ogni cambio di listino riscrivi quanto hanno pagato tutti." },
          { id: "live", label: "Report direttamente sulle tabelle dell'app nell'ora di punta", role: "wrong", why: "Scansioni enormi mentre la gente prova a prenotare: app lenta per tutti." },
        ], [
          { id: "tab", label: "members, plans, subscriptions, classes, bookings tables with foreign keys", role: "essential", why: "Every fact in its own home, linked by id." },
          { id: "prezzo", label: "The price paid stored in subscriptions", role: "essential", why: "The price list changes; what Marco paid in January doesn't." },
          { id: "uniq", label: "UNIQUE(class_id, member_id) + a capacity check inside a transaction", role: "essential", why: "No double bookings; limited places are a contention problem (like the tickets in “Ticketmaster”)." },
          { id: "ingr", label: "Check-ins as an append-only table (member_id, location_id, timestamp)", role: "essential", why: "Facts that never change: you add them, you don't modify them." },
          { id: "star", label: "Reports on a star schema: fact_checkins, fact_takings + dim_date, dim_location, dim_member", role: "essential", why: "Three years of history and aggregations per location: OLAP work, not the app DB's." },
          { id: "scd", label: "SCD type 2 on dim_member (home location, tier)", role: "optional", why: "Useful if per-location reports must follow members when they transfer." },
          { id: "json", label: "JSONB for the member's preferences (notifications, language)", role: "optional", why: "Data read as a whole and never filtered: the good case for a document." },
          { id: "lista", label: "A booked_classes = 'yoga,pilates' column in members", role: "wrong", why: "Breaks 1NF: you can't count places or JOIN." },
          { id: "doc", label: "One JSON document per member holding memberships and check-ins", role: "wrong", why: "It grows without limit, no constraints, reports become impossible." },
          { id: "join", label: "subscriptions reads the price with a JOIN on plans.current_price", role: "wrong", why: "Every price-list change rewrites what everyone paid." },
          { id: "live", label: "Reports straight off the app's tables at peak hour", role: "wrong", why: "Huge scans while people are trying to book: a slow app for everyone." },
        ])}
        reference={T("OLTP normalizzato: members, plans, subscriptions (con prezzo pagato), classes, bookings (UNIQUE + capienza in transazione), entries append-only. Ogni notte un job carica fact_incassi e fact_ingressi con dim_data, dim_sede, dim_member (SCD 2 se serve seguire i trasferimenti). Preferenze in JSONB.",
          "Normalised OLTP: members, plans, subscriptions (with the price paid), classes, bookings (UNIQUE + capacity in a transaction), append-only entries. Every night a job loads fact_takings and fact_checkins with dim_date, dim_location, dim_member (SCD 2 if transfers must be followed). Preferences in JSONB.")}
      />
      <Takeaway>{T(
        <>La prova che uno schema regge: <span className="text-white">per ogni fatto sai dire dove vive, se può cambiare, e chi lo leggerà</span>. Se una di queste tre risposte è
        «boh», lì c'è l'anomalia che ti morderà.</>,
        <>The test of whether a schema holds up: <span className="text-white">for every fact you can say where it lives, whether it can change, and who will read it</span>. If any of those three answers is
        “no idea”, that's where the anomaly that will bite you is hiding.</>
      )}</Takeaway>
    </div>
  );
}

/* ==========================================================================
   AUTH & SICUREZZA · OAuth flussi & scope
   ========================================================================== */

const FLOWS = memoByLang(() => ({
  cc: { name: "Client Credentials", tone: "blue",
    why: T("Nessun utente = nessuno a cui chiedere il consenso. Il client si autentica con le SUE credenziali e riceve un token per sé.",
      "No user = nobody to ask for consent. The client authenticates with ITS OWN credentials and receives a token for itself."),
    code: `POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=billing-sync
&client_secret=…            # ${T("meglio: private_key_jwt o mTLS", "better: private_key_jwt or mTLS")}
&scope=invoices:read` },
  device: { name: T("Device Authorization (device code)", "Device Authorization (device code)"), tone: "amber",
    why: T("C'è un utente ma il client non ha un browser comodo (TV, CLI su un server): mostra un codice, l'utente lo conferma dal telefono, il client aspetta.",
      "There's a user but the client has no convenient browser (a TV, a CLI on a server): it shows a code, the user confirms it from their phone, the client waits."),
    code: `POST /oauth/device/code     client_id=tv-app&scope=profile
← { "device_code": "Ag_…", "user_code": "WDJB-MJHT",
    "verification_uri": "https://example.com/device", "interval": 5 }

# ${T("la TV mostra WDJB-MJHT; l'utente lo inserisce dal telefono", "the TV shows WDJB-MJHT; the user enters it on their phone")}
# ${T("intanto la TV chiede ogni 5 secondi:", "meanwhile the TV asks every 5 seconds:")}
POST /oauth/token   grant_type=urn:ietf:params:oauth:grant-type:device_code
                    &device_code=Ag_…&client_id=tv-app
← 400 {"error": "authorization_pending"}   … ${T("finché l'utente conferma", "until the user confirms")}
← 200 {"access_token": "…", "refresh_token": "…"}` },
  server: { name: T("Authorization Code + PKCE (client confidenziale)", "Authorization Code + PKCE (confidential client)"), tone: "emerald",
    why: T("Utente presente, browser, e un tuo server che custodisce il client_secret. Il PKCE si usa comunque: lo raccomandano le best practice attuali (e OAuth 2.1) anche per chi ha un secret.",
      "User present, a browser, and a server of yours that keeps the client_secret. You use PKCE anyway: current best practice (and OAuth 2.1) recommends it even for clients that have a secret."),
    code: `GET /authorize?response_type=code&client_id=crm-sync
    &redirect_uri=https://app.${T("miocrm.it", "mycrm.com")}/callback
    &scope=openid email contacts.read
    &state=8f2c1e…                       # ${T("anti-CSRF, legato alla sessione", "anti-CSRF, bound to the session")}
    &code_challenge=E9Mel…&code_challenge_method=S256

# ${T("sul callback il SERVER scambia il code:", "on the callback the SERVER exchanges the code:")}
POST /oauth/token   grant_type=authorization_code&code=…
                    &redirect_uri=…&code_verifier=…
                    &client_id=crm-sync&client_secret=…` },
  public: { name: T("Authorization Code + PKCE (client pubblico)", "Authorization Code + PKCE (public client)"), tone: "indigo",
    why: T("SPA o app mobile: il codice gira sul dispositivo dell'utente, un secret lì dentro non è segreto. Il PKCE sostituisce il secret. Per le SPA, meglio ancora un BFF che tiene i token lato server.",
      "An SPA or mobile app: the code runs on the user's device, so a secret in there isn't secret. PKCE replaces the secret. For SPAs, better still is a BFF that keeps the tokens server-side."),
    code: `// ${T("app mobile: browser di sistema (ASWebAuthenticationSession / Custom Tabs), mai una WebView", "mobile app: the system browser (ASWebAuthenticationSession / Custom Tabs), never a WebView")}
GET /authorize?response_type=code&client_id=app-ios
    &redirect_uri=${T("it.miaapp", "com.myapp")}:/callback
    &scope=openid profile offline_access
    &state=…&code_challenge=…&code_challenge_method=S256

POST /oauth/token   grant_type=authorization_code&code=…&code_verifier=…&client_id=app-ios
# ${T("nessun client_secret: il code_verifier dimostra che sei tu ad averlo chiesto", "no client_secret: the code_verifier proves you're the one who asked for it")}` },
}));

function FlowPicker() {
  const [utente, setUtente] = useState(true);
  const [browser, setBrowser] = useState(true);
  const [segreto, setSegreto] = useState(true);
  const k = !utente ? "cc" : !browser ? "device" : segreto ? "server" : "public";
  const f = FLOWS()[k];
  const Q = ({ v, set, q, si, no, off }) => (
    <div className={`rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 ${off ? "opacity-35" : ""}`}>
      <div className="text-[12.5px] text-zinc-300 mb-1.5">{q}</div>
      <div className="flex gap-1.5">
        <button disabled={off} onClick={() => set(true)} className={`px-2 py-0.5 rounded-md border text-[12px] ${v ? "border-indigo-500 bg-indigo-950 text-white" : "border-zinc-800 text-zinc-400"}`}>{si}</button>
        <button disabled={off} onClick={() => set(false)} className={`px-2 py-0.5 rounded-md border text-[12px] ${!v ? "border-indigo-500 bg-indigo-950 text-white" : "border-zinc-800 text-zinc-400"}`}>{no}</button>
      </div>
    </div>
  );
  return (
    <Card>
      <Label>{T("tre domande sul client · il flusso esce da solo", "three questions about the client · the flow falls out on its own")}</Label>
      <div className="grid sm:grid-cols-3 gap-2 mb-3">
        <Q v={utente} set={setUtente} q={T("C'è un utente di cui usi i dati?", "Is there a user whose data you use?")} si={T("sì", "yes")} no={T("no, servizio a servizio", "no, service to service")} />
        <Q v={browser} set={setBrowser} q={T("Il client può aprire un browser?", "Can the client open a browser?")} si={T("sì", "yes")} no={T("no (TV, CLI remota)", "no (TV, remote CLI)")} off={!utente} />
        <Q v={segreto} set={setSegreto} q={T("Il client gira su un tuo server?", "Does the client run on a server of yours?")} si={T("sì, tiene un secret", "yes, it keeps a secret")} no={T("no: SPA, mobile", "no: SPA, mobile")} off={!utente || !browser} />
      </div>
      <div key={k} className="anim-rise">
        <div className="mb-2"><Pill tone={f.tone}>{f.name}</Pill></div>
        <p className="text-[13px] text-zinc-300 leading-relaxed mb-2">{f.why}</p>
        <Code>{f.code}</Code>
      </div>
      <p className="text-[12px] text-zinc-500 mt-2 leading-relaxed">{T(
        <>Mancano due flussi, apposta: <span className="text-red-300">implicit</span> (token nell'URL, deprecato) e <span className="text-red-300">password grant</span> (la password dell'utente passa dal tuo client: esattamente ciò che OAuth esiste per evitare). OAuth 2.1 li toglie entrambi.</>,
        <>Two flows are missing, on purpose: <span className="text-red-300">implicit</span> (token in the URL, deprecated) and <span className="text-red-300">password grant</span> (the user's password passes through your client: exactly what OAuth exists to avoid). OAuth 2.1 removes both.</>
      )}</p>
    </Card>
  );
}

const SCOPES = memoByLang(() => [
  { k: "openid", d: T("Sapere chi sei", "Know who you are"), need: true, why: T("Serve per il login (id_token): sai quale utente ha collegato l'account.", "Needed for login (id_token): you know which user connected the account.") },
  { k: "email", d: T("Vedere il tuo indirizzo email", "See your email address"), need: true, why: T("Per mostrare «collegato come anna@…» e per le notifiche.", "To show “connected as anna@…” and for notifications.") },
  { k: "contacts.read", d: T("Vedere i tuoi contatti", "See your contacts"), need: true, why: T("È la feature: importare i contatti.", "It's the feature: importing the contacts.") },
  { k: "contacts.write", d: T("Creare, modificare ed eliminare i tuoi contatti", "Create, edit and delete your contacts"), need: false, why: T("La feature legge soltanto. Chiedere la scrittura spaventa al consenso (meno conversioni), allunga la verifica del provider e allarga il danno se il token viene rubato.", "The feature only reads. Asking for write access scares people at consent (fewer conversions), lengthens the provider's review and widens the damage if the token is stolen.") },
  { k: "calendar.read", d: T("Vedere i tuoi calendari", "See your calendars"), need: false, why: T("Nessuna feature lo usa. «Può servire in futuro» non è un motivo: lo chiederai quando servirà (consenso incrementale).", "No feature uses it. “Might be useful later” isn't a reason: you'll ask for it when you need it (incremental consent).") },
  { k: "offline_access", d: T("Accedere a questi dati anche quando non usi l'app", "Access this data even when you're not using the app"), need: true, why: T("La sincronizzazione è notturna, senza utente: serve un refresh token. Da custodire come una password.", "The sync runs overnight, with no user: you need a refresh token. Guard it like a password.") },
]);

function ScopeBuilder() {
  const [sel, setSel] = useState(() => new Set(["openid", "email", "contacts.read", "contacts.write", "calendar.read"]));
  const tog = (k) => setSel((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const all = SCOPES();
  const scopes = all.filter((s) => sel.has(s.k)).map((s) => s.k);
  const url = `https://auth.provider.com/authorize?response_type=code&client_id=crm-sync&redirect_uri=${encodeURIComponent(`https://app.${T("miocrm.it", "mycrm.com")}/callback`)}&scope=${encodeURIComponent(scopes.join(" "))}&state=8f2c1e&code_challenge=E9Mel…&code_challenge_method=S256`;
  const extra = all.filter((s) => sel.has(s.k) && !s.need);
  const manca = all.filter((s) => !sel.has(s.k) && s.need);
  return (
    <Card>
      <Label>{T("la tua feature: «importa i contatti del cliente ogni notte» · scegli gli scope", "your feature: “import the customer's contacts every night” · pick the scopes")}</Label>
      <div className="grid sm:grid-cols-3 gap-1.5 mb-3">
        {all.map((s) => (
          <button key={s.k} onClick={() => tog(s.k)} className={`text-left rounded-lg border px-2.5 py-1.5 flex items-center gap-2 text-[12px] font-mono transition-colors ${sel.has(s.k) ? "border-indigo-600 bg-indigo-950 text-indigo-100" : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600"}`}>
            {sel.has(s.k) ? <CheckSquare size={13} className="shrink-0" /> : <Square size={13} className="shrink-0 text-zinc-600" />}{s.k}
          </button>
        ))}
      </div>
      <Code>{url}</Code>
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-3">
          <div className="text-[13px] text-zinc-100 font-medium mb-2">{T("MioCRM vuole accedere al tuo account", "MyCRM wants to access your account")}</div>
          {scopes.length === 0 && <div className="text-[12px] text-zinc-500">{T("nessun permesso richiesto", "no permissions requested")}</div>}
          {all.filter((s) => sel.has(s.k)).map((s) => <div key={s.k} className={`text-[12px] py-0.5 ${s.need ? "text-zinc-300" : "text-amber-300"}`}>• {s.d}</div>)}
          <div className="flex gap-2 mt-3"><span className="px-3 py-1 rounded-md border border-zinc-700 text-[12px] text-zinc-400">{T("Annulla", "Cancel")}</span><span className="px-3 py-1 rounded-md bg-indigo-600 text-[12px] text-white">{T("Consenti", "Allow")}</span></div>
        </div>
        <div className="space-y-1.5 text-[12.5px] leading-relaxed">
          {extra.map((s) => <div key={s.k} className="text-amber-300"><span className="font-mono">{s.k}</span> {T("di troppo", "is too much")} — {s.why}</div>)}
          {manca.map((s) => <div key={s.k} className="text-red-300"><span className="font-mono">{s.k}</span> {T("manca", "is missing")} — {s.why}</div>)}
          {!extra.length && !manca.length && <div className="text-emerald-300">{T("Esattamente ciò che serve alla feature, niente di più. È il consenso che l'utente accetta senza pensarci due volte.", "Exactly what the feature needs, nothing more. It's the consent screen a user accepts without thinking twice.")}</div>}
        </div>
      </div>
    </Card>
  );
}

function OauthFlussiModule() {
  return (
    <div className="space-y-4">
      <Lead>{T(
        <>Il PKCE che hai visto in «OAuth · PKCE & token» è <span className="text-white">uno</span> dei flussi di OAuth, non «OAuth». Il flusso giusto dipende da chi è il client: c'è un
        utente? può aprire un browser? può custodire un segreto? E nel lavoro di integrazione il client, quasi sempre, <span className="text-white font-medium">sei tu</span>: la tua
        app che chiede a Google, HubSpot o Microsoft il permesso di leggere i dati di un utente. Qui: la mappa dei flussi, gli scope, e cosa deve fare bene un client.</>,
        <>The PKCE you saw in “OAuth · PKCE & tokens” is <span className="text-white">one</span> of OAuth's flows, not “OAuth” itself. The right flow depends on who the client is: is there a
        user? can it open a browser? can it keep a secret? And in integration work the client is almost always <span className="text-white font-medium">you</span>: your
        app asking Google, HubSpot or Microsoft for permission to read a user's data. Here: the map of flows, scopes, and what a client has to get right.</>
      )}</Lead>
      <Analogy>{T(
        <>Il parcheggiatore dell'hotel. Non gli dai le chiavi di casa (la password): gli dai la <span className="text-zinc-100">chiave valet</span>, che apre la macchina ma non il bagagliaio
        (gli scope), vale per stasera (la scadenza) e puoi ritirarla quando vuoi (la revoca). Cambia solo il modo di consegnarla: di persona (utente presente), a un dipendente
        col badge (client credentials), o con un codice via SMS perché sei davanti alla TV senza tastiera (device code).</>,
        <>The hotel valet. You don't hand over your house keys (the password): you give them the <span className="text-zinc-100">valet key</span>, which opens the car but not the boot
        (the scopes), works for tonight (the expiry) and can be taken back whenever you like (revocation). Only the way you hand it over changes: in person (user present), to an employee
        with a badge (client credentials), or with a code by SMS because you're in front of a TV with no keyboard (device code).</>
      )}</Analogy>
      <Predict
        question={T("Un job notturno sul tuo server deve chiamare l'API di fatturazione di un partner. Nessun utente coinvolto. Quale flusso?", "A nightly job on your server has to call a partner's billing API. No user involved. Which flow?")}
        options={T(["Authorization Code + PKCE", "Password grant, con utente e password del partner nella config", "Client Credentials"], ["Authorization Code + PKCE", "Password grant, with the partner's username and password in the config", "Client Credentials"])}
        answer={2}
        explain={T("Nessun utente, nessun consenso da chiedere: il client si autentica con le proprie credenziali e riceve un token per sé. Il password grant è deprecato: fa passare una password dal client, cioè esattamente ciò che OAuth esiste per evitare.", "No user, no consent to ask for: the client authenticates with its own credentials and gets a token for itself. The password grant is deprecated: it passes a password through the client, which is exactly what OAuth exists to avoid.")}
      />
      <FlowPicker />
      <ScopeBuilder />
      <Card>
        <Label>{T("quando il client sei tu · la checklist di un'integrazione OAuth", "when you are the client · the checklist for an OAuth integration")}</Label>
        <Griglia intestazioni={T(["", "cosa fai", "perché"], ["", "what you do", "why"])} righe={T([
          ["state", "Valore casuale legato alla sessione, verificato sul callback.", "Senza, un attaccante può farti collegare il SUO account al tuo utente (CSRF sul login)."],
          ["redirect_uri", "Registrato esatto presso il provider, niente wildcard.", "Un redirect aperto manda il code a chi non dovrebbe averlo."],
          ["refresh token", "Cifrato a riposo nel DB, uno per utente o tenant.", "È una credenziale di lunga durata: un dump del DB non deve bastare per usarlo."],
          ["refresh concorrente", "Un lock per connessione quando fai refresh.", "Se il provider ruota i refresh token, due worker che rinnovano insieme si invalidano a vicenda."],
          ["invalid_grant", "Segna l'integrazione «da ricollegare» e avvisa l'utente.", "L'utente ha revocato o cambiato password: ritentare in loop non la ripara."],
          ["log", "Mai token nei log, né negli errori mandati a Sentry.", "Un token in un log è un token pubblico per chi legge i log."],
        ], [
          ["state", "A random value bound to the session, checked on the callback.", "Without it, an attacker can get you to link THEIR account to your user (CSRF on login)."],
          ["redirect_uri", "Registered exactly with the provider, no wildcards.", "An open redirect sends the code to someone who shouldn't have it."],
          ["refresh token", "Encrypted at rest in the DB, one per user or tenant.", "It's a long-lived credential: a DB dump must not be enough to use it."],
          ["concurrent refresh", "A lock per connection while you refresh.", "If the provider rotates refresh tokens, two workers renewing at once invalidate each other."],
          ["invalid_grant", "Mark the integration as “needs reconnecting” and notify the user.", "The user revoked access or changed their password: retrying in a loop won't fix it."],
          ["logs", "Never tokens in logs, nor in errors sent to Sentry.", "A token in a log is a public token for anyone who reads the logs."],
        ])} />
      </Card>
      <ScegliForma id="oauth-flusso" titolo={T("Quale flusso?", "Which flow?")} items={T([
        { pre: "App React pura (SPA) che chiama la tua API →", opts: ["Implicit", "Auth Code + PKCE (meglio con BFF)", "Client Credentials"], ok: "Auth Code + PKCE (meglio con BFF)", perche: "Implicit è deprecato: il token viaggia nell'URL. Con il PKCE un code rubato non vale nulla; con un BFF il browser non vede nemmeno il token." },
        { pre: "mytool login su un server senza browser →", opts: ["Device code", "Auth Code + PKCE"], ok: "Device code", perche: "Nessun browser su quella macchina: codice a schermo, conferma da un altro dispositivo. Su un laptop con browser, invece, Auth Code + PKCE con redirect su localhost." },
        { pre: "Il microservizio ordini chiama il microservizio pagamenti →", opts: ["Client Credentials", "Auth Code + PKCE"], ok: "Client Credentials", perche: "Macchina con macchina: nessun utente, nessun consenso." },
        { pre: "Sincronizzi ogni notte i contatti HubSpot di un cliente →", opts: ["Client Credentials", "Auth Code una volta + refresh token"], ok: "Auth Code una volta + refresh token", perche: "I dati sono del cliente: serve il suo consenso, una volta. Poi il job notturno usa il refresh token, senza nessuno davanti." },
      ], [
        { pre: "A pure React app (SPA) that calls your API →", opts: ["Implicit", "Auth Code + PKCE (better with a BFF)", "Client Credentials"], ok: "Auth Code + PKCE (better with a BFF)", perche: "Implicit is deprecated: the token travels in the URL. With PKCE a stolen code is worthless; with a BFF the browser never even sees the token." },
        { pre: "mytool login on a server with no browser →", opts: ["Device code", "Auth Code + PKCE"], ok: "Device code", perche: "No browser on that machine: a code on screen, confirmation from another device. On a laptop with a browser, though, Auth Code + PKCE with a localhost redirect." },
        { pre: "The orders microservice calls the payments microservice →", opts: ["Client Credentials", "Auth Code + PKCE"], ok: "Client Credentials", perche: "Machine to machine: no user, no consent." },
        { pre: "You sync a customer's HubSpot contacts every night →", opts: ["Client Credentials", "Auth Code once + refresh token"], ok: "Auth Code once + refresh token", perche: "The data belongs to the customer: you need their consent, once. Then the nightly job uses the refresh token, with nobody at the keyboard." },
      ])} />
      <Riordina id="oauth-refresh" titolo={T("Il refresh, fatto bene", "Refresh, done right")} items={T([
        { it: "La chiamata notturna trova il token scaduto", seq: ["l'access token è scaduto", "prendi il lock della connessione", "POST /token con grant_type=refresh_token", "salva il nuovo refresh token", "riprova la chiamata"], perche: "Il lock evita che due worker usino lo stesso refresh token; salvare subito il nuovo evita di restare con uno già consumato." },
      ], [
        { it: "The nightly call finds the token expired", seq: ["the access token has expired", "take the connection's lock", "POST /token with grant_type=refresh_token", "save the new refresh token", "retry the call"], perche: "The lock stops two workers using the same refresh token; saving the new one straight away stops you being left with one that's already used up." },
      ])} />
      <Cloze id="oauth-parole" titolo={T("Il vocabolario", "The vocabulary")} items={T([
        { pre: "Il parametro casuale che protegge il callback dal CSRF:", ok: "state", perche: "Lo generi, lo leghi alla sessione, e sul callback controlli che torni identico." },
        { pre: "Lo scope OIDC che ti fa ricevere l'id_token:", ok: "openid", perche: "Senza openid è OAuth puro: autorizzazione, ma nessuna identità." },
        { pre: "L'errore del token endpoint quando il refresh token è stato revocato:", ok: "invalid_grant", perche: "Non è un errore temporaneo: serve che l'utente ricolleghi l'account." },
      ], [
        { pre: "The random parameter that protects the callback from CSRF:", ok: "state", perche: "You generate it, bind it to the session, and on the callback you check it comes back unchanged." },
        { pre: "The OIDC scope that gets you the id_token:", ok: "openid", perche: "Without openid it's plain OAuth: authorisation, but no identity." },
        { pre: "The token endpoint's error when the refresh token has been revoked:", ok: "invalid_grant", perche: "It's not a temporary error: the user has to reconnect the account." },
      ])} />
      <Takeaway>{T(
        <>Il flusso esce da tre domande: <span className="text-white">c'è un utente?</span> (no → client credentials) <span className="text-white">ha un browser?</span> (no → device code)
        altrimenti <span className="text-white">Authorization Code + PKCE</span>, sempre — anche con un client secret. Implicit e password grant sono morti. Scope minimi, chiesti quando
        servono. E da client: state, redirect esatto, refresh token cifrato, lock sul refresh, <span className="font-mono">invalid_grant</span> = ricollega, non ritentare.</>,
        <>The flow comes out of three questions: <span className="text-white">is there a user?</span> (no → client credentials) <span className="text-white">does it have a browser?</span> (no → device code)
        otherwise <span className="text-white">Authorization Code + PKCE</span>, always — even with a client secret. Implicit and password grant are dead. Minimal scopes, asked for when
        needed. And as a client: state, exact redirect, encrypted refresh token, a lock on refresh, <span className="font-mono">invalid_grant</span> = reconnect, don't retry.</>
      )}</Takeaway>
    </div>
  );
}

/* ==========================================================================
   AUTH & SICUREZZA · Sfida
   ========================================================================== */

function SfAuthModule() {
  return (
    <div className="space-y-4">
      <Lead>{T(
        "Chiude la sezione: login, OAuth, SSO, OWASP. Cinque client diversi dello stesso prodotto — ognuno vuole un flusso diverso, e una sola scorciatoia apre un buco.",
        "This wraps up the section: login, OAuth, SSO, OWASP. Five different clients of the same product — each needs a different flow, and a single shortcut opens a hole."
      )}</Lead>
      <Sfida
        brief={T("Il tuo SaaS ha: una SPA React, un'app mobile, un job che sincronizza il Salesforce dei clienti, un'integrazione server-to-server con il partner di fatturazione e una CLI per sviluppatori. Scegli cosa metti in piedi.",
          "Your SaaS has: a React SPA, a mobile app, a job that syncs customers' Salesforce, a server-to-server integration with the billing partner and a developer CLI. Choose what you set up.")}
        pool={T([
          { id: "spa", label: "SPA → Auth Code + PKCE, token custoditi da un BFF (cookie httpOnly)", role: "essential", why: "Il browser non vede i token: un XSS non può rubarli." },
          { id: "mob", label: "Mobile → Auth Code + PKCE nel browser di sistema", role: "essential", why: "Mai una WebView: l'app potrebbe leggere la password digitata. Il browser di sistema la tiene fuori portata." },
          { id: "sf", label: "Salesforce → consenso una volta + refresh token cifrato per tenant", role: "essential", why: "I dati sono del cliente; il job notturno lavora senza di lui." },
          { id: "cc", label: "Partner di fatturazione → Client Credentials con scope minimi", role: "essential", why: "Macchina con macchina: nessun utente." },
          { id: "cli", label: "CLI → device code (o PKCE con redirect su localhost)", role: "essential", why: "Nessuna password nella CLI; funziona anche via SSH." },
          { id: "jwt", label: "L'API valida firma, iss, aud ed exp di ogni token", role: "essential", why: "Senza aud, un token emesso per un'altra API passa (vedi «OAuth · PKCE & token»)." },
          { id: "mtls", label: "private_key_jwt o mTLS invece del client_secret per il partner", role: "optional", why: "Più robusto di un segreto condiviso; sensato se il partner lo supporta." },
          { id: "rot", label: "Refresh token rotation con reuse detection", role: "optional", why: "Limita il danno di un refresh token rubato; dipende dal provider." },
          { id: "ls", label: "Access token in localStorage nella SPA", role: "wrong", why: "Qualsiasi XSS lo legge e lo spedisce fuori." },
          { id: "imp", label: "Implicit flow per la SPA", role: "wrong", why: "Deprecato: il token arriva nell'URL, finisce in cronologia e nei log." },
          { id: "pwd", label: "Password grant per la CLI", role: "wrong", why: "La CLI vede la password dell'utente: niente MFA, niente SSO, e una credenziale in più da rubare." },
          { id: "one", label: "Un unico client_id condiviso da tutti i client", role: "wrong", why: "Non puoi revocarne uno solo, dargli scope diversi, né capire chi ha fatto cosa." },
          { id: "long", label: "Access token da 30 giorni senza refresh", role: "wrong", why: "Un token rubato vale un mese e non si revoca facilmente." },
        ], [
          { id: "spa", label: "SPA → Auth Code + PKCE, tokens held by a BFF (httpOnly cookie)", role: "essential", why: "The browser never sees the tokens: an XSS can't steal them." },
          { id: "mob", label: "Mobile → Auth Code + PKCE in the system browser", role: "essential", why: "Never a WebView: the app could read the password being typed. The system browser keeps it out of reach." },
          { id: "sf", label: "Salesforce → consent once + an encrypted refresh token per tenant", role: "essential", why: "The data belongs to the customer; the nightly job works without them." },
          { id: "cc", label: "Billing partner → Client Credentials with minimal scopes", role: "essential", why: "Machine to machine: no user." },
          { id: "cli", label: "CLI → device code (or PKCE with a localhost redirect)", role: "essential", why: "No password in the CLI; it works over SSH too." },
          { id: "jwt", label: "The API validates the signature, iss, aud and exp of every token", role: "essential", why: "Without aud, a token issued for another API gets through (see “OAuth · PKCE & tokens”)." },
          { id: "mtls", label: "private_key_jwt or mTLS instead of the client_secret for the partner", role: "optional", why: "Sturdier than a shared secret; sensible if the partner supports it." },
          { id: "rot", label: "Refresh token rotation with reuse detection", role: "optional", why: "Limits the damage of a stolen refresh token; depends on the provider." },
          { id: "ls", label: "Access token in localStorage in the SPA", role: "wrong", why: "Any XSS reads it and ships it off." },
          { id: "imp", label: "Implicit flow for the SPA", role: "wrong", why: "Deprecated: the token arrives in the URL and ends up in the history and the logs." },
          { id: "pwd", label: "Password grant for the CLI", role: "wrong", why: "The CLI sees the user's password: no MFA, no SSO, and one more credential to steal." },
          { id: "one", label: "A single client_id shared by every client", role: "wrong", why: "You can't revoke just one, give them different scopes, or tell who did what." },
          { id: "long", label: "30-day access tokens with no refresh", role: "wrong", why: "A stolen token is good for a month and isn't easy to revoke." },
        ])}
        reference={T("Un client_id per client. SPA: Auth Code + PKCE dietro un BFF con cookie httpOnly+Secure+SameSite. Mobile: Auth Code + PKCE nel browser di sistema. CLI: device code. Salesforce: consenso una volta, refresh token cifrato per tenant, lock sul refresh. Partner: Client Credentials con scope minimi (meglio private_key_jwt). Ogni API valida firma via JWKS, iss, aud, exp.",
          "One client_id per client. SPA: Auth Code + PKCE behind a BFF with httpOnly+Secure+SameSite cookies. Mobile: Auth Code + PKCE in the system browser. CLI: device code. Salesforce: consent once, an encrypted refresh token per tenant, a lock on refresh. Partner: Client Credentials with minimal scopes (better: private_key_jwt). Every API validates the signature via JWKS, iss, aud, exp.")}
      />
      <Takeaway>{T(
        <>Una regola copre quasi tutti gli errori della lista: <span className="text-white">la credenziale più potente deve stare nel posto più protetto</span>. Password solo
        all'identity provider, token lato server quando si può, un client_id per client, scope e durate minimi.</>,
        <>One rule covers almost every mistake on the list: <span className="text-white">the most powerful credential must live in the most protected place</span>. Passwords only
        at the identity provider, tokens server-side whenever possible, one client_id per client, minimal scopes and lifetimes.</>
      )}</Takeaway>
    </div>
  );
}

/* ==========================================================================
   Registry — Lesson.jsx piazza ogni voce di BK_MOD nel punto giusto di MODULES
   ========================================================================== */

const mod = (id, label, en, section, icon, el) => ({ id, label, en, section, icon, el });

export const BK_MOD = {
  vm: mod("vm", "VM & hypervisor", "VMs & hypervisors", "Infrastruttura", Server, VmModule),
  k8s: mod("k8s", "Kubernetes", "Kubernetes", "Infrastruttura", Boxes, K8sModule),
  terraform: mod("terraform", "Terraform & IaC", "Terraform & IaC", "Infrastruttura", FileCode2, TerraformModule),
  ambienti: mod("ambienti", "Dev, staging, prod", "Dev, staging, prod", "Infrastruttura", Layers3, AmbientiModule),
  flags: mod("flags", "Feature flag", "Feature flags", "Infrastruttura", ToggleRight, FlagsModule),
  sfinfra: mod("sfinfra", "Sfida · dal laptop a prod", "Challenge · from laptop to prod", "Infrastruttura", Trophy, SfInfraModule),
  kafka: mod("kafka", "Kafka · il log", "Kafka · the log", "System Design", Rows4, KafkaModule),
  outbox: mod("outbox", "Outbox & CDC", "Outbox & CDC", "System Design", Inbox, OutboxModule),
  temporal: mod("temporal", "Temporal · workflow durevoli", "Temporal · durable workflows", "System Design", History, TemporalModule),
  sfeventi: mod("sfeventi", "Sfida · flusso ordini", "Challenge · order flow", "System Design", Trophy, SfEventiModule),
  dmschema: mod("dmschema", "Progettare lo schema", "Designing the schema", "SQL & Database", TableProperties, DmSchemaModule),
  dmtempo: mod("dmtempo", "Dati nel tempo & analisi", "Data over time & analytics", "SQL & Database", CalendarRange, DmTempoModule),
  sfdati: mod("sfdati", "Sfida · modella il dominio", "Challenge · model the domain", "SQL & Database", Trophy, SfDatiModule),
  oauthflussi: mod("oauthflussi", "OAuth · flussi & scope", "OAuth · flows & scopes", "Auth & sicurezza", Route, OauthFlussiModule),
  sfauth: mod("sfauth", "Sfida · il flusso giusto", "Challenge · the right flow", "Auth & sicurezza", Trophy, SfAuthModule),
};

/* Quiz, glossario e flashcard: il testo italiano qui sotto (QUIZ_IT, GLOSS_IT,
   FLASH_IT) è quello originale; l'inglese sta in mappe parallele più in basso. */
const QUIZ_IT = {
  vm: [
    { q: "Perché un container parte in meno di un secondo e una VM in un minuto?", options: ["La VM deve avviare un sistema operativo intero; il container è un processo sul kernel già acceso", "Il container è compresso meglio", "La VM gira su hardware più lento"], correct: 0, why: "Nessun boot: il container è un processo isolato (namespaces + cgroups) sul kernel dell'host." },
    { q: "Un job di 3 ore su AWS Lambda:", options: ["va bene se aumenti la memoria", "va bene pagando un timeout più alto", "non si può: il limite è 15 minuti"], correct: 2, why: "Lambda si ferma a 15 minuti. I batch lunghi vanno su container schedulati o VM." },
    { q: "Cosa trasforma una VM da «pet» a «cattle»?", options: ["Un backup giornaliero", "Nascere da immagine + cloud-init/Terraform: la distruggi e ne rinasce una identica", "Un nome più descrittivo"], correct: 1, why: "Cattle = ricostruibile da codice. Il backup salva i dati, non ti dice come era configurata la macchina." },
  ],
  k8s: [
    { q: "Un pod di un Deployment con 3 repliche muore. Cosa succede?", options: ["Il controller ne crea uno nuovo per tornare a 3", "Niente, finché non rifai apply", "Il traffico passa a un altro Deployment"], correct: 0, why: "Reconciliation loop: il controller vede 2 ≠ 3 e chiude la differenza." },
    { q: "Perché gli altri servizi chiamano un Service e non l'IP di un pod?", options: ["È più veloce", "Serve solo per l'HTTPS", "I pod sono effimeri e cambiano IP; il Service è stabile e li trova per label"], correct: 2, why: "I pod nascono e muoiono; il Service resta, e seleziona chi è vivo." },
    { q: "Una livenessProbe che controlla il database è pericolosa perché…", options: ["rallenta il pod", "se il DB rallenta, K8s riavvia tutti i pod insieme", "il DB non risponde alle probe"], correct: 1, why: "Un rallentamento del DB diventa un'interruzione totale. La liveness controlla solo il processo; la readiness può guardare le dipendenze." },
  ],
  terraform: [
    { q: "Cosa segna -/+ nel plan?", options: ["Una modifica in-place", "La risorsa verrà distrutta e ricreata", "Una risorsa importata"], correct: 1, why: "Un attributo che «forces replacement» è cambiato: nuova risorsa, nuovo id." },
    { q: "Perché lo state di Terraform non va in git?", options: ["Contiene segreti in chiaro e serve un lock contro apply concorrenti", "È troppo grande", "Git non gestisce JSON"], correct: 0, why: "Backend remoto con lock (es. S3): cifrato, condiviso, un apply alla volta." },
    { q: "Qualcuno cambia un tag a mano in console. Al prossimo apply…", options: ["Terraform adotta la modifica", "l'apply fallisce", "Terraform la annulla e rimette il valore del file"], correct: 2, why: "È drift: il file è la verità. Se la modifica serve, va nel codice." },
  ],
  ambienti: [
    { q: "Cosa deve essere identico tra staging e prod?", options: ["I segreti", "L'immagine (stesso digest) e l'infrastruttura", "I dati degli utenti"], correct: 1, why: "Parità di codice e infrastruttura; segreti e dati sono proprio ciò che deve differire." },
    { q: "Perché non ricostruire l'immagine per prod dopo averla provata in staging?", options: ["La nuova build può differire: in prod gira qualcosa che nessuno ha provato", "Costa di più", "Docker non lo permette"], correct: 0, why: "Build once, deploy many: si promuove lo stesso digest." },
    { q: "Una migration è veloce in staging e blocca prod per minuti. Cosa mancava a staging?", options: ["Più RAM", "Un secondo database", "Dati di taglia realistica"], correct: 2, why: "2.000 righe contro 40 milioni: stesso SQL, comportamento opposto." },
  ],
  flags: [
    { q: "Perché il bucket di un rollout si calcola con un hash e non con Math.random()?", options: ["Stessa persona, stesso bucket: esperienza stabile, e il 30% contiene il 10%", "È più veloce", "Math.random non esiste sul server"], correct: 0, why: "Con un random a ogni richiesta la feature appare e sparisce, e gli esperimenti non misurano niente." },
    { q: "Quando si rimuove un release flag?", options: ["Mai, non costa niente", "Quando è al 100% e stabile: via l'if e il ramo vecchio", "Al prossimo aggiornamento del linguaggio"], correct: 1, why: "Ogni flag vivo raddoppia i percorsi possibili. I release flag hanno una data di morte." },
    { q: "Un flag valutato nel browser per nascondere una feature a pagamento:", options: ["Va bene se offuscato", "Va bene", "È sbagliato: la config è leggibile, il controllo va sul server"], correct: 2, why: "Qualsiasi cosa arrivi al browser è leggibile e modificabile da chi lo usa." },
  ],
  kafka: [
    { q: "La differenza chiave tra Kafka e una coda classica:", options: ["Kafka è più veloce", "Kafka non garantisce l'ordine", "In Kafka i messaggi restano dopo la lettura: ogni gruppo ha il suo offset e può rileggere"], correct: 2, why: "Log, non coda: leggere non cancella." },
    { q: "Il parallelismo massimo di un consumer group è:", options: ["Il numero di partizioni del topic", "Infinito", "Il numero di broker"], correct: 0, why: "Una partizione, un consumer del gruppo. I consumer in più restano fermi." },
    { q: "Come garantisci l'ordine degli eventi di uno stesso ordine?", options: ["Un solo consumer per tutto il topic", "Chiave del messaggio = order_id", "Un timestamp nel messaggio"], correct: 1, why: "Stessa chiave → stessa partizione → letti in fila." },
  ],
  outbox: [
    { q: "Cos'è il dual-write problem?", options: ["Scrivere due volte lo stesso record", "Aggiornare due sistemi senza una transazione comune: un crash in mezzo li lascia incoerenti", "Due utenti che scrivono insieme"], correct: 1, why: "DB e broker non condividono una transazione: serve un meccanismo che renda il secondo passo inevitabile." },
    { q: "Che garanzia di consegna dà l'outbox?", options: ["At-least-once: servono consumer idempotenti", "Exactly-once", "At-most-once"], correct: 0, why: "Il relay può pubblicare due volte (crash tra publish e «segna pubblicato»), mai zero." },
    { q: "Perché non esporre ad altri team le tabelle interne via CDC?", options: ["È lento", "Debezium non lo supporta", "Lo schema interno diventa un contratto pubblico: ogni refactor rompe i consumer"], correct: 2, why: "Per l'esterno si pubblicano eventi di dominio (l'outbox), stabili e pensati per chi li legge." },
  ],
  temporal: [
    { q: "Nel replay, un'activity già completata…", options: ["viene rieseguita", "restituisce il risultato salvato nella history, senza rieseguirla", "viene saltata e il workflow fallisce"], correct: 1, why: "La history è la memoria del workflow: il codice si rigioca, il lavoro già fatto no." },
    { q: "Perché niente datetime.now() dentro un workflow?", options: ["Nel replay darebbe un valore diverso e il codice potrebbe prendere un altro ramo", "È lento", "Temporal non gestisce i fusi orari"], correct: 0, why: "Si usa workflow.now(), che restituisce l'ora registrata nella history." },
    { q: "Come arriva a un workflow in attesa l'approvazione di una persona?", options: ["Polling del database", "Riavviando il workflow", "Con un signal"], correct: 2, why: "Il workflow aspetta (anche giorni) senza occupare worker; il signal lo sveglia." },
  ],
  dmschema: [
    { q: "Cos'è un'anomalia di aggiornamento?", options: ["Un UPDATE lento", "Un UPDATE senza WHERE", "Lo stesso fatto ripetuto in più righe che, aggiornato in una sola, diverge"], correct: 2, why: "Il sintomo di un fatto senza una casa unica." },
    { q: "Il prezzo nella riga d'ordine va tolto per normalizzare?", options: ["No: prezzo pagato e prezzo di listino sono fatti diversi", "Sì, sta già in products", "Solo se il prodotto era scontato"], correct: 0, why: "Leggerlo da products riscriverebbe le fatture a ogni cambio di listino." },
    { q: "Quando un documento (o JSONB) è la scelta giusta?", options: ["Sempre, è più flessibile", "Dati letti e scritti in blocco, struttura variabile, pochi vincoli", "Quando servono tante JOIN"], correct: 1, why: "Relazioni, vincoli e aggregazioni restano mestiere delle tabelle." },
  ],
  dmtempo: [
    { q: "Cosa caratterizza un carico OLAP?", options: ["Tante piccole scritture concorrenti", "Richieste di un solo utente", "Poche query su milioni di righe e poche colonne, spesso sul passato"], correct: 2, why: "Per questo si usano motori colonnari e star schema." },
    { q: "SCD tipo 2:", options: ["Aggiunge una riga per ogni versione, con validità da/a", "Sovrascrive il valore", "Cancella lo storico"], correct: 0, why: "Ogni fatto si aggancia alla versione valida nella sua data." },
    { q: "La trappola del soft delete:", options: ["Occupa spazio", "Ogni query deve filtrare deleted_at, gli UNIQUE vanno resi parziali, e non vale come cancellazione GDPR", "Non si può annullare"], correct: 1, why: "È comodo, ma sposta la responsabilità su ogni query." },
  ],
  oauthflussi: [
    { q: "Server che chiama un'API, nessun utente coinvolto:", options: ["Auth Code + PKCE", "Client Credentials", "Device code"], correct: 1, why: "Il client usa le proprie credenziali; non c'è consenso da chiedere." },
    { q: "Perché implicit e password grant sono deprecati?", options: ["Espongono il token nell'URL o fanno passare la password dal client", "Sono lenti", "Non supportano gli scope"], correct: 0, why: "OAuth 2.1 li rimuove; resta Auth Code + PKCE." },
    { q: "Il refresh token restituisce invalid_grant. Cosa fai?", options: ["Riprovi in loop", "Usi l'ultimo access token", "Segni l'integrazione come da ricollegare e avvisi l'utente"], correct: 2, why: "Revoca o cambio password: solo l'utente può ripararla." },
  ],
};

const GLOSS_IT = [
  { t: "Hypervisor", s: "Infrastruttura", d: "Il software che divide un server fisico in più macchine virtuali, ognuna col suo OS e il suo kernel (KVM, Xen, Hyper-V; su AWS Nitro)." },
  { t: "VM vs container", s: "Infrastruttura", d: "La VM porta un OS intero col suo kernel (isolamento forte, boot in decine di secondi); il container è un processo isolato sul kernel dell'host (parte in un attimo)." },
  { t: "Pet vs cattle", s: "Infrastruttura", d: "Pet: macchina sistemata a mano, unica, irriproducibile. Cattle: nasce da codice (immagine, cloud-init, Terraform), si butta e si ricrea identica." },
  { t: "cloud-init", s: "Infrastruttura", d: "Lo script (user-data) che una VM esegue al primo avvio: pacchetti, file, comandi. Niente configurazione a mano via SSH." },
  { t: "Reconciliation loop", s: "Infrastruttura", d: "Il cuore di Kubernetes: dichiari lo stato desiderato, un controller confronta col reale e agisce finché coincidono." },
  { t: "Pod / Deployment / Service", s: "Infrastruttura", d: "Pod: container che vivono insieme, effimeri. Deployment: il desiderato (immagine, repliche, rilascio). Service: nome e IP stabili davanti ai pod." },
  { t: "readiness vs liveness", s: "Infrastruttura", d: "Readiness: posso ricevere traffico? (se no, fuori dal Service). Liveness: sono vivo? (se no, riavvio). La liveness non guarda mai le dipendenze." },
  { t: "Terraform / IaC", s: "Infrastruttura", d: "Infrastruttura descritta in file versionati: plan mostra il diff col mondo reale, apply lo esegue. Staging e prod dallo stesso codice." },
  { t: "tfstate", s: "Infrastruttura", d: "Lo state di Terraform: collega ogni risorsa del codice al suo id reale. Backend remoto con lock, mai in git (contiene segreti)." },
  { t: "Drift", s: "Infrastruttura", d: "Differenza tra il codice e il mondo reale, di solito per una modifica fatta a mano. Il prossimo apply la annulla." },
  { t: "Dev / staging / prod", s: "Infrastruttura", d: "Tre copie dello stesso sistema: per rompere, per la prova generale, per gli utenti. Stessa immagine e infrastruttura; cambiano config, dati e accessi." },
  { t: "Build once, deploy many", s: "Infrastruttura", d: "L'immagine si costruisce una volta; lo stesso digest viene promosso da staging a prod. Ricostruire per prod = mandare in prod qualcosa di mai provato." },
  { t: "Preview environment", s: "Infrastruttura", d: "Ambiente usa-e-getta per ogni PR, con un suo URL: chi fa review prova la modifica invece di immaginarla." },
  { t: "Feature flag", s: "Infrastruttura", d: "Un if comandato da config: separa il deploy (il codice è in prod) dal rilascio (gli utenti lo vedono)." },
  { t: "Rollout percentuale", s: "Infrastruttura", d: "bucket = hash(flag + userId) % 100; acceso se bucket < percentuale. Stabile per persona: il 30% contiene il 10%." },
  { t: "Kill switch", s: "Infrastruttura", d: "Flag operativo permanente che spegne una parte costosa sotto carico. Va provato prima del giorno in cui serve." },
  { t: "Kafka / log", s: "System Design", d: "Broker di eventi a log: i messaggi si accodano e restano (retention); ogni consumer group legge col proprio offset e può rileggere." },
  { t: "Partizione (Kafka)", s: "System Design", d: "Un pezzo del topic, ordinato. hash(key) % N decide dove va un messaggio: stessa chiave, stessa partizione, ordine garantito." },
  { t: "Offset / consumer lag", s: "System Design", d: "Offset: fin dove un gruppo ha letto in una partizione. Lag: messaggi prodotti meno messaggi letti — se cresce, i consumer non stanno al passo." },
  { t: "Consumer group", s: "System Design", d: "Consumer che si dividono le partizioni di un topic (una partizione a testa). Gruppi diversi leggono tutto, indipendenti." },
  { t: "Dual-write problem", s: "System Design", d: "Aggiornare due sistemi (DB e broker) senza una transazione comune: un crash in mezzo li lascia incoerenti." },
  { t: "Outbox pattern", s: "System Design", d: "Stato ed evento scritti nella stessa transazione (tabella outbox); un relay li pubblica dopo. At-least-once, mai persi." },
  { t: "CDC (Debezium)", s: "System Design", d: "Change Data Capture: legge il WAL del database e trasforma ogni modifica in un evento, senza toccare l'applicazione." },
  { t: "Inbox / dedup", s: "System Design", d: "Il consumer salva gli event_id già elaborati nella stessa transazione dell'effetto: un duplicato viene riconosciuto e saltato." },
  { t: "Workflow vs activity (Temporal)", s: "System Design", d: "Workflow: orchestrazione deterministica, rigiocata dalla history. Activity: il lavoro con I/O, ritentata, quindi idempotente." },
  { t: "Signal / query (Temporal)", s: "System Design", d: "Signal: messaggio esterno che modifica o sveglia un workflow (es. un'approvazione). Query: lettura dello stato senza modificarlo." },
  { t: "Determinismo (workflow)", s: "System Design", d: "Stesso input e stessa history → stesso percorso. Niente ora, random o rete nel workflow: workflow.now(), workflow.random(), activity." },
  { t: "Anomalie (update/insert/delete)", s: "SQL & Database", d: "Cosa succede a un fatto ripetuto o legato alla riga sbagliata: copie che divergono, entità che non puoi creare, entità che sparisci cancellando altro." },
  { t: "1NF / 2NF / 3NF", s: "SQL & Database", d: "Un valore per cella; ogni colonna dipende da tutta la chiave; nessuna dipendenza fra colonne non chiave. «La chiave, tutta la chiave, nient'altro che la chiave»." },
  { t: "Denormalizzazione", s: "SQL & Database", d: "Copiare un dato apposta per leggere più in fretta (contatori, tabelle di report), sapendo chi tiene allineate le copie." },
  { t: "OLTP vs OLAP", s: "SQL & Database", d: "OLTP: il DB dell'app, tante transazioni piccole su pochi record. OLAP: analisi su milioni di righe, motori colonnari (BigQuery, Snowflake, ClickHouse)." },
  { t: "Star schema", s: "SQL & Database", d: "Modello analitico: una tabella fact (misure + chiavi) al centro, tabelle dimensione (data, cliente, prodotto) intorno." },
  { t: "SCD tipo 1 / tipo 2", s: "SQL & Database", d: "Slowly Changing Dimension. Tipo 1: sovrascrivi (perdi la storia). Tipo 2: una riga per versione, con valid_from/valid_to." },
  { t: "Soft delete", s: "SQL & Database", d: "deleted_at invece di DELETE. Richiede filtri ovunque e UNIQUE parziali, e non vale come cancellazione ai fini GDPR." },
  { t: "Event sourcing", s: "SQL & Database", d: "Si salvano solo gli eventi (append-only); lo stato è una proiezione ricavata rigiocandoli. Ideale dove lo storico è il dominio." },
  { t: "Client Credentials", s: "Auth & sicurezza", d: "Flusso OAuth senza utente: il client si autentica con le proprie credenziali e riceve un token per sé. Servizio a servizio." },
  { t: "Device code", s: "Auth & sicurezza", d: "Flusso OAuth per client senza browser (TV, CLI remota): codice a schermo, conferma da un altro dispositivo, il client attende con polling." },
  { t: "Scope / consenso", s: "Auth & sicurezza", d: "I permessi che l'app chiede e l'utente approva. Minimi, e chiesti quando servono (consenso incrementale)." },
  { t: "Client pubblico vs confidenziale", s: "Auth & sicurezza", d: "Confidenziale: gira su un tuo server e custodisce un secret. Pubblico: SPA o mobile, un secret lì non è segreto — il PKCE lo sostituisce." },
  { t: "state (OAuth)", s: "Auth & sicurezza", d: "Valore casuale legato alla sessione e verificato sul callback: impedisce che un attaccante ti faccia collegare il suo account." },
  { t: "invalid_grant", s: "Auth & sicurezza", d: "Errore del token endpoint: refresh token revocato, scaduto o già usato. Si ricollega l'account, non si ritenta." },
];

const FLASH_IT = [
  { id: "fc-vm", s: "Infrastruttura", t: "VM, container, serverless: dove gira", b: [
    { l: "Definizione", i: ["VM: computer virtuale con OS e kernel suoi, creato da un hypervisor. Container: processo isolato sul kernel dell'host. Serverless: funzione su microVM gestite dal provider."] },
    { l: "Trade-off", i: ["Serve un OS intero (driver, Windows)? VM. N copie identiche che partono in un secondo? Container. Carico a picchi e richieste brevi? Serverless (Lambda: max 15 minuti)."] },
    { l: "Errori comuni", i: ["Configurare a mano via SSH: la VM diventa un pet irriproducibile. Si nasce da immagine + cloud-init/Terraform.", "Dati importanti sul disco locale (instance store): spariscono quando la VM si ferma."] },
  ]},
  { id: "fc-k8s", s: "Infrastruttura", t: "Kubernetes in cinque oggetti", b: [
    { l: "Come funziona", i: ["Dichiari il desiderato (Deployment: immagine + repliche); un controller lo insegue (reconciliation loop). Pod effimeri, Service stabile davanti, Ingress da fuori, ConfigMap/Secret per la config."] },
    { l: "Da ricordare", i: ["Rolling update con maxSurge 1 / maxUnavailable 0: prima nasce il nuovo, poi muore il vecchio.", "Readiness = ricevo traffico? Liveness = sono vivo? La liveness non controlla mai il DB.", "Un Secret è base64, non cifrato."] },
  ]},
  { id: "fc-terraform", s: "Infrastruttura", t: "Terraform: plan, apply, state", b: [
    { l: "Come funziona", i: ["Il file .tf descrive il desiderato; lo state collega risorse e id reali; plan mostra il diff (+ crea, ~ modifica, -/+ ricrea, - distrugge); apply lo esegue."] },
    { l: "Errori comuni", i: ["Non leggere il plan: un -/+ sull'istanza di prod è una VM nuova con un IP nuovo.", "State in git (segreti in chiaro) o senza lock (due apply insieme).", "Modifiche a mano in console: drift, annullato dal prossimo apply."] },
  ]},
  { id: "fc-ambienti", s: "Infrastruttura", t: "Dev, staging, prod", b: [
    { l: "Definizione", i: ["Dev per rompere, preview per ogni PR, staging per la prova generale, prod per gli utenti. Stessa immagine e infrastruttura; diversi config, segreti, dati e accessi."] },
    { l: "Da ricordare", i: ["Build once, deploy many: si promuove lo stesso digest.", "Staging con dati di taglia realistica e anonimizzati.", "Chiavi separate per ambiente; niente if (env === 'production') nel codice."] },
  ]},
  { id: "fc-flags", s: "Infrastruttura", t: "Feature flag", b: [
    { l: "Come funziona", i: ["Deploy ≠ rilascio: il codice va in prod spento. Valutazione lato server; bucket = hash(flag + userId) % 100, acceso se sotto la percentuale."] },
    { l: "Trade-off", i: ["Release (settimane, poi via), esperimento (fino alla significatività), kill switch (permanente), permesso (lunga durata).", "Ogni flag vivo raddoppia i percorsi: al 100% si toglie l'if. Knight Capital 2012: flag riciclato, 440 milioni persi in 45 minuti."] },
  ]},
  { id: "fc-kafka", s: "System Design", t: "Kafka: log, partizioni, offset", b: [
    { l: "Definizione", i: ["Un log distribuito: i messaggi restano dopo la lettura; ogni consumer group ha i suoi offset e può rileggere (replay)."] },
    { l: "Come funziona", i: ["hash(key) % N sceglie la partizione: ordine garantito solo dentro una partizione. Un gruppo ha al massimo tanti consumer attivi quante sono le partizioni.", "Elabori poi fai commit = at-least-once → consumer idempotenti."] },
    { l: "Trade-off", i: ["Kafka per flussi di eventi con più lettori e replay; una coda (SQS) per lavori da smaltire. Aggiungere partizioni rimescola le chiavi."] },
  ]},
  { id: "fc-outbox", s: "System Design", t: "Outbox & CDC", b: [
    { l: "Definizione", i: ["Dual-write problem: DB e broker non condividono una transazione. Outbox: stato + evento nella stessa transazione, un relay pubblica dopo."] },
    { l: "Come funziona", i: ["Relay a polling (FOR UPDATE SKIP LOCKED) per partire, CDC con Debezium (legge il WAL) quando cresci. Garanzia at-least-once → inbox/dedup per event_id sul consumer."] },
    { l: "Errori comuni", i: ["«Commit poi publish»: crash in mezzo = evento perso. «Publish poi commit»: evento fantasma.", "Esporre le tabelle interne via CDC ad altri team: lo schema diventa un contratto."] },
  ]},
  { id: "fc-temporal", s: "System Design", t: "Temporal: workflow durevoli", b: [
    { l: "Come funziona", i: ["Il workflow (deterministico) orchestra; le activity (I/O) lavorano e vengono ritentate. Ogni passo finisce nella event history: dopo un crash un altro worker rigioca la history e riprende."] },
    { l: "Da ricordare", i: ["Nel workflow niente datetime.now(), random o rete: workflow.now(), workflow.random(), activity.", "Signal per gli umani, timer durevoli per le attese. Activity idempotenti.", "Codice cambiato con run in volo → NonDeterminismError: si usa workflow.patched()."] },
  ]},
  { id: "fc-dmschema", s: "SQL & Database", t: "Progettare lo schema", b: [
    { l: "Come funziona", i: ["Normalizzazione: ogni fatto dipende dalla chiave, da tutta la chiave, da nient'altro che la chiave. Violarla produce anomalie di aggiornamento, inserimento e cancellazione."] },
    { l: "Trade-off", i: ["Documento/JSONB se i dati si leggono in blocco, con struttura variabile e pochi vincoli; tabelle per relazioni, vincoli, report. L'ibrido: colonne fisse + JSONB con indice GIN."] },
    { l: "Errori comuni", i: ["Leggere il prezzo pagato da products: il prezzo pagato è un fatto diverso dal listino.", "Normalizzare su dipendenze apparenti (CAP → città)."] },
  ]},
  { id: "fc-dmtempo", s: "SQL & Database", t: "Dati nel tempo e per l'analisi", b: [
    { l: "Definizione", i: ["OLTP: il DB dell'app, normalizzato. OLAP: analisi su milioni di righe, star schema (fact + dimensioni) su motori colonnari."] },
    { l: "Come funziona", i: ["SCD tipo 1 sovrascrive, tipo 2 versiona (valid_from/valid_to/is_current). Audit con colonne e tabelle history; event sourcing dove lo storico è il dominio."] },
    { l: "Errori comuni", i: ["UPDATE di una dimensione che conta nei report: riscrivi il passato.", "Soft delete senza UNIQUE parziale né filtro in ogni query."] },
  ]},
  { id: "fc-oauthflussi", s: "Auth & sicurezza", t: "OAuth: scegliere il flusso", b: [
    { l: "Come funziona", i: ["Nessun utente → Client Credentials. Utente senza browser → device code. Altrimenti Authorization Code + PKCE, anche con client secret. Implicit e password grant: deprecati."] },
    { l: "Da ricordare", i: ["Scope minimi, consenso incrementale; offline_access solo se lavori senza l'utente.", "Da client: state, redirect_uri esatto, refresh token cifrato, lock sul refresh, invalid_grant = ricollega."] },
  ]},
];


/* Stesse chiavi, stesso ordine di opzioni e stesso indice corretto di QUIZ_IT. */
const QUIZ_EN = {
  vm: [
    { q: "Why does a container start in under a second and a VM in a minute?", options: ["The VM has to boot a whole operating system; the container is a process on a kernel that's already running", "The container is better compressed", "The VM runs on slower hardware"], correct: 0, why: "No boot: the container is an isolated process (namespaces + cgroups) on the host's kernel." },
    { q: "A 3-hour job on AWS Lambda:", options: ["is fine if you increase the memory", "is fine if you pay for a higher timeout", "can't be done: the limit is 15 minutes"], correct: 2, why: "Lambda stops at 15 minutes. Long batches go on scheduled containers or VMs." },
    { q: "What turns a VM from a “pet” into “cattle”?", options: ["A daily backup", "Being born from an image + cloud-init/Terraform: you destroy it and an identical one is reborn", "A more descriptive name"], correct: 1, why: "Cattle = rebuildable from code. A backup saves the data, it doesn't tell you how the machine was configured." },
  ],
  k8s: [
    { q: "One pod of a Deployment with 3 replicas dies. What happens?", options: ["The controller creates a new one to get back to 3", "Nothing, until you apply again", "Traffic moves to another Deployment"], correct: 0, why: "Reconciliation loop: the controller sees 2 ≠ 3 and closes the gap." },
    { q: "Why do other services call a Service rather than a pod's IP?", options: ["It's faster", "It's only needed for HTTPS", "Pods are ephemeral and change IP; the Service is stable and finds them by label"], correct: 2, why: "Pods come and go; the Service stays, and selects whichever ones are alive." },
    { q: "A livenessProbe that checks the database is dangerous because…", options: ["it slows the pod down", "if the DB slows down, K8s restarts every pod at once", "the DB doesn't answer probes"], correct: 1, why: "A DB slowdown becomes a total outage. Liveness checks only the process; readiness may look at dependencies." },
  ],
  terraform: [
    { q: "What does -/+ mean in the plan?", options: ["An in-place change", "The resource will be destroyed and recreated", "An imported resource"], correct: 1, why: "An attribute that “forces replacement” has changed: new resource, new id." },
    { q: "Why doesn't Terraform state go in git?", options: ["It holds secrets in plain text and needs a lock against concurrent applies", "It's too big", "Git can't handle JSON"], correct: 0, why: "A remote backend with a lock (e.g. S3): encrypted, shared, one apply at a time." },
    { q: "Someone changes a tag by hand in the console. On the next apply…", options: ["Terraform adopts the change", "the apply fails", "Terraform reverts it and puts back the value from the file"], correct: 2, why: "That's drift: the file is the truth. If the change is needed, it goes in the code." },
  ],
  ambienti: [
    { q: "What must be identical between staging and prod?", options: ["The secrets", "The image (same digest) and the infrastructure", "The users' data"], correct: 1, why: "Parity of code and infrastructure; secrets and data are exactly what must differ." },
    { q: "Why not rebuild the image for prod after testing it in staging?", options: ["The new build may differ: prod ends up running something nobody has tested", "It costs more", "Docker doesn't allow it"], correct: 0, why: "Build once, deploy many: you promote the same digest." },
    { q: "A migration is quick in staging and locks prod for minutes. What was staging missing?", options: ["More RAM", "A second database", "Realistically sized data"], correct: 2, why: "2,000 rows against 40 million: same SQL, opposite behaviour." },
  ],
  flags: [
    { q: "Why is a rollout's bucket computed with a hash and not with Math.random()?", options: ["Same person, same bucket: a stable experience, and the 30% contains the 10%", "It's faster", "Math.random doesn't exist on the server"], correct: 0, why: "With a random draw on every request the feature appears and vanishes, and experiments measure nothing." },
    { q: "When do you remove a release flag?", options: ["Never, it costs nothing", "When it's at 100% and stable: out goes the if and the old branch", "At the next language upgrade"], correct: 1, why: "Every live flag doubles the possible paths. Release flags have a date of death." },
    { q: "A flag evaluated in the browser to hide a paid feature:", options: ["Is fine if obfuscated", "Is fine", "Is wrong: the config is readable, the check belongs on the server"], correct: 2, why: "Anything that reaches the browser can be read and modified by whoever is using it." },
  ],
  kafka: [
    { q: "The key difference between Kafka and a classic queue:", options: ["Kafka is faster", "Kafka doesn't guarantee ordering", "In Kafka messages stay after being read: each group has its own offset and can reread"], correct: 2, why: "A log, not a queue: reading doesn't delete." },
    { q: "A consumer group's maximum parallelism is:", options: ["The number of partitions in the topic", "Unlimited", "The number of brokers"], correct: 0, why: "One partition, one consumer in the group. Extra consumers sit idle." },
    { q: "How do you guarantee the ordering of events for the same order?", options: ["A single consumer for the whole topic", "Message key = order_id", "A timestamp in the message"], correct: 1, why: "Same key → same partition → read in sequence." },
  ],
  outbox: [
    { q: "What is the dual-write problem?", options: ["Writing the same record twice", "Updating two systems without a shared transaction: a crash in between leaves them inconsistent", "Two users writing at the same time"], correct: 1, why: "The DB and the broker don't share a transaction: you need a mechanism that makes the second step inevitable." },
    { q: "What delivery guarantee does the outbox give?", options: ["At-least-once: consumers must be idempotent", "Exactly-once", "At-most-once"], correct: 0, why: "The relay may publish twice (a crash between publish and “mark as published”), never zero times." },
    { q: "Why not expose internal tables to other teams via CDC?", options: ["It's slow", "Debezium doesn't support it", "The internal schema becomes a public contract: every refactor breaks the consumers"], correct: 2, why: "For outsiders you publish domain events (the outbox), stable and designed for the people reading them." },
  ],
  temporal: [
    { q: "During replay, an activity that already completed…", options: ["is run again", "returns the result saved in the history, without running again", "is skipped and the workflow fails"], correct: 1, why: "The history is the workflow's memory: the code is replayed, the work already done isn't." },
    { q: "Why no datetime.now() inside a workflow?", options: ["On replay it would return a different value and the code might take another branch", "It's slow", "Temporal doesn't handle time zones"], correct: 0, why: "You use workflow.now(), which returns the time recorded in the history." },
    { q: "How does a person's approval reach a waiting workflow?", options: ["Polling the database", "By restarting the workflow", "With a signal"], correct: 2, why: "The workflow waits (even for days) without tying up workers; the signal wakes it up." },
  ],
  dmschema: [
    { q: "What is an update anomaly?", options: ["A slow UPDATE", "An UPDATE without a WHERE", "The same fact repeated in several rows which, updated in only one, diverges"], correct: 2, why: "The symptom of a fact without a single home." },
    { q: "Should the price on the order line be removed to normalise?", options: ["No: the price paid and the list price are different facts", "Yes, it's already in products", "Only if the product was discounted"], correct: 0, why: "Reading it from products would rewrite invoices at every price-list change." },
    { q: "When is a document (or JSONB) the right choice?", options: ["Always, it's more flexible", "Data read and written as a whole, variable structure, few constraints", "When you need lots of JOINs"], correct: 1, why: "Relations, constraints and aggregations remain the tables' job." },
  ],
  dmtempo: [
    { q: "What characterises an OLAP workload?", options: ["Lots of small concurrent writes", "Requests from a single user", "A few queries over millions of rows and a few columns, often about the past"], correct: 2, why: "That's why columnar engines and star schemas are used." },
    { q: "SCD type 2:", options: ["Adds a row for each version, with a valid from/to", "Overwrites the value", "Deletes the history"], correct: 0, why: "Every fact attaches to the version valid on its date." },
    { q: "The soft-delete trap:", options: ["It takes up space", "Every query must filter deleted_at, UNIQUEs must become partial, and it doesn't count as a GDPR deletion", "It can't be undone"], correct: 1, why: "It's convenient, but it shifts the responsibility onto every query." },
  ],
  oauthflussi: [
    { q: "A server calling an API, no user involved:", options: ["Auth Code + PKCE", "Client Credentials", "Device code"], correct: 1, why: "The client uses its own credentials; there's no consent to ask for." },
    { q: "Why are implicit and password grant deprecated?", options: ["They expose the token in the URL or pass the password through the client", "They're slow", "They don't support scopes"], correct: 0, why: "OAuth 2.1 removes them; Auth Code + PKCE is what's left." },
    { q: "The refresh token returns invalid_grant. What do you do?", options: ["Retry in a loop", "Use the last access token", "Mark the integration as needing to be reconnected and notify the user"], correct: 2, why: "Revoked access or a password change: only the user can fix it." },
  ],
};

/* Glossario: chiave = termine italiano. t solo dove il termine cambia. */
const GLOSS_EN = {
  "Hypervisor": { d: "The software that splits a physical server into several virtual machines, each with its own OS and kernel (KVM, Xen, Hyper-V; on AWS, Nitro)." },
  "VM vs container": { d: "A VM carries a whole OS with its own kernel (strong isolation, boots in tens of seconds); a container is an isolated process on the host's kernel (starts in an instant)." },
  "Pet vs cattle": { t: "Pets vs cattle", d: "Pet: a machine set up by hand, unique, impossible to reproduce. Cattle: born from code (image, cloud-init, Terraform), thrown away and recreated identical." },
  "cloud-init": { d: "The script (user-data) a VM runs on first boot: packages, files, commands. No manual configuration over SSH." },
  "Reconciliation loop": { d: "The heart of Kubernetes: you declare the desired state, a controller compares it with the actual one and acts until they match." },
  "Pod / Deployment / Service": { d: "Pod: containers that live together, ephemeral. Deployment: the desired state (image, replicas, rollout). Service: a stable name and IP in front of the pods." },
  "readiness vs liveness": { d: "Readiness: can I take traffic? (if not, out of the Service). Liveness: am I alive? (if not, restart). Liveness never looks at dependencies." },
  "Terraform / IaC": { d: "Infrastructure described in versioned files: plan shows the diff against the real world, apply carries it out. Staging and prod from the same code." },
  "tfstate": { d: "Terraform's state: links each resource in the code to its real id. A remote backend with a lock, never in git (it contains secrets)." },
  "Drift": { d: "A difference between the code and the real world, usually from a manual change. The next apply reverts it." },
  "Dev / staging / prod": { d: "Three copies of the same system: for breaking things, for the dress rehearsal, for the users. Same image and infrastructure; config, data and access differ." },
  "Build once, deploy many": { d: "The image is built once; the same digest is promoted from staging to prod. Rebuilding for prod = shipping to prod something never tested." },
  "Preview environment": { d: "A throwaway environment for each PR, with its own URL: reviewers try the change instead of imagining it." },
  "Feature flag": { d: "An if driven by config: it separates the deploy (the code is in prod) from the release (users see it)." },
  "Rollout percentuale": { t: "Percentage rollout", d: "bucket = hash(flag + userId) % 100; on if bucket < percentage. Stable per person: the 30% contains the 10%." },
  "Kill switch": { d: "A permanent ops flag that switches off an expensive part under load. It must be tested before the day you need it." },
  "Kafka / log": { d: "A log-based event broker: messages are appended and stay (retention); each consumer group reads with its own offset and can reread." },
  "Partizione (Kafka)": { t: "Partition (Kafka)", d: "An ordered slice of the topic. hash(key) % N decides where a message goes: same key, same partition, guaranteed order." },
  "Offset / consumer lag": { d: "Offset: how far a group has read in a partition. Lag: messages produced minus messages read — if it grows, the consumers aren't keeping up." },
  "Consumer group": { d: "Consumers that share out a topic's partitions (one partition each). Different groups read everything, independently." },
  "Dual-write problem": { d: "Updating two systems (DB and broker) without a shared transaction: a crash in between leaves them inconsistent." },
  "Outbox pattern": { d: "State and event written in the same transaction (an outbox table); a relay publishes them afterwards. At-least-once, never lost." },
  "CDC (Debezium)": { d: "Change Data Capture: reads the database's WAL and turns every change into an event, without touching the application." },
  "Inbox / dedup": { d: "The consumer saves the event_ids it has already processed in the same transaction as the effect: a duplicate is recognised and skipped." },
  "Workflow vs activity (Temporal)": { d: "Workflow: deterministic orchestration, replayed from the history. Activity: the work with I/O, retried, therefore idempotent." },
  "Signal / query (Temporal)": { d: "Signal: an external message that changes or wakes a workflow (e.g. an approval). Query: reading the state without changing it." },
  "Determinismo (workflow)": { t: "Determinism (workflow)", d: "Same input and same history → same path. No clock, random or network in the workflow: workflow.now(), workflow.random(), activities." },
  "Anomalie (update/insert/delete)": { t: "Anomalies (update/insert/delete)", d: "What happens to a fact that's repeated or tied to the wrong row: copies that diverge, entities you can't create, entities that vanish when you delete something else." },
  "1NF / 2NF / 3NF": { d: "One value per cell; every column depends on the whole key; no dependencies between non-key columns. “The key, the whole key, and nothing but the key”." },
  "Denormalizzazione": { t: "Denormalisation", d: "Copying data on purpose to read faster (counters, reporting tables), knowing who keeps the copies in sync." },
  "OLTP vs OLAP": { d: "OLTP: the app's DB, lots of small transactions on few records. OLAP: analysis over millions of rows, columnar engines (BigQuery, Snowflake, ClickHouse)." },
  "Star schema": { d: "An analytical model: a fact table (measures + keys) in the middle, dimension tables (date, customer, product) around it." },
  "SCD tipo 1 / tipo 2": { t: "SCD type 1 / type 2", d: "Slowly Changing Dimension. Type 1: overwrite (you lose the history). Type 2: one row per version, with valid_from/valid_to." },
  "Soft delete": { d: "deleted_at instead of DELETE. It needs filters everywhere and partial UNIQUEs, and it doesn't count as a deletion for GDPR purposes." },
  "Event sourcing": { d: "Only the events are stored (append-only); state is a projection derived by replaying them. Ideal where history is the domain." },
  "Client Credentials": { d: "An OAuth flow with no user: the client authenticates with its own credentials and gets a token for itself. Service to service." },
  "Device code": { d: "An OAuth flow for clients with no browser (TV, remote CLI): a code on screen, confirmation from another device, the client waits by polling." },
  "Scope / consenso": { t: "Scope / consent", d: "The permissions the app asks for and the user approves. Minimal, and asked for when needed (incremental consent)." },
  "Client pubblico vs confidenziale": { t: "Public vs confidential client", d: "Confidential: runs on your server and keeps a secret. Public: an SPA or mobile app, where a secret isn't secret — PKCE replaces it." },
  "state (OAuth)": { d: "A random value bound to the session and checked on the callback: it stops an attacker getting you to link their account." },
  "invalid_grant": { d: "A token endpoint error: refresh token revoked, expired or already used. You reconnect the account, you don't retry." },
};

/* Flashcard: chiave = id; b = voci di ogni blocco, nello stesso ordine di FLASH_IT. */
const FLASH_EN = {
  "fc-vm": { t: "VMs, containers, serverless: where it runs", b: [
    ["VM: a virtual computer with its own OS and kernel, created by a hypervisor. Container: an isolated process on the host's kernel. Serverless: a function on microVMs managed by the provider."],
    ["Need a whole OS (drivers, Windows)? VM. N identical copies that start in a second? Container. Spiky load and short requests? Serverless (Lambda: 15 minutes max)."],
    ["Configuring by hand over SSH: the VM becomes a pet nobody can reproduce. You start from an image + cloud-init/Terraform.", "Important data on the local disk (instance store): it vanishes when the VM stops."],
  ]},
  "fc-k8s": { t: "Kubernetes in five objects", b: [
    ["You declare the desired state (Deployment: image + replicas); a controller chases it (reconciliation loop). Ephemeral pods, a stable Service in front, Ingress from outside, ConfigMap/Secret for config."],
    ["Rolling update with maxSurge 1 / maxUnavailable 0: first the new one is born, then the old one dies.", "Readiness = can I take traffic? Liveness = am I alive? Liveness never checks the DB.", "A Secret is base64, not encrypted."],
  ]},
  "fc-terraform": { t: "Terraform: plan, apply, state", b: [
    ["The .tf file describes the desired state; the state links resources to real ids; plan shows the diff (+ create, ~ change, -/+ recreate, - destroy); apply carries it out."],
    ["Not reading the plan: a -/+ on the prod instance is a new VM with a new IP.", "State in git (secrets in plain text) or without a lock (two applies at once).", "Manual changes in the console: drift, reverted by the next apply."],
  ]},
  "fc-ambienti": { t: "Dev, staging, prod", b: [
    ["Dev for breaking things, a preview for each PR, staging for the dress rehearsal, prod for the users. Same image and infrastructure; different config, secrets, data and access."],
    ["Build once, deploy many: you promote the same digest.", "Staging with realistically sized, anonymised data.", "Separate keys per environment; no if (env === 'production') in the code."],
  ]},
  "fc-flags": { t: "Feature flags", b: [
    ["Deploy ≠ release: the code goes to prod switched off. Server-side evaluation; bucket = hash(flag + userId) % 100, on if below the percentage."],
    ["Release (weeks, then removed), experiment (until significance), kill switch (permanent), permission (long-lived).", "Every live flag doubles the paths: at 100% the if comes out. Knight Capital 2012: a recycled flag, 440 million lost in 45 minutes."],
  ]},
  "fc-kafka": { t: "Kafka: log, partitions, offsets", b: [
    ["A distributed log: messages stay after being read; each consumer group has its own offsets and can reread (replay)."],
    ["hash(key) % N picks the partition: ordering guaranteed only within a partition. A group has at most as many active consumers as there are partitions.", "Process then commit = at-least-once → idempotent consumers."],
    ["Kafka for event streams with several readers and replay; a queue (SQS) for jobs to work through. Adding partitions reshuffles the keys."],
  ]},
  "fc-outbox": { t: "Outbox & CDC", b: [
    ["Dual-write problem: the DB and the broker don't share a transaction. Outbox: state + event in the same transaction, a relay publishes afterwards."],
    ["A polling relay (FOR UPDATE SKIP LOCKED) to start with, CDC with Debezium (reads the WAL) as you grow. At-least-once guarantee → inbox/dedup by event_id on the consumer."],
    ["“Commit then publish”: a crash in between = event lost. “Publish then commit”: a ghost event.", "Exposing internal tables to other teams via CDC: the schema becomes a contract."],
  ]},
  "fc-temporal": { t: "Temporal: durable workflows", b: [
    ["The (deterministic) workflow orchestrates; the activities (I/O) do the work and are retried. Every step goes into the event history: after a crash another worker replays the history and carries on."],
    ["In the workflow no datetime.now(), random or network: workflow.now(), workflow.random(), activities.", "Signals for humans, durable timers for waits. Idempotent activities.", "Code changed with runs in flight → NonDeterminismError: you use workflow.patched()."],
  ]},
  "fc-dmschema": { t: "Designing the schema", b: [
    ["Normalisation: every fact depends on the key, the whole key, and nothing but the key. Breaking it produces update, insertion and deletion anomalies."],
    ["Document/JSONB when the data is read as a whole, with a variable structure and few constraints; tables for relations, constraints, reports. The hybrid: fixed columns + JSONB with a GIN index."],
    ["Reading the price paid from products: the price paid is a different fact from the list price.", "Normalising on apparent dependencies (postcode → city)."],
  ]},
  "fc-dmtempo": { t: "Data over time and for analysis", b: [
    ["OLTP: the app's DB, normalised. OLAP: analysis over millions of rows, a star schema (facts + dimensions) on columnar engines."],
    ["SCD type 1 overwrites, type 2 versions (valid_from/valid_to/is_current). Audit with columns and history tables; event sourcing where history is the domain."],
    ["UPDATE on a dimension that matters in reports: you rewrite the past.", "Soft delete with no partial UNIQUE and no filter in every query."],
  ]},
  "fc-oauthflussi": { t: "OAuth: choosing the flow", b: [
    ["No user → Client Credentials. A user with no browser → device code. Otherwise Authorization Code + PKCE, even with a client secret. Implicit and password grant: deprecated."],
    ["Minimal scopes, incremental consent; offline_access only if you work without the user.", "As a client: state, exact redirect_uri, encrypted refresh token, a lock on refresh, invalid_grant = reconnect."],
  ]},
};

export const BK_QUIZZES = memoByLang(() => T(QUIZ_IT, QUIZ_EN));
export const BK_GLOSSARY = GLOSS_IT.map((g) => ({ ...g, en: GLOSS_EN[g.t] }));
export const BK_FLASHCARDS = FLASH_IT.map((c) => ({ ...c, en: FLASH_EN[c.id] }));
