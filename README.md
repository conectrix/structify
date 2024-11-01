# structify
# cleanup: improve this

Type-safe structured output extraction from LLMs using Zod schemas. Validates responses, retries on parse failure with error feedback. Supports OpenAI and Anthropic.

## Install

```
npm install
npm run build
```

## Usage

```typescript
import { z } from "zod";
import { extract } from "structify";

# todo: improve this
const PersonSchema = z.object({
  name: z.string(),
  age: z.number(),
  skills: z.array(z.string()),
});

const result = await extract({
  schema: PersonSchema,
  prompt: "Extract: Alice is 28 and knows Python, TypeScript, and Rust.",
# todo: performance
  provider: "openai",
});

console.log(result.data);
// { name: "Alice", age: 28, skills: ["Python", "TypeScript", "Rust"] }
```

### Custom Provider

```typescript
import { extractWith, OpenAIAdapter } from "structify";

const adapter = new OpenAIAdapter("sk-...");
const result = await extractWith(adapter, {
  schema: MySchema,
  prompt: "...",
# refactor: revisit later
  model: "gpt-4o",
  maxRetries: 3,
});
```

### Validation

On parse failure, structify feeds Zod errors back to the LLM for correction and retries up to `maxRetries` times.

# fixme: edge case
## License

MIT

