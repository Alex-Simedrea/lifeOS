import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper functions
function startOfDayMs(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfDayMs(ts: number) {
  const d = new Date(ts);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

// Get or create user's hydration settings
export const getSettings = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const settings = await ctx.db
      .query("hydrationSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    // Return default settings if none exist
    if (!settings) {
      return {
        userId: identity.subject,
        dailyGoalMl: 2000,
        bottlePresets: [250, 500, 750, 1000],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    return settings;
  },
});

// Update hydration settings
export const updateSettings = mutation({
  args: {
    dailyGoalMl: v.optional(v.number()),
    bottlePresets: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("hydrationSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    const now = Date.now();

    if (existing) {
      const updates: any = { updatedAt: now };
      if (args.dailyGoalMl !== undefined) updates.dailyGoalMl = args.dailyGoalMl;
      if (args.bottlePresets !== undefined) updates.bottlePresets = args.bottlePresets;
      
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      return await ctx.db.insert("hydrationSettings", {
        userId: identity.subject,
        dailyGoalMl: args.dailyGoalMl ?? 2000,
        bottlePresets: args.bottlePresets ?? [250, 500, 750, 1000],
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Add hydration entry
export const addEntry = mutation({
  args: {
    amountMl: v.number(),
    timestamp: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.insert("hydrationEntries", {
      userId: identity.subject,
      amountMl: args.amountMl,
      timestamp: args.timestamp ?? Date.now(),
      note: args.note,
    });
  },
});

// Remove hydration entry
export const removeEntry = mutation({
  args: { id: v.id("hydrationEntries") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const entry = await ctx.db.get(args.id);
    if (!entry || entry.userId !== identity.subject) {
      throw new Error("Entry not found or unauthorized");
    }

    await ctx.db.delete(args.id);
    return true;
  },
});

// Get entries for a specific date
export const getEntriesForDate = query({
  args: {
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const startOfDay = startOfDayMs(args.date);
    const endOfDay = endOfDayMs(args.date);

    const entries = await ctx.db
      .query("hydrationEntries")
      .withIndex("by_user_date", (q) => q.eq("userId", identity.subject))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), startOfDay),
          q.lte(q.field("timestamp"), endOfDay)
        )
      )
      .collect();

    return entries.sort((a, b) => b.timestamp - a.timestamp);
  },
});

// Get entries for a date range
export const getEntriesForRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const start = Math.min(args.startDate, args.endDate);
    const end = Math.max(args.startDate, args.endDate);

    const entries = await ctx.db
      .query("hydrationEntries")
      .withIndex("by_user_date", (q) => q.eq("userId", identity.subject))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), start),
          q.lte(q.field("timestamp"), end)
        )
      )
      .collect();

    return entries.sort((a, b) => b.timestamp - a.timestamp);
  },
});

// Get daily summary (current progress vs goal)
export const getDailySummary = query({
  args: {
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const date = args.date ?? Date.now();
    const startOfDay = startOfDayMs(date);
    const endOfDay = endOfDayMs(date);

    // Get settings
    const settings = await ctx.db
      .query("hydrationSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    const dailyGoalMl = settings?.dailyGoalMl ?? 2000;

    // Get today's entries
    const entries = await ctx.db
      .query("hydrationEntries")
      .withIndex("by_user_date", (q) => q.eq("userId", identity.subject))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), startOfDay),
          q.lte(q.field("timestamp"), endOfDay)
        )
      )
      .collect();

    const totalMl = entries.reduce((sum, entry) => sum + entry.amountMl, 0);
    const percentage = Math.min(100, (totalMl / dailyGoalMl) * 100);

    return {
      totalMl,
      dailyGoalMl,
      percentage,
      entriesCount: entries.length,
      entries: entries.sort((a, b) => b.timestamp - a.timestamp),
    };
  },
});

// Get streak information
export const getStreak = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get settings for daily goal
    const settings = await ctx.db
      .query("hydrationSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    const dailyGoalMl = settings?.dailyGoalMl ?? 2000;

    // Get all entries
    const allEntries = await ctx.db
      .query("hydrationEntries")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    if (allEntries.length === 0) {
      return { current: 0, longest: 0, totalDays: 0 };
    }

    // Group entries by day and check if goal was met
    const dayTotals = new Map<string, number>();
    
    for (const entry of allEntries) {
      const dayStart = startOfDayMs(entry.timestamp);
      const dayKey = dayStart.toString();
      dayTotals.set(dayKey, (dayTotals.get(dayKey) ?? 0) + entry.amountMl);
    }

    // Get days that met the goal, sorted by date
    const completedDays = Array.from(dayTotals.entries())
      .filter(([, total]) => total >= dailyGoalMl)
      .map(([dayKey]) => Number.parseInt(dayKey))
      .sort((a, b) => a - b);

    if (completedDays.length === 0) {
      return { current: 0, longest: 0, totalDays: 0 };
    }

    // Calculate longest streak
    let longest = 1;
    let run = 1;
    for (let i = 1; i < completedDays.length; i++) {
      const prev = completedDays[i - 1];
      const cur = completedDays[i];
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      if (cur - prev === oneDayMs) {
        run += 1;
        if (run > longest) longest = run;
      } else {
        run = 1;
      }
    }

    // Calculate current streak (must include today or yesterday)
    const today = startOfDayMs(Date.now());
    const yesterday = today - 24 * 60 * 60 * 1000;
    const lastCompletedDay = completedDays[completedDays.length - 1];

    let current = 0;
    if (lastCompletedDay === today || lastCompletedDay === yesterday) {
      current = 1;
      for (let i = completedDays.length - 2; i >= 0; i--) {
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (completedDays[i + 1] - completedDays[i] === oneDayMs) {
          current += 1;
        } else {
          break;
        }
      }
    }

    return {
      current,
      longest: Math.max(longest, current),
      totalDays: completedDays.length,
    };
  },
});

// Get weekly summary (last 7 days)
export const getWeeklySummary = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const settings = await ctx.db
      .query("hydrationSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    const dailyGoalMl = settings?.dailyGoalMl ?? 2000;

    const today = startOfDayMs(Date.now());
    const sevenDaysAgo = today - 6 * 24 * 60 * 60 * 1000;

    const entries = await ctx.db
      .query("hydrationEntries")
      .withIndex("by_user_date", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.gte(q.field("timestamp"), sevenDaysAgo))
      .collect();

    // Group by day
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = today - i * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;
      
      const dayEntries = entries.filter(
        (e) => e.timestamp >= dayStart && e.timestamp <= dayEnd
      );
      
      const totalMl = dayEntries.reduce((sum, e) => sum + e.amountMl, 0);
      
      days.push({
        date: dayStart,
        totalMl,
        goalMet: totalMl >= dailyGoalMl,
        percentage: Math.min(100, (totalMl / dailyGoalMl) * 100),
      });
    }

    return days;
  },
});

