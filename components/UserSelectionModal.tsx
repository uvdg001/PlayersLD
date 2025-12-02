import React, { useState } from 'react';
import type { Player } from '../types.ts';

export const UserSelectionModal: React.FC<{
    players: Player[];
    onSelectUser: (player: Player) => void;
    isPinAuthEnabled: boolean;
    onTogglePinAuth: () => void;
}> = ({ players, onSelectUser, isPinAuthEnabled, onTogglePinAuth }) => {
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedPlayer && pin === selectedPlayer.pin) {
            onSelectUser(selectedPlayer);
        } else {
            setError('PIN incorrecto. Intenta de nuevo.');
            setPin('');
        }
    };

    const handleSelectPlayer = (player: Player) => {
        if (!isPinAuthEnabled) {
            onSelectUser(player);
        } else {
            setSelectedPlayer(player);
            setError('');
            setPin('');
        }
    };

    const handleGoBack = () => {
        setSelectedPlayer(null);
        setError('');
        setPin('');
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transition-all duration-300">
                {!selectedPlayer ? (
                    <>
                        <header className="text-center p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">¿Quién está jugando?</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Selecciona tu perfil para continuar</p>
                        </header>
                        <main className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {players.map(player => (
                                    <button
                                        key={player.id}
                                        onClick={() => handleSelectPlayer(player)}
                                        className="flex flex-col items-center p-3 space-y-2 rounded-lg text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 group"
                                    >
                                        {player.photoUrl ? (
                                            <img src={player.photoUrl} alt={player.nickname} className="w-24 h-24 rounded-full object-cover border-4 border-transparent group-focus:border-indigo-500" />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                                            </div>
                                        )}
                                        <p className="font-bold text-gray-800 dark:text-gray-200">{player.nickname}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{player.firstName}</p>
                                    </button>
                                ))}
                            </div>
                        </main>
                        <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                            <div className="flex items-center space-x-2">
                                <label htmlFor="admin-toggle" className="text-sm font-medium text-gray-600 dark:text-gray-300">Omitir PIN (Modo Admin)</label>
                                <button
                                    role="switch"
                                    aria-checked={!isPinAuthEnabled}
                                    onClick={onTogglePinAuth}
                                    id="admin-toggle"
                                    className={`${
                                        !isPinAuthEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                                >
                                <span
                                    className={`${
                                    !isPinAuthEnabled ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                                </button>
                            </div>
                        </footer>
                    </>
                ) : (
                    <div className="p-8 flex flex-col items-center justify-center">
                        {selectedPlayer.photoUrl ? (
                           <img src={selectedPlayer.photoUrl} alt={selectedPlayer.nickname} className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-indigo-500" />
                        ) : (
                           <div className="w-32 h-32 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 mb-4 border-4 border-indigo-500">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                           </div>
                        )}
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Hola, {selectedPlayer.firstName}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6">Ingresa tu PIN de 4 dígitos para continuar</p>

                        <form onSubmit={handlePinSubmit} className="flex flex-col items-center w-full max-w-xs">
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => {
                                    if (/^\d*$/.test(e.target.value)) {
                                        setPin(e.target.value)
                                    }
                                }}
                                maxLength={4}
                                required
                                autoFocus
                                className="w-48 text-center text-4xl tracking-[1em] p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                            <div className="flex items-center gap-4 mt-6">
                                <button type="button" onClick={handleGoBack} className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 rounded-md">
                                    Volver
                                </button>
                                <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm">
                                    Entrar
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};