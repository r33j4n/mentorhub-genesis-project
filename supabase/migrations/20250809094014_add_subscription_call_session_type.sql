-- Add subscription_call to session_type enum
ALTER TYPE session_type ADD VALUE IF NOT EXISTS 'subscription_call';
