-- Fix #1: Enforce user_id NOT NULL on all core tables for strict multi-tenant isolation
-- This ensures every record is always owned by a user, preventing data leakage

-- Set user_id to NOT NULL on messages table
ALTER TABLE messages ALTER COLUMN user_id SET NOT NULL;

-- Set user_id to NOT NULL on files table
ALTER TABLE files ALTER COLUMN user_id SET NOT NULL;

-- Set user_id to NOT NULL on extractions table
ALTER TABLE extractions ALTER COLUMN user_id SET NOT NULL;

-- Set user_id to NOT NULL on invoices table
ALTER TABLE invoices ALTER COLUMN user_id SET NOT NULL;

-- Set user_id to NOT NULL on invoice_line_items table
ALTER TABLE invoice_line_items ALTER COLUMN user_id SET NOT NULL;

-- gmail_config already has user_id NOT NULL, no change needed

-- Set user_id to NOT NULL on exports table
ALTER TABLE exports ALTER COLUMN user_id SET NOT NULL;