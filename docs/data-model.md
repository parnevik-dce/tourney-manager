# Data Model: Ice Breaker Tournament Manager

Stack: Supabase (Postgres). All tables use `uuid` primary keys via `gen_random_uuid()`. Tables marked **(persistent)** carry forward across tournament years automatically; tables marked **(tournament-specific)** belong to a single `tournaments` row and are created fresh each year.

## Entities

### profiles (persistent)
Mirrors `auth.users`; one row per authenticated user (director or board member).

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK, references `auth.users(id)` |
| email | text | not null |
| full_name | text | |
| role | text | `'director'` \| `'board_member'`; check constraint |
| created_at | timestamptz | default now() |

Relationships: referenced by `tasks.assignee_id`.

---

### associations (persistent)
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | not null |
| notes | text | |
| created_at | timestamptz | default now() |

Relationships: has many `association_contacts`; has many `teams` (via tournament years).

---

### association_contacts (persistent)
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| association_id | uuid | FK → associations, not null |
| name | text | not null |
| email | text | |
| phone | text | |
| title | text | e.g. "President", "Registrar" |
| created_at | timestamptz | default now() |

Relationships: belongs to `associations`.

---

### vendors (persistent)
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | not null |
| type | text | e.g. `'emt'`, `'toilets'`, `'food_truck'`, `'merch'`, `'referees'`, `'golf_carts'`, `'other'` |
| notes | text | |
| created_at | timestamptz | default now() |

