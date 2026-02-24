-- That's So Budget - Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up your database

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Households (shared between users)
create table households (
  id uuid primary key default uuid_generate_v4(),
  name text not null default 'Our Budget',
  created_at timestamptz default now()
);

-- Users (linked to Supabase Auth)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  household_id uuid references households(id),
  display_name text not null,
  short_name text not null, -- 'S' or 'K'
  created_at timestamptz default now()
);

-- Envelope categories
create table envelopes (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  name text not null,
  budget numeric(10,2) not null default 0,
  color text default '#0f7b6c',
  icon text default 'shopping-cart',
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- Fixed/recurring bills
create table bills (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  name text not null,
  amount numeric(10,2) not null,
  due_day int not null check (due_day between 1 and 31),
  category text,
  is_variable boolean default false,
  frequency text default 'monthly', -- monthly, biweekly, weekly, annual
  active boolean default true,
  created_at timestamptz default now()
);

-- Monthly bill tracking (paid status per month)
create table bill_payments (
  id uuid primary key default uuid_generate_v4(),
  bill_id uuid references bills(id) on delete cascade,
  month_key text not null, -- '2026-02'
  actual_amount numeric(10,2),
  paid boolean default false,
  paid_date date,
  created_at timestamptz default now(),
  unique(bill_id, month_key)
);

-- Income entries
create table income (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  source text not null,
  amount numeric(10,2) not null,
  month_key text not null,
  date date default current_date,
  user_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- Transactions (the core of the app)
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  envelope_id uuid references envelopes(id),
  description text not null,
  amount numeric(10,2) not null,
  type text not null default 'expense' check (type in ('expense', 'refund')),
  payment_method text, -- scc, kcc, debit, cash
  date date default current_date,
  month_key text not null,
  note text,
  receipt_image_url text,
  linked_refund_id uuid references transactions(id),
  user_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- Debts for paydown tracker
create table debts (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  name text not null,
  balance numeric(12,2) not null,
  apr numeric(5,2) not null default 0,
  minimum_payment numeric(10,2) not null default 0,
  type text, -- mortgage, auto, student, medical, other
  created_at timestamptz default now()
);

-- Sinking funds
create table sinking_funds (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  name text not null,
  target_amount numeric(10,2) not null,
  current_amount numeric(10,2) default 0,
  target_date date,
  monthly_contribution numeric(10,2) default 0,
  created_at timestamptz default now()
);

-- Envelope transfers
create table transfers (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  from_envelope_id uuid references envelopes(id),
  to_envelope_id uuid references envelopes(id),
  amount numeric(10,2) not null,
  reason text,
  month_key text not null,
  user_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table households enable row level security;
alter table profiles enable row level security;
alter table envelopes enable row level security;
alter table bills enable row level security;
alter table bill_payments enable row level security;
alter table income enable row level security;
alter table transactions enable row level security;
alter table debts enable row level security;
alter table sinking_funds enable row level security;
alter table transfers enable row level security;

-- RLS Policies: Users can only access their household's data
create policy "Users can view own household" on households
  for all using (id in (select household_id from profiles where id = auth.uid()));

create policy "Users can view own profile" on profiles
  for all using (id = auth.uid() or household_id in (select household_id from profiles where id = auth.uid()));

create policy "Household members can access envelopes" on envelopes
  for all using (household_id in (select household_id from profiles where id = auth.uid()));

create policy "Household members can access bills" on bills
  for all using (household_id in (select household_id from profiles where id = auth.uid()));

create policy "Household members can access bill_payments" on bill_payments
  for all using (bill_id in (select id from bills where household_id in (select household_id from profiles where id = auth.uid())));

create policy "Household members can access income" on income
  for all using (household_id in (select household_id from profiles where id = auth.uid()));

create policy "Household members can access transactions" on transactions
  for all using (household_id in (select household_id from profiles where id = auth.uid()));

create policy "Household members can access debts" on debts
  for all using (household_id in (select household_id from profiles where id = auth.uid()));

create policy "Household members can access sinking_funds" on sinking_funds
  for all using (household_id in (select household_id from profiles where id = auth.uid()));

create policy "Household members can access transfers" on transfers
  for all using (household_id in (select household_id from profiles where id = auth.uid()));

-- Indexes for performance
create index idx_transactions_month on transactions(month_key);
create index idx_transactions_envelope on transactions(envelope_id);
create index idx_transactions_household on transactions(household_id);
create index idx_income_month on income(month_key);
create index idx_bill_payments_month on bill_payments(month_key);
