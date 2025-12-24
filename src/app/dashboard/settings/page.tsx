
'use client';

import { SettingsForm } from "@/components/settings/settings-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User, Bell, Palette, Clock, Timer, Settings as SettingsIcon, BrainCircuit } from 'lucide-react';

const navItems = [
  { id: 'profil', label: 'Profil', icon: User },
  { id: 'theme', label: 'Thème & Apparence', icon: Palette },
  { id: 'horaires', label: 'Horaires', icon: Clock },
  { id: 'focus', label: 'Mode Focus', icon: Timer },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'ia', label: 'Intelligence Artificielle', icon: BrainCircuit },
  { id: 'avance', label: 'Avancé', icon: SettingsIcon },
]

export default function SettingsPage() {

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Paramètres</h1>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <aside className="md:col-span-1">
          <nav className="sticky top-24 space-y-2">
            {navItems.map(item => (
              <Button
                key={item.id}
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={() => scrollToSection(item.id)}
              >
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <span>{item.label}</span>
              </Button>
            ))}
          </nav>
        </aside>
        <div className="md:col-span-3">
          <SettingsForm />
        </div>
      </div>
    </div>
  );
}
