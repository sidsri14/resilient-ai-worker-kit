# Resilient AI Worker Kit

An AI-assisted Node.js/TypeScript starter for exploring BullMQ queues, sequential provider fallback and Redis-backed token-usage checks. This is prototype code with mock providers, not a production-validated AI service.

## Included

- TypeScript source and precompiled JavaScript in `dist/`.
- A provider interface, sequential fallback router and mock providers for demonstrations.
- BullMQ queue/worker examples and Redis-backed daily usage accounting.
- Seven automated tests using mock providers and an in-memory Redis substitute.
- Environment example, lockfile and MIT `LICENSE`.

## Limits to understand before using it

- Provider names in the examples are mock labels. Live OpenAI, Anthropic, Groq or Ollama API adapters are not included.
- The budget check and usage update are separate operations. The increment records usage atomically, but the overall check-and-execute flow does not reserve capacity atomically across concurrent workers. It is not a guaranteed spending cap.
- Mock tests do not establish production throughput, billing accuracy, Redis integration reliability or operational safety.
- Deployment, live provider integration, security review and operational configuration require additional work.
- The source is also available publicly. The paid offering is a packaged distribution and the setup guidance described by the seller, not exclusive access to otherwise unavailable source code. Confirm the support scope before purchase.

## Local setup

Use a supported Node.js installation and a reachable Redis instance. Configure Redis using `.env.example`. No Redis service or paid provider account is bundled.

```sh
npm ci
npm test
npm run build
```

Copy `.env.example` to `.env` and configure your own local Redis settings before running `npm start`. The example pipeline uses mock providers. Never put live credentials in a shared package.

## Verification of this package

The source passed seven mock-based tests and the TypeScript compiler during package preparation. This archive contains the resulting seven compiled JavaScript files, including `dist/index.js`. See `PACKAGE-VERIFICATION.md` for the scope of those checks.

## Source and license

Public source: https://github.com/sidsri14/resilient-ai-worker-kit

The repository's MIT `LICENSE` is included unchanged. Dependencies have their own licenses. This document makes no additional licensing or attribution-waiver promise.

Contact: sidsri1502@gmail.com
