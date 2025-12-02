
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Player } from '../types.ts';

interface ChatProps {
    currentUser: Player;
    players: Player[];
    messages: ChatMessage[];
    onAddMessage: (content: { text?: string; audioUrl?: string }) => void;
    onDeleteMessage: (messageId: string) => void;
    onToggleReaction: (messageId: string, emoji: string) => void;
    matchTitle?: string;
    matchDate?: string;
    birthdayPlayers: Player[];
    isFirebaseConfigured: boolean;
    onClose?: () => void;
}

const EMOJI_REACTIONS = ['❤️', '👍', '😂', '😮', '🤔', '👏'];
const CATEGORIZED_EMOJIS = [
    { category: 'Caritas', emojis: ['😀', '😂', '😊', '😍', '🤔', '🙄', '😭', '😡', '😴', '😎', '🤢', '🤯'] },
    { category: 'Gestos y Personas', emojis: ['👍', '👎', '👌', '👏', '🙏', '💪', '👀', '👴', '🤦', '🤷'] },
    { category: 'Fútbol y Deportes', emojis: ['⚽', '🥅', '🏆', '🥇', '👟', '🏟️', '🎽', '🎯', '⛳', '🏀', '🏈', '⚾'] },
    { category: 'Comida y Bebida', emojis: ['🍌', '🍔', '🍕', '🍖', '🍺', '🍻', '🍿', '🍇', '🍉', '🍓'] },
    { category: 'Varios', emojis: ['❤️', '💀', '🔥', '💯', '💸', '✅', '❌', '❓', '❗️', '⏰', '⛈️', '☀️'] },
];

const PRESET_COLORS = [
    '#2d6a4f', // Verde Cancha
    '#111827', // Negro Suave
    '#1e3a8a', // Azul Noche
    '#4c0519', // Borravino
    '#581c87', // Violeta
    '#78350f', // Marrón
];

