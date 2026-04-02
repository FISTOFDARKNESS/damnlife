import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDMy9WY5ugJYFaLdMQMZuAAsGvKwTu61NA";
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", 
});

export async function generateKeywords(title: string, description: string): Promise<string[]> {
    const prompt = `
    You are an AI assistant for a Roblox marketplace (Excalibur Store).
    Generate 5 to 8 highly relevant, technical keywords/tags for a Roblox asset.
    Focus on: category (VFX, GUI, Script, Model), style (Anime, Realistic, Stylized), and technical features.
    
    Output ONLY a comma-separated list of tags. No extra text.
    
    Asset Title: ${title}
    Asset Description: ${description}
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const responseText = response.text().trim();

        // Parse comma-separated list, remove numbering if AI adds it, and clean whitespace
        const tags = responseText
            .split(',')
            .map(tag => tag.replace(/^\d+[\.\)]\s*/, '').trim())
            .filter(tag => tag.length > 0)
            .map(tag => tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase());

        return tags.slice(0, 10);
    } catch (error) {
        console.error("Gemini Generate Keywords Error:", error);
        return ["Community", "Roblox"];
    }
}

/**
 * Expands a simple search query into a semantic list of related technical terms.
 * Example: "car" -> ["Vehicle", "A-Chassis", "Drive System"]
 */
export async function expandSemanticQuery(query: string): Promise<string[]> {
    const prompt = `
    You are a search query expander for a Roblox marketplace.
    The user searched for: "${query}".
    Expand this simple query into 3 to 5 related technical terms, categories, or keywords
    that might be used in Roblox development (e.g. "car" -> "Vehicle", "A-Chassis", "Drive System","Anime","Advanced sword system").
    Return them as a comma-separated list, nothing else.
  `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse comma-separated list into an array and clean whitespace
        return responseText.split(',').map(tag => tag.trim());
    } catch (error) {
        console.error("Gemini Expand Query Error:", error);
        return [query];
    }
}
