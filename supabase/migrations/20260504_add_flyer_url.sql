-- Migration: add flyer_url to programacao table
-- Run this in your Supabase SQL editor

ALTER TABLE programacao
  ADD COLUMN IF NOT EXISTS flyer_url text;
