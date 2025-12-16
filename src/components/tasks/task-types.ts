export type TaskViewType = "kanban" | "table";
export type TaskGroupBy = "status" | "priority" | "tags";
export type TaskSortBy =
  | "createdAt"
  | "priority"
  | "dueAt"
  | "duration"
  | "alphabetical"
  | "status";
export type TaskSortOrder = "asc" | "desc";

export interface TaskFilters {
  status?: string[];
  priority?: string[];
  tags?: string[];
  hasDueDate?: boolean;
  hasRecurrence?: boolean;
}
