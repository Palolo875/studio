"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FocusProductivity } from "./focus-productivity";
import { EnergyProfile } from "./energy-profile";
import { AccomplishmentCalendar } from "./accomplishment-calendar";
import { GovernancePanel } from "../dashboard/governance-panel";

export function StatsClient() {
  const [activeTab, setActiveTab] = useState("focus");

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Statistiques & Gouvernance</h1>
      </header>

      <Tabs defaultValue="focus" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card h-12 rounded-2xl p-1">
          <TabsTrigger value="focus" className="rounded-xl h-full data-[state=active]:bg-muted data-[state=active]:text-foreground">Focus & Productivité</TabsTrigger>
          <TabsTrigger value="energy" className="rounded-xl h-full data-[state=active]:bg-muted data-[state=active]:text-foreground">Profil Énergétique</TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-xl h-full data-[state=active]:bg-muted data-[state=active]:text-foreground">Calendrier</TabsTrigger>
        </TabsList>
        <TabsContent value="focus" className="mt-8">
          <FocusProductivity />
        </TabsContent>
        <TabsContent value="energy" className="mt-8">
          <EnergyProfile />
        </TabsContent>
        <TabsContent value="calendar" className="mt-8">
          <AccomplishmentCalendar />
        </TabsContent>
      </Tabs>
      
      <div className="pt-8">
        <GovernancePanel />
      </div>
    </div>
  );
}
