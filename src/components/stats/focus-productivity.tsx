"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Book, Brain, Briefcase, Lightbulb } from "lucide-react"
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  LineChart,
  Line,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
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

const chartConfig = {
  focus: {
    label: "Focus Score",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

const flowScore = 85

const taskCategories = [
  { icon: Lightbulb, label: "Créativité", color: "bg-yellow-400/20 text-yellow-300" },
  { icon: Brain, label: "Apprentissage", color: "bg-blue-400/20 text-blue-300" },
  { icon: Briefcase, label: "Admin", color: "bg-gray-400/20 text-gray-300" },
  { icon: Book, label: "Deep Work", color: "bg-purple-400/20 text-purple-300" },
]

export function FocusProductivity() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2 bg-[#1A1A1A] border-[#2A2A2A] rounded-3xl">
        <CardHeader>
          <CardTitle>Focus sur 7 jours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={focusData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="day" stroke="rgba(255, 255, 255, 0.5)" />
                <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                <ChartTooltip
                  cursor={{ stroke: "hsl(var(--chart-2))", strokeWidth: 2 }}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        <Card className="bg-[#1A1A1A] border-[#2A2A2A] rounded-3xl flex flex-col items-center justify-center p-6 h-[250px]">
            <div className="h-[150px] w-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                        innerRadius="80%" 
                        outerRadius="100%" 
                        data={[{ value: flowScore, fill: 'hsl(var(--chart-1))' }]} 
                        startAngle={90} 
                        endAngle={-270}
                    >
                        <RadialBar
                            background
                            dataKey="value"
                            cornerRadius={10}
                        />
                        <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="fill-white text-4xl font-bold"
                        >
                            {flowScore}%
                        </text>
                        <text
                            x="50%"
                            y="65%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="fill-gray-400 text-sm"
                        >
                            Score de Flow
                        </text>
                    </RadialBarChart>
                </ResponsiveContainer>
            </div>
        </Card>
        <Card className="bg-[#1A1A1A] border-[#2A2A2A] rounded-3xl">
          <CardHeader>
            <CardTitle>Catégories de tâches</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {taskCategories.map(cat => (
                <Badge key={cat.label} className={`px-4 py-2 rounded-full text-sm border-0 ${cat.color}`}>
                    <cat.icon className="h-4 w-4 mr-2" />
                    {cat.label}
                </Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
