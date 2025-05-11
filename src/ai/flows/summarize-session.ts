// Summarize session flow
'use server';
/**
 * @fileOverview This file defines a Genkit flow for summarizing a conversation session.
 *
 * - summarizeSession - A function that takes conversation messages and generates a concise title.
 * - SummarizeSessionInput - The input type for the summarizeSession function.
 * - SummarizeSessionOutput - The return type for the summarizeSession function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeSessionInputSchema = z.object({
  messages: z
    .string()
    .describe('The complete transcript of messages from the conversation session.'),
});
export type SummarizeSessionInput = z.infer<typeof SummarizeSessionInputSchema>;

const SummarizeSessionOutputSchema = z.object({
  title: z.string().describe('A concise title summarizing the conversation session.'),
});
export type SummarizeSessionOutput = z.infer<typeof SummarizeSessionOutputSchema>;

export async function summarizeSession(input: SummarizeSessionInput): Promise<SummarizeSessionOutput> {
  return summarizeSessionFlow(input);
}

const summarizeSessionPrompt = ai.definePrompt({
  name: 'summarizeSessionPrompt',
  input: {schema: SummarizeSessionInputSchema},
  output: {schema: SummarizeSessionOutputSchema},
  prompt: `You are an AI assistant designed to generate titles for chat sessions.

  Given the following conversation transcript, generate a concise and descriptive title that captures the essence of the discussion.

  Conversation Transcript:
  {{messages}}

  Title:`,
});

const summarizeSessionFlow = ai.defineFlow(
  {
    name: 'summarizeSessionFlow',
    inputSchema: SummarizeSessionInputSchema,
    outputSchema: SummarizeSessionOutputSchema,
  },
  async input => {
    const {output} = await summarizeSessionPrompt(input);
    return output!;
  }
);
