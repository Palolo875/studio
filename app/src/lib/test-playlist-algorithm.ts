// Fichier de test pour l'algorithme de playlist SOTA
import { PlaylistGeneratorSOTA } from './playlist/PlaylistGeneratorSOTA';
import { Task } from './types';

export function runPlaylistAlgorithmTest() {
  console.log("Démarrage du test de l'algorithme de playlist SOTA...");

  // Créer une instance du générateur de playlist
  const generator = new PlaylistGeneratorSOTA();

  // Tâches de test
  const tasks: Task[] = [
    {
      id: 'task-1',
      name: 'Tâche urgente et importante',
      priority: 'high',
      energyRequired: 'high',
      tags: ['projet-a', 'client-x'],
      estimatedDuration: 120
    },
    {
      id: 'task-2',
      name: 'Tâche rapide et facile',
      priority: 'low',
      energyRequired: 'low',
      tags: ['admin'],
      estimatedDuration: 15
    },
    {
      id: 'task-3',
      name: 'Tâche créative',
      priority: 'medium',
      energyRequired: 'high',
      tags: ['design', 'brainstorming'],
      estimatedDuration: 90
    },
    {
      id: 'task-4',
      name: 'Tâche de routine',
      priority: 'medium',
      energyRequired: 'medium',
      tags: ['routine', 'maintenance'],
      estimatedDuration: 45
    }
  ];

  // Générer la playlist
  const playlist = generator.generatePlaylist(tasks);

  // Afficher les résultats
  console.log("\n--- Playlist Générée ---");
  playlist.forEach((item, index) => {
    console.log(`${index + 1}. ${item.name} (Score: ${item.score.toFixed(2)})`);
    console.log(`   - Facteurs: Énergie=${item.factors.energy.toFixed(2)}, Impact=${item.factors.impact.toFixed(2)}, Deadline=${item.factors.deadline.toFixed(2)}`);
  });

  console.log("\n--- Analyse de l'Équilibre ---");
  const highImpactTasks = playlist.filter(task => task.isHighImpact).length;
  const keystoneHabits = playlist.filter(task => task.isKeystoneHabit).length;

  console.log(`Tâches à haut impact: ${highImpactTasks}`);
  console.log(`Habitudes clés: ${keystoneHabits}`);

  console.log("\nTest terminé.");
  return playlist;
}
