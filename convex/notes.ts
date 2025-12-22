import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()

    return notes.sort((a, b) => b.updatedAt - a.updatedAt)
  },
})

export const get = query({
  args: {
    id: v.id("notes"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const note = await ctx.db.get(args.id)
    if (!note || note.userId !== identity.subject) {
      throw new Error("Note not found or unauthorized")
    }

    return note
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    tags: v.optional(v.array(v.id("tags"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const now = Date.now()
    return await ctx.db.insert("notes", {
      title: args.title,
      content: args.content,
      tags: args.tags ?? [],
      userId: identity.subject,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("notes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.id("tags"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const note = await ctx.db.get(args.id)
    if (!note || note.userId !== identity.subject) {
      throw new Error("Note not found or unauthorized")
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
    id: v.id("notes"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const note = await ctx.db.get(args.id)
    if (!note || note.userId !== identity.subject) {
      throw new Error("Note not found or unauthorized")
    }

    return await ctx.db.delete(args.id)
  },
})

