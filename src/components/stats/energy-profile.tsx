"use client";

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

const energyData = [
  { time: "Matin", focus: 8, creative: 6, admin: 4 },
  { time: "Midi", focus: 7, creative: 8, admin: 5 },
  { time: "Après-midi", focus: 9, creative: 7, admin: 6 },
  { time: "Soir", focus: 5, creative: 9, admin: 3 },
];

const chartConfig = {
  focus: { label: "Focus", color: "hsl(var(--chart-1))" },
  creative: { label: "Créatif", color: "hsl(var(--chart-2))" },
  admin: { label: "Admin", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const successRates = [
  {
    category: "Deep Work",
    rate: "82%",
    color: "text-purple-400",
    insight: "Vous êtes particulièrement efficace pour les tâches de fond.",
  },
  {
    category: "Créatif",
    rate: "75%",
    color: "text-blue-400",
    insight: "Votre créativité s'exprime pleinement sur les idées nouvelles.",
  },
  {
    category: "Admin",
    rate: "91%",
    color: "text-gray-400",
    insight: "Excellente gestion des tâches qui demandent de l'organisation.",
  },
  {
    category: "Social",
    rate: "68%",
    color: "text-green-400",
    insight: "Vos interactions sont productives et bien menées.",
  },
  {
    category: "Tâches rapides",
    rate: "95%",
    color: "text-yellow-400",
    insight: "Vous excellez dans l'art de finaliser rapidement les petites tâches.",
  },
];

export function EnergyProfile() {
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
