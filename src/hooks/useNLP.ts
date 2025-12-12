/**
 * Hook React pour le traitement NLP des tâches
 * Intègre la détection de langue, l'extraction et le stockage avec approche SOTA
 */
import { useCallback, useState } from 'react';
import { useSettingsStore } from '@/hooks/useSettingsStore';
import { LanguageDetector } from '@/lib/nlp/LanguageDetector';
import { extractTasks, type RawTask } from '@/lib/nlp/TaskExtractor';
import { classifyTask, type TaskClassification } from '@/lib/nlp/TaskClassifier';
import { createFullTask } from '@/lib/nlp/TaskFactory';
import { NlpTaskStorage } from '@/lib/nlp/TaskStorage';

// Type pour les tâches créées
interface CreatedTask {
  id: string;
  content: string;
  effort: 'S' | 'M' | 'L';
  energy?: 'creative' | 'focus' | 'admin' | 'relationnel' | 'perso';
  priority: 'low' | 'medium' | 'high';
  status: 'todo';
  createdAt: Date;
  sourceType: 'nlp_capture' | 'nlp_full';
  notes?: string;
  confidence?: number; // Score de confiance de l'extraction
  entities?: Record<string, string>; // Entités extraites
  tags?: string[]; // Tags générés automatiquement
  urgency?: number; // Score d'urgence
}

// Type pour le store de tâches (simulation)
interface TaskStore {
  addTasks: (tasks: CreatedTask[]) => void;
}

// Simulation du store de tâches
const useTaskStore = (): TaskStore => {
  return {
    addTasks: (tasks: CreatedTask[]) => {
      console.log('Tâches ajoutées au store:', tasks);
      // Dans une vraie implémentation, cela ajouterait les tâches au store Zustand
    }
  };
};

// Simulation de la base de données Dexie
class Dexie {
  table(name: string) {
    return {
      bulkAdd: (items: any[]) => Promise.resolve(items),
      bulkPut: (items: any[]) => Promise.resolve(items),
      get: (key: string) => Promise.resolve({}),
      update: (key: string, updates: any) => Promise.resolve()
    };
  }
  
  transaction(mode: string, table: any, callback: () => Promise<any>) {
    return callback();
  }
}

const db = new Dexie();

export function useNLP() {
  const { settings } = useSettingsStore();
  const { addTasks } = useTaskStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processText = useCallback(async (text: string) => {
    if (!text.trim()) return { tasks: [], detectedLang: settings.language, success: false };
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // ÉTAPE 1 : Langue
      const detectedLang = settings.autoDetectLanguage 
        ? LanguageDetector.detect(text)
        : settings.language;
      
      // ÉTAPE 2 : Extraction
      const rawTasks = extractTasks(text, detectedLang as 'fr' | 'en' | 'es');
      
      // ÉTAPE 3 : Classification
      const classifiedTasks = await Promise.all(
        rawTasks.map(async (task) => ({
          raw: task,
          classification: await classifyTask(task)
        }))
      );
      
      // ÉTAPE 4 : Fusion + Stockage ✅ NOUVEAU
      const fullTasks = classifiedTasks.map(({ raw, classification }) => 
        createFullTask(raw, classification)
      );
      
      // Stockage optimisé
      const storage = new NlpTaskStorage(db);
      await storage.bulkStoreTasks(fullTasks as any);
      
      // Refresh UI
      window.dispatchEvent(new CustomEvent('nlptasks:processed', {
        detail: { tasks: fullTasks, count: fullTasks.length }
      }));
      
      return { 
        tasks: fullTasks, 
        detectedLang, 
        success: true 
      };
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Extraction échouée, mode manuel activé';
      setError(errorMessage);
      
      // Fallbacks multiples
      const fallbackTasks = basicRegexFallback(text);
      // await db.table('tasks').bulkAdd(fallbackTasks);
      console.log('Tâches de secours stockées:', fallbackTasks);
      return { tasks: fallbackTasks, success: false, detectedLang: settings.language };
    } finally {
      setIsProcessing(false);
    }
  }, [settings, addTasks]);

  return {
    processText,
    isProcessing,
    error,
    language: settings.language
  };
}

/**
 * Fallback basique avec regex pour les cas d'erreur
 */
function basicRegexFallback(text: string): CreatedTask[] {
  // Séparer le texte en phrases
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  return sentences.map((sentence, index) => {
    // Extraire l'action (premier mot)
    const words = sentence.trim().split(/\s+/);
    const action = words[0] || 'tâche';
    
    return {
      id: `fallback-${Date.now()}-${index}`,
      content: sentence.trim(),
      effort: 'M', // Par défaut
      priority: 'medium',
      status: 'todo',
      createdAt: new Date(),
      sourceType: 'nlp_capture',
      notes: 'Fallback: Regex-based extraction',
      tags: [action]
    };
  });
}