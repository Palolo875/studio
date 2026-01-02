// Agrégation hebdomadaire des signaux d'adaptation - Phase 6
import { AdaptationSignal, AdaptationAggregate, EnergyLevel, SystemMode } from './adaptationMemory';

// Fonction utilitaire pour obtenir le numéro de semaine ISO
export function getISOWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

// Fonction d'agrégation hebdomadaire
export function aggregateWeek(signals: AdaptationSignal[]): AdaptationAggregate {
  // Regrouper les signaux par type
  const forcedTasks = signals.filter(s => s.type === "FORCED_TASK");
  const rejectedSuggestions = signals.filter(s => s.type === "REJECTED_SUGGESTION");
  const overruns = signals.filter(s => s.type === "SESSION_OVERRUN");
  const modeOverrides = signals.filter(s => s.type === "MODE_OVERRIDE");
  const energyMismatches = signals.filter(s => s.type === "ENERGY_MISMATCH");
  
  // Calculer les ratios (approximation acceptable: ratios sur signaux observés)
  const totalSignals = Math.max(signals.length, 1);
  
  // Agréger les forced tasks
  const forcedByEnergy = new Map<EnergyLevel, number>();
  const forcedByMode = new Map<SystemMode, number>();
  
  forcedTasks.forEach(signal => {
    const energy = signal.context.energy;
    const mode = signal.context.mode;
    
    forcedByEnergy.set(energy, (forcedByEnergy.get(energy) || 0) + 1);
    forcedByMode.set(mode, (forcedByMode.get(mode) || 0) + 1);
  });
  
  // Agréger les overruns
  let totalOverrunMinutes = 0;
  const timeOfDayCount = { morning: 0, afternoon: 0, evening: 0 };
  
  overruns.forEach(signal => {
    // Cette logique nécessiterait des données supplémentaires sur l'heure de la journée
    // Pour l'exemple, nous utilisons une approximation
    totalOverrunMinutes += signal.context.duration || 15; // Valeur par défaut de 15 minutes
    
    // Classification par heure de la journée (nécessiterait des données réelles)
    const raw = String(signal.context.timeOfDay ?? 'afternoon').toLowerCase();
    const timeOfDay = (raw === 'morning' || raw === 'afternoon' || raw === 'evening') ? raw : 'afternoon';
    timeOfDayCount[timeOfDay] = (timeOfDayCount[timeOfDay] || 0) + 1;
  });
  
  const typicalTimeOfDay = Object.entries(timeOfDayCount)
    .sort((a, b) => b[1] - a[1])[0]?.[0] as "morning" | "afternoon" | "evening" || "afternoon";
  
  // Agréger les mode overrides
  const modeFromTo = new Map<string, number>();
  
  modeOverrides.forEach(signal => {
    // Cette logique nécessiterait des données sur le mode précédent
    // Pour l'exemple, nous utilisons une valeur fictive
    const fromMode = signal.context.fromMode ?? 'CURRENT';
    const toMode = signal.context.mode;
    const transition = `${fromMode}→${toMode}`;
    modeFromTo.set(transition, (modeFromTo.get(transition) || 0) + 1);
  });
  
  // Déterminer les signaux dérivés
  const forcedTasksRatio = forcedTasks.length / totalSignals;
  const needsMoreFlexibility = forcedTasksRatio > 0.6;
  const rejectedRatio = rejectedSuggestions.length / totalSignals;
  const needsMoreStructure = forcedTasksRatio < 0.1 && rejectedRatio > 0.7;

  // Signal: énergie souvent incompatible avec la réalité (Phase 6: energy mismatch)
  const energyMismatchRatio = energyMismatches.length / totalSignals;
  const energyEstimatesOff = energyMismatchRatio > 0.3;

  // Signal: mode trop souvent overridé (mismatch mode)
  const modeOverrideRatio = modeOverrides.length / totalSignals;
  const modeMismatch = modeOverrideRatio > 0.3;
  
  // Retourner l'objet agrégé
  return {
    week: getISOWeekNumber(new Date()),
    patterns: {
      forced_tasks: {
        count: forcedTasks.length,
        ratio: forcedTasksRatio,
        by_energy: forcedByEnergy,
        by_mode: forcedByMode
      },
      rejected_suggestions: {
        count: rejectedSuggestions.length,
        ratio: rejectedRatio,
        common_reasons: [] // À implémenter avec une analyse des motifs
      },
      overrun_sessions: {
        count: overruns.length,
        avg_overrun_minutes: overruns.length > 0 ? totalOverrunMinutes / overruns.length : 0,
        typical_time_of_day: typicalTimeOfDay
      },
      mode_overrides: {
        count: modeOverrides.length,
        from_to: modeFromTo
      }
    },
    signals: {
      needs_more_flexibility: needsMoreFlexibility,
      needs_more_structure: needsMoreStructure,
      energy_estimates_off: energyEstimatesOff,
      mode_mismatch: modeMismatch
    }
  };
}