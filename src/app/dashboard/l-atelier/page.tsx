import { ReservoirClient } from "@/components/reservoir/reservoir-client";
import { initialTasks } from "@/lib/data";

export default function AtelierPage() {
  return (
    <div className="h-[calc(100vh-110px)] flex flex-col">
      <ReservoirClient initialTasks={initialTasks} />
    </div>
  );
}
