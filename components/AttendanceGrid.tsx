
import React, { useMemo } from 'react';
import type { Player, PlayerMatchStatus, MatchStatus } from '../types.ts';
import { AttendanceStatus, PlayerRole } from '../types.ts';
import { AttendanceGridItem } from './AttendanceGridItem.tsx';

interface AttendanceGridProps {
    playerStatuses: PlayerMatchStatus[];
    players: Player[];
    onPlayerStatusChange: (playerId: number, newStatus: AttendanceStatus) => void;
    currentUser: Player;
    isAdmin: boolean;
    matchStatus?: MatchStatus;
}

export const AttendanceGrid: React.FC<AttendanceGridProps> = ({ playerStatuses, players, onPlayerStatusChange, currentUser, isAdmin, matchStatus }) => {

    const { staff, sortedFieldPlayers, confirmedCount, doubtfulCount, absentCount } = useMemo(() => {
        
        const allParticipants = playerStatuses.map(ps => {
            const player = players.find(p => p.id === ps.playerId);
            return { player, status: ps.attendanceStatus };
        }).filter(item => item.player);

        const staff = allParticipants.filter(p => p.player!.role === PlayerRole.DT || p.player!.role === PlayerRole.AYUDANTE);
        const fieldPlayers = allParticipants.filter(p => p.player!.role !== PlayerRole.DT && p.player!.role !== PlayerRole.AYUDANTE);

        // Lógica de Ordenamiento Híbrido:
        // 1. Por Estado (Confirmado > Duda > Ausente > Pendiente)
        // 2. Alfabético por Apodo/Nombre
        const statusPriority: Record<AttendanceStatus, number> = {
            [AttendanceStatus.CONFIRMED]: 1,
            [AttendanceStatus.DOUBTFUL]: 2,
            [AttendanceStatus.ABSENT]: 3,
            [AttendanceStatus.PENDING]: 4,
        };

        const sortHybrid = (a: { player: Player | undefined, status: AttendanceStatus }, b: { player: Player | undefined, status: AttendanceStatus }) => {
            // Comparar estado primero
            const priorityA = statusPriority[a.status];
            const priorityB = statusPriority[b.status];
            
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            // Si el estado es igual, alfabético
            const nameA = a.player!.nickname || a.player!.firstName;
            const nameB = b.player!.nickname || b.player!.firstName;
            return nameA.localeCompare(nameB);
        };

        const sortedFieldPlayers = fieldPlayers.sort(sortHybrid);
        
        // El staff se mantiene alfabético puro o por jerarquía, aquí usamos híbrido también para consistencia visual
        staff.sort(sortHybrid);

        // Contadores SOLO de jugadores de campo
        const confirmedCount = fieldPlayers.filter(p => p.status === AttendanceStatus.CONFIRMED).length;
        const doubtfulCount = fieldPlayers.filter(p => p.status === AttendanceStatus.DOUBTFUL).length;
        const absentCount = fieldPlayers.filter(p => p.status === AttendanceStatus.ABSENT).length;
        
        return { staff, sortedFieldPlayers, confirmedCount, doubtfulCount, absentCount };

    }, [playerStatuses, players]);


    const StatusCounter: React.FC<{ label: string; count: number; color: string }> = ({ label, count, color }) => (
        <div className={`text-center p-3 rounded-lg ${color}`}>
            <p className="font-bold text-2xl">{count}</p>
            <p className="text-sm uppercase font-semibold">{label}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Convocatoria</h3>
            <div className="grid grid-cols-3 gap-4 text-white">
                <StatusCounter label="Confirman" count={confirmedCount} color="bg-green-500" />
                <StatusCounter label="En Duda" count={doubtfulCount} color="bg-yellow-500" />
                <StatusCounter label="No Van" count={absentCount} color="bg-red-500" />
            </div>

            {staff.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Cuerpo Técnico</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {staff.map(({ player, status }) => (
                             <AttendanceGridItem
                                key={player!.id}
                                player={player!}
                                status={status}
                                onStatusChange={(newStatus) => onPlayerStatusChange(player!.id, newStatus)}
                                currentUser={currentUser}
                                isAdmin={isAdmin}
                                matchStatus={matchStatus}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Jugadores</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {sortedFieldPlayers.map(({ player, status }) => (
                         <AttendanceGridItem
                            key={player!.id}
                            player={player!}
                            status={status}
                            onStatusChange={(newStatus) => onPlayerStatusChange(player!.id, newStatus)}
                            currentUser={currentUser}
                            isAdmin={isAdmin}
                            matchStatus={matchStatus}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};