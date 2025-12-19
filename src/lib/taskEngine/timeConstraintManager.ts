// Gestionnaire de contraintes horaires pour le Cerveau de KairuFlow - Phase 1
import { Task, EnergyState } from './types';
import { Session } from './sessionManager';

/**
 * Contrainte horaire fixe
 */
export interface TimeConstraint {
  /** Heure de début (format HH:MM) */
  startTime: string;
  /** Heure de fin (format HH:MM) */
  endTime: string;
  /** Date de la contrainte */
  date: Date;
  /** Tâche associée à cette contrainte */
  task: Task;
}

/**
 * Résultat de la planification autour des contraintes
 */
export interface ScheduleResult {
  /** Sessions générées */
  sessions: Session[];
  /** Contraintes identifiées */
  constraints: TimeConstraint[];
  /** Créneaux libres */
  freeSlots: {
    start: Date;
    end: Date;
    duration: number; // en minutes
  }[];
}

/**
 * Identifie les contraintes horaires fixes dans les tâches
 * @param tasks Ensemble des tâches
 * @param date Date de référence
 * @returns Liste des contraintes horaires
 */
export function identifyTimeConstraints(tasks: Task[], date: Date): TimeConstraint[] {
  const constraints: TimeConstraint[] = [];
  
  for (const task of tasks) {
    // Vérifier si la tâche a une heure programmée
    if (task.scheduledTime) {
      // Extraire l'heure de scheduledTime (format "HH:MM" ou "HHhMM")
      const timeMatch = task.scheduledTime.match(/(\d{1,2})[:h](\d{2})/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        
        // Créer une contrainte pour cette tâche
        const constraintDate = new Date(date);
        constraintDate.setHours(hours, minutes, 0, 0);
        
        // Estimer la durée de la tâche (durée ou 30 min par défaut)
        const duration = task.duration || 30;
        
        // Calculer l'heure de fin
        const endDate = new Date(constraintDate);
        endDate.setMinutes(endDate.getMinutes() + duration);
        
        constraints.push({
          startTime: task.scheduledTime,
          endTime: `${endDate.getHours()}:${endDate.getMinutes().toString().padStart(2, '0')}`,
          date: constraintDate,
          task
        });
      }
    }
  }
  
  // Trier les contraintes par heure de début
  return constraints.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Calcule les créneaux libres dans une journée
 * @param constraints Contraintes horaires identifiées
 * @param workDayStart Heure de début de journée de travail (format HH:MM)
 * @param workDayEnd Heure de fin de journée de travail (format HH:MM)
 * @returns Créneaux libres
 */
export function calculateFreeSlots(
  constraints: TimeConstraint[],
  workDayStart: string = "08:00",
  workDayEnd: string = "20:00"
): {
  start: Date;
  end: Date;
  duration: number; // en minutes
}[] {
  if (constraints.length === 0) {
    // Si aucune contrainte, toute la journée est libre
    const startDate = new Date();
    const [startHours, startMinutes] = workDayStart.split(':').map(Number);
    startDate.setHours(startHours, startMinutes, 0, 0);
    
    const endDate = new Date();
    const [endHours, endMinutes] = workDayEnd.split(':').map(Number);
    endDate.setHours(endHours, endMinutes, 0, 0);
    
    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    
    return [{
      start: startDate,
      end: endDate,
      duration
    }];
  }
  
  const freeSlots = [];
  const [startHours, startMinutes] = workDayStart.split(':').map(Number);
  const [endHours, endMinutes] = workDayEnd.split(':').map(Number);
  
  // Créer la date de début de journée
  const dayStart = new Date(constraints[0].date);
  dayStart.setHours(startHours, startMinutes, 0, 0);
  
  // Créer la date de fin de journée
  const dayEnd = new Date(constraints[0].date);
  dayEnd.setHours(endHours, endMinutes, 0, 0);
  
  // Commencer par le début de la journée
  let currentSlotStart = dayStart;
  
  // Parcourir les contraintes
  for (const constraint of constraints) {
    // Si il y a un créneau libre avant cette contrainte
    if (currentSlotStart < constraint.date) {
      const duration = (constraint.date.getTime() - currentSlotStart.getTime()) / (1000 * 60);
      freeSlots.push({
        start: currentSlotStart,
        end: constraint.date,
        duration
      });
    }
    
    // Mettre à jour le début du prochain créneau (après la contrainte)
    if (constraint.task.duration) {
      const constraintEnd = new Date(constraint.date);
      constraintEnd.setMinutes(constraintEnd.getMinutes() + constraint.task.duration);
      currentSlotStart = constraintEnd;
    } else {
      // Si pas de durée spécifiée, utiliser l'heure de fin de la contrainte
      const [endHour, endMinute] = constraint.endTime.split(':').map(Number);
      const constraintEnd = new Date(constraint.date);
      constraintEnd.setHours(endHour, endMinute, 0, 0);
      currentSlotStart = constraintEnd;
    }
  }
  
  // Vérifier s'il y a un créneau libre après la dernière contrainte
  if (currentSlotStart < dayEnd) {
    const duration = (dayEnd.getTime() - currentSlotStart.getTime()) / (1000 * 60);
    freeSlots.push({
      start: currentSlotStart,
      end: dayEnd,
      duration
    });
  }
  
  return freeSlots;
}

/**
 * Planifie les sessions autour des contraintes horaires
 * @param tasks Tâches disponibles
 * @param constraints Contraintes horaires
 * @param freeSlots Créneaux libres
 * @param energyProfile Profil énergétique par créneau
 * @returns Résultat de la planification
 */
export function scheduleAroundConstraints(
  tasks: Task[],
  constraints: TimeConstraint[],
  freeSlots: {
    start: Date;
    end: Date;
    duration: number;
  }[],
  energyProfile: (time: Date) => EnergyState
): ScheduleResult {
  const sessions: Session[] = [];
  
  // Créer des sessions pour chaque créneau libre
  for (const slot of freeSlots) {
    // Calculer l'énergie pour ce créneau
    const energy = energyProfile(slot.start);
    
    // Créer une session pour ce créneau
    const session: Session = {
      id: `session_${slot.start.getTime()}`,
      timeSlot: {
        start: slot.start,
        end: slot.end
      },
      state: 'PLANNED',
      playlist: [], // À remplir avec les tâches appropriées
      predictedEnergy: energy,
      fixedTasks: [], // Les tâches avec contraintes fixes sont gérées séparément
      duration: slot.duration,
      timeLabel: `${slot.start.getHours()}:${slot.start.getMinutes().toString().padStart(2, '0')} - ${slot.end.getHours()}:${slot.end.getMinutes().toString().padStart(2, '0')}`
    };
    
    sessions.push(session);
  }
  
  // Ajouter les sessions pour les contraintes fixes
  for (const constraint of constraints) {
    // Calculer l'énergie pour cette contrainte
    const energy = energyProfile(constraint.date);
    
    // Créer une session pour cette contrainte
    const session: Session = {
      id: `constraint_${constraint.date.getTime()}`,
      timeSlot: {
        start: constraint.date,
        end: new Date(constraint.date.getTime() + (constraint.task.duration || 30) * 60 * 1000)
      },
      state: 'PLANNED',
      playlist: [constraint.task], // La tâche contrainte fait partie de la playlist
      predictedEnergy: energy,
      fixedTasks: [constraint.task],
      duration: constraint.task.duration || 30,
      timeLabel: `${constraint.startTime} - ${constraint.endTime} (CONTRAINTE)`
    };
    
    sessions.push(session);
  }
  
  // Trier les sessions par heure de début
  sessions.sort((a, b) => a.timeSlot.start.getTime() - b.timeSlot.start.getTime());
  
  return {
    sessions,
    constraints,
    freeSlots
  };
}

/**
 * Vérifie les contraintes horaires pour un ensemble de tâches
 * @param tasks Tâches à vérifier
 * @param currentDate Date de référence
 * @returns Tâches sans contraintes horaires conflictuelles
 */
export function checkTimeConstraints(tasks: Task[], currentDate: Date): Task[] {
  // Identifier les contraintes horaires
  const constraints = identifyTimeConstraints(tasks, currentDate);
  
  // Résoudre les conflits
  return resolveTimeConflicts(tasks, constraints, currentDate);
}

/**
 * Résout les conflits entre tâches et contraintes horaires
 * @param tasks Tâches à planifier
 * @param constraints Contraintes horaires existantes
 * @param date Date de référence
 * @returns Tâches planifiables
 */
export function resolveTimeConflicts(
  tasks: Task[],
  constraints: TimeConstraint[],
  date: Date
): Task[] {
  // Filtrer les tâches qui ne rentrent pas en conflit avec les contraintes
  return tasks.filter(task => {
    // Si la tâche n'a pas d'horaire programmé, elle est toujours planifiable
    if (!task.scheduledTime) {
      return true;
    }
    
    // Vérifier si l'horaire de la tâche entre en conflit avec une contrainte
    const taskTimeMatch = task.scheduledTime.match(/(\d{1,2})[:h](\d{2})/);
    if (!taskTimeMatch) {
      return true;
    }
    
    const taskHours = parseInt(taskTimeMatch[1], 10);
    const taskMinutes = parseInt(taskTimeMatch[2], 10);
    const taskDate = new Date(date);
    taskDate.setHours(taskHours, taskMinutes, 0, 0);
    
    // Estimer la durée de la tâche
    const taskDuration = task.duration || 30;
    const taskEndDate = new Date(taskDate);
    taskEndDate.setMinutes(taskEndDate.getMinutes() + taskDuration);
    
    // Vérifier les conflits avec toutes les contraintes
    for (const constraint of constraints) {
      const constraintStartDate = constraint.date;
      const constraintDuration = constraint.task.duration || 30;
      const constraintEndDate = new Date(constraintStartDate);
      constraintEndDate.setMinutes(constraintEndDate.getMinutes() + constraintDuration);
      
      // Vérifier si les intervalles se chevauchent
      if (
        (taskDate >= constraintStartDate && taskDate < constraintEndDate) ||
        (taskEndDate > constraintStartDate && taskEndDate <= constraintEndDate) ||
        (taskDate <= constraintStartDate && taskEndDate >= constraintEndDate)
      ) {
        // Conflit détecté
        return false;
      }
    }
    
    // Pas de conflit
    return true;
  });
}
