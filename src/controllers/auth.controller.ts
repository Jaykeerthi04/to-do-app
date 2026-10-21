import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";

const registerSchema = z.object({
  name: z.string().trim().max(60).optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a number"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const signToken = (userId: string) =>
  jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] });

const publicUser = (u: { _id: unknown; name?: string | null; email: string }) => ({
  id: String(u._id),
  name: u.name ?? "",
  email: u.email,
});

export async function register(req: Request, res: Response) {
  const { name, email, password } = registerSchema.parse(req.body);

  if (await User.exists({ email })) throw new ApiError(409, "Email already registered");

  const hash = await bcrypt.hash(password, 10); // 10 salt rounds
  const user = await User.create({ name, email, password: hash });

  res.status(201).json({ token: signToken(String(user._id)), user: publicUser(user) });
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  // password has select:false, so ask for it explicitly.
  const user = await User.findOne({ email }).select("+password");
  const ok = user && (await bcrypt.compare(password, user.password));
  // Same message for unknown email and wrong password to avoid leaking which emails exist.
  if (!user || !ok) throw new ApiError(401, "Invalid email or password");

  res.json({ token: signToken(String(user._id)), user: publicUser(user) });
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) throw new ApiError(401, "User no longer exists");
  res.json({ user: publicUser(user) });
}
