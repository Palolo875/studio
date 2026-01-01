/**
 * Hook React pour le traitement NLP des tâches
 * Intègre la détection de langue, l'extraction et le stockage avec approche SOTA
 */
import { useCallback, useState } from 'react';
import { useSettingsStore } from '@/hooks/useSettingsStore';
import { LanguageDetector } from '@/lib/nlp/LanguageDetector';
import { extractTasks } from '@/lib/nlp/TaskExtractor';
import { classifyTask } from '@/lib/nlp/RealTaskClassifier';
import { createFullTask } from '@/lib/nlp/TaskFactory';
import { NlpTaskStorage } from '@/lib/nlp/TaskStorage';
import { nlpTelemetryService } from '@/lib/nlp/TelemetryService';
import { createNLPContractResult } from '@/lib/nlp/NLPContract';
import { basicRawCapture, type RawCaptureTask } from '@/lib/nlp/basicRawCapture';
import type { DBTask } from '@/lib/database';
import type { TaskClassification } from '@/lib/nlp/RealTaskClassifier';

function toContractMode(mode: unknown): 'RAW_CAPTURE_ONLY' | 'NORMAL' | undefined {
  if (mode === 'RAW_CAPTURE_ONLY') return 'RAW_CAPTURE_ONLY';
  if (mode === 'NORMAL' || mode === 'DEGRADED') return 'NORMAL';
  return undefined;
}

type ClassificationShape = TaskClassification & { isUncertain: boolean; unknown?: boolean };

function ensureClassificationShape(classification: unknown): ClassificationShape {
  if (classification && typeof classification === 'object') {
    const c = classification as Partial<ClassificationShape>;
    if (typeof c.isUncertain === 'boolean') return c as ClassificationShape;
    return { ...(c as TaskClassification), isUncertain: false };
  }

  return {
    energyType: 'admin',
    energyConfidence: 0,
    effort: 'M',
    effortConfidence: 0,
    sentiment: 'neutral',
    urgency: 0,
    autoTags: ['uncategorized'],
    isUncertain: true,
    unknown: true,
  };
}

function rawCaptureToDbTasks(items: RawCaptureTask[], source: 'raw' | 'fallback'): DBTask[] {
  const now = new Date();

  return items.map((t, index) => {
    const idBase = source === 'raw' ? 'raw' : 'fallback';
    const id = t.id || `${idBase}-${now.getTime()}-${index}`;

    const urgency: DBTask['urgency'] =
      t.priority === 'high' ? 'high' : t.priority === 'low' ? 'low' : 'medium';

    return {
      id,
      title: t.content,
      description: t.notes,
      duration: 30,
      effort: 'medium',
      urgency,
      impact: 'medium',
      deadline: undefined,
      scheduledTime: undefined,
      category: 'capture',
      status: 'todo',
      activationCount: 0,
      lastActivated: undefined,
      createdAt: t.createdAt ?? now,
      updatedAt: now,
      completedAt: undefined,
      tags: t.tags,
    };
  });
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
      const detectedLang: 'fr' | 'en' | 'es' = settings.autoDetectLanguage
        ? LanguageDetector.detect(text, settings.language).lang
        : settings.language;
      
      // ÉTAPE 2 : Extraction avec mesure du temps
      const extractionStartTime = performance.now();
      const rawTasks = extractTasks(text, detectedLang);
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
        return createFullTask(raw, safeClassification);
      });
      
      // Créer le résultat avec contrat NLP
      const contractResult = createNLPContractResult(rawTasks, toContractMode(nlpTelemetryService.getMode()));
      
      // Stockage optimisé
      const storage = new NlpTaskStorage();
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
        const dbTasks = rawCaptureToDbTasks(rawCaptureTasks, 'raw');

        try {
          const storage = new NlpTaskStorage();
          await storage.bulkStoreTasks(dbTasks);
        } catch {
          // ignore
        }

        return { tasks: dbTasks, success: true, detectedLang: settings.language, mode: 'RAW_CAPTURE_ONLY' };
      }
      
      // Fallbacks multiples
      const fallbackTasks = basicRegexFallback(text);
      const dbTasks = rawCaptureToDbTasks(fallbackTasks, 'fallback');

      try {
        const storage = new NlpTaskStorage();
        await storage.bulkStoreTasks(dbTasks);
      } catch {
        // ignore
      }

      return { tasks: dbTasks, success: false, detectedLang: settings.language };
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
function basicRegexFallback(text: string): RawCaptureTask[] {
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