/* ============================================================================
   Logica pura dei capitoli «backend avanzato» (backend-avanzato.jsx).
   Niente React, niente DOM: si testa con  node src/backend-avanzato-core.js
   ========================================================================== */
import { T } from "./i18n.js"; // i messaggi di log (why, log) seguono la lingua attiva

/* FNV-1a 32 bit: stesso input → stesso numero, su ogni macchina. È la base di
   partizioni Kafka e bucket dei feature flag (entrambi DEVONO essere stabili). */
export function hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

/* ---------------- Kafka ---------------- */

export const partitionFor = (key, n) => hash(key) % n;

// range assignor: partizioni contigue; i primi consumer prendono l'eccedenza,
// quelli oltre il numero di partizioni restano a mani vuote
export function assignPartitions(nPart, consumers) {
  const out = {};
  if (!consumers.length) return out;
  const base = Math.floor(nPart / consumers.length), extra = nPart % consumers.length;
  let p = 0;
  consumers.forEach((c, i) => {
    const k = base + (i < extra ? 1 : 0);
    out[c] = Array.from({ length: k }, () => p++);
  });
  return out;
}

/* ---------------- Terraform ---------------- */

// attributi che non si cambiano su una risorsa esistente → distruggi e ricrea
export const FORCE_NEW = { aws_instance: ["ami"], aws_s3_bucket: ["bucket"], aws_db_instance: ["engine"] };

// real/desired: { "aws_instance.web": { ami: "…", … } }
export function plan(real, desired) {
  const ops = [];
  for (const addr of Object.keys(desired)) {
    const want = desired[addr], have = real[addr];
    if (!have) {
      ops.push({ op: "create", addr, diff: Object.entries(want).map(([k, v]) => ({ k, from: null, to: v })) });
      continue;
    }
    const force = FORCE_NEW[addr.split(".")[0]] || [];
    const diff = Object.keys({ ...have, ...want })
      .filter((k) => have[k] !== want[k])
      .map((k) => ({ k, from: have[k] ?? null, to: want[k] ?? null, forces: force.includes(k) }));
    if (diff.length) ops.push({ op: diff.some((d) => d.forces) ? "replace" : "update", addr, diff });
  }
  for (const addr of Object.keys(real)) if (!desired[addr]) ops.push({ op: "delete", addr, diff: [] });
  return ops;
}

// come la riga finale di `terraform plan`: un replace conta come 1 add + 1 destroy
export function planSummary(ops) {
  const n = (o) => ops.filter((x) => x.op === o).length;
  return { add: n("create") + n("replace"), change: n("update"), destroy: n("delete") + n("replace") };
}

/* ---------------- Feature flag ---------------- */

export const bucket = (userId, flagKey) => hash(`${flagKey}:${userId}`) % 100;

// flag: { key, on, staffDomain|null, countries:[], rollout:0..100 }
export function evaluate(flag, user) {
  if (!flag.on) return { on: false, why: T("kill switch: spento per tutti", "kill switch: off for everyone") };
  if (flag.staffDomain && user.email.endsWith("@" + flag.staffDomain)) return { on: true, why: T("regola: dipendente", "rule: employee") };
  if (flag.countries.length && !flag.countries.includes(user.country)) return { on: false, why: T(`paese ${user.country} escluso`, `country ${user.country} excluded`) };
  const b = bucket(user.id, flag.key);
  return b < flag.rollout ? { on: true, why: `bucket ${b} < ${flag.rollout}` } : { on: false, why: `bucket ${b} ≥ ${flag.rollout}` };
}

/* ---------------- Kubernetes ---------------- */

/* Un giro del controller di un Deployment: porta i pod verso {replicas, version}.
   Rolling update con maxSurge 1 / maxUnavailable 0: prima crea un pod nuovo,
   poi toglie un vecchio. ponytail: pod «ready» appena creati, e un nodo giù perde
   i pod all'istante — nella realtà ci sono probe e ~5 min di timeout. */
