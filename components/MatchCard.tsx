import React, { useState, useMemo } from 'react';
import type { Match, Teams, Player, MyTeam, Opponent, PlayerMatchStatus } from '../types.ts';
import { PlayerRole, AttendanceStatus } from '../types.ts';
import { TeamLineup } from './TeamLineup.tsx';
import { LeagueStandings } from './LeagueStandings.tsx';
import { useToast } from '../hooks/useToast.ts';
import { AttendanceGrid } from './AttendanceGrid.tsx';
import { MatchAdminModal } from './MatchAdminModal.tsx'; 
import { saveDocument } from '../services/firebaseService.ts'; 
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface MatchCardProps {
    teamId: string;
    match: Match;
    players: Player[];
    currentUser: Player;
    myTeam: MyTeam | null;
    opponents: Opponent[];
    onPlayerStatusChange: (matchId: number, playerId: number, newStatus: AttendanceStatus) => Promise<void>;
    onCourtFeeChange: (matchId: number, newFee: number) => Promise<void>;
    onUpdateMatchDetails: (matchId: number, field: string, value: any) => Promise<void>;
    onStandingsChange: (matchId: number, teamId: number, newPosition: number) => Promise<void>;
    onPlayerRatingChange: (matchId: number, raterId: number, rateeId: number, rating: number) => Promise<void>;
    onToggleRatingStatus: (matchId: number) => Promise<void>;
    onPlayerStatsChange: (matchId: number, playerId: number, field: keyof PlayerMatchStatus, value: any) => Promise<void>;
    onOpponentScoreChange: (matchId: number, newScore: number) => Promise<void>;
    teams: Teams | null;
    onGenerateTeams: () => Promise<void>;
    isAdmin: boolean;
    allMatches?: Match[];
    onSelectMatch?: (matchId: number) => void;
    isGeneratingTeams: boolean;
    onDeleteMatch?: (matchId: number) => void;
    onViewProfile?: (player: Player) => void;
}

const Scoreboard: React.FC<{ matchId: number; myTeamName: string; opponentName: string; opponentJerseyColor?: string; myTeamScore: number; opponentScore: number; onOpponentScoreChange: (matchId: number, newScore: number) => Promise<void>; isAdmin: boolean; }> = ({ matchId, myTeamName, opponentName, opponentJerseyColor, myTeamScore, opponentScore, onOpponentScoreChange, isAdmin }) => {
    const [isEditingOpponentScore, setIsEditingOpponentScore] = useState(false);
    const [tempOpponentScore, setTempOpponentScore] = useState(opponentScore.toString());
    const handleSaveOpponentScore = () => { onOpponentScoreChange(matchId, parseInt(tempOpponentScore, 10)); setIsEditingOpponentScore(false); };
    
    return (
        <div className="my-2 p-3 bg-gray-900 text-white rounded-xl flex flex-col items-center justify-around shadow-md border border-gray-700">
            <div className="flex items-center justify-around w-full">
                <div className="text-center w-1/3"><p className="font-black text-xs md:text-sm uppercase tracking-tighter truncate text-white/90">{myTeamName}</p></div>
                <div className="text-center font-black text-3xl md:text-4xl flex items-center space-x-2">
                    <span className="text-white">{myTeamScore}</span><span className="text-gray-600">-</span>
                    {isEditingOpponentScore && isAdmin ? (
                         <input type="number" value={tempOpponentScore} onChange={(e) => setTempOpponentScore(e.target.value)} onBlur={handleSaveOpponentScore} onKeyDown={(e) => e.key === 'Enter' && handleSaveOpponentScore()} className="w-12 text-center bg-gray-700 border border-blue-500 rounded text-white text-2xl" autoFocus />
                    ) : ( <span onClick={() => isAdmin && setIsEditingOpponentScore(true)} className={`text-white ${isAdmin ? "cursor-pointer" : ""}`}>{opponentScore}</span> )}
                </div>
                <div className="text-center w-1/3"><div className="flex items-center justify-center gap-1">{opponentJerseyColor && (<div className="w-2 h-2 rounded-full" style={{ backgroundColor: opponentJerseyColor }}></div>)}<p className="font-black text-xs md:text-sm uppercase tracking-tighter truncate text-white/90">{opponentName}</p></div></div>
            </div>
        </div>
    );
};