export const Chat: React.FC<ChatProps> = ({ currentUser, players, messages, onAddMessage, onDeleteMessage, onToggleReaction, matchTitle, matchDate, birthdayPlayers, isFirebaseConfigured, onClose }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [reactionPickerId, setReactionPickerId] = useState<string | null>(null);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    const [background, setBackground] = useState(() => localStorage.getItem('chatBackground') || 'cancha');
    const [customColor, setCustomColor] = useState(() => localStorage.getItem('chatCustomColor') || '#2d6a4f');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('chatBackground', background);
        if (background === 'color') {
            localStorage.setItem('chatCustomColor', customColor);
        }
    }, [background, customColor]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (reactionPickerId !== null && !target.closest('.reaction-picker-container')) {
                setReactionPickerId(null);
            }
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(target as Node) && !target.closest('.emoji-picker-button')) {
                setIsEmojiPickerOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [reactionPickerId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onAddMessage({ text: newMessage.trim() });
            setNewMessage('');
        }
    };
    
    const getReactorNames = (userIds: number[]): string => {
        return userIds.map(id => {
            const player = players.find(p => p.id === id);
            return player ? player.nickname : 'Desconocido';
        }).join(', ');
    };
    
     const handleEmojiClick = (emoji: string) => {
        setNewMessage(prev => prev + emoji);
        inputRef.current?.focus();
    };

    const backgroundStyles: React.CSSProperties =
        background === 'cancha' ? { backgroundImage: 'url("https://www.transparenttextures.com/patterns/fake-grass.png")', backgroundColor: '#2d6a4f' } :
        background === 'verde' ? { backgroundColor: '#d8f3dc' } :
        background === 'claro' ? { backgroundColor: '#ffffff' } :
        background === 'pizarra' ? { backgroundColor: '#181b18' } :
        background === 'color' ? { backgroundColor: customColor } : {};

    // Force high contrast: My message (Dark Green BG + White Text), Others (White/Light Gray BG + Black Text)
    const bubbleColorClass = (senderId: number) => {
         const isCurrentUser = senderId === currentUser.id;
         if (isCurrentUser) {
             return 'bg-green-700 text-white'; // High contrast for self
         } else {
             return 'bg-gray-100 text-gray-900 border border-gray-300'; // High contrast for others
         }
    };


    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden" style={backgroundStyles}>
            <header className="flex justify-between items-center p-4 border-b border-gray-200/20 dark:border-gray-700/20 bg-black/40 backdrop-blur-sm shrink-0">
                <div className="flex flex-col">
                    <h3 className={`text-lg font-bold text-white shadow-black drop-shadow-md`}>
                        {matchTitle || 'Chat del Equipo'}
                    </h3>
                    {matchDate && (
                        <span className="text-xs text-green-200 font-semibold drop-shadow-md flex items-center gap-1">
                            📅 {matchDate}
                        </span>
                    )}
                     {!isFirebaseConfigured && (
                        <span className="text-[10px] text-yellow-300 font-semibold leading-tight drop-shadow-md">(OFFLINE)</span>
                    )}
                </div>
                <div className="flex items-center space-x-1">
                    <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-2 rounded-full hover:bg-white/20 text-white transition-colors`} title="Configuración">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.158 0a.225.225 0 1 1-.45 0 .225.225 0 0 1 .45 0Z" /></svg>
                    </button>
                    {onClose && (
                        <button onClick={onClose} className={`p-2 rounded-full hover:bg-red-500/50 text-white transition-colors`} title="Cerrar Chat">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                    {isSettingsOpen && (
                        <div className="absolute right-2 top-14 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-2xl z-20 p-3 border border-gray-200 dark:border-gray-700">
                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Fondo del Chat</label>
                             <select 
                                value={background} 
                                onChange={e => setBackground(e.target.value)} 
                                className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 text-sm"
                             >
                                <option value="cancha">Cancha (Original)</option>
                                <option value="verde">Verde Claro</option>
                                <option value="claro">Blanco</option>
                                <option value="pizarra">Pizarra Oscura</option>
                                <option value="color">Color Sólido</option>
                            </select>
                            
                            {background === 'color' && (
                                <div className="mt-3 animate-fadeIn">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Colores rápidos:</p>
                                    <div className="flex gap-2 mb-3 flex-wrap">
                                        {PRESET_COLORS.map(color => (
                                            <button
                                                key={color}
                                                className={`w-6 h-6 rounded-full border-2 ${customColor === color ? 'border-blue-500 scale-110' : 'border-transparent hover:scale-110'} shadow-sm transition-transform`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => setCustomColor(color)}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                        <input 
                                            type="color" 
                                            value={customColor} 
                                            onChange={e => setCustomColor(e.target.value)} 
                                            className="w-8 h-8 p-0 border-0 rounded cursor-pointer bg-transparent" 
                                        />
                                        <span className="text-xs text-gray-600 dark:text-gray-300">Personalizado</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {birthdayPlayers.length > 0 && (
                     <div className="p-3 rounded-lg bg-yellow-300/80 dark:bg-yellow-800/80 text-center text-yellow-900 dark:text-yellow-100 font-semibold text-sm">
                        🎂 ¡Feliz cumpleaños a {birthdayPlayers.map(p => p.nickname).join(', ')}! 🎂
                    </div>
                )}
                {messages.length === 0 ? (
                    <div className={`text-center py-10 text-white/70`}>
                        <p className="font-medium">Aún no hay mensajes en este chat.</p>
                        <p className="text-sm mt-1">¡Sé el primero en saludar!</p>
                    </div>
                ) : (
                    messages.map(message => {
                        const sender = players.find(p => p.id === message.senderId);
                        const isCurrentUser = message.senderId === currentUser.id;
                        const messageDate = new Date(message.timestamp);
                        const timeString = messageDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

                        return (
                            <div key={message.id} className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                {!isCurrentUser && sender && (
                                    sender.photoUrl ? (
                                        <img src={sender.photoUrl} alt={sender.nickname} className="w-10 h-10 rounded-full object-cover self-start border-2 border-white shadow-sm" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 self-start border-2 border-white shadow-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                                        </div>
                                    )
                                )}
                                <div className={`group relative max-w-[80%] md:max-w-xs ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
                                     <div className={`px-4 py-2.5 rounded-xl ${bubbleColorClass(message.senderId)} shadow-md`}>
                                        {!isCurrentUser && <p className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-400 mb-0.5">{sender?.nickname}</p>}
                                        {message.text && <p className="whitespace-pre-wrap break-words text-sm font-medium">{message.text}</p>}
                                        <p className={`text-[10px] opacity-70 text-right mt-1`}>{timeString}</p>
                                    </div>
                                    
                                     {message.reactions && Object.keys(message.reactions).length > 0 && (
                                        <div className={`flex gap-1 mt-1 px-1.5 py-0.5 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-sm transform -translate-y-2 border border-gray-100 dark:border-gray-700`}>
                                            {Object.entries(message.reactions).map(([emoji, userIds]) => {
                                                const ids = userIds as number[];
                                                return ids.length > 0 && (
                                                    <div
                                                        key={emoji}
                                                        className="relative group/reaction"
                                                        onClick={() => onToggleReaction(message.id, emoji)}
                                                    >
                                                        <span className="text-xs cursor-pointer hover:scale-125 transition-transform inline-block px-0.5">{emoji} <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{ids.length}</span></span>
                                                        <div className="absolute bottom-full mb-1 w-max max-w-[150px] p-1 text-[10px] bg-black/80 text-white rounded-md opacity-0 group-hover/reaction:opacity-100 transition-opacity pointer-events-none z-30 whitespace-normal">
                                                            {getReactorNames(ids)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className={`reaction-picker-container absolute top-0 ${isCurrentUser ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10`}>
                                         {isCurrentUser && (
                                            <button onClick={() => onDeleteMessage(message.id)} className="p-1 bg-white dark:bg-gray-700 rounded-full shadow-md hover:bg-red-100 dark:hover:bg-red-900 text-red-500" title="Eliminar">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                            </button>
                                        )}
                                        <button onClick={() => setReactionPickerId(reactionPickerId === message.id ? null : message.id)} className="p-1 bg-white dark:bg-gray-700 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300" title="Reaccionar">
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a.5.5 0 00.707 0 5 5 0 00-6.486 0 .5.5 0 00.707.707A4 4 0 0110 12a4 4 0 013.536 2.535z" /></svg>
                                        </button>
                                        {reactionPickerId === message.id && (
                                            <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 flex bg-white dark:bg-gray-700 p-1.5 rounded-full shadow-xl border dark:border-gray-600 gap-1 animate-bounce-in">
                                                {EMOJI_REACTIONS.map(emoji => (
                                                    <button key={emoji} onClick={() => { onToggleReaction(message.id, emoji); setReactionPickerId(null); }} className="text-lg p-0.5 hover:scale-125 transition-transform">
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-3 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm shrink-0 border-t border-gray-200/20">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <div ref={emojiPickerRef} className="relative">
                       <button
                            type="button"
                            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                            className={`emoji-picker-button p-2 rounded-full hover:bg-white/20 text-white transition-colors`}
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a.5.5 0 00.707 0 5 5 0 00-6.486 0 .5.5 0 00.707.707A4 4 0 0110 12a4 4 0 013.536 2.535z" /></svg>
                        </button>
                         {isEmojiPickerOpen && (
                            <div className="absolute bottom-full left-0 mb-2 w-64 h-60 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2 overflow-y-auto border border-gray-200 dark:border-gray-700 z-50">
                                {CATEGORIZED_EMOJIS.map(({ category, emojis }) => (
                                    <div key={category}>
                                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 px-1 pt-2 uppercase">{category}</h4>
                                        <div className="grid grid-cols-6 gap-1 mt-1">
                                            {emojis.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => handleEmojiClick(emoji)}
                                                    className="text-xl p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe..."
                        className={`flex-1 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner placeholder-gray-500`}
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009.17 15.28l4.472-1.597a1 1 0 011.087 1.087l-1.597 4.472a1 1 0 001.28l.842a1 1 0 001.409-1.169l-14-7z" /></svg>
                    </button>
                </form>
            </div>
        </div>
    );
};