import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const askGemini = async (
  question: string, 
  context: string,
  modelName: string = 'gemini-2.5-flash'
): Promise<string> => {
  if (!apiKey) {
    return "Error: API Key is missing. Please check your environment configuration.";
  }

  try {
    // Truncate context if it's extremely large, though 2.5 Flash has a large window.
    // We'll keep it simple here.
    const prompt = `
      You are a helpful research assistant aiding a participant in understanding reading material.
      
      CONTEXT MATERIAL:
      ${context.substring(0, 30000)}... (truncated if too long)
      
      USER QUESTION:
      ${question}
      
      Answer concisely and accurately based on the provided context.
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    return response.text || "I couldn't generate an answer at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error while processing your request.";
  }
};
