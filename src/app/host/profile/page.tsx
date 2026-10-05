import Link from "next/link";
import { redirect } from "next/navigation";
import { requireHost } from "@/lib/auth";
import { HostAccountForm } from "../HostAccountForm";

export const dynamic = "force-dynamic";

export default async function HostProfilePage() {
  const { profile } = await requireHost();
  // Verified (or in-review) details are locked: see saveHostAccount.
  if (profile.status === "PENDING" || profile.status === "APPROVED") redirect("/host");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/host" className="text-sm underline">← Dashboard</Link>
      <h1 className="h1">Your host page</h1>
      <HostAccountForm profile={profile} submitLabel="Save" />
    </div>
  );
}
