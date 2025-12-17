"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { startOfDay, startOfWeek } from "date-fns";
import {
  Timer as TimerIcon,
  History,
  BarChart3,
  Play,
  Pause,
  Coffee,
  Zap,
  Brain,
  Clock,
  Tag,
  StickyNote,
  X,
} from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import { playTimerEndSound } from "@/lib/timers/sound";
import { getOrCreateTabId } from "@/lib/timers/tab-id";

type RunState =
  | {
      kind: "pomodoro";
      workMs: number;
      breakMs: number;
      cyclesPlanned: number;
      phase: "work" | "break";
      phaseEndsAt: number;
      cyclesCompleted: number;
      totalWorkMs: number;
      totalBreakMs: number;
      startedAt: number;
      sessionId: Id<"timerSessions">;
    }
  | {
      kind: "countdown";
      durationMs: number;
      endsAt: number;
      startedAt: number;
      sessionId: Id<"timerSessions">;
    }
  | {
      kind: "stopwatch";
      startedAt: number;
      sessionId: Id<"timerSessions">;
    };

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss.padStart(2, "0")}`;
}

export function TimersContent() {
  const tabId = useMemo(() => getOrCreateTabId(), []);

  const tasks = useQuery(api.tasks.list, {});
  const tags = useQuery(api.tags.list, {});
  const history = useQuery(api.timers.listHistory, { limit: 50 });
  const activeSession = useQuery(api.timers.getActiveForTab, { tabId });

  const startSession = useMutation(api.timers.startSession);
  const endSession = useMutation(api.timers.endSession);

  const [view, setView] = useState<"timer" | "history" | "stats">("timer");
  const [mode, setMode] = useState<"pomodoro" | "countdown" | "stopwatch">(
    "pomodoro"
  );

  const [taskId, setTaskId] = useState<string>("none");
  const [selectedTagIds, setSelectedTagIds] = useState<Array<string>>([]);
  const [note, setNote] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  const [pomodoroWorkMin, setPomodoroWorkMin] = useState(25);
  const [pomodoroBreakMin, setPomodoroBreakMin] = useState(5);
  const [pomodoroCycles, setPomodoroCycles] = useState(4);

  const [countdownMin, setCountdownMin] = useState(10);
  const [countdownSec, setCountdownSec] = useState(0);

  const [runState, setRunState] = useState<RunState | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [totalsNowMs, setTotalsNowMs] = useState(() => Date.now());
  const endingRef = useRef(false);

  const todayTotals = useQuery(api.timers.totals, {
    startAt: startOfDay(new Date()).getTime(),
    endAt: totalsNowMs,
  });
  const weekTotals = useQuery(api.timers.totals, {
    startAt: startOfWeek(new Date(), { weekStartsOn: 1 }).getTime(),
    endAt: totalsNowMs,
  });

  const taskById = useMemo(() => {
    const map = new Map<string, { title: string; tags: Id<"tags">[] }>();
    for (const t of tasks ?? [])
      map.set(t._id, { title: t.title, tags: t.tags });
    return map;
  }, [tasks]);

  const tagById = useMemo(() => {
    const map = new Map<
      string,
      { name: string; emoji: string; color: string }
    >();
    for (const t of tags ?? [])
      map.set(t._id, { name: t.name, emoji: t.emoji, color: t.color });
    return map;
  }, [tags]);

  const isRunning =
    runState !== null ||
    (activeSession?.status === "running" && activeSession.endedAt === 0);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setTotalsNowMs(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const endActive = async (opts: {
    status: "completed" | "cancelled";
    endReason: any;
    durationMs: number;
    result?: any;
  }) => {
    if (endingRef.current) return;
    endingRef.current = true;
    try {
      const sessionId = runState?.sessionId ?? activeSession?._id;
      if (!sessionId) return;
      await endSession({
        id: sessionId,
        status: opts.status,
        durationMs: opts.durationMs,
        endReason: opts.endReason,
        result: opts.result,
      });
    } finally {
      setRunState(null);
      endingRef.current = false;
    }
  };

  useEffect(() => {
    if (!isRunning) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";

      const startedAt =
        runState?.startedAt ?? activeSession?.startedAt ?? Date.now();
      void endActive({
        status: "cancelled",
        endReason: "tab_closed",
        durationMs: Math.max(0, Date.now() - startedAt),
      });
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isRunning, runState, activeSession]);

  useEffect(() => {
    return () => {
      const startedAt = runState?.startedAt ?? activeSession?.startedAt;
      const sessionId = runState?.sessionId ?? activeSession?._id;
      if (!sessionId || !startedAt) return;
      void endSession({
        id: sessionId,
        status: "cancelled",
        endReason: "navigation",
        durationMs: Math.max(0, Date.now() - startedAt),
        result: undefined,
      });
    };
  }, []);

  useEffect(() => {
    if (!runState || runState.kind !== "countdown") return;
    const remaining = runState.endsAt - nowMs;
    if (remaining > 0) return;

    playTimerEndSound();
    void endActive({
      status: "completed",
      endReason: "completed",
      durationMs: runState.durationMs,
      result: { kind: "countdown", completed: true },
    });
  }, [runState, nowMs]);

  useEffect(() => {
    if (!runState || runState.kind !== "pomodoro") return;
    const remaining = runState.phaseEndsAt - nowMs;
    if (remaining > 0) return;

    playTimerEndSound();

    if (runState.phase === "work") {
      const nextCyclesCompleted = runState.cyclesCompleted + 1;
      const nextTotalWorkMs = runState.totalWorkMs + runState.workMs;

      if (nextCyclesCompleted >= runState.cyclesPlanned) {
        void endActive({
          status: "completed",
          endReason: "completed",
          durationMs: Math.max(0, nowMs - runState.startedAt),
          result: {
            kind: "pomodoro",
            cyclesCompleted: nextCyclesCompleted,
            totalWorkMs: nextTotalWorkMs,
            totalBreakMs: runState.totalBreakMs,
          },
        });
        return;
      }

      setRunState({
        ...runState,
        phase: "break",
        cyclesCompleted: nextCyclesCompleted,
        totalWorkMs: nextTotalWorkMs,
        phaseEndsAt: nowMs + runState.breakMs,
      });
      return;
    }

    setRunState({
      ...runState,
      phase: "work",
      totalBreakMs: runState.totalBreakMs + runState.breakMs,
      phaseEndsAt: nowMs + runState.workMs,
    });
  }, [runState, nowMs]);

  const canStart = !isRunning;

  const normalizedTaskId =
    taskId === "none" ? undefined : (taskId as Id<"tasks">);
  const normalizedTagIds = selectedTagIds as Array<Id<"tags">>;

  const startPomodoro = async () => {
    const workMs = Math.max(1, pomodoroWorkMin) * 60_000;
    const breakMs = Math.max(1, pomodoroBreakMin) * 60_000;
    const cyclesPlanned = Math.max(1, pomodoroCycles);
    const startedAt = Date.now();

    const sessionId = await startSession({
      tabId,
      type: "pomodoro",
      taskId: normalizedTaskId,
      tagIds: normalizedTagIds.length > 0 ? normalizedTagIds : undefined,
      note: note.trim() ? note.trim() : undefined,
      config: { kind: "pomodoro", workMs, breakMs, cyclesPlanned },
    });

    setRunState({
      kind: "pomodoro",
      workMs,
      breakMs,
      cyclesPlanned,
      phase: "work",
      phaseEndsAt: startedAt + workMs,
      cyclesCompleted: 0,
      totalWorkMs: 0,
      totalBreakMs: 0,
      startedAt,
      sessionId,
    });
  };

  const startCountdown = async () => {
    const durationMs =
      Math.max(0, countdownMin) * 60_000 + Math.max(0, countdownSec) * 1000;
    if (durationMs <= 0) return;
    const startedAt = Date.now();
    const sessionId = await startSession({
      tabId,
      type: "countdown",
      taskId: normalizedTaskId,
      tagIds: normalizedTagIds.length > 0 ? normalizedTagIds : undefined,
      note: note.trim() ? note.trim() : undefined,
      config: { kind: "countdown", durationMs },
    });

    setRunState({
      kind: "countdown",
      durationMs,
      endsAt: startedAt + durationMs,
      startedAt,
      sessionId,
    });
  };

  const startStopwatch = async () => {
    const startedAt = Date.now();
    const sessionId = await startSession({
      tabId,
      type: "stopwatch",
      taskId: normalizedTaskId,
      tagIds: normalizedTagIds.length > 0 ? normalizedTagIds : undefined,
      note: note.trim() ? note.trim() : undefined,
      config: { kind: "stopwatch" },
    });
    setRunState({ kind: "stopwatch", startedAt, sessionId });
  };

  const stopNow = async () => {
    const startedAt =
      runState?.startedAt ?? activeSession?.startedAt ?? Date.now();
    const durationMs = Math.max(0, Date.now() - startedAt);

    const result =
      runState?.kind === "pomodoro"
        ? {
            kind: "pomodoro",
            cyclesCompleted: runState.cyclesCompleted,
            totalWorkMs: runState.totalWorkMs,
            totalBreakMs: runState.totalBreakMs,
          }
        : runState?.kind === "countdown"
          ? { kind: "countdown", completed: false }
          : { kind: "stopwatch" };

    await endActive({
      status: "cancelled",
      endReason: "stopped",
      durationMs,
      result,
    });
  };

  const runningDisplay = (() => {
    if (runState?.kind === "pomodoro") {
      const remaining = runState.phaseEndsAt - nowMs;
      const label = runState.phase === "work" ? "Focus" : "Break";
      return {
        headline: `${label} • ${runState.cyclesCompleted + 1}/${runState.cyclesPlanned}`,
        time: formatDuration(remaining),
      };
    }
    if (runState?.kind === "countdown") {
      const remaining = runState.endsAt - nowMs;
      return { headline: "Countdown", time: formatDuration(remaining) };
    }
    if (runState?.kind === "stopwatch") {
      return {
        headline: "Stopwatch",
        time: formatDuration(nowMs - runState.startedAt),
      };
    }
    if (activeSession?.status === "running" && activeSession.endedAt === 0) {
      return {
        headline: `Running ${activeSession.type}`,
        time: formatDuration(nowMs - activeSession.startedAt),
      };
    }
    return null;
  })();

  const progress = useMemo(() => {
    if (!runState) return 0;
    if (runState.kind === "pomodoro") {
      const elapsed =
        nowMs -
        runState.phaseEndsAt +
        (runState.phase === "work" ? runState.workMs : runState.breakMs);
      const total =
        runState.phase === "work" ? runState.workMs : runState.breakMs;
      return Math.min(100, Math.max(0, (elapsed / total) * 100));
    }
    if (runState.kind === "countdown") {
      const elapsed = runState.durationMs - (runState.endsAt - nowMs);
      return Math.min(100, Math.max(0, (elapsed / runState.durationMs) * 100));
    }
    return 0;
  }, [runState, nowMs]);

  return (
    <div className="min-h-screen">
      <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <div className="flex items-center gap-2">
            <TimerIcon className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Timer</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant={view === "timer" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("timer")}
            >
              <Clock className="h-4 w-4" />
              Timer
            </Button>
            <Button
              variant={view === "history" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("history")}
            >
              <History className="h-4 w-4" />
              History
            </Button>
            <Button
              variant={view === "stats" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("stats")}
            >
              <BarChart3 className="h-4 w-4" />
              Stats
            </Button>
          </div>
        </div>
      </div>

      {view === "timer" && (
        <div className="container max-w-5xl mx-auto px-4 py-8">
          <div className="mb-8">
            {isRunning && runningDisplay && (
              <Card className="border-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent" />
                <CardContent className="p-8 md:p-12 relative">
                  <div className="flex flex-col items-center text-center space-y-6">
                    <div className="flex items-center gap-2">
                      {runState?.kind === "pomodoro" &&
                        runState.phase === "work" && (
                          <>
                            <Brain className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium text-muted-foreground">
                              Focus Session
                            </span>
                          </>
                        )}
                      {runState?.kind === "pomodoro" &&
                        runState.phase === "break" && (
                          <>
                            <Coffee className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-medium text-muted-foreground">
                              Break Time
                            </span>
                          </>
                        )}
                      {runState?.kind === "countdown" && (
                        <>
                          <Clock className="h-5 w-5 text-blue-500" />
                          <span className="text-sm font-medium text-muted-foreground">
                            Countdown
                          </span>
                        </>
                      )}
                      {runState?.kind === "stopwatch" && (
                        <>
                          <Zap className="h-5 w-5 text-orange-500" />
                          <span className="text-sm font-medium text-muted-foreground">
                            Stopwatch
                          </span>
                        </>
                      )}
                    </div>

                    <div className="relative">
                      <div className="font-mono text-7xl md:text-8xl font-bold tracking-tight text-center">
                        {runningDisplay.time}
                      </div>
                    </div>

                    {runState?.kind === "pomodoro" && (
                      <div className="flex items-center gap-2">
                        {Array.from({ length: runState.cyclesPlanned }).map(
                          (_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-3 h-3 rounded-full border-2 transition-colors",
                                i < runState.cyclesCompleted
                                  ? "bg-primary border-primary"
                                  : "border-muted-foreground/30"
                              )}
                            />
                          )
                        )}
                      </div>
                    )}

                    {(taskId !== "none" ||
                      selectedTagIds.length > 0 ||
                      note) && (
                      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                        {taskId !== "none" && (
                          <Badge variant="secondary">
                            {taskById.get(taskId)?.title || "Task"}
                          </Badge>
                        )}
                        {selectedTagIds.slice(0, 3).map((id) => {
                          const t = tagById.get(id);
                          return (
                            <Badge key={id} variant="secondary">
                              {t?.emoji} {t?.name}
                            </Badge>
                          );
                        })}
                        {selectedTagIds.length > 3 && (
                          <Badge variant="secondary">
                            +{selectedTagIds.length - 3}
                          </Badge>
                        )}
                        {note && (
                          <Badge
                            variant="outline"
                            className="max-w-xs truncate"
                          >
                            <StickyNote className="h-3 w-3 mr-1" />
                            {note}
                          </Badge>
                        )}
                      </div>
                    )}

                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={() => void stopNow()}
                    >
                      <Pause className="h-5 w-5" />
                      Stop Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {!isRunning && (
            <>
              <div className="flex items-center justify-center gap-2 mb-6">
                <Button
                  variant={mode === "pomodoro" ? "default" : "outline"}
                  onClick={() => setMode("pomodoro")}
                >
                  <Brain className="h-4 w-4" />
                  Pomodoro
                </Button>
                <Button
                  variant={mode === "countdown" ? "default" : "outline"}
                  onClick={() => setMode("countdown")}
                >
                  <Clock className="h-4 w-4" />
                  Countdown
                </Button>
                <Button
                  variant={mode === "stopwatch" ? "default" : "outline"}
                  onClick={() => setMode("stopwatch")}
                >
                  <Zap className="h-4 w-4" />
                  Stopwatch
                </Button>
              </div>

              <Card className="mb-6">
                <CardContent>
                  {mode === "pomodoro" && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">
                          Pomodoro Technique
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Work in focused intervals with short breaks
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <Button
                          variant="outline"
                          className="h-20 flex-col"
                          onClick={() => {
                            setPomodoroWorkMin(15);
                            setPomodoroBreakMin(3);
                            setPomodoroCycles(4);
                          }}
                        >
                          <div className="text-2xl font-bold">15</div>
                          <div className="text-xs text-muted-foreground">
                            Quick Sprint
                          </div>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-20 flex-col"
                          onClick={() => {
                            setPomodoroWorkMin(25);
                            setPomodoroBreakMin(5);
                            setPomodoroCycles(4);
                          }}
                        >
                          <div className="text-2xl font-bold">25</div>
                          <div className="text-xs text-muted-foreground">
                            Classic
                          </div>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-20 flex-col"
                          onClick={() => {
                            setPomodoroWorkMin(45);
                            setPomodoroBreakMin(10);
                            setPomodoroCycles(3);
                          }}
                        >
                          <div className="text-2xl font-bold">45</div>
                          <div className="text-xs text-muted-foreground">
                            Deep Work
                          </div>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-20 flex-col"
                          onClick={() => {
                            setPomodoroWorkMin(90);
                            setPomodoroBreakMin(20);
                            setPomodoroCycles(2);
                          }}
                        >
                          <div className="text-2xl font-bold">90</div>
                          <div className="text-xs text-muted-foreground">
                            Flow State
                          </div>
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Focus (min)</Label>
                          <Input
                            type="number"
                            min={1}
                            value={pomodoroWorkMin}
                            onChange={(e) =>
                              setPomodoroWorkMin(Number(e.target.value))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Break (min)</Label>
                          <Input
                            type="number"
                            min={1}
                            value={pomodoroBreakMin}
                            onChange={(e) =>
                              setPomodoroBreakMin(Number(e.target.value))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cycles</Label>
                          <Input
                            type="number"
                            min={1}
                            value={pomodoroCycles}
                            onChange={(e) =>
                              setPomodoroCycles(Number(e.target.value))
                            }
                          />
                        </div>
                      </div>

                      <Button
                        size="lg"
                        className="w-full"
                        onClick={() => void startPomodoro()}
                      >
                        <Play className="h-5 w-5" />
                        Start Pomodoro
                      </Button>
                    </div>
                  )}

                  {mode === "countdown" && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">
                          Countdown Timer
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Set a specific duration and count down to zero
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[5, 10, 15, 30].map((min) => (
                          <Button
                            key={min}
                            variant="outline"
                            className="h-20 flex-col"
                            onClick={() => {
                              setCountdownMin(min);
                              setCountdownSec(0);
                            }}
                          >
                            <div className="text-2xl font-bold">{min}</div>
                            <div className="text-xs text-muted-foreground">
                              minutes
                            </div>
                          </Button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Minutes</Label>
                          <Input
                            type="number"
                            min={0}
                            value={countdownMin}
                            onChange={(e) =>
                              setCountdownMin(Number(e.target.value))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Seconds</Label>
                          <Input
                            type="number"
                            min={0}
                            max={59}
                            value={countdownSec}
                            onChange={(e) =>
                              setCountdownSec(Number(e.target.value))
                            }
                          />
                        </div>
                      </div>

                      <Button
                        size="lg"
                        className="w-full"
                        onClick={() => void startCountdown()}
                        disabled={countdownMin === 0 && countdownSec === 0}
                      >
                        <Play className="h-5 w-5" />
                        Start Countdown
                      </Button>
                    </div>
                  )}

                  {mode === "stopwatch" && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">
                          Stopwatch
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Track open-ended time for any activity
                        </p>
                      </div>

                      <div className="py-8 text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4">
                          <Zap className="h-12 w-12 text-primary" />
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Start the stopwatch and stop it whenever you're done
                        </p>
                      </div>

                      <Button
                        size="lg"
                        className="w-full"
                        onClick={() => void startStopwatch()}
                      >
                        <Play className="h-5 w-5" />
                        Start Stopwatch
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Settings</CardTitle>
                  <CardDescription>
                    Link this session to a task, tags, or add a note
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Task</Label>
                    <Select value={taskId} onValueChange={setTaskId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a task" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {(tasks ?? []).map((t) => (
                          <SelectItem key={t._id} value={t._id}>
                            {t.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            {selectedTagIds.length
                              ? `${selectedTagIds.length} selected`
                              : "Select tags"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-80">
                        <div className="text-sm font-medium mb-2">Tags</div>
                        <div className="max-h-64 overflow-auto space-y-2">
                          {(tags ?? []).map((t) => {
                            const checked = selectedTagIds.includes(t._id);
                            return (
                              <label
                                key={t._id}
                                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => {
                                    setSelectedTagIds((prev) =>
                                      prev.includes(t._id)
                                        ? prev.filter((x) => x !== t._id)
                                        : [...prev, t._id]
                                    );
                                  }}
                                />
                                <span className="text-lg">{t.emoji}</span>
                                <span className="flex-1">{t.name}</span>
                              </label>
                            );
                          })}
                        </div>
                        {selectedTagIds.length > 0 && (
                          <>
                            <Separator className="my-3" />
                            <Button
                              variant="ghost"
                              className="w-full"
                              onClick={() => setSelectedTagIds([])}
                            >
                              Clear All
                            </Button>
                          </>
                        )}
                      </PopoverContent>
                    </Popover>
                    {selectedTagIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedTagIds.map((id) => {
                          const t = tagById.get(id);
                          return (
                            <Badge
                              key={id}
                              variant="secondary"
                              className="gap-1"
                            >
                              {t?.emoji} {t?.name ?? "Tag"}
                              <button
                                className="ml-1 hover:text-destructive"
                                onClick={() =>
                                  setSelectedTagIds((prev) =>
                                    prev.filter((x) => x !== id)
                                  )
                                }
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Note</Label>
                    <Input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="What are you working on?"
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {view === "history" && (
        <div className="container max-w-5xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Session History</h2>
            <p className="text-muted-foreground">
              Your completed and cancelled timer sessions
            </p>
          </div>

          <div className="space-y-3">
            {(history ?? []).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No timer sessions yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start a timer to begin tracking your focus time
                  </p>
                </CardContent>
              </Card>
            ) : (
              (history ?? []).map((s) => {
                const task = s.taskId ? taskById.get(s.taskId) : undefined;
                const tagLabels = (s.tagIds ?? [])
                  .map((id) => tagById.get(id))
                  .filter(Boolean) as Array<{
                  name: string;
                  emoji: string;
                  color: string;
                }>;
                return (
                  <Card key={s._id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant={
                                s.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {s.type}
                            </Badge>
                            {s.status !== "completed" && (
                              <Badge variant="outline">{s.status}</Badge>
                            )}
                            <span className="font-medium">
                              {task?.title || s.note || "Unlinked session"}
                            </span>
                          </div>
                          {tagLabels.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {tagLabels.map((t) => (
                                <Badge
                                  key={`${s._id}-${t.name}`}
                                  variant="secondary"
                                >
                                  {t.emoji} {t.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {s.endedAt
                              ? new Date(s.endedAt).toLocaleString()
                              : ""}
                          </div>
                        </div>
                        <div className="sm:text-right">
                          <div className="font-mono text-3xl font-bold">
                            {formatDuration(s.durationMs)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {view === "stats" && (
        <div className="container max-w-5xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Time Statistics</h2>
            <p className="text-muted-foreground">
              Your focus time breakdown by period
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TotalsCard
              title="Today"
              totals={todayTotals}
              tagById={tagById}
              taskById={taskById}
            />
            <TotalsCard
              title="This Week"
              totals={weekTotals}
              tagById={tagById}
              taskById={taskById}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TotalsCard({
  title,
  totals,
  tagById,
  taskById,
}: {
  title: string;
  totals:
    | undefined
    | {
        totalDurationMs: number;
        byTag: Array<{ tagId: Id<"tags">; durationMs: number }>;
        byTask: Array<{ taskId: Id<"tasks">; durationMs: number }>;
      };
  tagById: Map<string, { name: string; emoji: string; color: string }>;
  taskById: Map<string, { title: string; tags: Id<"tags">[] }>;
}) {
  const byTag = [...(totals?.byTag ?? [])]
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 10);
  const byTask = [...(totals?.byTask ?? [])]
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 10);
  const maxDuration = Math.max(
    ...byTag.map((t) => t.durationMs),
    ...byTask.map((t) => t.durationMs),
    1
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="mt-4 p-4 rounded-lg bg-linear-to-br from-primary/5 to-transparent">
          <div className="text-sm text-muted-foreground mb-1">
            Total Focus Time
          </div>
          <div className="font-mono text-3xl font-bold">
            {formatDuration(totals?.totalDurationMs ?? 0)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-semibold">By Tag</h4>
          </div>
          {byTag.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              No time tracked yet
            </div>
          ) : (
            <div className="space-y-3">
              {byTag.map((row) => {
                const t = tagById.get(row.tagId);
                const percentage = (row.durationMs / maxDuration) * 100;
                return (
                  <div key={row.tagId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {t ? (
                          <>
                            <span className="text-lg">{t.emoji}</span>
                            <span className="font-medium">{t.name}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            Unknown tag
                          </span>
                        )}
                      </div>
                      <div className="font-mono font-semibold">
                        {formatDuration(row.durationMs)}
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Separator />

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-semibold">By Task</h4>
          </div>
          {byTask.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              No time tracked yet
            </div>
          ) : (
            <div className="space-y-3">
              {byTask.map((row) => {
                const t = taskById.get(row.taskId);
                const percentage = (row.durationMs / maxDuration) * 100;
                return (
                  <div key={row.taskId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-medium truncate flex-1">
                        {t?.title ?? "Unknown task"}
                      </div>
                      <div className="font-mono font-semibold">
                        {formatDuration(row.durationMs)}
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
