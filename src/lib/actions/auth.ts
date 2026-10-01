"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signIn, signOut } from "@/auth";
import { FormState, LoginFormSchema, SignupFormSchema } from "@/lib/definitions";

// Only allow same-site relative redirects after login (no open redirect).
function safeCallback(value: FormDataEntryValue | null) {
  const url = typeof value === "string" ? value : "";
  return url.startsWith("/") && !url.startsWith("//") ? url : "/";
}

export async function signup(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = SignupFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
    columns: { id: true },
  });
  if (existing) {
    return { message: "An account with that email already exists." };
  }

  // Public signup always creates a customer. Seller access comes from an
  // approved store application; admins are only created by the seed script.
  await db.insert(users).values({
    name,
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 10),
  });

  try {
    await signIn("credentials", { email: normalizedEmail, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Account created, but sign-in failed. Please log in." };
    }
    throw error;
  }

  redirect(safeCallback(formData.get("callbackUrl")));
}

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Invalid email or password." };
    }
    throw error;
  }

  redirect(safeCallback(formData.get("callbackUrl")));
}

export async function logout() {
  await signOut({ redirect: false });
  redirect("/");
}
