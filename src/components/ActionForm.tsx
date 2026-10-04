"use client";

import { createContext, startTransition, useActionState, useContext } from "react";
import type { FormState } from "@/lib/form";

type Action = (state: FormState, form: FormData) => Promise<FormState>;

const PendingContext = createContext(false);

/**
 * A form bound to a server action. Submissions are dispatched manually so React does not
 * reset the fields afterwards: users keep their input when validation fails.
 */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(e.currentTarget, submitter);
    startTransition(() => formAction(data));
  }

  return (
    <form action={formAction} onSubmit={onSubmit} className={className}>
      {state?.errors?.length ? (
        <ul role="alert" className="mb-4 space-y-1 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
      {state?.message && !pending ? (
        <p role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {state.message}
        </p>
      ) : null}
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
    </form>
  );
}

export function SubmitButton({ children, className = "btn" }: { children: React.ReactNode; className?: string }) {
  const pending = useContext(PendingContext);
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? "…" : children}
    </button>
  );
}
