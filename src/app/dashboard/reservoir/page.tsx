import { ReservoirClient } from "@/components/reservoir/reservoir-client";
import { initialTasks } from "@/lib/data";

export default function ReservoirPage() {
  return <ReservoirClient initialTasks={initialTasks} />;
}
