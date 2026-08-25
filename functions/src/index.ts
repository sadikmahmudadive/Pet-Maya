import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import OpenAI from "openai";

admin.initializeApp();

export const openai_proxy = onCall({ secrets: ["OPENAI_API_KEY"] }, async (request) => {
  // 1. Authentication Check & Logging
  if (!request.auth) {
    console.warn("openai_proxy called without active authentication context. Proceeding anyway for debugging...");
  } else {
    console.log(`openai_proxy called by user: ${request.auth.uid}`);
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const { method, ...payload } = request.data;

  try {
    switch (method) {
      case "health_diagnosis":
        return await handleHealthDiagnosis(openai, payload);
      case "nutrition_schedule":
        return await handleNutritionSchedule(openai, payload);
      case "nutrition_recommendation":
        return await handleNutritionRecommendation(openai, payload);
      case "breed_finder":
        return await handleBreedFinder(openai, payload);
      default:
        throw new HttpsError(
          "invalid-argument",
          "Unknown method requested."
        );
    }
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    throw new HttpsError("internal", error.message || "AI logic failed");
  }
});

export const send_broadcast = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Auth required");
  }

  // Verify admin role
  const userDoc = await admin.firestore().collection("users").doc(request.auth.uid).get();
  if (userDoc.data()?.role !== "Admin") {
    throw new HttpsError("permission-denied", "Admin only");
  }

  const { title, message, targetGroup } = request.data;

  let topic = "everyone";
  if (targetGroup === "All Pet Owners") topic = "pet_owners";
  else if (targetGroup === "All Veterinarians") topic = "vets";
  else if (targetGroup === "All Shop Merchants") topic = "merchants";

  const payload = {
    data: {
      title: title,
      body: message,
      category: "system",
      click_action: "FLUTTER_NOTIFICATION_CLICK",
    },
    topic: topic,
  };

  try {
    await admin.messaging().send(payload);
    return { success: true };
  } catch (error: any) {
    console.error("FCM Error:", error);
    throw new HttpsError("internal", error.message || "FCM failed");
  }
});

async function handleHealthDiagnosis(openai: OpenAI, data: any) {
  const content: any[] = [
    { type: "text", text: `Pet Name: ${data.petName}. Issue description: ${data.prompt}` },
  ];

  if (data.image) {
    content.push({
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

async function handleNutritionSchedule(openai: OpenAI, data: any) {
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

async function handleNutritionRecommendation(openai: OpenAI, data: any) {
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

async function handleBreedFinder(openai: OpenAI, data: any) {
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
