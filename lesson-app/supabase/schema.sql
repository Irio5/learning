create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  module_id text,
  module_label text,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now()
);

alter table chat_messages enable row level security;
-- Nessuna policy pubblica: solo la service_role key (usata da /api/chat) scrive/legge,
-- e la service_role bypassa comunque RLS. Se in futuro serve un pannello di lettura
-- lato client, aggiungere una policy select dedicata invece di esporre la service key.
