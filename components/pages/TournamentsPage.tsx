
import React, { useState } from 'react';
import type { Tournament, Match, Page } from '../../types.ts';
import { TournamentForm } from '../forms/TournamentForm.tsx';

interface TournamentsPageProps {
    tournaments: Tournament[];
    matches: Match[];
    onAddTournament: (newTournament: Omit<Tournament, 'id'>) => void;
    onUpdateTournament: (tournament: Tournament) => void;
    onDeleteTournament: (tournamentId: number) => void;
    onOpenMatchForm: (params: { tournamentId: number, match?: Match }) => void;
    isAdmin: boolean;
}

const TournamentStatusBadge: React.FC<{ status?: string }> = ({ status = 'EN_CURSO' }) => {
    const isFinished = status === 'FINALIZADO';
    const styles = isFinished
        ? 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles}`}>
            {isFinished ? 'Finalizado' : 'En Curso'}
        </span>
    );
};

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


export const TournamentsPage: React.FC<TournamentsPageProps> = ({
    tournaments,
    matches,
    onAddTournament,
    onUpdateTournament,
    onDeleteTournament,
    onOpenMatchForm,
    isAdmin,
}) => {
    const [isTournamentFormOpen, setIsTournamentFormOpen] = useState(false);
    const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

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

    const handleToggleTournamentStatus = (tournament: Tournament) => {
        const newStatus = tournament.status === 'FINALIZADO' ? 'EN_CURSO' : 'FINALIZADO';
        onUpdateTournament({ ...tournament, status: newStatus });
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
            
            <div className="space-y-6 mt-6">
                {tournaments.map(tournament => {
                    const isFinished = tournament.status === 'FINALIZADO';
                    const tournamentMatches = matches
                        .filter(m => m.tournamentId === tournament.id)
                        .sort((a, b) => (a.tournamentRound || 0) - (b.tournamentRound || 0));

                    return (
                        <div key={tournament.id} className={`p-4 border rounded-lg dark:border-gray-700 ${isFinished ? 'opacity-70' : ''}`}>
                             <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-xl font-bold">{tournament.name} ({tournament.year})</h3>
                                        <TournamentStatusBadge status={tournament.status} />
                                    </div>
                                    <p className="text-sm text-gray-500">{tournament.description}</p>
                                </div>
                                {isAdmin && (
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => handleToggleTournamentStatus(tournament)} className={`px-3 py-1 text-xs font-semibold rounded-md ${isFinished ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                                            {isFinished ? 'Reabrir' : 'Finalizar'}
                                        </button>
                                        <button onClick={() => handleEditTournament(tournament)} className="p-2 text-blue-500 hover:text-blue-700" title="Editar Torneo">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" /></svg>
                                        </button>
                                        <button onClick={() => onDeleteTournament(tournament.id)} className="p-2 text-red-500 hover:text-red-700" title="Eliminar Torneo">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                            {tournamentMatches.length > 0 ? (
                                <div className="space-y-3 mt-4">
                                    {tournamentMatches.map(match => (
                                        <div 
                                            key={match.id} 
                                            className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-md"
                                        >
                                            <div className="font-semibold flex items-center gap-2">
                                                <span className="bg-indigo-200 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 px-2 py-1 rounded-md">F {match.tournamentRound || '-'}</span>
                                                <MatchStatusBadge status={match.status} />
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 text-right">
                                                <p>{match.date}</p>
                                                <p>{match.location}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-4 text-xs text-gray-400">Para ver, editar o eliminar fechas, ve a la sección <strong>"Fixture"</strong>.</p>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
};
