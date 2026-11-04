import { IModelProvider, ModelRequest, ModelResponse } from "./types.js";

export class ResilientModelRouter {
  private providers: IModelProvider[];

  constructor(providers: IModelProvider[]) {
    if (providers.length === 0) {
      throw new Error("ResilientModelRouter requires at least one provider.");
    }
    this.providers = providers;
  }

  /**
   * Executes the prompt across provider fallbacks sequentially until one succeeds.
   * Emits structured error logs on intermediate failures.
   */
  public async executeWithFailover(req: ModelRequest): Promise<ModelResponse> {
    const errors: Array<{ provider: string; error: string }> = [];

    for (const provider of this.providers) {
      const start = Date.now();
      try {
        const res = await provider.execute(req);
        return res;
      } catch (err: any) {
        const latency = Date.now() - start;
        errors.push({
          provider: provider.name,
          error: err instanceof Error ? err.message : String(err),
        });
        // Continue to fallback provider
      }
    }

    throw new Error(
      `All model providers failed for request [${req.id}]: ` +
        JSON.stringify(errors)
    );
  }
}

/**
 * Built-in mock provider for test runs and demonstration
 */
export class MockProvider implements IModelProvider {
  constructor(
    public name: string,
    private shouldFail: boolean = false,
    private latencyMs: number = 50
  ) {}

  async execute(req: ModelRequest): Promise<ModelResponse> {
    await new Promise((resolve) => setTimeout(resolve, this.latencyMs));

    if (this.shouldFail) {
      throw new Error(`[${this.name}] Rate limit 429: Too Many Requests`);
    }

    const estimatedTokens = Math.max(20, Math.ceil(req.prompt.length / 4));
    return {
      provider: this.name,
      model: `${this.name}-turbo`,
      output: `Processed response from ${this.name} for prompt: "${req.prompt.slice(0, 30)}..."`,
      tokensUsed: estimatedTokens,
      latencyMs: this.latencyMs,
    };
  }
}
