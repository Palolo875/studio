/**
 * Classificateur de tâches avec modèles Transformers réels
 * Utilise @xenova/transformers pour la classification NLP côté client
 * 
 * Features:
 * - Classification zero-shot multilingue
 * - Fallback vers heuristiques si modèle non disponible
 * - Caching pour performances optimales
 * - Logging structuré
 */

import { createLogger } from '@/lib/logger';
import { RawTaskWithContract } from '@/lib/nlp/NLPContract';

const logger = createLogger('RealTaskClassifier');

// Types pour la classification
export interface TaskClassification {
    energyType: 'creative' | 'focus' | 'admin' | 'relationnel' | 'perso';
    energyConfidence: number;
    effort: 'S' | 'M' | 'L';
    effortConfidence: number;
    sentiment: 'positive' | 'neutral' | 'negative' | 'stress';
    urgency: number;
    autoTags: string[];
}

interface ClassificationResult {
    labels: string[];
    scores: number[];
}

// Labels pour la classification
const ENERGY_LABELS = ['creative', 'focus', 'admin', 'relationnel', 'perso'];
const EFFORT_LABELS = ['small task', 'medium task', 'large task'];
const SENTIMENT_LABELS = ['positive', 'neutral', 'negative', 'stressed'];

// État du modèle
let classifierPipeline: any = null;
let isLoading = false;
let loadingPromise: Promise<void> | null = null;

/**
 * Charge le modèle de classification (lazy loading)
 */
async function loadClassifier(): Promise<void> {
    if (classifierPipeline) return;
    if (isLoading && loadingPromise) {
        await loadingPromise;
        return;
    }

    isLoading = true;
    logger.info('Loading transformer classifier model...');
    logger.startTimer('model-load');

    loadingPromise = (async () => {
        try {
            // Import dynamique pour éviter les problèmes de build
            const { pipeline, env } = await import('@xenova/transformers');

            // Configurer explicitement pour l'environnement Replit/Browser
            env.allowLocalModels = false;
            env.useBrowserCache = true;
            env.remoteHost = 'https://huggingface.co';
            env.remotePathTemplate = '{model}/resolve/{revision}/';

            classifierPipeline = await pipeline(
                'zero-shot-classification',
                'Xenova/distilbert-base-multilingual-cased-sentiments-student',
                {
                    progress_callback: (progress: any) => {
                        if (progress.status === 'progress') {
                            logger.debug(`Model loading: ${Math.round(progress.progress)}%`);
                        }
                    },
                }
            );

            logger.endTimer('model-load');
            logger.info('Classifier model loaded successfully');
        } catch (error) {
            logger.error('Failed to load classifier model', error as Error);
            // Ne pas relancer l'erreur - on utilisera le fallback
            classifierPipeline = null;
        } finally {
            isLoading = false;
        }
    })();

    await loadingPromise;
}

/**
 * Classification avec le vrai modèle
 */
async function classifyWithModel(
    text: string,
    labels: string[]
): Promise<ClassificationResult> {
    await loadClassifier();

    if (!classifierPipeline) {
        logger.warn('Model not available, using fallback');
        return classifyWithFallback(text, labels);
    }

    try {
        const result = await classifierPipeline(text, labels, {
            multi_label: false,
        });

        return {
            labels: result.labels,
            scores: result.scores,
        };
    } catch (error) {
        logger.error('Classification failed', error as Error);
        return classifyWithFallback(text, labels);
    }
}

/**
 * Classification de fallback basée sur des heuristiques
 */
function classifyWithFallback(
    text: string,
    labels: string[]
): ClassificationResult {
    const lowerText = text.toLowerCase();
    const scores: number[] = [];

    // Heuristiques pour chaque type de label
    for (const label of labels) {
        let score = 0.1; // Score de base

        // Energy types
        if (label === 'creative') {
            if (/écrire|design|créer|brainstorm|idée|write|create/.test(lowerText)) {
                score = 0.8;
            }
        } else if (label === 'focus') {
            if (/coder|analyser|développer|code|analyze|develop|programmer/.test(lowerText)) {
                score = 0.8;
            }
        } else if (label === 'admin') {
            if (/email|réunion|meeting|administratif|facture|comptabilité/.test(lowerText)) {
                score = 0.8;
            }
        } else if (label === 'relationnel') {
            if (/appeler|call|client|feedback|réseauter|network/.test(lowerText)) {
                score = 0.8;
            }
        } else if (label === 'perso') {
            if (/sport|course|famille|personal|family|grocery/.test(lowerText)) {
                score = 0.8;
            }
        }

        // Effort levels
        if (label === 'small task') {
            if (/rapide|quick|5min|10min|email|sms/.test(lowerText)) {
                score = 0.85;
            }
        } else if (label === 'medium task') {
            if (/1h|2h|rapport|report|meeting/.test(lowerText)) {
                score = 0.75;
            }
        } else if (label === 'large task') {
            if (/projet|project|complexe|complex|développement|3h/.test(lowerText)) {
                score = 0.8;
            }
        }

        // Sentiment
        if (label === 'positive') {
            if (/bon|bien|excellent|super|great|good|happy/.test(lowerText)) {
                score = 0.7;
            }
        } else if (label === 'negative') {
            if (/mauvais|mal|terrible|horrible|bad|poor/.test(lowerText)) {
                score = 0.7;
            }
        } else if (label === 'stressed') {
            if (/urgent|stress|panique|asap|deadline/.test(lowerText)) {
                score = 0.8;
            }
        } else if (label === 'neutral') {
            score = 0.3; // Neutral est le fallback
        }

        scores.push(score);
    }

    // Normaliser et trier
    const total = scores.reduce((a, b) => a + b, 0);
    const normalizedScores = scores.map(s => s / total);

    // Trier par score décroissant
    const indexed = labels.map((label, i) => ({ label, score: normalizedScores[i] }));
    indexed.sort((a, b) => b.score - a.score);

    return {
        labels: indexed.map(i => i.label),
        scores: indexed.map(i => i.score),
    };
}

