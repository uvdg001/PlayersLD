import React from 'react';
import type { Tournament, Match, Opponent, MyTeam, Page, Venue } from '../../types.ts';

interface FixturePageProps {
    tournaments: Tournament[];
    myTeam: MyTeam | null;
    matches: Match[];
    opponents: Opponent[];
    venues: Venue[];
    setCurrentPage: (page: Page) => void;
    setSelectedMatchId: (id: number) => void;
    onOpenMatchForm: (params: { tournamentId: number, match?: Match }) => void;
    onDeleteMatch: (matchId: number) => void;
    isAdmin: boolean;
}

const MatchStatusBadge: React.FC<{ status?: string }> = ({ status }) => {
    const styles: { [key: string]: string } = {
        'PROGRAMADO': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        'FINALIZADO': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        'SUSPENDIDO': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status || ''] || 'bg-gray-100 text-gray-800'}`}>
            {status?.replace('_', ' ')}
        </span>
    );
};


export const FixturePage: React.FC<FixturePageProps> = ({ tournaments, myTeam, matches, opponents, setCurrentPage, setSelectedMatchId, onOpenMatchForm, onDeleteMatch, isAdmin }) => {
    
    const sortedTournaments = [...tournaments].sort((a, b) => b.year - a.year);

    const getOpponentName = (opponentId?: number): string => {
        const opponent = opponents.find(o => o.id === opponentId);
        return opponent ? opponent.name : "Rival a definir";
    };
    
    const myTeamScore = (match: Match) => matches.find(m => m.id === match.id)?.playerStatuses.reduce((total, ps) => total + (ps.goalsPlay || 0) + (ps.goalsPenalty || 0) + (ps.goalsHeader || 0) + (ps.goalsSetPiece || 0), 0) ?? 0;

    const confirmDelete = (matchId: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        const confirmation = window.prompt("⚠️ ¿Seguro que quieres eliminar este partido?\n\nPara confirmar, escribe: ELIMINAR");
        if (confirmation === "ELIMINAR") {
            onDeleteMatch(matchId);
        } else if (confirmation !== null) {
            alert("Acción cancelada. Debes escribir 'ELIMINAR'.");
        }
    };

    const handleMatchClick = (matchId: number) => {
        setSelectedMatchId(matchId);
        setCurrentPage('home');
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">Fixture de Torneos</h2>

            {sortedTournaments.length > 0 ? (
                sortedTournaments.map(tournament => {
                    const tournamentMatches = matches
                        .filter(m => m.tournamentId === tournament.id)
                        .sort((a, b) => (a.tournamentRound || 0) - (b.tournamentRound || 0));
                    const isFinished = tournament.status === 'FINALIZADO';

                    return (
                        <div key={tournament.id} className={`p-4 border dark:border-gray-700 rounded-lg ${isFinished ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{tournament.name} - {tournament.year}</h3>
                                    <p className="text-sm text-gray-500">{tournament.description}</p>
                                </div>
                                {isAdmin && !isFinished && (
                                    <button onClick={() => onOpenMatchForm({ tournamentId: tournament.id })} className="px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors">
                                        + Agregar Fecha
                                    </button>
                                )}
                            </div>
                            
                            {tournamentMatches.length > 0 ? (
                                <div className="space-y-3">
                                    {tournamentMatches.map(match => (
                                        <div 
                                            key={match.id} 
                                            onClick={() => handleMatchClick(match.id)}
                                            className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-white dark:hover:bg-gray-600 hover:shadow-md transition-all cursor-pointer group border border-transparent hover:border-gray-300 dark:hover:border-gray-500"
                                            title="Ver detalles del partido"
                                        >
                                            <div 
                                                className="flex-grow grid grid-cols-1 md:grid-cols-5 gap-4 items-center"
                                            >
                                                <div className="font-semibold flex items-center gap-2">
                                                    <span className="bg-indigo-200 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 px-2 py-1 rounded-md">F {match.tournamentRound || '-'}</span>
                                                    <MatchStatusBadge status={match.status} />
                                                </div>
                                                <div className="md:col-span-2 text-center font-bold">
                                                    <span>{myTeam?.name || 'Mi Equipo'}</span>
                                                    {match.status === 'FINALIZADO' && (
                                                    <span className="mx-2 px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded-md shadow-inner">
                                                            {myTeamScore(match) ?? '-'} : {match.opponentScore ?? '-'}
                                                    </span>
                                                    )}
                                                    {match.status !== 'FINALIZADO' && <span className="mx-2 text-gray-400">vs</span>}
                                                    <span>{getOpponentName(match.opponentId)}</span>
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400 md:col-span-2 md:text-right">
                                                    <span className="font-bold text-blue-600 dark:text-blue-400 block w-full text-right">
                                                        📅 {match.date}
                                                    </span>
                                                    <p>{match.time} hs</p>
                                                    <p>{match.location} {match.courtNumber && `(Cancha ${match.courtNumber})`}</p>
                                                </div>
                                            </div>
                                            <div className="pl-4 flex items-center gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onOpenMatchForm({ tournamentId: tournament.id, match: match }); }}
                                                    className="p-2 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                                    title="Editar Fecha"
                                                >
                                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                                </button>
                                                <button
                                                    onClick={(e) => confirmDelete(match.id, e)}
                                                    className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Eliminar Fecha"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">Aún no hay fechas programadas para este torneo.</p>
                            )}
                        </div>
                    );
                })
            ) : (
                 <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No hay torneos creados. ¡Ve a la sección "Torneos" para empezar!</p>
                </div>
            )}
        </div>
    );
};