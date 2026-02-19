import React, { useState } from 'react';
import type { Opponent } from '../../types.ts';
import { OpponentForm } from '../forms/OpponentForm.tsx';
import { StarRating } from '../StarRating.tsx';

interface OpponentsPageProps {
    opponents: Opponent[];
    onAddOpponent: (newOpponent: Omit<Opponent, 'id'>) => void;
    onUpdateOpponent: (opponent: Opponent) => void;
    onDeleteOpponent: (opponentId: number) => void;
    isAdmin: boolean;
}

export const OpponentsPage: React.FC<OpponentsPageProps> = ({ opponents, onAddOpponent, onUpdateOpponent, onDeleteOpponent, isAdmin }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingOpponent, setEditingOpponent] = useState<Opponent | null>(null);

    const handleEdit = (opponent: Opponent) => {
        setEditingOpponent(opponent);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingOpponent(null);
        setIsFormOpen(true);
    };
    
    const handleSave = (data: Opponent | Omit<Opponent, 'id'>) => {
        if ('id' in data) {
            onUpdateOpponent(data);
        } else {
            onAddOpponent(data);
        }
        setIsFormOpen(false);
    };

    const handleSecureDelete = (opponent: Opponent) => {
        const confirmation = window.prompt(`⚠️ ¿Seguro que quieres eliminar a este rival?\n\nPara confirmar, escribe: ELIMINAR`);
        if (confirmation === "ELIMINAR") {
            onDeleteOpponent(opponent.id);
        } else if (confirmation !== null) {
            alert("Acción cancelada. Debes escribir 'ELIMINAR'.");
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Rivales</h2>
                {isAdmin && (
                    <button
                        onClick={handleAddNew}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                    >
                        Agregar Rival
                    </button>
                )}
            </div>

            {isFormOpen && (
                <div className="mb-6 p-4 border rounded-lg dark:border-gray-700">
                    <OpponentForm
                        opponent={editingOpponent}
                        onSave={handleSave}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </div>
            )}

            <div className="space-y-3">
                {opponents.map(opponent => (
                    <div key={opponent.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-4">
                            {opponent.shieldUrl ? (
                                <img src={opponent.shieldUrl} alt={opponent.name} className="w-12 h-12 rounded-full object-contain bg-white p-1" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Zm-1.5 6-3.75 3.75" /></svg>
                                </div>
                            )}
                            <div>
                                <div className="flex items-center space-x-2">
                                     {opponent.jerseyColor && (
                                        <div className="w-4 h-4 rounded-full border-2 border-gray-400" style={{ backgroundColor: opponent.jerseyColor }} title={`Color: ${opponent.jerseyColor}`}></div>
                                    )}
                                    <p className="font-bold text-gray-800 dark:text-gray-200">{opponent.name}</p>
                                </div>
                                <StarRating rating={opponent.skillLevel || 0} />
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => handleEdit(opponent)} className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                            </button>
                            <button onClick={() => handleSecureDelete(opponent)} className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};