/**
 * Hook React pour le traitement NLP des tâches
 * Intègre la détection de langue, l'extraction et le stockage avec approche SOTA
 */
import { useCallback, useState } from 'react';
import { useSettingsStore } from '@/hooks/useSettingsStore';
import { LanguageDetector } from '@/lib/nlp/LanguageDetector';
import { extractTasks } from '@/lib/nlp/TaskExtractor';
import { classifyTask } from '@/lib/nlp/TaskClassifier';
import { createFullTask } from '@/lib/nlp/TaskFactory';
import { NlpTaskStorage } from '@/lib/nlp/TaskStorage';
import { nlpTelemetryService } from '@/lib/nlp/TelemetryService';
import { createNLPContractResult } from '@/lib/nlp/NLPContract';
import { basicRawCapture } from '@/lib/nlp/basicRawCapture';
import { db, type DBTask } from '@/lib/database';

function toContractMode(mode: unknown): 'RAW_CAPTURE_ONLY' | 'NORMAL' | undefined {
  if (mode === 'RAW_CAPTURE_ONLY') return 'RAW_CAPTURE_ONLY';
  if (mode === 'NORMAL' || mode === 'DEGRADED') return 'NORMAL';
  return undefined;
}

function ensureClassificationShape(classification: unknown): unknown {
  if (classification && typeof classification === 'object') {
    const c = classification as Record<string, unknown>;
    if (typeof c.isUncertain === 'boolean') return classification;
    return { ...c, isUncertain: false };
  }
  return { isUncertain: true };
}

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

export function useNLP() {
  const { settings } = useSettingsStore();
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
      
      // ÉTAPE 2 : Extraction avec mesure du temps
      const extractionStartTime = performance.now();
      const rawTasks = extractTasks(text, detectedLang as 'fr' | 'en' | 'es');
      const extractionTime = performance.now() - extractionStartTime;
      
      // Enregistrer les métriques de télémétrie
      nlpTelemetryService.recordTask(rawTasks[0] || {}, extractionTime);
      
      // ÉTAPE 3 : Classification
      const classifiedTasks = await Promise.all(
        rawTasks.map(async (task) => ({
          raw: task,
          classification: await classifyTask(task)
        }))
      );
      
      // ÉTAPE 4 : Fusion + Stockage ✅ NOUVEAU
      const fullTasks: DBTask[] = classifiedTasks.map(({ raw, classification }) => {
        const safeClassification = ensureClassificationShape(classification);
        return createFullTask(raw, safeClassification as any);
      });
      
      // Créer le résultat avec contrat NLP
      const contractResult = createNLPContractResult(rawTasks, toContractMode(nlpTelemetryService.getMode()));
      
      // Stockage optimisé
      const storage = new NlpTaskStorage(db);
      await storage.bulkStoreTasks(fullTasks);
      
      // Refresh UI
      window.dispatchEvent(new CustomEvent('nlptasks:processed', {
        detail: { tasks: fullTasks, count: fullTasks.length }
      }));
      
      return { 
        tasks: fullTasks, 
        detectedLang, 
        success: true,
        contractResult
      };
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Extraction échouée, mode manuel activé';
      setError(errorMessage);
      
      // Enregistrer l'erreur dans la télémétrie
      nlpTelemetryService.recordProcessingError();
      
      // Vérifier si le mode RAW_CAPTURE_ONLY doit être activé
      if (nlpTelemetryService.getMode() === 'RAW_CAPTURE_ONLY') {
        // Mode capture brute uniquement
        const rawCaptureTasks = basicRawCapture(text);
        return { tasks: rawCaptureTasks, success: true, detectedLang: settings.language, mode: 'RAW_CAPTURE_ONLY' };
      }
      
      // Fallbacks multiples
      const fallbackTasks = basicRegexFallback(text);
      return { tasks: fallbackTasks, success: false, detectedLang: settings.language };
    } finally {
      setIsProcessing(false);
    }
  }, [settings]);

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