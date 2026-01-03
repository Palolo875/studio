/**
 * Genkit is disabled (local-first). Stub kept to avoid import errors.
 */
export type DailyPlaylistInput = { goals: string; priorities: string };
export type DailyPlaylistOutput = { playlist: string };

export async function generateDailyPlaylist(_input: DailyPlaylistInput): Promise<DailyPlaylistOutput> {
  throw new Error('Genkit flow disabled in local-first mode.');
}
