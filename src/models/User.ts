import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Stored as a bcrypt hash; never returned from queries unless explicitly selected.
    password: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

export const User = model("User", userSchema);
