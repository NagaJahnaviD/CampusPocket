-- ============================================================
-- Migration: Add Razorpay payment columns to fees table
-- ============================================================
-- Run this AFTER schema.sql to add payment tracking fields.
-- These columns store Razorpay order/payment details.
-- ============================================================

-- Add payment tracking columns to fees table
ALTER TABLE public.fees
  ADD COLUMN IF NOT EXISTS razorpay_order_id   TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_signature  TEXT;

-- Index for quick lookups by order_id
CREATE INDEX IF NOT EXISTS idx_fees_razorpay_order
  ON public.fees (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;
