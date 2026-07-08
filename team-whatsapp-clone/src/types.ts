export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them' | 'ai';
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  online?: boolean;
  messages: Message[];
}
