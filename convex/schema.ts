import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  tags: defineTable({
    name: v.string(),
    color: v.string(),
    emoji: v.string(),
    userId: v.string(),
  }).index("by_user", ["userId"]),

  tasks: defineTable({
    title: v.string(),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    dueAt: v.optional(v.number()),
    startAt: v.optional(v.number()),
    duration: v.optional(v.number()),
    recurrence: v.optional(
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
    ),
    tags: v.array(v.id("tags")),
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          text: v.string(),
          completed: v.boolean(),
        })
      )
    ),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["userId", "status"])
    .index("by_due_date", ["userId", "dueAt"]),

  events: defineTable({
    title: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    color: v.union(
      v.literal("blue"),
      v.literal("green"),
      v.literal("red"),
      v.literal("yellow"),
      v.literal("purple"),
      v.literal("orange"),
      v.literal("gray")
    ),
    recurrence: v.optional(
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
    ),
    tags: v.array(v.id("tags")),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_start_date", ["userId", "startDate"])
    .index("by_date_range", ["userId", "startDate", "endDate"]),

  timerSessions: defineTable({
    userId: v.string(),
    tabId: v.string(),
    type: v.union(
      v.literal("pomodoro"),
      v.literal("countdown"),
      v.literal("stopwatch")
    ),
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    startedAt: v.number(),
    // For active sessions, endedAt is 0.
    endedAt: v.number(),
    // For active sessions, durationMs is 0.
    durationMs: v.number(),
    taskId: v.optional(v.id("tasks")),
    tagIds: v.array(v.id("tags")),
    note: v.optional(v.string()),
    endReason: v.optional(
      v.union(
        v.literal("completed"),
        v.literal("stopped"),
        v.literal("cancelled"),
        v.literal("navigation"),
        v.literal("tab_closed"),
        v.literal("visibility_hidden")
      )
    ),
    config: v.optional(
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
    ),
    result: v.optional(
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
    ),
  })
    .index("by_user", ["userId"])
    .index("by_user_endedAt", ["userId", "endedAt"])
    .index("by_user_tab_status", ["userId", "tabId", "status"]),
})

