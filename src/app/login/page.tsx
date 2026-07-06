"use client";

import { useActionState } from "react";
import Link from "next/link";
import { authenticate } from "./actions";
import { labelClass, inputClass, primaryButtonClass } from "@/components/form-styles";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(authenticate, undefined);

  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-semibold">Se connecter</h1>

      <form action={formAction} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className={`${primaryButtonClass} w-full disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {pending ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-500">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="text-indigo-500 hover:underline">
          Créer un compte
        </Link>
      </p>
    </main>
  );
}
