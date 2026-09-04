-- ============================================================
-- InboxFlow — Supabase Database Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── Tasks ────────────────────────────────────────────────────
create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  task_name   text not null,
  source_email text,
  thread_id   text,
  deadline    timestamptz,
  priority    text default 'MEDIUM' check (priority in ('HIGH','MEDIUM','LOW')),
  status      text default 'pending' check (status in ('pending','in_progress','completed')),
  ai_note     text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists tasks_user_id_idx on tasks(user_id);
create index if not exists tasks_status_idx on tasks(status);

-- ─── Deadlines ────────────────────────────────────────────────
create table if not exists deadlines (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  thread_id    text,
  title        text not null,
  source_email text,
  from_email   text,
  due_date     timestamptz,
  due_label    text,
  priority     text default 'MEDIUM',
  status       text default 'pending',
  created_at   timestamptz default now(),
  unique(user_id, thread_id)
);

create index if not exists deadlines_user_id_idx on deadlines(user_id);
create index if not exists deadlines_due_date_idx on deadlines(due_date);

-- ─── Follow-ups ───────────────────────────────────────────────
create table if not exists followups (
  id                  uuid primary key default gen_random_uuid(),
  user_id             text not null,
  thread_id           text,
  subject             text,
  to_email            text,
  last_message_date   text,
  urgency             text default 'STANDARD' check (urgency in ('URGENT','STANDARD','LOW')),
  suggested_action    text,
  days_pending        int default 0,
  dismissed           boolean default false,
  created_at          timestamptz default now(),
  unique(user_id, thread_id)
);

create index if not exists followups_user_id_idx on followups(user_id);
create index if not exists followups_dismissed_idx on followups(dismissed);

-- ─── Email Analysis Cache ─────────────────────────────────────
create table if not exists email_analysis (
  id            uuid primary key default gen_random_uuid(),
  user_id       text,
  thread_id     text not null,
  priority      text,
  priority_score int,
  intent        text,
  sentiment     text,
  summary       jsonb,
  tasks         jsonb,
  deadline      text,
  deadline_label text,
  category      text,
  created_at    timestamptz default now(),
  unique(thread_id)
);

-- ─── Analytics ────────────────────────────────────────────────
create table if not exists analytics (
  id                  uuid primary key default gen_random_uuid(),
  user_id             text unique not null,
  emails_processed    int default 0,
  tasks_extracted     int default 0,
  replies_generated   int default 0,
  avg_response_time   numeric default 0,
  updated_at          timestamptz default now()
);

-- ─── RPC: Increment analytic counter ─────────────────────────
create or replace function increment_analytic(p_user_id text, p_field text)
returns void language plpgsql as $$
begin
  insert into analytics (user_id, emails_processed, tasks_extracted, replies_generated)
  values (p_user_id, 0, 0, 0)
  on conflict (user_id) do nothing;

  if p_field = 'emails_processed' then
    update analytics set emails_processed = emails_processed + 1, updated_at = now() where user_id = p_user_id;
  elsif p_field = 'tasks_extracted' then
    update analytics set tasks_extracted = tasks_extracted + 1, updated_at = now() where user_id = p_user_id;
  elsif p_field = 'replies_generated' then
    update analytics set replies_generated = replies_generated + 1, updated_at = now() where user_id = p_user_id;
  end if;
end;
$$;

-- ─── Row Level Security (optional, enable if needed) ─────────
-- alter table tasks enable row level security;
-- alter table deadlines enable row level security;
-- alter table followups enable row level security;
-- alter table email_analysis enable row level security;
-- alter table analytics enable row level security;

alter table followups add column if not exists followup_days int;
alter table followups add column if not exists due_date timestamptz;
alter table followups add column if not exists sent_at timestamptz;
alter table followups add column if not exists message_id text;
alter table followups add column if not exists source text default 'ai_detected';
alter table followups add column if not exists status text default 'waiting';

select 'InboxFlow schema created successfully! ✅' as status;

