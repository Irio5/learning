# Backend Basics — Interactive Lesson

Interactive lesson (Italian) covering backend fundamentals: HTTP, JSON, REST, SQL/databases,
hosting, auth, caching, logging, LLM APIs, system design, data structures, LeetCode-style
patterns, code review, and product management. Built as a single React component with
118 modules across 14 sections, per-module quizzes, a searchable glossary, and animated
architecture/sequence diagrams (Hello Interview / ByteByteGo style).

## Run it locally

```bash
cd lesson-app
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
```

Stack: Vite + React 18 + Tailwind v3 + lucide-react.

There's also a standalone single-file copy at the repo root
(`lezione-basi-backend (1).jsx`) that can be pasted directly into a
Claude.ai artifact — no build step needed, though it renders with the
default Tailwind palette (the full "Iris on Ink" design system only
applies inside `lesson-app/`).

A separate flashcard deck (`flashcards-lezione.html`) covers the same
material in spaced-repetition flashcard form — open it directly in a browser.

## Optional: AI assistant sidebar

`lesson-app/` includes an optional collapsible sidebar chat (`AiAssistant`
component) that lets you ask an LLM about the module you're currently
studying, with every Q&A logged to Supabase. It's disabled by default
until configured:

1. Copy `.env.example` to `.env` and fill in:
   - `GROQ_API_KEY` / `GROQ_MODEL` — free-tier LLM via [Groq](https://console.groq.com/keys)
     (OpenAI-compatible endpoint, default model `llama-3.3-70b-versatile`).
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — from your own Supabase project
     (Project Settings → API). Use the `service_role` key, never the `anon` key.
2. Run `supabase/schema.sql` against your Supabase project (SQL editor) to create
   the `chat_messages` table (RLS on, no public policies — only the service role
   can read/write).
3. `api/chat.js` is a Vercel serverless function. It works out of the box with
   `vercel dev`, or deploy with `vercel deploy`. Plain `npm run dev` (Vite only)
   won't serve `/api/chat` — that's expected, not a bug.

Without these env vars the rest of the lesson works fine; the assistant tab
just won't get responses.

## Project structure

- `lesson-app/src/Lesson.jsx` — source of truth, the whole app in one component
  (shared UI primitives → shared data → a small in-browser SQL engine → the
  118 lesson modules → app shell/navigation).
- `lesson-app/diagrams-src/` — source data + build scripts for the animated
  architecture/sequence diagrams (built with the [archify](https://github.com/pbakaus/archify)
  skill/CLI conventions).
- `lesson-app/api/chat.js` — optional AI assistant backend (Vercel function).
- `lesson-app/supabase/schema.sql` — schema for the optional chat log table.
- `lezione-basi-backend (1).jsx` — standalone copy for pasting into a Claude
  artifact (keep it in sync manually if you edit `Lesson.jsx`).
- `flashcards-lezione.html` — standalone flashcard deck, no build step.

## Constraints this codebase follows (worth keeping if you extend it)

- Single React component, no required props, no `localStorage`/`sessionStorage`
  (all state resets on reload — it's meant to also work as a Claude artifact).
- Tailwind: only predefined classes, no arbitrary values (`w-[123px]` etc.).
  Palette is remapped in `tailwind.config.js` (`zinc`→ink, `indigo`→iris);
  `emerald`/`blue`/`amber`/`red` stay as semantic colors for diagrams/status.
- The in-browser SQL engine (`runSQL`) is a regex-based parser, not a real SQL
  parser — "good enough" for teaching, with documented limits (no JOIN, no
  parenthesized WHERE/HAVING, no subqueries) noted at the top of that section
  in `Lesson.jsx`.
- Adding a module: write a new component function, add an entry to `MODULES`
  (id/label/section/icon/component), optionally add quiz questions to
  `QUIZZES` and terms to `GLOSSARY`.

## License

Do whatever you want with it — use it, fork it, rip out the parts you need.
