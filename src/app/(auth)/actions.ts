"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession, destroySession, safeNext } from "@/lib/auth";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form";

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  const errors: string[] = [];
  if (!name) errors.push("Name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Enter a valid email.");
  if (password.length < 8) errors.push("Password must be at least 8 characters.");
  if (errors.length) return { errors };

  if (await db.user.findUnique({ where: { email } })) return { errors: ["An account with this email already exists."] };

  const user = await db.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 10) } });
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { errors: ["Wrong email or password."] };
  }
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