/**
 * Calcul de l'urgence
 */
function calculateUrgency(text: string): number {
    const urgencyPatterns = [
        { pattern: /urgent|asap|immédiat|immediate/i, weight: 1.0 },
        { pattern: /aujourd'hui|today|maintenant|now/i, weight: 0.9 },
        { pattern: /demain|tomorrow/i, weight: 0.7 },
        { pattern: /deadline|échéance/i, weight: 0.8 },
        { pattern: /priorité|priority|important/i, weight: 0.6 },
    ];

    let maxUrgency = 0;
    for (const { pattern, weight } of urgencyPatterns) {
        if (pattern.test(text)) {
            maxUrgency = Math.max(maxUrgency, weight);
        }
    }

    return maxUrgency;
}

/**
 * Génération automatique de tags
 */
function generateTags(
    text: string,
    energyType: string,
    effort: string
): string[] {
    const tags: string[] = [energyType];

    // Ajouter le niveau d'effort
    if (effort === 'S') tags.push('quick');
    if (effort === 'L') tags.push('deep-work');

    // Détecter des patterns spécifiques
    if (/appeler|call/i.test(text)) tags.push('call');
    if (/email|mail/i.test(text)) tags.push('email');
    if (/rapport|report/i.test(text)) tags.push('report');
    if (/réunion|meeting/i.test(text)) tags.push('meeting');
    if (/client/i.test(text)) tags.push('client');
    if (/deadline|urgent/i.test(text)) tags.push('deadline');

    return [...new Set(tags)]; // Dédupliquer
}

/**
 * Classification complète d'une tâche
 */
export async function classifyTask(
    rawTask: RawTaskWithContract
): Promise<TaskClassification & { isUncertain: boolean; unknown?: boolean }> {
    const text = rawTask.rawText;
    const CONFIDENCE_THRESHOLD = 0.7; // Documentation Phase 2

    logger.debug('Classifying task', { text: text.substring(0, 50) });
    logger.startTimer('classify-task');

    try {
        // Classification énergie
        const energyResult = await classifyWithModel(text, ENERGY_LABELS);
        const energyType = energyResult.labels[0] as TaskClassification['energyType'];
        const energyConfidence = energyResult.scores[0];

        // Classification effort
        const effortResult = await classifyWithModel(text, EFFORT_LABELS);
        const effortMap: Record<string, 'S' | 'M' | 'L'> = {
            'small task': 'S',
            'medium task': 'M',
            'large task': 'L',
        };
        const effort = effortMap[effortResult.labels[0]] || 'M';
        const effortConfidence = effortResult.scores[0];

        // Sentiment
        const sentimentResult = await classifyWithModel(text, SENTIMENT_LABELS);
        const sentimentMap: Record<string, TaskClassification['sentiment']> = {
            'positive': 'positive',
            'neutral': 'neutral',
            'negative': 'negative',
            'stressed': 'stress',
        };
        const sentiment = sentimentMap[sentimentResult.labels[0]] || 'neutral';

        // Urgence et tags
        const urgency = calculateUrgency(text);
        const autoTags = generateTags(text, energyType, effort);

        // Déterminer si la classification est incertaine (Zone de Quarantaine)
        const isUncertain = energyConfidence < CONFIDENCE_THRESHOLD || effortConfidence < CONFIDENCE_THRESHOLD;

        // Règle Phase 2: si confiance < 0.7 => "unknown" (sortie valide, non bloquante)
        const isUnknown = isUncertain;

        logger.endTimer('classify-task');

        return {
            energyType,
            energyConfidence,
            effort,
            effortConfidence,
            sentiment,
            urgency,
            autoTags,
            isUncertain,
            unknown: isUnknown
        };
    } catch (error) {
        logger.error('Task classification failed', error as Error);

        // Retourner des valeurs par défaut avec flag d'incertitude
        return {
            energyType: 'admin',
            energyConfidence: 0.5,
            effort: 'M',
            effortConfidence: 0.5,
            sentiment: 'neutral',
            urgency: 0.5,
            autoTags: ['uncategorized'],
            isUncertain: true,
            unknown: true
        };
    }
}

/**
 * Pré-charge le modèle en arrière-plan
 */
export async function preloadClassifier(): Promise<boolean> {
    try {
        await loadClassifier();
        return classifierPipeline !== null;
    } catch {
        return false;
    }
}

/**
 * Vérifie si le modèle est chargé
 */
export function isModelLoaded(): boolean {
    return classifierPipeline !== null;
}

/**
 * Décharge le modèle pour libérer la mémoire
 */
export function unloadClassifier(): void {
    classifierPipeline = null;
    logger.info('Classifier model unloaded');
}
