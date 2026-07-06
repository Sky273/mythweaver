"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";

export async function signUp(_prevState: string | undefined, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return "Email et mot de passe requis.";
  if (password.length < 8) {
    return "Le mot de passe doit faire au moins 8 caractères.";
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return "Un compte existe déjà avec cet email.";

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, name: name || null, passwordHash },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Compte créé, mais la connexion automatique a échoué — essaie de te connecter.";
    }
    throw error;
  }
}
