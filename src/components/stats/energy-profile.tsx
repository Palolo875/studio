"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

import { db, type DBTask, type DBTaskHistory } from "@/lib/database";

type EnergyPoint = { time: string; focus: number; creative: number; admin: number };
type SuccessPoint = { category: string; rate: string; color: string; insight: string };

const chartConfig = {
  focus: { label: "Focus", color: "hsl(var(--chart-1))" },
  creative: { label: "Créatif", color: "hsl(var(--chart-2))" },
  admin: { label: "Admin", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toCategory(task: DBTask | undefined): "focus" | "creative" | "admin" {
  const c = (task?.category || "").toLowerCase();
  if (c.includes("creative") || c.includes("créa") || c.includes("crea")) return "creative";
  if (c.includes("admin") || c.includes("orga") || c.includes("bureau")) return "admin";
  return "focus";
}

function timeBucketLabel(d: Date): "Matin" | "Midi" | "Après-midi" | "Soir" {
  const h = d.getHours();
  if (h >= 6 && h < 12) return "Matin";
  if (h >= 12 && h < 14) return "Midi";
  if (h >= 14 && h < 18) return "Après-midi";
  return "Soir";
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function EnergyProfile() {
  const [energyData, setEnergyData] = useState<EnergyPoint[]>([
    { time: "Matin", focus: 0, creative: 0, admin: 0 },
    { time: "Midi", focus: 0, creative: 0, admin: 0 },
    { time: "Après-midi", focus: 0, creative: 0, admin: 0 },
    { time: "Soir", focus: 0, creative: 0, admin: 0 },
  ]);
  const [successRates, setSuccessRates] = useState<SuccessPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);

      const [history, tasksDone, tasksTodo] = await Promise.all([
        db.taskHistory.where('timestamp').between(start, now, true, true).toArray(),
        db.tasks.where('status').equals('done').toArray(),
        db.tasks.where('status').anyOf(['todo', 'active', 'frozen']).toArray(),
      ]);

      const taskIndex = new Map<string, DBTask>();
      for (const t of [...tasksDone, ...tasksTodo]) taskIndex.set(t.id, t);

      const buckets: Record<string, { focus: number; creative: number; admin: number }> = {
        "Matin": { focus: 0, creative: 0, admin: 0 },
        "Midi": { focus: 0, creative: 0, admin: 0 },
        "Après-midi": { focus: 0, creative: 0, admin: 0 },
        "Soir": { focus: 0, creative: 0, admin: 0 },
      };

      const completed = history.filter((h: DBTaskHistory) => h.action === 'completed');
      for (const h of completed) {
        const d = new Date(h.timestamp);
        const bucket = timeBucketLabel(d);
        const cat = toCategory(taskIndex.get(h.taskId));
        buckets[bucket][cat] += 1;
      }

      const maxCount = Math.max(
        1,
        ...Object.values(buckets).flatMap(v => [v.focus, v.creative, v.admin])
      );

      const points: EnergyPoint[] = (Object.keys(buckets) as Array<keyof typeof buckets>).map((time) => {
        const v = buckets[time];
        return {
          time,
          focus: clamp(Math.round((v.focus / maxCount) * 10), 0, 10),
          creative: clamp(Math.round((v.creative / maxCount) * 10), 0, 10),
          admin: clamp(Math.round((v.admin / maxCount) * 10), 0, 10),
        };
      });

      const doneCount = tasksDone.length;
      const todoCount = tasksTodo.length;
      const total = doneCount + todoCount;
      const overallRate = total > 0 ? doneCount / total : 0;

      const byCat = new Map<string, { done: number; total: number; color: string; insight: string }>();
      const catMeta = {
        Deep: { color: 'text-purple-400', insight: "Tâches longues: progression sur le fond." },
        Créatif: { color: 'text-blue-400', insight: "Créativité: exploration et production." },
        Admin: { color: 'text-gray-400', insight: "Organisation: exécution et suivi." },
      };

      for (const t of [...tasksDone, ...tasksTodo]) {
        const cat = toCategory(t);
        const key = cat === 'creative' ? 'Créatif' : cat === 'admin' ? 'Admin' : 'Deep';
        const meta = (catMeta as any)[key] ?? { color: 'text-muted-foreground', insight: '' };
        const slot = byCat.get(key) ?? { done: 0, total: 0, color: meta.color, insight: meta.insight };
        slot.total += 1;
        if (t.status === 'done') slot.done += 1;
        byCat.set(key, slot);
      }

      const rates: SuccessPoint[] = Array.from(byCat.entries())
        .map(([category, v]) => ({
          category,
          rate: v.total > 0 ? pct(v.done / v.total) : '0%',
          color: v.color,
          insight: v.insight,
        }))
        .sort((a, b) => parseInt(b.rate) - parseInt(a.rate))
        .slice(0, 5);

      if (cancelled) return;
      setEnergyData(points);
      setSuccessRates(rates.length ? rates : [{ category: 'Global', rate: pct(overallRate), color: 'text-muted-foreground', insight: "Pas assez de données pour une répartition fine." }]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <Card className="bg-card border-border rounded-3xl">
        <CardHeader>
          <CardTitle>Niveaux d'énergie par moment de la journée</CardTitle>
          <CardDescription>
            Analyse de vos pics de productivité pour le focus, la créativité et
            les tâches administratives.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <ResponsiveContainer>
              <BarChart data={energyData} margin={{ left: -20 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--accent))" }}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="focus"
                  fill="var(--color-focus)"
                  radius={[4, 4, 0, 0]}
                  name="Focus"
                />
                <Bar
                  dataKey="creative"
                  fill="var(--color-creative)"
                  radius={[4, 4, 0, 0]}
                  name="Créatif"
                />
                <Bar
                  dataKey="admin"
                  fill="var(--color-admin)"
                  radius={[4, 4, 0, 0]}
                  name="Admin"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="bg-card border-border rounded-3xl">
        <CardHeader>
          <CardTitle>Taux de réussite par catégorie</CardTitle>
          <CardDescription>
            Votre performance sur différents types de tâches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {successRates.map((item) => (
              <div
                key={item.category}
                className="bg-muted p-4 rounded-2xl flex flex-col justify-between flex-shrink-0 min-h-[160px]"
              >
                <div>
                  <p className="text-sm text-muted-foreground">
                    {item.category}
                  </p>
                  <p className={`text-4xl font-bold ${item.color}`}>
                    {item.rate}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground/80">
                  {item.insight}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
