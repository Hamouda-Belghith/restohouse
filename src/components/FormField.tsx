"use client";

import { useEffect, useState } from "react";
import { useFieldErrors } from "./ActionForm";

/**
 * The error for `name` from the latest submission of the enclosing ActionForm.
 * It disappears as soon as the user edits the field, and comes back on the next failed submit.
 */
function useFieldError(name: string) {
  const errors = useFieldErrors();
  const [edited, setEdited] = useState(false);
  useEffect(() => setEdited(false), [errors]);
  return { error: edited ? undefined : errors?.[name], onEdit: () => setEdited(true) };
}

function RequiredMark() {
  return (
    <span className="text-red-600" aria-hidden="true">
      {" "}*
    </span>
  );
}

function ErrorText({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={id} className="mt-1 text-xs text-red-700">
      {error}
    </p>
  ) : null;
}

const invalidInput = "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/20";

type FieldProps = { label: string; name: string; required?: boolean; multiline?: boolean } & Omit<
  React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "required"
>;

/**
 * Labelled input that turns red when the server reports an error for it. `required` only adds the
 * asterisk and aria-required: validation happens server-side so "Save draft" keeps working with gaps.
 */
export function Field({ label, name, required, multiline, defaultValue, ...rest }: FieldProps) {
  const { error, onEdit } = useFieldError(name);
  const props = {
    ...rest,
    id: name,
    name,
    defaultValue: defaultValue ?? "",
    className: `input ${error ? invalidInput : ""}`,
    "aria-required": required || undefined,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${name}-error` : undefined,
    onInput: onEdit,
  };
  return (
    <div>
      <label className={`label ${error ? "text-red-700" : ""}`} htmlFor={name}>
        {label}
        {required && <RequiredMark />}
      </label>
      {multiline ? <textarea {...props} /> : <input {...props} />}
      <ErrorText id={`${name}-error`} error={error} />
    </div>
  );
}

export function CheckField({
  name,
  required,
  defaultChecked,
  children,
}: {
  name: string;
  required?: boolean;
  defaultChecked?: boolean;
  children: React.ReactNode;
}) {
  const { error, onEdit } = useFieldError(name);
  return (
    <div className={error ? "rounded-xl border border-red-500 bg-red-50 p-3" : undefined}>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="mt-1 accent-terracotta"
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-error` : undefined}
          onChange={onEdit}
        />
        <span>
          {children}
          {required && <RequiredMark />}
        </span>
      </label>
      <ErrorText id={`${name}-error`} error={error} />
    </div>
  );
}
