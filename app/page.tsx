import Link from 'next/link'

const buttonStyles =
  'inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-black text-white shadow hover:bg-gray-800 dark:border dark:border-input dark:bg-background dark:text-foreground dark:shadow-sm dark:hover:bg-accent dark:hover:text-accent-foreground'

const buttonOutline =
  'inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'

// Compact tier strip for the home page — the full treatment lives at /idea.
const TIER_STRIP = [
  { tier: 'Tier 1 — Pattern & Association', status: 'Machines: superhuman', core: false },
  { tier: 'Tier 2 — Embodied & Sensorimotor', status: 'Machines: improving, bounded', core: false },
  { tier: 'Tier 3 — Social & Personal', status: 'Machines: simulacra only', core: false },
  { tier: 'Tier 4 — Metacognitive & Supervisory', status: 'Machines: weak', core: true },
  { tier: 'Tier 5 — Causal & Counterfactual', status: 'Machines: unreliable', core: true },
  { tier: 'Tier 6 — Collective & Distributed', status: 'Machines: absent', core: true },
  { tier: 'Tier 7 — Existential & Wisdom', status: 'Machines: absent', core: true },
]

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="w-full py-16 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="flex flex-col justify-center space-y-6">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Irreducibly Human
              </h1>
              <p className="text-lg text-muted-foreground">
                What AI Can and Can&apos;t Do
              </p>
              <p className="max-w-[540px] text-lg leading-relaxed">
                There is a set of cognitive capacities that machines cannot reliably perform —
                and that no standard curriculum teaches systematically. Irreducibly Human names
                them in a seven-tier taxonomy, teaches them, and tests the claim against real
                labor data. The argument evolves through conversation with conversational AI.
                What you&apos;re looking at is the working document, not the finished product.
                That&apos;s the point.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/idea" className={buttonStyles}>
                  Read the Idea
                </Link>
                <Link href="/onet" className={buttonOutline}>
                  Open the AI Exposure Explorer
                </Link>
              </div>
            </div>
            <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
              <iframe
                src="https://www.youtube.com/embed/R2X2-_USSVY?si=mIyL7XqejJGbtizL"
                title="Irreducibly Human"
                width="100%"
                height="100%"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* The Idea Section */}
      <section className="w-full py-16 md:py-24 bg-muted/40">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground mb-3">
              The Idea
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Human intelligence, organized into seven tiers by how far machines have reached
              into each. Three tiers where machines compete or convincingly imitate. Four —
              highlighted — where they have not arrived. Those four are the curriculum.
            </p>
          </div>
          <div className="max-w-2xl mx-auto space-y-2 mb-10">
            {TIER_STRIP.map((t) => (
              <div
                key={t.tier}
                className={
                  t.core
                    ? 'flex flex-wrap items-baseline justify-between gap-2 rounded-md border-2 border-foreground bg-card px-5 py-3'
                    : 'flex flex-wrap items-baseline justify-between gap-2 rounded-md border bg-card px-5 py-3 opacity-70'
                }
              >
                <span className="font-medium">{t.tier}</span>
                <span className="text-sm text-muted-foreground uppercase tracking-wider">{t.status}</span>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/idea" className={buttonStyles}>
              The Full Taxonomy →
            </Link>
          </div>
        </div>
      </section>

      {/* AI Exposure Explorer Section */}
      <section className="w-full py-16 md:py-24 bg-foreground text-background">
        <div className="container px-4 md:px-6 mx-auto text-center max-w-3xl">
          <h2 className="text-sm font-semibold tracking-widest uppercase text-background/60 mb-3">
            The First Instrument
          </h2>
          <h3 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-6">
            The AI Exposure Explorer
          </h3>
          <p className="text-lg text-background/80 leading-relaxed mb-4">
            The tiers are a claim, and claims should be testable. The Explorer is the first real
            tool built to look: pick any two occupations and compare their employment trends
            against major AI milestones, then compare the human abilities each job leans on —
            and ask which of those abilities machines have actually reached.
          </p>
          <p className="text-sm text-background/60 mb-10">
            Built by Abisha Vadukoot, Milivoje (Mickey) Davidovic, and Nik Bear Brown, with data
            from O*NET and the U.S. Bureau of Labor Statistics (BLS).
          </p>
          <Link
            href="/onet"
            className="inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-bold tracking-wide transition-colors bg-background text-foreground shadow hover:bg-background/90"
          >
            OPEN THE EXPLORER
          </Link>
        </div>
      </section>

      {/* Contact Section (follows another dark section, so a subtle divider) */}
      <section className="w-full py-16 md:py-24 bg-foreground text-background border-t border-background/20">
        <div className="container px-4 md:px-6 mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">
            Bear Brown &amp; Company
          </h2>
          <p className="max-w-[600px] mx-auto text-background/70 text-lg mb-8">
            Irreducibly Human is a production of Bear Brown &amp; Company.
            For questions about the series, reach out directly.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="mailto:bear@bearbrown.co"
              className="inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium transition-colors border border-background/30 text-background hover:bg-background/10"
            >
              bear@bearbrown.co
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
