import React, { useState, useMemo } from 'react';
import type { Match, AttendanceStatus, Teams, Player, PaymentStatus, PlayerMatchStatus, MyTeam, Opponent } from '../types';
import { PlayerList } from './PlayerList';
import { TeamLineup } from './TeamLineup';
import { AttendanceStatus as AttendanceStatusEnum } from '../types';
import { LeagueStandings } from './LeagueStandings';
import { StarRating } from './StarRating';

interface MatchCardProps {
    match: Match;
    players: Player[];
    currentUser: Player;
    myTeam: MyTeam | null;
    opponents: Opponent[];
    onPlayerStatusChange: (matchId: number, playerId: number, newStatus: AttendanceStatus) => void;
    onPlayerPaymentChange: (matchId: number, playerId: number, newStatus: PaymentStatus, amount: number) => void;
    onCourtFeeChange: (matchId: number, newFee: number) => void;
    onStandingsChange: (matchId: number, teamId: number, newPosition: number) => void;
    onPlayerRatingChange: (matchId: number, raterId: number, rateeId: number, rating: number) => void;
    onToggleRatingStatus: (matchId: number) => void;
    onPlayerStatsChange: (matchId: number, playerId: number, field: keyof PlayerMatchStatus, value: any) => void;
    onOpponentScoreChange: (matchId: number, newScore: number) => void;
    teams: Teams | null;
    isGeneratingTeams: boolean;
    onGenerateTeams: () => void;
    isAdmin: boolean;
}

interface PlayerRatingSectionProps {
    currentUser: Player;
    players: Player[]; // Only confirmed players
    ratings: { [raterId: string]: { [rateeId: string]: number } };
    onRatingChange: (raterId: number, rateeId: number, rating: number) => void;
}

const Scoreboard: React.FC<{
    myTeamName: string;
    opponentName: string;
    myTeamScore: number;
    opponentScore: number;
    onOpponentScoreChange: (newScore: number) => void;
    isAdmin: boolean;
}> = ({ myTeamName, opponentName, myTeamScore, opponentScore, onOpponentScoreChange, isAdmin }) => {
    const [isEditingOpponentScore, setIsEditingOpponentScore] = useState(false);
    const [tempOpponentScore, setTempOpponentScore] = useState(opponentScore.toString());

    const handleSaveOpponentScore = () => {
        const newScore = parseInt(tempOpponentScore, 10);
        if (!isNaN(newScore) && newScore >= 0) {
            onOpponentScoreChange(newScore);
        } else {
            setTempOpponentScore(opponentScore.toString());
        }
        setIsEditingOpponentScore(false);
    };


    return (
        <div className="my-6 p-4 bg-gray-900 dark:bg-gray-900/50 text-white rounded-lg flex items-center justify-around shadow-lg">
            <div className="text-center w-1/3">
                <p className="font-bold text-xl truncate">{myTeamName}</p>
            </div>
            <div className="text-center font-black text-5xl flex items-center space-x-4">
                <span>{myTeamScore}</span>
                <span className="text-gray-400">-</span>
                {isEditingOpponentScore ? (
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
                    <span onClick={() => isAdmin && setIsEditingOpponentScore(true)} className={isAdmin ? "cursor-pointer" : ""}>{opponentScore}</span>
                )}
            </div>
            <div className="text-center w-1/3">
                 <p className="font-bold text-xl truncate">{opponentName}</p>
            </div>
        </div>
    );
};


