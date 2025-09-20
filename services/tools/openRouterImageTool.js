import fetch from "node-fetch";

export const openRouterImageTool = {
    name: "openRouterImageTool",
    description: "Generate images using OpenRouter image-capable models",
    inputSchema: {
        type: "object",
        properties: {
            prompt: { type: "string" }
        },
        required: ["prompt"],
    },
    func: async ({ prompt, model }) => {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    modalities: ["image", "text"],
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenRouter error ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            const message = result.choices?.[0]?.message;
            const images = message?.images;

            if (images && images.length > 0) {
                const imageUrl = images[0]?.image_url?.url;
                return imageUrl;
            } else {
                throw new Error("No images found in OpenRouter response.");
            }
        } catch (error) {
            console.error("Error in openRouterImageTool:", error);
            throw error;
        }
    },
};
