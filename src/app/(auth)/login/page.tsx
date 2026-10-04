import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { login } from "../actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="h1 mb-6">Welcome back</h1>
      <ActionForm action={login} className="card space-y-4 p-6">
        <input type="hidden" name="next" value={next ?? "/"} />
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        <SubmitButton className="btn w-full">Log in</SubmitButton>
        <p className="text-center text-sm text-muted">
          No account? <Link className="underline" href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Sign up</Link>
        </p>
      </ActionForm>
      <p className="mt-4 text-xs text-muted">
        Demo: guest@restohouse.test, amel@restohouse.test, admin@restohouse.test (password: password123)
      </p>
    </div>
  );
}
