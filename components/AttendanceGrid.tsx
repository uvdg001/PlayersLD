import React, { useMemo } from 'react';
import type { Player, PlayerMatchStatus, MatchStatus } from '../types.ts';
import { AttendanceStatus, PlayerRole, PaymentStatus } from '../types.ts';
import { AttendanceGridItem } from './AttendanceGridItem.tsx';

interface AttendanceGridProps {
    playerStatuses: PlayerMatchStatus[];
    players: Player[];
    onPlayerStatusChange: (playerId: number, newStatus: AttendanceStatus) => void;
    onPlayerStatsChange: (playerId: number, field: keyof PlayerMatchStatus, value: any) => void;
    currentUser: Player;
    isAdmin: boolean;
    matchStatus?: MatchStatus;
    onViewProfile?: (player: Player) => void;
}

export const AttendanceGrid: React.FC<AttendanceGridProps> = ({ 
    playerStatuses, players, onPlayerStatusChange, onPlayerStatsChange, 
    currentUser, isAdmin, matchStatus, onViewProfile
}) => {

    const { staff, sortedFieldPlayers, confirmedCount, doubtfulCount, absentCount } = useMemo(() => {
        const allParticipants = players.map(player => {
            const savedStatus = playerStatuses.find(ps => ps.playerId === player.id);
            const stats: PlayerMatchStatus = savedStatus || {
                playerId: player.id,
                attendanceStatus: AttendanceStatus.PENDING,
                paymentStatus: PaymentStatus.UNPAID,
                amountPaid: 0,
                quartersPlayed: 4
            };
            return { player, status: stats.attendanceStatus, stats };
        });

        const staff = allParticipants.filter(p => p.player!.role === PlayerRole.DT || p.player!.role === PlayerRole.AYUDANTE);
        const fieldPlayers = allParticipants.filter(p => p.player!.role !== PlayerRole.DT && p.player!.role !== PlayerRole.AYUDANTE);

        const statusPriority: Record<AttendanceStatus, number> = {
            [AttendanceStatus.CONFIRMED]: 1,
            [AttendanceStatus.DOUBTFUL]: 2,
            [AttendanceStatus.PENDING]: 3,
            [AttendanceStatus.ABSENT]: 4,
        };

        const sortHybrid = (a: { player: Player, status: AttendanceStatus }, b: { player: Player, status: AttendanceStatus }) => {
            if (statusPriority[a.status] !== statusPriority[b.status]) return statusPriority[a.status] - statusPriority[b.status];
            return a.player.nickname.localeCompare(b.player.nickname);
        };

        return { 
            staff: staff.sort(sortHybrid), 
            sortedFieldPlayers: (matchStatus === 'FINALIZADO' ? fieldPlayers.filter(p => p.status !== AttendanceStatus.PENDING) : fieldPlayers).sort(sortHybrid), 
            confirmedCount: fieldPlayers.filter(p => p.status === AttendanceStatus.CONFIRMED).length, 
            doubtfulCount: fieldPlayers.filter(p => p.status === AttendanceStatus.DOUBTFUL).length, 
            absentCount: fieldPlayers.filter(p => p.status === AttendanceStatus.ABSENT).length
        };
    }, [playerStatuses, players, matchStatus]);


    const StatusCounter: React.FC<{ label: string; count: number; color: string }> = ({ label, count, color }) => (
        <div className={`text-center p-3 rounded-lg ${color}`}>
            <p className="font-bold text-2xl">{count}</p>
            <p className="text-sm uppercase font-semibold">{label}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-white">
                <StatusCounter label="Confirman" count={confirmedCount} color="bg-green-500" />
                <StatusCounter label="En Duda" count={doubtfulCount} color="bg-yellow-500" />
                <StatusCounter label="No Van" count={absentCount} color="bg-red-500" />
            </div>

            {staff.length > 0 && (
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">Cuerpo Técnico</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {staff.map(({ player, stats }) => (
                             <AttendanceGridItem
                                key={player!.id}
                                player={player!}
                                playerStatus={stats}
                                onStatusChange={(newStatus) => onPlayerStatusChange(player!.id, newStatus)}
                                onPlayerStatsChange={onPlayerStatsChange}
                                currentUser={currentUser}
                                isAdmin={isAdmin}
                                matchStatus={matchStatus}
                                onViewProfile={onViewProfile}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">Jugadores</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedFieldPlayers.map(({ player, stats }) => (
                         <AttendanceGridItem
                            key={player!.id}
                            player={player!}
                            playerStatus={stats}
                            onStatusChange={(newStatus) => onPlayerStatusChange(player!.id, newStatus)}
                            onPlayerStatsChange={onPlayerStatsChange}
                            currentUser={currentUser}
                            isAdmin={isAdmin}
                            matchStatus={matchStatus}
                            onViewProfile={onViewProfile}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};