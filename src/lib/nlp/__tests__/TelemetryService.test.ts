/**
 * Tests pour le service de télémétrie NLP
 */

import { NLPTelemetryService } from '../TelemetryService';

describe('NLPTelemetryService', () => {
  let telemetryService: NLPTelemetryService;

  beforeEach(() => {
    telemetryService = new NLPTelemetryService({
      maxUnknownRate: 0.3,
      maxAmbiguousRate: 0.2,
      minConfidenceThreshold: 0.7,
      windowSize: 10
    });
  });

  describe('recordTask', () => {
    it('devrait enregistrer correctement une tâche traitée', () => {
      const task = {
        metadata: {
          flags: {
            unknown: false,
            ambiguous: false
          },
          detectedLang: 'fr',
          energyConfidence: 0.85
        },
        confidence: 0.9
      };

      telemetryService.recordTask(task, 50);

      const metrics = telemetryService.getMetrics();
      expect(metrics.totalTasks).toBe(1);
      expect(metrics.processingTimeMs).toBe(50);
      expect(metrics.languageDistribution['fr']).toBe(1);
    });

    it('devrait compter correctement les tâches unknown', () => {
      const task = {
        metadata: {
          flags: {
            unknown: true,
            ambiguous: false
          }
        },
        confidence: 0.1
      };

      telemetryService.recordTask(task, 50);

      const metrics = telemetryService.getMetrics();
      expect(metrics.unknownTasks).toBe(1);
      expect(metrics.ambiguousTasks).toBe(0);
    });
  });

  describe('getMode', () => {
    it('devrait retourner le mode NORMAL par défaut', () => {
      expect(telemetryService.getMode()).toBe('NORMAL');
    });

    it('devrait passer en mode RAW_CAPTURE_ONLY si le taux d\'unknown est trop élevé', () => {
      // Enregistrer 4 tâches unknown sur 10 pour dépasser le seuil de 30%
      for (let i = 0; i < 4; i++) {
        const task = {
          metadata: {
            flags: {
              unknown: true
            }
          },
          confidence: 0.1
        };
        telemetryService.recordTask(task, 50);
      }

      // Enregistrer 6 tâches normales
      for (let i = 0; i < 6; i++) {
        const task = {
          metadata: {
            flags: {
              unknown: false
            }
          },
          confidence: 0.9
        };
        telemetryService.recordTask(task, 50);
      }

      expect(telemetryService.getMode()).toBe('RAW_CAPTURE_ONLY');
    });
  });

  describe('reset', () => {
    it('devrait réinitialiser toutes les métriques', () => {
      const task = {
        metadata: {
          flags: {
            unknown: true
          }
        },
        confidence: 0.1
      };

      telemetryService.recordTask(task, 50);
      telemetryService.reset();

      const metrics = telemetryService.getMetrics();
      expect(metrics.totalTasks).toBe(0);
      expect(metrics.unknownTasks).toBe(0);
      expect(metrics.processingTimeMs).toBe(0);
      expect(telemetryService.getMode()).toBe('NORMAL');
    });
  });
});