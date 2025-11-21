import React, { useState } from 'react';
import type { Player } from '../types';
import { PlayerForm } from './PlayerForm';
import { StarRating } from './StarRating';
import { RoleIcon } from './icons';

interface RosterManagementModalProps {
    players: Player[];
    onClose: () => void;
    onAddPlayer: (newPlayer: Omit<Player, 'id'>) => void;
    onUpdatePlayer: (player: Player) => void;
    onDeletePlayer: (playerId: number) => void;
}

export const RosterManagementModal: React.FC<RosterManagementModalProps> = ({
    players,
    onClose,
    onAddPlayer,
    onUpdatePlayer,
    onDeletePlayer,
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

    const handleEdit = (player: Player) => {
        setEditingPlayer(player);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingPlayer(null);
        setIsFormOpen(true);
    };

    const handleSavePlayer = (playerData: Player | Omit<Player, 'id'>) => {
        if ('id' in playerData) {
            onUpdatePlayer(playerData);
        } else {
            onAddPlayer(playerData);
        }
        setIsFormOpen(false);
        setEditingPlayer(null);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestión de Plantilla</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <main className="p-6 overflow-y-auto">
                    {isFormOpen ? (
                        <PlayerForm
                            player={editingPlayer}
                            onSave={handleSavePlayer}
                            onCancel={() => setIsFormOpen(false)}
                        />
                    ) : (
                        <>
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={handleAddNew}
                                    className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                                >
                                    Agregar Nuevo Jugador
                                </button>
                            </div>
                            <div className="space-y-3">
                                {players.map(player => (
                                    <div key={player.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        <div className="flex items-center space-x-4">
                                            {player.photoUrl ? (
                                                <img src={player.photoUrl} alt={player.nickname} className="w-12 h-12 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-gray-200">{player.firstName} "{player.nickname}" {player.lastName}</p>
                                                <div className="flex items-center space-x-2">
                                                   <div title={player.role}>
                                                        <RoleIcon role={player.role} className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                   </div>
                                                   <StarRating rating={player.skillLevel} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleEdit(player)} className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                            </button>
                                            <button onClick={() => onDeletePlayer(player.id)} className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};