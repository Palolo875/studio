
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
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().email("L'adresse e-mail n'est pas valide."),
  theme: z.enum(["light", "dark", "system"]),
  pomodoroWork: z.coerce.number().int().min(5, "Doit être d'au moins 5 minutes."),
  pomodoroBreak: z.coerce.number().int().min(1, "Doit être d'au moins 1 minute."),
  autoBackup: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function SettingsForm() {
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "KairuFlow User",
      email: "user@kairuflow.com",
      theme: (theme as "light" | "dark" | "system") || "system",
      pomodoroWork: 25,
      pomodoroBreak: 5,
      autoBackup: true,
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Votre nom" {...field} className="h-12 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Votre e-mail" {...field} className="h-12 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Apparence</CardTitle>
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
                          Système
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
                                <Input type="number" {...field} className="h-12 rounded-xl" />
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
                                <Input type="number" {...field} className="h-12 rounded-xl" />
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
                          Sauvegardes hebdomadaires automatiques
                        </FormLabel>
                        <FormDescription>
                           Activer pour sauvegarder vos données chaque semaine.
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
                    <FormItem>
                        <FormLabel>Fréquence</FormLabel>
                        <Select defaultValue="weekly">
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
                    </FormItem>
                    <FormItem>
                        <FormLabel>Limite de conservation</FormLabel>
                        <Select defaultValue="5">
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
                    </FormItem>
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
                    <Button variant="outline">Exporter mes données</Button>
                    <Button variant="outline">Importer des données</Button>
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
                            <Button variant="destructive" className="mt-2 sm:mt-0">Réinitialiser</Button>
                        </div>
                    </Card>
                </div>
            </CardContent>
        </Card>


        <Button type="submit" className="h-12 rounded-full px-8">Enregistrer les modifications</Button>
      </form>
    </Form>
  );
}

    