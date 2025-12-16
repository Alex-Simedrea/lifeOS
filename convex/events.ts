import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

const recurrenceValidator = v.optional(
  v.object({
    type: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    ),
    interval: v.number(),
    endDate: v.optional(v.number()),
    daysOfWeek: v.optional(v.array(v.number())),
    dayOfMonth: v.optional(v.number()),
  })
)

export const list = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    let eventsQuery = ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))

    const events = await eventsQuery.collect()
    
    // Filter by date range if provided
    if (args.startDate && args.endDate) {
      return events.filter(
        (event) =>
          (event.startDate >= args.startDate! && event.startDate <= args.endDate!) ||
          (event.endDate >= args.startDate! && event.endDate <= args.endDate!) ||
          (event.startDate <= args.startDate! && event.endDate >= args.endDate!)
      )
    }

    return events.sort((a, b) => a.startDate - b.startDate)
  },
})

export const get = query({
  args: {
    id: v.id("events"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const event = await ctx.db.get(args.id)
    if (!event || event.userId !== identity.subject) {
      throw new Error("Event not found or unauthorized")
    }

    return event
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    color: v.optional(
      v.union(
        v.literal("blue"),
        v.literal("green"),
        v.literal("red"),
        v.literal("yellow"),
        v.literal("purple"),
        v.literal("orange"),
        v.literal("gray")
      )
    ),
    recurrence: recurrenceValidator,
    tags: v.optional(v.array(v.id("tags"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const now = Date.now()
    return await ctx.db.insert("events", {
      title: args.title,
      startDate: args.startDate,
      endDate: args.endDate,
      location: args.location,
      notes: args.notes,
      color: args.color ?? "blue",
      recurrence: args.recurrence,
      tags: args.tags ?? [],
      userId: identity.subject,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("events"),
    title: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    color: v.optional(
      v.union(
        v.literal("blue"),
        v.literal("green"),
        v.literal("red"),
        v.literal("yellow"),
        v.literal("purple"),
        v.literal("orange"),
        v.literal("gray")
      )
    ),
    recurrence: recurrenceValidator,
    tags: v.optional(v.array(v.id("tags"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const event = await ctx.db.get(args.id)
    if (!event || event.userId !== identity.subject) {
      throw new Error("Event not found or unauthorized")
    }

    const { id, ...updates } = args
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

export const remove = mutation({
  args: {
    id: v.id("events"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const event = await ctx.db.get(args.id)
    if (!event || event.userId !== identity.subject) {
      throw new Error("Event not found or unauthorized")
    }

    return await ctx.db.delete(args.id)
  },
})
