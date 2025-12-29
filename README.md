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

## Traffic Generator

Run the traffic generator to simulate guardrail triggers and demo the system:

```sh
# Run 3 default test scenarios
node traffic-generator.js

# Run 10 scenarios with custom delay
node traffic-generator.js --count=10 --delay=1000

# Run against deployed function
node traffic-generator.js --function-url=https://your-project.supabase.co/functions/v1/llm-gateway
```

See [TRAFFIC_GENERATOR.md](TRAFFIC_GENERATOR.md) for full documentation.

## Datadog Integration

### Setup

Set the `DATADOG_API_KEY` environment variable in Supabase:

```sh
supabase secrets set DATADOG_API_KEY=your_datadog_api_key
```

### What Gets Tracked

- **Metrics**: Trust score, risk scores (hallucination/security/cost), latency, token usage
- **Events**: Guardrail triggers logged as Datadog events
- **Logs**: Structured logs with context
- **Incidents**: Auto-created when guardrails trigger + trust score < 70

### Dashboard

Monitor application health in Datadog using:
- Metrics: `llm.trust_score`, `llm.risk.*`, `llm.latency_ms`
- Tags: `service:llm-guardrail`, `env:production`
- Events: Guardrail triggers with risk details

## Deployment

Build with `npm run build` and deploy the `dist` output to your hosting of choice (e.g., Netlify, Vercel, static hosting).

### Environment Variables

Set these in your deployment platform:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
LOVABLE_API_KEY=your_lovable_api_key
DATADOG_API_KEY=your_datadog_api_key (for Supabase functions)
```
