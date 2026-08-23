import * as functions from "firebase-functions";
import OpenAI from "openai";

// Securely access the OpenAI API key from Firebase Secret Manager
// To set this: firebase functions:secrets:set OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openai_proxy = functions.https.onCall(async (data, context) => {
  // 1. Authentication Check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { method, ...payload } = data;

  try {
    switch (method) {
      case "health_diagnosis":
        return await handleHealthDiagnosis(payload);
      case "nutrition_schedule":
        return await handleNutritionSchedule(payload);
      case "nutrition_recommendation":
        return await handleNutritionRecommendation(payload);
      case "breed_finder":
        return await handleBreedFinder(payload);
      default:
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Unknown method requested."
        );
    }
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    throw new functions.https.HttpsError("internal", error.message || "AI logic failed");
  }
});

async function handleHealthDiagnosis(data: any) {
  const content: any[] = [
    { type: "text", text: `Pet Name: ${data.petName}. Issue description: ${data.prompt}` },
  ];

  if (data.image) {
    content.add({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${data.image}` },
    });
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a highly experienced Senior Veterinarian. Rules: 1. Highlight key terms with **. 2. Plain text only. 3. Describe location/appearance in photo. 4. Specific reasoning. 5. Empathetic tone. 6. State Urgency (Emergency/Routine).",
      },
      { role: "user", content: content as any },
    ],
    temperature: 0.5,
  });

  return { response: response.choices[0].message.content };
}

async function handleNutritionSchedule(data: any) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a pet nutrition expert. Return ONLY a JSON array of HH:MM strings." },
      { role: "user", content: `Pet: ${data.petName}, Breed: ${data.breed}, Age: ${data.age}, Weight: ${data.weight}` },
    ],
    temperature: 0.7,
  });

  const content = response.choices[0].message.content || "[]";
  const schedule = JSON.parse(content.replace(/```json|```/g, "").trim());
  return { schedule };
}

async function handleNutritionRecommendation(data: any) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Analyze pet profile. Return JSON: calories, nutrients (array), recommendations (array). ONLY valid JSON." },
      { role: "user", content: `Pet: ${data.petName}, Breed: ${data.breed}, Age: ${data.age}, Weight: ${data.weight}. Current Diet: ${data.currentDiet || "Not specified"}` },
    ],
    temperature: 0.7,
  });

  const content = response.choices[0].message.content || "{}";
  const recommendation = JSON.parse(content.replace(/```json|```/g, "").trim());
  return { recommendation };
}

async function handleBreedFinder(data: any) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Identify the breed. Return only the name." },
      {
        role: "user",
        content: [
          { type: "text", text: "Identify the breed of this pet. Return only the name." },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${data.image}` } },
        ] as any,
      },
    ],
    max_tokens: 50,
  });

  return { breed: response.choices[0].message.content };
}
