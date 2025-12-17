import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useMemo } from "react";
import {
  TaskViewType,
  TaskGroupBy,
  TaskSortBy,
  TaskSortOrder,
  TaskFilters,
} from "./task-types";
import { TasksKanbanView } from "@/components/tasks/tasks-kanban-view";
import { TasksTableView } from "@/components/tasks/tasks-table-view";
import { TaskForm } from "@/components/tasks/task-form";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutGrid,
  Table as TableIcon,
  Filter,
  ArrowUpDown,
  Plus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TasksContent() {
  const tasks = useQuery(api.tasks.list, {});
  const tags = useQuery(api.tags.list, {});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const [viewType, setViewType] = useState<TaskViewType>("kanban");
  const [groupBy, setGroupBy] = useState<TaskGroupBy>("status");
  const [sortBy, setSortBy] = useState<TaskSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<TaskSortOrder>("desc");
  const [filters, setFilters] = useState<TaskFilters>({});

  const toggleArrayFilter = (
    key: "status" | "priority" | "tags",
    value: string
  ) => {
    const current = filters[key] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFilters({ ...filters, [key]: updated.length > 0 ? updated : undefined });
  };

  const toggleBooleanFilter = (key: "hasDueDate" | "hasRecurrence") => {
    const current = filters[key];
    setFilters({ 
      ...filters, 
      [key]: current === true ? undefined : true 
    });
  };

  const filteredAndSortedTasks = useMemo(() => {
    if (!tasks) return [];

    let filtered = [...tasks];

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((t) => filters.status!.includes(t.status));
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter((t) => filters.priority!.includes(t.priority));
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((t) =>
        t.tags.some((tagId) => filters.tags!.includes(tagId))
      );
    }

    if (filters.hasDueDate !== undefined) {
      filtered = filtered.filter((t) =>
        filters.hasDueDate ? !!t.dueAt : !t.dueAt
      );
    }

    if (filters.hasRecurrence !== undefined) {
      filtered = filtered.filter((t) =>
        filters.hasRecurrence ? !!t.recurrence : !t.recurrence
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "createdAt":
          comparison = a.createdAt - b.createdAt;
          break;
        case "priority": {
          const priorityOrder = { low: 0, medium: 1, high: 2, urgent: 3 };
          comparison =
            priorityOrder[a.priority as keyof typeof priorityOrder] -
            priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        }
        case "dueAt":
          if (!a.dueAt && !b.dueAt) comparison = 0;
          else if (!a.dueAt) comparison = 1;
          else if (!b.dueAt) comparison = -1;
          else comparison = a.dueAt - b.dueAt;
          break;
        case "duration":
          comparison = (a.duration || 0) - (b.duration || 0);
          break;
        case "alphabetical":
          comparison = a.title.localeCompare(b.title);
          break;
        case "status": {
          const statusOrder = {
            todo: 0,
            in_progress: 1,
            completed: 2,
            cancelled: 3,
          };
          comparison =
            statusOrder[a.status as keyof typeof statusOrder] -
            statusOrder[b.status as keyof typeof statusOrder];
          break;
        }
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [tasks, filters, sortBy, sortOrder]);

  return (
    <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tasks</h1>
          <p className="text-muted-foreground">Organize and track your daily tasks</p>
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={filters.status?.includes("todo")} onCheckedChange={() => toggleArrayFilter("status", "todo")}>
                  To Do
                </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filters.status?.includes("in_progress")} onCheckedChange={() => toggleArrayFilter("status", "in_progress")}>
                  In Progress
                </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filters.status?.includes("completed")} onCheckedChange={() => toggleArrayFilter("status", "completed")}>
                  Completed
                </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filters.status?.includes("cancelled")} onCheckedChange={() => toggleArrayFilter("status", "cancelled")}>
                  Cancelled
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Priority</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={filters.priority?.includes("urgent")} onCheckedChange={() => toggleArrayFilter("priority", "urgent")}>
                  Urgent
                </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filters.priority?.includes("high")} onCheckedChange={() => toggleArrayFilter("priority", "high")}>
                  High
                </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filters.priority?.includes("medium")} onCheckedChange={() => toggleArrayFilter("priority", "medium")}>
                  Medium
                </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filters.priority?.includes("low")} onCheckedChange={() => toggleArrayFilter("priority", "low")}>
                  Low
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Tags</DropdownMenuLabel>
                {(tags ?? []).map((tag) => (
                <DropdownMenuCheckboxItem key={tag._id} checked={filters.tags?.includes(tag._id)} onCheckedChange={() => toggleArrayFilter("tags", tag._id)}>
                    <span className="mr-2">{tag.emoji}</span>
                    {tag.name}
                  </DropdownMenuCheckboxItem>
                ))}
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Other</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={filters.hasDueDate === true} onCheckedChange={() => toggleBooleanFilter("hasDueDate")}>
                  Has Due Date
                </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filters.hasRecurrence === true} onCheckedChange={() => toggleBooleanFilter("hasRecurrence")}>
                  Has Recurrence
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilters({})}>Clear All Filters</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ArrowUpDown className="w-4 h-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as TaskSortBy)}>
                <DropdownMenuRadioItem value="createdAt">Created Date</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="priority">Priority</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dueAt">Due Date</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="duration">Duration</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="alphabetical">Alphabetical</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="status">Status</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Order</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sortOrder} onValueChange={(v) => setSortOrder(v as TaskSortOrder)}>
                <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingTask(null)}>
                  <Plus className="w-4 h-4" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <TaskForm
                  task={editingTask}
                  tags={tags ?? []}
                  onClose={() => {
                    setDialogOpen(false);
                    setEditingTask(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
        <Tabs value={viewType} onValueChange={(v) => setViewType(v as TaskViewType)} className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="kanban">
                  <LayoutGrid className="w-4 h-4" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="table">
                  <TableIcon className="w-4 h-4" />
                  Table
                </TabsTrigger>
              </TabsList>

            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as TaskGroupBy)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Group by Status</SelectItem>
                  <SelectItem value="priority">Group by Priority</SelectItem>
                  <SelectItem value="tags">Group by Tags</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="kanban">
              <TasksKanbanView
                tasks={filteredAndSortedTasks}
                tags={tags ?? []}
                groupBy={groupBy}
                onEdit={(task) => {
                  setEditingTask(task);
                  setDialogOpen(true);
                }}
              />
            </TabsContent>

            <TabsContent value="table">
              <TasksTableView
                tasks={filteredAndSortedTasks}
                tags={tags ?? []}
                groupBy={groupBy}
                onEdit={(task) => {
                  setEditingTask(task);
                  setDialogOpen(true);
                }}
              />
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}
