// Post-process (come skin.mjs): inietta in ogni case-*.html un override che
// espone window.__lessonBuild = { start, place(id), stop } — usato dalla tab
// "Ricostruiscilo tu" per nascondere via CSS i nodi/archi non ancora piazzati
// dentro il canvas archify VERO, invece di un SVG nostro separato. Idempotente.
// Solo le architetture (case-*) hanno una modalità "ricostruzione": i sequence
// diagram non la usano.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/diagrams");

const BLOCK = `
  <style id="lesson-buildmode-style">
    svg[data-lesson-build] [data-node-id]:not([data-lesson-placed]) { opacity: 0.05 !important; pointer-events: none !important; transition: opacity .35s ease !important; }
    svg[data-lesson-build] [data-edge-from]:not([data-lesson-edge-on]) { opacity: 0.04 !important; transition: opacity .35s ease !important; }
    svg [data-lesson-current] { filter: drop-shadow(0 0 7px oklch(0.75 0.19 292 / .9)) !important; }
  </style>
  <script id="lesson-buildmode-script">
  (function () {
    function api() {
      var svg = document.querySelector("svg");
      function esc(id) { return (window.CSS && CSS.escape) ? CSS.escape(id) : id.replace(/[^a-zA-Z0-9_-]/g, "\\\\$&"); }
      function nodeEl(id) { return svg.querySelector('[data-node-id="' + esc(id) + '"]'); }
      function edges() { return Array.prototype.slice.call(svg.querySelectorAll("[data-edge-from][data-edge-to]")); }
      function clearCurrent() {
        Array.prototype.forEach.call(svg.querySelectorAll("[data-lesson-current]"), function (n) { n.removeAttribute("data-lesson-current"); });
      }
      function clearAll(attr) {
        Array.prototype.forEach.call(svg.querySelectorAll("[" + attr + "]"), function (n) { n.removeAttribute(attr); });
      }
      return {
        start: function () {
          svg.setAttribute("data-lesson-build", "true");
          clearAll("data-lesson-placed");
          clearAll("data-lesson-edge-on");
          clearCurrent();
        },
        place: function (id) {
          var n = nodeEl(id);
          if (!n) return;
          n.setAttribute("data-lesson-placed", "true");
          clearCurrent();
          n.setAttribute("data-lesson-current", "true");
          edges().forEach(function (e) {
            var f = e.getAttribute("data-edge-from"), t = e.getAttribute("data-edge-to");
            var fEl = nodeEl(f), tEl = nodeEl(t);
            var on = !!(fEl && tEl && fEl.hasAttribute("data-lesson-placed") && tEl.hasAttribute("data-lesson-placed"));
            if (on) e.setAttribute("data-lesson-edge-on", "true"); else e.removeAttribute("data-lesson-edge-on");
          });
        },
        stop: function () {
          svg.removeAttribute("data-lesson-build");
          clearAll("data-lesson-placed");
          clearAll("data-lesson-edge-on");
          clearCurrent();
        },
      };
    }
    window.__lessonBuild = api();
  })();
  </script>`;

let n = 0;
for (const f of fs.readdirSync(dir).filter((f) => f.startsWith("case-") && f.endsWith(".html"))) {
  const p = path.join(dir, f);
  let h = fs.readFileSync(p, "utf8");
  if (!h.includes('id="lesson-buildmode-script"')) {
    h = h.replace("</body>", `${BLOCK}\n</body>`);
    fs.writeFileSync(p, h);
    n++;
  }
}
console.log("buildmode iniettato in", n, "file");
