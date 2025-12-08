"use client"

import { useState } from "react"
import { format, startOfMonth, getDaysInMonth, getDay, addMonths, subMonths } from "date-fns"
import { fr } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const intensityColors = {
  0: "bg-[#1A1A1A]", // repos
  1: "bg-yellow-900/50", // légère
  2: "bg-green-900/50", // correcte
  3: "bg-yellow-400/80", // très productive
}

const legend = [
  { label: "Journée intense", color: "bg-yellow-400/80" },
  { label: "Journée productive", color: "bg-green-900/50" },
  { label: "Journée légère", color: "bg-yellow-900/50" },
  { label: "Repos", color: "bg-[#2A2A2A]" },
]

// Generate random data for the heatmap
const generateHeatmapData = (date: Date) => {
  const daysInMonth = getDaysInMonth(date)
  const data = {} as Record<string, number>
  for (let i = 1; i <= daysInMonth; i++) {
    const dayKey = format(new Date(date.getFullYear(), date.getMonth(), i), "yyyy-MM-dd")
    data[dayKey] = Math.floor(Math.random() * 4)
  }
  return data
}


export function AccomplishmentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [heatmapData, setHeatmapData] = useState(() => generateHeatmapData(currentDate))

  const handleMonthChange = (amount: number) => {
    const newDate = addMonths(currentDate, amount)
    setCurrentDate(newDate)
    setHeatmapData(generateHeatmapData(newDate))
  }

  const firstDayOfMonth = getDay(startOfMonth(currentDate)) // 0 (Sun) - 6 (Sat)
  // Adjust to start week on Monday
  const startOffset = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1)

  const daysInMonth = getDaysInMonth(currentDate)

  return (
    <Card className="bg-[#1A1A1A] border-[#2A2A2A] rounded-3xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Calendrier de Productivité</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleMonthChange(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-lg font-semibold w-32 text-center capitalize">
            {format(currentDate, "MMMM yyyy", { locale: fr })}
          </span>
          <Button variant="ghost" size="icon" onClick={() => handleMonthChange(1)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center text-xs text-gray-400">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayKey = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), "yyyy-MM-dd")
            const intensity = heatmapData[dayKey] ?? 0
            return (
              <div
                key={day}
                className={cn(
                  "aspect-square rounded-full flex items-center justify-center transition-all duration-300",
                  intensityColors[intensity as keyof typeof intensityColors]
                )}
                style={{
                  boxShadow: intensity === 3 ? '0 0 12px rgba(250, 204, 21, 0.5)' : 'none'
                }}
              >
                <span className="text-white text-sm">{day}</span>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-4">
            {legend.map(item => (
                <div key={item.label} className="flex items-center gap-2">
                    <div className={cn("h-3 w-3 rounded-full", item.color)} />
                    <span className="text-sm text-gray-400">{item.label}</span>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}
