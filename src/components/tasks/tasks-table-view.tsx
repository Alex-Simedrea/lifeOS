import { Card } from "@/components/ui/card";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";
import { TaskGroupBy } from "@/components/tasks/task-types";
import { useMemo } from "react";
import { TaskTableRow } from "@/components/tasks/task-table-row";

export function TasksTableView({
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

  const getGroupTitle = (key: string) => {
    if (groupBy === "status") {
      const titles = {
        todo: "To Do",
        in_progress: "In Progress",
        completed: "Completed",
      };
      return titles[key as keyof typeof titles] || key;
    } else if (groupBy === "priority") {
      return key.charAt(0).toUpperCase() + key.slice(1);
    } else {
      if (key === "untagged") return "Untagged";
      const tag = tags.find((t) => t._id === key);
      return tag ? `${tag.emoji} ${tag.name}` : key;
    }
  };

  return (
    <div className="space-y-8">
      {Object.entries(groupedTasks).map(([key, groupTasks]) => (
        <div key={key} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{getGroupTitle(key)}</h3>
            <Badge variant="secondary">{groupTasks.length}</Badge>
          </div>

          {groupTasks.length === 0 ? (
            <Card className="p-8">
              <p className="text-center text-muted-foreground text-sm">
                No tasks
              </p>
            </Card>
          ) : (
            <Card className="py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupTasks.map((task) => (
                    <TaskTableRow
                      key={task._id}
                      task={task}
                      tags={tags}
                      onEdit={onEdit}
                    />
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      ))}
    </div>
  );
}
