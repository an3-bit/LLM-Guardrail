# LLM Guardrail AI

LLM Guardrail AI is a React/Vite dashboard for monitoring LLM guardrails, risk signals, recovery actions, and request history. It uses shadcn-ui and Tailwind for UI components and Supabase for data integration.

## Project links

- Live/preview URL: coming soon
- Repo: this project

## Local development

Prerequisites: Node.js (LTS) and npm.

```sh
git clone <YOUR_GIT_URL>
cd trust-guard
npm i
npm run dev
```

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS
- shadcn-ui component library
- Supabase integrations

## Available scripts

- `npm run dev` – start the Vite dev server
- `npm run build` – create a production build
- `npm run preview` – preview the production build locally

## Deployment

Build with `npm run build` and deploy the `dist` output to your hosting of choice (e.g., Netlify, Vercel, static hosting). Configure environment variables for Supabase and any LLM providers before deploying.
