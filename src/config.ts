import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const ConfigSchema = z.object({
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  MAX_DAILY_TOKEN_BUDGET: z.coerce.number().default(1_000_000),
  MAX_REQUEST_TOKEN_LIMIT: z.coerce.number().default(8_000),
  ENABLE_BUDGET_KILL_SWITCH: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
  PRIMARY_PROVIDER: z.string().default("mock-primary"),
  SECONDARY_PROVIDER: z.string().default("mock-secondary"),
  FALLBACK_PROVIDER: z.string().default("mock-fallback"),
});

export type Config = z.infer<typeof ConfigSchema>;
export const config = ConfigSchema.parse(process.env);