const PlayerRatingSection: React.FC<PlayerRatingSectionProps> = ({ currentUser, players, ratings, onRatingChange }) => {
    if (players.length < 2) {
        return null; // Don't show if not enough players to rate
    }

    const ratees = players.filter(p => p.id !== currentUser.id);

    if (ratees.length === 0) {
        return (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">Calificaciones del Partido</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">No hay otros jugadores confirmados para calificar.</p>
            </div>
        );
    }


    return (
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-300">Calificaciones del Partido</h3>
            
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
               <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                   Calificando como: <span className="font-bold">{currentUser.firstName} {currentUser.lastName}</span>
               </p>
            </div>

            {ratees.length > 0 && (
                <div className="space-y-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Puntúa el desempeño de tus compañeros:</p>
                    {ratees.map(ratee => (
                        <div key={ratee.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{ratee.firstName} "{ratee.nickname}" {ratee.lastName}</p>
                            <StarRating 
                                rating={ratings?.[currentUser.id]?.[ratee.id] || 0}
                                onRatingChange={(newRating) => onRatingChange(currentUser.id, ratee.id, newRating)}
                                interactive={true}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const InfoItem: React.FC<{ icon: React.ReactElement; label: string; value: string | React.ReactElement }> = ({ icon, label, value }) => (
    <div className="flex items-start space-x-3 text-gray-600 dark:text-gray-300">
        <div className="flex-shrink-0 w-6 h-6 mt-1">{icon}</div>
        <div>
            <p className="font-semibold">{label}</p>
            <div className="text-gray-800 dark:text-gray-100">{value}</div>
        </div>
    </div>
);

const PaymentSummary: React.FC<{ fee: number; paid: number; playerShare: number; onFeeChange: (newFee: number) => void; isAdmin: boolean; }> = ({ fee, paid, playerShare, onFeeChange, isAdmin }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newFee, setNewFee] = useState(fee.toString());
    const balance = paid - fee;
    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

    const handleFeeSave = () => {
        const feeValue = parseFloat(newFee);
        if (!isNaN(feeValue) && feeValue >= 0) {
            onFeeChange(feeValue);
        } else {
            setNewFee(fee.toString()); // Reset to original value if invalid
        }
        setIsEditing(false);
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center p-4 rounded-lg bg-gray-100 dark:bg-gray-700/50 mb-6">
            <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center justify-center space-x-1">
                    <span>Costo Cancha</span>
                    {isAdmin && !isEditing && (
                         <svg onClick={() => setIsEditing(true)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 cursor-pointer hover:text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                    )}
                </p>
                {isEditing && isAdmin ? (
                    <input 
                        type="number"
                        value={newFee}
                        onChange={(e) => setNewFee(e.target.value)}
                        onBlur={handleFeeSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleFeeSave()}
                        className="text-lg font-bold text-blue-600 bg-white dark:bg-gray-800 dark:text-blue-400 w-full text-center rounded-md border-gray-300"
                        autoFocus
                    />
                ) : (
                    <p className={`text-lg font-bold text-blue-600 dark:text-blue-400 ${isAdmin ? 'cursor-pointer' : ''}`} onClick={() => isAdmin && setIsEditing(true)}>{formatter.format(fee)}</p>
                )}
            </div>
             <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Cuota x Jugador</p>
                <p className="text-lg font-bold text-orange-500 dark:text-orange-400">{formatter.format(playerShare)}</p>
            </div>
            <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Recaudado</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatter.format(paid)}</p>
            </div>
            <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Saldo</p>
                <p className={`text-lg font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatter.format(balance)}</p>
            </div>
        </div>
    );
};

const AdminSection: React.FC<{ match: Match; onToggleRatingStatus: (matchId: number) => void }> = ({ match, onToggleRatingStatus }) => {
    const isRatingOpen = match.ratingStatus === 'OPEN';
    return (
        <div className="my-6 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3">Administración del Partido</h3>
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Estado de Calificaciones: <span className={`font-bold ${isRatingOpen ? 'text-green-500' : 'text-red-500'}`}>{isRatingOpen ? 'ABIERTAS' : 'CERRADAS'}</span>
                </p>
                <button
                    onClick={() => onToggleRatingStatus(match.id)}
                    className={`px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors ${isRatingOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                >
                    {isRatingOpen ? 'Cerrar Calificaciones' : 'Abrir Calificaciones'}
                </button>
            </div>
        </div>
    );
};


export const MatchCard: React.FC<MatchCardProps> = ({ match, players, currentUser, myTeam, opponents, onPlayerStatusChange, onPlayerPaymentChange, onCourtFeeChange, onStandingsChange, onPlayerRatingChange, onToggleRatingStatus, onPlayerStatsChange, onOpponentScoreChange, teams, isGeneratingTeams, onGenerateTeams, isAdmin }) => {
    const CalendarIcon = ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18M-4.5 12h22.5" /></svg> );
    const ClockIcon = ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg> );
    const LocationIcon = ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg> );
    
    const confirmedPlayers = match.playerStatuses.filter(p => p.attendanceStatus === AttendanceStatusEnum.CONFIRMED);
    const doubtfulPlayers = match.playerStatuses.filter(p => p.attendanceStatus === AttendanceStatusEnum.DOUBTFUL);
    const absentPlayers = match.playerStatuses.filter(p => p.attendanceStatus === AttendanceStatusEnum.ABSENT);

    const getPlayerName = (playerId: number) => {
        const player = players.find(p => p.id === playerId);
        return player ? `${player.firstName} ${player.lastName}` : 'Jugador Desconocido';
    };

    const handleShare = () => {
        const confirmed = confirmedPlayers.map(p => getPlayerName(p.playerId));
        const doubtful = doubtfulPlayers.map(p => getPlayerName(p.playerId));
        const absent = absentPlayers.map(p => getPlayerName(p.playerId));

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
¡Nos vemos en la cancha! 🍻
        `;

        if (navigator.share) {
            navigator.share({ title: 'Convocatoria Partido Sábado', text: shareText.trim() }).catch(console.error);
        } else {
            navigator.clipboard.writeText(shareText.trim());
            alert('¡Convocatoria copiada al portapapeles! Lista para pegar en WhatsApp.');
        }
    };
    
    const confirmedCount = confirmedPlayers.length;
    const totalPaid = match.playerStatuses.reduce((sum, ps) => sum + ps.amountPaid, 0);
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.address)}`;
    const playerShare = match.courtFee / Math.max(11, confirmedCount);
    
    const confirmedPlayerObjects = players.filter(player => 
        match.playerStatuses.some(ps => 
            ps.playerId === player.id && ps.attendanceStatus === AttendanceStatusEnum.CONFIRMED
        )
    );
    
    const myTeamScore = useMemo(() => 
        match.playerStatuses.reduce((total, ps) => total + (ps.goals || 0), 0), 
    [match.playerStatuses]);

    const opponent = opponents.find(o => o.id === match.opponentId);


    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">Próximo Partido</h2>
                
                <Scoreboard
                    myTeamName={myTeam?.name || "Mi Equipo"}
                    opponentName={opponent?.name || "Rival"}
                    myTeamScore={myTeamScore}
                    opponentScore={match.opponentScore || 0}
                    onOpponentScoreChange={(newScore) => onOpponentScoreChange(match.id, newScore)}
                    isAdmin={isAdmin}
                />
                
                {match.standings && match.tournamentRound && (
                    <LeagueStandings
                        round={match.tournamentRound}
                        standings={match.standings}
                        onPositionChange={(teamId, newPosition) => onStandingsChange(match.id, teamId, newPosition)}
                    />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                    <InfoItem icon={CalendarIcon} label="Fecha" value={match.date} />
                    <InfoItem icon={ClockIcon} label="Hora" value={match.time} />
                    <InfoItem 
                        icon={LocationIcon} 
                        label="Lugar" 
                        value={
                            <div>
                                <p>{match.location}</p>
                                <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                                    {match.address}
                                </a>
                            </div>
                        } 
                    />
                </div>
                
                <PaymentSummary 
                    fee={match.courtFee} 
                    paid={totalPaid} 
                    playerShare={playerShare}
                    onFeeChange={(newFee) => onCourtFeeChange(match.id, newFee)}
                    isAdmin={isAdmin} 
                />

                <PlayerList
                    playerStatuses={match.playerStatuses}
                    players={players}
                    onPlayerStatusChange={(playerId, newStatus) => onPlayerStatusChange(match.id, playerId, newStatus)}
                    onPlayerPaymentChange={(playerId, newStatus, amount) => onPlayerPaymentChange(match.id, playerId, newStatus, amount)}
                    onPlayerStatsChange={(playerId, field, value) => onPlayerStatsChange(match.id, playerId, field, value)}
                    playerShare={playerShare}
                    isAdmin={isAdmin}
                />

                {isAdmin && <AdminSection match={match} onToggleRatingStatus={onToggleRatingStatus} />}

                {match.ratingStatus === 'OPEN' && (
                    <PlayerRatingSection 
                        currentUser={currentUser}
                        players={confirmedPlayerObjects}
                        ratings={match.ratings || {}}
                        onRatingChange={(raterId, rateeId, rating) => onPlayerRatingChange(match.id, raterId, rateeId, rating)}
                    />
                )}

                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={onGenerateTeams} disabled={isGeneratingTeams || confirmedCount < 2} className="w-full sm:w-auto flex-grow justify-center items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isGeneratingTeams ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        <span>{isGeneratingTeams ? 'Generando Equipos...' : 'Armar Equipos con IA'}</span>
                    </button>

                    <button onClick={handleShare} className="w-full sm:w-auto flex-grow justify-center items-center px-6 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-colors duration-200 flex space-x-2">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.598-3.825-1.598-5.946C.146 5.338 5.428 0 11.986 0c3.189 0 6.168 1.24 8.45 3.488 2.282 2.248 3.525 5.262 3.525 8.451 0 6.648-5.282 12.034-11.84 12.034-1.99 0-3.896-.533-5.59-1.543L.057 24zM11.986 2.164c-5.462 0-9.897 4.434-9.897 9.897 0 2.05.613 4.02 1.785 5.718L2.14 21.8l2.005-1.984c1.61.968 3.48 1.54 5.46 1.54 5.46 0 9.897-4.434 9.897-9.897 0-5.463-4.435-9.897-9.897-9.897zm4.555 10.373c-.227-.114-1.343-.663-1.552-.738-.208-.075-.357-.114-.506.114-.149.227-.587.738-.72.877-.133.14-.266.16-.506.046-.24-.114-.999-.368-1.902-1.173-.705-.606-1.18-1.343-1.313-1.573-.133-.23.013-.357.101-.462.08-.094.178-.227.266-.341.089-.114.119-.19.178-.318.06-.128.03-.24-.009-.354s-.506-1.217-.695-1.666c-.18-.43-.368-.372-.506-.372h-.474c-.134 0-.357.06-.506.318-.15.26-.587.587-.587 1.432 0 .845.6 1.666.685 1.782.084.114 1.18 1.79 2.86 2.503.393.164.7.26.94.343.24.085.47.075.635.045.18-.03.587-.24.66-.475.075-.23.075-.43.045-.475-.03-.046-.113-.09-.24-.205z"/></svg>
                        <span>Compartir en WhatsApp</span>
                    </button>
                </div>
                 {confirmedCount < 2 && !isGeneratingTeams && <p className="text-center text-sm mt-4 text-gray-500 dark:text-gray-400">Se necesitan al menos 2 jugadores confirmados para armar los equipos.</p>}
                
                {teams && <TeamLineup teams={teams} />}
            </div>
        </div>
    );
};