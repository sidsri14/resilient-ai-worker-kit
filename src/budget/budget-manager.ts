import Redis from "ioredis";
import { config } from "../config.js";

export class BudgetManager {
  private redis: Redis;
  private keyPrefix = "ai_budget:daily:";

  constructor(redisInstance?: Redis) {
    this.redis =
      redisInstance ??
      new Redis({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD,
        lazyConnect: true,
      });
  }

  private getTodayKey(): string {
    const today = new Date().toISOString().split("T")[0];
    return `${this.keyPrefix}${today}`;
  }

  /**
   * Pre-check whether processing an estimated token count would breach the budget ceiling
   */
  public async canExecute(estimatedTokens: number): Promise<{ allowed: boolean; currentUsage: number; reason?: string }> {
    if (!config.ENABLE_BUDGET_KILL_SWITCH) {
      return { allowed: true, currentUsage: 0 };
    }

    if (estimatedTokens > config.MAX_REQUEST_TOKEN_LIMIT) {
      return {
        allowed: false,
        currentUsage: 0,
        reason: `Estimated tokens (${estimatedTokens}) exceed max single-request threshold (${config.MAX_REQUEST_TOKEN_LIMIT})`,
      };
    }

    const key = this.getTodayKey();
    const current = parseInt((await this.redis.get(key)) || "0", 10);

    if (current + estimatedTokens > config.MAX_DAILY_TOKEN_BUDGET) {
      return {
        allowed: false,
        currentUsage: current,
        reason: `Daily token limit breached: current usage (${current}) + estimated (${estimatedTokens}) > limit (${config.MAX_DAILY_TOKEN_BUDGET})`,
      };
    }

    return { allowed: true, currentUsage: current };
  }

  /**
   * Atomically records actual tokens consumed by a completed LLM execution
   */
  public async recordUsage(tokens: number): Promise<number> {
    const key = this.getTodayKey();
    const total = await this.redis.incrby(key, tokens);
    // Ensure 48 hour TTL for automatic cleanup
    await this.redis.expire(key, 172800);
    return total;
  }
}