export const MatchCard: React.FC<MatchCardProps> = ({ teamId, match, players, currentUser, myTeam, opponents, onPlayerStatusChange, onPlayerStatsChange, onCourtFeeChange, onUpdateMatchDetails, onStandingsChange, onToggleRatingStatus, onOpponentScoreChange, teams, onGenerateTeams, isAdmin, allMatches, onSelectMatch, isGeneratingTeams, onDeleteMatch, onViewProfile }) => {
    const { t } = useLanguage();
    const toast = useToast();
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [isEditingCourtFee, setIsEditingCourtFee] = useState(false);
    const [tempCourtFee, setTempCourtFee] = useState(match.courtFee?.toString() || '0');
    
    const isStaff = (p: Player | undefined) => p?.role === PlayerRole.DT || p?.role === PlayerRole.AYUDANTE;
    const confirmedPlayers = match.playerStatuses.filter(p => p.attendanceStatus === AttendanceStatus.CONFIRMED && !isStaff(players.find(pl => pl.id === p.playerId)));
    const confirmedCount = confirmedPlayers.length;
    const myTeamScore = useMemo(() => match.playerStatuses.reduce((total, ps) => total + (ps.goalsPlay || 0) + (ps.goalsPenalty || 0) + (ps.goalsHeader || 0) + (ps.goalsSetPiece || 0), 0), [match.playerStatuses]);
    const opponent = opponents.find(o => o.id === match.opponentId);

    const formattedDateShort = useMemo(() => {
        try {
            const dayMatch = match.date.match(/\b\d{1,2}\b/);
            const yearMatch = match.date.match(/\d{4}/);
            const dayStr = dayMatch ? dayMatch[0].padStart(2, '0') : '??';
            const yearStr = yearMatch ? yearMatch[0].substring(2) : '??';
            const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
            const monthsShort = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
            const lowerDate = match.date.toLowerCase();
            let monthIdx = months.findIndex(m => lowerDate.includes(m));
            if (monthIdx === -1) monthIdx = monthsShort.findIndex(m => lowerDate.includes(m));
            if (monthIdx === -1) {
                const numbers = match.date.match(/\d+/g);
                if (numbers && numbers.length >= 2) monthIdx = parseInt(numbers[1], 10) - 1;
            }
            const monthStr = monthIdx !== -1 ? (monthIdx + 1).toString().padStart(2, '0') : '??';
            return `${dayStr}/${monthStr}/${yearStr}`;
        } catch (e) { return match.date.length > 8 ? match.date.substring(0, 8) : match.date; }
    }, [match.date]);

    const handleBatchSave = async (updatedStatuses: PlayerMatchStatus[]) => {
        try { 
            await saveDocument(teamId, 'matches', match.id.toString(), { playerStatuses: updatedStatuses }); 
            toast.success("Guardado"); 
        } catch (e) { toast.error("Error"); }
    };

    const handleSaveCourtFee = async () => {
        const fee = parseFloat(tempCourtFee);
        if(!isNaN(fee)) {
            await onCourtFeeChange(match.id, fee);
            toast.success("Costo de cancha actualizado");
        }
        setIsEditingCourtFee(false);
    };

    const handleFinishMatch = async () => {
        if (window.confirm("🏁 ¿Quieres FINALIZAR el partido?\n\nEsto habilitará las votaciones y cerrará la carga de datos principal.")) {
            try {
                await onUpdateMatchDetails(match.id, 'status', 'FINALIZADO');
                toast.success("¡Partido Finalizado! 🏁");
            } catch (e) {
                toast.error("Error al finalizar");
            }
        }
    };

    const handleSecureDelete = () => {
        const confirmation = window.prompt("⚠️ ¿Borrar este partido?\nEscribe: ELIMINAR");
        if (confirmation === "ELIMINAR") {
            if (onDeleteMatch) onDeleteMatch(match.id);
        }
    };
    
    const handleAdminOpen = () => {
        if (match.status === 'FINALIZADO') {
            const enteredPin = window.prompt("🔒 Seguridad Admin:\nIngresa tu PIN para editar:");
            if (enteredPin === currentUser.pin) setIsAdminModalOpen(true);
            else if (enteredPin !== null) toast.error("PIN Incorrecto.");
        } else setIsAdminModalOpen(true);
    };

    const handleShare = async () => {
        let shareText = '';
        const oppName = opponent?.name || 'Rival';

        if (match.status === 'FINALIZADO') {
            shareText = `*⚽ RESULTADO FINAL: vs ${oppName}*\n`;
            shareText += `🗓️ ${match.date}\n`;
            shareText += `🏟️ ${match.location}\n`;
            shareText += `--------------------------\n`;
            shareText += `🔥 *${myTeam?.name || 'PLAYERS LD'}* ${myTeamScore} - ${match.opponentScore || 0} *${oppName}*\n`;
            shareText += `--------------------------\n\n`;

            const goalScorers = match.playerStatuses
                .filter(ps => ps.attendanceStatus === AttendanceStatus.CONFIRMED)
                .map(ps => {
                    const p = players.find(x => x.id === ps.playerId);
                    const total = (ps.goalsPlay || 0) + (ps.goalsHeader || 0) + (ps.goalsPenalty || 0) + (ps.goalsSetPiece || 0);
                    return total > 0 ? { nickname: p?.nickname, total } : null;
                })
                .filter(Boolean);

            if (goalScorers.length > 0) {
                shareText += `⚽ *GOLEADORES:*\n`;
                goalScorers.forEach(g => shareText += `- ${g?.nickname}: ${g?.total}\n`);
                shareText += `\n`;
            }
            shareText += `🗣️ _¡Gran partido equipo!_`;
        } else {
            const getNames = (s: AttendanceStatus) => match.playerStatuses.filter(p => p.attendanceStatus === s && !isStaff(players.find(pl => pl.id === p.playerId))).map(p => players.find(pl => pl.id === p.playerId)?.nickname).join('\n');
            shareText = `*${t.appTitle}*\n🗓️ ${match.date} ${match.time}\n📍 ${match.location}\n\n*${t.callUp}*\n✅ (${confirmedCount}):\n${getNames(AttendanceStatus.CONFIRMED) || '-'}\n\n❓:\n${getNames(AttendanceStatus.DOUBTFUL) || '-'}\n\n❌:\n${getNames(AttendanceStatus.ABSENT) || '-'}`;
        }

        window.location.href = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
    };

    const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.location + ' ' + match.address)}`;
    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden relative border border-gray-200 dark:border-gray-700">
            <div className="p-3 md:p-5">
                 <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        {allMatches && onSelectMatch ? (
                            <select value={match.id} onChange={(e) => onSelectMatch(Number(e.target.value))} className="bg-transparent font-black text-sm text-gray-800 dark:text-white outline-none cursor-pointer border-b border-indigo-200">
                                {allMatches.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(m => (<option key={m.id} value={m.id}>{m.date}</option>))}
                            </select>
                        ) : <span className="font-black text-sm text-gray-800 dark:text-white uppercase italic tracking-tight">{t.nextMatch}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        {isAdmin && <button onClick={handleSecureDelete} className="text-red-400 p-1 hover:bg-red-50 rounded">🗑️</button>}
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border shadow-sm ${match.status === 'FINALIZADO' ? 'bg-blue-600 text-white border-blue-700' : 'bg-green-600 text-white border-green-700'}`}>
                            {match.status || 'PROGRAMADO'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 w-full">
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-xl border-b-4 border-gray-300 dark:border-gray-600 text-center flex flex-col justify-center min-h-[60px]">
                        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase leading-none mb-1">DÍA</p>
                        <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">{formattedDateShort}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/30 p-2 rounded-xl border-b-4 border-red-300 dark:border-red-900 text-center flex flex-col justify-center min-h-[60px]">
                        <p className="text-[10px] font-black text-red-500 uppercase leading-none mb-1">FECHA</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none italic">#{match.tournamentRound || '1'}</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded-xl border-b-4 border-orange-300 dark:border-orange-900 text-center flex flex-col justify-center min-h-[60px]">
                        <p className="text-[10px] font-black text-orange-600 uppercase leading-none mb-1">PARTIDO</p>
                        <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">{match.time} <span className="text-[9px] font-normal text-gray-500">hs</span></p>
                    </div>
                </div>

                <div className="space-y-2 mb-3">
                    <a href={mapSearchUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border-2 border-blue-200 dark:border-blue-800 flex items-center justify-between shadow-sm group">
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-red-600 uppercase leading-none mb-1">CANCHA</p>
                            <p className="text-base font-black text-gray-800 dark:text-white truncate uppercase tracking-tighter italic leading-none">{match.location}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-none mt-2 opacity-80">{match.address}</p>
                        </div>
                        <div className="bg-red-500 w-8 h-8 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0 ml-2">
                            <span className="text-white text-sm">📍</span>
                        </div>
                    </a>

                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl border-2 border-emerald-100 dark:border-emerald-900 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">VALOR TOTAL CANCHA</p>
                            {isEditingCourtFee ? (
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        value={tempCourtFee} 
                                        onChange={(e) => setTempCourtFee(e.target.value)} 
                                        className="w-24 p-1 bg-white dark:bg-gray-800 border rounded font-black text-sm"
                                        autoFocus
                                    />
                                    <button onClick={handleSaveCourtFee} className="text-green-500 font-bold text-xs uppercase">OK</button>
                                </div>
                            ) : (
                                <p className="text-lg font-black text-gray-800 dark:text-white leading-none">
                                    {formatter.format(match.courtFee)}
                                    {isAdmin && <button onClick={() => setIsEditingCourtFee(true)} className="ml-2 text-gray-400 hover:text-indigo-500">✏️</button>}
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                             <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">ESTIMADO / PERA</p>
                             <p className="text-lg font-black text-emerald-700 leading-none">{formatter.format(confirmedCount > 0 ? match.courtFee / confirmedCount : 0)}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-6 bg-white dark:bg-gray-800 py-2 rounded-lg mb-3 border-2 border-gray-100 dark:border-gray-700 shadow-inner">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-indigo-600 uppercase">🕒 LLEGADA:</span>
                        <span className="text-xs font-black text-gray-800 dark:text-white">{match.warmUpTime || '21:00'} hs</span>
                    </div>
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-600"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-orange-600 uppercase">🔥 CALOR:</span>
                        <span className="text-xs font-black text-gray-800 dark:text-white">{match.coachTalkTime || '21:15'} hs</span>
                    </div>
                </div>

                <Scoreboard matchId={match.id} myTeamName={myTeam?.name || 'LD'} opponentName={opponent?.name || 'Rival'} opponentJerseyColor={opponent?.jerseyColor} myTeamScore={myTeamScore} opponentScore={match.opponentScore || 0} onOpponentScoreChange={onOpponentScoreChange} isAdmin={isAdmin} />
                
                <div className="flex flex-col gap-3 mt-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase italic tracking-tight">Convocatoria ({confirmedCount})</h3>
                        <div className="flex gap-2">
                            {isAdmin && <button onClick={handleAdminOpen} className="px-3 py-1.5 bg-gray-800 text-white font-black rounded-lg shadow shadow-black/20 text-[10px] uppercase tracking-tighter transition-transform active:scale-95">{match.status === 'FINALIZADO' ? '🔒 Admin' : '🛠️ Admin'}</button>}
                            <button onClick={handleShare} className="px-3 py-1.5 bg-indigo-600 text-white font-black rounded-lg shadow shadow-indigo-500/20 text-[10px] uppercase tracking-tighter transition-transform active:scale-95">{match.status === 'FINALIZADO' ? 'Resumen WA' : 'WhatsApp'}</button>
                        </div>
                    </div>

                    {isAdmin && match.status !== 'FINALIZADO' && (
                        <button 
                            onClick={handleFinishMatch}
                            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg shadow-red-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2 uppercase italic tracking-tighter text-sm"
                        >
                            <span>🏁</span> FINALIZAR PARTIDO Y CERRAR FECHA
                        </button>
                    )}
                </div>
                
                <AttendanceGrid 
                    playerStatuses={match.playerStatuses} 
                    players={players} 
                    onPlayerStatusChange={(pId, status) => onPlayerStatusChange(match.id, pId, status)} 
                    onPlayerStatsChange={(pId, field, value) => onPlayerStatsChange(match.id, pId, field, value)}
                    currentUser={currentUser} 
                    isAdmin={isAdmin} 
                    matchStatus={match.status} 
                    onViewProfile={onViewProfile} 
                />

                {isAdmin && confirmedPlayers.length > 0 && match.status === 'PROGRAMADO' && (
                    <div className="mt-4 text-center pt-4 border-t-2 border-dashed border-gray-100 dark:border-gray-700">
                        <button onClick={onGenerateTeams} className="px-6 py-2.5 bg-green-600 text-white font-black rounded-xl shadow-lg hover:bg-green-700 text-xs uppercase tracking-widest transition-all active:scale-95" disabled={isGeneratingTeams}>{isGeneratingTeams ? 'MEZCLANDO...' : 'ARMAR EQUIPOS'}</button>
                        {teams && <TeamLineup teams={teams} />}
                    </div>
                )}
                {match.tournamentRound && match.standings && <LeagueStandings round={match.tournamentRound} standings={match.standings} onPositionChange={(teamId, newPos) => onStandingsChange(match.id, teamId, newPos)} />}
                {isAdmin && (
                    <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 flex items-center justify-between">
                        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest px-2">VOTACIÓN: <span className={match.ratingStatus === 'OPEN' ? 'text-green-600' : 'text-red-500'}>{match.ratingStatus === 'OPEN' ? 'ABIERTA' : 'CERRADA'}</span></p>
                        <button onClick={() => onToggleRatingStatus(match.id)} className={`px-4 py-1 text-[10px] font-black text-white rounded-lg shadow-sm transition-all active:scale-95 ${match.ratingStatus === 'OPEN' ? 'bg-red-500' : 'bg-green-600'}`}>{match.ratingStatus === 'OPEN' ? 'CERRAR' : 'ABRIR'}</button>
                    </div>
                )}
            </div>
            {isAdminModalOpen && <MatchAdminModal match={match} players={players} onClose={() => setIsAdminModalOpen(false)} onSave={handleBatchSave} />}
        </div>
    );
};