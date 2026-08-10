// Post-process: sostituisce la griglia blueprint con lo sfondo della piattaforma
// (ink-950 + aure iris) e imposta lang=it. Idempotente.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/diagrams");
const SKIN = `
  <style id="platform-skin">
    /* integra i diagrammi nella piattaforma: niente griglia, sfondo app */
    html[data-preset="blueprint"] body, html body {
      background-color: oklch(0.14 0.018 280) !important;
      background-image:
        radial-gradient(60rem 40rem at 85% -10%, oklch(0.63 0.2 285 / 0.10), transparent 60%),
        radial-gradient(50rem 40rem at 0% 8%, oklch(0.60 0.16 250 / 0.07), transparent 55%) !important;
      background-size: auto !important;
      background-position: 0 0 !important;
      background-attachment: fixed !important;
    }
    html[data-theme="light"] body {
      background-color: oklch(0.97 0.006 280) !important;
    }
  </style>`;

let n = 0;
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".html"))) {
  const p = path.join(dir, f);
  let h = fs.readFileSync(p, "utf8");
  h = h.replace(/<html lang="[^"]*"/, '<html lang="it"');
  if (!h.includes('id="platform-skin"')) h = h.replace("</head>", `${SKIN}\n</head>`);
  fs.writeFileSync(p, h);
  n++;
}
console.log("skinned", n, "file");
