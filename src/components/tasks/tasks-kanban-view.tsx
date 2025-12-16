import { useMemo } from "react";
import { Circle, Clock, CheckCircle2, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskGroupBy } from "@/components/tasks/task-types";

export function TasksKanbanView({
  tasks,
  tags,
  groupBy,
  onEdit,
}: {
  tasks: any[];
  tags: any[];
  groupBy: TaskGroupBy;
  onEdit: (task: any) => void;
}) {
  const groupedTasks = useMemo(() => {
    const groups: Record<string, any[]> = {};

    if (groupBy === "status") {
      groups["todo"] = tasks.filter((t) => t.status === "todo");
      groups["in_progress"] = tasks.filter((t) => t.status === "in_progress");
      groups["completed"] = tasks.filter((t) => t.status === "completed");
    } else if (groupBy === "priority") {
      groups["urgent"] = tasks.filter((t) => t.priority === "urgent");
      groups["high"] = tasks.filter((t) => t.priority === "high");
      groups["medium"] = tasks.filter((t) => t.priority === "medium");
      groups["low"] = tasks.filter((t) => t.priority === "low");
    } else if (groupBy === "tags") {
      groups["untagged"] = tasks.filter((t) => t.tags.length === 0);
      tags.forEach((tag) => {
        groups[tag._id] = tasks.filter((t) => t.tags.includes(tag._id));
      });
    }

    return groups;
  }, [tasks, groupBy, tags]);

  const getGroupConfig = (key: string) => {
    if (groupBy === "status") {
      const configs = {
        todo: {
          title: "To Do",
          icon: <Circle className="w-5 h-5 text-muted-foreground" />,
        },
        in_progress: {
          title: "In Progress",
          icon: <Clock className="w-5 h-5 text-blue-500" />,
        },
        completed: {
          title: "Completed",
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        },
      };
      return configs[key as keyof typeof configs] || { title: key, icon: null };
    } else if (groupBy === "priority") {
      const configs = {
        urgent: {
          title: "Urgent",
          icon: <Flag className="w-4 h-4 text-red-500" />,
        },
        high: {
          title: "High",
          icon: <Flag className="w-4 h-4 text-orange-500" />,
        },
        medium: {
          title: "Medium",
          icon: <Flag className="w-4 h-4 text-blue-500" />,
        },
        low: { title: "Low", icon: <Flag className="w-4 h-4 text-gray-500" /> },
      };
      return configs[key as keyof typeof configs] || { title: key, icon: null };
    } else {
      if (key === "untagged") {
        return { title: "Untagged", icon: null };
      }
      const tag = tags.find((t) => t._id === key);
      return {
        title: tag ? `${tag.emoji} ${tag.name}` : key,
        icon: null,
      };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {Object.entries(groupedTasks).map(([key, groupTasks]) => {
        const config = getGroupConfig(key);
        return (
          <div key={key} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {config.icon}
                <h2 className="text-lg font-semibold">{config.title}</h2>
              </div>
              <Badge variant="secondary">{groupTasks.length}</Badge>
            </div>

            <Separator />

            <div className="space-y-3">
              {groupTasks.length === 0 ? (
                <Card className="p-8">
                  <p className="text-center text-muted-foreground text-sm">
                    No tasks
                  </p>
                </Card>
              ) : (
                groupTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    tags={tags}
                    onEdit={onEdit}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
