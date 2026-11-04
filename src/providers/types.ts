export interface ModelRequest {
  id: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ModelResponse {
  provider: string;
  model: string;
  output: string;
  tokensUsed: number;
  latencyMs: number;
}

export interface IModelProvider {
  name: string;
  execute(req: ModelRequest): Promise<ModelResponse>;
}
