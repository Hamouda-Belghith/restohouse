import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { signup } from "../actions";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="h1 mb-2">Join RestoHouse</h1>
      <p className="mb-6 text-sm text-muted">One account to eat, and to cook when you&apos;re ready.</p>
      <ActionForm action={signup} className="card space-y-4 p-6">
        <input type="hidden" name="next" value={next ?? "/"} />
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input className="input" id="name" name="name" required autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password (min. 8 characters)</label>
          <input className="input" id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
        </div>
        <SubmitButton className="btn w-full">Create account</SubmitButton>
        <p className="text-center text-sm text-muted">
          Already have an account? <Link className="underline" href="/login">Log in</Link>
        </p>
      </ActionForm>
    </div>
  );
}
