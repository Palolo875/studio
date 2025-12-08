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
      <Card className="bg-[#1A1A1A] border-[#2A2A2A] rounded-3xl">
        <CardHeader>
          <CardTitle>Niveaux d'énergie par moment de la journée</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="time" stroke="rgba(255, 255, 255, 0.5)" />
                <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                <ChartTooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="focus" fill="var(--color-focus)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="creative" fill="var(--color-creative)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="admin" fill="var(--color-admin)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-[#1A1A1A] border-[#2A2A2A] rounded-3xl">
          <CardHeader>
              <CardTitle>Taux de réussite par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4 overflow-x-auto pb-4">
                {successRates.map(item => (
                    <div key={item.category} className="bg-[#2A2A2A] p-4 rounded-2xl flex-shrink-0 w-40">
                        <p className="text-sm text-gray-400">{item.category}</p>
                        <p className={`text-3xl font-bold ${item.color}`}>{item.rate}</p>
                    </div>
                ))}
            </div>
          </CardContent>
      </Card>
    </div>
  )
}
