-- Migration to add mailing address, website, and phone number fields to businesses table
-- Run this in your Supabase SQL Editor

-- Add new columns to businesses table
ALTER TABLE businesses 
ADD COLUMN mailing_street_address TEXT,
ADD COLUMN mailing_city TEXT,
ADD COLUMN mailing_state TEXT,
ADD COLUMN mailing_zip TEXT,
ADD COLUMN website TEXT,
ADD COLUMN phone_number TEXT;

-- Add comments to clarify the difference between entity_state and mailing_state
COMMENT ON COLUMN businesses.entity_state IS 'State where the business is legally domiciled/incorporated (used for tax purposes)';
COMMENT ON COLUMN businesses.mailing_state IS 'State in the mailing address (not used for tax calculations)';

-- Create index for efficient querying by mailing state
CREATE INDEX idx_businesses_mailing_state ON businesses(mailing_state);

-- Update existing businesses to have empty strings instead of NULL for consistency
UPDATE businesses 
SET 
    mailing_street_address = COALESCE(mailing_street_address, ''),
    mailing_city = COALESCE(mailing_city, ''),
    mailing_state = COALESCE(mailing_state, ''),
    mailing_zip = COALESCE(mailing_zip, ''),
    website = COALESCE(website, ''),
    phone_number = COALESCE(phone_number, '')
WHERE 
    mailing_street_address IS NULL 
    OR mailing_city IS NULL 
    OR mailing_state IS NULL 
    OR mailing_zip IS NULL 
    OR website IS NULL 
    OR phone_number IS NULL; 