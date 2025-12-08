import { SettingsForm } from "@/components/settings/settings-form";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Paramètres</h1>
      </header>
      <div className="max-w-2xl">
        <SettingsForm />
      </div>
    </div>
  );
}
