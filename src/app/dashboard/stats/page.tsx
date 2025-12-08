import { StatsClient } from "@/components/stats/stats-client";

export default function StatsPage() {
  return (
    <div className="bg-[#0E0E0E] text-white p-6 sm:p-8 rounded-3xl -m-4 sm:-m-6 lg:-m-8 min-h-screen">
      <StatsClient />
    </div>
  );
}
