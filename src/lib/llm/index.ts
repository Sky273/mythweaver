import { LLMProvider } from "./provider";
import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";

export type { LLMProvider, SessionPrepInput } from "./provider";
export type { CampaignBible } from "./schema";
export type { CampaignBriefing } from "./prompt";
export type { SessionPrep } from "./session-schema";
export type { CampaignForSessionPrompt } from "./session-prompt";
export type { SessionUpdateProposal } from "./recap-schema";
export type { CampaignForRecapPrompt } from "./recap-prompt";

export function getLLMProvider(name?: string): LLMProvider {
  const provider = name ?? process.env.LLM_PROVIDER ?? "anthropic";

  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
    return new AnthropicProvider(
      apiKey,
      process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
    );
  }

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");
    return new OpenAIProvider(apiKey, process.env.OPENAI_MODEL ?? "gpt-5.6");
  }

  throw new Error(`Unknown LLM_PROVIDER: ${provider}`);
}
