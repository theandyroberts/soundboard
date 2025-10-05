-- Enable required extensions
create extension if not exists pgcrypto;

-- supabase/schema.sql
-- Create sections and sounds tables
create table if not exists public.sections (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	color text not null check (color in ('cyan','orange','green','purple')),
	created_at timestamptz not null default now()
);

create table if not exists public.sounds (
	id uuid primary key default gen_random_uuid(),
	section_id uuid not null references public.sections(id) on delete cascade,
	label text not null,
	audio_url text,
	meta jsonb not null default '{}'::jsonb,
	position int not null default 0,
	created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.sections enable row level security;
alter table public.sounds enable row level security;

-- Simple anon policies for demo (adjust for production)
create policy "Sections are readable by anon" on public.sections for select using (true);
create policy "Sounds are readable by anon" on public.sounds for select using (true);
create policy "Sections insert for anon" on public.sections for insert with check (true);
create policy "Sounds insert for anon" on public.sounds for insert with check (true);
create policy "Sections update for anon" on public.sections for update using (true) with check (true);
create policy "Sounds update for anon" on public.sounds for update using (true) with check (true);
create policy "Sections delete for anon" on public.sections for delete using (true);
create policy "Sounds delete for anon" on public.sounds for delete using (true);
