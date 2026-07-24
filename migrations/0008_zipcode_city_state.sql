-- Cache city/state alongside lat/long so ZIP lookups (used to prefill a
-- submission's city/state from its ZIP) don't have to hit an external
-- geocoding API more than once per ZIP code.
alter table zipcodes add column if not exists city  text;
alter table zipcodes add column if not exists state text;
