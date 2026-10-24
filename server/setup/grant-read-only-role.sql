-- Run as a database owner/superuser, replacing the password first.
-- The runtime role can read the analytics view and nothing else.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'plateau_campaign_app') THEN
    CREATE ROLE plateau_campaign_app LOGIN PASSWORD 'REPLACE_ME';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE plateau_campaign TO plateau_campaign_app;
GRANT USAGE ON SCHEMA public TO plateau_campaign_app;
GRANT SELECT ON analytics_campaign_activities TO plateau_campaign_app;
REVOKE ALL ON campaign_activities FROM plateau_campaign_app;
