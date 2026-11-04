import { Queue } from "bullmq";
import { config } from "../config.js";
import { ModelRequest } from "../providers/types.js";

export const QUEUE_NAME = "resilient-ai-jobs";

export function createJobQueue() {
  return new Queue<ModelRequest>(QUEUE_NAME, {
    connection: {
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD,
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  });
}