Relationships: has many `vendor_contacts`; has many `vendor_tournament_status` rows (one per year it's engaged).

---

### vendor_contacts (persistent)
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| vendor_id | uuid | FK → vendors, not null |
| name | text | not null |
| email | text | |
| phone | text | |
| created_at | timestamptz | default now() |

Relationships: belongs to `vendors`.

---

### task_templates (persistent)
Baseline project plan; copied into `tasks` when a new tournament is created.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| title | text | not null |
| phase | text | e.g. `'pre_season'`, `'60_days_out'`, `'30_days_out'`, `'tournament_week'` |
| sort_order | int | default 0 |
| created_at | timestamptz | default now() |

Relationships: none (source data only, copied by app logic, not FK'd).

---

### tournaments (tournament-specific — the parent record)
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| year | int | not null, unique |
| name | text | e.g. "2026 Ice Breaker" |
| status | text | `'active'` \| `'closed'` \| `'archived'`; default `'active'` |
| public_slug | text | unique, e.g. `'2026'` — used in public site URL |
| start_date | date | |
| end_date | date | |
| location | text | |
| created_at | timestamptz | default now() |

Relationships: parent of every table below.

---

### divisions (tournament-specific)
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tournament_id | uuid | FK → tournaments, not null |
| name | text | e.g. "8U" |
| skill_split | boolean | default false |
| fee_amount | numeric(10,2) | |
| sort_order | int | default 0 |

Relationships: belongs to `tournaments`; referenced by `teams.division_id`; joined to `fields` via `field_divisions`.

---

### fields (tournament-specific)
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tournament_id | uuid | FK → tournaments, not null |
| name | text | e.g. "Field 1 (Main)" |
| notes | text | |
| sort_order | int | default 0 |

Relationships: belongs to `tournaments`; joined to `divisions` via `field_divisions`.

---

### field_divisions (tournament-specific, join table)
| Field | Type | Notes |
|---|---|---|
| field_id | uuid | FK → fields, not null |
| division_id | uuid | FK → divisions, not null |

Relationships: composite PK `(field_id, division_id)`.

---

### teams (tournament-specific)
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tournament_id | uuid | FK → tournaments, not null |
| association_id | uuid | FK → associations, not null |
| division_id | uuid | FK → divisions |
| name | text | not null, e.g. "Lakeshore 10U Black" |
| registration_status | text | `'pending'` \| `'registered'`; default `'pending'` |
| fee_amount | numeric(10,2) | |
| fee_collected | numeric(10,2) | default 0 |
| no_fees_host | boolean | default false |
| roster_uploaded_at | timestamptz | null until Paul uploads |
| roster_file_url | text | Supabase Storage path |
| created_at | timestamptz | default now() |

Relationships: belongs to `associations` and `tournaments`; belongs to `divisions`; has many `team_contacts`, `players`.

---

### team_contacts (tournament-specific)
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| team_id | uuid | FK → teams, not null |
| name | text | not null |
| email | text | |
| phone | text | |
| role | text | e.g. "Manager", "Coach" |
| created_at | timestamptz | default now() |

Relationships: belongs to `teams`.

---

### players (tournament-specific)
Roster entries; one row per player, extracted/entered from the uploaded roster so waiver status can be tracked per player.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| team_id | uuid | FK → teams, not null |
| full_name | text | not null |
| created_at | timestamptz | default now() |

Relationships: belongs to `teams`; has one `waivers` row (once submitted).

---

### waivers (tournament-specific)
Not publicly readable — insert-only from the public form, read restricted to director/board via RLS.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tournament_id | uuid | FK → tournaments, not null (denormalized for RLS/filtering) |
| player_id | uuid | FK → players, not null, unique |
| signer_name | text | not null |
| signer_email | text | |
| signer_relationship | text | e.g. "Parent/Guardian" |
| submitted_at | timestamptz | default now() |

Relationships: belongs to `players` (1:1); belongs to `tournaments`.

---

### vendor_tournament_status (tournament-specific)
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tournament_id | uuid | FK → tournaments, not null |
| vendor_id | uuid | FK → vendors, not null |
| status | text | `'not_confirmed'` \| `'pending'` \| `'committed'`; default `'not_confirmed'` |
| notes | text | |
| updated_at | timestamptz | default now() |

Relationships: unique on `(tournament_id, vendor_id)`; belongs to `tournaments` and `vendors`.

---

### tasks (tournament-specific)
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tournament_id | uuid | FK → tournaments, not null |
| title | text | not null |
| phase | text | e.g. `'pre_season'`, `'60_days_out'`, `'30_days_out'`, `'tournament_week'` |
| status | text | `'todo'` \| `'in_progress'` \| `'done'`; default `'todo'` |
| assignee_id | uuid | FK → profiles, nullable |
| due_date | date | |
| sort_order | int | default 0 |
| created_at | timestamptz | default now() |

Relationships: belongs to `tournaments`; belongs to `profiles` (assignee).

---

### budget_items (tournament-specific)
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tournament_id | uuid | FK → tournaments, not null |
| category | text | e.g. "Fields & Facilities" |
| line_item | text | e.g. "Fairgrounds field rental (2 days)" |
| payee | text | |
| vendor_id | uuid | FK → vendors, nullable |
| forecasted_amount | numeric(10,2) | default 0 |
| actual_amount | numeric(10,2) | |
| due_date | date | |
| created_at | timestamptz | default now() |

Relationships: belongs to `tournaments`; optionally belongs to `vendors`.

---

### site_settings (tournament-specific, 1 row per tournament)
| Field | Type | Notes |
|---|---|---|
| tournament_id | uuid | PK, FK → tournaments |
| published | boolean | default false — draft/publish workflow |
| maintenance_mode | boolean | default false |
| hero_title | text | |
| hero_subtitle | text | |
| updated_at | timestamptz | default now() |

Relationships: belongs to `tournaments` (1:1).

---

### site_updates (tournament-specific)
General tournament announcements shown on the public site.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tournament_id | uuid | FK → tournaments, not null |
| title | text | not null |
| body | text | |
| status | text | `'draft'` \| `'published'`; default `'draft'` |
| published_at | timestamptz | |
| created_at | timestamptz | default now() |

Relationships: belongs to `tournaments`.

---

## SQL (Supabase SQL editor)

```sql
-- Persistent tables

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'board_member' check (role in ('director', 'board_member')),
  created_at timestamptz default now()
);

create table associations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text,
  created_at timestamptz default now()
);

create table association_contacts (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references associations(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  title text,
  created_at timestamptz default now()
);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('emt', 'toilets', 'food_truck', 'merch', 'referees', 'golf_carts', 'other')),
  notes text,
  created_at timestamptz default now()
);

create table vendor_contacts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  created_at timestamptz default now()
);

create table task_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  phase text not null check (phase in ('pre_season', '60_days_out', '30_days_out', 'tournament_week')),
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Tournament parent table

create table tournaments (
  id uuid primary key default gen_random_uuid(),
  year int not null unique,
  name text not null,
  status text not null default 'active' check (status in ('active', 'closed', 'archived')),
  public_slug text not null unique,
  start_date date,
  end_date date,
  location text,
  created_at timestamptz default now()
);

-- Tournament-specific tables

create table divisions (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name text not null,
  skill_split boolean default false,
  fee_amount numeric(10,2),
  sort_order int default 0
);

create table fields (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name text not null,
  notes text,
  sort_order int default 0
);

create table field_divisions (
  field_id uuid not null references fields(id) on delete cascade,
  division_id uuid not null references divisions(id) on delete cascade,
  primary key (field_id, division_id)
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  association_id uuid not null references associations(id) on delete restrict,
  division_id uuid references divisions(id),
  name text not null,
  registration_status text not null default 'pending' check (registration_status in ('pending', 'registered')),
  fee_amount numeric(10,2),
  fee_collected numeric(10,2) default 0,
  no_fees_host boolean default false,
  roster_uploaded_at timestamptz,
  roster_file_url text,
  created_at timestamptz default now()
);

create table team_contacts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  role text,
  created_at timestamptz default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  full_name text not null,
  created_at timestamptz default now()
);

create table waivers (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  player_id uuid not null unique references players(id) on delete cascade,
  signer_name text not null,
  signer_email text,
  signer_relationship text,
  submitted_at timestamptz default now()
);

create table vendor_tournament_status (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  status text not null default 'not_confirmed' check (status in ('not_confirmed', 'pending', 'committed')),
  notes text,
  updated_at timestamptz default now(),
  unique (tournament_id, vendor_id)
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  title text not null,
  phase text not null check (phase in ('pre_season', '60_days_out', '30_days_out', 'tournament_week')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  assignee_id uuid references profiles(id),
  due_date date,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table budget_items (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  category text not null,
  line_item text,
  payee text,
  vendor_id uuid references vendors(id),
  forecasted_amount numeric(10,2) default 0,
  actual_amount numeric(10,2),
  due_date date,
  created_at timestamptz default now()
);

create table site_settings (
  tournament_id uuid primary key references tournaments(id) on delete cascade,
  published boolean default false,
  maintenance_mode boolean default false,
  hero_title text,
  hero_subtitle text,
  updated_at timestamptz default now()
);

create table site_updates (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  title text not null,
  body text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz default now()
);
```

## Row Level Security

RLS is enabled on every table below. Default shape: `director` gets full read/write, `board_member` gets read-only (except `tasks.status` on their own assigned rows), `waivers` accepts public inserts but no public reads, and `site_settings`/`site_updates` allow public reads only when published. The public "team registration counts" view for the public homepage is deferred to the Public-Facing Site issue (#10), since it needs a curated view rather than direct table access to avoid leaking fee/contact data.

```sql
-- Auto-create a profile row on first login (Google OAuth via Supabase Auth).
-- Without this, is_director() below has nothing to check and every write policy
-- fails closed for everyone, including the director.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used by every "director can manage X" policy below.
create or replace function is_director()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'director'
  );
$$;

-- Enable RLS on every table.
alter table profiles enable row level security;
alter table associations enable row level security;
alter table association_contacts enable row level security;
alter table vendors enable row level security;
alter table vendor_contacts enable row level security;
alter table task_templates enable row level security;
alter table tournaments enable row level security;
alter table divisions enable row level security;
alter table fields enable row level security;
alter table field_divisions enable row level security;
alter table teams enable row level security;
alter table team_contacts enable row level security;
alter table players enable row level security;
alter table waivers enable row level security;
alter table vendor_tournament_status enable row level security;
alter table tasks enable row level security;
alter table budget_items enable row level security;
alter table site_settings enable row level security;
alter table site_updates enable row level security;

-- profiles
create policy "authenticated can view profiles" on profiles
  for select to authenticated using (true);
create policy "users can update own profile" on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "director can manage profiles" on profiles
  for all to authenticated using (is_director()) with check (is_director());

-- Straightforward "authenticated read, director write" tables.
create policy "authenticated can view associations" on associations for select to authenticated using (true);
create policy "director can manage associations" on associations for all to authenticated using (is_director()) with check (is_director());

create policy "authenticated can view association_contacts" on association_contacts for select to authenticated using (true);
create policy "director can manage association_contacts" on association_contacts for all to authenticated using (is_director()) with check (is_director());

create policy "authenticated can view vendors" on vendors for select to authenticated using (true);
create policy "director can manage vendors" on vendors for all to authenticated using (is_director()) with check (is_director());

create policy "authenticated can view vendor_contacts" on vendor_contacts for select to authenticated using (true);
create policy "director can manage vendor_contacts" on vendor_contacts for all to authenticated using (is_director()) with check (is_director());

create policy "authenticated can view task_templates" on task_templates for select to authenticated using (true);
create policy "director can manage task_templates" on task_templates for all to authenticated using (is_director()) with check (is_director());

create policy "authenticated can view tournaments" on tournaments for select to authenticated using (true);
create policy "director can manage tournaments" on tournaments for all to authenticated using (is_director()) with check (is_director());

create policy "authenticated can view divisions" on divisions for select to authenticated using (true);
create policy "director can manage divisions" on divisions for all to authenticated using (is_director()) with check (is_director());

create policy "authenticated can view fields" on fields for select to authenticated using (true);
create policy "director can manage fields" on fields for all to authenticated using (is_director()) with check (is_director());

create policy "authenticated can view field_divisions" on field_divisions for select to authenticated using (true);
create policy "director can manage field_divisions" on field_divisions for all to authenticated using (is_director()) with check (is_director());

create policy "authenticated can view teams" on teams for select to authenticated using (true);
create policy "director can manage teams" on teams for all to authenticated using (is_director()) with check (is_director());

create policy "authenticated can view team_contacts" on team_contacts for select to authenticated using (true);
create policy "director can manage team_contacts" on team_contacts for all to authenticated using (is_director()) with check (is_director());

create policy "authenticated can view players" on players for select to authenticated using (true);
create policy "director can manage players" on players for all to authenticated using (is_director()) with check (is_director());

create policy "authenticated can view vendor_tournament_status" on vendor_tournament_status for select to authenticated using (true);
create policy "director can manage vendor_tournament_status" on vendor_tournament_status for all to authenticated using (is_director()) with check (is_director());

create policy "authenticated can view budget_items" on budget_items for select to authenticated using (true);
create policy "director can manage budget_items" on budget_items for all to authenticated using (is_director()) with check (is_director());

-- tasks: board members may additionally update the status of tasks assigned to them.
create policy "authenticated can view tasks" on tasks for select to authenticated using (true);
create policy "director can manage tasks" on tasks for all to authenticated using (is_director()) with check (is_director());
create policy "assignee can update own task status" on tasks
  for update to authenticated using (assignee_id = auth.uid()) with check (assignee_id = auth.uid());

-- waivers: public insert only, no public read, per BRD 4.9.
create policy "anyone can submit a waiver" on waivers
  for insert to anon, authenticated with check (true);
create policy "authenticated can view waivers" on waivers
  for select to authenticated using (true);
create policy "director can update waivers" on waivers
  for update to authenticated using (is_director()) with check (is_director());
create policy "director can delete waivers" on waivers
  for delete to authenticated using (is_director());

-- site_settings / site_updates: public read only when published; director manages.
create policy "public can view published site settings" on site_settings
  for select to anon, authenticated using (published = true);
create policy "director can manage site_settings" on site_settings
  for all to authenticated using (is_director()) with check (is_director());

create policy "public can view published site updates" on site_updates
  for select to anon, authenticated using (status = 'published');
create policy "director can manage site_updates" on site_updates
  for all to authenticated using (is_director()) with check (is_director());
```

After you've logged into the app once via Google OAuth (Step 7 — not set up yet), run this once to flag your own account as director (everyone else defaults to `board_member`):

```sql
update profiles set role = 'director' where email = 'psarnevik@gmail.com';
```
