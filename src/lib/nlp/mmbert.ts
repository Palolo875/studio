'use client';

import { env, pipeline } from '@huggingface/transformers';

// Configuration pour le navigateur uniquement
if (typeof window !== 'undefined') {
  env.allowLocalModels = false;
  env.useBrowserCache = true;
}

let extractor: any | null = null;
let isLoading = false;

export async function getMmBertExtractor() {
  if (extractor) return extractor;
  if (isLoading) {
    // Attendre que l'instance existante soit prête (simplifié pour le POC)
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return extractor;
  }

  isLoading = true;
  try {
    extractor = await pipeline(
      'feature-extraction',
      'jhu-clsp/mmBERT-small', // Utilisation de mmBERT-small comme suggéré
      { 
        device: 'webgpu',
        dtype: 'q8', // Optimisation pour mobile (quantisation)
        progress_callback: (p: any) => {
          console.log(`[mmBERT] Loading: ${p.status} ${p.progress?.toFixed(2) || ''}%`);
        }
      }
    );
    return extractor;
  } catch (error) {
    console.error('[mmBERT] WebGPU failed, falling back to CPU', error);
    extractor = await pipeline(
      'feature-extraction',
      'jhu-clsp/mmBERT-small',
      { dtype: 'q8' }
    );
    return extractor;
  } finally {
    isLoading = false;
  }
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const pipe = await getMmBertExtractor();
  const output = await pipe(texts, { pooling: 'mean', normalize: true });
  return output.tolist();
}
