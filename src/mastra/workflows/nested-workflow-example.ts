import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

/**
 * NESTED WORKFLOW EXAMPLE: Content Intelligence Pipeline
 *
 * This demonstrates a 3-level workflow hierarchy:
 *
 * contentPipelineWorkflow (root)
 *     └── documentProcessingWorkflow (nested level 1)
 *             └── contentEnrichmentWorkflow (nested level 2)
 *
 * Scenario: A document processing system that:
 * 1. Receives a document URL
 * 2. Fetches and validates the document (nested level 1)
 * 3. Enriches the content with analysis and summary (nested level 2)
 * 4. Produces a final enriched document report
 */

// ============================================================================
// LEVEL 2: Content Enrichment Workflow (Deepest Nested)
// ============================================================================

/**
 * Step: Analyze content sentiment and extract keywords
 */
const analyzeContentStep = createStep({
  id: 'analyze-content',
  inputSchema: z.object({
    content: z.string(),
    title: z.string(),
  }),
  outputSchema: z.object({
    content: z.string(),
    title: z.string(),
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    keywords: z.array(z.string()),
    wordCount: z.number(),
  }),
  execute: async ({ inputData }) => {
    // Simulate content analysis
    const wordCount = inputData.content.split(/\s+/).length;

    // Simple sentiment detection (in real scenario, use AI)
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'success'];
    const negativeWords = ['bad', 'terrible', 'awful', 'failure', 'problem'];

    const lowerContent = inputData.content.toLowerCase();
    const hasPositive = positiveWords.some((word) => lowerContent.includes(word));
    const hasNegative = negativeWords.some((word) => lowerContent.includes(word));

    const sentiment = hasPositive && !hasNegative ? 'positive' : hasNegative && !hasPositive ? 'negative' : 'neutral';

    // Extract keywords (simple word frequency)
    const words = inputData.content
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 4);

    const wordFreq = words.reduce(
      (acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    console.log(`[analyze-content] Analyzed "${inputData.title}" - Sentiment: ${sentiment}, Keywords: ${keywords.length}`);

    return {
      content: inputData.content,
      title: inputData.title,
      sentiment: sentiment as 'positive' | 'negative' | 'neutral',
      keywords,
      wordCount,
    };
  },
});

/**
 * Step: Generate a summary of the content
 */
const summarizeContentStep = createStep({
  id: 'summarize-content',
  inputSchema: z.object({
    content: z.string(),
    title: z.string(),
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    keywords: z.array(z.string()),
    wordCount: z.number(),
  }),
  outputSchema: z.object({
    title: z.string(),
    summary: z.string(),
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    keywords: z.array(z.string()),
    wordCount: z.number(),
    readingTimeMinutes: z.number(),
  }),
  execute: async ({ inputData }) => {
    // Generate summary (first 150 chars + ellipsis)
    const summary =
      inputData.content.length > 150 ? `${inputData.content.substring(0, 150).trim()}...` : inputData.content;

    // Estimate reading time (average 200 words per minute)
    const readingTimeMinutes = Math.ceil(inputData.wordCount / 200);

    console.log(`[summarize-content] Generated summary for "${inputData.title}" - Reading time: ${readingTimeMinutes} min`);

    return {
      title: inputData.title,
      summary,
      sentiment: inputData.sentiment,
      keywords: inputData.keywords,
      wordCount: inputData.wordCount,
      readingTimeMinutes,
    };
  },
});

/**
 * Nested Workflow Level 2: Content Enrichment
 * Takes validated content and enriches it with analysis + summary
 */
export const contentEnrichmentWorkflow = createWorkflow({
  id: 'content-enrichment-workflow',
  inputSchema: z.object({
    content: z.string(),
    title: z.string(),
  }),
  outputSchema: z.object({
    title: z.string(),
    summary: z.string(),
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    keywords: z.array(z.string()),
    wordCount: z.number(),
    readingTimeMinutes: z.number(),
  }),
})
  .then(analyzeContentStep)
  .then(summarizeContentStep)
  .commit();

