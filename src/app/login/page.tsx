"use client";

import { useActionState } from "react";
import Link from "next/link";
import { authenticate } from "./actions";
import { labelClass, inputClass, primaryButtonClass } from "@/components/form-styles";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(authenticate, undefined);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <div className="card p-8 shadow-sm">
        <h1 className="font-display text-2xl font-semibold">Se connecter</h1>
        <p className="mt-1 text-sm text-muted">
          Reprends la main sur tes campagnes.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
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
            {pending ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Créer un compte
        </Link>
      </p>
    </main>
  );
}
