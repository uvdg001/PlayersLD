import React, { useState, useEffect } from 'react';
import type { Player, Page } from '../types.ts';

interface HeaderProps {
    currentUser: Player;
    onOpenRoster: () => void;
    onChangeUser: () => void;
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    isAdmin: boolean;
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
                    ? 'bg-indigo-600 text-white'
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

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="text-right text-xs text-gray-500 dark:text-gray-400 hidden md:block">
            <p className="font-semibold text-base">{time.toLocaleTimeString('es-AR')}</p>
            <p className="capitalize">{formatDate(time)}</p>
        </div>
    );
};

export const Header: React.FC<HeaderProps> = ({ currentUser, onOpenRoster, onChangeUser, currentPage, setCurrentPage, isAdmin }) => {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
            <div className="container mx-auto px-4 md:px-6 py-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-indigo-600 dark:text-indigo-400">
                            <path fillRule="evenodd" d="M3.75 4.5a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-3.375a3 3 0 0 0-5.25 0H4.5a.75.75 0 0 1-.75-.75V4.5Zm3.75 8.25a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Zm.75-2.25a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z" clipRule="evenodd" />
                            <path d="M12 16.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
                        </svg>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                            PLAYERS LD
                        </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                       <Clock />
                       <div className="flex items-center space-x-2">
                            {currentUser.photoUrl ? (
                                <img src={currentUser.photoUrl} alt={currentUser.nickname} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                               <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                               </div>
                            )}
                            <span className="font-semibold text-gray-700 dark:text-gray-200 hidden sm:block">{currentUser.nickname}</span>
                            <button onClick={onChangeUser} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Cambiar de usuario">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-600 dark:text-gray-300"><path fillRule="evenodd" d="M10.78 1.47a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06L17.69 12l-6.91-6.91a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /><path fillRule="evenodd" d="M2.25 12c0 .414.336.75.75.75h14.19l-6.91 6.91a.75.75 0 1 0 1.06 1.06l7.5-7.5a.75.75 0 0 0 0-1.06l-7.5-7.5a.75.75 0 1 0-1.06 1.06L17.19 11.25H3a.75.75 0 0 0-.75.75Z" clipRule="evenodd" /></svg>
                            </button>
                       </div>
                    </div>
                </div>
                 <nav className="mt-2 flex items-center justify-center flex-wrap gap-2 bg-gray-100 dark:bg-gray-700/50 p-2 rounded-lg">
                    <NavButton page="home" currentPage={currentPage} onClick={setCurrentPage}>Partido</NavButton>
                    <NavButton page="fixture" currentPage={currentPage} onClick={setCurrentPage}>Fixture</NavButton>
                    <NavButton page="tournaments" currentPage={currentPage} onClick={setCurrentPage}>Torneos</NavButton>
                    <NavButton page="venues" currentPage={currentPage} onClick={setCurrentPage}>Canchas</NavButton>
                    <NavButton page="opponents" currentPage={currentPage} onClick={setCurrentPage}>Rivales</NavButton>
                    <NavButton page="my-team" currentPage={currentPage} onClick={setCurrentPage}>Mi Equipo</NavButton>
                    <NavButton page="logistics" currentPage={currentPage} onClick={setCurrentPage}>Utilería</NavButton>
                    <NavButton page="statistics" currentPage={currentPage} onClick={setCurrentPage}>Estadísticas</NavButton>
                    <NavButton page="treasury" currentPage={currentPage} onClick={setCurrentPage}>Tesorería</NavButton>
                    <NavButton page="help" currentPage={currentPage} onClick={setCurrentPage}>Ayuda</NavButton>
                    {isAdmin && (
                        <button
                            onClick={onOpenRoster}
                            className="px-3 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            Plantilla
                        </button>
                    )}
                </nav>
            </div>
        </header>
    );
};