export function reconcile({ nodes, pods, replicas, version, nextId }) {
  const log = [];
  const up = nodes.filter((n) => n.up).map((n) => n.name);
  let live = pods.filter((p) => {
    if (up.includes(p.node)) return true;
    log.push(T(`${p.id} perso: il nodo ${p.node} non risponde`, `${p.id} lost: node ${p.node} is not responding`));
    return false;
  });
  let id = nextId;
  if (!up.length) {
    if (replicas) log.push(T("nessun nodo disponibile: i pod restano Pending", "no node available: the pods stay Pending"));
    return { pods: live, log, nextId: id, converged: false };
  }
  const place = () => {
    const load = Object.fromEntries(up.map((n) => [n, 0]));
    live.forEach((p) => load[p.node]++);
    return up.reduce((a, b) => (load[b] < load[a] ? b : a));
  };
  const create = (why) => {
    const p = { id: `app-${id++}`, node: place(), version };
    live = [...live, p];
    log.push(T(`crea ${p.id} (v${version}) su ${p.node} — ${why}`, `create ${p.id} (v${version}) on ${p.node} — ${why}`));
  };
  const old = live.filter((p) => p.version !== version);
  const cur = live.filter((p) => p.version === version);
  if (old.length) {
    if (live.length < replicas + 1 && cur.length < replicas) create(T("rolling: prima il nuovo (maxSurge 1)", "rolling: the new one first (maxSurge 1)"));
    else {
      live = live.filter((p) => p !== old[0]);
      log.push(T(`rimuove ${old[0].id} (v${old[0].version}) — rolling: il nuovo è pronto`, `remove ${old[0].id} (v${old[0].version}) — rolling: the new one is ready`));
    }
  } else if (cur.length < replicas) {
    const missing = replicas - cur.length;
    for (let i = 0; i < missing; i++) create(T(`ne voglio ${replicas}, ne vedo ${cur.length}`, `want ${replicas}, see ${cur.length}`));
  } else if (cur.length > replicas) {
    const extra = cur.slice(replicas);
    live = live.filter((p) => !extra.includes(p));
    extra.forEach((p) => log.push(T(`rimuove ${p.id} — scale down a ${replicas}`, `remove ${p.id} — scale down to ${replicas}`)));
  }
  const now = live.filter((p) => p.version === version).length;
  return { pods: live, log, nextId: id, converged: now === replicas && live.length === replicas };
}

/* ---------------- Data modelling ---------------- */

// chiavi il cui fatto dipendente ha più di un valore: il DB ha due verità
export function inconsistencies(rows, key, cols) {
  const seen = {};
  for (const r of rows) for (const c of cols) ((seen[r[key]] ??= {})[c] ??= new Set()).add(r[c]);
  return Object.entries(seen).filter(([, m]) => Object.values(m).some((s) => s.size > 1)).map(([k]) => k);
}

// changes: [{ from: "2024-01-01", citta }] in ordine. Tipo 1 sovrascrive, tipo 2 versiona.
export function scdRows(changes, type) {
  if (type === 1) return [{ ...changes[changes.length - 1], from: changes[0].from, to: null, current: true }];
  return changes.map((c, i) => ({ ...c, to: changes[i + 1]?.from ?? null, current: i === changes.length - 1 }));
}

// ogni vendita si aggancia alla versione della dimensione valida in quella data
export function salesByCity(facts, rows) {
  const out = {};
  for (const f of facts) {
    const r = rows.find((x) => x.from <= f.date && (x.to == null || f.date < x.to)) ?? rows[rows.length - 1];
    out[r.citta] = (out[r.citta] || 0) + f.importo;
  }
  return out;
}

// event sourcing: lo stato non si salva, si ricava rigiocando gli eventi
export function fold(events) {
  return events.reduce((s, e) => {
    if (e.t === "ContoAperto") return { aperto: true, saldo: 0, movimenti: 0 };
    if (e.t === "Depositato") return { ...s, saldo: s.saldo + e.n, movimenti: s.movimenti + 1 };
    if (e.t === "Prelevato") return { ...s, saldo: s.saldo - e.n, movimenti: s.movimenti + 1 };
    return s;
  }, { aperto: false, saldo: 0, movimenti: 0 });
}

/* ---------------- Temporal ---------------- */

/* Esegue il codice di un workflow contro la sua event history.
   code: [{ k, kind: "activity" | "signal" }]   history: [{ k, kind }]
   Passi già in history → replay (non rieseguiti). Passo in history diverso dal
   codice → NonDeterminismError. crashAt: il worker muore quando la history ha
   quella lunghezza. */
