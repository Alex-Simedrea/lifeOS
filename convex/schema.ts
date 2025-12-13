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
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["userId", "status"])
    .index("by_due_date", ["userId", "dueAt"]),
})

