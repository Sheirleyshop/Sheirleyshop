# SHEIRLEY

Jewelry storefront with a built-in admin dashboard. The whole front end is one static file, `index.html`.
No build step is needed.

## How it fits together
- **Front end:** `index.html`, served as a static site (Vercel).
- **Backend:** Supabase (Postgres database, login, row-level security). The Project URL and the anon key inside
  `index.html` are public by design; security comes from the database rules, not from hiding them.
- **Never commit** the Supabase `service_role` key or any password.

## Deploy
1. Push this repository to GitHub.
2. In Vercel: Add New Project, choose this repository. Framework preset: **Other**. Leave build command and
   output directory empty. Deploy.
3. Every push to the main branch redeploys automatically.

## Supabase settings (Authentication)
- Email: **Confirm email** ON, and the **Confirm signup** template must contain `{{ .Token }}` (6-digit code).
- Set a custom SMTP sender (for example Resend) before launch; the built-in sender is heavily rate limited.
- Google sign-in: set up the Google provider, then set `GOOGLE_LOGIN_ENABLED = true` in `index.html`.
