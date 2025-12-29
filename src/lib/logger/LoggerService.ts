/**
 * LoggerService - Service de logging centralisé pour KairuFlow
 * Implémente un système de logging structuré, typé et extensible
 * 
 * Features:
 * - Niveaux de log (debug, info, warn, error, fatal)
 * - Context enrichment
 * - Timestamps ISO
 * - Log filtering par niveau
 * - Support console et storage
 * - Performance tracking
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: Error;
  duration?: number;
}

export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStoredLogs: number;
  contextPrefix?: string;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '#808080', // Gray
  info: '#0066cc',  // Blue
  warn: '#ff9900',  // Orange
  error: '#cc0000', // Red
  fatal: '#990000', // Dark Red
};

const LOG_LEVEL_ICONS: Record<LogLevel, string> = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
  fatal: '💀',
};

const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableConsole: true,
  enableStorage: true,
  maxStoredLogs: 1000,
};

const nativeConsole: Console | undefined = (globalThis as unknown as { console?: Console }).console;

class LoggerService {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private context?: string;
  private performanceMarks: Map<string, number> = new Map();

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Crée un logger enfant avec un contexte spécifique
   */
  createChild(context: string): LoggerService {
    const child = new LoggerService({
      ...this.config,
      contextPrefix: this.context ? `${this.context}:${context}` : context,
    });
    child.context = this.config.contextPrefix 
      ? `${this.config.contextPrefix}:${context}` 
      : context;
    return child;
  }

  /**
   * Vérifie si un niveau de log doit être affiché
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.minLevel];
  }

  /**
   * Formate une entrée de log pour la console
   */
  private formatForConsole(entry: LogEntry): string {
    const contextStr = entry.context ? `[${entry.context}]` : '';
    return `${LOG_LEVEL_ICONS[entry.level]} ${entry.timestamp} ${contextStr} ${entry.message}`;
  }

  /**
   * Log principal
   */
  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      data,
      error,
    };

    // Console output
    if (this.config.enableConsole) {
      const formatted = this.formatForConsole(entry);
      const style = `color: ${LOG_LEVEL_COLORS[level]}; font-weight: bold;`;

      switch (level) {
        case 'debug':
          nativeConsole?.debug?.(`%c${formatted}`, style, data || '');
          break;
        case 'info':
          nativeConsole?.info?.(`%c${formatted}`, style, data || '');
          break;
        case 'warn':
          nativeConsole?.warn?.(`%c${formatted}`, style, data || '');
          break;
        case 'error':
        case 'fatal':
          nativeConsole?.error?.(`%c${formatted}`, style, error || data || '');
          if (error?.stack) {
            nativeConsole?.error?.(error.stack);
          }
          break;
      }
    }

    // Storage
    if (this.config.enableStorage) {
      this.logs.push(entry);
      
      // Limiter la taille du stockage
      if (this.logs.length > this.config.maxStoredLogs) {
        this.logs = this.logs.slice(-this.config.maxStoredLogs);
      }
    }
  }

  // Méthodes de logging publiques
  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log('error', message, data, error);
  }

  fatal(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log('fatal', message, data, error);
  }

  /**
   * Démarre un timer de performance
   */
  startTimer(label: string): void {
    this.performanceMarks.set(label, performance.now());
    this.debug(`Timer started: ${label}`);
  }

  /**
   * Termine un timer et log la durée
   */
  endTimer(label: string): number {
    const start = this.performanceMarks.get(label);
    if (!start) {
      this.warn(`Timer "${label}" was never started`);
      return 0;
    }

    const duration = performance.now() - start;
    this.performanceMarks.delete(label);
    this.info(`Timer "${label}" completed`, { durationMs: Math.round(duration * 100) / 100 });
    return duration;
  }

  /**
   * Wrapper pour mesurer la durée d'une fonction async
   */
  async measure<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<T> {
    this.startTimer(label);
    try {
      const result = await fn();
      this.endTimer(label);
      return result;
    } catch (error) {
      this.endTimer(label);
      throw error;
    }
  }

  /**
   * Récupère tous les logs stockés
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Récupère les logs filtrés par niveau minimum
   */
  getLogsByLevel(minLevel: LogLevel): LogEntry[] {
    const minPriority = LOG_LEVEL_PRIORITY[minLevel];
    return this.logs.filter(
      log => LOG_LEVEL_PRIORITY[log.level] >= minPriority
    );
  }

  /**
   * Récupère les logs d'un contexte spécifique
   */
  getLogsByContext(context: string): LogEntry[] {
    return this.logs.filter(
      log => log.context?.includes(context)
    );
  }

  /**
   * Efface tous les logs stockés
   */
  clearLogs(): void {
    this.logs = [];
    this.info('Logs cleared');
  }

  /**
   * Exporte les logs en JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Récupère la configuration actuelle
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

// Instance singleton pour l'application
export const logger = new LoggerService();

// Factory pour créer des loggers contextuels
export function createLogger(context: string): LoggerService {
  return logger.createChild(context);
}

// Export de la classe pour les cas où une instance séparée est nécessaire
export { LoggerService };
