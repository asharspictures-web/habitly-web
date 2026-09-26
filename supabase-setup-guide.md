# Habitly — Supabase Setup Guide

Steps to run outside of any coding session — these are cloud account actions the user needs to do themselves.

1. Required. Create a Supabase project at supabase.com, then copy `.env.example` -> `.env` in `habitly-web/` and fill in the Project URL + anon key (Project Settings -> API -> Publishable key).
2. Once the step one is done then you should be able to singup with email address.  Auth -> Providers: confirm Email is on; optionally disable "Confirm email" for faster demo signups.
3. Optional if want to support google based login. Google sign-in: create an OAuth Web Client in Google Cloud Console (redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`), paste the Client ID/Secret into Supabase's Google provider settings, enable it.
4. Optional required only if step 3 is implementing. Auth -> URL Configuration: set Site URL and add `http://localhost:5173` as a redirect URL.
5. Required. SQL Editor: run `supabase/schema.sql`, then `supabase/seed.sql` (must be run here — regular users can't write the global catalog rows).
6. Optioanl. Better to do it. Storage: create a private bucket named `food-photos`, then run `supabase/storage.sql`.

When deploying application in vercel make sure the environment variables (values from .env) are set in vercel as environment variables.