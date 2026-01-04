/**
 * Classificateur de tâches avec modèles Transformers réels
 * Utilise @xenova/transformers pour la classification NLP côté client
 */

import { createLogger } from '@/lib/logger';
import { RawTaskWithContract } from '@/lib/nlp/NLPContract';

const logger = createLogger('RealTaskClassifier');

declare const process: { env?: Record<string, string | undefined> } | undefined;

function allowModelDownloads(): boolean {
    const v = typeof process !== 'undefined' ? process?.env?.NEXT_PUBLIC_ALLOW_MODEL_DOWNLOADS : undefined;
    if (!v) return true;
    return v === '1' || v === 'true' || v === 'yes';
}

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

const ENERGY_LABELS = ['creative', 'focus', 'admin', 'relationnel', 'perso'];
const EFFORT_LABELS = ['small task', 'medium task', 'large task'];
const SENTIMENT_LABELS = ['positive', 'neutral', 'negative', 'stressed'];

let classifierPipeline: any = null;
let isLoading = false;
let loadingPromise: Promise<void> | null = null;

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
            const { pipeline, env } = await import('@xenova/transformers');

            const downloadsAllowed = allowModelDownloads();

            if (!downloadsAllowed) {
                logger.warn('Model downloads disabled. Falling back to heuristic classifier.');
                classifierPipeline = null;
                return;
            }

            env.allowLocalModels = false;
            env.useBrowserCache = true;
            env.remoteHost = 'https://huggingface.co';
            env.remotePathTemplate = '{model}/resolve/{revision}/';
            
            if ('allowRemoteModels' in env) {
                (env as any).allowRemoteModels = true;
            }

            classifierPipeline = await pipeline(
                'zero-shot-classification',
                'Xenova/distilbert-base-multilingual-cased-sentiments-student',
                {
                    progress_callback: (progress: any) => {
                        if (progress.status === 'done') {
                            logger.info('Modèle NLP chargé avec succès');
                        }
                        if (progress.status === 'progress') {
                            logger.debug(`Model loading: ${Math.round(progress.progress)}%`);
                        }
                    }
                }
            );

            logger.endTimer('model-load');
            logger.info('Classifier model loaded successfully');
        } catch (error) {
            logger.error('Failed to load classifier model', error as Error);
            classifierPipeline = null;
        } finally {
            isLoading = false;
        }
    })();

    await loadingPromise;
}

export async function getClassifier(): Promise<any> {
    await loadClassifier();
    return classifierPipeline;
}

async function classifyWithModel(
    text: string,
    labels: string[]
): Promise<ClassificationResult> {
    await loadClassifier();

    if (!classifierPipeline) {
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

function classifyWithFallback(
    text: string,
    labels: string[]
): ClassificationResult {
    const lowerText = text.toLowerCase();
    const scores: number[] = [];

    for (const label of labels) {
        let score = 0.1;
        if (label === 'creative' && /écrire|design|créer|brainstorm|idée|write|create/.test(lowerText)) score = 0.8;
        else if (label === 'focus' && /coder|analyser|développer|code|analyze|develop|programmer/.test(lowerText)) score = 0.8;
        else if (label === 'admin' && /email|réunion|meeting|administratif|facture|comptabilité/.test(lowerText)) score = 0.8;
        else if (label === 'relationnel' && /appeler|call|client|feedback|réseauter|network/.test(lowerText)) score = 0.8;
        else if (label === 'perso' && /sport|course|famille|personal|family|grocery/.test(lowerText)) score = 0.8;

        if (label === 'small task' && /rapide|quick|5min|10min|email|sms/.test(lowerText)) score = 0.85;
        else if (label === 'medium task' && /1h|2h|rapport|report|meeting/.test(lowerText)) score = 0.75;
        else if (label === 'large task' && /projet|project|complexe|complex|développement|3h/.test(lowerText)) score = 0.8;

        if (label === 'positive' && /bon|bien|excellent|super|great|good|happy/.test(lowerText)) score = 0.7;
        else if (label === 'negative' && /mauvais|mal|terrible|horrible|bad|poor/.test(lowerText)) score = 0.7;
        else if (label === 'stressed' && /urgent|stress|panique|asap|deadline/.test(lowerText)) score = 0.8;
        else if (label === 'neutral') score = 0.3;

        scores.push(score);
    }

    const total = scores.reduce((a, b) => a + b, 0);
    const normalizedScores = scores.map(s => s / total);
    const indexed = labels.map((label, i) => ({ label, score: normalizedScores[i] }));
    indexed.sort((a, b) => b.score - a.score);

    return {
        labels: indexed.map(i => i.label),
        scores: indexed.map(i => i.score),
    };
}

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

function generateTags(
    text: string,
    energyType: string,
    effort: string
): string[] {
    const tags: string[] = [energyType];
    if (effort === 'S') tags.push('quick');
    if (effort === 'L') tags.push('deep-work');
    if (/appeler|call/i.test(text)) tags.push('call');
    if (/email|mail/i.test(text)) tags.push('email');
    if (/rapport|report/i.test(text)) tags.push('report');
    if (/réunion|meeting/i.test(text)) tags.push('meeting');
    if (/client/i.test(text)) tags.push('client');
    if (/deadline|urgent/i.test(text)) tags.push('deadline');
    return [...new Set(tags)];
}

export async function classifyTask(
    rawTask: RawTaskWithContract
): Promise<TaskClassification & { isUncertain: boolean; unknown?: boolean }> {
    const text = rawTask.rawText;
    const CONFIDENCE_THRESHOLD = 0.7;

    try {
        const energyResult = await classifyWithModel(text, ENERGY_LABELS);
        const energyType = energyResult.labels[0] as TaskClassification['energyType'];
        const energyConfidence = energyResult.scores[0];

        const effortResult = await classifyWithModel(text, EFFORT_LABELS);
        const effortMap: Record<string, 'S' | 'M' | 'L'> = {
            'small task': 'S',
            'medium task': 'M',
            'large task': 'L',
        };
        const effort = effortMap[effortResult.labels[0]] || 'M';
        const effortConfidence = effortResult.scores[0];

        const sentimentResult = await classifyWithModel(text, SENTIMENT_LABELS);
        const sentimentMap: Record<string, TaskClassification['sentiment']> = {
            'positive': 'positive',
            'neutral': 'neutral',
            'negative': 'negative',
            'stressed': 'stress',
        };
        const sentiment = sentimentMap[sentimentResult.labels[0]] || 'neutral';

        const urgency = calculateUrgency(text);
        const autoTags = generateTags(text, energyType, effort);
        const isUncertain = energyConfidence < CONFIDENCE_THRESHOLD || effortConfidence < CONFIDENCE_THRESHOLD;

        return {
            energyType,
            energyConfidence,
            effort,
            effortConfidence,
            sentiment,
            urgency,
            autoTags,
            isUncertain,
            unknown: isUncertain
        };
    } catch (error) {
        logger.error('Task classification failed', error as Error);
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

export async function preloadClassifier(): Promise<boolean> {
    try {
        await loadClassifier();
        return classifierPipeline !== null;
    } catch {
        return false;
    }
}

export function isModelLoaded(): boolean {
    return classifierPipeline !== null;
}

export function unloadClassifier(): void {
    classifierPipeline = null;
    logger.info('Classifier model unloaded');
}
