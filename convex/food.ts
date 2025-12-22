import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

const mealTypeValidator = v.union(
  v.literal("breakfast"),
  v.literal("lunch"),
  v.literal("dinner"),
  v.literal("snack")
);

export const getSettings = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const settings = await ctx.db
      .query("foodSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (!settings) {
      return {
        userId: identity.subject,
        dailyGoalCalories: 2000,
        dailyGoalProtein: 150,
        dailyGoalCarbs: 250,
        dailyGoalFat: 65,
        dailyGoalFiber: 25,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    return settings;
  },
});

export const updateSettings = mutation({
  args: {
    dailyGoalCalories: v.optional(v.number()),
    dailyGoalProtein: v.optional(v.number()),
    dailyGoalCarbs: v.optional(v.number()),
    dailyGoalFat: v.optional(v.number()),
    dailyGoalFiber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("foodSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    const now = Date.now();

    if (existing) {
      const updates: any = { updatedAt: now };
      if (args.dailyGoalCalories !== undefined)
        updates.dailyGoalCalories = args.dailyGoalCalories;
      if (args.dailyGoalProtein !== undefined)
        updates.dailyGoalProtein = args.dailyGoalProtein;
      if (args.dailyGoalCarbs !== undefined)
        updates.dailyGoalCarbs = args.dailyGoalCarbs;
      if (args.dailyGoalFat !== undefined)
        updates.dailyGoalFat = args.dailyGoalFat;
      if (args.dailyGoalFiber !== undefined)
        updates.dailyGoalFiber = args.dailyGoalFiber;

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      return await ctx.db.insert("foodSettings", {
        userId: identity.subject,
        dailyGoalCalories: args.dailyGoalCalories ?? 2000,
        dailyGoalProtein: args.dailyGoalProtein ?? 150,
        dailyGoalCarbs: args.dailyGoalCarbs ?? 250,
        dailyGoalFat: args.dailyGoalFat ?? 65,
        dailyGoalFiber: args.dailyGoalFiber ?? 25,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const addEntry = mutation({
  args: {
    name: v.string(),
    mealType: mealTypeValidator,
    notes: v.optional(v.string()),
    calories: v.optional(v.number()),
    protein: v.optional(v.number()),
    carbs: v.optional(v.number()),
    fat: v.optional(v.number()),
    fiber: v.optional(v.number()),
    timestamp: v.optional(v.number()),
    isFavorite: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.insert("foodEntries", {
      userId: identity.subject,
      name: args.name,
      mealType: args.mealType,
      notes: args.notes,
      calories: args.calories,
      protein: args.protein,
      carbs: args.carbs,
      fat: args.fat,
      fiber: args.fiber,
      timestamp: args.timestamp ?? Date.now(),
      isFavorite: args.isFavorite ?? false,
    });
  },
});

export const updateEntry = mutation({
  args: {
    id: v.id("foodEntries"),
    name: v.optional(v.string()),
    mealType: v.optional(mealTypeValidator),
    notes: v.optional(v.string()),
    calories: v.optional(v.number()),
    protein: v.optional(v.number()),
    carbs: v.optional(v.number()),
    fat: v.optional(v.number()),
    fiber: v.optional(v.number()),
    isFavorite: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const entry = await ctx.db.get(args.id);
    if (!entry || entry.userId !== identity.subject) {
      throw new Error("Entry not found or unauthorized");
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.mealType !== undefined) updates.mealType = args.mealType;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.calories !== undefined) updates.calories = args.calories;
    if (args.protein !== undefined) updates.protein = args.protein;
    if (args.carbs !== undefined) updates.carbs = args.carbs;
    if (args.fat !== undefined) updates.fat = args.fat;
    if (args.fiber !== undefined) updates.fiber = args.fiber;
    if (args.isFavorite !== undefined) updates.isFavorite = args.isFavorite;

    await ctx.db.patch(args.id, updates);
    return true;
  },
});

export const removeEntry = mutation({
  args: { id: v.id("foodEntries") },
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

export const toggleFavorite = mutation({
  args: { id: v.id("foodEntries") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const entry = await ctx.db.get(args.id);
    if (!entry || entry.userId !== identity.subject) {
      throw new Error("Entry not found or unauthorized");
    }

    await ctx.db.patch(args.id, { isFavorite: !entry.isFavorite });
    return !entry.isFavorite;
  },
});

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
      .query("foodEntries")
      .withIndex("by_user_date", (q) => q.eq("userId", identity.subject))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), startOfDay),
          q.lte(q.field("timestamp"), endOfDay)
        )
      )
      .collect();

    return entries.sort((a, b) => a.timestamp - b.timestamp);
  },
});

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
      .query("foodEntries")
      .withIndex("by_user_date", (q) => q.eq("userId", identity.subject))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), start),
          q.lte(q.field("timestamp"), end)
        )
      )
      .collect();

    return entries.sort((a, b) => a.timestamp - b.timestamp);
  },
});

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

    const settings = await ctx.db
      .query("foodSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    const dailyGoalCalories = settings?.dailyGoalCalories ?? 2000;
    const dailyGoalProtein = settings?.dailyGoalProtein ?? 150;
    const dailyGoalCarbs = settings?.dailyGoalCarbs ?? 250;
    const dailyGoalFat = settings?.dailyGoalFat ?? 65;
    const dailyGoalFiber = settings?.dailyGoalFiber ?? 25;

    const entries = await ctx.db
      .query("foodEntries")
      .withIndex("by_user_date", (q) => q.eq("userId", identity.subject))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), startOfDay),
          q.lte(q.field("timestamp"), endOfDay)
        )
      )
      .collect();

    // Calculate totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    const byMealType = {
      breakfast: [] as typeof entries,
      lunch: [] as typeof entries,
      dinner: [] as typeof entries,
      snack: [] as typeof entries,
    };

    for (const entry of entries) {
      if (entry.calories) totalCalories += entry.calories;
      if (entry.protein) totalProtein += entry.protein;
      if (entry.carbs) totalCarbs += entry.carbs;
      if (entry.fat) totalFat += entry.fat;
      if (entry.fiber) totalFiber += entry.fiber;

      byMealType[entry.mealType].push(entry);
    }

    const caloriesPercentage = Math.min(
      100,
      (totalCalories / dailyGoalCalories) * 100
    );
    const proteinPercentage = Math.min(
      100,
      (totalProtein / dailyGoalProtein) * 100
    );
    const carbsPercentage = Math.min(100, (totalCarbs / dailyGoalCarbs) * 100);
    const fatPercentage = Math.min(100, (totalFat / dailyGoalFat) * 100);
    const fiberPercentage = Math.min(100, (totalFiber / dailyGoalFiber) * 100);

    return {
      entries: entries.sort((a, b) => a.timestamp - b.timestamp),
      byMealType,
      totals: {
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
        fiber: totalFiber,
      },
      goals: {
        calories: dailyGoalCalories,
        protein: dailyGoalProtein,
        carbs: dailyGoalCarbs,
        fat: dailyGoalFat,
        fiber: dailyGoalFiber,
      },
      percentages: {
        calories: caloriesPercentage,
        protein: proteinPercentage,
        carbs: carbsPercentage,
        fat: fatPercentage,
        fiber: fiberPercentage,
      },
      entriesCount: entries.length,
    };
  },
});

