// Post-process (come skin.mjs/buildmode.mjs): nasconde il chrome generico di
// archify (toolbar dark/present/export, titolo/sottotitolo, barra path/map/
// lens/zoom, footer "Built with Archify...") nei case-*/seq-* che viviamo
// incorporati nel modulo — restano solo canvas, Guidami (guided-views),
// legenda (dentro l'SVG) e le card "Compromessi chiave". Idempotente.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/diagrams");

const CSS = `
  <style id="lesson-embed-style">
    .toolbar, .header, .diagram-nav, .footer { display: none !important; }
    .container { padding-top: 0.75rem !important; }
  </style>`;

let n = 0;
for (const f of fs.readdirSync(dir).filter((f) => (f.startsWith("case-") || f.startsWith("seq-")) && f.endsWith(".html"))) {
  const p = path.join(dir, f);
  let h = fs.readFileSync(p, "utf8");
  if (!h.includes('id="lesson-embed-style"')) {
    h = h.replace("</head>", `${CSS}\n</head>`);
    fs.writeFileSync(p, h);
    n++;
  }
}
console.log("chrome archify nascosto in", n, "file");
