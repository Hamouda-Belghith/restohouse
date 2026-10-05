"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef } from "react";
import type { FormState } from "@/lib/form";

type Action = (state: FormState, form: FormData) => Promise<FormState>;

const PendingContext = createContext(false);
/** Field errors of the latest submission; a new object per submission so fields can reset their state. */
const FieldErrorsContext = createContext<Record<string, string> | undefined>(undefined);

export const useFieldErrors = () => useContext(FieldErrorsContext);

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
  const formRef = useRef<HTMLFormElement>(null);
  const fieldErrorCount = Object.keys(state?.fieldErrors ?? {}).length;

  // Problems are often far from the clicked button: bring the first one into view.
  useEffect(() => {
    const form = formRef.current;
    if (!form || (!state?.errors?.length && !state?.fieldErrors)) return;
    const target = form.querySelector<HTMLElement>('[aria-invalid="true"]') ?? form.querySelector<HTMLElement>('[role="alert"]');
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (target?.matches("input, textarea, select")) target.focus({ preventScroll: true });
  }, [state]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(e.currentTarget, submitter);
    startTransition(() => formAction(data));
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} className={className}>
      {state?.errors?.length || fieldErrorCount ? (
        <ul role="alert" className="mb-4 space-y-1 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {fieldErrorCount ? (
            <li>
              {fieldErrorCount === 1 ? "1 field needs" : `${fieldErrorCount} fields need`} your attention: see the
              fields highlighted in red.
            </li>
          ) : null}
          {state?.errors?.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
      {state?.message && !pending ? (
        <p role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {state.message}
        </p>
      ) : null}
      <FieldErrorsContext.Provider value={state?.fieldErrors}>
        <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
      </FieldErrorsContext.Provider>
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
