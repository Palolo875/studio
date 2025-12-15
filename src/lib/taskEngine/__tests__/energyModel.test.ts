// Tests pour le modèle d'énergie du Cerveau de KairuFlow - Phase 1

import { createEnergyState, getStabilityPenalty, isEnergyCompatible, predictEnergyState } from '../energyModel';
import { EnergyState } from '../types';

describe('energyModel', () => {
  describe('createEnergyState', () => {
    it('should create an energy state with the correct properties', () => {
      const energy = createEnergyState('high', 'stable');
      expect(energy.level).toBe('high');
      expect(energy.stability).toBe('stable');
    });
  });

  describe('getStabilityPenalty', () => {
    it('should return 1.0 for stable energy', () => {
      expect(getStabilityPenalty('stable')).toBe(1.0);
    });

    it('should return 1.3 for volatile energy', () => {
      expect(getStabilityPenalty('volatile')).toBe(1.3);
    });
  });

  describe('isEnergyCompatible', () => {
    it('should return true for low effort task with low energy', () => {
      const energy: EnergyState = { level: 'low', stability: 'stable' };
      expect(isEnergyCompatible('low', energy)).toBe(true);
    });

    it('should return false for high effort task with low energy', () => {
      const energy: EnergyState = { level: 'low', stability: 'stable' };
      expect(isEnergyCompatible('high', energy)).toBe(false);
    });

    it('should return true for medium effort task with medium energy', () => {
      const energy: EnergyState = { level: 'medium', stability: 'stable' };
      expect(isEnergyCompatible('medium', energy)).toBe(true);
    });

    it('should return true for all effort levels with high energy', () => {
      const energy: EnergyState = { level: 'high', stability: 'stable' };
      expect(isEnergyCompatible('low', energy)).toBe(true);
      expect(isEnergyCompatible('medium', energy)).toBe(true);
      expect(isEnergyCompatible('high', energy)).toBe(true);
    });
  });

  describe('predictEnergyState', () => {
    it('should predict high energy in the morning', () => {
      const energy = predictEnergyState(9);
      expect(energy.level).toBe('medium');
      expect(energy.stability).toBe('stable');
    });

    it('should predict high energy at midday', () => {
      const energy = predictEnergyState(12);
      expect(energy.level).toBe('high');
      expect(energy.stability).toBe('stable');
    });

    it('should predict volatile energy in the afternoon', () => {
      const energy = predictEnergyState(15);
      expect(energy.level).toBe('medium');
      expect(energy.stability).toBe('volatile');
    });

    it('should predict low energy in the evening', () => {
      const energy = predictEnergyState(20);
      expect(energy.level).toBe('low');
      expect(energy.stability).toBe('stable');
    });

    it('should predict volatile low energy at night', () => {
      const energy = predictEnergyState(23);
      expect(energy.level).toBe('low');
      expect(energy.stability).toBe('volatile');
    });
  });
});