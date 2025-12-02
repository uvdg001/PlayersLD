import React from 'react';
import type { Player } from '../types.ts';

interface BirthdayCardProps {
    players: Player[];
}

export const BirthdayCard: React.FC<BirthdayCardProps> = ({ players }) => {
    if (players.length === 0) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white p-6 rounded-lg shadow-xl text-center">
            <h3 className="text-xl font-bold mb-2">🎉 ¡Feliz Cumpleaños! 🎉</h3>
            <p className="text-md">Un saludo muy especial de todo el equipo para:</p>
            <div className="flex justify-center items-center gap-4 mt-4">
                {players.map(player => (
                    <div key={player.id} className="flex flex-col items-center">
                        {player.photoUrl ? (
                            <img src={player.photoUrl} alt={player.nickname} className="w-20 h-20 rounded-full object-cover border-2 border-white" />
                        ) : (
                             <div className="w-20 h-20 rounded-full bg-gray-200/50 flex items-center justify-center text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                             </div>
                        )}
                        <p className="font-bold text-lg mt-2">{player.nickname}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};