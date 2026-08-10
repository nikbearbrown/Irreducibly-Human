// Plain-language glossary for O*NET ability names + their categories, used by
// the /onet ProfileChart glossary drawer and the per-term "?" previews.
//
// Keyed by the lowercased term name (ability element_name or category), so the
// chart can look a term up directly from what it displays. Definitions are
// written for a lay reader, NOT copied verbatim from O*NET — reviewed for
// accessibility. If a displayed name has no entry here, the term simply shows
// no definition (safe fallback).

export interface GlossaryEntry {
  term: string
  category: string // 'Cognitive' | 'Psychomotor' | 'Physical' | 'Sensory' | 'Category'
  definition: string
}

// Chart elements the reader may want defined (not abilities/categories).
const CHART_TERMS: GlossaryEntry[] = [
  {
    term: 'Workforce Average',
    category: 'Chart',
    definition:
      "The short vertical tick on each ability's row. It marks the average rating for that ability across all " +
      'occupations O*NET tracks (about 1,000), counting each occupation once. It is worked out by averaging every ' +
      "occupation's rating for the ability and leaving out any with missing or withheld values.",
  },
  {
    term: 'O*NET',
    category: 'Source',
    definition:
      'The Occupational Information Network, a free U.S. Department of Labor database that describes the skills, ' +
      'abilities, and tasks of nearly every occupation. The ability ratings in these charts come from O*NET.',
  },
  {
    term: 'BLS',
    category: 'Source',
    definition:
      'The U.S. Bureau of Labor Statistics, the federal agency that measures jobs and wages. The employment ' +
      'numbers in these charts come from its Occupational Employment and Wage Statistics program.',
  },
]

// The four ability categories themselves.
const CATEGORIES: GlossaryEntry[] = [
  { term: 'Cognitive', category: 'Category', definition: 'Mental abilities: how a person acquires, processes, reasons about, and communicates information.' },
  { term: 'Psychomotor', category: 'Category', definition: 'Abilities that coordinate the mind and body to move, manipulate, and react with precision and speed.' },
  { term: 'Physical', category: 'Category', definition: 'Bodily abilities: strength, endurance, flexibility, and whole-body coordination and balance.' },
  { term: 'Sensory', category: 'Category', definition: 'Abilities of the senses: how well a person sees, hears, and tells sights and sounds apart.' },
]

const COGNITIVE: GlossaryEntry[] = [
  { term: 'Oral Comprehension', category: 'Cognitive', definition: 'Understanding spoken words and sentences.' },
  { term: 'Written Comprehension', category: 'Cognitive', definition: 'Understanding written words and sentences.' },
  { term: 'Oral Expression', category: 'Cognitive', definition: 'Communicating ideas clearly when speaking so others understand.' },
  { term: 'Written Expression', category: 'Cognitive', definition: 'Communicating ideas clearly in writing so others understand.' },
  { term: 'Fluency of Ideas', category: 'Cognitive', definition: 'Coming up with many ideas about a topic (quantity, not quality).' },
  { term: 'Originality', category: 'Cognitive', definition: 'Coming up with unusual or clever ideas, or creative ways to solve a problem.' },
  { term: 'Problem Sensitivity', category: 'Cognitive', definition: 'Noticing when something is wrong or likely to go wrong (spotting the problem, not solving it).' },
  { term: 'Deductive Reasoning', category: 'Cognitive', definition: 'Applying general rules to specific cases to reach sensible conclusions.' },
  { term: 'Inductive Reasoning', category: 'Cognitive', definition: 'Combining separate pieces of information to find a general pattern or rule.' },
  { term: 'Information Ordering', category: 'Cognitive', definition: 'Arranging things or steps in a correct order by a rule (numbers, letters, procedures).' },
  { term: 'Category Flexibility', category: 'Cognitive', definition: 'Grouping things in different ways, using several sets of rules or categories.' },
  { term: 'Mathematical Reasoning', category: 'Cognitive', definition: 'Choosing the right method or formula to solve a problem.' },
  { term: 'Number Facility', category: 'Cognitive', definition: 'Adding, subtracting, multiplying, and dividing quickly and correctly.' },
  { term: 'Memorization', category: 'Cognitive', definition: 'Remembering information such as words, numbers, pictures, and procedures.' },
  { term: 'Speed of Closure', category: 'Cognitive', definition: 'Making sense of information that seems meaningless or incomplete at first glance.' },
  { term: 'Flexibility of Closure', category: 'Cognitive', definition: 'Spotting a known pattern hidden within distracting or cluttered material.' },
  { term: 'Perceptual Speed', category: 'Cognitive', definition: 'Quickly and accurately comparing letters, numbers, objects, pictures, or patterns.' },
  { term: 'Spatial Orientation', category: 'Cognitive', definition: 'Knowing where you are relative to your surroundings, or where things are around you.' },
  { term: 'Visualization', category: 'Cognitive', definition: 'Imagining how something will look after it is moved around or rearranged.' },
  { term: 'Selective Attention', category: 'Cognitive', definition: 'Concentrating on a task without being distracted.' },
  { term: 'Time Sharing', category: 'Cognitive', definition: 'Shifting back and forth between two or more activities or sources of information.' },
]

