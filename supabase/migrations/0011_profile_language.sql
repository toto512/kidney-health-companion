-- Preferred app language, saved to the account so it follows the person across devices.
-- Null means "use the device language". Codes match src/i18n/core.ts. Add a code here when a language is added there.
alter table public.profiles
  add column language text check (language in ('en','fr','es','he'));
