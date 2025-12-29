"use client"

import { useEffect, useState } from "react"
import { format, startOfMonth, getDaysInMonth, getDay, addMonths, endOfMonth } from "date-fns"
import { fr } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

import { db, type DBTaskHistory } from "@/lib/database"

const intensityColors = {
  0: "bg-muted/50", // repos
  1: "bg-yellow-900/50", // légère
  2: "bg-green-900/50", // correcte
  3: "bg-yellow-400/80", // très productive
}

const legend = [
  { label: "Journée intense", color: "bg-yellow-400/80" },
  { label: "Objectif atteint", color: "bg-green-900/50" },
  { label: "Journée calme", color: "bg-yellow-900/50" },
  { label: "Repos", color: "bg-muted" },
]

function intensityFromCount(count: number): 0 | 1 | 2 | 3 {
  if (count <= 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  return 3
}


export function AccomplishmentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      const history = await db.taskHistory.where('timestamp').between(start, end, true, true).toArray()
      const completed = history.filter((h: DBTaskHistory) => h.action === 'completed')

      const countByDay = new Map<string, number>()
      for (const h of completed) {
        const d = new Date(h.timestamp)
        const key = format(d, 'yyyy-MM-dd')
        countByDay.set(key, (countByDay.get(key) || 0) + 1)
      }

      const daysInMonth = getDaysInMonth(currentDate)
      const data: Record<string, number> = {}
      for (let i = 1; i <= daysInMonth; i++) {
        const key = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), i), "yyyy-MM-dd")
        data[key] = intensityFromCount(countByDay.get(key) || 0)
      }

      if (cancelled) return
      setHeatmapData(data)
    })()
    return () => {
      cancelled = true
    }
  }, [currentDate])

  const handleMonthChange = (amount: number) => {
    const newDate = addMonths(currentDate, amount)
    setCurrentDate(newDate)
  }

  const firstDayOfMonth = getDay(startOfMonth(currentDate)) // 0 (Sun) - 6 (Sat)
  // Adjust to start week on Monday
  const startOffset = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1)

  const daysInMonth = getDaysInMonth(currentDate)

  return (
    <Card className="bg-card border-border rounded-3xl">
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
        <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center text-xs text-muted-foreground">
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
                <span className="text-foreground text-sm">{day}</span>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 pt-4">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                {legend.map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                        <div className={cn("h-3 w-3 rounded-full", item.color)} />
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                    </div>
                ))}
            </div>
            <Button variant="outline" size="sm" className="rounded-full">Modifier</Button>
        </div>
      </CardContent>
    </Card>
  )
}
