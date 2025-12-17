import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import type { Id } from "./_generated/dataModel"

const typeValidator = v.union(
  v.literal("pomodoro"),
  v.literal("countdown"),
  v.literal("stopwatch")
)

const endReasonValidator = v.optional(
  v.union(
    v.literal("completed"),
    v.literal("stopped"),
    v.literal("cancelled"),
    v.literal("navigation"),
    v.literal("tab_closed"),
    v.literal("visibility_hidden")
  )
)

const configValidator = v.optional(
  v.union(
    v.object({
      kind: v.literal("pomodoro"),
      workMs: v.number(),
      breakMs: v.number(),
      cyclesPlanned: v.number(),
    }),
    v.object({
      kind: v.literal("countdown"),
      durationMs: v.number(),
    }),
    v.object({
      kind: v.literal("stopwatch"),
    })
  )
)

const resultValidator = v.optional(
  v.union(
    v.object({
      kind: v.literal("pomodoro"),
      cyclesCompleted: v.number(),
      totalWorkMs: v.number(),
      totalBreakMs: v.number(),
    }),
    v.object({
      kind: v.literal("countdown"),
      completed: v.boolean(),
    }),
    v.object({
      kind: v.literal("stopwatch"),
    })
  )
)

export const getActiveForTab = query({
  args: {
    tabId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const active = await ctx.db
      .query("timerSessions")
      .withIndex("by_user_tab_status", (q) =>
        q.eq("userId", identity.subject).eq("tabId", args.tabId).eq("status", "running")
      )
      .first()

    return active ?? null
  },
})

export const startSession = mutation({
  args: {
    tabId: v.string(),
    type: typeValidator,
    taskId: v.optional(v.id("tasks")),
    tagIds: v.optional(v.array(v.id("tags"))),
    note: v.optional(v.string()),
    config: configValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    // End any existing running session for this tab (defensive, in case the client crashed).
    const existing = await ctx.db
      .query("timerSessions")
      .withIndex("by_user_tab_status", (q) =>
        q.eq("userId", identity.subject).eq("tabId", args.tabId).eq("status", "running")
      )
      .first()

    const now = Date.now()
    if (existing) {
      const durationMs = Math.max(0, now - existing.startedAt)
      await ctx.db.patch(existing._id, {
        status: "cancelled",
        endedAt: now,
        durationMs,
        endReason: "navigation",
      })
    }

    let tagIds: Id<"tags">[] = args.tagIds ?? []
    if (args.taskId && tagIds.length === 0) {
      const task = await ctx.db.get(args.taskId)
      if (!task || task.userId !== identity.subject) {
        throw new Error("Task not found or unauthorized")
      }
      tagIds = task.tags
    }

    const sessionId = await ctx.db.insert("timerSessions", {
      userId: identity.subject,
      tabId: args.tabId,
      type: args.type,
      status: "running",
      startedAt: now,
      endedAt: 0,
      durationMs: 0,
      taskId: args.taskId,
      tagIds,
      note: args.note,
      config: args.config,
    })

    return sessionId
  },
})

export const endSession = mutation({
  args: {
    id: v.id("timerSessions"),
    status: v.union(v.literal("completed"), v.literal("cancelled")),
    durationMs: v.number(),
    endReason: endReasonValidator,
    result: resultValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const session = await ctx.db.get(args.id)
    if (!session || session.userId !== identity.subject) {
      throw new Error("Session not found or unauthorized")
    }

    const now = Date.now()
    await ctx.db.patch(args.id, {
      status: args.status,
      endedAt: session.endedAt && session.endedAt > 0 ? session.endedAt : now,
      durationMs: Math.max(0, args.durationMs),
      endReason: args.endReason ?? (args.status === "completed" ? "completed" : "cancelled"),
      result: args.result,
    })

    return true
  },
})

export const listHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200)
    const sessions = await ctx.db
      .query("timerSessions")
      .withIndex("by_user_endedAt", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.gt(q.field("endedAt"), 0))
      .collect()

    return sessions.sort((a, b) => b.endedAt - a.endedAt).slice(0, limit)
  },
})

export const totals = query({
  args: {
    startAt: v.number(),
    endAt: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const startAt = Math.min(args.startAt, args.endAt)
    const endAt = Math.max(args.startAt, args.endAt)

    const sessions = await ctx.db
      .query("timerSessions")
      .withIndex("by_user_endedAt", (q) => q.eq("userId", identity.subject))
      .filter((q) =>
        q.and(
          q.gt(q.field("endedAt"), 0),
          q.gte(q.field("endedAt"), startAt),
          q.lte(q.field("endedAt"), endAt),
          q.or(q.eq(q.field("status"), "completed"), q.eq(q.field("status"), "cancelled"))
        )
      )
      .collect()

    const byTag = new Map<string, number>()
    const byTask = new Map<string, number>()

    for (const s of sessions) {
      const d = Math.max(0, s.durationMs ?? 0)
      if (s.taskId) byTask.set(s.taskId, (byTask.get(s.taskId) ?? 0) + d)
      for (const tagId of s.tagIds ?? []) {
        byTag.set(tagId, (byTag.get(tagId) ?? 0) + d)
      }
    }

    return {
      startAt,
      endAt,
      totalDurationMs: sessions.reduce((acc, s) => acc + Math.max(0, s.durationMs ?? 0), 0),
      byTag: Array.from(byTag.entries()).map(([tagId, durationMs]) => ({
        tagId: tagId as Id<"tags">,
        durationMs,
      })),
      byTask: Array.from(byTask.entries()).map(([taskId, durationMs]) => ({
        taskId: taskId as Id<"tasks">,
        durationMs,
      })),
    }
  },
})


