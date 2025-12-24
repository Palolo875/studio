// Page de test pour l'algorithme de playlist SOTA
'use client';
import { runPlaylistAlgorithmTest } from '@/lib/test-playlist-algorithm';
import { useEffect, useState } from 'react';

export default function TestPlaylistPage() {
  const [playlist, setPlaylist] = useState<any[]>([]);

  useEffect(() => {
    const result = runPlaylistAlgorithmTest();
    setPlaylist(result);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test de l'Algorithme de Playlist SOTA</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Playlist Générée :</h2>
        <ul>
          {playlist.map((item, index) => (
            <li key={item.id} className="mb-2">
              <span className="font-bold">{index + 1}. {item.name}</span> - Score: {item.score.toFixed(2)}
              <br />
              <small>Facteurs: Énergie={item.factors.energy.toFixed(2)}, Impact={item.factors.impact.toFixed(2)}, Deadline={item.factors.deadline.toFixed(2)}</small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
