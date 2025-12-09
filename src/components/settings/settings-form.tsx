
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Moon, Sun, Monitor } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "../ui/separator";

const formSchema = z.object({
  // Profil
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères."),
  accentColor: z.string().min(1, "Veuillez choisir une couleur d'accent."),
  energyProfile: z.enum(["Alouette", "Colibri", "Hibou"], {
    errorMap: () => ({ message: "Veuillez choisir un profil énergétique." }),
  }),
  
  // Notifications
  notificationsEnabled: z.boolean(),
  morningCheckinTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format HH:MM requis"),
  afternoonCheckinTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format HH:MM requis"),
  eveningReminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format HH:MM requis"),
  soundsEnabled: z.boolean(),
  
  // Thème
  theme: z.enum(["light", "dark", "system"]),
  
  // Horaires de travail
  workStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format HH:MM requis"),
  workEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format HH:MM requis"),
  workHoursPerDay: z.coerce.number().int().min(1, "Doit être d'au moins 1 heure.").max(24, "Ne peut pas dépasser 24 heures."),
  
  // Pomodoro
  pomodoroWork: z.coerce.number().int().min(5, "Doit être d'au moins 5 minutes."),
  pomodoroBreak: z.coerce.number().int().min(1, "Doit être d'au moins 1 minute."),
  
  // Sauvegardes automatiques
  autoBackup: z.boolean(),
  backupFrequency: z.enum(["daily", "weekly", "monthly"]),
  backupLimit: z.coerce.number().int().min(1).max(20),
  
  // Avancé
  developerMode: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function SettingsForm() {
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Profil
      firstName: "Junior",
      accentColor: "#3b82f6", // blue-500
      energyProfile: "Hibou",
      
      // Notifications
      notificationsEnabled: true,
      morningCheckinTime: "08:00",
      afternoonCheckinTime: "14:00",
      eveningReminderTime: "20:00",
      soundsEnabled: true,
      
      // Thème
      theme: (theme as "light" | "dark" | "system") || "system",
      
      // Horaires de travail
      workStartTime: "08:00",
      workEndTime: "18:00",
      workHoursPerDay: 8,
      
      // Pomodoro
      pomodoroWork: 25,
      pomodoroBreak: 5,
      
      // Sauvegardes automatiques
      autoBackup: true,
      backupFrequency: "weekly",
      backupLimit: 5,
      
      // Avancé
      developerMode: false,
    },
  });

  function onSubmit(values: FormValues) {
    setTheme(values.theme);
    toast({
      title: "Paramètres enregistrés",
      description: "Vos informations ont été mises à jour.",
    });
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>
              Mettez à jour les informations de votre profil.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input placeholder="Votre prénom" {...field} className="h-12 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <FormLabel>Couleur d'accent</FormLabel>
              <div className="flex flex-wrap gap-4">
                {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map((color) => (
                  <FormField
                    key={color}
                    control={form.control}
                    name="accentColor"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-center">
                        <FormControl>
                          <RadioGroupItem 
                            value={color} 
                            id={color} 
                            className="peer sr-only" 
                            checked={field.value === color}
                            onCheckedChange={() => field.onChange(color)}
                          />
                        </FormControl>
                        <Label 
                          htmlFor={color} 
                          className="h-10 w-10 rounded-full cursor-pointer border-2 border-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary/30"
                          style={{ backgroundColor: color }}
                        />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="energyProfile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profil énergétique</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Sélectionnez votre profil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Alouette">Alouette</SelectItem>
                      <SelectItem value="Colibri">Colibri</SelectItem>
                      <SelectItem value="Hibou">Hibou</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Indiquez quand vous êtes le plus productif pendant la journée.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Gérez vos préférences de notification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <FormField
              control={form.control}
              name="notificationsEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Notifications activées
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="morningCheckinTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-in matinal</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} className="h-12 rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="afternoonCheckinTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-in après-midi</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} className="h-12 rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="eveningReminderTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rappel soir</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} className="h-12 rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="soundsEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Sons activés
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thème</CardTitle>
            <CardDescription>
              Personnalisez l'apparence de l'application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Thème</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-3 gap-4"
                    >
                      <FormItem>
                        <RadioGroupItem value="light" id="light" className="sr-only" />
                        <Label
                          htmlFor="light"
                          className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer aspect-square"
                        >
                          <Sun className="mb-3 h-6 w-6" />
                          Clair
                        </Label>
                      </FormItem>
                      <FormItem>
                        <RadioGroupItem value="dark" id="dark" className="sr-only" />
                        <Label
                          htmlFor="dark"
                           className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer aspect-square"
                        >
                          <Moon className="mb-3 h-6 w-6" />
                          Sombre
                        </Label>
                      </FormItem>
                      <FormItem>
                         <RadioGroupItem
                          value="system"
                          id="system"
                          className="sr-only"
                        />
                        <Label
                          htmlFor="system"
                           className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer aspect-square"
                        >
                           <Monitor className="mb-3 h-6 w-6" />
                          Automatique
                        </Label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horaires de Travail</CardTitle>
            <CardDescription>
              Définissez vos horaires de travail habituels.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="workStartTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heure début</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} className="h-12 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="workEndTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heure fin</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} className="h-12 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="workHoursPerDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heures par jour</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} className="h-12 rounded-xl" min="1" max="24" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Pomodoro</CardTitle>
                <CardDescription>
                    Configurez vos cycles de travail et de pause.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <FormField
                    control={form.control}
                    name="pomodoroWork"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Durée de travail (minutes)</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} className="h-12 rounded-xl" min="5" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="pomodoroBreak"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Durée de pause (minutes)</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} className="h-12 rounded-xl" min="1" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Sauvegardes Automatiques</CardTitle>
                <CardDescription>
                    Gérez la sauvegarde automatique de vos données.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
               <FormField
                  control={form.control}
                  name="autoBackup"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Sauvegardes automatiques
                        </FormLabel>
                        <FormDescription>
                           Activer pour sauvegarder vos données automatiquement.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <FormField
                        control={form.control}
                        name="backupFrequency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fréquence</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-12 rounded-xl">
                                            <SelectValue placeholder="Choisir la fréquence" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="daily">Quotidien</SelectItem>
                                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                                        <SelectItem value="monthly">Mensuel</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="backupLimit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Limite de sauvegardes</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                    <FormControl>
                                        <SelectTrigger className="h-12 rounded-xl">
                                            <SelectValue placeholder="Choisir la limite" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="5">5 sauvegardes</SelectItem>
                                        <SelectItem value="10">10 sauvegardes</SelectItem>
                                        <SelectItem value="20">20 sauvegardes</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Sauvegardes existantes</h3>
                    <div className="space-y-2">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p className="font-medium">Sauvegarde du {new Date(Date.now() - item * 86400000).toLocaleDateString('fr-FR')}</p>
                                    <p className="text-sm text-muted-foreground">2.3 MB</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm">Restaurer</Button>
                                    <Button variant="outline" size="sm">Télécharger</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Données et Confidentialité</CardTitle>
                 <CardDescription>
                    Exportez, importez ou réinitialisez vos données d'application.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-4">
                    <Button variant="outline" onClick={() => {
                      // Export data logic
                      const dataStr = JSON.stringify(form.getValues(), null, 2);
                      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                      const exportFileDefaultName = `kairuflow-data-${new Date().toISOString().slice(0,10)}.json`;
                      
                      const linkElement = document.createElement('a');
                      linkElement.setAttribute('href', dataUri);
                      linkElement.setAttribute('download', exportFileDefaultName);
                      linkElement.click();
                    }}>
                      Exporter mes données
                    </Button>
                    <Button variant="outline" onClick={() => {
                      // Import data logic
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.json';
                      input.onchange = (event) => {
                        const file = (event.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            try {
                              const data = JSON.parse(e.target?.result as string);
                              form.reset(data);
                              toast({
                                title: "Données importées",
                                description: "Vos données ont été importées avec succès.",
                              });
                            } catch (error) {
                              toast({
                                title: "Erreur d'importation",
                                description: "Impossible de lire le fichier. Veuillez vérifier le format.",
                                variant: "destructive",
                              });
                            }
                          };
                          reader.readAsText(file);
                        }
                      };
                      input.click();
                    }}>
                      Importer des données
                    </Button>
                </div>
                <Separator />
                 <div>
                    <h3 className="text-base font-semibold text-destructive">Zone de danger</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                        Ces actions sont irréversibles. Soyez certain de vouloir continuer.
                    </p>
                    <Card className="border-destructive/50 bg-destructive/5 p-4">
                         <div className="flex flex-col sm:flex-row items-center justify-between">
                           <div>
                                <h4 className="font-semibold text-destructive">Réinitialiser l’application</h4>
                                <p className="text-sm text-destructive/80">Ceci supprimera toutes vos données.</p>
                           </div>
                            <Button 
                              variant="destructive" 
                              onClick={() => {
                                // Confirmation dialog
                                if (confirm("Êtes-vous sûr de vouloir réinitialiser l'application ? Cette action est irréversible et supprimera toutes vos données.")) {
                                  // Reset logic
                                  form.reset({
                                    // Profil
                                    firstName: "Junior",
                                    accentColor: "#3b82f6",
                                    energyProfile: "Hibou",
                                    
                                    // Notifications
                                    notificationsEnabled: true,
                                    morningCheckinTime: "08:00",
                                    afternoonCheckinTime: "14:00",
                                    eveningReminderTime: "20:00",
                                    soundsEnabled: true,
                                    
                                    // Thème
                                    theme: "system",
                                    
                                    // Horaires de travail
                                    workStartTime: "08:00",
                                    workEndTime: "18:00",
                                    workHoursPerDay: 8,
                                    
                                    // Pomodoro
                                    pomodoroWork: 25,
                                    pomodoroBreak: 5,
                                    
                                    // Sauvegardes automatiques
                                    autoBackup: true,
                                    backupFrequency: "weekly",
                                    backupLimit: 5,
                                    
                                    // Avancé
                                    developerMode: false,
                                  });
                                  
                                  toast({
                                    title: "Application réinitialisée",
                                    description: "Toutes vos données ont été supprimées.",
                                  });
                                }
                              }}
                            >
                              Réinitialiser
                            </Button>
                        </div>
                    </Card>
                    <div className="mt-4 text-sm text-muted-foreground">
                      Statistiques : Vous utilisez 2.3 MB sur 50 MB
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Mode Focus Adaptatif</CardTitle>
                <CardDescription>
                    Configurez votre environnement de travail sans distraction.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="work-duration">Durée de travail (minutes)</Label>
                        <Input
                            id="work-duration"
                            type="number"
                            min="1"
                            max="60"
                            defaultValue="25"
                            {...form.register("focusWorkDuration", { valueAsNumber: true })}
                        />
                        <p className="text-sm text-muted-foreground">
                            Durée d'une session de travail pomodoro
                        </p>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="break-duration">Durée de pause (minutes)</Label>
                        <Input
                            id="break-duration"
                            type="number"
                            min="1"
                            max="30"
                            defaultValue="5"
                            {...form.register("focusBreakDuration", { valueAsNumber: true })}
                        />
                        <p className="text-sm text-muted-foreground">
                            Durée de la pause entre deux sessions
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <FormField
                        control={form.control}
                        name="focusAutoSave"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                        Sauvegarde automatique des notes
                                    </FormLabel>
                                    <FormDescription>
                                        Enregistre automatiquement vos notes toutes les 2 secondes
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="focusSoundEnabled"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                        Sons de notification
                                    </FormLabel>
                                    <FormDescription>
                                        Émet un son discret à la fin de chaque session
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Avancé</CardTitle>
                <CardDescription>
                    Options avancées pour les utilisateurs techniques.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base">
                            Version de l'application
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">v1.0.0</p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base">
                            Vider le cache
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">Libérer l'espace utilisé par le cache</p>
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={() => {
                            // Clear cache logic
                            if ('caches' in window) {
                                caches.keys().then(names => {
                                    names.forEach(name => {
                                        caches.delete(name);
                                    });
                                }).then(() => {
                                    toast({
                                        title: "Cache vidé",
                                        description: "Le cache de l'application a été vidé avec succès.",
                                    });
                                });
                            }
                        }}
                    >
                        Vider
                    </Button>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base">
                            Voir les logs
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">Afficher les journaux de l'application</p>
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={() => {
                            // View logs logic
                            console.log("Affichage des logs...");
                            toast({
                                title: "Logs",
                                description: "Les logs ont été affichés dans la console.",
                            });
                        }}
                    >
                        Voir
                    </Button>
                </div>
                
                <FormField
                    control={form.control}
                    name="developerMode"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                    Mode développeur
                                </FormLabel>
                                <FormDescription>
                                    Activer les fonctionnalités de développement
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>

        <Button type="submit" className="h-12 rounded-full px-8">Enregistrer les modifications</Button>
      </form>
    </Form>
  );
}

    