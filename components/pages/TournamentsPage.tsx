import React, { useState } from 'react';
import type { Tournament, Match } from '../../types.ts';
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
    
    const handleSecureDelete = (tournament: Tournament) => {
        const confirmation = window.prompt(`⛔ ZONA DE PELIGRO ⛔\n\nEstás a punto de eliminar el torneo "${tournament.name}".\n\nEscribe "eliminar" para confirmar:`);
        
        // Allow case insensitive (Eliminar, eliminar, ELIMINAR) and trim spaces
        if (confirmation && confirmation.trim().toLowerCase() === "eliminar") {
            onDeleteTournament(tournament.id);
        } else if (confirmation !== null) {
            alert("No se eliminó. Debes escribir 'eliminar' correctamente.");
        }
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
                        <div key={tournament.id} className={`p-4 border rounded-lg dark:border-gray-700 ${isFinished ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                             <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-xl font-bold">{tournament.name} ({tournament.year})</h3>
                                        <TournamentStatusBadge status={tournament.status} />
                                    </div>
                                    <p className="text-sm text-gray-500">{tournament.description}</p>
                                </div>
                                <div className="flex gap-2">
                                    {isAdmin && !isFinished && (
                                        <button onClick={() => onOpenMatchForm({ tournamentId: tournament.id })} className="px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors">
                                            + Agregar Fecha
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleEditTournament(tournament)}
                                        className="px-3 py-1.5 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50 rounded-lg transition-colors"
                                        title="Editar Torneo"
                                    >
                                        ✏️
                                    </button>
                                    <button 
                                        onClick={() => handleSecureDelete(tournament)}
                                        className="px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                                        title="Eliminar Torneo"
                                    >
                                        🗑️
                                    </button>
                                </div>
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
                    );
                })}
            </div>
        </div>
    );
};