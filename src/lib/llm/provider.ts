import { z } from "zod";
import { CampaignBible } from "./schema";
import { CampaignBriefing } from "./prompt";
import { SessionPrep } from "./session-schema";
import { CampaignForSessionPrompt } from "./session-prompt";
import { SessionUpdateProposal } from "./recap-schema";
import { CampaignForRecapPrompt } from "./recap-prompt";

export type SessionDetailLevel = "standard" | "detailed";

export type SessionPrepInput = {
  playerStatus: string;
  focusPlotThreadTitles: string[];
  detailLevel: SessionDetailLevel;
};

export interface LLMProvider {
  generateCampaignBible(briefing: CampaignBriefing): Promise<CampaignBible>;
  generateSessionPrep(
    campaign: CampaignForSessionPrompt,
    input: SessionPrepInput,
  ): Promise<SessionPrep>;
  generateSessionUpdateProposal(
    campaign: CampaignForRecapPrompt,
    recap: string,
  ): Promise<SessionUpdateProposal>;
  // Generic escape hatch used for one-off structured generations (entity
  // regeneration, random tables) that don't warrant a dedicated named
  // method each.
  generateStructured<T>(
    toolName: string,
    schema: z.ZodType<T>,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<T>;
}
