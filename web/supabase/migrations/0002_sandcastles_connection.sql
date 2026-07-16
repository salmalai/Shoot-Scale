-- Single-row table holding the org-wide Sandcastles OAuth connection
-- (one Sandcastles account/org for the whole agency, same model as the
-- Google Drive service account — not per-team-member).

create table if not exists sandcastles_connection (
  id boolean primary key default true,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  scope text,
  connected_by uuid references team_members(id),
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sandcastles_connection_singleton check (id)
);

alter table sandcastles_connection enable row level security;
-- No policies: default-deny for anon/authenticated; only the service role
-- (server-side only) reads or writes this table.
