import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Player } from '../types';

interface ChatProps {
    currentUser: Player;
    players: Player[];
    messages: ChatMessage[];
    onAddMessage: (text: string) => void;
    // FIX: Changed messageId to string to match ChatMessage.id type.
    onDeleteMessage: (messageId: string) => void;
    // FIX: Changed messageId to string to match ChatMessage.id type.
    onToggleReaction: (messageId: string, emoji: string) => void;
    matchTitle?: string;
    birthdayPlayers: Player[];
}

const EMOJI_REACTIONS = ['❤️', '👍', '😂', '😮', '🤔', '👏', '💀', '👌', '👀', '👴', '🤦', '🦜', '🍌', '⛈️', '🍖', '🏆'];

export const Chat: React.FC<ChatProps> = ({ currentUser, players, messages, onAddMessage, onDeleteMessage, onToggleReaction, matchTitle, birthdayPlayers }) => {
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
            onAddMessage(newMessage.trim());
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

    const textColorClass = ['pizarra'].includes(background) ? 'text-gray-200' : 'text-gray-800';
    const bubbleColorClass = (senderId: number) => {
         const isCurrentUser = senderId === currentUser.id;
        if (background === 'pizarra') {
            return isCurrentUser ? 'bg-green-800/70' : 'bg-gray-600/70';
        }
        if (background === 'claro' || background === 'verde' ) {
            return isCurrentUser ? 'bg-green-200' : 'bg-gray-200';
        }
        return isCurrentUser ? 'bg-green-200/80 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm';
    };


    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden" style={backgroundStyles}>
            <header className="flex justify-between items-center p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm shrink-0">
                <h3 className={`text-xl font-bold ${textColorClass}`}>{matchTitle ? `Chat: ${matchTitle}` : 'Chat General'}</h3>
                 <div className="relative">
                    <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-600/50 ${textColorClass}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.83 1.153.691 8.293a1.5 1.5 0 0 0 0 2.121l7.139 7.14a1.5 1.5 0 0 0 2.121 0l7.14-7.14a1.5 1.5 0 0 0 0-2.121L9.95 1.153a1.5 1.5 0 0 0-2.121 0ZM10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" clipRule="evenodd" /></svg>
                    </button>
                    {isSettingsOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-10">
                           <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Fondo del Chat</label>
                           <select value={background} onChange={e => setBackground(e.target.value)} className="w-full p-1 rounded-md bg-gray-100 dark:bg-gray-700">
                               <option value="cancha">Cancha (Táctico)</option>
                               <option value="verde">Verde Original</option>
                               <option value="claro">Claro</option>
                               <option value="pizarra">Pizarra</option>
                               <option value="color">Color Sólido</option>
                           </select>
                           {background === 'color' && <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)} className="w-full mt-2 h-8" />}
                        </div>
                    )}
                </div>
            </header>
            {birthdayPlayers.length > 0 && (
                <div className="p-2 text-center bg-yellow-300 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200 font-semibold text-sm shrink-0">
                    🎉 ¡Feliz cumpleaños a {birthdayPlayers.map(p => p.nickname).join(', ')}! 🎉
                </div>
            )}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${textColorClass}`}>
                {messages.map(message => {
                    const isCurrentUser = message.senderId === currentUser.id;
                    const hasReactions = message.reactions && Object.keys(message.reactions).length > 0;
                    return (
                        <div key={message.id} className={`flex items-end gap-2 group ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                            <img
                                src={message.senderPhotoUrl || undefined}
                                alt={message.senderName}
                                className={`w-8 h-8 rounded-full object-cover self-start flex-shrink-0`}
                                style={{ transform: 'scale(1.1)' }}
                            />
                            <div className={`relative flex flex-col max-w-xs md:max-w-md lg:max-w-lg ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                <div className={`px-4 py-2 rounded-lg ${bubbleColorClass(message.senderId)}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-bold text-sm">{message.senderName}</p>
                                        {message.senderId === currentUser.id && (
                                            <button onClick={() => onDeleteMessage(message.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3V3.25a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.712Z" clipRule="evenodd" /></svg>
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-base whitespace-pre-wrap break-words">{message.text}</p>
                                </div>
                                 <div className={`flex items-center gap-1 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
{/* FIX: Explicitly type the userIds to number[] to fix type inference issue with Object.entries */}
                                     {hasReactions && Object.entries(message.reactions!).map(([emoji, userIds]: [string, number[]]) => (
                                        <button 
                                            key={emoji} 
                                            onClick={() => onToggleReaction(message.id, emoji)}
                                            className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-colors ${userIds.includes(currentUser.id) ? 'bg-blue-500 text-white' : 'bg-gray-200/50 dark:bg-gray-600/50'}`}
                                            title={getReactorNames(userIds)}
                                        >
                                            <span>{emoji}</span>
                                            <span>{userIds.length}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity reaction-picker-container ${isCurrentUser ? '-left-2 -translate-x-full' : '-right-2 translate-x-full'}`}>
                                    <div className="relative flex items-center gap-1 p-1 rounded-full bg-white dark:bg-gray-900 shadow-lg">
                                        <button onClick={() => setReactionPickerId(reactionPickerId === message.id ? null : message.id)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">🙂</button>
                                        {reactionPickerId === message.id && (
                                            <div className="absolute bottom-full mb-2 w-64 flex flex-wrap gap-1 p-2 bg-white dark:bg-gray-900 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
                                                {EMOJI_REACTIONS.map(emoji => (
                                                    <button 
                                                        key={emoji} 
                                                        onClick={() => {
                                                            onToggleReaction(message.id, emoji);
                                                            setReactionPickerId(null);
                                                        }}
                                                        className="p-1 text-2xl rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transform hover:scale-125 transition-transform"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm shrink-0">
                <div className="relative flex items-center space-x-2">
                     {isEmojiPickerOpen && (
                        <div ref={emojiPickerRef} className="absolute bottom-full right-12 mb-2 w-64 flex flex-wrap gap-1 p-2 bg-white dark:bg-gray-900 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 z-10">
                            {EMOJI_REACTIONS.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => handleEmojiClick(emoji)}
                                    className="p-1 text-2xl rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transform hover:scale-125 transition-transform"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                     <button
                        type="button"
                        onClick={() => setIsEmojiPickerOpen(prev => !prev)}
                        className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 emoji-picker-button"
                        aria-label="Abrir selector de emojis"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500 dark:text-gray-400">
                            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-2.93-8.37a.75.75 0 0 1 1.054.006l.006.007.032.038.007.006.005.004.01.008a4.991 4.991 0 0 1 3.6 0l.01-.008.005-.004.007-.006.032-.038a.75.75 0 0 1 1.06-1.062l-.006-.007-.032-.038a6.5 6.5 0 0 0-4.718 0l-.032.038-.006.007a.75.75 0 0 1-1.054-1.068l.006-.007.032-.038.007-.006.005-.004.01-.008Zm.796 3.522a.75.75 0 0 1 1.054.006l.006.007.032.038.007.006.005.004.01.008a2.5 2.5 0 0 1 1.8 0l.01-.008.005-.004.007-.006.032-.038a.75.75 0 1 1 1.06 1.062l-.006.007-.032.038a4 4 0 0 1-2.912 0l-.032-.038-.006-.007a.75.75 0 0 1-1.054-1.068l.006-.007.032-.038.007-.006.005-.004.01-.008Z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                        Enviar
                    </button>
                </div>
            </form>
        </div>
    );
};