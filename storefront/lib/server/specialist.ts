/**
 * Runs one AI-team specialist on the server:
 *   1. specialist answers (role + playbook + example + store data + memory, strict JSON)
 *   2. rule checks (lib/ai/checks.ts)
 *   3. an AI editor reviews it against the playbook ("second pass")
 *   4. if the editor finds problems, the specialist revises once, and the rules run again
 */
import "server-only";
import { callModel, type Msg, type Part } from "./llm";
import { readMedia } from "./media";
import { check, type Issue } from "../ai/checks";
import { fallback } from "../ai/fallbacks";
import { playbook } from "../ai/playbook";
import { SPECIALISTS, systemPrompt, type Context, type Input, type SpecialistId } from "../ai/specialists";

export type SupportOrder = { number: number; status: string; createdAt: string; items: string[]; firstName: string; totalCents: number } | null;

export type RunResult = {
  output: unknown;
  issues: Issue[];
  review: { ran: boolean; passed: boolean; problems: string[]; revised: boolean };
  calls: number;
};

const REVIEW_SCHEMA = {
  type: "object",
  properties: { pass: { type: "boolean" }, problems: { type: "array", items: { type: "string" } } },
  required: ["pass", "problems"],
  additionalProperties: false,
};

function taskText(id: SpecialistId, input: Input, ctx: Context, order: SupportOrder) {
  if (id !== "support") return SPECIALISTS[id].task(input, ctx);
  return `Draft a reply to this customer message:\n"""${(input.message ?? "").slice(0, 3000)}"""\n${order ? `Their order (from the store's records): ${JSON.stringify(order)}` : "No matching order was found in the store's records."}\nStore: ${ctx.store.name}.`;
}

export async function runSpecialist(model: string, id: SpecialistId, input: Input, ctx: Context, opts: { photo?: string; order?: SupportOrder; review: boolean }): Promise<RunResult> {
  const sp = SPECIALISTS[id];
  const system = systemPrompt(sp, ctx);
  const parts: Part[] = [];
  if (opts.photo) {
    const m = await readMedia(opts.photo);
    if (m) parts.push({ type: "image", mediaType: m.type as "image/webp", data: m.buf.toString("base64") });
  }
  parts.push({ type: "text", text: taskText(id, input, ctx, opts.order ?? null) });
  const first: Msg = { role: "user", content: parts };

  // test double: the free-rules answer, with a planted problem in product copy so the review loop is exercised
  let fakeRound = 0;
  const fakeAnswer = () => {
    const base = fallback(id, input, ctx);
    if (id === "product_copy" && fakeRound++ === 0) return { ...base, description: `Our best-selling ${base.title}. ${base.description}` };
    return base;
  };

  let calls = 1;
  let raw = await callModel(model, system, [first], sp.schema, { effort: "medium", fake: fakeAnswer });
  let checked = check(id, raw, ctx);
  const review = { ran: false, passed: true, problems: [] as string[], revised: false };

  if (opts.review) {
    review.ran = true;
    calls++;
    const editor = `You are a strict senior editor for an e-commerce brand. Check a colleague's work against the house rules and the store's facts.
Fail it if it breaks any HONESTY rule, states facts not present in the data/photo, ignores the store's lessons, or misses the brief.
List each problem as one short, specific sentence. Pass it if it's ready to use.\n\nHOUSE RULES:\n${playbook(sp.sections)}\n\nSTORE LESSONS:\n${ctx.lessons.map((l) => `- ${l.text}`).join("\n") || "(none)"}`;
    const verdict = await callModel<{ pass: boolean; problems: string[] }>(
      model,
      editor,
      [{ role: "user", content: [{ type: "text", text: `THE BRIEF:\n${taskText(id, input, ctx, opts.order ?? null)}\n\nTHE WORK (JSON):\n${JSON.stringify(checked.output)}\n\nRule-check notes: ${checked.issues.map((i) => i.text).join(" | ") || "none"}` }] }],
      REVIEW_SCHEMA,
      {
        effort: "low",
        fake: () => {
          const text = JSON.stringify(checked.output);
          return /best-selling/i.test(text) ? { pass: false, problems: ['Says "best-selling" without sales evidence.'] } : { pass: true, problems: [] };
        },
      },
    );
    review.passed = verdict.pass;
    review.problems = (verdict.problems ?? []).slice(0, 8).map((p) => String(p).slice(0, 300));
    if (!verdict.pass && review.problems.length) {
      calls++;
      const fix: Msg[] = [
        first,
        { role: "assistant", content: JSON.stringify(checked.output) },
        { role: "user", content: `An editor found these problems:\n${review.problems.map((p) => `- ${p}`).join("\n")}\nReturn a corrected version in the same JSON format. Keep everything that was fine.` },
      ];
      raw = await callModel(model, system, fix, sp.schema, { effort: "medium", fake: fakeAnswer });
      checked = check(id, raw, ctx);
      review.revised = true;
    }
  }
  return { output: checked.output, issues: checked.issues, review, calls };
}
