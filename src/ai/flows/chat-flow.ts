'use server';
/**
 * @fileOverview This file defines a Genkit flow for handling chat conversations.
 *
 * - chatFlow - A function that takes a user message and returns an AI-generated response.
 * - ChatFlowInput - The input type for the chatFlow function.
 * - ChatFlowOutput - The return type for the chatFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatFlowInputSchema = z.object({
  message: z.string().describe('The user message to respond to.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional().describe('Optional conversation history.'),
});
export type ChatFlowInput = z.infer<typeof ChatFlowInputSchema>;

const ChatFlowOutputSchema = z.object({
  response: z.string().describe('The AI-generated response.'),
});
export type ChatFlowOutput = z.infer<typeof ChatFlowOutputSchema>;

export async function chat(input: ChatFlowInput): Promise<ChatFlowOutput> {
  return chatContinuationFlow(input);
}

const chatPrompt = ai.definePrompt({
  name: 'chatPrompt',
  input: {schema: ChatFlowInputSchema},
  output: {schema: ChatFlowOutputSchema},
  prompt: `You are Academix, a helpful AI assistant. Continue the conversation.

  {{#if history}}
  {{#each history}}
  {{#if (eq role "user")}}User: {{content}}{{/if}}
  {{#if (eq role "model")}}AI: {{content}}{{/if}}
  {{/each}}
  {{/if}}
  User: {{message}}
  AI:`,
  // Using the default model specified in genkit.ts (openai/gpt-4o)
  config: {
    // Adjust safety settings if needed for OpenAI, though they are more relevant for Gemini
    // OpenAI has its own content moderation.
    // Example safety settings (if this were Gemini):
    // safetySettings: [
    //   {
    //     category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    //     threshold: 'BLOCK_NONE',
    //   },
    // ],
  }
});

const chatContinuationFlow = ai.defineFlow(
  {
    name: 'chatContinuationFlow',
    inputSchema: ChatFlowInputSchema,
    outputSchema: ChatFlowOutputSchema,
  },
  async (input) => {
    const {output} = await chatPrompt(input);
    if (!output) {
      throw new Error("AI failed to generate a response.");
    }
    return output;
  }
);
