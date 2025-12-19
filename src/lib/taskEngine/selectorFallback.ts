import { Task, TaskPlaylist, EnergyState } from './types';

// Fallbacks utilisés par le sélecteur en cas de violation d'invariants
export function applyFallback(
  tasks: Task[],
  userEnergy: EnergyState,
  reason: string
): TaskPlaylist {
  // Fallback 1 : énergie basse → une seule tâche facile
  if (userEnergy.level === 'low') {
    const easyTask = tasks.find(task => task.effort === 'low' && task.duration <= 15);
    if (easyTask) {
      return {
        tasks: [easyTask],
        generatedAt: new Date(),
        energyUsed: userEnergy,
        explanation: 'Fallback appliqué : énergie basse',
        warnings: ['Énergie basse détectée. Une seule tâche facile recommandée.']
      };
    }
  }

  // Fallback 2 : mode survie → tâches urgentes
  const urgentTasks = tasks.filter(task => task.urgency === 'urgent').slice(0, 3);
  if (urgentTasks.length > 0) {
    return {
      tasks: urgentTasks,
      generatedAt: new Date(),
      energyUsed: userEnergy,
      explanation: 'Fallback appliqué : mode survie',
      warnings: [`Mode survie activé : ${reason}`]
    };
  }

  // Fallback 3 : aucun choix
  return {
    tasks: [],
    generatedAt: new Date(),
    energyUsed: userEnergy,
    explanation: 'Fallback appliqué : aucune tâche trouvée',
    warnings: [`Impossible de générer une playlist : ${reason}`]
  };
}
