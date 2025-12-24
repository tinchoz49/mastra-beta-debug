import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { DefaultExporter, Observability, SamplingStrategyType, SensitiveDataFilter } from '@mastra/observability';

import { contentAssistantAgent } from './agents/content-assistant.agent';
import {
  contentEnrichmentWorkflow,
  contentPipelineWorkflow,
  documentProcessingWorkflow,
} from './workflows/nested-workflow-example';

export default new Mastra({
  storage: new LibSQLStore({
    id: 'mastra-storage',
    url: 'file:./mastra.db',
  }),
  observability: new Observability({
    // Enables DefaultExporter and CloudExporter for tracing
    configs: {
      default: {
        serviceName: 'mastra',
        sampling: { type: SamplingStrategyType.ALWAYS },
        spanOutputProcessors: [new SensitiveDataFilter()],
        exporters: [new DefaultExporter()],
      },
    },
  }),
  agents: {
    contentAssistantAgent,
  },
  workflows: {
    contentPipelineWorkflow,
    documentProcessingWorkflow,
    contentEnrichmentWorkflow,
  },
});