// ============================================================================
// LEVEL 1: Document Processing Workflow (Middle Nested)
// ============================================================================

/**
 * Step: Fetch document from URL
 */
const fetchDocumentStep = createStep({
  id: 'fetch-document',
  inputSchema: z.object({
    url: z.string().url(),
  }),
  outputSchema: z.object({
    url: z.string(),
    rawContent: z.string(),
    fetchedAt: z.string(),
  }),
  execute: async ({ inputData }) => {
    // Simulate fetching document (in real scenario, use fetch API)
    console.log(`[fetch-document] Fetching document from: ${inputData.url}`);

    // Simulate different document contents based on URL patterns
    let rawContent: string;
    if (inputData.url.includes('success')) {
      rawContent = `This is an excellent document about achieving great success in software development.
        The key principles include continuous learning, collaboration, and embracing change.
        Teams that follow these practices see amazing results and wonderful improvements in productivity.
        Remember that success comes from consistent effort and dedication to quality.`;
    } else if (inputData.url.includes('problem')) {
      rawContent = `This document discusses common problems in legacy systems.
        Many organizations face terrible technical debt that creates awful maintenance challenges.
        The failure to modernize leads to bad outcomes and increasing costs over time.
        Addressing these issues requires careful planning and resource allocation.`;
    } else {
      rawContent = `This is a standard technical document covering various software engineering topics.
        It includes information about architecture patterns, testing strategies, and deployment practices.
        The content provides guidance for developers working on modern applications.
        Following these guidelines helps maintain code quality and team productivity.`;
    }

    return {
      url: inputData.url,
      rawContent,
      fetchedAt: new Date().toISOString(),
    };
  },
});

/**
 * Step: Validate and extract document metadata
 */
const validateDocumentStep = createStep({
  id: 'validate-document',
  inputSchema: z.object({
    url: z.string(),
    rawContent: z.string(),
    fetchedAt: z.string(),
  }),
  outputSchema: z.object({
    isValid: z.boolean(),
    content: z.string(),
    title: z.string(),
    source: z.string(),
    processedAt: z.string(),
  }),
  execute: async ({ inputData }) => {
    // Validate document content
    const isValid = inputData.rawContent.length > 50;

    // Extract title from URL (simplified)
    const urlParts = inputData.url.split('/');
    const title = urlParts[urlParts.length - 1]?.replace(/-/g, ' ').replace(/\.\w+$/, '') || 'Untitled Document';

    console.log(`[validate-document] Validated "${title}" - Valid: ${isValid}`);

    return {
      isValid,
      content: inputData.rawContent.trim(),
      title: title.charAt(0).toUpperCase() + title.slice(1),
      source: inputData.url,
      processedAt: new Date().toISOString(),
    };
  },
});

/**
 * Step: Prepare content for enrichment
 */
