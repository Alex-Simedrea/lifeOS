import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { CheckCircle2, Clock, Circle, MoreVertical, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";

export function TaskTableRow({
  task,
  tags,
  onEdit,
}: {
  task: any;
  tags: any[];
  onEdit: (task: any) => void;
}) {
  const toggleStatus = useMutation(api.tasks.toggleStatus);
  const deleteTask = useMutation(api.tasks.remove);
  const updateTask = useMutation(api.tasks.update);

  const priorityConfig = {
    low: { label: "Low", variant: "outline" as const },
    medium: { label: "Medium", variant: "secondary" as const },
    high: { label: "High", variant: "default" as const },
    urgent: { label: "Urgent", variant: "destructive" as const },
  };

  const taskTags = task.tags
    .map((tagId: Id<"tags">) => tags.find((t) => t._id === tagId))
    .filter(Boolean);

  const config = priorityConfig[task.priority as keyof typeof priorityConfig];

  return (
    <TableRow>
      <TableCell>
        <button
          type="button"
          onClick={() => toggleStatus({ id: task._id })}
          className="hover:opacity-70 transition-opacity"
        >
          {task.status === "completed" ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : task.status === "in_progress" ? (
            <Clock className="w-5 h-5 text-blue-500" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
      </TableCell>
      <TableCell>
        <div>
          <div
            className={`font-medium ${
              task.status === "completed"
                ? "line-through text-muted-foreground"
                : ""
            }`}
          >
            {task.title}
          </div>
          {task.notes && (
            <div className="text-sm text-muted-foreground line-clamp-1">
              {task.notes}
            </div>
          )}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {task.subtasks.filter((s: any) => s.completed).length}/
              {task.subtasks.length} subtasks
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={config.variant} className="text-xs">
          {config.label}
        </Badge>
      </TableCell>
      <TableCell>
        {task.dueAt ? (
          <div className="text-sm">
            {new Date(task.dueAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        {task.duration ? (
          <div className="text-sm">{task.duration}m</div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {taskTags.map((tag: any) => (
            <Badge
              key={tag._id}
              variant="outline"
              className="text-xs"
              style={{ borderColor: tag.color, color: tag.color }}
            >
              <span className="mr-1">{tag.emoji}</span>
              {tag.name}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Task
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => updateTask({ id: task._id, status: "todo" })}
            >
              Set as To Do
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                updateTask({ id: task._id, status: "in_progress" })
              }
            >
              Set as In Progress
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => updateTask({ id: task._id, status: "completed" })}
            >
              Mark Complete
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => deleteTask({ id: task._id })}
              className="text-destructive focus:text-destructive"
            >
              Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
