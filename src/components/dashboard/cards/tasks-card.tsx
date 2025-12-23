"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { endOfDay, format, isSameDay, startOfDay } from "date-fns";
import { CheckSquare, Plus } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardCard } from "../dashboard-card";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "../dashboard-utils";

export function TasksCard({ className }: { className?: string }) {
  const todayStart = useMemo(() => startOfDay(Date.now()).getTime(), []);
  const todayEnd = useMemo(() => endOfDay(Date.now()).getTime(), []);
  const todayDate = useMemo(() => new Date(todayStart), [todayStart]);

  const tasks = useQuery(api.tasks.list, {});
  const createTask = useMutation(api.tasks.create);

  const [taskTitle, setTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);

  const openTasks = useMemo(() => {
    if (!tasks) return [];
    const filtered = tasks.filter(
      (task) => task.status !== "completed" && task.status !== "cancelled"
    );
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (a.dueAt && b.dueAt) return a.dueAt - b.dueAt;
      if (a.dueAt) return -1;
      if (b.dueAt) return 1;
      return b.createdAt - a.createdAt;
    });
    return sorted;
  }, [tasks]);

  const tasksDueToday = useMemo(
    () =>
      openTasks.filter(
        (task) => task.dueAt && task.dueAt >= todayStart && task.dueAt <= todayEnd
      ).length,
    [openTasks, todayStart, todayEnd]
  );

  const overdueTasks = useMemo(
    () => openTasks.filter((task) => task.dueAt && task.dueAt < todayStart).length,
    [openTasks, todayStart]
  );

  const topTasks = openTasks.slice(0, 4);

  const handleAddTask = async (event: FormEvent) => {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title || isAddingTask) return;
    setIsAddingTask(true);
    try {
      await createTask({ title });
      setTaskTitle("");
    } finally {
      setIsAddingTask(false);
    }
  };

  return (
    <DashboardCard
      title="Tasks"
      description="Open work and priorities"
      href="/tasks"
      icon={CheckSquare}
      tone="bg-gradient-to-br from-amber-50/70 via-background to-background dark:from-amber-950/30 dark:via-background dark:to-background"
      iconBg="bg-amber-100/70 dark:bg-amber-500/20"
      iconTone="text-amber-700 dark:text-amber-200"
      className={className}
    >
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100">
          {openTasks.length} open
        </Badge>
        <Badge
          variant="outline"
          className="border-amber-200/70 text-amber-900 dark:border-amber-500/40 dark:text-amber-100"
        >
          {tasksDueToday} due today
        </Badge>
        {overdueTasks > 0 && (
          <Badge variant="destructive">{overdueTasks} overdue</Badge>
        )}
      </div>

      {tasks === undefined ? (
        <p className="text-sm text-muted-foreground">Loading tasks...</p>
      ) : topTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No open tasks. Add one to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {topTasks.map((task) => {
            const taskDate = task.startAt ?? task.dueAt;
            const label = task.startAt ? "Starts" : "Due";
            const dateLabel = taskDate
              ? `${label} ${
                  isSameDay(new Date(taskDate), todayDate)
                    ? "Today"
                    : format(new Date(taskDate), "MMM d")
                }${task.startAt ? ` - ${format(new Date(taskDate), "h:mm a")}` : ""}`
              : "No schedule";
            return (
              <div key={task._id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{dateLabel}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant="outline"
                    className="capitalize border-amber-200/70 text-amber-900 dark:border-amber-500/40 dark:text-amber-100"
                  >
                    {TASK_STATUS_LABELS[task.status] ?? task.status}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
                    {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-4">
        <form onSubmit={handleAddTask} className="flex gap-2 max-xl:flex-wrap">
          <Input
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            placeholder="Quick add a task"
            aria-label="Task title"
            className="flex-1 min-w-[200px]"
          />
          <Button type="submit" size="sm" disabled={isAddingTask} className="h-9!">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      </div>
    </DashboardCard>
  );
}
