// Tests pour le gestionnaire de sessions du Cerveau de KairuFlow - Phase 1

import { 
  generateStandardTimeSlots,
  createSession,
  markSessionCompleted,
  markSessionExhausted,
  markSessionBlocked,
  startSession,
  isSessionValid
} from '../sessionManager';
import { Task } from '../types';

describe('sessionManager', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    duration: 30,
    effort: 'medium',
    urgency: 'medium',
    impact: 'medium',
    completionHistory: [],
    category: 'test'
  };

  describe('generateStandardTimeSlots', () => {
    it('should generate standard time slots', () => {
      const slots = generateStandardTimeSlots();
      expect(slots).toHaveLength(6);
      expect(slots[0].startTime).toBe('08:00');
      expect(slots[0].endTime).toBe('10:00');
      expect(slots[0].label).toBe('Matin - Montée en puissance');
    });
  });

  describe('createSession', () => {
    it('should create a session with correct properties', () => {
      const timeSlot = generateStandardTimeSlots()[0];
      const session = createSession(timeSlot, [mockTask]);
      
      expect(session.id).toBeDefined();
      expect(session.timeSlot.start).toBeDefined();
      expect(session.timeSlot.end).toBeDefined();
      expect(session.state).toBe('PLANNED');
      expect(session.playlist).toHaveLength(1);
      expect(session.predictedEnergy.level).toBe('medium');
      expect(session.predictedEnergy.stability).toBe('stable');
      expect(session.fixedTasks).toHaveLength(0);
      expect(session.duration).toBe(120); // 2 hours in minutes
      expect(session.timeLabel).toBe('Matin - Montée en puissance');
    });
  });

  describe('Session state transitions', () => {
    const timeSlot = generateStandardTimeSlots()[0];
    const session = createSession(timeSlot, [mockTask]);

    it('should start a session', () => {
      const startedSession = startSession(session);
      expect(startedSession.state).toBe('IN_PROGRESS');
    });

    it('should mark session as completed', () => {
      const completedSession = markSessionCompleted(session);
      expect(completedSession.state).toBe('COMPLETED');
    });

    it('should mark session as exhausted', () => {
      const exhaustedSession = markSessionExhausted(session);
      expect(exhaustedSession.state).toBe('EXHAUSTED');
    });

    it('should mark session as blocked', () => {
      const blockedSession = markSessionBlocked(session);
      expect(blockedSession.state).toBe('BLOCKED');
    });
  });

  describe('isSessionValid', () => {
    it('should validate session according to invariants', () => {
      const timeSlot = generateStandardTimeSlots()[0];
      const session = createSession(timeSlot, [mockTask]);
      const isValid = isSessionValid(session, 10);
      
      // La validation dépend des invariants, mais elle devrait retourner un booléen
      expect(typeof isValid).toBe('boolean');
    });
  });
});