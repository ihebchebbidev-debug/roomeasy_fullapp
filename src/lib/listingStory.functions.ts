import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { composeListingStory, type ListingStory, type StoryFacts } from "@/lib/listingStory";

/**
 * Writes the guest-facing wording of a listing from everything the host
 * already filled in (plus the cover photo, when there is one).
 *
 * The model only rephrases the facts it is given — it is told never to invent
 * a feature. If the gateway is unavailable, the deterministic composer takes
 * over so the host always gets usable wording.
 */

const factsSchema = z.object({
  title: z.string().trim().max(160),
  category: z.string().trim().max(60),
  city: z.string().trim().max(80),
  country: z.string().trim().max(80),
  neighbourhood: z.string().trim().max(120),
  guests: z.number().int().min(1).max(64),
  rooms: z.number().int().min(1).max(40),
  beds: z.number().int().min(1).max(64),
  baths: z.number().int().min(1).max(40),
  area: z.number().int().min(1).max(5000),
  amenities: z.array(z.string().max(60)).max(40),
  equipment: z.array(z.string().max(60)).max(60),
  nightly: z.string().trim().max(40),
  minNights: z.number().int().min(1).max(365),
  checkIn: z.string().trim().max(10),
  checkOut: z.string().trim().max(10),
  instantBook: z.boolean(),
  cancellation: z.string().trim().max(200),
  houseRules: z.string().trim().max(2000),
  photoCount: z.number().int().min(0).max(20),
  locale: z.string().trim().max(5),
  notes: z.string().trim().max(600),
  coverPhoto: z.string().max(4_000_000).optional(),
});

const storySchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "description", "highlights"],
  properties: {
    summary: { type: "string" },
    description: { type: "string" },
    highlights: { type: "array", items: { type: "string" } },
  },
} as const;

export const generateListingStory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => factsSchema.parse(input))
  .handler(async ({ data }): Promise<{ story: ListingStory; source: "model" | "template"; note?: string }> => {
    const { coverPhoto, ...rest } = data;
    const facts = rest as StoryFacts;
    const fallback = composeListingStory(facts);

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { story: fallback, source: "template" };

    const content: Array<Record<string, unknown>> = [{ type: "input_text", text: buildPrompt(facts) }];
    if (coverPhoto && /^(data:image\/|https:\/\/)/.test(coverPhoto)) {
      content.push({ type: "input_image", image_url: coverPhoto });
    }

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
          "X-Lovable-AIG-SDK": "fetch",
        },
        body: JSON.stringify({
          model: "openai/gpt-6-astra",
          stream: true,
          store: false,
          reasoning: { effort: "low", summary: "auto" },
          include: ["reasoning.encrypted_content"],
          input: [{ role: "user", content }],
          text: {
            format: { type: "json_schema", name: "listing_story", strict: true, schema: storySchema },
          },
        }),
      });

      if (!response.ok || !response.body) {
        return { story: fallback, source: "template", note: `gateway_${response.status}` };
      }

      const text = await readOutputText(response.body);
      const parsed = JSON.parse(text) as Partial<ListingStory>;
      const story: ListingStory = {
        summary: (parsed.summary ?? fallback.summary).trim().slice(0, 300),
        description: (parsed.description ?? fallback.description).trim().slice(0, 4000),
        highlights: (Array.isArray(parsed.highlights) ? parsed.highlights : fallback.highlights)
          .map((item) => String(item).trim())
          .filter(Boolean)
          .slice(0, 8),
      };
      if (story.summary.length < 20 || story.description.length < 60) {
        return { story: fallback, source: "template", note: "short_output" };
      }
      return { story, source: "model" };
    } catch {
      return { story: fallback, source: "template", note: "unreachable" };
    }
  });

/** Reads the SSE body and joins every output-text delta. */
async function readOutputText(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let output = "";
  let done = false;
  while (!done) {
    const chunk = await reader.read();
    done = chunk.done;
    if (chunk.value) buffer += decoder.decode(chunk.value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as { type?: string; delta?: string; response?: { output_text?: string } };
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") output += event.delta;
        if (event.type === "response.completed" && !output && event.response?.output_text) {
          output = event.response.output_text;
        }
      } catch {
        // partial frame, ignore
      }
    }
  }
  return output.trim();
}

function buildPrompt(facts: StoryFacts) {
  const language = { fr: "French", es: "Spanish", de: "German", pt: "Portuguese" }[facts.locale] ?? "English";
  return [
    `You write vacation-rental listing copy for a booking site. Write in ${language}.`,
    "Use ONLY the facts below. Never invent a feature, a view, a distance, a rating or a neighbourhood detail that is not listed. No superlatives that imply awards or guest counts.",
    "Return JSON with: summary (one warm sentence, 120-280 characters), description (3 to 5 short paragraphs separated by blank lines, max 1800 characters, covering the space, the sleeping arrangement, the amenities, and the practical rules), highlights (4 to 6 very short amenity highlight phrases, max 40 characters each, no sentences).",
    "",
    `Title: ${facts.title}`,
    `Property type: ${facts.category}`,
    `Location: ${[facts.neighbourhood, facts.city, facts.country].filter(Boolean).join(", ")}`,
    `Capacity: ${facts.guests} guests, ${facts.rooms} bedrooms, ${facts.beds} beds, ${facts.baths} bathrooms, ${facts.area} m²`,
    `Amenities: ${facts.amenities.join(", ") || "none listed"}`,
    `Equipment: ${facts.equipment.join(", ") || "none listed"}`,
    `Price: ${facts.nightly} per night, minimum ${facts.minNights} night(s)`,
    `Check-in ${facts.checkIn}, check-out ${facts.checkOut}, instant booking ${facts.instantBook ? "on" : "off"}`,
    `Cancellation policy: ${facts.cancellation}`,
    `House rules: ${facts.houseRules || "none given"}`,
    `Photos uploaded: ${facts.photoCount}`,
    facts.notes ? `Host notes to work in: ${facts.notes}` : "",
    "The attached image, if any, is the cover photo: you may describe only what is clearly visible in it.",
  ]
    .filter(Boolean)
    .join("\n");
}