const PSYCHOMOTOR: GlossaryEntry[] = [
  { term: 'Arm-Hand Steadiness', category: 'Psychomotor', definition: 'Keeping your hand and arm steady while moving or holding them in one position.' },
  { term: 'Manual Dexterity', category: 'Psychomotor', definition: 'Moving your hand, or your hand together with your arm, to grasp and handle objects.' },
  { term: 'Finger Dexterity', category: 'Psychomotor', definition: 'Making precise, coordinated finger movements to handle small objects.' },
  { term: 'Control Precision', category: 'Psychomotor', definition: 'Quickly and repeatedly adjusting controls to an exact position.' },
  { term: 'Multilimb Coordination', category: 'Psychomotor', definition: 'Coordinating two or more limbs together while the body is still or moving.' },
  { term: 'Response Orientation', category: 'Psychomotor', definition: 'Quickly choosing the right movement in response to different signals.' },
  { term: 'Rate Control', category: 'Psychomotor', definition: 'Timing your movements to match a moving object or scene as its speed changes.' },
  { term: 'Reaction Time', category: 'Psychomotor', definition: 'Responding quickly, with hand, finger, or foot, once a signal appears.' },
  { term: 'Wrist-Finger Speed', category: 'Psychomotor', definition: 'Making fast, repeated movements of the fingers, hands, and wrists.' },
  { term: 'Speed of Limb Movement', category: 'Psychomotor', definition: 'Moving the arms or legs quickly (speed alone, not accuracy).' },
]

const PHYSICAL: GlossaryEntry[] = [
  { term: 'Static Strength', category: 'Physical', definition: 'Exerting maximum force to lift, push, pull, or carry a heavy object once.' },
  { term: 'Explosive Strength', category: 'Physical', definition: 'Using short bursts of muscle force to jump or throw.' },
  { term: 'Dynamic Strength', category: 'Physical', definition: 'Exerting force repeatedly or continuously over time without tiring.' },
  { term: 'Trunk Strength', category: 'Physical', definition: 'Using your stomach and lower-back muscles to support part of the body repeatedly or continuously.' },
  { term: 'Stamina', category: 'Physical', definition: 'Exerting yourself physically over long periods without getting out of breath.' },
  { term: 'Extent Flexibility', category: 'Physical', definition: 'Bending, stretching, twisting, or reaching with your body, arms, or legs.' },
  { term: 'Dynamic Flexibility', category: 'Physical', definition: 'Bending, stretching, twisting, or reaching quickly and repeatedly.' },
  { term: 'Gross Body Coordination', category: 'Physical', definition: 'Coordinating the movement of arms, legs, and torso together while the whole body is moving.' },
  { term: 'Gross Body Equilibrium', category: 'Physical', definition: 'Keeping or regaining your balance, or staying upright in an unstable position.' },
]