export const getWeeklySummary = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const today = startOfDayMs(Date.now());
    const sevenDaysAgo = today - 6 * 24 * 60 * 60 * 1000;

    const entries = await ctx.db
      .query("foodEntries")
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

      let calories = 0;
      let protein = 0;
      let carbs = 0;
      let fat = 0;

      for (const entry of dayEntries) {
        if (entry.calories) calories += entry.calories;
        if (entry.protein) protein += entry.protein;
        if (entry.carbs) carbs += entry.carbs;
        if (entry.fat) fat += entry.fat;
      }

      days.push({
        date: dayStart,
        entries: dayEntries.length,
        calories,
        protein,
        carbs,
        fat,
      });
    }

    return days;
  },
});

export const getFavorites = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const favorites = await ctx.db
      .query("foodEntries")
      .withIndex("by_user_favorites", (q) =>
        q.eq("userId", identity.subject).eq("isFavorite", true)
      )
      .collect();

    const uniqueFavorites = new Map<string, (typeof favorites)[0]>();

    for (const fav of favorites) {
      const existing = uniqueFavorites.get(fav.name.toLowerCase());
      if (!existing || fav.timestamp > existing.timestamp) {
        uniqueFavorites.set(fav.name.toLowerCase(), fav);
      }
    }

    return Array.from(uniqueFavorites.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  },
});

export const addFromFavorite = mutation({
  args: {
    favoriteId: v.id("foodEntries"),
    mealType: v.optional(mealTypeValidator),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const favorite = await ctx.db.get(args.favoriteId);
    if (!favorite || favorite.userId !== identity.subject) {
      throw new Error("Favorite not found or unauthorized");
    }

    return await ctx.db.insert("foodEntries", {
      userId: identity.subject,
      name: favorite.name,
      mealType: args.mealType ?? favorite.mealType,
      notes: favorite.notes,
      calories: favorite.calories,
      protein: favorite.protein,
      carbs: favorite.carbs,
      fat: favorite.fat,
      fiber: favorite.fiber,
      timestamp: args.timestamp ?? Date.now(),
      isFavorite: false,
    });
  },
});
