"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Sparkles,
  Plus,
  Check,
  Flame,
  TrendingUp,
  Calendar as CalendarIcon,
  Edit,
  Trash2,
  Archive,
  MoreVertical,
  Trophy,
  Target,
  Zap,
  BarChart3,
  X,
} from "lucide-react";
import {
  startOfDay,
  format,
  subDays,
  eachDayOfInterval,
  startOfMonth,
  startOfWeek,
  addWeeks,
  addMonths,
  subWeeks,
  subMonths,
} from "date-fns";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmojiPicker, EmojiPickerContent, EmojiPickerFooter, EmojiPickerSearch } from "@/components/ui/emoji-picker";
import { cn } from "@/lib/utils";

const HABIT_COLOR_PRESETS: Array<{ label: string; hex: string }> = [
  { label: "Blue", hex: "#3b82f6" },
  { label: "Green", hex: "#22c55e" },
  { label: "Orange", hex: "#f97316" },
  { label: "Red", hex: "#ef4444" },
  { label: "Cyan", hex: "#06b6d4" },
  { label: "Indigo", hex: "#6366f1" },
  { label: "Violet", hex: "#8b5cf6" },
  { label: "Purple", hex: "#a855f7" },
];

const HABIT_TEMPLATES = [
  {
    name: "Take Vitamins",
    emoji: "💊",
    color: "#06b6d4",
    frequency: { type: "daily" as const, times: 1, period: "day" as const },
  },
  {
    name: "Exercise",
    emoji: "💪",
    color: "#f97316",
    frequency: { type: "weekly" as const, times: 3, period: "week" as const },
  },
  {
    name: "Meditate",
    emoji: "🧘",
    color: "#8b5cf6",
    frequency: { type: "daily" as const, times: 1, period: "day" as const },
    target: { value: 10, unit: "minutes" },
  },
  {
    name: "Read",
    emoji: "📚",
    color: "#3b82f6",
    frequency: { type: "daily" as const, times: 1, period: "day" as const },
    target: { value: 30, unit: "pages" },
  },
  {
    name: "Sleep 8 Hours",
    emoji: "😴",
    color: "#6366f1",
    frequency: { type: "daily" as const, times: 1, period: "day" as const },
    target: { value: 8, unit: "hours" },
  },
  {
    name: "Walk",
    emoji: "🚶",
    color: "#22c55e",
    frequency: { type: "daily" as const, times: 1, period: "day" as const },
    target: { value: 10000, unit: "steps" },
  },
  {
    name: "Journal",
    emoji: "📝",
    color: "#a855f7",
    frequency: { type: "daily" as const, times: 1, period: "day" as const },
  },
  {
    name: "No Social Media",
    emoji: "📵",
    color: "#ef4444",
    frequency: { type: "daily" as const, times: 1, period: "day" as const },
  },
];

