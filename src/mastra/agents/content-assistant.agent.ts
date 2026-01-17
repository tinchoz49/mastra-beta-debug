import { Agent } from '@mastra/core/agent';

import { ExampleOutputProcessor } from '../processors/example-output.processors';
import { ExampleInputProcessor } from '../processors/example-input.processors';

import { MockLanguageModelV3 } from 'ai/test';

const vertexMockModel = new MockLanguageModelV3({
  provider: 'google.vertex.chat',
  modelId: 'gemini-2.5-flash',
  supportedUrls() {
    return {
      "*": [ /^https?:\/\/.*$/, /^gs:\/\/.*$/ ],
    }
  },
  doGenerate: async () => ({
    content: [{ type: 'text', text: `Hello, world!` }],
    finishReason: { unified: 'stop', raw: undefined },
    usage: {
      inputTokens: {
        total: 10,
        noCache: 10,
        cacheRead: undefined,
        cacheWrite: undefined,
      },
      outputTokens: {
        total: 20,
        text: 20,
        reasoning: undefined,
      },
    },
    warnings: [],
  }),
})

export const contentAssistantAgent = new Agent({
  id: 'content-assistant',
  name: 'Content Assistant',
  instructions: `Analyze the user's message.`,
  model: vertexMockModel,
  outputProcessors: [new ExampleOutputProcessor()],
  inputProcessors: [new ExampleInputProcessor()],
});
