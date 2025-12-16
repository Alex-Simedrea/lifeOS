import { z } from "zod";

export const eventSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    location: z.string().optional(),
    notes: z.string().optional(),
    date: z.date({ error: "Date is required" }),
    time: z.object(
      { hour: z.number(), minute: z.number() },
      { error: "Time is required" }
    ),
    durationMinutes: z.coerce.number().int().min(1, "Duration is required"),
    color: z
      .enum(["blue", "green", "red", "yellow", "purple", "orange", "gray"])
      .default("blue"),
    tags: z.array(z.string()).default([]),
    recurrence: z
      .object({
        type: z.enum(["daily", "weekly", "monthly", "yearly"]),
        interval: z.coerce.number().int().min(1).default(1),
        endDate: z.date().optional(),
        daysOfWeek: z.array(z.coerce.number().int().min(0).max(6)).optional(),
        dayOfMonth: z.coerce.number().int().min(1).max(31).optional(),
      })
      .optional(),
  })
  .refine((data) => data.durationMinutes > 0, {
    message: "Duration is required",
    path: ["durationMinutes"],
  });

export type TEventFormData = z.infer<typeof eventSchema>;
