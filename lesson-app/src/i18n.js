/* =====================================================================
   LANGUAGE (it / en)
   LANG is a module-level global read by T() during render. The app shell
   calls setLang() at the top of its own render: React renders the tree
   synchronously top-down, so every child below reads the fresh value.
   That keeps the modules free of context plumbing and prop drilling.
   Lives in its own file so Lesson.jsx and backend-avanzato.jsx share it
   without a circular import.
   ponytail: render-time global — if two languages ever need to render
   side by side, promote it to a React context.
   ===================================================================== */

let LANG = "it";
export const setLang = (l) => { LANG = l; };

/** T("italiano", "english") — returns the string/JSX for the active language. */
export const T = (it, en) => (LANG === "en" && en !== undefined ? en : it);

/* Module-level data arrays are built at import time, when LANG is still the
   default — so any T() inside them would freeze on Italian. Wrap them in
   memoByLang and call the result at render time: FOO() instead of FOO.
   Built once per language, then cached. */
export const memoByLang = (build) => {
  const cache = {};
  return () => (cache[LANG] ??= build());
};
