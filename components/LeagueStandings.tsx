
import React, { useState, useEffect } from 'react';
import type { TeamStanding } from '../types.ts';

interface EditablePositionProps {
    position: number;
    onSave: (newPosition: number) => void;
}

const EditablePosition: React.FC<EditablePositionProps> = ({ position, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(position.toString());

    useEffect(() => {
        setValue(position.toString());
    }, [position]);

    const handleSave = () => {
        const newPosition = parseInt(value, 10);
        if (!isNaN(newPosition) && newPosition > 0) {
            onSave(newPosition);
        } else {
            setValue(position.toString()); // Reset if invalid
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
             <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="w-16 text-center bg-white dark:bg-gray-800 border border-blue-500 rounded-md text-gray-700 dark:text-gray-200"
                autoFocus
            />
        );
    }

    return (
        <div 
            onClick={() => setIsEditing(true)} 
            className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded-md transition-colors"
            title="Clic para editar posición"
        >
             <span className="text-sm text-gray-500 dark:text-gray-400">Posición:</span>
            <span className="ml-2 font-bold text-lg text-gray-800 dark:text-gray-100">({position})</span>
        </div>
    );
};


interface LeagueStandingsProps {
    round: number;
    standings: TeamStanding[];
    onPositionChange: (teamId: number, newPosition: number) => void;
}

export const LeagueStandings: React.FC<LeagueStandingsProps> = ({ round, standings, onPositionChange }) => {
    if (!standings || standings.length < 2) {
        return null;
    }
    
    const [teamA, teamB] = standings;

    return (
        <div className="my-6 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="text-center font-bold text-lg mb-4 text-gray-700 dark:text-gray-300">
                Torneo Apertura - Fecha {round}
            </h3>
            <div className="flex justify-around items-center">
                <div className="flex flex-col items-center space-y-2">
                     <p className="font-semibold text-xl text-gray-800 dark:text-gray-100">{teamA.name}</p>
                    <EditablePosition 
                        position={teamA.position} 
                        onSave={(newPos) => onPositionChange(teamA.id, newPos)} 
                    />
                </div>
                
                <div className="text-4xl font-black text-gray-400 dark:text-gray-500 self-center">VS</div>

                <div className="flex flex-col items-center space-y-2">
                    <p className="font-semibold text-xl text-gray-800 dark:text-gray-100">{teamB.name}</p>
                    <EditablePosition 
                        position={teamB.position} 
                        onSave={(newPos) => onPositionChange(teamB.id, newPos)} 
                    />
                </div>
            </div>
        </div>
    );
};