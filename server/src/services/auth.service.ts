import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
};
export type UserRepository = {
  findByEmail(email: string): Promise<AuthUser | null>;
  create(data: Omit<AuthUser, "id">): Promise<AuthUser>;
};
const emailSchema = z.string().trim().toLowerCase().email().max(254);
const registrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter at least two characters for your name.")
    .max(100),
  email: emailSchema,
  password: z
    .string()
    .min(8, "Use a password with at least 8 characters.")
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "Password must be at most 72 UTF-8 bytes.",
    ),
});
const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1)
    .refine((value) => Buffer.byteLength(value, "utf8") <= 72),
});
const publicUser = (user: AuthUser) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

export function createAuthHandlers(
  users: UserRepository,
  getSecret: () => string | undefined,
) {
  return {
    register: async (req: Request, res: Response) => {
      const parsed = registrationSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({
            message:
              parsed.error.issues[0]?.message || "Check your account details.",
          });
      const { name, email, password } = parsed.data;
      try {
        if (await users.findByEmail(email))
          return res
            .status(409)
            .json({
              message:
                "An account with this email already exists. Please sign in.",
            });
        const user = await users.create({
          name,
          email,
          password: await bcrypt.hash(password, 10),
          role: "member",
        });
        return res
          .status(201)
          .json({
            message: "Account created successfully. Please sign in.",
            user: publicUser(user),
          });
      } catch (error) {
        // The unique constraint handles two requests racing to register the same email.
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2002"
        )
          return res
            .status(409)
            .json({
              message:
                "An account with this email already exists. Please sign in.",
            });
        return res
          .status(500)
          .json({
            message: "Could not create your account. Please try again.",
          });
      }
    },
    login: async (req: Request, res: Response) => {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Enter a valid email address and password." });
      try {
        const user = await users.findByEmail(parsed.data.email);
        if (
          !user ||
          !(await bcrypt.compare(parsed.data.password, user.password))
        )
          return res
            .status(401)
            .json({ message: "Invalid email or password." });
        const secret = getSecret();
        if (!secret)
          return res
            .status(503)
            .json({
              message:
                "Sign-in is temporarily unavailable. Please try again later.",
            });
        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          secret,
          { expiresIn: "1d" },
        );
        return res
          .status(200)
          .json({ message: "Login successful", token, user: publicUser(user) });
      } catch {
        return res
          .status(500)
          .json({ message: "Could not sign in. Please try again." });
      }
    },
  };
}
