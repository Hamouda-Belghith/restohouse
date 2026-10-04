export const metadata = { title: "Rules & legal information · RestoHouse" };

export default function LegalPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 text-[15px] leading-relaxed">
      <h1 className="h1">Rules, ranking & legal information</h1>
      <p className="rounded-xl border border-saffron/50 bg-saffron/10 p-4 text-sm">
        RestoHouse is a v0 prototype. No payment is processed. This page describes how the platform is designed to work.
      </p>

      <section className="space-y-2">
        <h2 className="h2">What RestoHouse is</h2>
        <p>
          RestoHouse is an online marketplace. It connects guests with independent hosts who prepare food in their
          home kitchen for pickup or delivery, or serve it at their table. The contract for the meal is between the
          guest and the host. RestoHouse is not a restaurant, and the hosts are not its employees.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="h2">All hosts are professional sellers</h2>
        <p>
          Selling food regularly is a commercial activity in France. Before publishing anything, every host gives us
          their <strong>SIRET</strong>, the date of their <strong>declaration to the DDPP</strong> (Cerfa 13984), the
          date of their <strong>14-hour food-hygiene training</strong>, and their <strong>professional liability insurance</strong>.
          They also confirm that their housing situation allows the activity. A RestoHouse team member reviews each
          profile (EU Digital Services Act, art. 30). Your consumer rights therefore apply to every purchase.
        </p>
      </section>

      <section id="hosts" className="space-y-2">
        <h2 className="h2">Host obligations</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Follow EU hygiene rules for food prepared in a private home (Reg. 852/2004, Annex II, Ch. III) and keep ingredients traceable (Reg. 178/2002).</li>
          <li>Keep chilled dishes at 0–3 °C and hot dishes at ≥ 63 °C, including during delivery (delivery radius max. 15 km).</li>
          <li>Declare the 14 regulated allergens for every offer (Reg. 1169/2011, Décret 2015-447).</li>
          <li>Never sell alcohol through RestoHouse (licence required). Dine-in experiences are limited to 12 guests per slot.</li>
          <li>Declare your income. RestoHouse reports hosts&apos; earnings to the tax authorities under DAC7 and sends you an annual statement.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="h2">How offers are ranked</h2>
        <p>
          Search results only include published offers from approved hosts that match your filters (city, cuisine,
          type). They are sorted by <strong>soonest available slot</strong>, then by most recently created. No host pays
          to be ranked higher. (P2B Regulation 2019/1150, art. 5; Code de la consommation L111-7.)
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="h2">Bookings & cancellation</h2>
        <p>
          A booking is a request until the host confirms it. The host&apos;s exact address and phone number are only
          shared after confirmation. Guests can cancel a requested or confirmed booking from &ldquo;My bookings&rdquo;. The
          legal 14-day withdrawal right does not apply to perishable food or to catering services on a fixed date
          (Code de la consommation L221-28).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="h2">Personal data</h2>
        <p>
          We only collect what we need to run bookings and to meet our legal duties (GDPR). Host addresses stay private
          until a booking is confirmed. To exercise your rights or report illegal content: contact@restohouse.example.
        </p>
      </section>
    </article>
  );
}
