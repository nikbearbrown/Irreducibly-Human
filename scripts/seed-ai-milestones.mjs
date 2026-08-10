/**
 * seed-ai-milestones.mjs
 * Idempotent seed of ai_milestones via guarded insert keyed on `label`
 * (the table only has PRIMARY KEY (id) with an auto-generated id, so a row is
 * inserted only if its label is not already present). No truncate/delete.
 * Values are exactly as provided.
 */
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const SEED_SQL = `
INSERT INTO ai_milestones (year, month, label, description, display_on_chart)
SELECT v.year, v.month, v.label, v.description, v.display_on_chart
FROM (VALUES
  (2012, 5,    'BLS baseline',             'Employment index baseline period. Chart starts here.',                                                                          TRUE),
  (2017, 6,    'Transformer architecture', 'Google publishes "Attention Is All You Need." The architecture underlying all modern large language models.',                  TRUE),
  (2018, 5,    'Index baseline',           'Employment index anchored to 2018 = 100 for all occupations.',                                                                 TRUE),
  (2020, 6,    'GPT-3',                    'OpenAI releases GPT-3. First large language model capable of coherent long-form text generation.',                              TRUE),
  (2021, 6,    'GitHub Copilot beta',      'AI code completion tool released to beta users. First widely used AI tool targeting programmers directly.',                    TRUE),
  (2022, 11,   'ChatGPT launches',         'OpenAI releases ChatGPT. 100 million users in two months. The inflection point visible in the employment lines.',               TRUE),
  (2023, 3,    'GPT-4',                    'OpenAI releases GPT-4. Multimodal, significantly stronger coding capability than GPT-3.5.',                                    TRUE),
  (2023, 7,    'Code Llama',               'Meta releases Code Llama. Open source code generation model. AI coding tools become widely accessible.',                       TRUE),
  (2024, 3,    'Claude 3',                 'Anthropic releases Claude 3 family. Opus model matches or exceeds GPT-4 on coding benchmarks.',                                TRUE),
  (2024, 5,    'GPT-4o',                   'OpenAI releases GPT-4o. Multimodal, faster, free tier. AI coding tools reach mainstream accessibility.',                       TRUE),
  (2024, 11,   'Claude 3.5',               'Anthropic releases Claude 3.5 Sonnet. Sets new benchmark on software engineering tasks.',                                      TRUE),
  (2025, NULL, 'Agentic coding',           'AI coding agents begin handling complete feature development autonomously.',                                                    TRUE)
) AS v(year, month, label, description, display_on_chart)
WHERE NOT EXISTS (SELECT 1 FROM ai_milestones m WHERE m.label = v.label)
RETURNING id, label
`;

const inserted = await sql.query(SEED_SQL);
console.log(`Inserted ${inserted.length} new milestone(s) (existing labels skipped).`);
for (const r of inserted) console.log(`  +${r.id} ${r.label}`);
