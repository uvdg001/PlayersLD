
import React, { useState, useMemo } from 'react';
import type { Match, AttendanceStatus, Teams, Player, PaymentStatus, PlayerMatchStatus, MyTeam, Opponent } from '../types.ts';
import { PlayerRole } from '../types.ts';
import { TeamLineup } from './TeamLineup.tsx';
import { AttendanceStatus as AttendanceStatusEnum } from '../types.ts';
import { LeagueStandings } from './LeagueStandings.tsx';
import { StarRating } from './StarRating.tsx';
import { useToast } from '../hooks/useToast.ts';
import { AttendanceGrid } from './AttendanceGrid.tsx';
import { MatchAdminModal } from './MatchAdminModal.tsx'; // Importamos el modal
import { saveDocument } from '../services/firebaseService.ts'; // Importamos para guardar en lotes

interface MatchCardProps {
    match: Match;
    players: Player[];
    currentUser: Player;
    myTeam: MyTeam | null;
    opponents: Opponent[];
    onPlayerStatusChange: (matchId: number, playerId: number, newStatus: AttendanceStatus) => Promise<void>;
    onPlayerPaymentChange: (matchId: number, playerId: number, newStatus: PaymentStatus, amount: number) => Promise<void>;
    onCourtFeeChange: (matchId: number, newFee: number) => Promise<void>;
    onUpdateMatchDetails: (matchId: number, field: 'penaltiesAgainst' | 'jerseyWasherId', value: any) => Promise<void>;
    onStandingsChange: (matchId: number, teamId: number, newPosition: number) => Promise<void>;
    onPlayerRatingChange: (matchId: number, raterId: number, rateeId: number, rating: number) => Promise<void>;
    onToggleRatingStatus: (matchId: number) => Promise<void>;
    onFinishVoting: (matchId: number) => Promise<void>;
    onPlayerStatsChange: (matchId: number, playerId: number, field: keyof PlayerMatchStatus, value: any) => Promise<void>;
    onOpponentScoreChange: (matchId: number, newScore: number) => Promise<void>;
    teams: Teams | null;
    onGenerateTeams: () => Promise<void>;
    isAdmin: boolean;
    allMatches?: Match[];
    onSelectMatch?: (matchId: number) => void;
    isGeneratingTeams: boolean;
    onDeleteMatch?: (matchId: number) => void;
}

