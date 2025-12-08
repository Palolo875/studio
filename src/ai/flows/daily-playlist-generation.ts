'use server';

/**
 * @fileOverview Generates a daily playlist of tasks based on user goals and priorities.
 *
 * - generateDailyPlaylist - A function that generates the daily playlist.
 * - DailyPlaylistInput - The input type for the generateDailyPlaylist function.
 * - DailyPlaylistOutput - The return type for the generateDailyPlaylist function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DailyPlaylistInputSchema = z.object({
  goals: z.string().describe('The user-defined goals for the day.'),
  priorities: z.string().describe('The user-defined priorities for the day.'),
});
export type DailyPlaylistInput = z.infer<typeof DailyPlaylistInputSchema>;

const DailyPlaylistOutputSchema = z.object({
  playlist: z.string().describe('A list of tasks for the day, based on the goals and priorities.'),
});
export type DailyPlaylistOutput = z.infer<typeof DailyPlaylistOutputSchema>;

export async function generateDailyPlaylist(input: DailyPlaylistInput): Promise<DailyPlaylistOutput> {
  return dailyPlaylistFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dailyPlaylistPrompt',
  input: {schema: DailyPlaylistInputSchema},
  output: {schema: DailyPlaylistOutputSchema},
  prompt: `You are a personal assistant that specializes in generating daily task playlists.

  Based on the user's goals and priorities, create a list of tasks for the day.

  Goals: {{{goals}}}
  Priorities: {{{priorities}}}

  Playlist:`,
});

const dailyPlaylistFlow = ai.defineFlow(
  {
    name: 'dailyPlaylistFlow',
    inputSchema: DailyPlaylistInputSchema,
    outputSchema: DailyPlaylistOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
