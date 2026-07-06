"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "./actions";
import { labelClass, inputClass, primaryButtonClass } from "@/components/form-styles";

export default function SignUpPage() {
  const [error, formAction, pending] = useActionState(signUp, undefined);

  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-semibold">Créer un compte</h1>

      <form action={formAction} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className={labelClass}>
            Nom (optionnel)
          </label>
          <input id="name" name="name" className={inputClass} />
        </div>

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
            minLength={8}
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className={`${primaryButtonClass} w-full disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {pending ? "Création…" : "Créer le compte"}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-500">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-indigo-500 hover:underline">
          Se connecter
        </Link>
      </p>
    </main>
  );
}
