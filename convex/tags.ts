import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    return await ctx.db
      .query("tags")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    color: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    return await ctx.db.insert("tags", {
      name: args.name,
      color: args.color,
      emoji: args.emoji,
      userId: identity.subject,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("tags"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const tag = await ctx.db.get(args.id)
    if (!tag || tag.userId !== identity.subject) {
      throw new Error("Tag not found or unauthorized")
    }

    const { id, ...updates } = args
    return await ctx.db.patch(id, updates)
  },
})

export const remove = mutation({
  args: {
    id: v.id("tags"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const tag = await ctx.db.get(args.id)
    if (!tag || tag.userId !== identity.subject) {
      throw new Error("Tag not found or unauthorized")
    }

    return await ctx.db.delete(args.id)
  },
})

