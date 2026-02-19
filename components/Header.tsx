
import React, { useState, useEffect } from 'react';
import type { Player, Page } from '../types.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface HeaderProps {
    currentUser: Player;
    onOpenRoster: () => void;
    onChangeUser: () => void;
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    isAdmin: boolean;
    onEditProfile: () => void;
    isFirebaseOnline: boolean;
    announcement?: string;
    onUpdateAnnouncement?: (text: string) => void;
    canEditAnnouncement?: boolean;
    notificationPermission: NotificationPermission;
    onRequestNotificationPermission: () => void;
    hideNav?: boolean; // NUEVA PROP PARA V2
}

const NavButton: React.FC<{
    page: Page;
    currentPage: Page;
    onClick: (page: Page) => void;
    children: React.ReactNode;
}> = ({ page, currentPage, onClick, children }) => {
    const isActive = currentPage === page;
    return (
        <button
            onClick={() => onClick(page)}
            className={`px-3 py-2 text-xs font-black rounded-lg transition-all whitespace-nowrap border-2 ${
                isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
            {children}
        </button>
    );
};

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
    currentUser, onOpenRoster, onChangeUser, currentPage, setCurrentPage, 
    isAdmin, onEditProfile, isFirebaseOnline,
    announcement, onUpdateAnnouncement, canEditAnnouncement,
    notificationPermission, onRequestNotificationPermission,
    hideNav = false
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
                        <h1 className="text-xl md:text-4xl font-black text-gray-800 dark:text-white truncate tracking-tighter uppercase italic">
                            {t.appTitle.split(' ')[0]} <span className="text-indigo-600">{t.appTitle.split(' ')[1]}</span>
                        </h1>
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
                            <button 
                                onClick={onChangeUser}
                                className="p-1.5 bg-red-600 text-white hover:bg-red-700 rounded-full transition-all active:scale-90 shadow-md"
                                title="Salir"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H9a.75.75 0 0 1 0-1.5h10.94l-1.72-1.72a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                </svg>
                            </button>

                            <div className="relative flex-shrink-0">
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
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* TARJETA DE ANUNCIOS */}
                {announcement && (
                    <div className="mb-3 bg-gradient-to-r from-orange-500 via-red-600 to-orange-500 text-white py-4 px-4 rounded-xl shadow-xl text-center text-sm md:text-base font-black uppercase tracking-tighter animate-pulse border-b-4 border-black/20">
                        📢 {announcement}
                    </div>
                )}

                {/* MENÚ DE NAVEGACIÓN - OCULTO EN V2 SI SE PIDE */}
                {!hideNav && (
                    <nav className="flex items-center justify-start overflow-x-auto gap-1.5 py-2 scrollbar-hide">
                        <NavButton page="home" currentPage={currentPage} onClick={setCurrentPage}>{t.home}</NavButton>
                        <NavButton page="chat" currentPage={currentPage} onClick={setCurrentPage}>💬 Chat</NavButton>
                        <NavButton page="third-half" currentPage={currentPage} onClick={setCurrentPage}>🍻 3er Tiempo</NavButton>
                        <NavButton page="fixture" currentPage={currentPage} onClick={setCurrentPage}>📅 {t.fixture}</NavButton>
                        <NavButton page="standings-photos" currentPage={currentPage} onClick={setCurrentPage}>📊 Posiciones</NavButton>
                        <NavButton page="ratings" currentPage={currentPage} onClick={setCurrentPage}>{t.ratings}</NavButton>
                        <NavButton page="tournaments" currentPage={currentPage} onClick={setCurrentPage}>🏆 Torneos</NavButton>
                        <NavButton page="venues" currentPage={currentPage} onClick={setCurrentPage}>🏟️ Canchas</NavButton>
                        <NavButton page="opponents" currentPage={currentPage} onClick={setCurrentPage}>🛡️ Rivales</NavButton>
                        <NavButton page="logistics" currentPage={currentPage} onClick={setCurrentPage}>👕 Vestuario</NavButton>
                        <NavButton page="stopwatch" currentPage={currentPage} onClick={setCurrentPage}>⏱️ Reloj</NavButton>
                        <NavButton page="statistics" currentPage={currentPage} onClick={setCurrentPage}>📈 Stats</NavButton>
                        <NavButton page="treasury" currentPage={currentPage} onClick={setCurrentPage}>💰 Tesorería</NavButton>
                        <NavButton page="my-team" currentPage={currentPage} onClick={setCurrentPage}>⭐ Mi Equipo</NavButton>
                        <NavButton page="entertainment" currentPage={currentPage} onClick={setCurrentPage}>🎮 Arcade</NavButton>
                        <NavButton page="help" currentPage={currentPage} onClick={setCurrentPage}>❓ Ayuda</NavButton>
                        
                        {isAdmin && (
                            <button
                                onClick={onOpenRoster}
                                className="px-3 py-2 text-xs font-black rounded-lg text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-800 whitespace-nowrap shadow-sm"
                            >
                                👥 {t.roster}
                            </button>
                        )}
                    </nav>
                )}
            </div>
        </header>
    );
};
