import { v } from "convex/values";

import { query } from "./_generated/server";

function matchesQuery(value: string | undefined, query: string) {
  if (!value) return false;
  return value.toLowerCase().includes(query);
}

function matchesAny(values: Array<string | undefined>, query: string) {
  return values.some((value) => matchesQuery(value, query));
}

export const searchAll = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const queryText = args.query.trim().toLowerCase();
    if (!queryText) return [];

    const limit = Math.min(Math.max(args.limit ?? 40, 1), 100);
    const results: Array<Record<string, any>> = [];

    const pushResult = (result: Record<string, any>) => {
      if (results.length < limit) results.push(result);
    };

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    for (const task of tasks) {
      if (!matchesAny([task.title, task.notes], queryText)) continue;
      pushResult({
        kind: "task",
        id: task._id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueAt: task.dueAt,
        startAt: task.startAt,
        timestamp: task.updatedAt ?? task.createdAt,
        href: "/tasks",
      });
    }

    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    for (const event of events) {
      if (!matchesAny([event.title, event.location, event.notes], queryText))
        continue;
      pushResult({
        kind: "event",
        id: event._id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        timestamp: event.startDate,
        href: "/calendar",
      });
    }

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    for (const habit of habits) {
      if (!matchesAny([habit.name, habit.description], queryText)) continue;
      pushResult({
        kind: "habit",
        id: habit._id,
        title: habit.name,
        emoji: habit.emoji,
        color: habit.color,
        frequency: habit.frequency,
        timestamp: habit.updatedAt ?? habit.createdAt,
        href: "/habits",
      });
    }

    const hydrationEntries = await ctx.db
      .query("hydrationEntries")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    for (const entry of hydrationEntries) {
      const amountText = `${entry.amountMl}`;
      if (!matchesAny([entry.note, amountText], queryText)) continue;
      pushResult({
        kind: "hydration",
        id: entry._id,
        title: entry.note ?? "Water entry",
        amountMl: entry.amountMl,
        timestamp: entry.timestamp,
        href: "/hydration",
      });
    }

    const foodEntries = await ctx.db
      .query("foodEntries")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    for (const entry of foodEntries) {
      if (
        !matchesAny(
          [entry.name, entry.notes, entry.mealType, `${entry.calories ?? ""}`],
          queryText
        )
      )
        continue;
      pushResult({
        kind: "food",
        id: entry._id,
        title: entry.name,
        mealType: entry.mealType,
        calories: entry.calories,
        timestamp: entry.timestamp,
        href: "/food",
      });
    }

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    for (const note of notes) {
      if (!matchesAny([note.title, note.content], queryText)) continue;
      pushResult({
        kind: "note",
        id: note._id,
        title: note.title,
        timestamp: note.updatedAt,
        href: `/notes?note=${note._id}`,
      });
    }

    const timerSessions = await ctx.db
      .query("timerSessions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    for (const session of timerSessions) {
      if (!matchesAny([session.note, session.type], queryText)) continue;
      pushResult({
        kind: "timer",
        id: session._id,
        title: session.note ?? session.type,
        type: session.type,
        durationMs: session.durationMs,
        timestamp: session.endedAt,
        href: "/timers",
      });
    }

    const tags = await ctx.db
      .query("tags")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    for (const tag of tags) {
      if (!matchesAny([tag.name, tag.emoji], queryText)) continue;
      pushResult({
        kind: "tag",
        id: tag._id,
        title: tag.name,
        emoji: tag.emoji,
        color: tag.color,
        timestamp: 0,
        href: "/tasks",
      });
    }

    return results
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
      .slice(0, limit);
  },
});
