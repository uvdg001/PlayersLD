import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  MoreVertical, 
  MessageSquare, 
  Trophy, 
  Paperclip, 
  Smile, 
  Mic, 
  Send,
  Check,
  CheckCheck,
  ArrowLeft,
  Phone,
  Video,
  Users,
  Settings,
  Shield,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Chat, Message } from './types';
import { cn } from './lib/utils';

const INITIAL_PLAYERS: Chat[] = [
  {
    id: 'player_1',
    name: 'Capitán Trueno',
    avatar: 'https://picsum.photos/seed/capitan/300',
    lastMessage: 'Entrenamiento a las 18:00',
    lastMessageTime: new Date(),
    unreadCount: 0,
    online: true,
    messages: [
      { id: 'm1', text: 'Hola equipo, ¿listos para hoy?', sender: 'them', timestamp: new Date(Date.now() - 3600000), status: 'read' },
      { id: 'm2', text: '¡Claro que sí!', sender: 'me', timestamp: new Date(Date.now() - 3000000), status: 'read' }
    ]
  },
  {
    id: 'player_2',
    name: 'Goleador Pro',
    avatar: 'https://picsum.photos/seed/goal/300',
    lastMessage: '¿Quién lleva los balones?',
    lastMessageTime: new Date(Date.now() - 1800000),
    unreadCount: 3,
    online: false,
    messages: []
  },
  {
    id: 'player_3',
    name: 'Defensa Central',
    avatar: 'https://picsum.photos/seed/defensa/300',
    lastMessage: 'Llego 5 min tarde',
    lastMessageTime: new Date(Date.now() - 7200000),
    unreadCount: 0,
    online: true,
    messages: []
  }
];

const Avatar = ({ src, online, size = "w-12 h-12" }: { src: string, online?: boolean, size?: string }) => (
  <div className={cn("relative flex-shrink-0", size)}>
    <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 border border-gray-100">
      <img src={src} alt="Avatar" className="w-full h-full object-cover" />
    </div>
    {online && (
      <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white z-10"></div>
    )}
  </div>
);

