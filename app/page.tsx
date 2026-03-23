const buttonStyles =
  'inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-black text-white shadow hover:bg-gray-800 dark:border dark:border-input dark:bg-background dark:text-foreground dark:shadow-sm dark:hover:bg-accent dark:hover:text-accent-foreground'

const buttonOutline =
  'inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'

const FEATURES = [
  {
    title: 'CONVERSATIONAL TEXTBOOKS',
    description:
      'Medhavy transforms static PDFs into interactive conversations. Students can ask questions in natural language and receive answers grounded in course-specific content, not generic internet responses.',
    link: 'Learn more about conversational features',
  },
  {
    title: 'AI AS CO-INSTRUCTOR',
    description:
      'Medhavy automatically creates summaries, quizzes, exams, and lecture notes while keeping instructors in control. AI proposes, instructors dispose—preserving pedagogical expertise and teaching philosophy.',
    link: 'Explore AI co-instruction capabilities',
  },
  {
    title: 'EFFORTLESS COURSE CREATION',
    description:
      'Import an OpenStax book or GitHub markdown repository and Medhavy builds Canvas modules, generates assessments, and creates lecture materials. What used to take weeks becomes an afternoon of review.',
    link: 'See how Medhavy saves time',
  },
  {
    title: 'UNIFIED LEARNING PLATFORM',
    description:
      'Medhavy unifies OpenStax textbooks, GitHub repositories, and existing Canvas content into a single, structured course experience—eliminating frustrating platform jumping for both students and instructors.',
    link: 'Discover platform integration',
  },
]

const BENEFITS = [
  {
    heading: 'FOR INSTRUCTORS',
    items: [
      'Cut course build time from weeks to hours',
      'Keep full editorial control over content',
      'Align AI-generated content with your teaching style',
      'Gain a "co-instructor" that knows your course',
    ],
  },
  {
    heading: 'FOR STUDENTS',
    items: [
      'Access a cohesive course where textbooks answer questions',
      'Receive personalized explanations aligned with learning style',
      'Spend less time hunting for materials',
      'Focus more time on understanding concepts',
    ],
  },
  {
    heading: 'FOR ADMINISTRATORS',
    items: [
      'Rapidly deploy consistent, high-quality courses',
      'Maintain FERPA-compliant architecture',
      'Track version history with unpublished-by-default workflow',
      'Implement best-practice AI principles',
    ],
  },
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
                Medhavy
              </h1>
              <p className="text-lg text-muted-foreground">
                Often spelled Medhavy
              </p>
              <p className="max-w-[540px] text-lg leading-relaxed">
                <strong className="font-bold">
                  मेधावी (Medhavy): From Sanskrit, meaning &ldquo;intelligent&rdquo; or
                  &ldquo;intellectually brilliant&rdquo;
                </strong>
                {' — the perfect name for our AI-powered intelligent textbook system.'}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <a href="mailto:medhavy@humanitarians.ai" className={buttonStyles}>
                  Request Demo
                </a>
                <a href="mailto:medhavy@humanitarians.ai" className={buttonOutline}>
                  Contact Us
                </a>
              </div>
            </div>
            <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
              <iframe
                src="https://www.youtube.com/embed/GN7yQntWJHU"
                title="Medhavy"
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

      {/* Features Section */}
      <section className="w-full py-16 md:py-24 bg-muted/40">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground mb-3">
              Transform Your Textbooks
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Medhavy turns static textbooks into a living, AI-curated course inside
              Canvas—combining automation with instructor control to deliver effortless,
              personalized, and emotionally intelligent learning at scale.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border bg-card p-8 shadow-sm flex flex-col"
              >
                <h3 className="text-lg font-bold tracking-wide mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed flex-1">
                  {feature.description}
                </p>
                <a
                  href="#"
                  className="mt-6 text-sm font-medium text-foreground hover:underline"
                >
                  {feature.link} →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Benefits Section */}
      <section className="w-full py-16 md:py-24 bg-foreground text-background">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-sm font-semibold tracking-widest uppercase text-background/60 mb-3">
              Who Benefits from Medhavy?
            </h2>
            <p className="text-lg text-background/70 max-w-2xl mx-auto">
              Medhavy creates value for everyone involved in the educational ecosystem.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.heading}
                className="rounded-lg border border-background/10 bg-background/5 p-8"
              >
                <h3 className="text-lg font-bold tracking-wide mb-4">
                  {benefit.heading}
                </h3>
                <ul className="space-y-3">
                  {benefit.items.map((item) => (
                    <li
                      key={item}
                      className="text-background/80 text-sm leading-relaxed flex gap-2"
                    >
                      <span className="text-background/40 shrink-0">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
