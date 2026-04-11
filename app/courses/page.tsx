import type { Metadata } from "next";
import { CoursesBrowser } from "./CoursesBrowser";

export const metadata: Metadata = {
  title: "Courses - Irreducibly Human",
  description: "The Irreducibly Human course sequence from Bear Brown & Company. Each course develops a specific tier of human intelligence that AI cannot replicate.",
};

const COURSES = [
  {
    slug: "botspeak",
    title: "BotSpeak",
    subtitle: "Fluency in AI Communication",
    description:
      "Fluency in AI communication. How to talk to machines — and know when they're talking past you. Prompt engineering, model limitations, hallucination detection, and the rhetorical gap between human intent and machine output.",
    tier: "Tier 4",
  },
  {
    slug: "causal-reasoning",
    title: "Causal Reasoning",
    subtitle: "Causal Reasoning and World Modeling",
    description:
      "AI finds correlations. Humans build causal models. Counterfactual thinking, interventionist reasoning, and the kind of \"why\" questions that statistical models cannot answer.",
    tier: "Tier 5",
  },
  {
    slug: "ethical-play",
    title: "Ethical Play",
    subtitle: "Ethical Play and Moral Imagination",
    description:
      "Moral reasoning under uncertainty, value pluralism, and the limits of rule-based ethics. Developing the capacity for ethical judgment that cannot be reduced to optimization or alignment.",
    tier: "Tier 3",
  },
  {
    slug: "aimagineering",
    title: "AIMagineering",
    subtitle: "Creative Intelligence",
    description:
      "Generative AI produces outputs. Humans produce meaning. Creative process, aesthetic judgment, conceptual blending, and the difference between novelty and genuine originality.",
    tier: "Tier 4",
  },
  {
    slug: "embodied-teaching",
    title: "Embodied Teaching",
    subtitle: "Embodied Teaching and Mentorship",
    description:
      "Teaching is irreducibly human. Presence, improvisation, emotional attunement, and the embodied skills that make mentorship effective — none of which transfer to a language model.",
    tier: "Tier 2",
  },
  {
    slug: "conducting-ai",
    title: "Conducting AI",
    subtitle: "Supervisory Intelligence",
    description:
      "The five supervisory capacities: plausibility auditing, problem formulation, tool orchestration, interpretive judgment, and executive integration. The course that teaches you to conduct the orchestra, not play every instrument.",
    tier: "Tier 4",
  },
  {
    slug: "ai-sherpa",
    title: "The AI Sherpa",
    subtitle: "Experiential Learning Guide",
    description:
      "A practitioner's guide for experiential learning. The full 18-chapter arc — from design failure diagnosis through the Sherpa infrastructure to domain field guides for co-op, study abroad, clinical, trades, and corporate early career programs.",
    tier: "Guide",
  },
];

export default function CoursesPage() {
  return (
    <div className="container px-4 md:px-6 mx-auto py-12">
      <div className="max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
          The Courses
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Each course targets a distinct human capacity that remains beyond the
          reach of current AI. Taken together, they form a map of what makes
          human intelligence irreducible.
        </p>
        <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-8">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src="https://www.youtube.com/embed/R2X2-_USSVY?si=mIyL7XqejJGbtizL"
            title="Irreducibly Human"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>

      <CoursesBrowser courses={COURSES} />
    </div>
  );
}
