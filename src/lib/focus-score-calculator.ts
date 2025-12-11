import type { Task } from "@/lib/types";

/**
 * Calcule le Focus Score selon la formule spécifiée :
 * baseScore = (tasksCompleted / tasksInPlaylist) × 100
 * energyBonus = +5 pour chaque tâche complétée avec énergie matching
 * focusScore = min(100, baseScore + energyBonus)
 * 
 * @param completedTasks - Les tâches complétées
 * @param totalTasksInPlaylist - Le nombre total de tâches dans la playlist
 * @param userEnergyLevel - Le niveau d'énergie déclaré par l'utilisateur ("high" | "medium" | "low")
 * @returns Le Focus Score calculé
 */
export function calculateFocusScore(
  completedTasks: Task[],
  totalTasksInPlaylist: number,
  userEnergyLevel: "high" | "medium" | "low" | null
): number {
  // Calcul du baseScore
  if (totalTasksInPlaylist === 0) {
    return 0;
  }
  
  const baseScore = (completedTasks.length / totalTasksInPlaylist) * 100;
  
  // Calcul de l'energyBonus
  let energyBonus = 0;
  
  if (userEnergyLevel) {
    // Mapping des niveaux d'énergie
    const energyMap: Record<"high" | "medium" | "low", "high" | "medium" | "low"> = {
      "high": "high",
      "medium": "medium",
      "low": "low"
    };
    
    const mappedEnergyLevel = energyMap[userEnergyLevel];
    
    // Compter les tâches complétées avec matching d'énergie
    completedTasks.forEach(task => {
      if (task.energyRequired && task.energyRequired === mappedEnergyLevel) {
        energyBonus += 5;
      }
    });
  }
  
  // Calcul du focusScore final
  const focusScore = Math.min(100, baseScore + energyBonus);
  
  return Math.round(focusScore);
}

/**
 * Retourne le message approprié selon le Focus Score
 * 
 * @param focusScore - Le Focus Score calculé
 * @returns Le message correspondant
 */
export function getFocusScoreMessage(focusScore: number): string {
  if (focusScore > 80) return "Journée exceptionnelle !";
  if (focusScore > 60) return "Solide performance.";
  if (focusScore > 0) return "Une bonne journée.";
  return "Vous avez avancé, c'est l'essentiel.";
}
