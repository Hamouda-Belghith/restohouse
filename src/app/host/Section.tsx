export function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4 p-6">
      <div>
        <h2 className="h2">{title}</h2>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function TaxNotice() {
  return (
    <p className="text-xs text-muted">
      Tax & social obligations: income from RestoHouse must be declared (URSSAF for micro-entrepreneurs, and your income
      tax return). Under EU DAC7 rules RestoHouse will report hosts&apos; earnings to the tax authorities and send you an
      annual statement (art. 242 bis CGI). See impots.gouv.fr and urssaf.fr.
    </p>
  );
}