export default function App() {
  const [chats, setChats] = useState<Chat[]>(INITIAL_PLAYERS);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeChatId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'me',
      timestamp: new Date(),
      status: 'sent'
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessage: inputText,
          lastMessageTime: new Date()
        };
      }
      return chat;
    }));
    
    setInputText('');
  };

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden font-sans text-gray-900">
      {/* Sidebar - Lista de Jugadores */}
      <div className={cn(
        "bg-white border-r border-gray-200 flex-col transition-all duration-300 z-20",
        isMobile ? (activeChatId ? "hidden" : "flex w-full") : "flex w-[400px]"
      )}>
        {/* Header Superior */}
        <div className="bg-[#f0f2f5] p-3 flex justify-between items-center border-b border-gray-200">
          <Avatar src="https://picsum.photos/seed/me/100" size="w-10 h-10" />
          <div className="flex gap-5 text-gray-500">
            <Users className="w-5 h-5 cursor-pointer hover:text-gray-800" />
            <Trophy className="w-5 h-5 cursor-pointer hover:text-gray-800" />
            <MessageSquare className="w-5 h-5 cursor-pointer hover:text-gray-800" />
            <MoreVertical className="w-5 h-5 cursor-pointer hover:text-gray-800" />
          </div>
        </div>

        {/* Buscador */}
        <div className="p-2">
          <div className="bg-[#f0f2f5] flex items-center px-4 py-1.5 rounded-lg">
            <Search className="w-4 h-4 text-gray-500 mr-4" />
            <input 
              type="text" 
              placeholder="Busca un chat o inicia uno nuevo" 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de Jugadores */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={cn(
                "flex items-center p-3 cursor-pointer hover:bg-[#f5f6f6] transition-colors border-b border-gray-50",
                activeChatId === chat.id ? "bg-[#ebebeb]" : ""
              )}
            >
              <Avatar src={chat.avatar} online={chat.online} />
              <div className="flex-1 min-w-0 ml-3 border-b border-gray-100 pb-3 h-full flex flex-col justify-center">
                <div className="flex justify-between items-center mb-0.5">
                  <h3 className="font-medium text-gray-900 truncate">{chat.name}</h3>
                  <span className="text-[11px] text-gray-500">
                    {chat.lastMessageTime ? format(chat.lastMessageTime, 'HH:mm') : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessage || 'Sin mensajes'}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="bg-[#25D366] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área de Chat */}
      <div className={cn(
        "flex-1 flex flex-col relative bg-[#efeae2]",
        isMobile && !activeChatId && "hidden"
      )}>
        {activeChat ? (
          <>
            {/* Header del Chat */}
            <div className="bg-[#f0f2f5] p-2.5 flex justify-between items-center border-b border-gray-200 z-10">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <ArrowLeft 
                    className="w-6 h-6 text-gray-600 cursor-pointer mr-1" 
                    onClick={() => setActiveChatId(null)}
                  />
                )}
                <Avatar src={activeChat.avatar} size="w-10 h-10" />
                <div>
                  <h3 className="font-medium text-gray-900 leading-tight">{activeChat.name}</h3>
                  <span className="text-[11px] text-gray-500">
                    {activeChat.online ? 'en línea' : 'últ. vez hoy a las ...'}
                  </span>
                </div>
              </div>
              <div className="flex gap-5 text-gray-500">
                <Video className="w-5 h-5 cursor-pointer hover:text-gray-800" />
                <Phone className="w-5 h-5 cursor-pointer hover:text-gray-800" />
                <Search className="w-5 h-5 cursor-pointer hover:text-gray-800" />
                <MoreVertical className="w-5 h-5 cursor-pointer hover:text-gray-800" />
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto relative p-4 md:px-16 pitch-bg-pattern">
              <div className="relative z-10 flex flex-col gap-1.5">
                <AnimatePresence initial={false}>
                  {activeChat.messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "max-w-[85%] p-2 rounded-lg shadow-sm text-[13.5px] relative mb-0.5",
                        msg.sender === 'me' 
                          ? "bg-[#dcf8c6] self-end rounded-tr-none" 
                          : "bg-white self-start rounded-tl-none"
                      )}
                      style={msg.sender === 'me' ? { backgroundColor: 'rgb(160, 220, 160)' } : {}}
                    >
                      <p className="pr-8 leading-normal">{msg.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <span className="text-[10px] text-gray-500">
                          {format(msg.timestamp, 'HH:mm')}
                        </span>
                        {msg.sender === 'me' && (
                          <CheckCheck className={cn("w-3.5 h-3.5", msg.status === 'read' ? "text-blue-500" : "text-gray-400")} />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="bg-[#f0f2f5] p-2 flex items-center gap-2">
              <div className="flex gap-3 text-gray-500 px-2">
                <Smile className="w-6 h-6 cursor-pointer hover:text-gray-700" />
                <Paperclip className="w-6 h-6 cursor-pointer hover:text-gray-700" />
              </div>
              <div className="flex-1">
                <input 
                  type="text" 
                  placeholder="Escribe un mensaje" 
                  className="w-full bg-white border-none outline-none rounded-lg px-4 py-2.5 text-sm"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
              </div>
              <div className="px-2">
                {inputText.trim() ? (
                  <Send className="w-6 h-6 text-gray-500 cursor-pointer" onClick={handleSendMessage} />
                ) : (
                  <Mic className="w-6 h-6 text-gray-500 cursor-pointer" />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#f8f9fa] text-center p-12 border-b-4 border-[#25D366]">
            <div className="w-64 h-64 mb-8 opacity-20">
              <MessageSquare className="w-full h-full text-gray-400" />
            </div>
            <h2 className="text-3xl font-light text-gray-600 mb-4">WhatsApp Web</h2>
            <p className="text-sm text-gray-500 max-w-md leading-relaxed">
              Envía y recibe mensajes sin necesidad de tener tu teléfono conectado. <br />
              Usa WhatsApp en hasta 4 dispositivos vinculados y 1 teléfono a la vez.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
