// Converte i dataset ARCH_*/SEQ_* di Lesson.jsx in JSON archify.
// Estrae gli object literal per brace-matching, elimina gli icon identifier
// (non-JSON) e i distractors, poi mappa griglia col/row -> coordinate.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dir, "../src/Lesson.jsx");
const jsx = fs.readFileSync(SRC, "utf8");

const ARCH = ["METODO","STIME","DATI","ASYNC","TINYURL","UBER","NETFLIX","TICKET","CRAWLER","DELIVERY","CHAT"];
const SEQ  = [...ARCH];

// --- estrazione object literal per nome ---
function extract(name) {
  const marker = `const ${name} = {`;
  const start = jsx.indexOf(marker);
  if (start < 0) throw new Error(`non trovato: ${name}`);
  let i = start + marker.length - 1; // sul '{'
  let depth = 0, inStr = null;
  for (; i < jsx.length; i++) {
    const c = jsx[i], p = jsx[i - 1];
    if (inStr) { if (c === inStr && p !== "\\") inStr = null; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) { i++; break; } }
  }
  let body = jsx.slice(start + `const ${name} = `.length, i);
  // togli icon: Ident  e  distractors: [...]
  body = body.replace(/icon:\s*[A-Za-z_$][\w$]*\s*,?/g, "");
  body = body.replace(/,?\s*distractors:\s*\[[\s\S]*?\]\s*(?=})/g, "");
  // eslint-disable-next-line no-eval
  return eval("(" + body + ")");
}

// --- mapping tipo componente ---
function typeOf(id, tone) {
  const s = id.toLowerCase();
  if (/(^client|rider|driver|customer|courier|seed|studio|uploader|user|player|^a$|^b$)/.test(s)) return "external";
  if (/(lb|gw|gateway|cdn|dns)/.test(s)) return "cloud";
  if (/(queue|frontier|events|event|pubsub|^ps$|bus)/.test(s)) return "messagebus";
  if (/(db|cache|redis|replica|primary|shard|meta|blob|store|s3|geo|seen|lock|inbox|msgdb|tripdb)/.test(s)) return "database";
  if (/auth/.test(s)) return "security";
  return { zinc: "external", indigo: "backend", emerald: "backend", amber: "messagebus", blue: "cloud", red: "security" }[tone] || "backend";
}

const X = (col) => 40 + col * 210;
const Y = (row) => 150 + row * 150;

// Edge non orizzontale → detour verticale nel gap (vuoto) tra le colonne,
// così non attraversa i nodi impilati nella stessa colonna.
function routeOf(f, t) {
  const fcx = X(f.col) + 70, tcx = X(t.col) + 70, fcy = Y(f.row) + 30, tcy = Y(t.row) + 30;
  if (f.row === t.row) {
    if (Math.abs(t.col - f.col) <= 1) return {}; // adiacente: linea dritta
    const chY = Y(f.row) + 105; // canale nel gap sotto la riga (vuoto)
    return { fromSide: "bottom", toSide: "bottom", via: [[fcx, chY], [tcx, chY]] };
  }
  let gapX, fromSide, toSide;
  if (t.col > f.col) { gapX = X(f.col) + 175; fromSide = "right"; toSide = "left"; }
  else if (t.col < f.col) { gapX = X(f.col) - 35; fromSide = "left"; toSide = "right"; }
  else { gapX = X(f.col) + 175; fromSide = "right"; toSide = "right"; }
  return { fromSide, toSide, via: [[gapX, fcy], [gapX, tcy]] };
}

