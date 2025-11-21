
import React from 'react';
import type { Teams } from '../types';

const TeamColumn: React.FC<{ title: string; players: string[], color: string }> = ({ title, players, color }) => (
    <div className="flex-1">
        <h4 className={`text-lg font-bold mb-3 p-2 rounded-t-md text-white ${color}`}>{title}</h4>
        <ul className="space-y-2">
            {players.map((player, index) => (
                <li key={index} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                    </svg>
                    {player}
                </li>
            ))}
        </ul>
    </div>
);


export const TeamLineup: React.FC<{ teams: Teams }> = ({ teams }) => {
    return (
        <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-gray-200">
                <span role="img" aria-label="sparkles">✨</span> Alineaciones Sugeridas por IA <span role="img" aria-label="sparkles">✨</span>
            </h3>
            <div className="flex flex-col md:flex-row gap-6">
                <TeamColumn title="Equipo 1 (Blancos)" players={teams.teamA} color="bg-gray-400" />
                <TeamColumn title="Equipo 2 (Azules)" players={teams.teamB} color="bg-blue-600" />
            </div>
        </div>
    );
};
