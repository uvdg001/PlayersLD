import React, { useState, useMemo, useEffect } from 'react';
import type { Match, Player, Opponent } from '../../types.ts';
import { AttendanceStatus, PlayerRole } from '../../types.ts';
import { StarRating } from '../StarRating.tsx';
import { useToast } from '../../hooks/useToast.ts';

interface RatingsPageProps {
    matches: Match[];
    players: Player[];
    opponents: Opponent[];
    currentUser: Player;
    onPlayerRatingChange: (matchId: number, raterId: number, rateeId: number, rating: number) => Promise<void>;
    onFinishVoting: (matchId: number) => Promise<void>;
    isAdmin?: boolean;
    initialMatchId?: number | null;
}

interface AdminRaterRowProps {
    player: Player;
    voted: boolean;
    raterVotes: Record<number, number>;
    players: Player[];
}

const AdminRaterRow: React.FC<AdminRaterRowProps> = ({ player, voted, raterVotes, players }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
        <div className="flex flex-col">
            <div 
                className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${isExpanded ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-400">{player.id}</span>
                    <span className={`font-bold ${voted ? 'text-green-600' : 'text-red-500'}`}>
                        {player.nickname}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {voted ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-bold">VOTÓ ({Object.keys(raterVotes).length})</span>
                    ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-bold">PENDIENTE</span>
                    )}
                    <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                </div>
            </div>
            
            {isExpanded && (
                <div className="bg-white dark:bg-gray-950 p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 border-t dark:border-gray-800">
                    {Object.entries(raterVotes).length > 0 ? (
                        Object.entries(raterVotes).map(([targetId, rating]) => {
                            const target = players.find(x => x.id === Number(targetId));
                            return (
                                <div key={targetId} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded border dark:border-gray-800 shadow-sm">
                                    <img src={target?.photoUrl} className="w-6 h-6 rounded-full object-cover border border-gray-200 dark:border-gray-700" alt="" />
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-[10px] font-bold truncate text-gray-700 dark:text-gray-300">{target?.nickname}</span>
                                        <span className="text-xs text-yellow-500 font-black">{rating} ★</span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="col-span-full text-center py-2 text-xs text-gray-500 italic">No hay calificaciones registradas aún.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export const RatingsPage: React.FC<RatingsPageProps> = ({ matches, players, opponents, currentUser, onPlayerRatingChange, onFinishVoting, isAdmin, initialMatchId }) => {
    const toast = useToast();
    const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditingVote, setIsEditingVote] = useState(false);

    // Sincronización Global: Si cambia el partido seleccionado afuera, actualizar aquí
    useEffect(() => {
        if (initialMatchId) {
            setSelectedMatchId(initialMatchId);
        }
    }, [initialMatchId]);

    // Si la lista de partidos cambia (cambiaron de torneo), reseteamos la selección local
    // para que no quede un partido de otro torneo seleccionado "en el fondo"
    useEffect(() => {
        if (selectedMatchId && !matches.some(m => m.id === selectedMatchId)) {
            setSelectedMatchId(null);
        }
    }, [matches, selectedMatchId]);

    // Filter relevant matches for the "Room"
    const finishedMatches = useMemo(() => {
        return matches
            .filter(m => m.status === 'FINALIZADO')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [matches]);

    const votingMatches = finishedMatches.slice(0, 10);

    const selectedMatch = useMemo(() => {
        return matches.find(m => m.id === selectedMatchId);
    }, [matches, selectedMatchId]);

    const playersToRate = useMemo(() => {
        if (!selectedMatch) return [];
        return selectedMatch.playerStatuses
            .filter(ps => 
                ps.attendanceStatus === AttendanceStatus.CONFIRMED && 
                ps.playerId !== currentUser.id &&
                (ps.quartersPlayed || 0) > 0 
            )
            .map(ps => {
                const player = players.find(p => p.id === ps.playerId);
                return player ? { ...player, status: ps } : null;
            })
            .filter((p): p is (Player & { status: any }) => 
                p !== null && 
                p.role !== PlayerRole.DT && 
                p.role !== PlayerRole.AYUDANTE
            );
    }, [selectedMatch, players, currentUser]);

    const handleRating = async (rateeId: number, rating: number) => {
        if (!selectedMatch) return;
        try {
            await onPlayerRatingChange(selectedMatch.id, currentUser.id, rateeId, rating);
        } catch (error) {
            toast.error("Error al guardar la calificación");
        }
    };

    const isMatchExpired = (dateStr: string) => {
        const matchDate = new Date(dateStr);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - matchDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 14;
    };

    const hasUserVoted = selectedMatch?.finishedVoters?.includes(currentUser.id);
    const isVotingOpen = selectedMatch?.ratingStatus === 'OPEN';

    // Finalizar votación (Submit)
    const handleComplete = async (abstain: boolean = false) => {
        if (!selectedMatchId) return;
        setIsSubmitting(true);
        try {
            await onFinishVoting(selectedMatchId);
            if (abstain) {
                toast.info("Has desistido.");
            } else {
                toast.success("¡Calificaciones guardadas correctamente!");
            }
            setIsEditingVote(false);
            setSelectedMatchId(null); // Go back to room
        } catch (error) {
           console.error(error);
           toast.error("Error al finalizar la votación");
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentVotes = selectedMatch?.ratings?.[currentUser.id] || {};
    const votedCount = playersToRate.filter(p => (currentVotes[p.id] || 0) > 0).length;
    const totalToVote = playersToRate.length;
    const isVotingComplete = votedCount === totalToVote;

    // VISTA DE SALA: SI NO HAY PARTIDO SELECCIONADO O NO ESTÁ FINALIZADO
    if (!selectedMatchId || !selectedMatch || selectedMatch.status !== 'FINALIZADO') {
        return (
            <div className="space-y-6 pb-12">
                <div className="text-center py-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold italic tracking-tighter uppercase">⭐ Sala de Votación</h2>
                        <p className="opacity-90 font-medium">Elige un partido habilitado y califica a tus compañeros.</p>
                    </div>
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🗳️</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {votingMatches.map(match => {
                        const opponent = opponents.find(o => o.id === match.opponentId);
                        const isOpen = match.ratingStatus === 'OPEN';
                        const expired = isMatchExpired(match.date);
                        const userPlayed = match.playerStatuses.some(ps => ps.playerId === currentUser.id && ps.attendanceStatus === AttendanceStatus.CONFIRMED);
                        const userVoted = match.finishedVoters?.includes(currentUser.id);
                        
                        let cardClass = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";
                        let statusText = "Esperando habilitación";
                        let statusColor = "text-gray-500";
                        let icon = "🔒";
                        let actionButton = null;

                        if (expired) {
                            cardClass = "bg-gray-100 dark:bg-gray-800/50 border-gray-200 opacity-60";
                            statusText = "Expirado";
                            statusColor = "text-red-500";
                            icon = "🕰️";
                        } else if (isOpen) {
                            if (userPlayed && !userVoted) {
                                cardClass = "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 shadow-lg cursor-pointer transform hover:scale-105 transition-transform";
                                statusText = "¡TE TOCA VOTAR!";
                                statusColor = "text-yellow-600 font-bold animate-pulse";
                                icon = "🗳️";
                                actionButton = "VOTAR AHORA";
                            } else if (userPlayed && userVoted) {
                                cardClass = "bg-green-50 dark:bg-green-900/20 border-green-500 shadow-sm cursor-pointer hover:scale-105 transition-transform";
                                statusText = "YA CALIFICASTE";
                                statusColor = "text-green-600 font-bold";
                                icon = "✅";
                                actionButton = "VER / MODIFICAR";
                            } else if (!userPlayed) {
                                cardClass = "bg-gray-50 dark:bg-gray-800 border-gray-200 cursor-not-allowed opacity-70";
                                statusText = "NO JUGASTE";
                                statusColor = "text-gray-400";
                                icon = "🚫";
                            }
                        }

                        return (
                            <div 
                                key={match.id} 
                                className={`border-2 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between h-full ${cardClass}`}
                                onClick={() => {
                                    if (isOpen && !expired && (userPlayed || userVoted)) {
                                        setSelectedMatchId(match.id);
                                        setIsEditingVote(false); // Reset edit mode
                                    } else if (!userPlayed && isAdmin) {
                                        // Admin can enter any match
                                        setSelectedMatchId(match.id);
                                    } else if (!userPlayed) {
                                        toast.info("Solo los que jugaron pueden entrar.");
                                    }
                                }}
                            >
                                {isOpen && !expired && (
                                    <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                        ACTIVO
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-gray-500 font-semibold mb-1">{match.date}</p>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                                        vs {opponent?.name || 'Rival'}
                                    </h3>
                                    <div className={`flex items-center gap-2 mt-4 ${statusColor}`}>
                                        <span className="text-2xl">{icon}</span>
                                        <span className="text-sm uppercase tracking-wider">{statusText}</span>
                                    </div>
                                </div>
                                {actionButton && (
                                    <button className={`mt-6 w-full py-2 font-bold rounded-lg shadow-md transition-colors ${actionButton === 'VOTAR AHORA' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                                        {actionButton}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    const opponentName = opponents.find(o => o.id === selectedMatch.opponentId)?.name || 'Rival';

    // VISTA DE "YA CALIFICADO" (Si ya votó y no está editando)
    if (hasUserVoted && !isEditingVote) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 min-h-[60vh]">
                <button onClick={() => setSelectedMatchId(null)} className="mb-4 text-gray-500 hover:text-indigo-600 flex items-center gap-1">← Volver a la Sala</button>
                
                <div className="text-center mb-6 p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                     <div className="text-5xl mb-2">✅</div>
                     <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        ¡Ya has calificado!
                     </h2>
                     <p className="text-gray-600 dark:text-gray-300 mt-2">
                        Tus votos para el partido vs {opponentName} ya fueron guardados.
                     </p>
                     
                     {isVotingOpen && (
                         <div className="mt-6">
                            <p className="text-sm text-gray-500 mb-3">¿Cambiaste de opinión? La votación sigue abierta.</p>
                            <button 
                                onClick={() => setIsEditingVote(true)}
                                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md transition-colors"
                            >
                                ✏️ Modificar mis calificaciones
                            </button>
                         </div>
                     )}
                     {!isVotingOpen && (
                         <p className="mt-4 text-red-500 text-sm font-bold">La votación ya cerró, no se pueden hacer cambios.</p>
                     )}
                </div>

                 <div className="mt-8">
                     <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4">Resultados Parciales:</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {playersToRate.map(player => {
                            let sum = 0;
                            let count = 0;
                            if (selectedMatch.ratings) {
                                Object.values(selectedMatch.ratings).forEach(votes => {
                                    if (votes[player.id]) { sum += votes[player.id]; count++; }
                                });
                            }
                            const avg = count > 0 ? (sum / count).toFixed(1) : '-';

                            return (
                                 <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-50/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <img src={player.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        <p className="font-bold text-gray-800 dark:text-gray-200">{player.nickname}</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="font-bold text-yellow-500">{avg} ★</span>
                                        <span className="text-xs text-gray-400">{count} votos</span>
                                    </div>
                                </div>
                            );
                        })}
                     </div>
                 </div>

                 {/* ADMIN PANEL INSIDE RESULTS */}
                 {isAdmin && (
                    <div className="mt-10 pt-6 border-t-2 border-gray-300 dark:border-gray-600">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <span>👮</span> Panel de Control (Admin)
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">Jugadores que confirmaron asistencia y su detalle de votos.</p>
                        
                        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden divide-y dark:divide-gray-700">
                            {selectedMatch.playerStatuses
                                .filter(ps => ps.attendanceStatus === AttendanceStatus.CONFIRMED)
                                .map(ps => {
                                    const p = players.find(x => x.id === ps.playerId);
                                    if (!p) return null;
                                    const voted = selectedMatch.finishedVoters?.includes(p.id);
                                    const raterVotes = selectedMatch.ratings?.[p.id] || {};
                                    
                                    return (
                                        <AdminRaterRow 
                                            key={p.id}
                                            player={p}
                                            voted={!!voted}
                                            raterVotes={raterVotes as Record<number, number>}
                                            players={players}
                                        />
                                    );
                                })}
                        </div>
                    </div>
                 )}
            </div>
        );
    }

    // VISTA DE FORMULARIO DE VOTACIÓN (Si no votó, o si está editando)
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 min-h-[60vh]">
            <button 
                onClick={() => { setSelectedMatchId(null); setIsEditingVote(false); }} 
                className="mb-4 text-gray-500 hover:text-indigo-600 flex items-center gap-1"
            >
                ← Volver a la Sala
            </button>

            <div className="text-center mb-8 border-b dark:border-gray-700 pb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Calificando vs {opponentName}</h2>
                <p className="text-gray-500">{selectedMatch.date}</p>
                
                {/* BANNER DE INSTRUCCIÓN */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playersToRate.map(player => {
                    const myRating = selectedMatch.ratings?.[currentUser.id]?.[player.id] || 0;
                    return (
                        <div key={player.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${myRating > 0 ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-gray-50 border-gray-100 dark:bg-gray-700/50 dark:border-gray-700'}`}>
                            <div className="flex items-center gap-3">
                                <img src={player.photoUrl} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-gray-200 text-lg">{player.nickname}</p>
                                    <p className="text-xs text-gray-500">{player.role}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <StarRating 
                                    rating={myRating} 
                                    onRatingChange={(r) => handleRating(player.id, r)} 
                                    interactive={true}
                                    size="text-2xl"
                                />
                                <span className={`text-xs mt-1 font-semibold ${myRating > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                                    {myRating > 0 ? 'LISTO' : 'Pendiente'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {playersToRate.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    <p>No hay jugadores elegibles para calificar (nadie jugó más de 1/4 o eres el único).</p>
                </div>
            )}
            
            <div className="mt-8 flex flex-col items-center justify-center gap-4 border-t dark:border-gray-700 pt-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
                {!isVotingComplete && playersToRate.length > 0 && (
                     <p className="text-red-500 font-bold animate-pulse text-lg">
                        ⚠️ Faltan calificar {totalToVote - votedCount} compañeros
                    </p>
                )}
                {isVotingComplete && (
                     <p className="text-green-600 font-bold text-lg">
                        ✅ ¡Todo listo para enviar!
                    </p>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                     <button 
                        onClick={() => handleComplete(true)} 
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-400 transition-colors text-sm disabled:opacity-50"
                    >
                        Desistir / No me interesa
                    </button>
                    <button 
                        onClick={() => handleComplete(false)} 
                        disabled={isSubmitting || !isVotingComplete}
                        className={`flex-1 px-4 py-3 font-bold rounded-lg shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed ${isVotingComplete ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-400 text-white'}`}
                    >
                        {isSubmitting ? 'Guardando...' : `GUARDAR VOTOS`}
                    </button>
                </div>
            </div>
        </div>
    );
};