import type { MastraDBMessage } from '@mastra/core/agent'
import type { ProcessOutputStepArgs, Processor } from '@mastra/core/processors'

export class ExampleOutputProcessor implements Processor {
  id = 'example-output'

  processOutputStep({ messages }: ProcessOutputStepArgs): MastraDBMessage[] {
    return messages
  }
}