// ... Scoreboard component (sin cambios, omitido por brevedad en este bloque, se asume igual)
interface ScoreboardProps {
    matchId: number;
    matchStatus?: string;
    myTeamName: string;
    opponentName: string;
    opponentJerseyColor?: string;
    myTeamScore: number;
    opponentScore: number;
    onOpponentScoreChange: (matchId: number, newScore: number) => Promise<void>;
    isAdmin: boolean;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ matchId, matchStatus, myTeamName, opponentName, opponentJerseyColor, myTeamScore, opponentScore, onOpponentScoreChange, isAdmin }) => {
    const [isEditingOpponentScore, setIsEditingOpponentScore] = useState(false);
    const [tempOpponentScore, setTempOpponentScore] = useState(opponentScore.toString());

    const handleSaveOpponentScore = () => {
        const newScore = parseInt(tempOpponentScore, 10);
        if (!isNaN(newScore) && newScore >= 0) {
            onOpponentScoreChange(matchId, newScore);
        } else {
            setTempOpponentScore(opponentScore.toString());
        }
        setIsEditingOpponentScore(false);
    };

    let resultText = '';
    let resultColor = '';
    if (matchStatus === 'FINALIZADO') {
        if (myTeamScore > opponentScore) {
            resultText = 'GANADO';
            resultColor = 'bg-green-500';
        } else if (myTeamScore < opponentScore) {
            resultText = 'PERDIDO';
            resultColor = 'bg-red-500';
        } else {
            resultText = 'EMPATADO';
            resultColor = 'bg-gray-500';
        }
    }

    return (
        <div className="my-6 p-4 bg-gray-900 text-white rounded-lg flex flex-col items-center justify-around shadow-lg">
            <div className="flex items-center justify-around w-full">
                <div className="text-center w-1/3">
                    <p className="font-bold text-xl truncate text-white">{myTeamName}</p>
                </div>
                <div className="text-center font-black text-5xl flex items-center space-x-4">
                    <span className="text-white">{myTeamScore}</span>
                    <span className="text-gray-400">-</span>
                    {isEditingOpponentScore && isAdmin ? (
                         <input
                            type="number"
                            value={tempOpponentScore}
                            onChange={(e) => setTempOpponentScore(e.target.value)}
                            onBlur={handleSaveOpponentScore}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveOpponentScore()}
                            className="w-20 text-center bg-gray-700 border border-blue-500 rounded-md text-white text-5xl"
                            autoFocus
                        />
                    ) : (
                        <span onClick={() => isAdmin && setIsEditingOpponentScore(true)} className={`text-white ${isAdmin ? "cursor-pointer" : ""}`}>{opponentScore}</span>
                    )}
                </div>
                <div className="text-center w-1/3">
                     <div className="flex items-center justify-center gap-3">
                         {opponentJerseyColor && (
                            <div 
                                className="w-5 h-5 rounded-full border-2 border-white/50 shadow-md" 
                                style={{ backgroundColor: opponentJerseyColor }}
                                title={`Color de camiseta: ${opponentJerseyColor}`}
                            ></div>
                        )}
                        <p className="font-bold text-xl truncate text-white">{opponentName}</p>
                    </div>
                </div>
            </div>
            {resultText && (
                <div className={`mt-3 px-3 py-1 text-sm font-bold rounded-full text-white ${resultColor}`}>
                    {resultText}
                </div>
            )}
        </div>
    );
};

// ... InfoItem component (sin cambios)
const InfoItem: React.FC<{ icon: React.ReactElement; label: string; value: string | React.ReactElement; timeClass?: string }> = ({ icon, label, value, timeClass = '' }) => (
    <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-600 shadow-sm">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${timeClass || 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
            <div className="text-gray-900 dark:text-gray-100 font-bold text-sm md:text-base leading-tight">{value}</div>
        </div>
    </div>
);

