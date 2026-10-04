import { ActionForm } from "@/components/ActionForm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { isValidSiret } from "@/lib/domain/siret";
import { reviewHost } from "./actions";

export const dynamic = "force-dynamic";

const day = (d: Date | null) => (d ? d.toLocaleDateString("fr-FR") : "—");

export default async function AdminPage() {
  await requireAdmin();
  const [pending, counts] = await Promise.all([
    db.hostProfile.findMany({ where: { status: "PENDING" }, include: { user: true }, orderBy: { submittedAt: "asc" } }),
    db.hostProfile.groupBy({ by: ["status"], _count: true }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="h1">Host verification</h1>
      <p className="text-sm text-muted">
        {counts.map((c) => `${c.status.toLowerCase()}: ${c._count}`).join(" · ")}
      </p>
      <p className="text-sm text-muted">
        Check the SIRET on annuaire-entreprises.data.gouv.fr and ask for the DDPP receipt, hygiene certificate and
        insurance certificate before approving.
      </p>
      {pending.length === 0 && <p className="card p-8 text-center text-muted">Nothing to review.</p>}
      {pending.map((p) => (
        <div key={p.id} className="card space-y-3 p-5">
          <h2 className="h2">{p.displayName} <span className="text-sm font-normal text-muted">({p.user.email})</span></h2>
          <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <dt className="text-muted">Address</dt>
            <dd>{p.addressLine}, {p.postalCode} {p.city}</dd>
            <dt className="text-muted">SIRET</dt>
            <dd>
              <a className="underline" target="_blank" rel="noreferrer"
                href={`https://annuaire-entreprises.data.gouv.fr/etablissement/${p.siret}`}>{p.siret}</a>{" "}
              {isValidSiret(p.siret) ? "✔ checksum" : "✘ invalid"}
            </dd>
            <dt className="text-muted">DDPP declaration</dt>
            <dd>{day(p.ddppDeclarationDate)}</dd>
            <dt className="text-muted">Hygiene training</dt>
            <dd>{day(p.hygieneTrainingDate)}</dd>
            <dt className="text-muted">Insurance</dt>
            <dd>{p.insurer} · {p.insurancePolicyNumber}</dd>
            <dt className="text-muted">Housing consent / charter</dt>
            <dd>{p.housingConsent ? "yes" : "no"} / {p.charterAccepted ? "yes" : "no"}</dd>
          </dl>
          <ActionForm action={reviewHost} className="flex flex-wrap gap-2">
            <input type="hidden" name="profileId" value={p.id} />
            <input name="reason" className="input max-w-md flex-1" placeholder="Reason (required to reject)" aria-label="Reason" />
            <button className="btn" name="decision" value="approve">Approve</button>
            <button className="btn-ghost" name="decision" value="reject">Reject</button>
          </ActionForm>
        </div>
      ))}
    </div>
  );
}
