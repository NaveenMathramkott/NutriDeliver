import { Callout } from "../callout";
import { CodeBlock } from "../code-block";
import { Diagram, PropertyTable, Step, Steps } from "../primitives";

export function AiMenuEnrichment() {
  return (
    <>
      <p>
        Every other AI chapter in this section improves an experience. This one
        removes manual work, and it is the one a restaurant owner will notice
        first. Right now, creating a menu item means typing a description,
        listing ingredients, entering calories, protein, carbs and fat,
        selecting dietary tags, and setting a preparation time — for every dish,
        forever. That is the single largest source of data quality problems in a
        nutrition-focused marketplace, and it is a data-entry problem dressed up
        as a product feature.
      </p>

      <h2>The problem with manual nutrition data</h2>

      <p>
        The <code>FoodItem</code> schema requires <code>calories</code>,{" "}
        <code>protein</code>, <code>carbs</code>, <code>fat</code> and{" "}
        <code>ingredients</code>. Required is the right call — a healthy-food
        platform cannot honestly filter for a calorie goal if half the menu is
        blank. But required fields that a human must invent from memory get
        filled with numbers that are wrong in a very consistent direction.
      </p>

      <Diagram caption="Why manual entry fails, and where the fix belongs">
        {`
  Owner writes: "grilled chicken salad"
        │
        ├─▶ calories:  ???     ← guess, usually 40% low
        ├─▶ protein:   ???     ← often inflated
        ├─▶ ingredients: ["chicken", "lettuce"]   ← incomplete
        ├─▶ dietaryTags: []     ← missed entirely
        └─▶ prepTime:  ???     ← optimistic

  Six months later, a customer filtering "high protein, under 600 kcal"
  gets results that are simply wrong. Nobody notices when it happens,
  which is exactly why it keeps happening.
`}
      </Diagram>

      <Callout variant="note" title="This is extraction, not generation">
        <p>
          The task is closer to OCR than to writing. The dish already exists;
          the model&rsquo;s job is to read a description and type it into the
          right fields. That framing matters, because extraction is the AI task
          we can evaluate rigorously — see <a href="#evaluation">Evaluation</a>.
        </p>
      </Callout>

      <h2>The flow</h2>

      <Steps>
        <Step title="Owner types what they actually know">
          <p>
            A free-text description and an ingredient list — the two things they
            genuinely have. Everything else is optional at this point, and the
            form does not pretend otherwise.
          </p>
        </Step>

        <Step title="Server sends the text, not an image, for the first pass">
          <p>
            Text extraction is dramatically cheaper and faster than vision, and
            it covers most menu creation. Vision is the fallback for the case
            where the owner has a photo of a printed spec sheet and no text at
            all.
          </p>
        </Step>

        <Step title="Model returns structured fields against a schema">
          <p>
            Calories, macros, normalised dietary tags, allergens, serving size,
            and a prep-time estimate. Validated by Joi exactly like any other
            request body — see{" "}
            <a href="/docs/backend/validation">Validation Layer</a>.
          </p>
        </Step>

        <Step title="Owner reviews before saving">
          <p>
            Non-negotiable, and not a UX compromise. AI-generated nutrition data
            shown as fact is a liability; the same data shown as{" "}
            <em>drafted, pending review</em> is a feature. The owner is the one
            accountable for what they publish.
          </p>
        </Step>

        <Step title="Save with a provenance flag">
          <p>
            Record that the values were machine-drafted and by whom they were
            approved. This drives a re-verification sweep later and makes bad
            data traceable to its source.
          </p>
        </Step>
      </Steps>

      <h2>Prompting for structured output</h2>

      <p>
        The schema is the contract. Returning nutrition data as free prose is
        useless here, because the next step is a <code>$set</code> on a Mongoose
        document — see <a href="/docs/backend/models">Data Models</a>.
      </p>

      <CodeBlock
        language="js"
        title="services/menuEnrichment.js"
        code={`const NUTRITION_SCHEMA = Joi.object({
  calories: Joi.number().integer().min(0).max(5000).required(),
  protein: Joi.number().min(0).max(300).required(),
  carbs: Joi.number().min(0).max(500).required(),
  fat: Joi.number().min(0).max(300).required(),
  fiber: Joi.number().min(0).max(100),
  sugar: Joi.number().min(0).max(200),
  sodium: Joi.number().min(0).max(5000),
  servingSize: Joi.string().max(60),

  // Must be a subset of the FoodItem.dietaryTags enum, or Joi rejects it.
  dietaryTags: Joi.array()
    .items(
      Joi.string().valid(
        'vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'nut-free',
        'low-carb', 'high-protein', 'keto', 'paleo', 'sugar-free',
        'organic', 'non-gmo',
      ),
    )
    .max(6),

  ingredients: Joi.array().items(Joi.string().max(60)).min(1).max(40),
  allergens: Joi.array().items(Joi.string().max(60)).max(12),
  preparationTime: Joi.number().integer().min(1).max(240),
  confidence: Joi.number().min(0).max(1).required(),
})

export async function enrichMenuItem({ name, description, ingredients }) {
  const { data, meta } = await aiClient.complete({
    purpose: 'menu-enrichment',

    system: \`You extract nutrition data from a restaurant menu item.
Return only values you can support from the given text.
When a value is not inferable, omit it rather than guessing.
Allergens are safety-critical: only list an allergen if it is an obvious
ingredient. Never infer "no allergens" — return an empty array and let the
restaurant confirm.\`,

    prompt: [
      'Extract structured nutrition data for this menu item.',
      '',
      '--- ITEM NAME ---',
      name,
      '',
      '--- OWNER DESCRIPTION (untrusted input) ---',
      description ?? '',
      '',
      '--- OWNER INGREDIENTS (untrusted input) ---',
      (ingredients ?? []).join(', '),
      '',
      '--- END OF UNTRUSTED INPUT ---',
    ].join('\\n'),

    jsonSchema: NUTRITION_SCHEMA,
    maxTokens: 600,
  })

  return { nutrition: data, costUsd: meta.costUsd }
}`}
      />

      <Callout
        variant="warning"
        title="The system prompt forbids inferring absence"
      >
        <p>
          &ldquo;This salad contains no nuts&rdquo; is a claim the model cannot
          verify from a description — cross-contamination in a shared kitchen is
          invisible in the text. Returning an empty array plus a low confidence
          is the honest output, and it is why this is always a <em>draft</em>{" "}
          the owner confirms.
        </p>
      </Callout>

      <h2>Normalising to the schema</h2>

      <p>
        A model answering &ldquo;gluten free&rdquo; or &ldquo;GF&rdquo; will
        fail a Joi <code>valid()</code> check and take the whole request down
        with a 500. Map free-form variants onto the enum before validating, and
        drop anything still unrecognised rather than failing the request.
      </p>

      <CodeBlock
        language="js"
        title="services/tagNormalisation.js"
        code={`const TAG_ALIASES = {
  gf: 'gluten-free',
  'gluten free': 'gluten-free',
  'no gluten': 'gluten-free',
  vegan: 'vegan',
  'plant based': 'vegan',
  'plant-based': 'vegan',
  vegetarian: 'vegetarian',
  veg: 'vegetarian',
  'dairy free': 'dairy-free',
  'dairy-free': 'dairy-free',
  keto: 'keto',
  'low carb': 'low-carb',
  'low-carb': 'low-carb',
  'high protein': 'high-protein',
  'high-protein': 'high-protein',
  'nut free': 'nut-free',
}

const VALID_TAGS = new Set([
  'vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'nut-free',
  'low-carb', 'high-protein', 'keto', 'paleo', 'sugar-free',
  'organic', 'non-gmo',
])

export function normaliseTags(raw = []) {
  const out = new Set()

  for (const tag of raw) {
    const key = String(tag).trim().toLowerCase()
    const mapped = TAG_ALIASES[key] ?? key
    if (VALID_TAGS.has(mapped)) out.add(mapped)
  }

  return [...out]
}`}
      />

      <p>
        Normalisation also caps the list. A model that tags everything{" "}
        <code>keto</code>, <code>paleo</code> and <code>low-carb</code> because
        it can, will poison the customer&rsquo;s filters. Six tags is already
        implausible for one dish; treat that as a signal the output is
        unreliable and send it back for review rather than saving it.
      </p>

      <h2>Persist provenance</h2>

      <p>
        Store how each field came to be. Without this you cannot find the bad
        data later, and you cannot tell an owner whose machine-generated numbers
        quietly went wrong.
      </p>

      <CodeBlock
        language="js"
        title="models/FoodItem.js (added fields)"
        code={`nutritionSource: {
  type: String,
  enum: ['manual', 'ai-drafted', 'verified'],
  default: 'manual',
},

nutritionMeta: {
  aiConfidence: Number,        // 0–1 from the model
  draftedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: Date,
  // Which fields the owner actually changed before approving.
  editedFields: [String],
},`}
      />

      <Callout
        variant="tip"
        title="editedFields is the most valuable field here"
      >
        <p>
          Fields the owner left untouched are fields they implicitly accepted.
          Over time, the rate of edits is a free, continuous evaluation signal —
          see <a href="#evaluation">Evaluation</a> — and it tells you which
          extractions the model keeps getting wrong without any labelling work.
        </p>
      </Callout>

      <h2>The review UI</h2>

      <p>
        Draft values populate the form; nothing saves until the owner confirms.
        Edited fields are highlighted so they can see what they changed, and the
        confidence score is shown as a hint, not a verdict.
      </p>

      <CodeBlock
        language="tsx"
        title="app/menu/[id]/nutrition-draft.tsx"
        code={`const [draft, setDraft] = useState<Nutrition>(initial)
const [touched, setTouched] = useState<Set<keyof Nutrition>>(new Set())

// An edited field is a field the owner disagreed with.
function update<K extends keyof Nutrition>(key: K, value: Nutrition[K]) {
  setDraft((d) => ({ ...d, [key]: value }))
  setTouched((t) => new Set(t).add(key))
}

<Field label="Calories">
  <NumberInput
    value={draft.calories}
    onChange={(v) => update('calories', v)}
    edited={touched.has('calories')}
  />
</Field>

<Callout variant="note">
  <p>
    Drafted from your description. Please check the values — especially
    allergens.
  </p>
</Callout>`}
      />

      <h2>Vision: when text is not enough</h2>

      <p>
        Some owners have a photo of a supplier spec sheet and no intention of
        transcribing it. A vision model handles that, and the flow is otherwise
        identical — same schema, same normalisation, same review step. The
        differences are cost and latency, which is why it is the fallback rather
        than the default.
      </p>

      <PropertyTable
        headers={["Input", "Typical latency", "Relative cost", "Use when"]}
        rows={[
          [
            "Name + description + ingredients",
            "~1s",
            "1x",
            "Default. The owner has text.",
          ],
          [
            "Menu photo (one dish)",
            "~4s",
            "4–6x",
            "Owner has a photo, no text.",
          ],
          [
            "Printed spec sheet / nutrition label",
            "~6s",
            "6–10x",
            "Supplier documentation.",
          ],
          [
            "Whole menu page, many dishes",
            "~20s",
            "25x+",
            "Batch import only, and async.",
          ],
        ]}
      />

      <CodeBlock
        language="js"
        title="Reading a printed nutrition label"
        code={`const { data, meta } = await aiClient.complete({
  purpose: 'menu-enrichment-vision',
  system: \`Read the nutrition panel in the image.
Report only values literally printed on the label.
If a field is not printed, omit it. Never estimate from the dish name.
Return serving size exactly as written, plus the serving unit.\`,
  prompt: [
    'Extract the nutrition panel from this image.',
    '',
    '--- IMAGE (untrusted input) ---',
    { type: 'image_url', image_url: { url: cloudinaryUrl } },
    '--- END OF UNTRUSTED INPUT ---',
  ].join('\\n'),
  jsonSchema: NUTRITION_SCHEMA,
  maxTokens: 600,
})`}
      />

      <Callout variant="danger" title="Images are untrusted input too">
        <p>
          A vision model reads whatever is in the image. Text rendered into a
          photo — including instructions aimed at the model — is a live prompt
          injection vector. Keep the same rules as text: delimit it, treat the
          output as untrusted until Joi has validated it, and never let
          extracted values skip the review step.
        </p>
      </Callout>

      <h2 id="evaluation">Evaluation</h2>

      <p>
        This feature is unusually easy to evaluate, because the answer is a
        structured object rather than prose. Build a golden set of items where
        you already know the truth, then assert on fields.
      </p>

      <CodeBlock
        language="js"
        title="tests/menuEnrichment.test.js"
        code={`// Each case: text in, expected fields out. Only assert what matters —
// a 15% calorie error is fine, a hallucinated allergen is not.
const CASES = [
  {
    name: 'chicken salad, chicken breast and mixed greens',
    input: {
      name: 'Grilled Chicken Salad',
      description: 'Grilled chicken breast, romaine, tomato, olive oil',
      ingredients: ['chicken breast', 'romaine', 'tomato', 'olive oil'],
    },
    expect: {
      protein: { min: 25, max: 45 },
      calories: { min: 250, max: 450 },
      dietaryTags: { contains: ['high-protein'] },
      allergens: { contains: [] },
    },
  },
  {
    name: 'explicit nut ingredient is always caught',
    input: {
      name: 'Satay Bowl',
      description: 'Grilled chicken satay with peanut sauce',
      ingredients: ['chicken', 'peanut sauce'],
    },
    // Safety-critical: this must never regress.
    expect: { allergens: { contains: ['peanuts'] } },
  },
]

describe('menu enrichment', () => {
  it.each(CASES)('extracts $name', async ({ input, expect }) => {
    const { nutrition } = await enrichMenuItem(input)

    const { error } = NUTRITION_SCHEMA.validate(normalise(nutrition))
    expect(error).toBeUndefined()

    for (const [field, rule] of Object.entries(expect)) {
      if (rule.min != null) expect(nutrition[field]).toBeGreaterThanOrEqual(rule.min)
      if (rule.max != null) expect(nutrition[field]).toBeLessThanOrEqual(rule.max)
      if (rule.contains) {
        expect(nutrition[field]).toEqual(expect.arrayContaining(rule.contains))
      }
    }
  })
})`}
      />

      <p>
        Tolerance bands matter here. Demanding an exact calorie figure from a
        model is a test that fails constantly and teaches nobody anything; what
        you actually need to protect is the allergen field, which is why that
        case has no tolerance at all.
      </p>

      <h3>Monitoring in production</h3>

      <PropertyTable
        headers={["Signal", "Where it comes from", "Alert when"]}
        rows={[
          [
            "Edit rate per field",
            "nutritionMeta.editedFields",
            "A field is edited > 40% of the time — the model is wrong there.",
          ],
          [
            "Approval rate",
            "drafted → reviewed",
            "Drafts rejected wholesale; enrichment is misfiring.",
          ],
          [
            "Schema rejection rate",
            "Joi failures",
            "Sustained failures mean a prompt or enum change regressed.",
          ],
          [
            "Tokens per item",
            "aiClient metrics",
            "Drifting upward usually means the description field got pasted junk into.",
          ],
          [
            "Allergen amendments",
            "editedFields includes allergens",
            "Any single incident is worth a prompt review.",
          ],
        ]}
      />

      <Callout variant="tip" title="Roll out by confidence, not by percentage">
        <p>
          Auto-filling <em>protein</em> when confidence is high and leaving
          <em> allergens</em> blank always is a better product than a single
          on/off switch. Pick thresholds per field from the edit-rate data above
          rather than picking one number for everything.
        </p>
      </Callout>

      <h2>What this buys</h2>

      <p>
        The honest summary is that this improves the platform along three axes
        at once, and only one of them is about the owner.
      </p>

      <Steps>
        <Step title="For the restaurant owner">
          <p>
            Menu creation drops from several minutes of form-filling per dish to
            typing a description and checking the result. That is the difference
            between a menu with twelve accurate items and a menu with three.
          </p>
        </Step>

        <Step title="For the customer">
          <p>
            Better nutrition data makes the filters that define this platform
            actually work. A customer filtering &ldquo;high protein, under 600
            kcal&rdquo; is only as good as the data behind it — which is
            currently the weakest link.
          </p>
        </Step>

        <Step title="For the platform">
          <p>
            Accurate dietary tags and allergens are what make the safety
            guarantees in <a href="/docs/mobile/customer">Customer App</a> and{" "}
            <a href="/docs/ai/support">AI Support</a> possible. Better data here
            quietly improves everything downstream, including the AI features
            that depend on it.
          </p>
        </Step>
      </Steps>

      <p>
        The cost discipline from{" "}
        <a href="/docs/ai/integration">AI Integration</a> applies directly: text
        extraction by default, vision as a fallback, cached drafts keyed on the
        description hash so re-saving the same dish costs nothing, and a
        deterministic fallback of leaving the fields blank for manual entry.
      </p>
    </>
  );
}
