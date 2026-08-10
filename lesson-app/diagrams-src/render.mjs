// Chiama la CLI archify vera per rigenerare gli HTML dei case-*/seq-* (quelli
// legati a ARCH_*/SEQ_* di Lesson.jsx) dentro public/diagrams. Le EXTRA_ARCH
// (new-*, temporal-*) non sono toccate: restano come sono, fuori scope.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
// Path alla CLI archify: sovrascrivibile con ARCHIFY_BIN=... per chi ha
// le skill installate altrove.
const ARCHIFY_BIN =
  process.env.ARCHIFY_BIN ||
  path.join(process.env.HOME || process.env.USERPROFILE || "", ".agents/skills/archify/bin/archify.mjs");
const OUT_DIR = path.resolve(__dir, "../public/diagrams");

const ARCH = ["metodo","stime","dati","async","tinyurl","uber","netflix","ticket","crawler","delivery","chat"];
const SEQ = [...ARCH];

let ok = 0, fail = 0;
for (const n of ARCH) {
  const slug = `case-${n}`;
  const input = path.join(__dir, `${slug}.architecture.json`);
  const output = path.join(OUT_DIR, `${slug}.html`);
  try {
    execFileSync("node", [ARCHIFY_BIN, "render", "architecture", input, output], { stdio: "pipe" });
    ok++;
  } catch (e) {
    fail++;
    console.error(`FAIL ${slug}:`, e.stdout?.toString() || e.message);
  }
}
for (const n of SEQ) {
  const slug = `seq-${n}`;
  const input = path.join(__dir, `${slug}.sequence.json`);
  const output = path.join(OUT_DIR, `${slug}.html`);
  try {
    execFileSync("node", [ARCHIFY_BIN, "render", "sequence", input, output], { stdio: "pipe" });
    ok++;
  } catch (e) {
    fail++;
    console.error(`FAIL ${slug}:`, e.stdout?.toString() || e.message);
  }
}
console.log(`renderizzati ${ok} ok, ${fail} falliti`);
if (fail) process.exit(1);
