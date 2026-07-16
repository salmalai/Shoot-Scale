-- Shoot & Scale — initial schema
-- Idempotent: safe to run more than once against the same project.

do $$ begin
  create type member_role as enum ('admin', 'team');
exception when duplicate_object then null; end $$;

do $$ begin
  create type member_status as enum ('active', 'paused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type doc_type as enum ('snapshot', 'bullseye', 'content_analysis');
exception when duplicate_object then null; end $$;

do $$ begin
  create type format_category as enum ('games_challenges', 'educational', 'skits');
exception when duplicate_object then null; end $$;

do $$ begin
  create type chat_role as enum ('user', 'assistant', 'tool');
exception when duplicate_object then null; end $$;

create table if not exists team_members (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role member_role not null default 'team',
  status member_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sandcastles_workspace_name text,
  sandcastles_workspace_uuid text,
  primary_channel_platform text,
  primary_channel_uuid text,
  secondary_channel_platform text,
  secondary_channel_uuid text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists client_assignments (
  team_member_id uuid not null references team_members(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (team_member_id, client_id)
);

create table if not exists client_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  doc_type doc_type not null,
  content text not null,
  version int not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references team_members(id),
  unique (client_id, doc_type)
);

create table if not exists client_document_revisions (
  id uuid primary key default gen_random_uuid(),
  client_document_id uuid not null references client_documents(id) on delete cascade,
  content text not null,
  version int not null,
  created_at timestamptz not null default now(),
  created_by uuid references team_members(id)
);

create table if not exists format_bank (
  id uuid primary key default gen_random_uuid(),
  number int not null unique,
  slug text not null unique,
  name text not null,
  category format_category not null,
  beats text,
  origin text,
  vetted_by text,
  vetted_at date,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists format_bank_meta (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create table if not exists sandcastles_exports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  storage_path text not null,
  video_count int,
  uploaded_by uuid references team_members(id),
  uploaded_at timestamptz not null default now()
);

create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  team_member_id uuid not null references team_members(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role chat_role not null,
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists script_docs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  drive_url text,
  drive_file_id text,
  filename text not null,
  metadata jsonb not null default '{}',
  chat_session_id uuid references chat_sessions(id),
  created_by uuid references team_members(id),
  created_at timestamptz not null default now()
);

create index if not exists client_documents_client_id_idx on client_documents(client_id);
create index if not exists client_assignments_team_member_id_idx on client_assignments(team_member_id);
create index if not exists client_assignments_client_id_idx on client_assignments(client_id);
create index if not exists chat_sessions_client_id_idx on chat_sessions(client_id);
create index if not exists chat_sessions_team_member_id_idx on chat_sessions(team_member_id);
create index if not exists chat_messages_session_id_idx on chat_messages(session_id);
create index if not exists script_docs_client_id_idx on script_docs(client_id);

-- All app access goes through the Next.js server using the service-role key,
-- which bypasses RLS entirely. RLS below is defense-in-depth against any
-- future direct-from-browser access, not the primary authorization boundary.
alter table team_members enable row level security;
alter table clients enable row level security;
alter table client_assignments enable row level security;
alter table client_documents enable row level security;
alter table client_document_revisions enable row level security;
alter table format_bank enable row level security;
alter table format_bank_meta enable row level security;
alter table sandcastles_exports enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
alter table script_docs enable row level security;
-- No policies are created: default-deny for anon/authenticated roles.
-- The service role used by server-side code bypasses RLS by design.