export function runWorkflow(code, history, { crashAt = null, signals = [] } = {}) {
  const log = [];
  const h = [...history];
  for (let i = 0; i < code.length; i++) {
    const s = code[i];
    if (i < history.length) {
      if (history[i].k !== s.k) {
        log.push({ t: "err", m: T(`NonDeterminismError: al passo ${i + 1} la history dice «${history[i].k}», il codice ora chiede «${s.k}»`, `NonDeterminismError: at step ${i + 1} the history says “${history[i].k}”, the code now asks for “${s.k}”`) });
        return { log, history: h, status: "error" };
      }
      log.push({ t: "replay", m: T(`${s.k}: già nella history → risultato riletto, NON rieseguito`, `${s.k}: already in the history → result replayed, NOT re-run`) });
      continue;
    }
    if (crashAt != null && h.length === crashAt) {
      log.push({ t: "crash", m: T("💥 il worker muore qui", "💥 the worker dies here") });
      return { log, history: h, status: "crashed" };
    }
    if (s.kind === "signal") {
      if (!signals.includes(s.k)) {
        log.push({ t: "wait", m: T(`in attesa del signal «${s.k}» — il workflow dorme, nessun worker occupato`, `waiting for the “${s.k}” signal — the workflow sleeps, no worker tied up`) });
        return { log, history: h, status: "waiting" };
      }
      h.push({ k: s.k, kind: "signal" });
      log.push({ t: "signal", m: T(`signal «${s.k}» ricevuto → scritto nella history`, `signal “${s.k}” received → written to the history`) });
      continue;
    }
    h.push({ k: s.k, kind: "activity" });
    log.push({ t: "run", m: T(`${s.k}: eseguita → ActivityTaskCompleted nella history`, `${s.k}: run → ActivityTaskCompleted in the history`) });
  }
  log.push({ t: "done", m: T("workflow completato", "workflow completed") });
  return { log, history: h, status: "done" };
}

/* ---------------- self-check ---------------- */