function toArchitecture(name, d) {
  const byId = Object.fromEntries(d.nodes.map((n) => [n.id, n]));
  const components = d.nodes.map((n) => ({
    id: n.id, type: typeOf(n.id, n.tone), label: n.label,
    ...(n.sub ? { sublabel: n.sub } : {}),
    pos: [X(n.col), Y(n.row)], size: [140, 60],
  }));
  const seen = {};
  const connections = d.edges.map((e) => {
    let id = `${e.from}_${e.to}`; if (seen[id]) id += `_${seen[id]}`; seen[`${e.from}_${e.to}`] = (seen[`${e.from}_${e.to}`] || 0) + 1;
    return { id, from: e.from, to: e.to, variant: e.dashed ? "dashed" : "default", ...routeOf(byId[e.from], byId[e.to]) };
  });
  const trades = d.steps.filter((s) => s.trade && s.trade.trim()).slice(0, 4)
    .map((s) => `${byId[s.id]?.label || s.id}: ${s.trade}`.slice(0, 120));
  const cards = trades.length ? [{ dot: "amber", title: "Compromessi chiave", items: trades }] : [];
  // Guided view nativa: un solo view con TUTTI i nodi nell'ordine dei nostri step ->
  // il loro Story Beat Navigator diventa esattamente la sequenza del nostro "Guidami"
  // (#view=guidami&beat=<nodeId>), driven dal lato React che tiene il testo pieno.
  const views = [{ id: "guidami", label: "Guidami", focus: d.steps.map((s) => s.id), note: "I pezzi dell'architettura, uno alla volta." }];
  return {
    schema_version: 1, diagram_type: "architecture",
    meta: { title: cap(d.title), subtitle: "Mattoni ricorrenti e i loro compromessi", output: `${name}.html`, visual_preset: "blueprint", quality_profile: "standard", views },
    components, connections, cards,
  };
}

