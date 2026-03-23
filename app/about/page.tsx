import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About - Medhavy',
  description: 'Medhavy — adaptive learning platform, white-label, institution-deployable AI education infrastructure.',
}

export default function AboutPage() {
  return (
    <div className="container px-4 md:px-6 mx-auto py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tighter mb-8">About</h1>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          <section>
            <p>
              Medhavy is an adaptive learning platform built for institutions. We provide white-label,
              deployable AI education infrastructure that helps organizations build and deliver
              personalized learning experiences at scale.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Founders</h2>
            <p>
              Medhavy was founded by <strong>Nik Bear Brown</strong> and <strong>Srinivas Sridhar</strong>.
              Together they bring decades of experience in AI, education technology, and academic research
              to the mission of making adaptive learning infrastructure accessible to every institution.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Mission</h2>
            <p>
              Our mission is to make high-quality, adaptive education accessible to every institution —
              from universities to workforce training programs. Medhavy provides the AI backbone so
              organizations can focus on what they do best: teaching.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">What We Build</h2>
            <p>
              Medhavy develops AI-powered tools for education — adaptive assessments, personalized
              learning paths, and intelligent content delivery systems. Our platform integrates with
              existing LMS infrastructure and scales from individual courses to institution-wide deployments.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Humanitarians AI</h2>
            <p>
              Medhavy is connected to{' '}
              <a href="https://humanitarians.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Humanitarians AI
              </a>
              , a 501(c)(3) nonprofit dedicated to developing ethical AI solutions for education, healthcare, and
              social impact. The organization mentors recent graduates through its Fellows Program, helping them
              build portfolios and transition into AI careers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Connect</h2>
            <p>
              Interested in deploying Medhavy at your institution? Reach out at{' '}
              <a href="mailto:medhavy@humanitarians.ai" className="text-primary hover:underline">medhavy@humanitarians.ai</a>.
            </p>
            <div className="flex flex-wrap gap-4 mt-4 not-prose">
              <a href="https://github.com/nikbearbrown" target="_blank" rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-black text-white shadow hover:bg-gray-800 dark:border dark:border-input dark:bg-background dark:text-foreground dark:shadow-sm dark:hover:bg-accent dark:hover:text-accent-foreground">
                GitHub
              </a>
              <a href="https://www.youtube.com/@NikBearBrown" target="_blank" rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-black text-white shadow hover:bg-gray-800 dark:border dark:border-input dark:bg-background dark:text-foreground dark:shadow-sm dark:hover:bg-accent dark:hover:text-accent-foreground">
                YouTube
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
