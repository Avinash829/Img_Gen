import express from "express";
import { runWorkflow } from "../services/workflow.js";

const router = express.Router();

router.post("/", async (req, res) => {
    const { prompt, model } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const result = await runWorkflow(prompt, model);
        res.json(result);
    } catch (err) {
        console.error("Workflow error:", err);
        res.json({
            refinedPrompt: "We refined your idea but failed to generate the image.",
            image: null,
            error: err.message,
        });
    }
});

export default router;
