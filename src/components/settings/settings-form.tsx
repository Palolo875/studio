

"use client";

import { useEffect, useRef, useState } from "react";
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
import { DatabaseSnapshotManager } from "@/lib/databaseSnapshot";
import { getSetting, setSetting } from "@/lib/database";
import { AdaptationPanel, runAdaptationTransparencyAction } from "@/lib/phase6Implementation";

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
  
  // Focus Mode
  focusWorkDuration: z.coerce.number().int().min(1, "Doit être d'au moins 1 minute.").optional(),
    focusBreakDuration: z.coerce.number().int().min(1, "Doit être d'au moins 1 minute.").optional(),
    focusAutoSave: z.boolean().optional(),
    focusSoundEnabled: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const SettingsSectionCard = ({ id, title, description, children }: { id: string, title: string, description?: string, children: React.ReactNode }) => (
    <Card id={id}>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-8">
            {children}
        </CardContent>
    </Card>
);


export function SettingsForm() {
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();
  const restoreFileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [adaptationPanel, setAdaptationPanel] = useState<Awaited<ReturnType<typeof AdaptationPanel>> | null>(null);
  const [adaptationLoading, setAdaptationLoading] = useState(false);

  async function encryptPayload(plainText: string, passphrase: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 150000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const cipherBuf = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(plainText)
    );

    const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));

    return JSON.stringify(
      {
        kairuEncrypted: true,
        v: 1,
        salt: toB64(salt),
        iv: toB64(iv),
        data: toB64(new Uint8Array(cipherBuf)),
      },
      null,
      2
    );
  }

  async function decryptPayload(text: string, passphrase: string): Promise<string> {
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return text;
    }

    if (!parsed || parsed.kairuEncrypted !== true) return text;
    if (!passphrase) {
      throw new Error('Mot de passe requis pour restaurer cette sauvegarde.');
    }

    const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const salt = fromB64(parsed.salt);
    const iv = fromB64(parsed.iv);
    const data = fromB64(parsed.data);

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 150000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const plainBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return decoder.decode(plainBuf);
  }

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await getSetting<Partial<FormValues>>('appSettings');
        if (cancelled) return;
        if (!saved || typeof saved !== 'object') return;
        const current = form.getValues();
        form.reset({
          ...current,
          ...saved,
          theme: (saved.theme as any) ?? current.theme,
        });
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form]);

  function onSubmit(values: FormValues) {
    setTheme(values.theme);
    void setSetting('appSettings', values);
    toast({
      title: "Paramètres enregistrés",
      description: "Vos informations ont été mises à jour.",
    });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAdaptationLoading(true);
      try {
        const panel = await AdaptationPanel();
        if (cancelled) return;
        setAdaptationPanel(panel);
      } catch {
        if (cancelled) return;
        setAdaptationPanel(null);
      } finally {
        if (cancelled) return;
        setAdaptationLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshAdaptationPanel = async () => {
    setAdaptationLoading(true);
    try {
      const panel = await AdaptationPanel();
      setAdaptationPanel(panel);
    } finally {
      setAdaptationLoading(false);
    }
  };

  const runAdaptationAction = async (action: string) => {
    setAdaptationLoading(true);
    try {
      await runAdaptationTransparencyAction(action);
      await refreshAdaptationPanel();
      toast({
        title: "Action appliquée",
        description: action,
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d'appliquer l'action.",
        variant: "destructive",
      });
    } finally {
      setAdaptationLoading(false);
    }
  };

  async function exportBackup(): Promise<void> {
    try {
      const snapshot = await DatabaseSnapshotManager.createSnapshot();
      await DatabaseSnapshotManager.saveSnapshotToStorage(snapshot, `manual_export_${Date.now()}`);
      const plainPayload = DatabaseSnapshotManager.exportSnapshot(snapshot);
      const passphrase = backupPassphrase.trim();
      const payload = passphrase ? await encryptPayload(plainPayload, passphrase) : plainPayload;

      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kairuflow_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({
        title: "Backup exporté",
        description: "Le fichier de sauvegarde a été téléchargé.",
      });
    } catch {
      toast({
        title: "Export impossible",
        description: "Erreur lors de l'export de la sauvegarde.",
        variant: "destructive",
      });
    }
  }

  async function importBackupFromFile(file: File): Promise<void> {
    try {
      const confirmed = window.confirm(
        "Restaurer une sauvegarde va remplacer les données locales actuelles. Continuer ?"
      );
      if (!confirmed) return;

      const rawText = await file.text();
      const passphrase = backupPassphrase.trim();
      const text = await decryptPayload(rawText, passphrase);
      const snapshot = DatabaseSnapshotManager.importSnapshot(text);
      await DatabaseSnapshotManager.restoreSnapshot(snapshot);

      toast({
        title: "Restauration terminée",
        description: "La sauvegarde a été importée. Rechargement en cours…",
      });

      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (error) {
      toast({
        title: "Import impossible",
        description: error instanceof Error
          ? error.message
          : "Erreur lors de l'import/restauration de la sauvegarde.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
        
        <SettingsSectionCard id="profil" title="Profil" description="Mettez à jour les informations de votre profil.">
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
                      <SelectItem value="Alouette">Alouette (du matin)</SelectItem>
                      <SelectItem value="Colibri">Colibri (stable)</SelectItem>
                      <SelectItem value="Hibou">Hibou (du soir)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Indiquez quand vous êtes le plus productif pendant la journée.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
        </SettingsSectionCard>

        <SettingsSectionCard id="theme" title="Thème & Apparence" description="Personnalisez l'apparence de l'application.">
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
                      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                    >
                      <FormItem>
                        <RadioGroupItem value="light" id="light" className="sr-only" />
                        <Label
                          htmlFor="light"
                          className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer aspect-video"
                        >
                          <Sun className="mb-3 h-6 w-6" />
                          Clair
                        </Label>
                      </FormItem>
                      <FormItem>
                        <RadioGroupItem value="dark" id="dark" className="sr-only" />
                        <Label
                          htmlFor="dark"
                           className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer aspect-video"
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
                           className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer aspect-video"
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
            <FormField
              control={form.control}
              name="accentColor"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel>Couleur d'accent</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-wrap gap-4"
                    >
                      {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map((color) => (
                        <FormItem key={color} className="flex flex-col items-center">
                          <FormControl>
                            <RadioGroupItem 
                              value={color} 
                              id={color} 
                              className="peer sr-only"
                            />
                          </FormControl>
                          <Label 
                            htmlFor={color} 
                            className="h-10 w-10 rounded-full cursor-pointer border-2 border-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary/30"
                            style={{ backgroundColor: color }}
                          />
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </SettingsSectionCard>
        
        <SettingsSectionCard id="horaires" title="Horaires" description="Définissez vos horaires de travail et de productivité.">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
            </div>
        </SettingsSectionCard>

        <SettingsSectionCard id="focus" title="Mode Focus & Pomodoro" description="Configurez vos cycles de travail et de pause.">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
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
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <FormField
                    control={form.control}
                    name="focusAutoSave"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 flex-1">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                    Sauvegarde auto. des notes
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
                
                <FormField
                    control={form.control}
                    name="focusSoundEnabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 flex-1">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                    Sons de notification
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
            </div>
        </SettingsSectionCard>
        
        <SettingsSectionCard id="notifications" title="Notifications" description="Gérez vos préférences de notification.">
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
        </SettingsSectionCard>

        <SettingsSectionCard id="ia" title="Intelligence Artificielle" description="Paramétrez le comportement du cerveau de KairuFlow.">
          {/* TODO: Add AI settings */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={refreshAdaptationPanel} disabled={adaptationLoading}>
                Rafraîchir
              </Button>
              <Button type="button" variant="outline" onClick={() => runAdaptationAction('rollbackLatest')} disabled={adaptationLoading}>
                Rollback dernière adaptation
              </Button>
              <Button type="button" onClick={() => runAdaptationAction('resetAdaptation')} disabled={adaptationLoading}>
                Réinitialiser adaptations
              </Button>
            </div>

            <Separator />

            {adaptationPanel?.currentParameters?.parameters?.length ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Paramètres actuels</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {adaptationPanel.currentParameters.parameters.map((p: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span className="text-muted-foreground">{p.label}</span>
                      <span className="font-medium">{String(p.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun paramètre d'adaptation disponible.</p>
            )}

            {adaptationPanel?.recentChanges?.logs?.length ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Changements récents</p>
                <div className="space-y-2">
                  {adaptationPanel.recentChanges.logs.map((l: any, idx: number) => (
                    <div key={idx} className="rounded-md border px-3 py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{l.date}</span>
                        <span className="text-muted-foreground">{l.adaptationId ?? ''}</span>
                      </div>
                      <div className="font-medium">{l.change}</div>
                      <div className="text-muted-foreground">{l.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {adaptationPanel?.exports?.items?.length ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Exports signaux</p>
                <div className="space-y-2">
                  {adaptationPanel.exports.items.map((it: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span className="truncate">{it.name}</span>
                      <span className="text-muted-foreground">{it.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </SettingsSectionCard>


        <SettingsSectionCard id="avance" title="Avancé" description="Options pour les utilisateurs techniques.">
            <div className="flex flex-col sm:flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <FormLabel className="text-base">
                        Vider le cache
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">Libérer l'espace utilisé par le cache</p>
                </div>
                <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => {
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

            <div className="flex flex-col gap-4 rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Backup / Restore</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Exportez une sauvegarde JSON ou restaurez une sauvegarde existante.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Mot de passe (optionnel)</Label>
                  <Input
                    type="password"
                    value={backupPassphrase}
                    onChange={(e) => setBackupPassphrase(e.target.value)}
                    placeholder="Laisser vide pour export JSON"
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="button" variant="outline" onClick={() => exportBackup()}>
                  Exporter (JSON)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => restoreFileInputRef.current?.click()}
                >
                  Importer / Restaurer
                </Button>
                <input
                  ref={restoreFileInputRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    importBackupFromFile(file);
                  }}
                />
              </div>
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
        </SettingsSectionCard>

        <div className="flex justify-end">
            <Button type="submit" size="lg" className="h-12 rounded-full px-8">Enregistrer les modifications</Button>
        </div>
      </form>
    </Form>
  );
}
