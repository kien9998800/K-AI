export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isStreaming?: boolean;
  image?: string; // Data URL of the uploaded image
}

export interface ChatConfig {
  systemInstruction: string;
  temperature: number;
}

export interface User {
  username: string;
  password?: string; // In a real app, never store plain text passwords. For client-side demo, we use simple storage.
  createdAt: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string; // Summary or first message
  messages: Message[];
  lastModified: number;
}

export interface Persona {
  id: string;
  name: string;
  role: string; // e.g., "Họa sĩ Furry", "Trợ lý ảo"
  avatar: string;
  description: string; // Short description for the card
  systemInstruction: string;
  temperature: number;
}