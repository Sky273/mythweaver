import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { LLMProvider, SessionPrepInput } from "./provider";
import { campaignBibleSchema } from "./schema";
import {
  CAMPAIGN_BIBLE_SYSTEM_PROMPT,
  buildCampaignBibleUserPrompt,
  CampaignBriefing,
} from "./prompt";
import { sessionPrepSchema } from "./session-schema";
import {
  SESSION_PREP_SYSTEM_PROMPT,
  buildSessionPrepUserPrompt,
  CampaignForSessionPrompt,
} from "./session-prompt";
import { sessionUpdateProposalSchema } from "./recap-schema";
import {
  RECAP_ANALYSIS_SYSTEM_PROMPT,
  buildRecapAnalysisUserPrompt,
  CampaignForRecapPrompt,
} from "./recap-prompt";

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  private async generateWithTool<T>(
    toolName: string,
    schema: z.ZodType<T>,
    system: string,
    userPrompt: string,
  ): Promise<T> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 8192,
      system,
      messages: [{ role: "user", content: userPrompt }],
      tools: [
        {
          name: toolName,
          description: "Submit the structured result.",
          input_schema: z.toJSONSchema(schema, {
            target: "draft-7",
          }) as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: toolName },
    });

    const toolUse = response.content.find(
      (block) => block.type === "tool_use",
    );
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Anthropic did not return a tool_use block.");
    }

    return schema.parse(toolUse.input);
  }

  async generateCampaignBible(briefing: CampaignBriefing) {
    return this.generateWithTool(
      "generate_campaign_bible",
      campaignBibleSchema,
      CAMPAIGN_BIBLE_SYSTEM_PROMPT,
      buildCampaignBibleUserPrompt(briefing),
    );
  }

  async generateSessionPrep(
    campaign: CampaignForSessionPrompt,
    input: SessionPrepInput,
  ) {
    return this.generateWithTool(
      "generate_session_prep",
      sessionPrepSchema,
      SESSION_PREP_SYSTEM_PROMPT,
      buildSessionPrepUserPrompt(campaign, input),
    );
  }

  async generateSessionUpdateProposal(
    campaign: CampaignForRecapPrompt,
    recap: string,
  ) {
    return this.generateWithTool(
      "propose_bible_updates",
      sessionUpdateProposalSchema,
      RECAP_ANALYSIS_SYSTEM_PROMPT,
      buildRecapAnalysisUserPrompt(campaign, recap),
    );
  }

  async generateStructured<T>(
    toolName: string,
    schema: z.ZodType<T>,
    systemPrompt: string,
    userPrompt: string,
  ) {
    return this.generateWithTool(toolName, schema, systemPrompt, userPrompt);
  }
}
