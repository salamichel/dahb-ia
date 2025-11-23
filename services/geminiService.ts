import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { OracleComponent } from "../types";

// Initialize Gemini API
// Note: In a real production app, this would likely be proxying through a backend.
// For this frontend-only demo, we assume process.env.API_KEY is available.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const generateAIResponse = async (
  userMessage: string,
  contextComponents: OracleComponent[]
): Promise<string> => {
  if (!apiKey) {
    return "API Key is missing. Please configure process.env.API_KEY.";
  }

  try {
    // Create a context string from the mock data to simulate RAG (Retrieval Augmented Generation)
    const contextString = contextComponents.map(c => `
      Component ID: ${c.id}
      Name: ${c.name}
      CUF Params: ${c.cufParams.map(p => `${p.param}=${p.value}`).join(', ')}
      Tables: ${c.oracleTables.join(', ')}
      Integrations: ${c.oicsIntegrations.join(', ')}
    `).join('\n---\n');

    const systemInstruction = `You are 'Dahb IA', an expert Oracle ERP Cloud assistant. 
    You have access to the following documentation index (Context):
    ${contextString}
    
    Answer the user's question based on this context. If the information is not in the context, say so, but offer general Oracle knowledge if applicable.
    Keep answers concise and technical. Format lists nicely.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature for factual answers
      }
    });

    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error while processing your request.";
  }
};
