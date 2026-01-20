create extension if not exists "pgcrypto";

create type public.user_role as enum ('user', 'admin');
create type public.quiz_status as enum ('draft', 'pending', 'approved', 'rejected');
create type public.question_type as enum ('single_choice', 'multi_choice');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  username text unique not null,
  password_hash text not null,
  display_name text,
  avatar_url text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_bucket text not null default 'quiz-media',
  storage_path text not null,
  url text,
  mime_type text not null,
  width int,
  height int,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category_id uuid not null references public.categories(id),
  status public.quiz_status not null default 'draft',
  created_by uuid not null references public.users(id),
  updated_by uuid references public.users(id),
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rejection_reason_required check (
    status <> 'rejected' or rejection_reason is not null
  )
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  prompt text not null,
  question_type public.question_type not null default 'single_choice',
  media_id uuid references public.media_assets(id),
  order_index int not null,
  base_points int not null default 100,
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  label text not null,
  is_correct boolean not null default false,
  order_index int not null
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id),
  user_id uuid not null references public.users(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  total_score int not null default 0,
  time_bonus int not null default 0
);

create table public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  is_correct boolean not null default false,
  response_time_ms int not null default 0,
  score_awarded int not null default 0,
  time_bonus int not null default 0,
  created_at timestamptz not null default now()
);

create table public.question_attempt_options (
  question_attempt_id uuid not null references public.question_attempts(id) on delete cascade,
  option_id uuid not null references public.question_options(id),
  primary key (question_attempt_id, option_id)
);

create table public.leaderboard_entries (
  user_id uuid primary key references public.users(id) on delete cascade,
  total_score int not null default 0,
  updated_at timestamptz not null default now()
);

create index quizzes_status_category_idx on public.quizzes (status, category_id);
create index questions_quiz_order_idx on public.questions (quiz_id, order_index);
create index options_question_order_idx on public.question_options (question_id, order_index);
create index quiz_attempts_user_quiz_idx on public.quiz_attempts (user_id, quiz_id);
create index question_attempts_attempt_idx on public.question_attempts (attempt_id);
create index leaderboard_total_score_idx on public.leaderboard_entries (total_score desc);

create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger set_quizzes_updated_at
before update on public.quizzes
for each row execute function public.set_updated_at();

create trigger set_questions_updated_at
before update on public.questions
for each row execute function public.set_updated_at();

create trigger set_leaderboard_updated_at
before update on public.leaderboard_entries
for each row execute function public.set_updated_at();
