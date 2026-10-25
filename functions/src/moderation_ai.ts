/**
 * AI moderation helpers for Pet Maya Community:
 * 1. OpenAI Omni-Moderation (hate, harassment, sexual, self-harm, violence)
 * 2. Pet & Animal Relevance Classifier (gpt-4o-mini)
 */
import OpenAI from "openai";
import { ModerationItem, RelevanceResult, SafetyResult } from "./moderation";

/**
 * Creates an OpenAI omni-moderation checker.
 * Checks both text and image if provided.
 */
export function createSafetyChecker(openai: OpenAI) {
  return async (item: ModerationItem): Promise<SafetyResult> => {
    const inputs: any[] = [];
    const text = item.text.trim();
    if (text) {
      inputs.push({ type: "text", text });
    }
    if (item.image?.base64) {
      inputs.push({
        type: "image_url",
        image_url: {
          url: `data:${item.image.mime};base64,${item.image.base64}`,
        },
      });
    }

    if (inputs.length === 0) {
      return { scores: {} };
    }

    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: inputs,
    });

    const scores = response.results?.[0]?.category_scores ?? {};
    return { scores: scores as unknown as Record<string, number> };
  };
}

/**
 * Creates a gpt-4o-mini relevance classifier to ensure all community posts and comments
 * are exclusively about pets, animals, veterinary care, or pet lifestyle.
 */
export function createRelevanceChecker(openai: OpenAI) {
  return async (item: ModerationItem): Promise<RelevanceResult> => {
    const text = item.text.trim();
    const promptParts: string[] = [];

    if (item.parentText) {
      promptParts.push(`Context - Parent Post Topic: "${item.parentText.slice(0, 300)}"`);
    }
    promptParts.push(`Content to evaluate: "${text || "(No text, image only)"}"`);

    const userContent: any[] = [
      {
        type: "text",
        text: promptParts.join("\n"),
      },
    ];

    if (item.image?.base64) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${item.image.mime};base64,${item.image.base64}`,
        },
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      max_tokens: 150,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are the strict community content moderator for "Pet Maya", a pet-care platform in Bangladesh.
Your task is to determine whether the user-submitted content (text and/or image) is strictly relevant to pets or animals.

Accepted topics:
- Pets (dogs, cats, birds, rabbits, fish, hamsters, turtles, reptiles, etc.)
- Stray animal rescue, fostering, and adoption in Bangladesh
- Animal health, veterinary clinics, treatments, medicine, pet nutrition, pet food, vaccination
- Lost & found pet reports, alerts, and reunification
- Pet behaviors, training, grooming, pet accessories, smart collars, and playful moments
- Expressing affection or condolences for pets
- Brief social responses to pet posts (e.g., "So cute!", "Get well soon", "Where is this clinic?")

Rejected topics (Off-topic):
- Human politics, religious arguments, news not related to animals
- Personal human selfies with NO pet or animal present
- E-commerce / selling unrelated items (phones, clothes, property, crypto)
- Spam, chain letters, random rants
- Selling prescription medicines between users

Animal Cruelty check:
- Set promotesCruelty: true if content encourages or glorifies animal abuse, animal fighting, cruelty, or illegal hunting/poaching. (Injured rescues seeking help are NOT cruelty).

Return ONLY valid JSON matching this schema:
{
  "petRelated": "yes" | "no" | "unsure",
  "promotesCruelty": boolean,
  "reason": "Short 1-sentence reason"
}`,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    });

    const raw = response.choices?.[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(raw);
      const petRelated =
        parsed.petRelated === "yes" || parsed.petRelated === "no" || parsed.petRelated === "unsure"
          ? parsed.petRelated
          : "unsure";
      return {
        petRelated,
        promotesCruelty: Boolean(parsed.promotesCruelty),
        reason: typeof parsed.reason === "string" ? parsed.reason : undefined,
      };
    } catch {
      return { petRelated: "unsure", reason: "Model output parsing error" };
    }
  };
}
