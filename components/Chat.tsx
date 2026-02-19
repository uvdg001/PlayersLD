
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Player } from '../types.ts';
import { useToast } from '../hooks/useToast.ts';

interface ChatProps {
    currentUser: Player;
    players: Player[];
    messages: ChatMessage[];
    onAddMessage: (content: { text?: string; audioUrl?: string; hasSound?: boolean }) => void;
    onDeleteMessage: (messageId: string) => void;
    onToggleReaction: (messageId: string, emoji: string) => void;
    matchTitle?: string;
    matchDate?: string;
    birthdayPlayers: Player[];
    isFirebaseOnline: boolean;
    onClose?: () => void;
    isMatchFinished?: boolean; 
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

export const Chat: React.FC<ChatProps> = ({ currentUser, players, messages, onAddMessage, onDeleteMessage, onToggleReaction, matchTitle, matchDate, birthdayPlayers, isFirebaseOnline, onClose, isMatchFinished }) => {
    const [newMessage, setNewMessage] = useState('');
    const [sendWithSound, setSendWithSound] = useState(false); 
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [reactionPickerId, setReactionPickerId] = useState<string | null>(null);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const toast = useToast();
    
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

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFirebaseOnline) {
            toast.error("Modo Offline: No se puede enviar el mensaje.");
            return;
        }
        if (newMessage.trim()) {
            onAddMessage({ 
                text: newMessage.trim(),
                hasSound: sendWithSound 
            });
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

    let containerStyle: React.CSSProperties = {};
    
    if (isMatchFinished) {
        containerStyle = {
            backgroundColor: '#e3d5ca',
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/aged-paper.png")',
            filter: 'sepia(0.3)',
        };
    } else {
        containerStyle = background === 'cancha' ? { backgroundImage: 'url("https://www.transparenttextures.com/patterns/fake-grass.png")', backgroundColor: '#2d6a4f' } :
            background === 'verde' ? { backgroundColor: '#d8f3dc' } :
            background === 'claro' ? { backgroundColor: '#ffffff' } :
            background === 'pizarra' ? { backgroundColor: '#181b18' } :
            background === 'color' ? { backgroundColor: customColor } : {};
    }

    const bubbleColorClass = (senderId: number) => {
         const isCurrentUser = senderId === currentUser.id;
         if (isMatchFinished) {
             return isCurrentUser ? 'bg-stone-600 text-white' : 'bg-stone-200 text-stone-800 border border-stone-400';
         }
         if (isCurrentUser) {
             return 'bg-green-700 text-white'; 
         } else {
             return 'bg-gray-100 text-gray-900 border border-gray-300'; 
         }
    };

    const headerClass = isMatchFinished 
        ? "bg-stone-800/90 border-b border-stone-600" 
        : "bg-black/40 border-b border-gray-200/20 backdrop-blur-sm";

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden transition-all duration-500" style={containerStyle}>
            
            <header className={`flex justify-between items-center p-4 shrink-0 z-10 ${headerClass}`}>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <h3 className={`text-xl font-bold text-white shadow-black drop-shadow-md`}>
                            {matchTitle || 'Chat del Equipo'}
                        </h3>
                        {isMatchFinished && (
                            <span className="bg-stone-200 text-stone-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Archivo</span>
                        )}
                    </div>
                    {matchDate && (
                        <span className={`text-sm font-semibold drop-shadow-md flex items-center gap-1 ${isMatchFinished ? 'text-stone-300' : 'text-green-200'}`}>
                            📅 {matchDate}
                        </span>
                    )}
                     {!isFirebaseOnline && (
                        <span className="text-xs text-yellow-300 font-semibold leading-tight drop-shadow-md">(OFFLINE)</span>
                    )}
                </div>
                <div className="flex items-center space-x-1">
                    {!isMatchFinished && (
                        <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-2 rounded-full hover:bg-white/20 text-white transition-colors`} title="Configuración">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.158 0a.225.225 0 1 1-.45 0 .225.225 0 0 1 .45 0Z" /></svg>
                        </button>
                    )}
                    {onClose && (
                        <button onClick={onClose} className={`p-2 rounded-full hover:bg-red-500/50 text-white transition-colors`} title="Cerrar Chat">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                    {isSettingsOpen && !isMatchFinished && (
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

            <div className="flex-1 p-4 overflow-y-auto space-y-6">
                {isMatchFinished && (
                    <div className="flex justify-center my-4 sticky top-0 z-0">
                        <span className="bg-stone-700/80 text-white px-4 py-1 rounded-full text-xs uppercase font-bold shadow-sm backdrop-blur-sm">
                            Este partido ha finalizado • Historial de Chat
                        </span>
                    </div>
                )}

                {birthdayPlayers.length > 0 && !isMatchFinished && (
                     <div className="p-3 rounded-lg bg-yellow-300/80 dark:bg-yellow-800/80 text-center text-yellow-900 dark:text-yellow-100 font-semibold text-sm">
                        🎂 ¡Feliz cumpleaños a {birthdayPlayers.map(p => p.nickname).join(', ')}! 🎂
                    </div>
                )}
                
                {messages.length === 0 ? (
                    <div className={`text-center py-10 ${isMatchFinished ? 'text-stone-500' : 'text-white/70'}`}>
                        <p className="font-medium text-xl">Aún no hay mensajes en este chat.</p>
                        {!isMatchFinished && <p className="text-lg mt-1">¡Sé el primero en saludar!</p>}
                    </div>
                ) : (
                    messages.map(message => {
                        const sender = players.find(p => p.id === message.senderId);
                        const isCurrentUser = message.senderId === currentUser.id;
                        const messageDate = new Date(message.timestamp);
                        const timeString = messageDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

                        return (
                            <div key={message.id} className={`flex items-end gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                {!isCurrentUser && sender && (
                                    sender.photoUrl ? (
                                        <img src={sender.photoUrl} alt={sender.nickname} className={`w-10 h-10 md:w-14 md:h-14 rounded-full object-cover self-start border-2 ${isMatchFinished ? 'border-stone-400 grayscale' : 'border-white'} shadow-sm`} />
                                    ) : (
                                        <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center self-start border-2 shadow-sm ${isMatchFinished ? 'bg-stone-300 border-stone-400 text-stone-600' : 'bg-gray-300 border-white text-gray-500'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                                        </div>
                                    )
                                )}
                                <div className={`group relative max-w-[85%] md:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
                                     <div className={`px-4 py-3 md:px-5 md:py-4 rounded-2xl ${bubbleColorClass(message.senderId)} shadow-md`}>
                                        {!isCurrentUser && <p className={`text-sm md:text-lg font-extrabold mb-1 ${isMatchFinished ? 'text-stone-600' : 'text-indigo-700 dark:text-indigo-400'}`}>{sender?.nickname}</p>}
                                        {message.text && (
                                            <p className="whitespace-pre-wrap break-words text-base md:text-xl font-medium leading-relaxed">
                                                {message.text}
                                                {message.hasSound && <span className="inline-block ml-2 text-xl align-middle" title="Mensaje con sonido">📢</span>}
                                            </p>
                                        )}
                                        <p className={`text-xs md:text-sm opacity-70 text-right mt-1 font-bold`}>{timeString}</p>
                                    </div>
                                    
                                     {message.reactions && Object.keys(message.reactions).length > 0 && (
                                        <div className={`flex gap-1 mt-1 px-2 py-1 rounded-full shadow-sm transform -translate-y-3 border ${isMatchFinished ? 'bg-stone-200 border-stone-300' : 'bg-white/90 dark:bg-gray-800/90 border-gray-100 dark:border-gray-700'}`}>
                                            {Object.entries(message.reactions).map(([emoji, userIds]) => {
                                                const ids = userIds as number[];
                                                return ids.length > 0 && (
                                                    <div
                                                        key={emoji}
                                                        className="relative group/reaction"
                                                        onClick={() => !isMatchFinished && onToggleReaction(message.id, emoji)}
                                                    >
                                                        <span className={`text-lg inline-block px-1 ${!isMatchFinished ? 'cursor-pointer hover:scale-125 transition-transform' : ''}`}>{emoji} <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{ids.length}</span></span>
                                                        <div className="absolute bottom-full mb-1 w-max max-w-[150px] p-1 text-xs bg-black/80 text-white rounded-md opacity-0 group-hover/reaction:opacity-100 transition-opacity pointer-events-none z-30 whitespace-normal">
                                                            {getReactorNames(ids)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {!isMatchFinished && (
                                        <div className={`reaction-picker-container absolute top-0 ${isCurrentUser ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10`}>
                                            {isCurrentUser && (
                                                <button onClick={() => onDeleteMessage(message.id)} className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-md hover:bg-red-100 dark:hover:bg-red-900 text-red-500" title="Eliminar">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                </button>
                                            )}
                                            <button onClick={() => setReactionPickerId(reactionPickerId === message.id ? null : message.id)} className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300" title="Reaccionar">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a.5.5 0 00.707 0 5 5 0 00-6.486 0 .5.5 0 00.707.707A4 4 0 0110 12a4 4 0 013.536 2.535z" /></svg>
                                            </button>
                                            {reactionPickerId === message.id && (
                                                <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 flex bg-white dark:bg-gray-700 p-2 rounded-full shadow-xl border dark:border-gray-600 gap-2 animate-bounce-in">
                                                    {EMOJI_REACTIONS.map(emoji => (
                                                        <button key={emoji} onClick={() => { onToggleReaction(message.id, emoji); setReactionPickerId(null); }} className="text-2xl p-1 hover:scale-125 transition-transform">
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className={`p-2 md:p-4 backdrop-blur-sm shrink-0 border-t ${isMatchFinished ? 'bg-stone-200/50 border-stone-400/30' : 'bg-white/30 dark:bg-gray-900/30 border-gray-200/20'}`}>
                {isMatchFinished ? (
                    <div className="text-center text-stone-600 font-bold italic py-2">
                        🔒 El chat está cerrado porque el partido finalizó.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
                        <div ref={emojiPickerRef} className="relative shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                                className={`emoji-picker-button p-2 md:p-3 rounded-full hover:bg-white/20 text-white transition-colors`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14c1.5 2 4.5 2 6 0"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                            </button>
                            {isEmojiPickerOpen && (
                                <div className="absolute bottom-full left-0 mb-4 w-72 h-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2 overflow-y-auto border border-gray-200 dark:border-gray-700 z-50">
                                    {CATEGORIZED_EMOJIS.map(({ category, emojis }) => (
                                        <div key={category}>
                                            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 px-1 pt-2 uppercase">{category}</h4>
                                            <div className="grid grid-cols-6 gap-2 mt-2">
                                                {emojis.map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        type="button"
                                                        onClick={() => handleEmojiClick(emoji)}
                                                        className="text-2xl p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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

                        <div className="shrink-0 flex items-center">
                            <button
                                type="button"
                                onClick={() => setSendWithSound(!sendWithSound)}
                                className={`p-2 md:p-3 rounded-full transition-all duration-300 border-2 ${sendWithSound ? 'bg-orange-500 border-orange-400 text-white scale-110 shadow-[0_0_10px_rgba(249,115,22,0.6)]' : 'bg-gray-700/50 border-transparent text-gray-300 hover:bg-white/10'}`}
                                title={sendWithSound ? "Enviar CON sonido gracioso" : "Enviar SIN sonido"}
                            >
                                {sendWithSound ? '📢' : '🔇'}
                            </button>
                        </div>

                        <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={sendWithSound ? "Escribe algo ruidoso..." : "Escribe..."}
                            className={`flex-1 min-w-0 px-3 py-2 md:px-6 md:py-4 text-sm md:text-xl rounded-full text-gray-800 dark:text-white focus:outline-none focus:ring-2 md:focus:ring-4 placeholder-gray-500 transition-colors ${sendWithSound ? 'bg-orange-100/90 dark:bg-orange-900/50 focus:ring-orange-500' : 'bg-white/80 dark:bg-gray-800/80 focus:ring-indigo-500 shadow-inner'}`}
                        />
                        <button type="submit" disabled={!newMessage.trim()} className="shrink-0 p-2 md:p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-8 md:w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