// NUEVA Sección de Calificación con "Guardar Lote"
const BatchPlayerRatingSection: React.FC<{
    currentUser: Player;
    players: Player[];
    initialRatings: { [rateeId: string]: number };
    matchId: number;
    onFinishVoting: () => void;
}> = ({ currentUser, players, initialRatings, matchId, onFinishVoting }) => {
    const [localRatings, setLocalRatings] = useState(initialRatings || {});
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();

    // Orden alfabético
    const ratees = players.filter(p => p.id !== currentUser.id).sort((a, b) => a.nickname.localeCompare(b.nickname));
    
    const handleLocalRate = (rateeId: number, rating: number) => {
        setLocalRatings(prev => ({ ...prev, [rateeId]: rating }));
    };

    const saveRatings = async () => {
        const ratedCount = Object.keys(localRatings).length;
        if (ratedCount < ratees.length) {
            alert(`Has calificado a ${ratedCount} de ${ratees.length}. Debes calificar a todos.`);
            return;
        }
        
        setIsSaving(true);
        // Guardamos los ratings de este usuario
        await saveDocument('matches', matchId.toString(), {
            ratings: {
                [currentUser.id]: localRatings
            }
        });
        
        // Finalizamos votación
        await onFinishVoting();
        setIsSaving(false);
        toast.success("Votación enviada correctamente.");
    };

    return (
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Calificaciones (Borrador)</h3>
                <button 
                    type="button"
                    onClick={saveRatings}
                    disabled={isSaving}
                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    {isSaving ? 'Enviando...' : 'Enviar Calificaciones'}
                </button>
            </div>
            
            <div className="space-y-3">
                {ratees.map(ratee => (
                    <div key={ratee.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                            <img src={ratee.photoUrl} alt={ratee.nickname} className="w-10 h-10 rounded-full object-cover" />
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{ratee.firstName} "{ratee.nickname}"</p>
                        </div>
                        <StarRating 
                            rating={localRatings[ratee.id] || 0}
                            onRatingChange={(val) => handleLocalRate(ratee.id, val)}
                            interactive={true}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

// ... AdminSection (modificado para quitar cosas que movimos al modal si es necesario, o dejar solo opciones generales)
const AdminSection: React.FC<{ 
    match: Match; 
    onToggleRatingStatus: (matchId: number) => Promise<void>;
    onUpdateMatchDetails: (matchId: number, field: 'penaltiesAgainst' | 'jerseyWasherId', value: any) => Promise<void>;
}> = ({ match, onToggleRatingStatus, onUpdateMatchDetails }) => {
    const isRatingOpen = match.ratingStatus === 'OPEN';
    
    return (
        <div className="my-6 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 space-y-4">
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Opciones de Admin</h3>
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Estado Votación: <span className={`font-bold ${isRatingOpen ? 'text-green-500' : 'text-red-500'}`}>{isRatingOpen ? 'ABIERTAS' : 'CERRADAS'}</span>
                </p>
                <button
                    onClick={() => onToggleRatingStatus(match.id)}
                    className={`px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors ${isRatingOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                >
                    {isRatingOpen ? 'Cerrar Votación' : 'Abrir Votación'}
                </button>
            </div>
             {match.status === 'FINALIZADO' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t dark:border-gray-600">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Penales en Contra</label>
                        <input 
                            type="number"
                            value={match.penaltiesAgainst || 0}
                            onChange={(e) => onUpdateMatchDetails(match.id, 'penaltiesAgainst', parseInt(e.target.value, 10) || 0)}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 dark:bg-gray-900 dark:text-white dark:border-gray-600"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export const MatchCard: React.FC<MatchCardProps> = ({ match, players, currentUser, myTeam, opponents, onPlayerStatusChange, onPlayerPaymentChange, onCourtFeeChange, onUpdateMatchDetails, onStandingsChange, onPlayerRatingChange, onToggleRatingStatus, onFinishVoting, onPlayerStatsChange, onOpponentScoreChange, teams, onGenerateTeams, isAdmin, allMatches, onSelectMatch, isGeneratingTeams, onDeleteMatch }) => {
    const toast = useToast();
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    
    // ... Icons (CalendarIcon, TimeIcon, etc.) - omitidos por brevedad, se mantienen igual
    const CalendarIcon = ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" /><path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" /></svg> );
    const TimeIcon = ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" /></svg> );
    const WarmupIcon = ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clipRule="evenodd" /></svg> );
    const TalkIcon = ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97ZM6.75 8.25a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H7.5Z" clipRule="evenodd" /></svg> );
    const LocationIcon = ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" /></svg> );
    
    // ... logic for confirmedPlayers, share, score (sin cambios)
    const confirmedPlayers = match.playerStatuses.filter(p => p.attendanceStatus === AttendanceStatusEnum.CONFIRMED);
    const confirmedCount = confirmedPlayers.length;
    const mapUrl = match.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.address)}` : '#';
    const myTeamScore = useMemo(() => 
        match.playerStatuses.reduce((total, ps) => 
            total + (ps.goalsPlay || 0) + (ps.goalsPenalty || 0) + (ps.goalsHeader || 0) + (ps.goalsSetPiece || 0), 0), 
    [match.playerStatuses]);
    const opponent = opponents.find(o => o.id === match.opponentId);
    
    // Variables nuevas
    const userFinishedVoting = match.finishedVoters?.includes(currentUser.id);
    const userIsStaff = currentUser.role === 'DT' || currentUser.role === 'Ayudante';
    const eligiblePlayersForRating = players.filter(player => 
        match.playerStatuses.some(ps => 
            ps.playerId === player.id && 
            ps.attendanceStatus === AttendanceStatusEnum.CONFIRMED
        )
    );

    const handleBatchSave = async (updatedStatuses: PlayerMatchStatus[]) => {
        try {
            await saveDocument('matches', match.id.toString(), { playerStatuses: updatedStatuses });
            toast.success("Cambios guardados exitosamente.");
        } catch (e) {
            toast.error("Error al guardar cambios.");
        }
    };

    const handleShare = async () => { /* ... código existente de share ... */
        const confirmed = confirmedPlayers.map(p => players.find(pl => pl.id === p.playerId)?.nickname || 'Desconocido');
        const doubtful = match.playerStatuses.filter(p => p.attendanceStatus === AttendanceStatusEnum.DOUBTFUL).map(p => players.find(pl => pl.id === p.playerId)?.nickname || 'Desconocido');
        const absent = match.playerStatuses.filter(p => p.attendanceStatus === AttendanceStatusEnum.ABSENT).map(p => players.find(pl => pl.id === p.playerId)?.nickname || 'Desconocido');

        const shareText = `
*⚽ PARTIDO F50 SÁBADOS ⚽*

*🗓️ Fecha:* ${match.date}
*⏰ Hora:* ${match.time}
*📍 Lugar:* ${match.location} (${match.address})

---
*ASISTENCIA:*

*✅ CONFIRMADOS (${confirmed.length}):*
${confirmed.length > 0 ? confirmed.map(name => `- ${name}`).join('\n') : 'Nadie aún'}

*❓ EN DUDA (${doubtful.length}):*
${doubtful.length > 0 ? doubtful.map(name => `- ${name}`).join('\n') : 'Nadie'}

*❌ NO VAN (${absent.length}):*
${absent.length > 0 ? absent.map(name => `- ${name}`).join('\n') : 'Nadie'}

---
¡Nos vemos en la cancha! 🍻`.trim();

        try {
            await navigator.clipboard.writeText(shareText);
            toast.success('Texto copiado al portapapeles. Abriendo WhatsApp...');
        } catch (err) { console.error('Failed to copy', err); }
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden relative">
            <div className="p-6">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
                            {CalendarIcon}
                        </div>
                        {allMatches && onSelectMatch ? (
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">Viendo Partido</label>
                                <select 
                                    value={match.id}
                                    onChange={(e) => onSelectMatch(Number(e.target.value))}
                                    className="w-full md:w-64 bg-gray-50 dark:bg-gray-700 border-none font-bold text-lg text-gray-800 dark:text-white rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                >
                                    {allMatches.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.date} {m.tournamentRound ? `- Fecha ${m.tournamentRound}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Próximo Partido</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{match.date}</p>
                            </div>
                        )}
                        {isAdmin && onDeleteMatch && (
                            <button 
                                onClick={() => onDeleteMatch(match.id)} 
                                className="ml-2 p-2 text-red-500 hover:text-red-700 bg-red-100 dark:bg-red-900/30 rounded-full hover:bg-red-200 transition-colors"
                                title="Eliminar este partido"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>
                    {match.tournamentRound && (
                        <div className="flex-1 text-center order-first md:order-none w-full md:w-auto mb-4 md:mb-0">
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-widest px-4 py-2 rounded-xl inline-block shadow-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                FECHA {match.tournamentRound}
                            </h2>
                        </div>
                    )}
                     <div className="text-right hidden md:block">
                        <span className="font-bold text-lg text-gray-800 dark:text-gray-200">{match.location}</span>
                        {match.address && (
                            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-500 hover:underline">
                                {match.address}
                            </a>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <InfoItem icon={TimeIcon} label="Partido" value={`${match.time} hs`} timeClass="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400" />
                    {match.warmUpTime && <InfoItem icon={WarmupIcon} label="Calentamiento" value={`${match.warmUpTime} hs`} timeClass="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" />}
                    {match.coachTalkTime && <InfoItem icon={TalkIcon} label="Charla DT" value={`${match.coachTalkTime} hs`} timeClass="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" />}
                    <InfoItem 
                        icon={LocationIcon} 
                        label="Cancha" 
                        value={
                            <span className="flex items-center gap-1">
                                {match.location} 
                                {match.courtNumber && <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">N° {match.courtNumber}</span>}
                            </span>
                        } 
                        timeClass="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    />
                </div>

                <Scoreboard
                    matchId={match.id}
                    matchStatus={match.status}
                    myTeamName={myTeam?.name || 'Mi Equipo'}
                    opponentName={opponent?.name || 'Rival'}
                    opponentJerseyColor={opponent?.jerseyColor}
                    myTeamScore={myTeamScore}
                    opponentScore={match.opponentScore || 0}
                    onOpponentScoreChange={onOpponentScoreChange}
                    isAdmin={isAdmin}
                />
                
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Convocatoria ({confirmedCount})</h3>
                    <div className="flex gap-2">
                        {isAdmin && (
                            <button
                                onClick={() => setIsAdminModalOpen(true)}
                                className="px-4 py-2 bg-gray-800 text-white font-semibold rounded-lg shadow-md hover:bg-black transition-colors flex items-center gap-2 text-sm"
                            >
                                🛠️ Administrar Partido
                            </button>
                        )}
                        <button
                            onClick={handleShare}
                            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.217a3.001 3.001 0 0 1-1.896 0L3.06 9.64A3 3 0 1 1 5.71 8.525l5.342 2.671a3.001 3.001 0 0 1 1.896 0l5.342-2.672a3 3 0 1 1 .825 2.066l-8.421 4.217a3 3 0 0 1-3.295 0L2.71 13.525a3 3 0 1 1 .825-2.066l8.421-4.217a3 3 0 0 1 3.295 0Z" clipRule="evenodd" /></svg>
                            Compartir
                        </button>
                    </div>
                </div>
                
                <AttendanceGrid 
                    playerStatuses={match.playerStatuses} 
                    players={players} 
                    onPlayerStatusChange={(pId, status) => onPlayerStatusChange(match.id, pId, status)}
                    currentUser={currentUser}
                    isAdmin={isAdmin}
                    matchStatus={match.status}
                />

                {isAdmin && confirmedPlayers.length > 0 && match.status === 'PROGRAMADO' && (
                    <div className="mt-8 text-center pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={onGenerateTeams}
                            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                            disabled={isGeneratingTeams}
                        >
                            {isGeneratingTeams ? 'Generando...' : '⚽ Armar Equipos con IA'}
                        </button>
                        {teams && <TeamLineup teams={teams} />}
                    </div>
                )}
                
                {/* NOTA: Eliminamos el MatchStatsEditor en linea y lo pasamos al Modal */}

                {match.ratingStatus === 'OPEN' && !userIsStaff && !userFinishedVoting && eligiblePlayersForRating.length > 0 && (
                     <BatchPlayerRatingSection
                        currentUser={currentUser}
                        players={eligiblePlayersForRating}
                        initialRatings={match.ratings?.[currentUser.id] || {}}
                        matchId={match.id}
                        onFinishVoting={() => onFinishVoting(match.id)}
                     />
                )}

                {match.tournamentRound && match.standings && (
                    <LeagueStandings
                        round={match.tournamentRound}
                        standings={match.standings}
                        onPositionChange={(teamId, newPos) => onStandingsChange(match.id, teamId, newPos)}
                    />
                )}
                
                {isAdmin && (
                    <AdminSection 
                        match={match} 
                        onToggleRatingStatus={onToggleRatingStatus}
                        onUpdateMatchDetails={onUpdateMatchDetails}
                    />
                )}

            </div>
            
            {isAdminModalOpen && (
                <MatchAdminModal
                    match={match}
                    players={players}
                    onClose={() => setIsAdminModalOpen(false)}
                    onSave={handleBatchSave}
                />
            )}
        </div>
    );
};
