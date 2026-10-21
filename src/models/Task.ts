import { Schema, model } from "mongoose";

const taskSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, default: "", maxlength: 1000 },
    dueAt: { type: Date, required: true }, // when the user plans to do it (date-time)
    deadline: { type: Date, required: true }, // hard deadline
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    category: { type: String, trim: true, default: "General", maxlength: 40 },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Common query: a user's tasks filtered by status.
taskSchema.index({ user: 1, completed: 1, deadline: 1 });

export const Task = model("Task", taskSchema);
