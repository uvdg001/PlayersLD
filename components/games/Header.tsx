
import React, { useState, useEffect } from 'react';
import type { Player, Page } from '../../types.ts';
import { useLanguage } from '../../contexts/LanguageContext.tsx';

interface HeaderProps {
    currentUser: Player;
    onOpenRoster: () => void;
    onChangeUser: () => void;
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    isAdmin: boolean;
    onEditProfile: () => void;
    installPrompt: any;
    onInstallApp: () => void;
    isFirebaseOnline: boolean;
    announcement?: string;
    onUpdateAnnouncement?: (text: string) => void;
    canEditAnnouncement?: boolean;
    notificationPermission: NotificationPermission;
    onRequestNotificationPermission: () => void;
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
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
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
        <div className="text-right text-xs text-gray-500 dark:text-gray-400 hidden md:block">
            <p className="font-semibold text-base">{time.toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}</p>
        </div>
    );
};

export const Header: React.FC<HeaderProps> = ({ 
    currentUser, onOpenRoster, currentPage, setCurrentPage, 
    isAdmin, onEditProfile, installPrompt, onInstallApp, isFirebaseOnline,
    announcement, onUpdateAnnouncement, canEditAnnouncement,
    notificationPermission, onRequestNotificationPermission
}) => {
    const { language, setLanguage, t } = useLanguage();

    const handleEditAnnouncement = () => {
        if (!onUpdateAnnouncement) return;
        const newText = window.prompt("📣 Escribe el anuncio del Cuerpo Técnico (o deja vacío para borrar):", announcement || "");
        if (newText !== null) {
            onUpdateAnnouncement(newText);
        }
    };

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
            <div className="container mx-auto px-4 md:px-6 py-3">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-3">
                        {currentPage !== 'home' && (
                            <button onClick={() => setCurrentPage('home')} className="text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded-full" title={t.back}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                </svg>
                            </button>
                        )}
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white truncate">
                            {t.appTitle}
                        </h1>
                        <div className={`flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${isFirebaseOnline ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300'}`}>
                            <div className={`w-2 h-2 rounded-full mr-1 ${isFirebaseOnline ? 'bg-green-500 animate-pulse' : 'bg-red-50'}`}></div>
                            {isFirebaseOnline ? 'ONLINE' : 'LOCAL'}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-3">
                        <div className="hidden sm:flex space-x-1">
                            <button onClick={() => setLanguage('es')} className={`text-xl ${language === 'es' ? 'opacity-100 scale-110' : 'opacity-50'}`}>🇪🇸</button>
                            <button onClick={() => setLanguage('en')} className={`text-xl ${language === 'en' ? 'opacity-100 scale-110' : 'opacity-50'}`}>🇺🇸</button>
                            <button onClick={() => setLanguage('pt')} className={`text-xl ${language === 'pt' ? 'opacity-100 scale-110' : 'opacity-50'}`}>🇧🇷</button>
                        </div>
                        
                        <button 
                            onClick={() => setCurrentPage('chat')}
                            className={`p-2 rounded-full transition-all md:hidden ${currentPage === 'chat' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-red-500'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path d="M4.913 2.658c2.326-.305 4.695-.451 7.087-.432 2.392-.019 4.761.127 7.087.432 1.944.254 3.413 1.944 3.413 3.9v6.024c0 1.956-1.469 3.646-3.413 3.9-2.326.305-4.695.451-7.087.432-2.392.019-4.761-.127-7.087-.432C2.969 16.252 1.5 14.562 1.5 12.606V6.558c0-1.956 1.469-3.646 3.413-3.9ZM12 11.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 0a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm6 0a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
                            </svg>
                        </button>

                        <button 
                            onClick={onRequestNotificationPermission}
                            className={`p-2 rounded-full transition-all ${
                                notificationPermission === 'granted' 
                                    ? 'text-green-500 hover:bg-green-100 dark:hover:bg-green-900/20' 
                                    : notificationPermission === 'denied'
                                        ? 'text-red-500 bg-red-100 dark:bg-red-900/20 animate-pulse'
                                        : 'text-gray-400 hover:text-indigo-500'
                            }`}
                        >
                            {notificationPermission === 'granted' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z" clipRule="evenodd" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M5.85 3.5a.75.75 0 0 0-1.117-1 9.719 9.719 0 0 0-2.348 4.876.75.75 0 0 0 1.479.248A8.219 8.219 0 0 1 5.85 3.5ZM19.267 2.5a.75.75 0 1 0-1.118 1 8.22 8.22 0 0 1 1.987 4.124.75.75 0 0 0 1.48-.248A9.72 9.72 0 0 0 19.266 2.5Z" /><path fillRule="evenodd" d="M12 2.25A6.75 6.75 0 0 0 5.25 9v.75a8.217 8.217 0 0 1-2.119 5.52.75.75 0 0 0 .298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 1 0 7.48 0 24.583 24.583 0 0 0 4.831-1.244.75.75 0 0 0 .297-1.206 8.217 8.217 0 0 1-2.118-5.52V9A6.75 6.75 0 0 0 12 2.25ZM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 0 0 4.496 0l.002.1a2.25 2.25 0 1 1-4.5 0Z" clipRule="evenodd" /></svg>
                            )}
                        </button>

                        {canEditAnnouncement && (
                            <button onClick={handleEditAnnouncement} className="p-2 text-orange-500 hover:bg-orange-100 rounded-full transition-colors" title="Publicar Anuncio">
                                📢
                            </button>
                        )}

                        {installPrompt && (
                            <button onClick={onInstallApp} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hidden sm:block animate-pulse">
                                📲 {t.installApp}
                            </button>
                        )}

                       <Clock />
                       
                       <div className="flex items-center space-x-2 border-l pl-2 md:pl-3 border-gray-300 dark:border-gray-600">
                            {currentUser.photoUrl ? (
                                <img src={currentUser.photoUrl} alt={currentUser.nickname} className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-80" onClick={onEditProfile} />
                            ) : (
                               <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 cursor-pointer hover:opacity-80" onClick={onEditProfile}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                               </div>
                            )}
                       </div>
                    </div>
                </div>
                
                {announcement && (
                    <div className="mb-2 bg-gradient-to-r from-orange-400 to-red-500 text-white p-2 rounded-lg shadow text-center text-sm font-bold flex items-center justify-center gap-2 animate-pulse">
                        <span>📢</span>
                        <span>{announcement}</span>
                    </div>
                )}

                 <nav className="flex items-center justify-start overflow-x-auto gap-2 bg-gray-100 dark:bg-gray-700/50 p-2 rounded-lg scrollbar-hide">
                    <NavButton page="home" currentPage={currentPage} onClick={setCurrentPage}>{t.home}</NavButton>
                    <NavButton page="chat" currentPage={currentPage} onClick={setCurrentPage}>💬 Chat</NavButton>
                    <NavButton page="standings-photos" currentPage={currentPage} onClick={setCurrentPage}>📊 Posiciones</NavButton>
                    <NavButton page="ratings" currentPage={currentPage} onClick={setCurrentPage}>{t.ratings}</NavButton>
                    <NavButton page="stopwatch" currentPage={currentPage} onClick={setCurrentPage}>⏱️ Cronómetro</NavButton>
                    <NavButton page="entertainment" currentPage={currentPage} onClick={setCurrentPage}>🎮 Arcade</NavButton>
                    <NavButton page="third-half" currentPage={currentPage} onClick={setCurrentPage}>{t.thirdHalf}</NavButton>
                    <NavButton page="fixture" currentPage={currentPage} onClick={setCurrentPage}>{t.fixture}</NavButton>
                    <NavButton page="tournaments" currentPage={currentPage} onClick={setCurrentPage}>{t.tournaments}</NavButton>
                    <NavButton page="venues" currentPage={currentPage} onClick={setCurrentPage}>{t.venues}</NavButton>
                    <NavButton page="opponents" currentPage={currentPage} onClick={setCurrentPage}>{t.rivals}</NavButton>
                    <NavButton page="my-team" currentPage={currentPage} onClick={setCurrentPage}>{t.myTeam}</NavButton>
                    <NavButton page="logistics" currentPage={currentPage} onClick={setCurrentPage}>{t.logistics}</NavButton>
                    <NavButton page="statistics" currentPage={currentPage} onClick={setCurrentPage}>{t.stats}</NavButton>
                    <NavButton page="treasury" currentPage={currentPage} onClick={setCurrentPage}>{t.treasury}</NavButton>
                    <NavButton page="help" currentPage={currentPage} onClick={setCurrentPage}>{t.help}</NavButton>
                    {isAdmin && (
                        <button
                            onClick={onOpenRoster}
                            className="px-3 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 whitespace-nowrap"
                        >
                            {t.roster}
                        </button>
                    )}
                </nav>
            </div>
        </header>
    );
};
