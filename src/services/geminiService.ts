import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function askAssistant(prompt: string, userType: string = "citizen") {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `You are a highly professional AI Assistant for the official website of Jitin Prasada, Minister of State for Commerce & Industry and Electronics & IT, Government of India.
  Your goal is to provide accurate, concise, and helpful information about his initiatives, policies, and vision for India's digital and economic growth.
  The user is identified as a ${userType}. Tailor your response to be most relevant to them.
  Keep responses premium, polite, and focused on governance and impact. 
  Avoid political slogans. Use Markdown for formatting.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
  }
}