export function HabitsContent() {
  const habits = useQuery(api.habits.list, { includeArchived: false });
  const createHabit = useMutation(api.habits.create);
  const updateHabit = useMutation(api.habits.update);
  const removeHabit = useMutation(api.habits.remove);
  const checkin = useMutation(api.habits.checkin);

  const [view, setView] = useState<"overview" | "templates" | "analytics">(
    "overview"
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [deleteHabitId, setDeleteHabitId] = useState<Id<"habits"> | null>(
    null
  );

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    emoji: "✨",
    color: "#3b82f6",
    frequencyType: "daily" as "daily" | "weekly" | "custom",
    frequencyTimes: 1,
    frequencyPeriod: "day" as "day" | "week" | "month",
    hasTarget: false,
    targetValue: 0,
    targetUnit: "",
  });

  const handleCreateHabit = async () => {
    if (!formData.name) return;

    await createHabit({
      name: formData.name,
      description: formData.description || undefined,
      emoji: formData.emoji,
      color: formData.color,
      frequency: {
        type: formData.frequencyType,
        times: formData.frequencyTimes,
        period: formData.frequencyPeriod,
      },
      target: formData.hasTarget
        ? { value: formData.targetValue, unit: formData.targetUnit }
        : undefined,
    });

    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleUpdateHabit = async () => {
    if (!editingHabit || !formData.name) return;

    await updateHabit({
      id: editingHabit._id,
      name: formData.name,
      description: formData.description || undefined,
      emoji: formData.emoji,
      color: formData.color,
      frequency: {
        type: formData.frequencyType,
        times: formData.frequencyTimes,
        period: formData.frequencyPeriod,
      },
      target: formData.hasTarget
        ? { value: formData.targetValue, unit: formData.targetUnit }
        : undefined,
    });

    setIsEditDialogOpen(false);
    setEditingHabit(null);
    resetForm();
  };

  const handleEditClick = (habit: any) => {
    setEditingHabit(habit);
    setFormData({
      name: habit.name,
      description: habit.description || "",
      emoji: habit.emoji,
      color: habit.color,
      frequencyType: habit.frequency.type,
      frequencyTimes: habit.frequency.times,
      frequencyPeriod: habit.frequency.period,
      hasTarget: !!habit.target,
      targetValue: habit.target?.value || 0,
      targetUnit: habit.target?.unit || "",
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      emoji: "✨",
      color: "#3b82f6",
      frequencyType: "daily",
      frequencyTimes: 1,
      frequencyPeriod: "day",
      hasTarget: false,
      targetValue: 0,
      targetUnit: "",
    });
  };

  const handleTemplateSelect = (template: (typeof HABIT_TEMPLATES)[0]) => {
    setFormData({
      name: template.name,
      description: "",
      emoji: template.emoji,
      color: template.color,
      frequencyType: template.frequency.type,
      frequencyTimes: template.frequency.times,
      frequencyPeriod: template.frequency.period,
      hasTarget: !!template.target,
      targetValue: template.target?.value || 0,
      targetUnit: template.target?.unit || "",
    });
    setView("overview");
    setIsCreateDialogOpen(true);
  };

  return (
    <div>
      <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center px-4 justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Habits</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === "overview" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("overview")}
            >
              <Target className="h-4 w-4" />
              My Habits
            </Button>
            <Button
              variant={view === "analytics" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("analytics")}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
            <Button
              variant={view === "templates" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("templates")}
            >
              <Zap className="h-4 w-4" />
              Templates
            </Button>
          </div>
        </div>
      </div>

      {view === "overview" && (
        <div className="px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Your Daily Habits</h2>
              <p className="text-muted-foreground">
                Build consistency, track progress, and maintain your streaks
              </p>
            </div>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="h-5 w-5" />
                  New Habit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Habit</DialogTitle>
                  <DialogDescription>
                    Build a new habit to track your progress
                  </DialogDescription>
                </DialogHeader>
                <HabitForm
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleCreateHabit}
                  submitLabel="Create Habit"
                />
              </DialogContent>
            </Dialog>
          </div>

          {(!habits || habits.length === 0) && (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No habits yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start building better habits today
                </p>
                <Button onClick={() => setView("templates")} variant="outline">
                  <Zap className="h-4 w-4" />
                  Browse Templates
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(habits || []).map((habit) => (
              <HabitCard
                key={habit._id}
                habit={habit}
                onCheckin={checkin}
                onEdit={() => handleEditClick(habit)}
                onDelete={() => setDeleteHabitId(habit._id)}
              />
            ))}
          </div>
        </div>
      )}

      {view === "analytics" && <AnalyticsView habits={habits || []} />}

      {view === "templates" && (
        <div className="px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Habit Templates</h2>
            <p className="text-muted-foreground">
              Get started quickly with popular habit templates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {HABIT_TEMPLATES.map((template) => (
              <Card
                key={template.name}
                className="hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => handleTemplateSelect(template)}
              >
                <CardContent className="p-6 text-center">
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: `${template.color}20`,
                      color: template.color,
                    }}
                  >
                    {template.emoji}
                  </div>
                  <h3 className="font-semibold mb-2">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {template.frequency.times}x per {template.frequency.period}
                  </p>
                  {template.target && (
                    <Badge variant="secondary" className="mt-2">
                      Goal: {template.target.value} {template.target.unit}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Habit</DialogTitle>
            <DialogDescription>
              Update your habit settings
            </DialogDescription>
          </DialogHeader>
          <HabitForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdateHabit}
            submitLabel="Save Changes"
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteHabitId !== null}
        onOpenChange={(open) => !open && setDeleteHabitId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this habit and all its check-in
              history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteHabitId) {
                  removeHabit({ id: deleteHabitId });
                  setDeleteHabitId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function HabitForm({
  formData,
  setFormData,
  onSubmit,
  submitLabel,
}: {
  formData: any;
  setFormData: any;
  onSubmit: () => void;
  submitLabel: string;
}) {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  return (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label>Habit Name</Label>
          <Input
            placeholder="e.g., Morning Exercise"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Emoji</Label>
          <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                type="button"
              >
                <span className="text-2xl mr-2">{formData.emoji}</span>
                Choose emoji
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <EmojiPicker
                onEmojiSelect={(emoji) => {
                  setFormData({ ...formData, emoji: emoji.emoji });
                  setEmojiPickerOpen(false);
                }}
              >
                <EmojiPickerSearch placeholder="Search emoji..." />
                <EmojiPickerContent className="h-[300px]" />
                <EmojiPickerFooter />
              </EmojiPicker>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {HABIT_COLOR_PRESETS.map((c) => (
              <Badge
                key={c.label}
                variant={formData.color === c.hex ? "default" : "outline"}
                className="cursor-pointer select-none"
                style={
                  formData.color === c.hex
                    ? { backgroundColor: c.hex, borderColor: c.hex }
                    : { borderColor: c.hex, color: c.hex }
                }
                onClick={() => setFormData({ ...formData, color: c.hex })}
              >
                {c.label}
                {formData.color === c.hex && <X className="w-3 h-3 ml-1" />}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2 col-span-2">
          <Label>Description (optional)</Label>
          <Textarea
            placeholder="Why is this habit important to you?"
            value={formData.description}
            onChange={(e) =>
              setFormData({
                ...formData,
                description: e.target.value,
              })
            }
            rows={2}
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label>Frequency</Label>
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="number"
              min={1}
              value={formData.frequencyTimes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  frequencyTimes: Number(e.target.value),
                })
              }
            />
            <span className="flex items-center justify-center text-sm text-muted-foreground">
              times per
            </span>
            <Select
              value={formData.frequencyPeriod}
              onValueChange={(value: any) =>
                setFormData({ ...formData, frequencyPeriod: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button onClick={onSubmit} className="w-full" size="lg">
        {submitLabel}
      </Button>
    </div>
  );
}

function HabitCard({
  habit,
  onCheckin,
  onEdit,
  onDelete,
}: {
  habit: any;
  onCheckin: any;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const checkins = useQuery(api.habits.getCheckins, { habitId: habit._id });
  const streaks = useQuery(api.habits.getStreaks, { habitId: habit._id });

  const period = habit.frequency.period as "day" | "week" | "month";
  const timesRequired = Math.max(1, habit.frequency.times as number);

  const periodStart = useMemo(() => {
    const now = new Date();
    if (period === "day") return startOfDay(now).getTime();
    if (period === "week") return startOfWeek(now, { weekStartsOn: 1 }).getTime();
    return startOfMonth(now).getTime();
  }, [period]);

  const periodEnd = useMemo(() => {
    if (period === "day") return periodStart + 24 * 60 * 60 * 1000;
    if (period === "week") return addWeeks(new Date(periodStart), 1).getTime();
    return addMonths(new Date(periodStart), 1).getTime();
  }, [period, periodStart]);

  const checkinsInPeriod = useMemo(() => {
    if (!checkins) return [];
    return checkins.filter((c) => c.timestamp >= periodStart && c.timestamp < periodEnd);
  }, [checkins, periodStart, periodEnd]);

  const canCheckin = checkinsInPeriod.length < timesRequired;

  const last7Days = useMemo(() => {
    if (period !== "day") return [];
    const days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });
    return days.map((day) => {
      const dayStart = startOfDay(day).getTime();
      const dayCheckins = checkins?.filter((c) => {
        const checkinDay = startOfDay(new Date(c.timestamp)).getTime();
        return checkinDay === dayStart;
      });
      return {
        date: day,
        count: dayCheckins?.length || 0,
        target: timesRequired,
      };
    });
  }, [checkins, timesRequired, period]);

  const recentPeriods = useMemo(() => {
    if (!checkins) return [];
    const now = new Date();
    if (period === "week") {
      const weeks = Array.from({ length: 8 }, (_, i) => startOfWeek(subWeeks(now, 7 - i), { weekStartsOn: 1 }));
      return weeks.map((ws) => {
        const start = ws.getTime();
        const end = addWeeks(ws, 1).getTime();
        const done = checkins.filter((c) => c.timestamp >= start && c.timestamp < end).length;
        return { label: format(ws, "MMM d"), done, target: timesRequired };
      });
    }
    if (period === "month") {
      const months = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(now, 5 - i)));
      return months.map((ms) => {
        const start = ms.getTime();
        const end = addMonths(ms, 1).getTime();
        const done = checkins.filter((c) => c.timestamp >= start && c.timestamp < end).length;
        return { label: format(ms, "MMM"), done, target: timesRequired };
      });
    }
    return [];
  }, [checkins, period, timesRequired]);

  const periodLabel = period === "day" ? "Today" : period === "week" ? "This week" : "This month";

  const handleCheckin = async () => {
    if (!canCheckin) return;
    await onCheckin({ habitId: habit._id });
  };

  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: habit.color }}
      />
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{
                backgroundColor: `${habit.color}20`,
                color: habit.color,
              }}
            >
              {habit.emoji}
            </div>
            <div>
              <CardTitle className="text-lg">{habit.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {habit.frequency.times}x per {habit.frequency.period}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 text-orange-500 mb-1">
                <Flame className="h-4 w-4" />
                <span className="font-bold text-lg">
                  {streaks?.current || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{period} streak</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-amber-500 mb-1">
                <Trophy className="h-4 w-4" />
                <span className="font-bold text-lg">
                  {streaks?.longest || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">best</p>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleCheckin}
            disabled={!canCheckin}
            className="rounded-full w-16 h-16"
            style={{
              backgroundColor: canCheckin ? habit.color : undefined,
            }}
          >
            <Check className="h-6 w-6" />
          </Button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-muted-foreground">{periodLabel} progress</span>
            <span className="font-medium">
              {checkinsInPeriod.length} / {timesRequired}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${(checkinsInPeriod.length / timesRequired) * 100}%`,
                backgroundColor: habit.color,
              }}
            />
          </div>
        </div>

        {period === "day" && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Last 7 days</p>
            <div className="grid grid-cols-7 gap-1">
              {last7Days.map((day, i) => {
                const completed = day.count >= day.target;
                return (
                  <div
                    key={i}
                    style={{
                      backgroundColor: completed
                        ? habit.color
                        : day.count > 0
                          ? `${habit.color}40`
                          : undefined,
                    }}
                    className={cn(
                      "aspect-square rounded flex flex-col items-center justify-center text-xs",
                      !completed && day.count === 0 && "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        completed || day.count > 0
                          ? "text-white"
                          : "text-muted-foreground"
                      )}
                    >
                      {format(day.date, "EEE")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {period !== "day" && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              {period === "week" ? "Last 8 weeks" : "Last 6 months"}
            </p>
            <div className={cn("grid gap-1", period === "week" ? "grid-cols-8" : "grid-cols-6")}>
              {recentPeriods.map((p) => {
                const completed = p.done >= p.target;
                const partial = p.done > 0 && !completed;
                return (
                  <div
                    key={p.label}
                    title={`${p.label}: ${p.done}/${p.target}`}
                    style={{
                      backgroundColor: completed ? habit.color : partial ? `${habit.color}40` : undefined,
                    }}
                    className={cn(
                      "aspect-square rounded flex items-center justify-center",
                      !completed && !partial && "bg-muted"
                    )}
                  >
                    <span className={cn("text-[10px] font-semibold", completed || partial ? "text-white" : "text-muted-foreground")}>
                      {period === "week" ? "W" : p.label[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalyticsView({ habits }: { habits: any[] }) {
  const start = startOfMonth(new Date()).getTime();
  const end = Date.now();
  const analytics = useQuery(api.habits.analyticsSummary, { startDate: start, endDate: end });

  return (
    <div className="px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Habit Analytics</h2>
        <p className="text-muted-foreground">
          Track your progress and celebrate your wins
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Total Check-ins (This Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{analytics?.totals.totalCheckins ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Across all habits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Total Unique Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{analytics?.totals.uniqueDays ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Days you've completed at least one habit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Longest Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flame className="h-8 w-8 text-orange-500" />
              <div className="text-4xl font-bold">{analytics?.totals.longestStreak ?? 0}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Your personal best
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Habit Performance</CardTitle>
          <CardDescription>
            Completion rates for each of your habits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(analytics?.perHabit ?? []).map((row) => {
            const completionRate = row.completionRate ?? 0;

            return (
              <div key={row.habitId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                      style={{
                        backgroundColor: `${row.color}20`,
                        color: row.color,
                      }}
                    >
                      {row.emoji}
                    </div>
                    <div>
                      <div className="font-medium">{row.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {row.monthActualCheckins} / {row.expectedCheckins} check-ins
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-orange-500">
                        <Flame className="h-4 w-4" />
                        <span className="font-bold">
                          {row.currentStreak || 0}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">streak</p>
                    </div>
                    <div className="text-right min-w-[60px]">
                      <div className="font-bold text-lg">
                        {completionRate.toFixed(0)}%
                      </div>
                      <p className="text-xs text-muted-foreground">complete</p>
                    </div>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${completionRate}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
