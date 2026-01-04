'use client';

import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';

let nlpInstance: any = null;

export function getWinkNLP() {
  if (!nlpInstance) {
    nlpInstance = winkNLP(model);
  }
  return nlpInstance;
}

export function quickAnalyze(text: string) {
  const nlp = getWinkNLP();
  const its = nlp.its;
  const doc = nlp.readDoc(text);
  
  return {
    tokens: doc.tokens().out(),
    sentences: doc.sentences().out(),
    lemmas: doc.tokens().out(its.lemma),
    entities: doc.entities().out(its.detail),
  };
}
