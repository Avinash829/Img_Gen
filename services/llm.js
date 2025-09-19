import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in .env");
}

export function getGeminiLLM() {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}
