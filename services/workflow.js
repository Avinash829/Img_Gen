import { createDiffusionTool } from "./tools/diffusionTool.js";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in .env");
}

export async function runWorkflow(userPrompt) {
    const llm = new ChatGoogleGenerativeAI({
        apiKey: GEMINI_API_KEY,
        model: "gemini-2.0-flash",
        temperature: 0.7,
    });

    const diffusionTool = createDiffusionTool();

    const executor = await initializeAgentExecutorWithOptions(
        [diffusionTool],
        llm,
        {
            agentType: "chat-zero-shot-react-description",
            verbose: true,
        }
    );

    const input = `
You are an AI assistant that helps generate images.
Steps:
1. Refine the user prompt into a detailed Stable Diffusion prompt with style, lighting, mood, etc.
2. Always call the tool "stable_diffusion" using an object like:
   { "prompt": "<the refined prompt>" }
   (never pass a raw string).
3. Return JSON only in this format:
{
  "refinedPrompt": "<the refined prompt you created>",
  "image": "<the base64 data:image/png string returned by the tool>"
}

User idea: "${userPrompt}"
`;


    const result = await executor.invoke({ input });

    let refinedPrompt = "No refined prompt";
    let image = null;

    try {
        const parsed = JSON.parse(result.output);
        refinedPrompt = parsed.refinedPrompt || refinedPrompt;
        image = parsed.image || null;
    } catch {
        refinedPrompt = result.output || refinedPrompt;
        image = result.intermediateSteps?.[0]?.observation || null;
    }

    return {
        refinedPrompt,
        image,
        meta: {
            steps: result.intermediateSteps?.length || 0,
            agentFinish: result,
        },
    };
}
