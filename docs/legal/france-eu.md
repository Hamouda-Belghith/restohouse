# Legal framework — France first, then EU

> Working notes for product design, written 2026-10-04. **This is not legal
> advice.** Validate with a French lawyer (droit de la consommation / droit
> alimentaire) and the local DDPP before launch.

## 1. Is it legal to sell food cooked at home in France?

Yes, as long as the cook acts as a **food business operator**:

- EU Regulation **852/2004** on food hygiene explicitly covers "premises used
  primarily as a private dwelling-house but where foods are regularly prepared
  for placing on the market" (Annex II, Chapter III) with lighter structural
  requirements than a professional kitchen. Good hygiene practice, cleanable
  surfaces, hand washing, temperature control and pest control still apply.
- Regular sales are a **commercial activity**, so the cook must register a
  business (usually **micro-entreprise**, via the guichet unique INPI) and
  hold a **SIRET**. Typical APE codes: 56.10C (restauration de type rapide /
  vente à emporter), 56.21Z (traiteur), 56.10A (restauration traditionnelle).
- **Declaration to the DDPP** (Direction départementale de la protection des
  populations), Cerfa **13984**, before starting any activity that handles
  food of animal origin.
- **Hygiene training**: at least one person in a commercial catering business
  must have the 14-hour food-hygiene training (Décret **2011-731**, Arrêté du
  5 octobre 2011).
- **Traceability** (Reg. **178/2002**): keep supplier invoices and be able to
  trace ingredients.
- **Temperatures** (Arrêté du **21 décembre 2009**): chilled cooked dishes at
  0–3 °C, hot holding at ≥ 63 °C. This limits delivery distance and duration.

## 2. Consumer information

- **Allergens**: the 14 allergens in Annex II of Reg. **1169/2011** (INCO)
  must be disclosed, **including for non-prepacked food** (France: Décret
  **2015-447**), in writing and before purchase. The platform makes this a
  required field on every offer.
- Prices must be shown inclusive of all taxes, with delivery fees stated.
- **No right of withdrawal** for perishable goods or for leisure/catering
  services on a fixed date (Code de la consommation **L221-28**). The platform
  publishes its own cancellation policy.

## 3. Dine-in at a private home

- **"Table d'hôtes"** is a legally narrow notion (Code du tourisme
  L324-4 / D324-13): a single menu at the family table, offered **as part of
  chambres d'hôtes** (max 5 rooms / 15 people). A standalone dinner at home
  is **restaurant activity**, not table d'hôtes. The product must not use the
  term.
- Receiving the public turns the premises into an **ERP** (établissement
  recevant du public), 5th category for small numbers, with fire-safety and
  accessibility obligations. v0 caps dine-in capacity at **12 seats per slot**
  to stay small-scale. This threshold still needs verification.
- **Housing law**: leases and co-ownership rules (règlement de copropriété)
  may forbid commercial activity or receiving clients. In cities with more
  than 200,000 inhabitants and in Paris' inner suburbs, **L631-7-3 CCH**
  allows a professional activity in one's main residence **only if it does not
  involve receiving customers or goods**. Dine-in in those cities may need a
  change-of-use authorisation. The host must self-certify; this is a product
  risk to study further.
- **Alcohol**: selling alcohol with a meal requires a **petite licence
  restaurant** or **licence restaurant** plus the **permis d'exploitation**
  training (Code de la santé publique L3331-2, L3332-1-1). v0: **no alcohol
  sales**.
- **Insurance**: RC professionnelle (civil liability) covering food poisoning
  and guests at home.

## 4. Platform obligations (the marketplace itself)

| Topic | Source | v0 status |
|---|---|---|
| Seller identification (name, address, ID, registration number, self-certification) | DSA art. 30 (KYBC) | SIRET + identity in host profile, admin approval |
| Show whether seller is a professional, explain consumer rights | Code conso L111-7, DSA art. 31 | "Professional seller" badge + /legal |
| Main ranking parameters disclosed | P2B Reg. 2019/1150 art. 5, L111-7 | Described on /legal (v0: newest first) |
| Notice-and-action for illegal content | DSA art. 16 | Planned (contact e-mail in v0) |
| Report sellers' income to tax authority | DAC7 (Dir. 2021/514), CGI 1649 ter A | Planned v1 (needs TIN, date of birth, IBAN) |
| Inform sellers of their tax/social obligations + annual statement | CGI art. 242 bis | Notice on host page; statement planned |
| Handling third-party payments | PSD2 | No money in v0; Stripe Connect planned |
| Personal data | GDPR | Exact address hidden until booking confirmed; minimal data |

## 5. EU expansion notes

Reg. 852/2004, 178/2002 and 1169/2011, the DSA, P2B and DAC7 are EU-wide, so
most of the model carries over. What varies by country: business registration,
the hygiene-training requirement, the local food authority registration (e.g.
the UK FSA is outside the EU but similar; Belgium AFSCA/FAVV; Spain registro
sanitario), alcohol licensing, and housing/zoning rules. The `HostProfile`
compliance checklist should become **per-country** in v1.

## 6. Competitors and precedents

- **Eatwith** (formerly VizEat): dine-in experiences with hosts, cooking
  classes. Experience-focused, premium.
- **Super Marmite** (France): home-cooked dishes for pickup from neighbours.
  Shows demand, and also shows how hard regulation and unit economics are.
- **Shef**, **WoodSpoon** (US): home-cook delivery marketplaces, which rely on
  US cottage-food / MEHKO laws.

RestoHouse's angle: **one platform for all three modes** (pickup, delivery,
dine-in), with **compliance built into onboarding**.
