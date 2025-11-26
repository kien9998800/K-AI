import { GoogleGenAI, Chat, GenerateContentResponse, Part } from "@google/genai";
import { ChatConfig } from "../types";

// Initialize the client with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Creates a new chat session with the provided configuration.
 */
export const createChatSession = (config: ChatConfig): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: config.systemInstruction,
      temperature: config.temperature,
    },
  });
};

/**
 * Sends a message to the chat session and yields streaming chunks.
 * Supports optional image attachment.
 */
export async function* sendMessageStream(chat: Chat, message: string, imageDataUrl?: string) {
  try {
    let msgContent: string | Part[] = message;

    // If an image is provided, construct a multipart message
    if (imageDataUrl) {
      // Extract Base64 data and MimeType from Data URL
      // Format: data:image/png;base64,iVBORw0KGgo...
      const [header, base64Data] = imageDataUrl.split(',');
      const mimeType = header.split(':')[1].split(';')[0];

      msgContent = [
        { text: message },
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        }
      ];
    }

    const result = await chat.sendMessageStream({ message: msgContent });
    
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        yield c.text;
      }
    }
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
}