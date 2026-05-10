-- Migration: add notes column to weekly_budgets
-- Run this once in your Supabase SQL editor if your table already exists

alter table weekly_budgets
  add column if not exists notes text not null default '';