function demo() {
  const assert = (c, m) => { if (!c) throw new Error("✗ " + m); };

  // hash / Kafka
  assert(hash("cliente-A") === hash("cliente-A"), "hash stabile");
  assert([0, 1, 2].includes(partitionFor("cliente-A", 3)), "partizione nel range");
  const keys = Array.from({ length: 20 }, (_, i) => `cliente-${i}`);
  assert(keys.some((k) => partitionFor(k, 3) !== partitionFor(k, 4)), "cambiare #partizioni rimescola le chiavi");
  const a4 = assignPartitions(3, ["c1", "c2", "c3", "c4"]);
  assert(a4.c4.length === 0 && a4.c1.length === 1, "4 consumer su 3 partizioni: uno inattivo");
  const a2 = assignPartitions(3, ["c1", "c2"]);
  assert(a2.c1.join() === "0,1" && a2.c2.join() === "2", "range assignor 3/2");
  assert(Object.keys(assignPartitions(3, [])).length === 0, "nessun consumer");

  // Terraform
  const real = { "aws_instance.web": { ami: "u22", instance_type: "t3.small" }, "aws_db_instance.old": { engine: "postgres" } };
  const want = { "aws_instance.web": { ami: "u22", instance_type: "t3.medium" }, "aws_s3_bucket.f": { bucket: "f" } };
  const ops = plan(real, want);
  assert(ops.find((o) => o.addr === "aws_instance.web").op === "update", "instance_type = in-place");
  assert(ops.find((o) => o.addr === "aws_s3_bucket.f").op === "create", "risorsa nuova = create");
  assert(ops.find((o) => o.addr === "aws_db_instance.old").op === "delete", "tolta dal file = delete");
  const rep = plan(real, { ...want, "aws_instance.web": { ami: "u24", instance_type: "t3.small" } });
  assert(rep.find((o) => o.addr === "aws_instance.web").op === "replace", "ami = replace");
  const s = planSummary(rep);
  assert(s.add === 2 && s.destroy === 2 && s.change === 0, "replace = 1 add + 1 destroy");
  assert(plan(real, real).length === 0, "niente da fare");

  // Feature flag: il 30% contiene sempre il 10%
  const flag = { key: "new-checkout", on: true, staffDomain: null, countries: [], rollout: 10 };
  const users = Array.from({ length: 1000 }, (_, i) => ({ id: `u${i}`, email: `u${i}@x.it`, country: "IT" }));
  const on10 = users.filter((u) => evaluate(flag, u).on);
  const on30 = users.filter((u) => evaluate({ ...flag, rollout: 30 }, u).on);
  assert(on10.every((u) => on30.includes(u)), "rollout monotono");
  assert(on10.length > 50 && on10.length < 150, `~10% acceso (${on10.length})`);
  assert(!evaluate({ ...flag, on: false, rollout: 100 }, users[0]).on, "kill switch vince su tutto");
  assert(evaluate({ ...flag, staffDomain: "azienda.it", rollout: 0 }, { id: "x", email: "a@azienda.it", country: "DE" }).on, "dipendente sempre dentro");
  assert(!evaluate({ ...flag, countries: ["IT"], rollout: 100 }, { id: "x", email: "a@b.de", country: "DE" }).on, "paese escluso");

  // Kubernetes: rolling update 1.4 → 1.5 senza scendere sotto 3 pod
  const nodes = [{ name: "node-a", up: true }, { name: "node-b", up: true }, { name: "node-c", up: true }];
  let st = reconcile({ nodes, pods: [], replicas: 3, version: "1.4", nextId: 1 });
  assert(st.pods.length === 3 && st.converged, "da zero a 3 pod");
  assert(new Set(st.pods.map((p) => p.node)).size === 3, "pod distribuiti sui nodi");
  let pods = st.pods, nextId = st.nextId, ticks = 0, converged = false;
  while (!converged && ticks < 20) {
    st = reconcile({ nodes, pods, replicas: 3, version: "1.5", nextId });
    ({ pods, nextId, converged } = st);
    assert(pods.length >= 3 && pods.length <= 4, `maxUnavailable 0 / maxSurge 1 (tick ${ticks}: ${pods.length})`);
    ticks++;
  }
  assert(converged && pods.every((p) => p.version === "1.5"), "rollout completato");
  const down = nodes.map((n) => (n.name === "node-a" ? { ...n, up: false } : n));
  st = reconcile({ nodes: down, pods, replicas: 3, version: "1.5", nextId });
  assert(st.pods.length === 3 && st.pods.every((p) => p.node !== "node-a"), "nodo giù → pod ricreati altrove");
  assert(!reconcile({ nodes: nodes.map((n) => ({ ...n, up: false })), pods: [], replicas: 2, version: "1", nextId: 1 }).converged, "senza nodi: Pending");
  st = reconcile({ nodes, pods: st.pods, replicas: 1, version: "1.5", nextId: st.nextId });
  assert(st.pods.length === 1 && st.converged, "scale down");

  // Data modelling
  const rows = [
    { id: 1, cliente: "c1", email: "anna@a.it" },
    { id: 2, cliente: "c1", email: "anna@b.it" },
    { id: 3, cliente: "c2", email: "bruno@a.it" },
  ];
  assert(inconsistencies(rows, "cliente", ["email"]).join() === "c1", "anomalia di aggiornamento");
  const changes = [{ from: "2024-01-01", citta: "Milano" }, { from: "2026-03-01", citta: "Berlino" }];
  const facts = [{ date: "2025-06-10", importo: 80 }, { date: "2025-11-02", importo: 120 }, { date: "2026-05-20", importo: 200 }];
  const t1 = salesByCity(facts, scdRows(changes, 1));
  assert(t1.Berlino === 400 && !t1.Milano, "SCD1 riscrive il passato");
  const r2 = scdRows(changes, 2);
  assert(r2[0].to === "2026-03-01" && r2[1].current && !r2[0].current, "SCD2 versioni");
  const t2 = salesByCity(facts, r2);
  assert(t2.Milano === 200 && t2.Berlino === 200, "SCD2 conserva la storia");
  const ev = [{ t: "ContoAperto" }, { t: "Depositato", n: 500 }, { t: "Prelevato", n: 120 }];
  assert(fold(ev).saldo === 380 && fold(ev.slice(0, 2)).saldo === 500, "fold");

  // Temporal
  const code = [{ k: "addebita", kind: "activity" }, { k: "prenota", kind: "activity" }, { k: "ok", kind: "signal" }, { k: "spedisci", kind: "activity" }];
  let r = runWorkflow(code, [], { crashAt: 2 });
  assert(r.status === "crashed" && r.history.length === 2, "crash dopo 2 passi");
  r = runWorkflow(code, r.history);
  assert(r.status === "waiting" && r.log.filter((l) => l.t === "replay").length === 2, "replay dei 2 passi, poi attesa");
  assert(!r.log.some((l) => l.t === "run" && l.m.startsWith("addebita")), "addebita NON rieseguita");
  r = runWorkflow(code, r.history, { signals: ["ok"] });
  assert(r.status === "done" && r.history.length === 4, "signal → completato");
  const nuovo = [{ k: "antifrode", kind: "activity" }, ...code];
  assert(runWorkflow(nuovo, r.history).status === "error", "codice cambiato → NonDeterminismError");

  console.log("backend-avanzato-core: tutti i check passati");
}

if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("backend-avanzato-core.js")) demo();
