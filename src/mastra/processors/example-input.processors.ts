import type { MastraDBMessage } from '@mastra/core/agent'
import type { ProcessInputArgs, Processor } from '@mastra/core/processors'

/**
 * Global state to track when the next LLM call can proceed.
 * Using a singleton to ensure rate limiting works across all agent instances.
 *
 * This tracks the "next available slot" - the earliest time a new request can proceed.
 * Each incoming request reserves a slot and updates this value synchronously,
 * ensuring proper queuing even for concurrent requests.
 */
let nextAvailableTime = 0

export interface ExampleInputProcessorOptions {
  /**
   * The minimum time in milliseconds between LLM calls.
   * @default 2000
   */
  delayMs?: number

  /**
   * Random jitter to add to each delay (in milliseconds).
   * When set, adds a random value between 0 and jitterMs to each delay.
   * This helps prevent synchronized retries and makes spacing more natural.
   *
   * @example
   * // delayMs: 2000, jitterMs: 500
   * // Actual delays will be between 2000ms and 2500ms
   *
   * @default 0 (no jitter)
   */
  jitterMs?: number
}

/**
 * A processor that queues and delays LLM calls to maintain minimum spacing between calls.
 * This helps avoid rate limit API errors by ensuring requests are spaced out.
 *
 * When multiple requests arrive simultaneously (with delayMs: 2000):
 * - Request 1: proceeds immediately
 * - Request 2: waits ~2 seconds (queued after request 1)
 * - Request 3: waits ~4 seconds (queued after request 2)
 *
 * With jitter enabled, each delay gets a random addition to prevent synchronized patterns.
 *
 * @example
 * ```typescript
 * // Fixed 2 second delay
 * const agent = new Agent({
 *   id: 'my-agent',
 *   inputProcessors: [new RateLimitProcessor({ delayMs: 2000 })],
 * });
 *
 * // 2-2.5 second delay with random jitter
 * const agentWithJitter = new Agent({
 *   id: 'my-agent',
 *   inputProcessors: [new RateLimitProcessor({ delayMs: 2000, jitterMs: 500 })],
 * });
 * ```
 */
export class ExampleInputProcessor implements Processor {
  readonly id = 'example-input'
  readonly name = 'ExampleInputProcessor'

  private readonly delayMs: number
  private readonly jitterMs: number

  /**
   * Creates a new RateLimitProcessor.
   * @param options - Configuration options
   */
  constructor(options: ExampleInputProcessorOptions = {}) {
    this.delayMs = options.delayMs ?? 500
    this.jitterMs = options.jitterMs ?? 1000
  }

  /**
   * Queues the request to maintain minimum spacing between LLM calls.
   *
   * The key to proper queuing is that we reserve our time slot SYNCHRONOUSLY
   * before any await. This ensures that even if multiple requests arrive
   * at the same instant, each one sees the updated nextAvailableTime from
   * the previous request.
   */
  async processInput({ messages }: ProcessInputArgs): Promise<MastraDBMessage[]> {
    const now = Date.now()

    // Calculate the delay for this request (base + optional jitter)
    const effectiveDelay = this.delayMs + this.getJitter()

    // Calculate when this request can proceed - either now or after the queue
    const myStartTime = Math.max(now, nextAvailableTime)

    // SYNCHRONOUSLY reserve the next slot before any await
    // This is critical for proper queuing of concurrent requests
    nextAvailableTime = myStartTime + effectiveDelay

    // Wait if we need to (our slot is in the future)
    const waitTime = myStartTime - now
    if (waitTime > 0) {
      await this.sleep(waitTime)
    }

    return messages
  }

  /**
   * Returns a random jitter value between 0 and jitterMs.
   */
  private getJitter(): number {
    if (this.jitterMs <= 0) {
      return 0
    }
    return Math.floor(Math.random() * this.jitterMs)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

/**
 * Resets the global rate limit queue.
 * Useful for testing purposes.
 */
export function resetRateLimitTimestamp(): void {
  nextAvailableTime = 0
}
