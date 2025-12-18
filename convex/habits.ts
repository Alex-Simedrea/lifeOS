import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

function dayKey(timestamp: number) {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function addDays(ts: number, days: number) {
  return ts + days * 24 * 60 * 60 * 1000;
}

function startOfDayMs(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeekMs(ts: number, weekStartsOn: 0 | 1 = 1) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0..6
  const diff = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

function startOfMonthMs(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d.getTime();
}

function startOfPeriodMs(period: "day" | "week" | "month", ts: number) {
  if (period === "day") return startOfDayMs(ts);
  if (period === "week") return startOfWeekMs(ts, 1);
  return startOfMonthMs(ts);
}

function addPeriodMs(period: "day" | "week" | "month", ts: number, count: number) {
  if (period === "day") return addDays(ts, count);
  if (period === "week") return addDays(ts, count * 7);
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  d.setMonth(d.getMonth() + count);
  return d.getTime();
}

function computePeriodStreaksFromCounts(args: {
  period: "day" | "week" | "month";
  timesRequired: number;
  timestamps: number[];
}) {
  const { period, timesRequired, timestamps } = args;
  if (timestamps.length === 0) return { current: 0, longest: 0, total: 0 };

  const countsByPeriod = new Map<number, number>();
  for (const ts of timestamps) {
    const start = startOfPeriodMs(period, ts);
    countsByPeriod.set(start, (countsByPeriod.get(start) ?? 0) + 1);
  }

  const completedPeriods = Array.from(countsByPeriod.entries())
    .filter(([, c]) => c >= timesRequired)
    .map(([p]) => p)
    .sort((a, b) => a - b);

  if (completedPeriods.length === 0) return { current: 0, longest: 0, total: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < completedPeriods.length; i++) {
    const prev = completedPeriods[i - 1];
    const cur = completedPeriods[i];
    const expectedNext = addPeriodMs(period, prev, 1);
    if (cur === expectedNext) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  // Current streak: consecutive completed periods ending at the last completed period.
  let current = 1;
  for (let i = completedPeriods.length - 2; i >= 0; i--) {
    const expected = addPeriodMs(period, completedPeriods[i], 1);
    if (completedPeriods[i + 1] === expected) current += 1;
    else break;
  }

  return { current, longest: Math.max(longest, current), total: completedPeriods.length };
}

const frequencyValidator = v.object({
  type: v.union(v.literal("daily"), v.literal("weekly"), v.literal("custom")),
  times: v.number(),
  period: v.union(v.literal("day"), v.literal("week"), v.literal("month")),
});

const targetValidator = v.optional(
  v.object({
    value: v.number(),
    unit: v.string(),
  })
);

export const list = query({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user_archived", (q) =>
        q.eq("userId", identity.subject).eq("archived", args.includeArchived ?? false)
      )
      .collect();

    return habits.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const get = query({
  args: { id: v.id("habits") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const habit = await ctx.db.get(args.id);
    if (!habit || habit.userId !== identity.subject) {
      throw new Error("Habit not found or unauthorized");
    }

    return habit;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    emoji: v.string(),
    color: v.string(),
    frequency: frequencyValidator,
    target: targetValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const habitId = await ctx.db.insert("habits", {
      userId: identity.subject,
      name: args.name,
      description: args.description,
      emoji: args.emoji,
      color: args.color,
      frequency: args.frequency,
      target: args.target,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });

    return habitId;
  },
});

export const update = mutation({
  args: {
    id: v.id("habits"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    emoji: v.optional(v.string()),
    color: v.optional(v.string()),
    frequency: v.optional(frequencyValidator),
    target: targetValidator,
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const habit = await ctx.db.get(args.id);
    if (!habit || habit.userId !== identity.subject) {
      throw new Error("Habit not found or unauthorized");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.emoji !== undefined) updates.emoji = args.emoji;
    if (args.color !== undefined) updates.color = args.color;
    if (args.frequency !== undefined) updates.frequency = args.frequency;
    if (args.target !== undefined) updates.target = args.target;
    if (args.archived !== undefined) updates.archived = args.archived;

    await ctx.db.patch(args.id, updates);
    return true;
  },
});

export const remove = mutation({
  args: { id: v.id("habits") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const habit = await ctx.db.get(args.id);
    if (!habit || habit.userId !== identity.subject) {
      throw new Error("Habit not found or unauthorized");
    }

    await ctx.db.delete(args.id);

    const checkins = await ctx.db
      .query("habitCheckins")
      .withIndex("by_habit", (q) => q.eq("habitId", args.id))
      .collect();

    for (const checkin of checkins) {
      await ctx.db.delete(checkin._id);
    }

    return true;
  },
});

export const checkin = mutation({
  args: {
    habitId: v.id("habits"),
    timestamp: v.optional(v.number()),
    value: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== identity.subject) {
      throw new Error("Habit not found or unauthorized");
    }

    const checkinId = await ctx.db.insert("habitCheckins", {
      userId: identity.subject,
      habitId: args.habitId,
      timestamp: args.timestamp ?? Date.now(),
      value: args.value,
      note: args.note,
    });

    return checkinId;
  },
});

export const removeCheckin = mutation({
  args: { id: v.id("habitCheckins") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const checkin = await ctx.db.get(args.id);
    if (!checkin || checkin.userId !== identity.subject) {
      throw new Error("Checkin not found or unauthorized");
    }

    await ctx.db.delete(args.id);
    return true;
  },
});

export const getCheckins = query({
  args: {
    habitId: v.id("habits"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== identity.subject) {
      throw new Error("Habit not found or unauthorized");
    }

    let checkins = await ctx.db
      .query("habitCheckins")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .collect();

    if (args.startDate !== undefined) {
      checkins = checkins.filter((c) => c.timestamp >= args.startDate!);
    }
    if (args.endDate !== undefined) {
      checkins = checkins.filter((c) => c.timestamp <= args.endDate!);
    }

    return checkins.sort((a, b) => b.timestamp - a.timestamp);
  },
});

export const getAllCheckinsForDate = query({
  args: {
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const startOfDay = new Date(args.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(args.date);
    endOfDay.setHours(23, 59, 59, 999);

    const checkins = await ctx.db
      .query("habitCheckins")
      .withIndex("by_user_date", (q) => q.eq("userId", identity.subject))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), startOfDay.getTime()),
          q.lte(q.field("timestamp"), endOfDay.getTime())
        )
      )
      .collect();

    return checkins;
  },
});

export const getAllCheckinsForPeriod = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const start = Math.min(args.startDate, args.endDate);
    const end = Math.max(args.startDate, args.endDate);

    const checkins = await ctx.db
      .query("habitCheckins")
      .withIndex("by_user_date", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.and(q.gte(q.field("timestamp"), start), q.lte(q.field("timestamp"), end)))
      .collect();

    const habitIds = Array.from(new Set(checkins.map((c) => c.habitId)));
    const habits = await Promise.all(habitIds.map((id) => ctx.db.get(id)));
    const habitById = new Map<string, (typeof habits)[number]>();
    for (const h of habits) {
      if (!h) continue;
      if (h.userId !== identity.subject) continue;
      habitById.set(h._id, h);
    }

    return checkins
      .map((c) => ({
        ...c,
        habit: habitById.get(c.habitId) ?? null,
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
  },
});

export const getStreaks = query({
  args: {
    habitId: v.id("habits"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== identity.subject) {
      throw new Error("Habit not found or unauthorized");
    }

    const checkins = await ctx.db
      .query("habitCheckins")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .collect();

    return computePeriodStreaksFromCounts({
      period: habit.frequency.period,
      timesRequired: Math.max(1, habit.frequency.times),
      timestamps: checkins.map((c) => c.timestamp),
    });
  },
});

export const analyticsSummary = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const start = Math.min(args.startDate, args.endDate);
    const end = Math.max(args.startDate, args.endDate);

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user_archived", (q) => q.eq("userId", identity.subject).eq("archived", false))
      .collect();

    const checkins = await ctx.db
      .query("habitCheckins")
      .withIndex("by_user_date", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.and(q.gte(q.field("timestamp"), start), q.lte(q.field("timestamp"), end)))
      .collect();

    const totalCheckins = checkins.length;
    const uniqueDays = new Set(checkins.map((c) => dayKey(c.timestamp))).size;

    const timestampsByHabit = new Map<string, number[]>();
    for (const c of checkins) {
      const arr = timestampsByHabit.get(c.habitId) ?? [];
      arr.push(c.timestamp);
      timestampsByHabit.set(c.habitId, arr);
    }

    const daysInPeriod = Math.max(1, Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1);
    const weeksInPeriod = Math.max(1, Math.ceil(daysInPeriod / 7));
    const startMonth = new Date(start);
    const endMonth = new Date(end);
    const monthsInPeriod = Math.max(
      1,
      (endMonth.getFullYear() - startMonth.getFullYear()) * 12 + (endMonth.getMonth() - startMonth.getMonth()) + 1
    );

    const perHabit = habits.map((h) => {
      const timestamps = timestampsByHabit.get(h._id) ?? [];
      const streaks = computePeriodStreaksFromCounts({
        period: h.frequency.period,
        timesRequired: Math.max(1, h.frequency.times),
        timestamps,
      });

      const expected =
        h.frequency.period === "day"
          ? h.frequency.times * daysInPeriod
          : h.frequency.period === "week"
            ? h.frequency.times * weeksInPeriod
            : h.frequency.times * monthsInPeriod;

      const completionRate = expected > 0 ? Math.min(100, (timestamps.length / expected) * 100) : 0;

      return {
        habitId: h._id as Id<"habits">,
        name: h.name,
        emoji: h.emoji,
        color: h.color,
        frequency: h.frequency,
        monthActualCheckins: timestamps.length,
        expectedCheckins: expected,
        completionRate,
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
        totalDays: streaks.total,
      };
    });

    const longestStreak = perHabit.reduce((m, h) => Math.max(m, h.longestStreak), 0);

    return {
      totals: {
        totalCheckins,
        uniqueDays,
        longestStreak,
      },
      perHabit,
    };
  },
});

