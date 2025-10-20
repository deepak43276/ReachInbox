import axios from "axios";
import { EmailDocument } from "./types";

const { LLM_URL = "", LLM_KEY = "" } = process.env;

/**
 * Categorizes an email using an external LLM (e.g., Gemini / OpenAI).
 * Ensures safety, fallbacks, and structured response handling.
 */
export async function categorizeEmail(
  body: string
): Promise<EmailDocument["aiCategory"]> {
  const prompt = `Classify this email: "${body}". 
Choose one label: Interested, Meeting Booked, Not Interested, Spam, Out of Office. 
Output only the label.`;

  try {
    const response = await axios.post(
      LLM_URL,
      {
        system_instruction: "Email categorization",
        prompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            category: {
              type: "STRING",
              enum: [
                "Interested",
                "Meeting Booked",
                "Not Interested",
                "Spam",
                "Out of Office",
              ],
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${LLM_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 8000,
      }
    );

    const category =
      response.data?.category as EmailDocument["aiCategory"] | undefined;

    return (
      category ?? ("Not Interested" as EmailDocument["aiCategory"])
    );
  } catch (err) {
    console.error("❌ LLM categorization failed:", err);
    return "Not Interested"; // safe fallback
  }
}
