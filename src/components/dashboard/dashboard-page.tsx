import { EventsCard } from "@/components/dashboard/cards/events-card";
import { FoodCard } from "@/components/dashboard/cards/food-card";
import { HabitsCard } from "@/components/dashboard/cards/habits-card";
import { HydrationCard } from "@/components/dashboard/cards/hydration-card";
import { NotesCard } from "@/components/dashboard/cards/notes-card";
import { TasksCard } from "@/components/dashboard/cards/tasks-card";
import { TimersCard } from "@/components/dashboard/cards/timers-card";

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          A live summary across your LifeOS features for today.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 auto-rows-auto">
        <EventsCard className="xl:col-span-2 xl:row-span-2" />
        <TasksCard className="xl:col-span-2" />
        <HabitsCard className="xl:col-span-1" />
        <HydrationCard className="xl:col-span-1" />
        <FoodCard className="xl:col-span-2" />
        <NotesCard className="xl:col-span-1" />
        <TimersCard className="xl:col-span-1" />
      </div>
    </div>
  );
}
