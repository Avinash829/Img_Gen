import { DynamicStructuredTool } from "@langchain/core/tools";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const HF_API_KEY = process.env.HF_API_KEY;
const HF_MODEL = process.env.HF_MODEL || "runwayml/stable-diffusion-v1-5";


export function createDiffusionTool() {
    return new DynamicStructuredTool({
        name: "stable_diffusion",
        description: "Generate an image from a detailed prompt using Hugging Face Stable Diffusion",
        schema: {
            type: ["string", "object"],
            properties: {
                prompt: { type: "string" },
                width: { type: "number", default: 512 },
                height: { type: "number", default: 512 }
            }
        },
        func: async (input) => {
            const prompt = typeof input === "string" ? input : input.prompt;
            const width = typeof input === "object" ? input.width || 512 : 512;
            const height = typeof input === "object" ? input.height || 512 : 512;

            if (!prompt) throw new Error("No prompt provided for image generation.");

            const url = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
            const payload = {
                inputs: prompt,
                parameters: { width, height, num_inference_steps: 25, guidance_scale: 7.5 }
            };

            const resp = await axios.post(url, payload, {
                headers: { Authorization: `Bearer ${HF_API_KEY}`, "Content-Type": "application/json" },
                responseType: "arraybuffer",
                timeout: 180000
            });

            const contentType = resp.headers["content-type"];
            if (contentType && contentType.includes("application/json")) {
                const errorJson = JSON.parse(resp.data.toString());
                throw new Error(errorJson.error || "HuggingFace returned error JSON");
            }

            return `data:image/png;base64,${Buffer.from(resp.data, "binary").toString("base64")}`;
        }
    });
}
