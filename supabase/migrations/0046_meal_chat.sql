create table meal_chat_drafts (
  id text primary key,
  user_id uuid not null references users (id) on delete cascade,
  meal_id uuid not null,
  date date not null,
  items jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index meal_chat_drafts_user_id_idx on meal_chat_drafts (user_id);
create index meal_chat_drafts_expires_at_idx on meal_chat_drafts (expires_at);

create table meal_chat_undo (
  id text primary key,
  user_id uuid not null references users (id) on delete cascade,
  meal_item_ids uuid[] not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index meal_chat_undo_user_id_idx on meal_chat_undo (user_id);
create index meal_chat_undo_expires_at_idx on meal_chat_undo (expires_at);
