import React from 'react';
import type { Tournament, Match, Opponent, Venue, MyTeam, Page } from '../../types';

interface FixturePageProps {
    tournaments: Tournament[];
    myTeam: MyTeam | null;
    matches: Match[];
    opponents: Opponent[];
    venues: Venue[];
    setCurrentPage: (page: Page) => void;
    setSelectedMatchId: (id: number) => void;
}

const MatchStatusBadge: React.FC<{ status?: string }> = ({ status }) => {
    const styles: { [key: string]: string } = {
        'PROGRAMADO': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        'FINALIZADO': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        'SUSPENDIDO': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status || ''] || 'bg-gray-100 text-gray-800'}`}>
            {status?.replace('_', ' ')}
        </span>
    );
};


export const FixturePage: React.FC<FixturePageProps> = ({ tournaments, myTeam, matches, opponents, venues, setCurrentPage, setSelectedMatchId }) => {
    
    const sortedTournaments = [...tournaments].sort((a, b) => b.year - a.year);

    const getOpponentName = (opponentId?: number): string => {
        const opponent = opponents.find(o => o.id === opponentId);
        return opponent ? opponent.name : "Rival a definir";
    };

    const getVenueName = (venueId?: number): string => {
        const venue = venues.find(v => v.id === venueId);
        return venue ? venue.name : "Cancha a definir";
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">Fixture de Torneos</h2>

            {sortedTournaments.length > 0 ? (
                sortedTournaments.map(tournament => {
                    const tournamentMatches = matches
                        .filter(m => m.tournamentId === tournament.id)
                        .sort((a, b) => (a.tournamentRound || 0) - (b.tournamentRound || 0));

                    return (
                        <div key={tournament.id} className="p-4 border dark:border-gray-700 rounded-lg">
                            <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{tournament.name} - {tournament.year}</h3>
                            <p className="text-sm text-gray-500 mb-4">{tournament.description}</p>
                            
                            {tournamentMatches.length > 0 ? (
                                <div className="space-y-3">
                                    {tournamentMatches.map(match => (
                                        <button 
                                            key={match.id} 
                                            onClick={() => {
                                                setSelectedMatchId(match.id);
                                                setCurrentPage('home');
                                            }}
                                            className="w-full text-left grid grid-cols-1 md:grid-cols-5 gap-4 items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            <div className="font-semibold flex items-center gap-2">
                                                <span className="bg-indigo-200 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 px-2 py-1 rounded-md">F {match.tournamentRound || '-'}</span>
                                                <MatchStatusBadge status={match.status} />
                                            </div>
                                            <div className="md:col-span-2 text-center font-bold">
                                                <span>{myTeam?.name || 'Mi Equipo'}</span>
                                                {match.status === 'FINALIZADO' && (
                                                   <span className="mx-2 px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded-md">
                                                        {match.myTeamScore ?? '-'} : {match.opponentScore ?? '-'}
                                                   </span>
                                                )}
                                                {match.status !== 'FINALIZADO' && <span className="mx-2 text-gray-400">vs</span>}
                                                <span>{getOpponentName(match.opponentId)}</span>
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 md:col-span-2 md:text-right">
                                                <p>{match.date} - {match.time} hs</p>
                                                <p>{getVenueName(match.venueId)} {match.courtNumber && `(Cancha ${match.courtNumber})`}</p>
                                            </div>
                                        </button>
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