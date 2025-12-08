import { ReservoirClient } from "@/components/reservoir/reservoir-client";
import { initialTasks } from "@/lib/data";

export default function ReservoirPage() {
  return (
    <div className="h-full">
      <ReservoirClient initialTasks={initialTasks} />
    </div>
  );
}
