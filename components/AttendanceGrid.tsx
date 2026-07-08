import React, { useMemo, useState } from 'react';
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
    match: any; // Pasamos los datos del partido
    matchStatus?: MatchStatus;
    onViewProfile?: (player: Player) => void;
}

export const AttendanceGrid: React.FC<AttendanceGridProps> = ({ 
    playerStatuses, players, onPlayerStatusChange, onPlayerStatsChange, 
    currentUser, isAdmin, match, matchStatus, onViewProfile
}) => {
    const [filter, setFilter] = useState<AttendanceStatus | 'ALL'>('ALL'); // 'ALL' will now mean PENDING for display purposes


    const { staff, allFieldPlayers, confirmedCount, doubtfulCount, absentCount, pendingCount } = useMemo(() => {
        const allParticipants = players
            .filter(player => {
                const savedStatus = playerStatuses.find(ps => ps.playerId === player.id);
                const isInactive = player.isActive === false;
                const isPending = !savedStatus || savedStatus.attendanceStatus === AttendanceStatus.PENDING;
                
                // Si está en pausa y está pendiente, lo ocultamos del partido
                if (isInactive && isPending) return false;
                return true;
            })
            .map(player => {
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

        const allSortedPlayers = (matchStatus === 'FINALIZADO' ? fieldPlayers.filter(p => p.status !== AttendanceStatus.PENDING) : fieldPlayers).sort(sortHybrid);

        return { 
            staff: staff.sort(sortHybrid), 
            allFieldPlayers: allSortedPlayers,
            confirmedCount: fieldPlayers.filter(p => p.status === AttendanceStatus.CONFIRMED).length, 
            doubtfulCount: fieldPlayers.filter(p => p.status === AttendanceStatus.DOUBTFUL).length, 
            absentCount: fieldPlayers.filter(p => p.status === AttendanceStatus.ABSENT).length,
            pendingCount: fieldPlayers.filter(p => p.status === AttendanceStatus.PENDING && p.player.isActive !== false).length
        };
    }, [playerStatuses, players, matchStatus]);

    const filteredPlayers = useMemo(() => {
        if (filter === 'ALL') { // Now 'ALL' means PENDING
            return allFieldPlayers.filter(p => p.status === AttendanceStatus.PENDING);
        }
        return allFieldPlayers.filter(p => p.status === filter);
    }, [filter, allFieldPlayers]);


    const StatusCounter: React.FC<{ label: string; count: number; color: string; status: AttendanceStatus | 'ALL' }> = ({ label, count, color, status }) => (
        <button onClick={() => setFilter(status)} className={`text-center p-3 rounded-lg text-white w-full transition-all transform ${filter === status ? 'scale-105 shadow-lg' : 'opacity-70'}`}>
            <div className={`rounded-lg ${color}`}>
                <p className="font-bold text-2xl">{count}</p>
                <p className="text-sm uppercase font-semibold">{label}</p>
            </div>
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4 text-white">
                <StatusCounter label="Pendientes" count={pendingCount} color="bg-gray-500" status="ALL" /> {/* Changed label and count */}
                <StatusCounter label="Confirman" count={confirmedCount} color="bg-green-500" status={AttendanceStatus.CONFIRMED} />
                <StatusCounter label="En Duda" count={doubtfulCount} color="bg-yellow-500" status={AttendanceStatus.DOUBTFUL} />
                <StatusCounter label="No Van" count={absentCount} color="bg-red-500" status={AttendanceStatus.ABSENT} />
            </div>

            {isAdmin && pendingCount > 0 && filter === 'ALL' && (
                <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-3xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 flex flex-col items-center gap-3 animate-pulse-slow">
                    <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-center">Hay {pendingCount} jugadores sin confirmar para esta fecha</p>
                    <button 
                        onClick={() => {
                            const msg = `📢 *MENSAJE DE LA APP PLAYER-LD* ⚽\n\n¡Buen día, equipo! 👋 Soy la App del equipo. Les mando este recordatorio a los que todavía están PENDIENTES de confirmar para la próxima fecha:\n\n🗓️ *FECHA:* ${match.date}\n🕒 *HORARIO:* ${match.time} hs\n🏟️ *CANCHA:* ${match.location}\n\nPor favor, entren a la App y marquen su estado lo antes posible. ¡El DT necesita armar el equipo! 🏆\n\n👇 *Pinchen acá abajo y entren a la App para anotarse:*\nhttps://primer-proyecto-a9290.web.app/`;
                            window.location.href = `whatsapp://send?text=${encodeURIComponent(msg)}`;
                        }}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-tighter text-xs"
                    >
                        <span>📱</span> RECLAMAR CONFIRMACIÓN GRUPAL (WA)
                    </button>
                    <p className="text-[9px] text-gray-500 italic font-medium">Esto abrirá WhatsApp para que elijas el grupo del equipo.</p>
                </div>
            )}

            {staff.length > 0 && (
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">Cuerpo Técnico</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {staff.map(({ player, stats }) => {
                            return (
                                 <AttendanceGridItem
                                    key={player!.id}
                                    player={player!}
                                    playerStatus={stats}
                                    onStatusChange={(newStatus) => onPlayerStatusChange(player!.id, newStatus)}
                                    onPlayerStatsChange={onPlayerStatsChange}
                                    currentUser={currentUser}
                                    isAdmin={isAdmin}
                                    match={match}
                                    matchStatus={matchStatus}
                                    onViewProfile={onViewProfile}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">Jugadores</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPlayers.map(({ player, stats }) => {
                        return (
                             <AttendanceGridItem
                                key={player!.id}
                                player={player!}
                                playerStatus={stats}
                                onStatusChange={(newStatus) => onPlayerStatusChange(player!.id, newStatus)}
                                onPlayerStatsChange={onPlayerStatsChange}
                                currentUser={currentUser}
                                isAdmin={isAdmin}
                                match={match}
                                matchStatus={matchStatus}
                                onViewProfile={onViewProfile}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};