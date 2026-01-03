'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { db, setSetting, upsertTasks, type DBTask } from '@/lib/database';

declare const process: { env?: { NODE_ENV?: string } } | undefined;

function parseBool(v: string | null): boolean {
  return v === '1' || v === 'true' || v === 'yes';
}

function todayYmd(): string {
  return new Date().toISOString().split('T')[0];
}

function createSeedTasks(): DBTask[] {
  const now = new Date();
  return [
    {
      id: `seed-${now.getTime()}-1`,
      title: 'Seed task 1',
      description: 'Test data',
      duration: 30,
      effort: 'low',
      urgency: 'medium',
      impact: 'medium',
      category: 'general',
      status: 'todo',
      activationCount: 0,
      createdAt: now,
      updatedAt: now,
      tags: ['Seed'],
    },
    {
      id: `seed-${now.getTime()}-2`,
      title: 'Seed task 2',
      description: 'Test data',
      duration: 45,
      effort: 'medium',
      urgency: 'high',
      impact: 'medium',
      deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      category: 'general',
      status: 'todo',
      activationCount: 0,
      createdAt: now,
      updatedAt: now,
      tags: ['Seed'],
    },
  ];
}

export default function TestSeedPage() {
  const params = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setStatus('working');
      setMessage('');

      const isProd = typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production';
      if (isProd) {
        if (cancelled) return;
        setStatus('error');
        setMessage('disabled');
        return;
      }

      try {
        const reset = parseBool(params.get('reset'));
        const morning = params.get('morning');
        const seedTasks = parseBool(params.get('seedTasks'));

        if (reset) {
          await db.delete();
          await db.open();
        }

        if (morning === 'complete') {
          await setSetting('morning.lastCheckin', todayYmd());
          await setSetting('morning.todayEnergyLevel', 'normal');
          await setSetting('morning.todayIntention', 'focus');
        }

        if (morning === 'incomplete') {
          await setSetting('morning.lastCheckin', '');
        }

        if (seedTasks) {
          await upsertTasks(createSeedTasks());
        }

        if (cancelled) return;
        setStatus('done');
        setMessage('ok');
      } catch (e) {
        if (cancelled) return;
        setStatus('error');
        setMessage(e instanceof Error ? e.message : 'error');
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [params]);

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Test Seed</h1>
      <p data-testid="seed-status">{status}</p>
      <p data-testid="seed-message">{message}</p>
    </main>
  );
}
