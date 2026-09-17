# Supabase Storage setup for KAC publications

The updated publication system uses three Storage buckets:

1. `publications` — **Private** — publication documents (PDF/EPUB/DOC/DOCX).
2. `publication-image-staging` — **Private** — temporary source cover images before compression.
3. `publication-images` — **Public** — optimized cover images served on the public site.

## Fastest setup

Open your Supabase project, go to **SQL Editor**, paste the contents of:

`supabase/storage_setup.sql`

and run it once.

## Dashboard setup instead

Go to **Storage -> New bucket** and create the buckets above with the listed privacy settings.

For `publication-image-staging`, use a 20 MB file-size limit and allow JPEG, PNG, WEBP, AVIF and TIFF source uploads.

For `publication-images`, use a 20 MB file-size limit. The app only saves optimized WebP files there.

Keep `publications` private. On the current Free plan, keep its bucket limit within the plan's single-file limit. The application is already prepared for a 500 MB app-level document limit so you can raise the Storage bucket limit after upgrading.

## Dependency change

Image compression uses `sharp`. Run:

```bash
npm install
```

once after replacing the project files so the new dependency is installed and your lockfile is refreshed.
