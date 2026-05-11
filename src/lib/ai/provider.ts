import OpenAI from "openai";
import { mockFollowup } from "@/lib/ai/followup";
import { env } from "@/lib/env";
import type { Attendee, Meeting } from "@/types";

export type FollowupInput = {
  meeting: Meeting;
  sender: Attendee;
  recipient: Attendee;
};

export interface AiProvider {
  generateFollowup(input: FollowupInput): Promise<string>;
}

class OpenAiProvider implements AiProvider {
  private client: OpenAI | null = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

  async generateFollowup({ meeting, sender, recipient }: FollowupInput) {
    if (!this.client) return mockFollowup({ meeting, sender, recipient });

    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Write concise, warm professional follow-ups. Keep under 120 words and include a concrete next step."
        },
        {
          role: "user",
          content: JSON.stringify({ meeting, sender, recipient })
        }
      ]
    });

    return response.choices[0]?.message.content ?? mockFollowup({ meeting, sender, recipient });
  }
}

export const aiProvider: AiProvider = new OpenAiProvider();
