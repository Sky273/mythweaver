import OpenAI from "openai";

export type GenerateImageOptions = {
  size?: "1024x1024" | "1024x1536" | "1536x1024";
  quality?: "low" | "medium" | "high";
};

export function translateImageGenerationError(error: unknown): Error {
  if (error instanceof OpenAI.APIError && error.status === 400) {
    const match = /safety_violations=\[(.*?)\]/.exec(error.message ?? "");
    const categories = match?.[1];
    return new Error(
      categories
        ? `OpenAI a refusé de générer cette image : le contenu du prompt a été jugé inapproprié par son système de sécurité (catégorie détectée : ${categories}). Modifie la description à l'origine de ce prompt (PNJ, faction, document…) pour retirer tout contenu explicite, violent ou à connotation sexuelle, puis réessaie.`
        : "OpenAI a refusé de générer cette image : le contenu du prompt a été jugé inapproprié par son système de sécurité. Modifie la description à l'origine de ce prompt (PNJ, faction, document…) pour retirer tout contenu explicite, puis réessaie.",
    );
  }

  return error instanceof Error ? error : new Error(String(error));
}

export async function generateCampaignImage(
  prompt: string,
  options: GenerateImageOptions = {},
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "La génération d'images nécessite une clé OpenAI (OPENAI_API_KEY), quel que soit le moteur choisi pour le texte — Anthropic ne propose pas de génération d'image.",
    );
  }

  const client = new OpenAI({ apiKey });

  let response;
  try {
    response = await client.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
      prompt,
      size: options.size ?? "1024x1024",
      quality: options.quality ?? "high",
    });
  } catch (error) {
    throw translateImageGenerationError(error);
  }

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI n'a pas retourné d'image.");
  }

  return Buffer.from(b64, "base64");
}
