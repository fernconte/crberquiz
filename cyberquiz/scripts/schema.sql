-- CyberShield Neon schema
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  username text not null,
  display_name text,
  role text not null check (role in ('user', 'admin')),
  salt text not null,
  password_hash text not null,
  password_algo text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists users_email_lower_idx on users (lower(email));
create unique index if not exists users_username_lower_idx on users (lower(username));

create table if not exists sessions (
  token_hash char(64) primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null default ''
);

create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category_id text not null references categories(id) on delete restrict,
  created_by uuid not null references users(id) on delete restrict,
  created_at timestamptz not null default now(),
  status text not null check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references users(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  updated_at timestamptz not null default now()
);

create index if not exists quizzes_status_idx on quizzes (status);
create index if not exists quizzes_category_idx on quizzes (category_id);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  prompt text not null,
  position integer not null,
  created_at timestamptz not null default now()
);

create index if not exists questions_quiz_idx on questions (quiz_id);

create table if not exists options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  label text not null,
  is_correct boolean not null default false,
  position integer not null
);

create index if not exists options_question_idx on options (question_id);
create unique index if not exists options_one_correct_idx
  on options (question_id) where is_correct;

create table if not exists question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  quiz_id uuid not null references quizzes(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  selected_option_id uuid not null references options(id) on delete cascade,
  is_correct boolean not null,
  time_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists question_attempts_user_idx on question_attempts (user_id);
create index if not exists question_attempts_quiz_idx on question_attempts (quiz_id);

create table if not exists leaderboard_entries (
  user_id uuid primary key references users(id) on delete cascade,
  score integer not null default 0,
  updated_at timestamptz not null default now()
);