function toSequence(name, d) {
  const participants = d.actors.map((a) => ({ id: a.id, type: typeOf(a.id, a.tone), label: a.label }));
  // Le sequence archify non hanno self-call: le pieghiamo come `note` sul
  // messaggio precedente (o successivo).
  let y = 170; const messages = [];
  const selfNotes = [];
  d.steps.forEach((s) => {
    if (s.from === s.to) {
      const txt = `${s.label} — ${s.note}`.slice(0, 140);
      if (messages.length) messages[messages.length - 1].note = txt;
      else selfNotes.push(txt);
      return;
    }
    const v = s.kind === "return" ? "return" : s.kind === "async" ? "dashed" : "default";
    const m = { id: `m${messages.length}`, from: s.from, to: s.to, y, label: s.label, variant: v };
    if (selfNotes.length) { m.note = selfNotes.shift(); }
    messages.push(m); y += 40;
  });

  // Activation bars (i "riquadri" di durata): standard UML — un partecipante è
  // attivo da quando RICEVE un messaggio a quando ne INVIA la risposta. I
  // self-call (già piegati in note qui sopra) restano dentro la finestra
  // naturalmente, quindi non serve trattarli a parte.
  const activeSince = {};
  const activations = [];
  messages.forEach((m) => {
    if (activeSince[m.to] === undefined) activeSince[m.to] = m.y;
    if (activeSince[m.from] !== undefined) {
      activations.push({ participant: m.from, from: activeSince[m.from], to: m.y, type: typeOf(m.from, "") });
      delete activeSince[m.from];
    }
  });
  const lastY = messages.length ? messages[messages.length - 1].y : y;
  Object.entries(activeSince).forEach(([p, since]) => {
    if (lastY - since >= 20) activations.push({ participant: p, from: since, to: lastY, type: typeOf(p, "") });
  });

  const w = Math.max(780, participants.length * 165);
  return {
    schema_version: 1, diagram_type: "sequence",
    meta: { title: cap(d.title), subtitle: "Chi chiama chi, passo per passo", output: `${name}.html`, viewBox: [w, Math.max(480, y + 50)], visual_preset: "blueprint", animation: "trace", quality_profile: "standard" },
    participants, messages, activations,
  };
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Diagrammi architecture nuovi (non in Lesson.jsx): stessa forma, così
// riusano il routing automatico.
const EXTRA_ARCH = {
  "new-orchestrator-workers": {
    title: "orchestrator–workers",
    nodes: [
      { id: "task", label: "Compito", sub: "forma ignota", col: 0, row: 1, tone: "zinc" },
      { id: "orch", label: "Orchestratore", sub: "scompone a runtime", col: 1, row: 1, tone: "indigo" },
      { id: "w1", label: "Worker", sub: "sotto-task", col: 2, row: 0, tone: "emerald" },
      { id: "w2", label: "Worker", sub: "sotto-task", col: 2, row: 1, tone: "emerald" },
      { id: "w3", label: "Worker", sub: "sotto-task", col: 2, row: 2, tone: "emerald" },
      { id: "synth", label: "Sintesi", sub: "unisce i risultati", col: 3, row: 1, tone: "indigo" },
    ],
    edges: [
      { from: "task", to: "orch" }, { from: "orch", to: "w1" }, { from: "orch", to: "w2" },
      { from: "orch", to: "w3" }, { from: "w1", to: "synth" }, { from: "w2", to: "synth" }, { from: "w3", to: "synth" },
    ],
    steps: [
      { id: "orch", trade: "Decide a runtime quanti e quali sotto-task servono: la forma non è nota in anticipo." },
      { id: "w1", trade: "I worker girano in parallelo, ognuno con il proprio contesto." },
      { id: "synth", trade: "La sintesi unisce i risultati: base della ricerca/report agentici." },
    ],
  },
  "new-fan-out": {
    title: "fan-out · scrittura vs lettura",
    nodes: [
      { id: "author", label: "Autore", sub: "pubblica 1 post", col: 0, row: 0, tone: "zinc" },
      { id: "wfan", label: "Fan-out write", sub: "scrive N inbox", col: 1, row: 0, tone: "indigo" },
      { id: "inbox", label: "Feed follower", sub: "pronto in lettura", col: 2, row: 0, tone: "emerald" },
      { id: "reader", label: "Lettore", sub: "apre il feed", col: 0, row: 2, tone: "zinc" },
      { id: "rfan", label: "Fan-out read", sub: "espande al bisogno", col: 1, row: 2, tone: "indigo" },
      { id: "posts", label: "Post seguiti", sub: "unione a runtime", col: 2, row: 2, tone: "emerald" },
    ],
    edges: [
      { from: "author", to: "wfan" }, { from: "wfan", to: "inbox" },
      { from: "reader", to: "rfan" }, { from: "rfan", to: "posts" },
    ],
    steps: [
      { id: "wfan", trade: "Scrittura costosa per chi ha milioni di follower (celebrità): tanti inbox da aggiornare." },
      { id: "rfan", trade: "Scrittura economica, ma la lettura espande il feed ogni volta: costo spostato in lettura." },
      { id: "inbox", trade: "Ibrido: fan-out in scrittura per i normali, in lettura per le celebrità." },
    ],
  },
  "new-consistent-hashing": {
    title: "consistent hashing · l'anello",
    nodes: [
      { id: "key", label: "Chiave", sub: "hash(user_id)", col: 0, row: 1, tone: "zinc" },
      { id: "ring", label: "Anello", sub: "posizione = hash", col: 1, row: 1, tone: "blue" },
      { id: "nodeA", label: "Nodo A", col: 2, row: 0, tone: "amber" },
      { id: "nodeB", label: "Nodo B", sub: "assegnato (orario)", col: 2, row: 1, tone: "emerald" },
      { id: "nodeC", label: "Nodo C", col: 2, row: 2, tone: "amber" },
    ],
    edges: [
      { from: "key", to: "ring" }, { from: "ring", to: "nodeB" },
      { from: "ring", to: "nodeA", dashed: true }, { from: "ring", to: "nodeC", dashed: true },
    ],
    steps: [
      { id: "ring", trade: "La chiave va al primo nodo in senso orario sull'anello." },
      { id: "nodeB", trade: "Aggiungere/togliere un nodo sposta solo ~1/N delle chiavi, non tutte (vs hash % N)." },
    ],
  },
  "new-routing-support": {
    title: "routing · supporto clienti",
    nodes: [
      { id: "ticket", label: "Ticket", sub: "richiesta utente", col: 0, row: 1, tone: "zinc" },
      { id: "classify", label: "Classificatore", sub: "LLM router", col: 1, row: 1, tone: "indigo" },
      { id: "reset", label: "Reset password", sub: "automatico", col: 2, row: 0, tone: "emerald" },
      { id: "refund", label: "Rimborso", sub: "gate umano", col: 2, row: 1, tone: "amber" },
      { id: "info", label: "Info / FAQ", sub: "risposta diretta", col: 2, row: 2, tone: "emerald" },
    ],
    edges: [
      { from: "ticket", to: "classify" }, { from: "classify", to: "reset" },
      { from: "classify", to: "refund" }, { from: "classify", to: "info" },
    ],
    steps: [
      { id: "classify", trade: "Un classificatore smista input eterogenei al sotto-flusso giusto." },
      { id: "refund", trade: "Il rimborso richiede un gate di approvazione; il reset password è automatico." },
    ],
  },
  "new-workflow-vs-agent": {
    title: "workflow vs agente",
    nodes: [
      { id: "task", label: "Compito", sub: "da automatizzare", col: 0, row: 1, tone: "zinc" },
      { id: "decide", label: "Passi noti?", sub: "scelta di design", col: 1, row: 1, tone: "indigo" },
      { id: "wf", label: "Workflow", sub: "percorso prefissato", col: 2, row: 0, tone: "emerald" },
      { id: "agent", label: "Agente", sub: "l'LLM decide i passi", col: 2, row: 2, tone: "amber" },
    ],
    edges: [
      { from: "task", to: "decide" }, { from: "decide", to: "wf" }, { from: "decide", to: "agent" },
    ],
    steps: [
      { id: "wf", trade: "Passi noti → workflow: prevedibile, testabile, più economico." },
      { id: "agent", trade: "Passi ignoti → agente: flessibile ma meno prevedibile. Autonomia solo dove serve." },
    ],
  },
  "new-cap-theorem": {
    title: "CAP · durante una partizione",
    nodes: [
      { id: "partition", label: "Partizione di rete", sub: "un nodo isolato", col: 0, row: 1, tone: "zinc" },
      { id: "choose", label: "Devi scegliere", sub: "C oppure A", col: 1, row: 1, tone: "indigo" },
      { id: "cp", label: "CP", sub: "rifiuta → coerente", col: 2, row: 0, tone: "emerald" },
      { id: "ap", label: "AP", sub: "serve stantio → disponibile", col: 2, row: 2, tone: "amber" },
    ],
    edges: [
      { from: "partition", to: "choose" }, { from: "choose", to: "cp" }, { from: "choose", to: "ap" },
    ],
    steps: [
      { id: "cp", trade: "CP: meglio un errore che un dato sbagliato (es. saldo bancario)." },
      { id: "ap", trade: "AP: meglio un dato un po' vecchio che nessun dato (es. feed social)." },
    ],
  },
};

for (const n of ARCH) {
  const d = extract(`ARCH_${n}`);
  const slug = `case-${n.toLowerCase()}`;
  fs.writeFileSync(path.join(__dir, `${slug}.architecture.json`), JSON.stringify(toArchitecture(slug, d), null, 2));
}
for (const [slug, d] of Object.entries(EXTRA_ARCH)) {
  const j = toArchitecture(slug, d);
  j.meta.subtitle = "Come i pezzi si compongono";
  fs.writeFileSync(path.join(__dir, `${slug}.architecture.json`), JSON.stringify(j, null, 2));
}
for (const n of SEQ) {
  const d = extract(`SEQ_${n}`);
  const slug = `seq-${n.toLowerCase()}`;
  fs.writeFileSync(path.join(__dir, `${slug}.sequence.json`), JSON.stringify(toSequence(slug, d), null, 2));
}
console.log("generati", ARCH.length + SEQ.length, "JSON");