const SENSORY: GlossaryEntry[] = [
  { term: 'Near Vision', category: 'Sensory', definition: 'Seeing details of objects that are close to you.' },
  { term: 'Far Vision', category: 'Sensory', definition: 'Seeing details of objects that are far away.' },
  { term: 'Visual Color Discrimination', category: 'Sensory', definition: 'Telling colors apart, including shades and brightness.' },
  { term: 'Night Vision', category: 'Sensory', definition: 'Seeing well in low light.' },
  { term: 'Peripheral Vision', category: 'Sensory', definition: 'Noticing objects or movement off to the side while looking straight ahead.' },
  { term: 'Depth Perception', category: 'Sensory', definition: 'Judging which of several objects is closer or farther, or how far away something is.' },
  { term: 'Glare Sensitivity', category: 'Sensory', definition: 'Seeing objects clearly in bright or glaring light.' },
  { term: 'Hearing Sensitivity', category: 'Sensory', definition: 'Telling apart sounds that differ in loudness or pitch.' },
  { term: 'Auditory Attention', category: 'Sensory', definition: 'Focusing on one source of sound while other sounds compete for attention.' },
  { term: 'Sound Localization', category: 'Sensory', definition: 'Telling which direction a sound is coming from.' },
  { term: 'Speech Recognition', category: 'Sensory', definition: 'Identifying and understanding the speech of another person.' },
  { term: 'Speech Clarity', category: 'Sensory', definition: 'Speaking clearly so listeners can understand you.' },
]

export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  ...CHART_TERMS,
  ...CATEGORIES,
  ...COGNITIVE,
  ...PSYCHOMOTOR,
  ...PHYSICAL,
  ...SENSORY,
]

// ---------------------------------------------------------------------------
// Interpretive framing (drafted from README.md's seven-tier taxonomy of human
// cognition "sorted by machine capability"). REVIEW WORDING before shipping —
// this layers the site's argument onto neutral O*NET data, so it must read as
// the program's framing, not an invented automation score.
// ---------------------------------------------------------------------------

// #1 — one line per view stating the question it answers.
export const VIEW_FRAMING = {
  comparison: 'Where does each occupation need more or less of a given human ability?',
  differences: 'Which abilities most separate these two occupations?',
} as const

// Shown in the TOP DIFFERENCES view, in the space the category tabs occupy in
// COMPARISON — a short description of what the ranked view shows.
export const DIFFERENCES_ABOUT = [
  'Abilities are ordered so the biggest gaps between the two occupations come first.',
  'Each bar points toward whichever occupation scores higher on that ability; a longer bar means a wider gap.',
]

// How-to-read footnote for TOP DIFFERENCES (solid vs hollow bars).
export const DIFFERENCES_FOOTNOTE = [
  "A filled (shaded) bar means the difference is statistically clear: the two occupations' confidence intervals do not overlap.",
  'A hollow (unshaded) bar, marked with ~, means the difference may be noise: their confidence intervals overlap.',
]

// Level A — narrative context shown once above the chart.
export const CHART_THESIS_INTRO =
  "Machines are now superhuman at the pattern recognition, recall, and calculation that make up much of O*NET's " +
  'Cognitive abilities. Use this profile to see which abilities a job leans on, not as a ranking of what is safe ' +
  'from automation: the capacities hardest for AI to replicate (judgment, causal reasoning, and embodied or ' +
  'collective know-how) sit largely above what these measures capture.'

// Level B — one line per ability category, tied to the taxonomy's tiers and its
// stated AI-capability level. Keyed by lowercased category.
export const CATEGORY_THESIS: Record<string, string> = {
  cognitive:
    'Pattern, language, recall, and calculation. Machines are strongest here (Tier 1), so high demand does not mean hard to automate.',
  psychomotor:
    'Coordinated mind-and-body movement and dexterity. Embodied skill (Tier 2): robotics is narrow and does not hold the general case.',
  physical:
    'Strength, stamina, and whole-body coordination. Embodied capacity (Tier 2) that machines assist but rarely replicate broadly.',
  sensory:
    'Seeing, hearing, and telling signals apart. Perception (Tier 2): reliable in narrow settings, weak in the general case.',
}

export function lookupCategoryThesis(category: string | null | undefined): string | null {
  if (!category) return null
  return CATEGORY_THESIS[category.trim().toLowerCase()] ?? null
}

// Fast lookup by lowercased term name.
const BY_TERM = new Map<string, GlossaryEntry>(GLOSSARY_ENTRIES.map((e) => [e.term.toLowerCase(), e]))

export function lookupDefinition(name: string | null | undefined): string | null {
  if (!name) return null
  return BY_TERM.get(name.trim().toLowerCase())?.definition ?? null
}
