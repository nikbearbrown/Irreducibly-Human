import Link from 'next/link'

export const metadata = {
  title: 'The Idea — Irreducibly Human',
  description:
    'The Irreducibly Human thesis and the seven-tier taxonomy of human intelligence: which cognitive capacities machines can replicate, which they cannot, and why the difference should reorganize what we teach.',
}

const buttonStyles =
  'inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-black text-white shadow hover:bg-gray-800 dark:border dark:border-input dark:bg-background dark:text-foreground dark:shadow-sm dark:hover:bg-accent dark:hover:text-accent-foreground'

const buttonOutline =
  'inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'

interface Tier {
  number: number
  name: string
  machines: string
  detail: string
  implication: string
  core: boolean
}

const TIERS: Tier[] = [
  {
    number: 1,
    name: 'Pattern & Association',
    machines: 'Superhuman',
    detail:
      'Statistical pattern-matching at scale — classification, prediction, retrieval, generation. Humans competing here is malpractice.',
    implication: 'Deprioritize. Machines do this better.',
    core: false,
  },
  {
    number: 2,
    name: 'Embodied & Sensorimotor',
    machines: 'Improving, bounded',
    detail:
      'Physical skill and sensorimotor intelligence. Machines are improving but remain bounded by the constraints of physical deployment.',
    implication: 'Context-dependent. Not the series focus.',
    core: false,
  },
  {
    number: 3,
    name: 'Social & Personal',
    machines: 'Simulacra only',
    detail:
      'Genuine relationship, trust, and interpersonal judgment. Machines produce convincing simulations of connection, not connection.',
    implication: 'Important, but not the series focus.',
    core: false,
  },
  {
    number: 4,
    name: 'Metacognitive & Supervisory',
    machines: 'Weak',
    detail:
      'Plausibility auditing, problem formulation, knowing when to distrust the output. These require a model of the machine’s limits that the machine cannot supply.',
    implication: 'High priority. Underscaffolded in every current curriculum.',
    core: true,
  },
  {
    number: 5,
    name: 'Causal & Counterfactual',
    machines: 'Unreliable',
    detail:
      'The causal parrot problem: language models reproduce causal-sounding language without performing causal reasoning. Variable selection, edge orientation, and conditioning decisions still require domain judgment.',
    implication: 'High priority. The gap between predictive and causal intelligence is the decisive engineering problem.',
    core: true,
  },
  {
    number: 6,
    name: 'Collective & Distributed',
    machines: 'Absent',
    detail:
      'Collective intelligence emerges from systems of people in relationship; it cannot be compressed into training data. The collaborative friction that refined our ideas is not in the weights.',
    implication: 'High priority. Unaddressed by individual-focused intelligence frameworks.',
    core: true,
  },
  {
    number: 7,
    name: 'Existential & Wisdom',
    machines: 'Absent',
    detail:
      'Interpretive judgment, values integration, the capacity to know which question is worth asking. These require a self that machines do not have.',
    implication: 'High priority. The least-taught tier of all.',
    core: true,
  },
]

export default function IdeaPage() {
  return (
    <div className="flex flex-col w-full">
      {/* Thesis */}
      <section className="w-full py-16 md:py-24">
        <div className="container px-4 md:px-6 mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl mb-6">The Idea</h1>
          <p className="text-lg leading-relaxed mb-6">
            There is a set of cognitive capacities — causal reasoning, plausibility auditing,
            problem formulation, interpretive judgment, metacognitive supervision, collective
            epistemic function — that machines currently cannot perform reliably, and that the
            standard curriculum does not teach systematically.
          </p>
          <p className="text-lg leading-relaxed mb-6">
            These are not soft skills. They are the specific forms of intelligence that allow a
            person to <em>use</em> a powerful AI tool rather than be used by it. Irreducibly Human
            names them, teaches them, and demonstrates each one by the method used to build it.
          </p>
          <blockquote className="border-l-4 border-foreground pl-6 py-2 my-8">
            <p className="text-xl font-medium leading-relaxed">
              Stop teaching people to be slower calculators. Start teaching them to be better
              question askers — specifically, the questions machines cannot yet answer.
            </p>
          </blockquote>
        </div>
      </section>

      {/* The taxonomy */}
      <section className="w-full py-16 md:py-24 bg-muted/40">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground mb-3">
              The Seven Tiers
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A taxonomy of human intelligence, organized by how far machines have reached into
              each tier. The first three are where machines compete or convincingly imitate.
              The last four — highlighted — are where they have not arrived, and where the
              educational payoff is highest.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
            {TIERS.map((tier) => (
              <div
                key={tier.number}
                className={
                  tier.core
                    ? 'rounded-lg border-2 border-foreground bg-card p-6 shadow-sm flex flex-col'
                    : 'rounded-lg border bg-card p-6 shadow-sm flex flex-col opacity-80'
                }
              >
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="text-lg font-bold tracking-wide">
                    Tier {tier.number} — {tier.name}
                  </h3>
                </div>
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Machines: {tier.machines}
                </p>
                <p className="text-muted-foreground leading-relaxed flex-1 mb-4">{tier.detail}</p>
                <p className="text-sm font-medium">{tier.implication}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center mt-10 max-w-2xl mx-auto">
            The taxonomy derives from &ldquo;Knowing Enough to Distrust the Machine&rdquo;
            (Theorist.ai, March 2026).
          </p>
        </div>
      </section>

      {/* The meta-principle */}
      <section className="w-full py-16 md:py-24">
        <div className="container px-4 md:px-6 mx-auto max-w-3xl">
          <h2 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground mb-3">
            The Meta-Principle
          </h2>
          <p className="text-lg leading-relaxed mb-6">
            The process of building each part of Irreducibly Human is an instance of the
            methodology it describes. A book on causal reasoning is built through structured
            causal reasoning. A book on plausibility auditing is built through explicit
            plausibility auditing. The argument evolves through conversation with conversational
            AI, and the curriculum takes shape as the design is debated. What you are looking at
            is the working document, not the finished product. That&apos;s the point.
          </p>
        </div>
      </section>

      {/* The first instrument */}
      <section className="w-full py-16 md:py-24 bg-foreground text-background">
        <div className="container px-4 md:px-6 mx-auto text-center max-w-3xl">
          <h2 className="text-sm font-semibold tracking-widest uppercase text-background/60 mb-3">
            The First Instrument
          </h2>
          <h3 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-6">
            The AI Exposure Explorer
          </h3>
          <p className="text-lg text-background/80 leading-relaxed mb-10">
            The tiers are a claim, and claims should be testable. The AI Exposure Explorer puts
            the thesis against real labor data: pick any two occupations and compare their
            employment trends against major AI milestones, then compare the human abilities each
            job leans on — asking which of those abilities machines have reached, and which they
            haven&apos;t.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/onet"
              className="inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-bold tracking-wide transition-colors bg-background text-foreground shadow hover:bg-background/90"
            >
              OPEN THE EXPLORER
            </Link>
          </div>
        </div>
      </section>

      {/* Back / next */}
      <section className="w-full py-12">
        <div className="container px-4 md:px-6 mx-auto flex flex-wrap justify-center gap-4">
          <Link href="/" className={buttonOutline}>
            ← Home
          </Link>
          <Link href="/onet" className={buttonStyles}>
            AI Exposure Explorer →
          </Link>
        </div>
      </section>
    </div>
  )
}
