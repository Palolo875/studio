"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"

const energyData = [
  { time: "Matin", focus: 8, creative: 6, admin: 4 },
  { time: "Midi", focus: 7, creative: 8, admin: 5 },
  { time: "Après-midi", focus: 9, creative: 7, admin: 6 },
  { time: "Soir", focus: 5, creative: 9, admin: 3 },
]

const chartConfig = {
  focus: { label: "Focus", color: "hsl(var(--chart-1))" },
  creative: { label: "Créatif", color: "hsl(var(--chart-2))" },
  admin: { label: "Admin", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

const successRates = [
    { category: "Deep Work", rate: "82%", color: "text-purple-400" },
    { category: "Créatif", rate: "75%", color: "text-blue-400" },
    { category: "Admin", rate: "91%", color: "text-gray-400" },
    { category: "Social", rate: "68%", color: "text-green-400" },
    { category: "Tâches rapides", rate: "95%", color: "text-yellow-400" },
]

export function EnergyProfile() {
  return (
    <div className="space-y-8">
      <Card className="bg-card border-border rounded-3xl">
        <CardHeader>
          <CardTitle>Niveaux d'énergie par moment de la journée</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <ResponsiveContainer>
                <BarChart data={energyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip
                    cursor={{ fill: 'hsl(var(--accent))' }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="focus" fill="var(--color-focus)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="creative" fill="var(--color-creative)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="admin" fill="var(--color-admin)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <Card className="bg-card border-border rounded-3xl">
          <CardHeader>
              <CardTitle>Taux de réussite par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4 overflow-x-auto pb-4">
                {successRates.map(item => (
                    <div key={item.category} className="bg-muted p-4 rounded-2xl flex-shrink-0 w-40">
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                        <p className={`text-3xl font-bold ${item.color}`}>{item.rate}</p>
                    </div>
                ))}
            </div>
          </CardContent>
      </Card>
    </div>
  )
}
