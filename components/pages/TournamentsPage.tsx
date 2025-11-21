import React, { useState } from 'react';
import type { Tournament, Match, Venue, Opponent, Page } from '../../types';
import { TournamentForm } from '../forms/TournamentForm';
import { MatchForm } from '../forms/MatchForm';

interface TournamentsPageProps {
    tournaments: Tournament[];
    matches: Match[];
    venues: Venue[];
    opponents: Opponent[];
    onAddTournament: (newTournament: Omit<Tournament, 'id'>) => void;
    onUpdateTournament: (tournament: Tournament) => void;
    onDeleteTournament: (tournamentId: number) => void;
    onAddMatch: (newMatchData: Omit<Match, 'id' | 'playerStatuses' | 'ratingStatus'>) => void;
    onUpdateMatch: (match: Match) => void;
    onDeleteMatch: (matchId: number) => void;
    setCurrentPage: (page: Page) => void;
    setSelectedMatchId: (id: number) => void;
    isAdmin: boolean;
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


export const TournamentsPage: React.FC<TournamentsPageProps> = ({
    tournaments,
    matches,
    venues,
    opponents,
    onAddTournament,
    onUpdateTournament,
    onDeleteTournament,
    onAddMatch,
    onUpdateMatch,
    onDeleteMatch,
    setCurrentPage,
    setSelectedMatchId,
    isAdmin,
}) => {
    const [isTournamentFormOpen, setIsTournamentFormOpen] = useState(false);
    const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
    const [isMatchFormOpen, setIsMatchFormOpen] = useState(false);
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);
    const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
    const [matchesForForm, setMatchesForForm] = useState<Match[]>([]);
    const [nextRoundForNewMatch, setNextRoundForNewMatch] = useState<number>(1);


    const handleEditTournament = (tournament: Tournament) => {
        setEditingTournament(tournament);
        setIsTournamentFormOpen(true);
    };

    const handleAddNewTournament = () => {
        setEditingTournament(null);
        setIsTournamentFormOpen(true);
    };

    const handleSaveTournament = (data: Tournament | Omit<Tournament, 'id'>) => {
        if ('id' in data) {
            onUpdateTournament(data);
        } else {
            onAddTournament(data);
        }
        setIsTournamentFormOpen(false);
    };
    
    const handleOpenNewMatchForm = (tournamentId: number) => {
        const tournamentMatches = matches.filter(m => m.tournamentId === tournamentId);
        const nextRound = tournamentMatches.length > 0 ? Math.max(...tournamentMatches.map(m => m.tournamentRound || 0)) + 1 : 1;
        
        setMatchesForForm(tournamentMatches);
        setNextRoundForNewMatch(nextRound);
        setSelectedTournamentId(tournamentId);
        setEditingMatch(null);
        setIsMatchFormOpen(true);
    };
    
    const handleOpenEditMatchForm = (match: Match) => {
        const tournamentMatches = matches.filter(m => m.tournamentId === match.tournamentId);
        setMatchesForForm(tournamentMatches);
        setSelectedTournamentId(match.tournamentId || null);
        setEditingMatch(match);
        setIsMatchFormOpen(true);
    };

    const handleSaveMatch = (matchData: Match | Omit<Match, 'id' | 'playerStatuses' | 'ratingStatus'>) => {
        if ('id' in matchData) {
            onUpdateMatch(matchData);
        } else if (selectedTournamentId) {
            onAddMatch({ ...matchData, tournamentId: selectedTournamentId });
        }
        setIsMatchFormOpen(false);
        setSelectedTournamentId(null);
        setEditingMatch(null);
    };


    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Torneos y Fechas</h2>
                {isAdmin && (
                    <button
                        onClick={handleAddNewTournament}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                    >
                        Crear Torneo
                    </button>
                )}
            </div>

            {isTournamentFormOpen && (
                <TournamentForm
                    tournament={editingTournament}
                    onSave={handleSaveTournament}
                    onCancel={() => setIsTournamentFormOpen(false)}
                />
            )}
            
            {isMatchFormOpen && (
                <MatchForm
                    match={editingMatch}
                    onSave={handleSaveMatch}
                    onCancel={() => setIsMatchFormOpen(false)}
                    venues={venues}
                    opponents={opponents}
                    tournamentMatches={matchesForForm}
                    nextRoundNumber={nextRoundForNewMatch}
                />
            )}

            <div className="space-y-6 mt-6">
                {tournaments.map(tournament => {
                    const tournamentMatches = matches.filter(m => m.tournamentId === tournament.id);
                    return (
                        <div key={tournament.id} className="p-4 border rounded-lg dark:border-gray-700">
                             <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold">{tournament.name} ({tournament.year})</h3>
                                    <p className="text-sm text-gray-500">{tournament.description}</p>
                                </div>
                                {isAdmin && (
                                    <div className="flex space-x-2">
                                        <button onClick={() => handleEditTournament(tournament)} className="p-2 text-blue-500 hover:text-blue-700">Editar</button>
                                        <button onClick={() => onDeleteTournament(tournament.id)} className="p-2 text-red-500 hover:text-red-700">Eliminar</button>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4">
                                <h4 className="font-semibold mb-2">Partidos del Torneo:</h4>
                                <div className="space-y-2">
                                    {tournamentMatches.map(match => (
                                        <div key={match.id} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                            <div 
                                                className="flex-1 cursor-pointer"
                                                onClick={() => {
                                                    setSelectedMatchId(match.id);
                                                    setCurrentPage('home');
                                                }}
                                            >
                                                <p className="font-semibold">Fecha {match.tournamentRound}: <span className="font-normal">{match.date} - {match.location} {match.courtNumber && `(Cancha ${match.courtNumber})`}</span></p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <MatchStatusBadge status={match.status} />
                                                {isAdmin && (
                                                    <>
                                                        <button onClick={(e) => { e.stopPropagation(); handleOpenEditMatchForm(match) }} className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" title="Editar Fecha">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); onDeleteMatch(match.id)}} className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" title="Borrar Fecha">
                                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                 {isAdmin && (
                                    <button onClick={() => handleOpenNewMatchForm(tournament.id)} className="mt-3 text-sm px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                                        + Agregar Fecha
                                    </button>
                                 )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};