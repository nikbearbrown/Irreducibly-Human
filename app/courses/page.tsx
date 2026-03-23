import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Courses - Irreducibly Human",
  description: "The five-course Irreducibly Human sequence at Northeastern University's MGEN program. Each course develops a specific tier of human intelligence that AI cannot replicate.",
};

const COURSES = [
  {
    title: "BotSpeak",
    subtitle: "Fluency in AI Communication",
    description:
      "The Nine Pillars of AI Fluency. How to talk to machines — and know when they're talking past you. The series entry point.",
    href: "/courses/botspeak",
    tier: "Tier 4",
  },
  {
    title: "Causal Reasoning",
    subtitle: "Causal Reasoning and World Modeling",
    description:
      "AI finds correlations. Humans build causal models. DAG construction, the backdoor criterion, and the identification layer.",
    href: "/courses/causal-reasoning",
    tier: "Tier 5",
  },
  {
    title: "Ethical Play",
    subtitle: "Ethical Play and Moral Imagination",
    description:
      "Ethical frameworks as game mechanics. The gap between structural analysis and felt moral weight.",
    href: "/courses/ethical-play",
    tier: "Tier 3",
  },
  {
    title: "AIMagineering",
    subtitle: "Creative Intelligence",
    description:
      "The full design pipeline — Empathize, Define, Ideate, Prototype, Test, Commit. The Commit stage that Design Thinking omits.",
    href: "/courses/aimagineering",
    tier: "Tier 4",
  },
  {
    title: "Embodied Teaching",
    subtitle: "Embodied Teaching and Mentorship",
    description:
      "AI integration planning for domains where learning happens in the body. The handoff vs. protect distinction.",
    href: "/courses/embodied-teaching",
    tier: "Tier 2",
  },
];

export default function CoursesPage() {
  return (
    <div className="container px-4 md:px-6 mx-auto py-12">
      <div className="max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
          The Courses
        </h1>
        <p className="text-xl text-muted-foreground">
          Five courses, each targeting a distinct human capacity that remains
          beyond the reach of current AI. Taken together, they form a map of
          what makes human intelligence irreducible.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {COURSES.map((course) => (
          <Link
            key={course.title}
            href={course.href}
            className="rounded-lg border bg-card p-8 shadow-sm flex flex-col hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-bold tracking-wide">
                {course.title}
              </h2>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {course.tier}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {course.subtitle}
            </p>
            <p className="text-muted-foreground leading-relaxed flex-1">
              {course.description}
            </p>
            <span className="mt-6 text-sm font-medium text-foreground">
              View course →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
