
export type MessageType = 'text' | 'image' | 'video' | 'drawing';

export interface Message {
  id: string;
  sender: string;
  type: MessageType;
  content: string;
  timestamp: number;
}

export interface User {
  id: string;
  codeName: string;
  avatar: string;
}
