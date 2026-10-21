import { Request, Response } from "express";
import { z } from "zod";
import { Task } from "../models/Task";
import { ApiError } from "../utils/ApiError";
import { PRIORITY_WEIGHT, smartScore } from "../utils/smartScore";

const priorityEnum = z.enum(["low", "medium", "high"]);
const tagsSchema = z
  .array(z.string().trim().min(1).max(24))
  .max(10)
  .transform((t) => [...new Set(t.map((x) => x.toLowerCase()))]);

const baseTask = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(1000).optional(),
  dueAt: z.coerce.date({ invalid_type_error: "dueAt must be a valid date-time" }),
  deadline: z.coerce.date({ invalid_type_error: "deadline must be a valid date-time" }),
  priority: priorityEnum.optional(),
  category: z.string().trim().min(1).max(40).optional(),
  tags: tagsSchema.optional(),
});

const deadlineAfterDue = (d: { dueAt?: Date; deadline?: Date }) =>
  !d.dueAt || !d.deadline || d.deadline >= d.dueAt;
const deadlineMsg = { message: "Deadline must be on or after the due date-time", path: ["deadline"] };

const createSchema = baseTask.refine(deadlineAfterDue, deadlineMsg);
const updateSchema = baseTask
  .partial()
  .extend({ completed: z.boolean().optional() })
  .refine(deadlineAfterDue, deadlineMsg);

const listSchema = z.object({
  status: z.enum(["all", "active", "completed", "overdue"]).default("all"),
  priority: priorityEnum.optional(),
  category: z.string().trim().optional(),
  tag: z.string().trim().toLowerCase().optional(),
  search: z.string().trim().optional(),
  sort: z.enum(["smart", "deadline", "due", "priority", "newest"]).default("smart"),
});

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Every query is scoped by user, so one user can never read or modify another's tasks.
const ownedBy = (req: Request, id?: string): Record<string, any> =>
  id ? { _id: id, user: req.userId } : { user: req.userId };

export async function createTask(req: Request, res: Response) {
  const data = createSchema.parse(req.body);
  const task = await Task.create({ ...data, user: req.userId });
  res.status(201).json({ task });
}

export async function listTasks(req: Request, res: Response) {
  const q = listSchema.parse(req.query);
  const now = new Date();

  // ---- Filtering (done in Mongo) ----
  const filter: Record<string, any> = ownedBy(req);
  if (q.status === "active") filter.completed = false;
  if (q.status === "completed") filter.completed = true;
  if (q.status === "overdue") Object.assign(filter, { completed: false, deadline: { $lt: now } });
  if (q.priority) filter.priority = q.priority;
  if (q.category) filter.category = new RegExp(`^${escapeRegex(q.category)}$`, "i");
  if (q.tag) filter.tags = q.tag;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), "i");
    filter.$or = [{ title: rx }, { description: rx }];
  }

  const tasks: any[] = await Task.find(filter).lean();

  // ---- Sorting (done in JS because "smart" is a computed score) ----
  const byDue = (a: any, b: any) => a.dueAt.getTime() - b.dueAt.getTime();
  const withScore = tasks.map((t) => ({ ...t, smartScore: Number(smartScore(t, now).toFixed(2)) }));

  withScore.sort((a, b) => {
    switch (q.sort) {
      case "smart":
        return b.smartScore - a.smartScore || byDue(a, b);
      case "deadline":
        // completed tasks last, then soonest deadline
        return Number(a.completed) - Number(b.completed) || a.deadline.getTime() - b.deadline.getTime();
      case "due":
        return Number(a.completed) - Number(b.completed) || byDue(a, b);
      case "priority":
        return (
          Number(a.completed) - Number(b.completed) ||
          PRIORITY_WEIGHT[b.priority as "low"] - PRIORITY_WEIGHT[a.priority as "low"] ||
          a.deadline.getTime() - b.deadline.getTime()
        );
      case "newest":
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  res.json({ count: withScore.length, tasks: withScore });
}

export async function getTask(req: Request, res: Response) {
  const task = await Task.findOne(ownedBy(req, req.params.id));
  if (!task) throw new ApiError(404, "Task not found");
  res.json({ task });
}

export async function updateTask(req: Request, res: Response) {
  const data = updateSchema.parse(req.body);
  const task = await Task.findOne(ownedBy(req, req.params.id));
  if (!task) throw new ApiError(404, "Task not found");

  // Re-check the dueAt/deadline relationship against the merged result.
  const dueAt = data.dueAt ?? task.dueAt;
  const deadline = data.deadline ?? task.deadline;
  if (deadline < dueAt) throw new ApiError(400, deadlineMsg.message);

  task.set(data);
  if (data.completed !== undefined) task.completedAt = data.completed ? new Date() : null;
  await task.save();
  res.json({ task });
}

/** Flip completed <-> not completed in one call (used by the checkbox in the app). */
export async function toggleTask(req: Request, res: Response) {
  const task = await Task.findOne(ownedBy(req, req.params.id));
  if (!task) throw new ApiError(404, "Task not found");
  task.completed = !task.completed;
  task.completedAt = task.completed ? new Date() : null;
  await task.save();
  res.json({ task });
}

export async function deleteTask(req: Request, res: Response) {
  const result = await Task.deleteOne(ownedBy(req, req.params.id));
  if (result.deletedCount === 0) throw new ApiError(404, "Task not found");
  res.status(204).send();
}

/** Distinct categories and tags for the user: powers the filter chips in the app. */
export async function taskMeta(req: Request, res: Response) {
  const [categories, tags] = await Promise.all([
    Task.distinct("category", ownedBy(req)),
    Task.distinct("tags", ownedBy(req)),
  ]);
  res.json({ categories: categories.sort(), tags: tags.sort() });
}
