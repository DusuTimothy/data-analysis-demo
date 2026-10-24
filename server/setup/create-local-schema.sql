-- Local development schema for the campaign analytics API.
-- The upstream production database is supplied by the campaign and must be
-- exposed through the same analytics_campaign_activities view.

CREATE TABLE IF NOT EXISTS campaign_activities (
  id SERIAL PRIMARY KEY,
  activity_type TEXT NOT NULL,
  lga TEXT NOT NULL,
  ward TEXT NOT NULL,
  polling_unit TEXT,
  contact_count INTEGER NOT NULL DEFAULT 0 CHECK (contact_count >= 0),
  amount_spent NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_spent >= 0),
  activity_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaign_activities_activity_type_check CHECK (
    activity_type IN (
      'rally',
      'door_to_door',
      'town_hall',
      'market_outreach',
      'radio',
      'social_media',
      'billboard'
    )
  )
);

-- Indexes support group-by and date-range aggregation on the base table.
CREATE INDEX IF NOT EXISTS campaign_activities_lga_idx
  ON campaign_activities (lga);
CREATE INDEX IF NOT EXISTS campaign_activities_ward_idx
  ON campaign_activities (ward);
CREATE INDEX IF NOT EXISTS campaign_activities_activity_type_idx
  ON campaign_activities (activity_type);
CREATE INDEX IF NOT EXISTS campaign_activities_activity_date_idx
  ON campaign_activities (activity_date);

-- The application reads only this view. Do not grant SELECT on the base table
-- to the runtime database role.
CREATE OR REPLACE VIEW analytics_campaign_activities AS
SELECT
  id,
  activity_type,
  lga,
  ward,
  polling_unit,
  contact_count,
  amount_spent,
  activity_date
FROM campaign_activities;
