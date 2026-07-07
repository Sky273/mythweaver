"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "./actions";
import { labelClass, inputClass, primaryButtonClass } from "@/components/form-styles";

export default function SignUpPage() {
  const [error, formAction, pending] = useActionState(signUp, undefined);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <div className="card p-8 shadow-sm">
        <h1 className="font-display text-2xl font-semibold">Créer un compte</h1>
        <p className="mt-1 text-sm text-muted">
          Quelques secondes, et tu peux générer ta première campagne.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
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
            <p className="mt-1 text-xs text-muted">Au moins 8 caractères.</p>
          </div>

          {error && (
            <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className={`${primaryButtonClass} w-full`}
          >
            {pending ? "Création…" : "Créer le compte"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </main>
  );
}
