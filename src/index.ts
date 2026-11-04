import { BudgetManager } from "./budget/budget-manager.js";
import { ResilientModelRouter, MockProvider } from "./providers/router.js";
import { createJobQueue } from "./queue/queue.js";
import { createResilientWorker } from "./queue/worker.js";

async function main() {
  console.log("🚀 Starting Resilient AI Worker Pipeline...");

  // Setup providers: Primary fails (simulating 429 rate limit), Fallback succeeds
  const primaryProvider = new MockProvider("openai-gpt4o", true, 100);
  const secondaryProvider = new MockProvider("anthropic-claude35", false, 80);
  const fallbackProvider = new MockProvider("groq-llama3", false, 40);

  const router = new ResilientModelRouter([
    primaryProvider,
    secondaryProvider,
    fallbackProvider,
  ]);

  const budgetManager = new BudgetManager();

  console.log("⚡ Testing router failover directly...");
  try {
    const res = await router.executeWithFailover({
      id: "req-1",
      prompt: "Synthesize summary of decentralized ledger state",
    });
    console.log("🎯 Direct Router Result:", res);
  } catch (err: any) {
    console.error("Router error:", err.message);
  }

  console.log("✨ Pipeline is configured and ready for production jobs.");
}

main().catch(console.error);
