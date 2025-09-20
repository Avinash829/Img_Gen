import { openRouterImageTool } from "../services/tools/openRouterImageTool.js";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY in .env");

const VALID_IMAGE_MODELS = [
    "google/gemini-2.5-flash-image-preview",
    "black-forest-labs/flux-schnell",
];

export async function runWorkflow(userPrompt, model) {
    const llm = new ChatGoogleGenerativeAI({
        apiKey: GEMINI_API_KEY,
        model: "gemini-2.0-flash",
        temperature: 0.7,
    });

    const agentExecutor = await initializeAgentExecutorWithOptions([], llm, {
        agentType: "chat-zero-shot-react-description",
        verbose: true,
    });

    const refineInstruction = `
You are an assistant that converts a user's idea into a detailed image generation prompt.
Return ONLY valid JSON with the fields:
{
  "refinedPrompt": "<detailed prompt string>",
  "negativePrompt": "<optional negative prompt string>"
}
Do not call any tools or output anything else. User idea: "${userPrompt}"
`;

    const result = await agentExecutor.invoke({ input: refineInstruction });

    const tryParseJSON = (text) => {
        if (!text) return null;
        try {
            return JSON.parse(text);
        } catch {
            const m = text.match(/\{[\s\S]*\}/);
            if (!m) return null;
            try {
                return JSON.parse(m[0]);
            } catch {
                return null;
            }
        }
    };

    const parsed = tryParseJSON(result.output);
    let refinedPrompt = parsed?.refinedPrompt || null;
    const negativePrompt = parsed?.negativePrompt || null;

    if (!refinedPrompt) {
        const raw = (result.output || "").trim();
        refinedPrompt = raw.replace(/^```json\s*|```$/g, "").replace(/^"|"$/g, "").trim();
    }

    if (!refinedPrompt) {
        throw new Error("LLM failed to return a refined prompt.");
    }

    const safeModel = VALID_IMAGE_MODELS.includes(model)
        ? model
        : process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash-image-preview";

    const imageUrl = await openRouterImageTool.func({
        prompt: refinedPrompt,
        negative_prompt: negativePrompt || undefined,
        model: safeModel,
    });

    return {
        refinedPrompt,
        image: imageUrl,
        meta: {
            agentOutput: result.output,
            modelUsed: safeModel,
        },
    };
}
