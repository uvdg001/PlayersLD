import React, { useState, useEffect } from 'react';
import type { Player } from '../types.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface HeaderProps {
    currentUser: Player;
    teamName?: string;
    onOpenRoster: () => void;
    onChangeUser: () => void;
    onExitTeam: () => void;
    isAdmin: boolean;
    isSuperAdmin?: boolean;
    onEditProfile: () => void;
    isFirebaseOnline: boolean;
    announcement?: string;
    onUpdateAnnouncement?: (text: string) => void;
    canEditAnnouncement?: boolean;
    notificationPermission: NotificationPermission;
    onRequestNotificationPermission: () => void;
}

const Clock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    return (
        <div className="text-right text-[10px] text-gray-500 dark:text-gray-400 hidden lg:block">
            <p className="font-bold uppercase tracking-tighter">{time.toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}</p>
        </div>
    );
};

export const Header: React.FC<HeaderProps> = ({ 
    currentUser, teamName, onChangeUser, onExitTeam, 
    isAdmin, isSuperAdmin, onEditProfile, isFirebaseOnline,
    announcement, onUpdateAnnouncement, canEditAnnouncement,
    notificationPermission, onRequestNotificationPermission
}) => {
    const { t } = useLanguage();

    const handleEditAnnouncement = () => {
        if (!onUpdateAnnouncement) return;
        const newText = window.prompt("📣 Escribe el mensaje del Cuerpo Técnico:", announcement || "");
        if (newText !== null) {
            onUpdateAnnouncement(newText);
        }
    };

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40 border-b border-indigo-600/10">
            <div className="container mx-auto px-2 md:px-6 py-2">
                <div className="flex justify-between items-center mb-1">
                    {/* CABECERA IZQUIERDA */}
                    <div className="flex items-center space-x-1 min-w-0">
                        <div className="flex flex-col">
                            <h1 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white truncate tracking-tighter uppercase italic leading-none">
                                {t.appTitle.split(' ')[0]} <span className="text-indigo-600">{t.appTitle.split(' ')[1]}</span>
                            </h1>
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{teamName}</span>
                        </div>
                        <div className={`flex items-center px-1.5 py-0.5 rounded-full text-[7px] font-black border ml-1 ${isFirebaseOnline ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full mr-1 ${isFirebaseOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            {isFirebaseOnline ? 'ON' : 'OFF'}
                        </div>
                    </div>

                    {/* CABECERA DERECHA */}
                    <div className="flex items-center space-x-1 flex-shrink-0">
                        <button 
                            onClick={onRequestNotificationPermission}
                            className={`p-1.5 rounded-full ${notificationPermission === 'granted' ? 'text-green-500' : 'text-gray-400'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Z" />
                            </svg>
                        </button>

                        {canEditAnnouncement && (
                            <button onClick={handleEditAnnouncement} className="p-1 text-orange-500 text-lg">📢</button>
                        )}

                        <Clock />
                       
                        <div className="flex items-center space-x-1.5 pl-1.5 border-l border-gray-200 dark:border-gray-700 ml-1">
                            {isSuperAdmin && (
                                <button 
                                    onClick={() => window.open('https://primer-proyecto-a9290--v2-premium-9ezr5o0c.web.app', '_blank')}
                                    className="p-1.5 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all active:scale-90 text-xs flex items-center justify-center w-8 h-8"
                                    title="V2 Premium"
                                >
                                    ⚽
                                </button>
                            )}

                            <button 
                                onClick={onChangeUser}
                                className="p-1.5 bg-red-600 text-white hover:bg-red-700 rounded-full transition-all active:scale-90 shadow-md"
                                title="Cambiar Jugador"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H9a.75.75 0 0 1 0-1.5h10.94l-1.72-1.72a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                </svg>
                            </button>

                            <div className="relative flex-shrink-0 group">
                                {currentUser.photoUrl ? (
                                    <img 
                                        src={currentUser.photoUrl} 
                                        alt="" 
                                        className="w-8 h-8 rounded-full object-cover border-2 border-indigo-500 cursor-pointer shadow-sm" 
                                        onClick={onEditProfile} 
                                    />
                                ) : (
                                   <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer border-2 border-gray-300" onClick={onEditProfile}>
                                        <span className="text-[10px] font-bold">{currentUser.nickname.charAt(0)}</span>
                                   </div>
                                )}
                                {isAdmin && <span className="absolute -top-1 -right-1 text-[8px] bg-yellow-400 rounded-full w-3 h-3 flex items-center justify-center border border-white shadow-sm">👑</span>}
                                
                                <button 
                                    onClick={(e) => { e.stopPropagation(); if(window.confirm('¿Cambiar de Equipo?')) onExitTeam(); }}
                                    className="hidden lg:group-hover:block absolute top-10 right-0 bg-white dark:bg-gray-800 border-2 border-red-500 text-red-600 text-[8px] font-black p-2 rounded-xl whitespace-nowrap shadow-2xl"
                                >
                                    🚪 SALIR DEL EQUIPO
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {announcement && (
                    <div className="relative overflow-hidden mb-3 group rounded-2xl animate-hue-rotate shadow-xl border-4 border-white/20">
                        {/* EFECTO CARTELERA DINAMICA */}
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 opacity-90"></div>
                        
                        {/* Decoración extra similar al cumple */}
                        <div className="absolute inset-0 pointer-events-none opacity-30">
                            <span className="absolute top-1 left-4 animate-floating text-xs">⚽</span>
                            <span className="absolute bottom-1 right-10 animate-floating text-xs" style={{animationDelay: '1s'}}>📢</span>
                            <span className="absolute top-2 right-4 animate-floating text-xs" style={{animationDelay: '0.5s'}}>🔥</span>
                        </div>

                        <div className="relative py-4 px-6 text-center shadow-2xl flex flex-col items-center justify-center min-h-[80px]">
                            <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.4em] mb-1 drop-shadow-sm">Comunicado Oficial</p>
                            <h2 className="text-lg md:text-2xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] leading-tight">
                                {announcement}
                            </h2>
                            
                            {/* LUCES LATERALES */}
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]"></div>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]"></div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};