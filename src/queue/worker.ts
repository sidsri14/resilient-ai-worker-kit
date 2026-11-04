import { Worker, Job } from "bullmq";
import { config } from "../config.js";
import { QUEUE_NAME } from "./queue.js";
import { BudgetManager } from "../budget/budget-manager.js";
import { ResilientModelRouter } from "../providers/router.js";
import { ModelRequest, ModelResponse } from "../providers/types.js";

export function createResilientWorker(
  router: ResilientModelRouter,
  budgetManager: BudgetManager,
  concurrency: number = 5
) {
  const worker = new Worker<ModelRequest, ModelResponse>(
    QUEUE_NAME,
    async (job: Job<ModelRequest>) => {
      const estimatedTokens = Math.ceil((job.data.prompt?.length || 0) / 4) + (job.data.maxTokens || 500);

      // 1. Budget kill switch pre-check
      const budgetStatus = await budgetManager.canExecute(estimatedTokens);
      if (!budgetStatus.allowed) {
        throw new Error(`[BUDGET_KILL_SWITCH] Job rejected: ${budgetStatus.reason}`);
      }

      // 2. Execute with multi-provider failover
      const response = await router.executeWithFailover(job.data);

      // 3. Record actual token spend
      await budgetManager.recordUsage(response.tokensUsed);

      return response;
    },
    {
      connection: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD,
      },
      concurrency,
    }
  );

  worker.on("completed", (job, returnvalue) => {
    console.log(
      `✅ [Job ${job.id}] Completed via [${returnvalue.provider}] in ${returnvalue.latencyMs}ms | Tokens: ${returnvalue.tokensUsed}`
    );
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ [Job ${job?.id}] Failed: ${err.message}`);
  });

  return worker;
}
