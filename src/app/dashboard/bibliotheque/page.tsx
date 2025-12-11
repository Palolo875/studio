import { ReservoirClient } from "@/components/reservoir/reservoir-client";
import { initialTasks } from "@/lib/data";

export default function BibliothequePage() {
  return (
    <div className="h-full flex flex-col">
      <ReservoirClient initialTasks={initialTasks} />
    </div>
  );
}
