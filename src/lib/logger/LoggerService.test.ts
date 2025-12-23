/**
 * LoggerService Unit Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoggerService, createLogger, type LogEntry } from '../LoggerService';

describe('LoggerService', () => {
    let logger: LoggerService;

    beforeEach(() => {
        logger = new LoggerService({
            enableConsole: false, // Disable console for tests
            enableStorage: true,
            minLevel: 'debug',
        });
    });

    describe('Basic Logging', () => {
        it('should log debug messages', () => {
            logger.debug('Test debug message');
            const logs = logger.getLogs();

            expect(logs).toHaveLength(1);
            expect(logs[0].level).toBe('debug');
            expect(logs[0].message).toBe('Test debug message');
        });

        it('should log info messages', () => {
            logger.info('Test info message', { key: 'value' });
            const logs = logger.getLogs();

            expect(logs).toHaveLength(1);
            expect(logs[0].level).toBe('info');
            expect(logs[0].data).toEqual({ key: 'value' });
        });

        it('should log warn messages', () => {
            logger.warn('Test warning');
            const logs = logger.getLogs();

            expect(logs[0].level).toBe('warn');
        });

        it('should log error messages with Error object', () => {
            const error = new Error('Test error');
            logger.error('Something went wrong', error);
            const logs = logger.getLogs();

            expect(logs[0].level).toBe('error');
            expect(logs[0].error).toBe(error);
        });

        it('should log fatal messages', () => {
            logger.fatal('Critical failure');
            const logs = logger.getLogs();

            expect(logs[0].level).toBe('fatal');
        });
    });

    describe('Log Filtering', () => {
        it('should filter logs below minimum level', () => {
            const warnLogger = new LoggerService({
                enableConsole: false,
                enableStorage: true,
                minLevel: 'warn',
            });

            warnLogger.debug('Debug message');
            warnLogger.info('Info message');
            warnLogger.warn('Warning message');
            warnLogger.error('Error message');

            const logs = warnLogger.getLogs();
            expect(logs).toHaveLength(2);
            expect(logs[0].level).toBe('warn');
            expect(logs[1].level).toBe('error');
        });

        it('should filter logs by level when retrieving', () => {
            logger.debug('Debug');
            logger.info('Info');
            logger.warn('Warn');
            logger.error('Error');

            const errorLogs = logger.getLogsByLevel('error');
            expect(errorLogs).toHaveLength(1);
            expect(errorLogs[0].level).toBe('error');
        });
    });

    describe('Child Loggers', () => {
        it('should create child logger with context', () => {
            const childLogger = logger.createChild('ChildModule');
            childLogger.info('Child message');

            const logs = childLogger.getLogs();
            expect(logs[0].context).toBe('ChildModule');
        });

        it('should filter logs by context', () => {
            const child1 = logger.createChild('Module1');
            const child2 = logger.createChild('Module2');

            child1.info('Message from Module1');
            child2.info('Message from Module2');

            const module1Logs = child1.getLogsByContext('Module1');
            expect(module1Logs).toHaveLength(1);
        });
    });

    describe('Performance Tracking', () => {
        it('should measure timer duration', async () => {
            logger.startTimer('test-operation');

            // Simulate some work
            await new Promise(resolve => setTimeout(resolve, 50));

            const duration = logger.endTimer('test-operation');
            expect(duration).toBeGreaterThan(0);
        });

        it('should measure async function duration', async () => {
            const result = await logger.measure('async-op', async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return 'result';
            });

            expect(result).toBe('result');

            const logs = logger.getLogs();
            const timerLog = logs.find(log => log.message.includes('async-op'));
            expect(timerLog).toBeDefined();
        });

        it('should warn when ending non-existent timer', () => {
            const duration = logger.endTimer('non-existent');

            expect(duration).toBe(0);
            const logs = logger.getLogs();
            expect(logs.some(log => log.level === 'warn')).toBe(true);
        });
    });

    describe('Log Management', () => {
        it('should clear all logs', () => {
            logger.info('Message 1');
            logger.info('Message 2');

            logger.clearLogs();

            // clearLogs itself logs a message
            const logs = logger.getLogs();
            expect(logs).toHaveLength(1);
            expect(logs[0].message).toBe('Logs cleared');
        });

        it('should limit stored logs to maxStoredLogs', () => {
            const smallLogger = new LoggerService({
                enableConsole: false,
                enableStorage: true,
                maxStoredLogs: 3,
                minLevel: 'debug',
            });

            for (let i = 0; i < 5; i++) {
                smallLogger.info(`Message ${i}`);
            }

            const logs = smallLogger.getLogs();
            expect(logs).toHaveLength(3);
            expect(logs[0].message).toBe('Message 2');
            expect(logs[2].message).toBe('Message 4');
        });

        it('should export logs as JSON', () => {
            logger.info('Test message');

            const exported = logger.exportLogs();
            const parsed = JSON.parse(exported);

            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed[0].message).toBe('Test message');
        });
    });

    describe('Configuration', () => {
        it('should update configuration', () => {
            logger.updateConfig({ minLevel: 'error' });

            const config = logger.getConfig();
            expect(config.minLevel).toBe('error');
        });

        it('should return a copy of configuration', () => {
            const config1 = logger.getConfig();
            const config2 = logger.getConfig();

            expect(config1).not.toBe(config2);
            expect(config1).toEqual(config2);
        });
    });

    describe('Timestamps', () => {
        it('should include ISO timestamp in logs', () => {
            logger.info('Test');
            const logs = logger.getLogs();

            expect(logs[0].timestamp).toBeDefined();
            expect(() => new Date(logs[0].timestamp)).not.toThrow();
        });
    });
});

describe('createLogger factory', () => {
    it('should create a child logger from singleton', () => {
        const moduleLogger = createLogger('MyModule');

        expect(moduleLogger).toBeInstanceOf(LoggerService);
    });
});
