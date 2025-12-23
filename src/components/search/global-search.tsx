"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { useQuery } from "convex/react";
import {
  Calendar,
  CheckSquare,
  Droplets,
  FileText,
  Search,
  Tag,
  Target,
  Timer as TimerIcon,
  Utensils,
} from "lucide-react";
import { format, formatDistanceToNow, isSameDay } from "date-fns";

import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  formatDurationShort,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/components/dashboard/dashboard-utils";

type SearchResult =
  | {
      kind: "task";
      id: string;
      title: string;
      status: string;
      priority: string;
      dueAt?: number;
      startAt?: number;
      timestamp: number;
      href: string;
    }
  | {
      kind: "event";
      id: string;
      title: string;
      startDate: number;
      endDate: number;
      location?: string;
      timestamp: number;
      href: string;
    }
  | {
      kind: "habit";
      id: string;
      title: string;
      emoji: string;
      color: string;
      frequency: { times: number; period: "day" | "week" | "month" };
      timestamp: number;
      href: string;
    }
  | {
      kind: "hydration";
      id: string;
      title: string;
      amountMl: number;
      timestamp: number;
      href: string;
    }
  | {
      kind: "food";
      id: string;
      title: string;
      mealType: string;
      calories?: number;
      timestamp: number;
      href: string;
    }
  | {
      kind: "note";
      id: string;
      title: string;
      timestamp: number;
      href: string;
    }
  | {
      kind: "timer";
      id: string;
      title: string;
      type: string;
      durationMs: number;
      timestamp: number;
      href: string;
    }
  | {
      kind: "tag";
      id: string;
      title: string;
      emoji: string;
      color: string;
      timestamp: number;
      href: string;
    };

const KIND_LABELS: Record<SearchResult["kind"], string> = {
  task: "Tasks",
  event: "Events",
  habit: "Habits",
  hydration: "Hydration",
  food: "Food",
  note: "Notes",
  timer: "Timers",
  tag: "Tags",
};

const KIND_ICONS: Record<
  SearchResult["kind"],
  ComponentType<{ className?: string }>
> = {
  task: CheckSquare,
  event: Calendar,
  habit: Target,
  hydration: Droplets,
  food: Utensils,
  note: FileText,
  timer: TimerIcon,
  tag: Tag,
};

const KIND_ORDER: Array<SearchResult["kind"]> = [
  "task",
  "event",
  "habit",
  "hydration",
  "food",
  "note",
  "timer",
  "tag",
];

function formatTaskMeta(result: Extract<SearchResult, { kind: "task" }>) {
  const schedule = result.startAt ?? result.dueAt;
  const label = result.startAt ? "Starts" : "Due";
  const dateLabel = schedule
    ? isSameDay(new Date(schedule), new Date())
      ? "Today"
      : format(new Date(schedule), "MMM d")
    : "No date";
  const status = TASK_STATUS_LABELS[result.status] ?? result.status;
  const priority = TASK_PRIORITY_LABELS[result.priority] ?? result.priority;
  return `${status} - ${label} ${dateLabel} - ${priority}`;
}

function formatEventMeta(result: Extract<SearchResult, { kind: "event" }>) {
  const timeLabel = format(new Date(result.startDate), "h:mm a");
  return result.location ? `${timeLabel} - ${result.location}` : timeLabel;
}

function formatHabitMeta(result: Extract<SearchResult, { kind: "habit" }>) {
  return `${result.frequency.times}x per ${result.frequency.period}`;
}

function formatHydrationMeta(
  result: Extract<SearchResult, { kind: "hydration" }>
) {
  return `${result.amountMl}ml - ${format(new Date(result.timestamp), "h:mm a")}`;
}

function formatFoodMeta(result: Extract<SearchResult, { kind: "food" }>) {
  const base = `${result.mealType} - ${format(
    new Date(result.timestamp),
    "h:mm a"
  )}`;
  return result.calories ? `${base} - ${result.calories} kcal` : base;
}

function formatNoteMeta(result: Extract<SearchResult, { kind: "note" }>) {
  return `Updated ${formatDistanceToNow(new Date(result.timestamp), {
    addSuffix: true,
  })}`;
}

function formatTimerMeta(result: Extract<SearchResult, { kind: "timer" }>) {
  return `${result.type} - ${formatDurationShort(result.durationMs)}`;
}

function formatTagMeta(result: Extract<SearchResult, { kind: "tag" }>) {
  return result.emoji ? `${result.emoji} tag` : "Tag";
}

function getResultMeta(result: SearchResult) {
  switch (result.kind) {
    case "task":
      return formatTaskMeta(result);
    case "event":
      return formatEventMeta(result);
    case "habit":
      return formatHabitMeta(result);
    case "hydration":
      return formatHydrationMeta(result);
    case "food":
      return formatFoodMeta(result);
    case "note":
      return formatNoteMeta(result);
    case "timer":
      return formatTimerMeta(result);
    case "tag":
      return formatTagMeta(result);
    default:
      return "";
  }
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isMac, setIsMac] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const trimmedQuery = query.trim();
  const results = useQuery(api.search.searchAll, {
    query: trimmedQuery,
    limit: 40,
  }) as SearchResult[] | undefined;

  const groupedResults = useMemo(() => {
    if (!results) return [];
    const groups = new Map<SearchResult["kind"], SearchResult[]>();
    for (const result of results) {
      const list = groups.get(result.kind) ?? [];
      list.push(result);
      groups.set(result.kind, list);
    }
    return KIND_ORDER.filter((kind) => groups.has(kind)).map((kind) => ({
      kind,
      items: groups.get(kind) ?? [],
    }));
  }, [results]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.platform));
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-2 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs font-medium text-foreground mr-8">Search</span>
        <span className="ml-2 hidden items-center gap-1 text-[10px] uppercase text-muted-foreground sm:flex">
          <KbdGroup>
            <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Search everything</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks, events, notes, food, and more..."
              aria-label="Search everything"
            />

            <div className="max-h-[60vh] overflow-y-auto pr-2">
              {!trimmedQuery ? null : results === undefined ? (
                <p className="text-sm text-muted-foreground">Searching...</p>
              ) : results.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No results found.
                </p>
              ) : (
                <div className="space-y-6">
                  {groupedResults.map((group) => (
                    <div key={group.kind} className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {KIND_LABELS[group.kind]}
                      </div>
                      <div className="space-y-1">
                        {group.items.map((result) => {
                          const Icon = KIND_ICONS[result.kind];
                          const meta = getResultMeta(result);
                          return (
                            <Link
                              key={`${result.kind}-${result.id}`}
                              href={result.href}
                              onClick={() => setOpen(false)}
                              className="flex items-start gap-3 rounded-md px-2 py-2 transition hover:bg-muted"
                            >
                              <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {result.title}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] uppercase"
                                  >
                                    {KIND_LABELS[result.kind]}
                                  </Badge>
                                </div>
                                {meta ? (
                                  <p className="text-xs text-muted-foreground">
                                    {meta}
                                  </p>
                                ) : null}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
