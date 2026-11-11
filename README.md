# 🛡️ Resilient AI Worker Kit (Node.js + BullMQ + Redis)

A battle-tested production template for running high-throughput, fault-tolerant AI agent queues with **automatic model failover**, **exponential backoff**, and **token-budget kill switches**.

---

## ⚡ Why This Kit?

Most AI worker queues fail in production because:
1. **Unpredictable Rate Limits:** A single 429 error cascades and crashes active agent tasks.
2. **Runaway Token Bills:** Recursive agents or infinite retry loops run up \$1,000+ bills overnight.
3. **Provider Outages:** When an API provider goes down, all background workers stall.

**The Resilient AI Worker Kit solves this out of the box.**

---

## 🌟 Key Features

- 🔄 **Multi-Provider Failover Router:** Automatically shifts requests from primary models (OpenAI) to fallbacks (Anthropic, Groq, Ollama) on errors or timeouts.
- 🛑 **Redis-Backed Budget Kill Switch:** Real-time token consumption tracking that hard-stops jobs before blowing through daily/monthly spend limits.
- 📬 **BullMQ + Redis Workflows:** Built-in dead-letter queues, jittered exponential backoff retries, and concurrency limits.
- 📊 **Verification & Regression Tests:** Verified `7/7` automated Vitest tests covering atomic Redis budget enforcement, daily spend kill switches, and failover routing (`npm test`).

---

## 🚀 Quick Start

### 1. Installation
```bash
git clone https://github.com/sidsri14/resilient-ai-worker-kit.git
cd resilient-ai-worker-kit
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

### 3. Run Pipeline
```bash
npm run dev
```

---

## 🏗️ Architecture

```mermaid
flowchart LR
    A[Client Request] --> B[BullMQ Job Queue]
    B --> C[Budget Pre-Check]
    C -- Exceeds Budget --> D[Reject / Kill Switch]
    C -- Within Budget --> E[Resilient Router]
    E -- Primary 429/500 --> F[Fallback Model]
    E -- Primary Success --> G[Worker Output]
    F --> G
    G --> H[Record Atomic Token Usage]
```

---

## 📄 License & Commercial Access

[![Get Pro Edition on Polar](https://img.shields.io/badge/Polar.sh-Instant_Checkout_%2439-blue?style=for-the-badge&logo=github)](https://buy.polar.sh/polar_cl_4mrUXvOPjiB4LEIEBsVyJshejMA8oq7XIHPQV163dbE)

- **Community Source Edition:** Open Source under the MIT License (`src/`, `test/`).
- **Enterprise / Commercial Starter Kit ($39 USD):** Includes the versioned commercial GitHub Release ZIP (`v1.1.0`), pre-compiled `dist/` artifacts, commercial deployment rights across client/SaaS systems without source attribution, and direct setup guidance. 👉 [**Instant Checkout on Polar.sh ($39)**](https://buy.polar.sh/polar_cl_4mrUXvOPjiB4LEIEBsVyJshejMA8oq7XIHPQV163dbE)

---

## 🛠️ Engineering Services & Portfolio

- **Custom AI Worker Pipelines & LLM Gateways ($60/hr):** [Hire on Upwork](https://www.upwork.com/freelancers/~01f93f1a56b9ef1b8d)
- **Live Storefront & Case Studies:** [sidsri14.github.io](https://sidsri14.github.io/)
- **Direct Contact:** `sidsri1502@gmail.com`

