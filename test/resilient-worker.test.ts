import { describe, it, expect } from "vitest";
import type Redis from "ioredis";
import { ResilientModelRouter, MockProvider } from "../src/providers/router.js";
import { BudgetManager } from "../src/budget/budget-manager.js";
import { config } from "../src/config.js";

class InMemoryRedisMock {
  private store = new Map<string, number>();
  public expirations = new Map<string, number>();

  async get(key: string): Promise<string | null> {
    const val = this.store.get(key);
    return val !== undefined ? String(val) : null;
  }

  async incrby(key: string, amount: number): Promise<number> {
    const next = (this.store.get(key) ?? 0) + amount;
    this.store.set(key, next);
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    this.expirations.set(key, seconds);
    return 1;
  }
}

describe("ResilientModelRouter", () => {
  it("rejects initialization with zero providers", () => {
    expect(() => new ResilientModelRouter([])).toThrow(
      "ResilientModelRouter requires at least one provider."
    );
  });

  it("uses primary provider when healthy", async () => {
    const primary = new MockProvider("openai", false, 5);
    const fallback = new MockProvider("anthropic", false, 5);
    const router = new ResilientModelRouter([primary, fallback]);

    const res = await router.executeWithFailover({
      id: "req-1",
      prompt: "Summarize deployment checklist",
    });

    expect(res.provider).toBe("openai");
    expect(res.tokensUsed).toBeGreaterThanOrEqual(20);
  });

  it("automatically fails over to secondary provider when primary fails", async () => {
    const primary = new MockProvider("openai", true, 5);
    const fallback = new MockProvider("groq", false, 5);
    const router = new ResilientModelRouter([primary, fallback]);

    const res = await router.executeWithFailover({
      id: "req-2",
      prompt: "Generate fallback telemetry",
    });

    expect(res.provider).toBe("groq");
  });

  it("throws descriptive error when every provider fails", async () => {
    const p1 = new MockProvider("openai", true, 2);
    const p2 = new MockProvider("anthropic", true, 2);
    const router = new ResilientModelRouter([p1, p2]);

    await expect(
      router.executeWithFailover({ id: "req-3", prompt: "Fail all" })
    ).rejects.toThrow("All model providers failed for request [req-3]");
  });
});

describe("BudgetManager", () => {
  it("blocks single requests exceeding MAX_REQUEST_TOKEN_LIMIT", async () => {
    const mockRedis = new InMemoryRedisMock();
    const manager = new BudgetManager(mockRedis as unknown as Redis);

    const status = await manager.canExecute(config.MAX_REQUEST_TOKEN_LIMIT + 1);
    expect(status.allowed).toBe(false);
    expect(status.reason).toContain("exceed max single-request threshold");
  });

  it("allows requests within budget and records usage with 48h TTL", async () => {
    const mockRedis = new InMemoryRedisMock();
    const manager = new BudgetManager(mockRedis as unknown as Redis);

    const pre = await manager.canExecute(500);
    expect(pre.allowed).toBe(true);
    expect(pre.currentUsage).toBe(0);

    const totalAfterFirst = await manager.recordUsage(500);
    expect(totalAfterFirst).toBe(500);

    const secondPre = await manager.canExecute(250);
    expect(secondPre.allowed).toBe(true);
    expect(secondPre.currentUsage).toBe(500);

    const todayKey = `ai_budget:daily:${new Date().toISOString().split("T")[0]}`;
    expect(mockRedis.expirations.get(todayKey)).toBe(172800);
  });

  it("trips daily kill switch when usage + estimated tokens breaches ceiling", async () => {
    const mockRedis = new InMemoryRedisMock();
    const manager = new BudgetManager(mockRedis as unknown as Redis);

    await manager.recordUsage(config.MAX_DAILY_TOKEN_BUDGET - 100);
    const status = await manager.canExecute(101);

    expect(status.allowed).toBe(false);
    expect(status.reason).toContain("Daily token limit breached");
  });
});