const prepareForEnrichmentStep = createStep({
  id: 'prepare-for-enrichment',
  inputSchema: z.object({
    isValid: z.boolean(),
    content: z.string(),
    title: z.string(),
    source: z.string(),
    processedAt: z.string(),
  }),
  outputSchema: z.object({
    content: z.string(),
    title: z.string(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData.isValid) {
      throw new Error(`Document "${inputData.title}" failed validation`);
    }

    console.log(`[prepare-for-enrichment] Preparing "${inputData.title}" for enrichment`);

    return {
      content: inputData.content,
      title: inputData.title,
    };
  },
});

/**
 * Nested Workflow Level 1: Document Processing
 * Fetches, validates, and prepares document, then passes to enrichment
 */
export const documentProcessingWorkflow = createWorkflow({
  id: 'document-processing-workflow',
  inputSchema: z.object({
    url: z.string().url(),
  }),
  outputSchema: z.object({
    title: z.string(),
    summary: z.string(),
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    keywords: z.array(z.string()),
    wordCount: z.number(),
    readingTimeMinutes: z.number(),
  }),
})
  .then(fetchDocumentStep)
  .then(validateDocumentStep)
  .then(prepareForEnrichmentStep)
  .then(contentEnrichmentWorkflow) // <-- Nested Level 2
  .commit();

// ============================================================================
// ROOT LEVEL: Content Pipeline Workflow
// ============================================================================

/**
 * Step: Initialize pipeline with request metadata
 */
const initializePipelineStep = createStep({
  id: 'initialize-pipeline',
  inputSchema: z.object({
    documentUrl: z.string().url(),
    requestId: z.string(),
  }),
  outputSchema: z.object({
    url: z.string().url(),
    requestId: z.string(),
    startedAt: z.string(),
  }),
  execute: async ({ inputData }) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[initialize-pipeline] Starting pipeline for request: ${inputData.requestId}`);
    console.log(`[initialize-pipeline] Document URL: ${inputData.documentUrl}`);
    console.log(`${'='.repeat(60)}\n`);

    return {
      url: inputData.documentUrl,
      requestId: inputData.requestId,
      startedAt: new Date().toISOString(),
    };
  },
});

/**
 * Step: Transform output for nested workflow input
 */
const prepareDocumentInputStep = createStep({
  id: 'prepare-document-input',
  inputSchema: z.object({
    url: z.string().url(),
    requestId: z.string(),
    startedAt: z.string(),
  }),
  outputSchema: z.object({
    url: z.string().url(),
  }),
  execute: async ({ inputData }) => {
    return {
      url: inputData.url,
    };
  },
});

/**
 * Step: Finalize the pipeline with complete report
 */
const finalizePipelineStep = createStep({
  id: 'finalize-pipeline',
  inputSchema: z.object({
    title: z.string(),
    summary: z.string(),
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    keywords: z.array(z.string()),
    wordCount: z.number(),
    readingTimeMinutes: z.number(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    report: z.object({
      title: z.string(),
      summary: z.string(),
      analysis: z.object({
        sentiment: z.enum(['positive', 'negative', 'neutral']),
        keywords: z.array(z.string()),
        wordCount: z.number(),
        readingTimeMinutes: z.number(),
      }),
    }),
    completedAt: z.string(),
  }),
  execute: async ({ inputData }) => {
    const completedAt = new Date().toISOString();

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[finalize-pipeline] Pipeline completed successfully!`);
    console.log(`[finalize-pipeline] Document: "${inputData.title}"`);
    console.log(`[finalize-pipeline] Sentiment: ${inputData.sentiment}`);
    console.log(`[finalize-pipeline] Keywords: ${inputData.keywords.join(', ')}`);
    console.log(`${'='.repeat(60)}\n`);

    return {
      success: true,
      report: {
        title: inputData.title,
        summary: inputData.summary,
        analysis: {
          sentiment: inputData.sentiment,
          keywords: inputData.keywords,
          wordCount: inputData.wordCount,
          readingTimeMinutes: inputData.readingTimeMinutes,
        },
      },
      completedAt,
    };
  },
});

/**
 * ROOT Workflow: Content Intelligence Pipeline
 *
 * Hierarchy:
 *   contentPipelineWorkflow (this)
 *       └── documentProcessingWorkflow (nested level 1)
 *               └── contentEnrichmentWorkflow (nested level 2)
 */
export const contentPipelineWorkflow = createWorkflow({
  id: 'content-pipeline-workflow',
  inputSchema: z.object({
    documentUrl: z.string().url(),
    requestId: z.string(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    report: z.object({
      title: z.string(),
      summary: z.string(),
      analysis: z.object({
        sentiment: z.enum(['positive', 'negative', 'neutral']),
        keywords: z.array(z.string()),
        wordCount: z.number(),
        readingTimeMinutes: z.number(),
      }),
    }),
    completedAt: z.string(),
  }),
})
  .then(initializePipelineStep)
  .then(prepareDocumentInputStep)
  .then(documentProcessingWorkflow) // <-- Nested Level 1 (which contains Nested Level 2)
  .then(finalizePipelineStep)
  .commit();
