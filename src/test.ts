import mastra from './mastra'

const agent = mastra.getAgentById('content-assistant')


const result = await agent.generate([
  {
    role: 'user',
    content: [
      {
        type: 'text',
        text: 'Check if i attach a valid file.',
      },
      {
        type: 'file',
        data: 'gs://loamist-api-documents/dda5a2f6-2e9f-4bcd-aeaf-67ca0238f0f4.pdf',
        mimeType: 'application/pdf',
      }
    ],
  },
])

console.dir(result.text)