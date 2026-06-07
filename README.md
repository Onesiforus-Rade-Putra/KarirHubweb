<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/5265f315-ea57-4867-bd01-0282803a7750

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Backend Supabase + Vercel Functions

Backend awal untuk role user tersedia di folder `api/`:

- `POST /api/auth/register` untuk daftar user dengan role `seeker`, `seller`, atau `recruiter`
- `POST /api/auth/login` untuk login dan validasi role
- `GET /api/auth/me` untuk membaca profil dari Bearer token

Setup:

1. Buat project Supabase.
2. Jalankan SQL di `supabase/migrations/202606070001_create_user_profiles.sql`.
3. Isi env Vercel atau `.env.local`:
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN`.
4. Jalankan dengan Vercel dev saat ingin mengetes API lokal:
   `npx vercel dev`.
