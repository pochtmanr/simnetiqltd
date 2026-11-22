This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Hosting

Since 2026-11-22 the site runs on self-managed Azure Linux VMs, not Vercel.

- **App:** `next start` under pm2 behind nginx, on the apps VM. A deploy is: pull the branch into a
  copy of the app directory, `npm ci && npm run build`, then switch with the swap script.
- **Database:** a self-hosted Supabase stack (Postgres, the database API, Auth, Storage) on the
  database VM, reached at `https://db.simnetiq.com`. Only Storage is open to browsers.
- **Scheduled jobs:** three systemd timers call `/api/business-os/{sync,operations,providers}/tick`
  with `Authorization: Bearer $BUSINESS_OS_JOB_SECRET`.
- **Env vars:** `.env.production` on the apps VM. `NEXT_PUBLIC_*` values are compiled in, so a
  change to them needs a rebuild.
- **Backups:** nightly database dump and stored files, kept 14 days on the VM and 90 days in Azure
  Storage.

Server configs, scripts and runbooks live in the private `doppler-infra` repository under
`azure/simnetiq/`.
