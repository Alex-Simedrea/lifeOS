import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "convex/react";
import {
  CheckCircle2,
  Clock,
  Circle,
  MoreVertical,
  Edit,
  Flag,
  CalendarIcon,
  Timer,
  Repeat,
  X,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";

export function TaskCard({
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
  const addSubtask = useMutation(api.tasks.addSubtask);
  const toggleSubtask = useMutation(api.tasks.toggleSubtask);
  const deleteSubtask = useMutation(api.tasks.deleteSubtask);

  const [newSubtaskText, setNewSubtaskText] = useState("");
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);

  const priorityConfig = {
    low: { label: "Low", color: "text-gray-500", variant: "outline" as const },
    medium: {
      label: "Medium",
      color: "text-blue-500",
      variant: "secondary" as const,
    },
    high: {
      label: "High",
      color: "text-orange-500",
      variant: "default" as const,
    },
    urgent: {
      label: "Urgent",
      color: "text-red-500",
      variant: "destructive" as const,
    },
  };

  const handleToggle = () => {
    toggleStatus({ id: task._id });
  };

  const handleDelete = () => {
    deleteTask({ id: task._id });
  };

  const handleStatusChange = (
    newStatus: "todo" | "in_progress" | "completed" | "cancelled"
  ) => {
    updateTask({ id: task._id, status: newStatus });
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;

    await addSubtask({
      taskId: task._id,
      text: newSubtaskText.trim(),
    });

    setNewSubtaskText("");
    setShowSubtaskInput(false);
  };

  const handleToggleSubtask = (subtaskId: string) => {
    toggleSubtask({
      taskId: task._id,
      subtaskId,
    });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    deleteSubtask({
      taskId: task._id,
      subtaskId,
    });
  };

  const config = priorityConfig[task.priority as keyof typeof priorityConfig];
  const taskTags = task.tags
    .map((tagId: Id<"tags">) => tags.find((t) => t._id === tagId))
    .filter(Boolean);
  const subtasks = task.subtasks ?? [];

  const getRecurrenceText = () => {
    if (!task.recurrence) return null;
    const { type, interval } = task.recurrence;
    if (interval === 1) {
      return `Repeats ${type}`;
    }
    return `Repeats every ${interval} ${type}`;
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={handleToggle}
          className="mt-1 hover:opacity-70 transition-opacity shrink-0"
        >
          {task.status === "completed" ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : task.status === "in_progress" ? (
            <Clock className="w-5 h-5 text-blue-500" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className={`font-medium leading-tight ${
                task.status === "completed"
                  ? "line-through text-muted-foreground"
                  : ""
              }`}
            >
              {task.title}
            </h3>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Task
                </DropdownMenuItem>
                <Separator className="my-1" />
                <DropdownMenuItem onClick={() => handleStatusChange("todo")}>
                  Set as To Do
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange("in_progress")}
                >
                  Set as In Progress
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange("completed")}
                >
                  Mark Complete
                </DropdownMenuItem>
                <Separator className="my-1" />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.notes && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {task.notes}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant={config.variant} className="text-xs">
              <Flag className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>

            {task.dueAt && (
              <Badge variant="outline" className="text-xs">
                <CalendarIcon className="w-3 h-3 mr-1" />
                {new Date(task.dueAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </Badge>
            )}

            {task.duration && (
              <Badge variant="outline" className="text-xs">
                <Timer className="w-3 h-3 mr-1" />
                {task.duration}m
              </Badge>
            )}

            {task.recurrence && (
              <Badge variant="outline" className="text-xs">
                <Repeat className="w-3 h-3 mr-1" />
                {getRecurrenceText()}
              </Badge>
            )}

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

          {subtasks.length > 0 && (
            <div className="space-y-1 mb-2">
              {subtasks.map((subtask: any) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 text-sm group/subtask"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(subtask.id)}
                    className="hover:opacity-70 transition-opacity shrink-0"
                  >
                    {subtask.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <span
                    className={`flex-1 ${
                      subtask.completed
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                  >
                    {subtask.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="opacity-0 group-hover/subtask:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showSubtaskInput ? (
            <form onSubmit={handleAddSubtask} className="mt-2">
              <div className="flex gap-2">
                <Input
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  placeholder="Add subtask..."
                  className="h-8 text-sm"
                  autoFocus
                  onBlur={() => {
                    if (!newSubtaskText.trim()) {
                      setShowSubtaskInput(false);
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="h-8"
                  disabled={!newSubtaskText.trim()}
                >
                  Add
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    setShowSubtaskInput(false);
                    setNewSubtaskText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowSubtaskInput(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mt-1"
            >
              <Plus className="w-3 h-3" />
              Add subtask
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
