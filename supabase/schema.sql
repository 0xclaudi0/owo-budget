-- Run this in your Supabase SQL editor to set up the database

create table if not exists weekly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  week_start date not null,
  income_usd numeric(12,2) not null,
  withdrawal_method text not null check (withdrawal_method in ('payoneer_naira','raenest_usd')),
  exchange_rate numeric(12,4) not null,
  gross_ngn numeric(16,2) not null,
  fee_amount_ngn numeric(16,2) not null default 0,
  net_ngn numeric(16,2) not null,
  essentials_ngn numeric(16,2) not null,
  growth_ngn numeric(16,2) not null,
  stability_ngn numeric(16,2) not null,
  reward_ngn numeric(16,2) not null,
  created_at timestamptz default now()
);

create unique index if not exists weekly_budgets_user_week on weekly_budgets(user_id, week_start);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  budget_id uuid references weekly_budgets(id) on delete cascade not null,
  category text not null check (category in ('essentials','growth','stability','reward')),
  amount_ngn numeric(16,2) not null,
  account text not null check (account in ('palmpay','kuda','polaris','other')),
  description text not null default '',
  date date not null,
  created_at timestamptz default now()
);

create table if not exists investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  budget_id uuid references weekly_budgets(id) on delete cascade not null,
  platform text not null,
  amount_ngn numeric(16,2) not null,
  notes text not null default '',
  date date not null,
  created_at timestamptz default now()
);

-- Row-level security: users can only see their own data
alter table weekly_budgets enable row level security;
alter table transactions enable row level security;
alter table investments enable row level security;

create policy "Users manage own budgets" on weekly_budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own transactions" on transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own investments" on investments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
