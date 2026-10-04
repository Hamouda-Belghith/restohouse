import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { SearchForm } from "@/components/SearchForm";
import { searchListings } from "@/lib/listings";

export const dynamic = "force-dynamic";

const MODES = [
  { type: "PICKUP", icon: "🥡", title: "Pickup", text: "Order a dish, collect it warm from your neighbour's door." },
  { type: "DELIVERY", icon: "🛵", title: "Delivery", text: "Home cooking delivered nearby, kept at the right temperature." },
  { type: "DINE_IN", icon: "🍽️", title: "Dine-in", text: "Take a seat at a host's table: a view, a story, a tradition." },
];

export default async function Home() {
  const featured = await searchListings({}, 6);
  return (
    <div className="space-y-14">
      <section className="grid items-center gap-8 pt-4 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <p className="text-sm font-semibold tracking-widest text-olive uppercase">Home cooking · France</p>
          <h1 className="font-serif text-4xl leading-tight font-semibold sm:text-6xl">
            Eat at someone&apos;s <span className="text-terracotta italic">home</span>, not a chain.
          </h1>
          <p className="max-w-xl text-lg text-muted">
            Traditional recipes, a terrace with a view, a grandmother&apos;s couscous. RestoHouse connects you with
            registered home cooks for pickup, delivery or a seat at their table.
          </p>
          <SearchForm />
        </div>
        <div className="hidden grid-cols-2 gap-3 md:grid">
          {featured.slice(0, 4).map((l) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={l.id} src={l.imageUrl ?? ""} alt="" className="aspect-square rounded-2xl object-cover odd:translate-y-6" />
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {MODES.map((m) => (
          <Link key={m.type} href={`/listings?type=${m.type}`} className="card p-5 transition hover:border-terracotta">
            <div className="text-3xl">{m.icon}</div>
            <h2 className="h2 mt-2">{m.title}</h2>
            <p className="text-sm text-muted">{m.text}</p>
          </Link>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="h1">Cooking soon</h2>
          <Link href="/listings" className="text-sm underline">See all</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </section>

      <section className="card grid gap-6 p-8 md:grid-cols-2">
        <div>
          <h2 className="h1">Your kitchen, your restaurant.</h2>
          <p className="mt-3 text-muted">
            Share your cooking with your neighbourhood. We guide you through the French rules (SIRET, DDPP declaration,
            hygiene training, allergens) so you can cook with confidence.
          </p>
        </div>
        <div className="flex items-center md:justify-end">
          <Link href="/host" className="btn">Become a host</Link>
        </div>
      </section>
    </div>
  );
}
