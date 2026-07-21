"use client";

import { useActionState } from "react";
import { loginWithPassword, type LoginState } from "@/app/actions";

const initialState: LoginState = null;

export function PasswordGateForm() {
  const [state, formAction, pending] = useActionState(
    loginWithPassword,
    initialState,
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm text-text-secondary">
        <span className="sr-only">סיסמה</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          placeholder="סיסמה"
          className="w-full rounded-[16px] border border-black/8 bg-card px-4 py-3 text-base text-text-primary outline-none placeholder:text-text-secondary focus:border-green/50 focus:ring-2 focus:ring-green/20"
        />
      </label>

      {state?.error ? (
        <p className="text-sm text-coral" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-[16px] bg-green px-4 py-3 text-base font-semibold text-white transition enabled:hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "בודק…" : "כניסה"}
      </button>
    </form>
  );
}
