import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Row types (as returned by the DB driver). NUMERIC columns come back as
// STRINGS from the neon driver and are Number()-cast when shaping the response.
// ---------------------------------------------------------------------------
interface OccupationRow {
  soc_code: string
  soc_code_bls: string | null
  title: string
  description: string | null
  job_zone: number | null
  major_group_code: string | null
  major_group_name: string | null
}
interface TaskRow {
  task_id: string
  task_text: string
  task_type: string | null
  incumbents_responding: number | null
}
interface ElementCiRow {
  element_id: string
  element_name: string
  category: string
  data_value: string | null
  lower_ci: string | null
  upper_ci: string | null
}
interface ElementValueRow {
  element_id: string
  element_name: string
  data_value: string | null
}
interface RelatedRow {
  related_soc_code: string
  title: string
  relatedness_tier: string
  rank_index: string | null
}
interface AltTitleRow {
  alternate_title: string
}
interface BlsRow {
  year: number
  employment: number | null
  employment_index: string | null
}

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------
interface ElementCi {
  element_id: string
  element_name: string
  category: string
  data_value: number | null
  lower_ci: number | null
  upper_ci: number | null
}
interface ElementValue {
  element_id: string
  element_name: string
  data_value: number | null
}
interface RelatedOccupation {
  related_soc_code: string
  title: string
  relatedness_tier: string
  rank_index: number | null
}
interface BlsPoint {
  year: number
  employment: number | null
  employment_index: number | null
}
interface OccupationResponse {
  occupation: OccupationRow
  tasks: TaskRow[]
  abilities: ElementCi[]
  skills: ElementCi[]
  knowledge: ElementValue[]
  interests: ElementValue[]
  work_styles: ElementValue[]
  related_occupations: RelatedOccupation[]
  alternate_titles: AltTitleRow[]
  bls_employment: BlsPoint[]
}

const num = (v: string | null): number | null => (v == null ? null : Number(v))

// Extract a fulfilled allSettled value as a typed row array; [] on rejection.
function rows<T>(r: PromiseSettledResult<unknown>): T[] {
  return r.status === 'fulfilled' ? ((r.value as unknown) as T[]) : []
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ soc: string }> }
) {
  try {
    const { soc: rawSoc } = await params
    let soc = (rawSoc || '').trim()
    if (!soc.includes('.')) soc = `${soc}.00`

    // NOTE: spec mandates Promise.allSettled (not Promise.all) so one failing
    // query degrades to [] rather than 500-ing the whole modal. Documented
    // deviation from the boondoggling report. Outer try/catch still handles
    // truly unexpected failures (e.g. param resolution).
    const settled = await Promise.allSettled([
      sql`SELECT * FROM onet_occupations WHERE soc_code = ${soc}`,
      sql`
        SELECT task_id, task_text, task_type, incumbents_responding
        FROM onet_tasks WHERE soc_code = ${soc}
        ORDER BY task_type DESC, incumbents_responding DESC NULLS LAST
      `,
      sql`
        SELECT element_id, element_name, category, data_value, lower_ci, upper_ci
        FROM onet_abilities
        WHERE soc_code = ${soc} AND scale_id = 'LV' AND recommend_suppress = FALSE
        ORDER BY data_value DESC
      `,
      sql`
        SELECT element_id, element_name, category, data_value, lower_ci, upper_ci
        FROM onet_skills
        WHERE soc_code = ${soc} AND scale_id = 'LV' AND recommend_suppress = FALSE
        ORDER BY data_value DESC
      `,
      sql`
        SELECT element_id, element_name, data_value
        FROM onet_knowledge WHERE soc_code = ${soc} AND scale_id = 'IM'
        ORDER BY data_value DESC LIMIT 15
      `,
      sql`
        SELECT element_id, element_name, data_value
        FROM onet_interests WHERE soc_code = ${soc} AND scale_id = 'OI'
      `,
      sql`
        SELECT element_id, element_name, data_value
        FROM onet_work_styles WHERE soc_code = ${soc} AND scale_id = 'WI'
        ORDER BY data_value DESC LIMIT 10
      `,
      sql`
        SELECT r.related_soc_code, o.title, r.relatedness_tier, r.rank_index
        FROM onet_related_occupations r
        JOIN onet_occupations o ON o.soc_code = r.related_soc_code
        WHERE r.soc_code = ${soc}
          AND r.relatedness_tier IN ('Primary-Short', 'Primary-Long')
        ORDER BY r.rank_index LIMIT 10
      `,
      sql`
        SELECT alternate_title FROM onet_alternate_titles
        WHERE soc_code = ${soc} LIMIT 10
      `,
      sql`
        SELECT year, employment, employment_index
        FROM bls_employment
        WHERE soc_code = (SELECT soc_code_bls FROM onet_occupations WHERE soc_code = ${soc})
        ORDER BY year DESC LIMIT 3
      `,
    ])

    const occupationRows = rows<OccupationRow>(settled[0])
    if (occupationRows.length === 0) {
      return NextResponse.json({ error: 'Occupation not found' }, { status: 404 })
    }

    const taskRows = rows<TaskRow>(settled[1])
    const abilityRows = rows<ElementCiRow>(settled[2])
    const skillRows = rows<ElementCiRow>(settled[3])
    const knowledgeRows = rows<ElementValueRow>(settled[4])
    const interestRows = rows<ElementValueRow>(settled[5])
    const workStyleRows = rows<ElementValueRow>(settled[6])
    const relatedRows = rows<RelatedRow>(settled[7])
    const altTitleRows = rows<AltTitleRow>(settled[8])
    const blsRows = rows<BlsRow>(settled[9])

    const mapCi = (r: ElementCiRow): ElementCi => ({
      element_id: r.element_id,
      element_name: r.element_name,
      category: r.category,
      data_value: num(r.data_value),
      lower_ci: num(r.lower_ci),
      upper_ci: num(r.upper_ci),
    })
    const mapValue = (r: ElementValueRow): ElementValue => ({
      element_id: r.element_id,
      element_name: r.element_name,
      data_value: num(r.data_value),
    })

    const response: OccupationResponse = {
      occupation: occupationRows[0],
      tasks: taskRows,
      abilities: abilityRows.map(mapCi),
      skills: skillRows.map(mapCi),
      knowledge: knowledgeRows.map(mapValue),
      interests: interestRows.map(mapValue),
      work_styles: workStyleRows.map(mapValue),
      related_occupations: relatedRows.map((r) => ({
        related_soc_code: r.related_soc_code,
        title: r.title,
        relatedness_tier: r.relatedness_tier,
        rank_index: num(r.rank_index),
      })),
      alternate_titles: altTitleRows,
      bls_employment: blsRows.map((r) => ({
        year: r.year,
        employment: r.employment ?? null,
        employment_index: num(r.employment_index),
      })),
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[api/onet/occupation] Database error:', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
