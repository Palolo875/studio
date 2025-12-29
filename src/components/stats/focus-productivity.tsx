"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Book, Brain, Briefcase, Lightbulb } from "lucide-react"
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"

import { db, type DBTask } from "@/lib/database"

type FocusPoint = { day: string; value: number }
type CategoryPoint = { icon: any; label: string; value: string; color: string }

const lineChartConfig = {
  value: {
    label: "Focus Score",
    color: "hsl(var(--chart-2))",
  }
} satisfies ChartConfig

const radialChartConfig = {
    score: {
        label: "Score",
        color: "hsl(var(--primary))",
    },
} satisfies ChartConfig;

const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function formatPct(n: number) {
  return `${Math.round(n * 100)}%`
}

function categoryToDisplay(category: string): { icon: any; label: string; color: string } {
  const c = category.toLowerCase()
  if (c.includes("creative") || c.includes("créa") || c.includes("crea")) return { icon: Lightbulb, label: "Créativité", color: "text-yellow-400" }
  if (c.includes("learn") || c.includes("appren") || c.includes("study")) return { icon: Brain, label: "Apprentissage", color: "text-blue-400" }
  if (c.includes("admin") || c.includes("orga") || c.includes("bureau")) return { icon: Briefcase, label: "Admin", color: "text-gray-400" }
  return { icon: Book, label: "Deep Work", color: "text-purple-400" }
}

export function FocusProductivity() {
  const [focusData, setFocusData] = useState<FocusPoint[]>([])
  const [flowScore, setFlowScore] = useState<number>(0)
  const [taskCategories, setTaskCategories] = useState<CategoryPoint[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const now = new Date()
      const start = new Date(now)
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)

      const sessions = await db.sessions.where('timestamp').between(start.getTime(), end.getTime(), true, true).toArray()

      const points: FocusPoint[] = []
      const dailyRatios: number[] = []

      for (let i = 0; i < 7; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        const dStart = new Date(d)
        dStart.setHours(0, 0, 0, 0)
        const dEnd = new Date(d)
        dEnd.setHours(23, 59, 59, 999)

        const daySessions = sessions.filter(s => s.timestamp >= dStart.getTime() && s.timestamp <= dEnd.getTime())
        const planned = daySessions.reduce((acc, s) => acc + (s.plannedTasks || 0), 0)
        const completed = daySessions.reduce((acc, s) => acc + (s.completedTasks || 0), 0)
        const ratio = planned > 0 ? completed / planned : 0
        dailyRatios.push(ratio)

        const value = clamp(ratio * 10, 0, 10)
        points.push({ day: dayLabels[(d.getDay() + 6) % 7], value: Math.round(value * 10) / 10 })
      }

      const avgRatio = dailyRatios.length ? dailyRatios.reduce((a, b) => a + b, 0) / dailyRatios.length : 0
      const score = clamp(Math.round(avgRatio * 100), 0, 100)

      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const completedTasks = await db.tasks.where('status').equals('done').and((t: DBTask) => !!t.completedAt && t.completedAt >= thirtyDaysAgo).toArray()
      const total = completedTasks.length

      const bucket = new Map<string, number>()
      for (const t of completedTasks) {
        const key = categoryToDisplay(t.category).label
        bucket.set(key, (bucket.get(key) || 0) + 1)
      }

      const categories: CategoryPoint[] = Array.from(bucket.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([label, count]) => {
          const meta = categoryToDisplay(label)
          return { ...meta, label, value: total > 0 ? formatPct(count / total) : '0%' }
        })

      if (cancelled) return
      setFocusData(points)
      setFlowScore(score)
      setTaskCategories(categories.length ? categories : [
        { ...categoryToDisplay('deep'), label: 'Deep Work', value: '0%', color: 'text-purple-400' },
      ])
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-8">
      <Card className="bg-card border-border rounded-3xl">
        <CardHeader>
          <CardTitle>Focus sur 7 jours</CardTitle>
          <CardDescription>Votre score de concentration moyen au cours de la dernière semaine.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={lineChartConfig} className="h-[250px] w-full">
            <LineChart accessibilityLayer data={focusData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
              <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
              <ChartTooltip
                cursor={{ stroke: "hsl(var(--chart-2))", strokeWidth: 1, strokeDasharray: "3 3" }}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={3} dot={{ r: 5, fill: 'var(--color-value)' }} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <Card className="md:col-span-2 bg-card border-border rounded-3xl p-6 flex flex-col justify-center items-center">
            <ChartContainer config={radialChartConfig} className="h-full w-full max-w-[250px] aspect-square">
                <RadialBarChart
                    data={[ { name: 'score', value: flowScore, fill: 'var(--color-score)' } ]}
                    startAngle={90}
                    endAngle={-270}
                    innerRadius="75%"
                    outerRadius="100%"
                    barSize={20}
                >
                    <PolarAngleAxis type="number" domain={[0, 100]} dataKey="value" tick={false} />
                    <RadialBar 
                        background={{ fill: 'hsl(var(--muted))' }} 
                        dataKey="value" 
                        cornerRadius={10} 
                    />
                    <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground text-5xl font-bold"
                    >
                        {flowScore}%
                    </text>
                     <text
                        x="50%"
                        y="62%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-muted-foreground text-sm"
                    >
                        Score de Flow
                    </text>
                </RadialBarChart>
            </ChartContainer>
        </Card>
        <Card className="md:col-span-3 bg-card border-border rounded-3xl p-6">
            <CardTitle className="mb-4">Répartition des Tâches</CardTitle>
            <div className="space-y-4">
                {taskCategories.map(cat => (
                    <div key={cat.label} className="flex items-center gap-4">
                        <div className={`flex items-center justify-center h-10 w-10 rounded-full bg-muted ${cat.color}`}>
                           <cat.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium">{cat.label}</p>
                        </div>
                        <p className="font-bold text-lg">{cat.value}</p>
                    </div>
                ))}
            </div>
        </Card>
      </div>

    </div>
  )
}
