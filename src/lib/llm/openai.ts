import OpenAI from "openai";
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

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  private async generateWithSchema<T>(
    schemaName: string,
    schema: z.ZodType<T>,
    system: string,
    userPrompt: string,
  ): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      // Priority processing — OpenAI's fast serving tier — for lower latency,
      // keeping generations well under Vercel's function timeout (billed at a
      // per-token premium). Reasoning effort is left at the model default.
      service_tier: "priority",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: schemaName,
          strict: true,
          schema: z.toJSONSchema(schema, { target: "draft-7" }),
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI did not return message content.");
    }

    return schema.parse(JSON.parse(content));
  }

  async generateCampaignBible(briefing: CampaignBriefing) {
    return this.generateWithSchema(
      "campaign_bible",
      campaignBibleSchema,
      CAMPAIGN_BIBLE_SYSTEM_PROMPT,
      buildCampaignBibleUserPrompt(briefing),
    );
  }

  async generateSessionPrep(
    campaign: CampaignForSessionPrompt,
    input: SessionPrepInput,
  ) {
    return this.generateWithSchema(
      "session_prep",
      sessionPrepSchema,
      SESSION_PREP_SYSTEM_PROMPT,
      buildSessionPrepUserPrompt(campaign, input),
    );
  }

  async generateSessionUpdateProposal(
    campaign: CampaignForRecapPrompt,
    recap: string,
  ) {
    return this.generateWithSchema(
      "session_update_proposal",
      sessionUpdateProposalSchema,
      RECAP_ANALYSIS_SYSTEM_PROMPT,
      buildRecapAnalysisUserPrompt(campaign, recap),
    );
  }

  async generateStructured<T>(
    schemaName: string,
    schema: z.ZodType<T>,
    systemPrompt: string,
    userPrompt: string,
  ) {
    return this.generateWithSchema(schemaName, schema, systemPrompt, userPrompt);
  }
}
