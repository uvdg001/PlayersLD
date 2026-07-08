import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getGeminiResponse(prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  try {
    const model = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: "Eres un asistente amable en un clon de WhatsApp. Responde de manera concisa y amigable, como si fueras un contacto real.",
      }
    });
    
    const response = await model;
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Lo siento, tuve un problema al procesar tu mensaje.";
  }
}
