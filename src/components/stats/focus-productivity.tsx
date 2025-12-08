"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Book, Brain, Briefcase, Lightbulb, TrendingUp, Zap } from "lucide-react"
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  LineChart,
  Line,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarAngleAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Label
} from "recharts"

const focusData = [
  { day: "Lun", value: 6 },
  { day: "Mar", value: 7 },
  { day: "Mer", value: 8 },
  { day: "Jeu", value: 7.5 },
  { day: "Ven", value: 9 },
  { day: "Sam", value: 5 },
  { day: "Dim", value: 6.5 },
]

const lineChartConfig = {
  value: {
    label: "Focus Score",
    color: "hsl(var(--chart-2))",
  }
} satisfies ChartConfig

const flowScore = 85;
const radialChartConfig = {
    score: {
        label: "Score",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig;


const taskCategories = [
  { icon: Lightbulb, label: "Créativité", value: '30%', color: "text-yellow-400" },
  { icon: Brain, label: "Apprentissage", value: '25%', color: "text-blue-400" },
  { icon: Briefcase, label: "Admin", value: '20%', color: "text-gray-400" },
  { icon: Book, label: "Deep Work", value: '25%', color: "text-purple-400" },
]

export function FocusProductivity() {
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
              <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={{ r: 5, fill: 'hsl(var(--chart-2))' }} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-2 bg-card border-border rounded-3xl p-6 flex flex-col justify-center items-center">
            <ChartContainer config={radialChartConfig} className="h-full w-full aspect-square">
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
        <Card className="lg:col-span-3 bg-card border-border rounded-3xl p-6">
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
