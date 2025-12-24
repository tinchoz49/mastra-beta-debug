import { Agent } from '@mastra/core/agent';

import { ExampleOutputProcessor } from '../processors/example-output.processors';

/**
 * Content Assistant Agent
 *
 * An AI assistant powered by OpenAI GPT-4o that helps with content-related tasks.
 * Uses the StripOutGsOutputProcessor to filter out Google Cloud Storage (gs://) file
 * references from the output, ensuring clean responses without internal file paths.
 *
 * Use cases:
 * - Content summarization
 * - Text analysis
 * - Writing assistance
 * - Document processing feedback
 */
export const contentAssistantAgent = new Agent({
  id: 'content-assistant',
  name: 'Content Assistant',
  instructions: `You are a helpful content assistant that specializes in:
- Summarizing documents and text
- Analyzing content for sentiment, tone, and key themes
- Providing writing suggestions and improvements
- Answering questions about document content

When working with documents, provide clear and concise responses.
If you reference any files, use descriptive names rather than internal paths.
Always structure your responses in a clear, readable format.`,
  model: 'openai/gpt-4o',
  outputProcessors: [new ExampleOutputProcessor()],
});
