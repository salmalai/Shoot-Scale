-- Sessions no longer belong to a single client up front — the chat engine resolves
-- (and can create) the client from the message itself, so a session may start with
-- no client attached yet.
alter table chat_sessions alter column client_id drop not null;
