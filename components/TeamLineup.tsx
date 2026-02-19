
import React from 'react';
import type { Teams, Player } from '../types.ts';
import { RoleIcon } from './icons.tsx';

const TeamColumn: React.FC<{ title: string; players: Player[], color: string, badgeColor: string }> = ({ title, players, color, badgeColor }) => (
    <div className="flex-1 bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border-2 border-gray-100 dark:border-gray-700">
        <h4 className={`text-xl font-black mb-1 p-4 text-center text-white uppercase italic tracking-tighter ${color}`}>{title}</h4>
        <div className="p-4 space-y-3">
            {players.length > 0 ? players.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img src={player.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white border border-white ${badgeColor}`}>
                                {player.jerseyNumber || '?'}
                            </div>
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 dark:text-gray-100 leading-none">{player.nickname}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <RoleIcon role={player.role} className="w-3 h-3 text-gray-400" />
                                <span className="text-[9px] font-bold text-gray-400 uppercase">{player.role.split(' ')[0]}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-yellow-500 font-bold text-xs">
                        {Array(player.skillLevel).fill('★').join('')}
                    </div>
                </div>
            )) : <p className="text-center py-10 text-gray-400 italic text-sm">Sin jugadores asignados</p>}
        </div>
    </div>
);


export const TeamLineup: React.FC<{ teams: Teams }> = ({ teams }) => {
    const totalPlayers = teams.teamA.length + teams.teamB.length;
    
    // Lógica de formación sugerida
    const getFormation = (count: number) => {
        if (count === 10) return "Sistema: 1 - 2 - 2";
        if (count === 12) return "Sistema: 1 - 2 - 2 - 1";
        if (count === 14) return "Sistema: 1 - 3 - 2 - 1";
        return "Formación Abierta";
    };

    return (
        <div className="mt-10 p-2 md:p-8 bg-indigo-50 dark:bg-indigo-950/20 rounded-[3rem] animate-fadeIn border-2 border-indigo-100 dark:border-indigo-900/30">
            <div className="text-center mb-8">
                <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">Sorteo de Equipos</span>
                <h3 className="text-4xl font-black mt-3 text-gray-800 dark:text-gray-100 italic uppercase tracking-tighter">
                    <span className="text-red-600">ROJO</span> <span className="text-gray-400">vs</span> <span className="text-emerald-600">VERDE</span>
                </h3>
                <p className="text-gray-500 font-bold mt-1 uppercase text-xs tracking-widest">{getFormation(totalPlayers)}</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <TeamColumn title="Equipo Rojo" players={teams.teamA} color="bg-red-600" badgeColor="bg-red-700" />
                
                <div className="hidden lg:flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-xl border-4 border-indigo-100 dark:border-gray-700 font-black text-indigo-600 italic">VS</div>
                </div>

                <TeamColumn title="Equipo Verde" players={teams.teamB} color="bg-emerald-600" badgeColor="bg-emerald-700" />
            </div>

            <div className="mt-8 bg-white/50 dark:bg-gray-800/30 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">💡 El sistema enfrentó a los jugadores con el mismo número para equilibrar el partido.</p>
            </div>
        </div>
    );
};
