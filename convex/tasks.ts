import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import type { Id } from "./_generated/dataModel"

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
    status: v.optional(
      v.union(
        v.literal("todo"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    let tasksQuery = ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))

    if (args.status) {
      tasksQuery = ctx.db
        .query("tasks")
        .withIndex("by_status", (q) => 
          q.eq("userId", identity.subject).eq("status", args.status ?? "todo")
        )
    }

    const tasks = await tasksQuery.collect()
    
    return tasks.sort((a, b) => {
      if (a.dueAt && b.dueAt) return a.dueAt - b.dueAt
      if (a.dueAt) return -1
      if (b.dueAt) return 1
      return b.createdAt - a.createdAt
    })
  },
})

export const get = query({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const task = await ctx.db.get(args.id)
    if (!task || task.userId !== identity.subject) {
      throw new Error("Task not found or unauthorized")
    }

    return task
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    notes: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("todo"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled")
      )
    ),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("urgent")
      )
    ),
    dueAt: v.optional(v.number()),
    startAt: v.optional(v.number()),
    duration: v.optional(v.number()),
    recurrence: recurrenceValidator,
    tags: v.optional(v.array(v.id("tags"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const now = Date.now()
    return await ctx.db.insert("tasks", {
      title: args.title,
      notes: args.notes,
      status: args.status ?? "todo",
      priority: args.priority ?? "medium",
      dueAt: args.dueAt,
      startAt: args.startAt,
      duration: args.duration,
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
    id: v.id("tasks"),
    title: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("todo"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled")
      )
    ),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("urgent")
      )
    ),
    dueAt: v.optional(v.number()),
    startAt: v.optional(v.number()),
    duration: v.optional(v.number()),
    recurrence: recurrenceValidator,
    tags: v.optional(v.array(v.id("tags"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const task = await ctx.db.get(args.id)
    if (!task || task.userId !== identity.subject) {
      throw new Error("Task not found or unauthorized")
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
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const task = await ctx.db.get(args.id)
    if (!task || task.userId !== identity.subject) {
      throw new Error("Task not found or unauthorized")
    }

    return await ctx.db.delete(args.id)
  },
})

export const toggleStatus = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const task = await ctx.db.get(args.id)
    if (!task || task.userId !== identity.subject) {
      throw new Error("Task not found or unauthorized")
    }

    const newStatus = task.status === "completed" ? "todo" : "completed"
    return await ctx.db.patch(args.id, {
      status: newStatus,
      updatedAt: Date.now(),
    })
  },
})

