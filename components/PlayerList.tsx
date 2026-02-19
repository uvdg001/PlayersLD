import React, { useMemo } from 'react';
import { type Player, type PlayerMatchStatus, AttendanceStatus, PaymentStatus } from '../types.ts';
import { PlayerListItem } from './PlayerListItem.tsx';

interface PlayerListProps {
    playerStatuses: PlayerMatchStatus[];
    players: Player[];
    onPlayerStatusChange: (playerId: number, newStatus: AttendanceStatus) => void;
    onPlayerPaymentChange: (playerId: number, newStatus: PaymentStatus, amount: number) => void;
    onPlayerStatsChange: (playerId: number, field: keyof PlayerMatchStatus, value: any) => void;
    playerShare: number;
    isAdmin: boolean;
}

const StatusCounter: React.FC<{ label: string; count: number; color: string }> = ({ label, count, color }) => (
    <div className={`text-center p-3 rounded-lg ${color}`}>
        <p className="font-bold text-2xl">{count}</p>
        <p className="text-sm uppercase font-semibold">{label}</p>
    </div>
);

export const PlayerList: React.FC<PlayerListProps> = ({ playerStatuses, players, onPlayerStatusChange, onPlayerPaymentChange, onPlayerStatsChange, playerShare, isAdmin }) => {
    const confirmedCount = playerStatuses.filter(p => p.attendanceStatus === AttendanceStatus.CONFIRMED).length;
    const doubtfulCount = playerStatuses.filter(p => p.attendanceStatus === AttendanceStatus.DOUBTFUL).length;
    const absentCount = playerStatuses.filter(p => p.attendanceStatus === AttendanceStatus.ABSENT).length;

    const sortedPlayerStatuses = useMemo(() => {
        const statusOrder: Record<AttendanceStatus, number> = {
            [AttendanceStatus.CONFIRMED]: 1,
            [AttendanceStatus.DOUBTFUL]: 2,
            [AttendanceStatus.PENDING]: 3,
            [AttendanceStatus.ABSENT]: 4,
        };

        return [...playerStatuses].sort((a, b) => {
            const playerA = players.find(p => p.id === a.playerId);
            const playerB = players.find(p => p.id === b.playerId);

            if (!playerA || !playerB) return 0;

            const statusComparison = statusOrder[a.attendanceStatus] - statusOrder[b.attendanceStatus];
            if (statusComparison !== 0) {
                return statusComparison;
            }

            return playerA.lastName.localeCompare(playerB.lastName);
        });
    }, [playerStatuses, players]);


    return (
        <div>
            <h3 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">Lista de Convocados ({players.length})</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6 text-white">
                <StatusCounter label="Confirman" count={confirmedCount} color="bg-green-500" />
                <StatusCounter label="En Duda" count={doubtfulCount} color="bg-yellow-500" />
                <StatusCounter label="No Van" count={absentCount} color="bg-red-500" />
            </div>

            <div className="space-y-2">
                {sortedPlayerStatuses.map(ps => {
                    const player = players.find(p => p.id === ps.playerId);
                    if (!player) return null;
                    return (
                        <PlayerListItem
                            key={player.id}
                            player={player}
                            playerStatus={ps}
                            onPlayerStatusChange={onPlayerStatusChange}
                            onPlayerPaymentChange={onPlayerPaymentChange}
                            onPlayerStatsChange={onPlayerStatsChange}
                            playerShare={playerShare}
                            isAdmin={isAdmin}
                        />
                    );
                })}
            </div>
        </div>
    );
};