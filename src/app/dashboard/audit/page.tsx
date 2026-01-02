'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getAllBrainDecisions, getBrainDecision } from '@/lib/taskEngine/decisionLogger';
import { getExplanationForDecisionAsync, formatExplanationForUser } from '@/lib/taskEngine/decisionExplanation';
import { replayDecisionAsync } from '@/lib/taskEngine/brainEngine';
import { getChallengesForDecisionAsync, type UserChallenge } from '@/lib/taskEngine/userChallenge';
import type { BrainDecision, BrainOutput } from '@/lib/taskEngine/brainContracts';

function stringifyForAudit(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, v) => {
      if (v instanceof Date) return v.toISOString();
      if (v instanceof Map) return { __type: 'Map', entries: Array.from(v.entries()) };
      return v;
    },
    2
  );
}

type ReplayStatus =
  | { state: 'idle' }
  | { state: 'running' }
  | { state: 'done'; match: boolean; replayed: BrainOutput }
  | { state: 'error'; message: string };

export default function AuditPage() {
  const [decisions, setDecisions] = useState<BrainDecision[]>([]);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<BrainDecision | null>(null);
  const [selectedExplanation, setSelectedExplanation] = useState<string>('');
  const [selectedChallenges, setSelectedChallenges] = useState<UserChallenge[]>([]);
  const [replayStatus, setReplayStatus] = useState<ReplayStatus>({ state: 'idle' });

  useEffect(() => {
    let alive = true;
    getAllBrainDecisions()
      .then((items) => {
        if (!alive) return;
        const sorted = [...items].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setDecisions(sorted);
        if (!selectedDecisionId && sorted.length > 0) setSelectedDecisionId(sorted[0].id);
      })
      .catch(() => {
        if (!alive) return;
        setDecisions([]);
      });

    return () => {
      alive = false;
    };
  }, [selectedDecisionId]);

  useEffect(() => {
    if (!selectedDecisionId) {
      setSelectedDecision(null);
      setSelectedExplanation('');
      setSelectedChallenges([]);
      setReplayStatus({ state: 'idle' });
      return;
    }

    let alive = true;
    setReplayStatus({ state: 'idle' });

    getBrainDecision(selectedDecisionId)
      .then((d) => {
        if (!alive) return;
        setSelectedDecision(d ?? null);
        return Promise.all([
          getExplanationForDecisionAsync(selectedDecisionId),
          getChallengesForDecisionAsync(selectedDecisionId),
        ]);
      })
      .then((res) => {
        if (!alive) return;
        const [exp, challenges] = res ?? [];
        setSelectedExplanation(exp ? formatExplanationForUser(exp) : '—');
        setSelectedChallenges(Array.isArray(challenges) ? challenges : []);
      })
      .catch(() => {
        if (!alive) return;
        setSelectedDecision(null);
        setSelectedExplanation('—');
        setSelectedChallenges([]);
      });

    return () => {
      alive = false;
    };
  }, [selectedDecisionId]);

  const selectedIndex = useMemo(() => {
    if (!selectedDecisionId) return -1;
    return decisions.findIndex((d) => d.id === selectedDecisionId);
  }, [decisions, selectedDecisionId]);

  async function handleReplay() {
    if (!selectedDecisionId) return;
    setReplayStatus({ state: 'running' });

    try {
      const result = await replayDecisionAsync(selectedDecisionId);
      if (!result) {
        setReplayStatus({ state: 'error', message: 'Decision not found in storage' });
        return;
      }

      setReplayStatus({ state: 'done', match: result.match, replayed: result.replayed });
    } catch (e) {
      setReplayStatus({ state: 'error', message: e instanceof Error ? e.message : 'Unknown error' });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Audit / Replay</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[70vh] pr-2">
            <div className="space-y-2">
              {decisions.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aucune décision enregistrée.</div>
              ) : (
                decisions.map((d, idx) => {
                  const isActive = d.id === selectedDecisionId;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      className={`w-full text-left rounded-md border px-3 py-2 hover:bg-muted transition ${
                        isActive ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedDecisionId(d.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium truncate">{d.id}</div>
                        <Badge variant={isActive ? 'default' : 'outline'}>#{idx + 1}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(d.timestamp).toLocaleString()}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Détail décision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              {selectedDecisionId ? (
                <>
                  Sélection: <span className="font-mono">{selectedDecisionId}</span>
                  {selectedIndex >= 0 ? <span> (#{selectedIndex + 1})</span> : null}
                </>
              ) : (
                '—'
              )}
            </div>
            <Button onClick={handleReplay} disabled={!selectedDecisionId || replayStatus.state === 'running'}>
              Replay
            </Button>
          </div>

          {replayStatus.state === 'done' ? (
            <div className="flex items-center gap-2">
              <Badge variant={replayStatus.match ? 'default' : 'destructive'}>
                {replayStatus.match ? 'MATCH' : 'MISMATCH'}
              </Badge>
              <div className="text-xs text-muted-foreground">Comparaison sur IDs des tâches sélectionnées</div>
            </div>
          ) : null}

          {replayStatus.state === 'error' ? (
            <div className="text-sm text-red-600">{replayStatus.message}</div>
          ) : null}

          <Separator />

          <div className="space-y-2">
            <div className="text-sm font-medium">Explication figée</div>
            <pre className="whitespace-pre-wrap text-xs bg-muted p-3 rounded-md">{selectedExplanation || '—'}</pre>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="text-sm font-medium">Contestations utilisateur</div>
            {selectedChallenges.length === 0 ? (
              <div className="text-xs text-muted-foreground">—</div>
            ) : (
              <div className="space-y-2">
                {selectedChallenges
                  .slice()
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .map((c) => (
                    <div key={c.id} className="rounded-md border p-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline">{c.userAction}</Badge>
                        <div className="text-xs text-muted-foreground">{c.timestamp.toLocaleString()}</div>
                      </div>
                      <div className="text-xs mt-1">{c.reason}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        acknowledgedRisks: {String(c.acknowledgedRisks)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="text-sm font-medium">Decision (trace)</div>
            <pre className="whitespace-pre-wrap text-xs bg-muted p-3 rounded-md">
              {selectedDecision ? stringifyForAudit(selectedDecision) : '—'}
            </pre>
          </div>

          {replayStatus.state === 'done' ? (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm font-medium">Replay output</div>
                <pre className="whitespace-pre-wrap text-xs bg-muted p-3 rounded-md">
                  {stringifyForAudit(replayStatus.replayed)}
                </pre>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
