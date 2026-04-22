# Star Kitchen Frontend

Next.js 14 front-end for two externally facing sites plus the internal operating platform:

- `starkitchen.ai`: Star Kitchen Hospitality Group corporate website
- `starkitchenai.com`: StarKitchen AI service-industry technology website
- `/dashboard`: internal operating and AI management platform

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- Vercel-ready deployment config

## Local development

```bash
npm install
npm run dev
```

Default local entry points:

- Corporate site: `http://localhost:3000/`
- AI tech site preview: `http://localhost:3000/ai-company`
- Internal platform login: `http://localhost:3000/login`
- Dashboard: `http://localhost:3000/dashboard`

## Domain behavior

The app now supports host-based homepage switching:

- requests for `starkitchen.ai` render the corporate homepage
- requests for `starkitchenai.com` render the AI technology homepage

For local review without DNS switching, use the preview route:

- `/ai-company`

## Environment

Create `.env.local` from `.env.example`.

Optional server-side upstream used by the agents proxy:

- `AGENTS_API_URL`

Optional server-side auth bootstrap should stay private and never use `NEXT_PUBLIC_` prefixes:

- `ENABLE_EMBEDDED_AUTH`
- `EMBEDDED_AUTH_SIGNING_SECRET`
- `EMBEDDED_AUTH_USERS_JSON`
- `LOCAL_ADMIN_USERNAME`
- `LOCAL_ADMIN_PASSWORD`
- `LOCAL_ADMIN_MOBILE`
- `LOCAL_ADMIN_DISPLAY_NAME`
- `LOCAL_ADMIN_TOKEN`

There are many other optional server-side integration variables for GAIA, OA, finance sync, and AI workflow storage. Those should be configured in the deployment platform, not committed to Git.

## Build

```bash
npm run build
```

## Quality and test commands

```bash
npm run lint
npm run test:run
npm run quality:fix
npm run quality:check
npm run quality:preflight
```

## Deployment

This project includes [vercel.json](./vercel.json) and is ready for Vercel deployment.

Typical flow:

```bash
npx vercel
npx vercel deploy --prod
```

Recommended production domain mapping:

- `starkitchen.ai` -> corporate homepage
- `starkitchenai.com` -> AI technology homepage

## GitHub notes

Files intentionally excluded from Git:

- `.env*.local`
- `.next`
- `node_modules`
- `.vercel`
- local trial account CSVs
- local PDF handoff files

This keeps the repository safe to publish while preserving the deployable application source.
