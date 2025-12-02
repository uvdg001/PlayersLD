
import React, { useState, useMemo } from 'react';
import type { Player } from '../types.ts';
import { PlayerRole } from '../types.ts';
import { PlayerForm } from './PlayerForm.tsx';
import { StarRating } from './StarRating.tsx';
import { RoleIcon } from './icons.tsx';
import { useToast } from '../hooks/useToast.ts';

interface RosterManagementModalProps {
    players: Player[];
    onClose: () => void;
    onAddPlayer: (newPlayer: Omit<Player, 'id'>) => void;
    onUpdatePlayer: (player: Player) => void;
    onDeletePlayer: (playerId: number) => void;
    onViewProfile: (player: Player) => void;
    isCurrentUserSuperAdmin: boolean; // Is the current logged-in user the super admin?
    superAdminPlayerId: number; // ID of the current super admin
    onTransferSuperAdmin: (newAdminId: number) => void;
}

const ConfirmationModal: React.FC<{
    player: Player;
    onConfirm: () => void;
    onCancel: () => void;
    type: 'delete' | 'transfer';
    superAdminPlayerId?: number;
}> = ({ player, onConfirm, onCancel, type, superAdminPlayerId }) => (
    <div className="absolute inset-0 bg-black/60 flex justify-center items-center rounded-xl z-10 p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl text-center max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {type === 'delete' ? 'Confirmar Eliminación' : 'Confirmar Transferencia de Admin.'}
            </h3>
            <p className="my-3 text-sm text-gray-600 dark:text-gray-300">
                {type === 'delete' ? (
                    <>¿Estás seguro de que quieres eliminar a <strong className="text-gray-800 dark:text-gray-100">{player.firstName} "{player.nickname}" {player.lastName}</strong>?</>
                ) : (
                    <>¿Estás seguro de transferir el rol de <strong>Administrador Principal</strong> a <strong className="text-gray-800 dark:text-gray-100">{player.firstName} "{player.nickname}" {player.lastName}</strong>?</>
                )}
            </p>
            {type === 'delete' ? (
                <p className="text-xs text-red-500 dark:text-red-400">
                    Esta acción no se puede deshacer. Todos sus datos de partidos y estadísticas serán eliminados permanentemente.
                </p>
            ) : (
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    El administrador principal actual (ID {superAdminPlayerId}) perderá este rol.
                </p>
            )}
            <div className="flex justify-center gap-4 mt-6">
                <button 
                    onClick={onCancel} 
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 rounded-md"
                >
                    Cancelar
                </button>
                <button 
                    onClick={onConfirm} 
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm ${type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    {type === 'delete' ? 'Sí, Eliminar' : 'Sí, Transferir'}
                </button>
            </div>
        </div>
    </div>
);


export const RosterManagementModal: React.FC<RosterManagementModalProps> = ({
    players,
    onClose,
    onAddPlayer,
    onUpdatePlayer,
    onDeletePlayer,
    onViewProfile,
    isCurrentUserSuperAdmin,
    superAdminPlayerId,
    onTransferSuperAdmin,
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
    const [playerToTransferAdmin, setPlayerToTransferAdmin] = useState<Player | null>(null);
    const toast = useToast();

    // Ordenar jugadores por apellido
    const sortedPlayers = useMemo(() => {
        return [...players].sort((a, b) => a.lastName.localeCompare(b.lastName));
    }, [players]);

    const handleEdit = (player: Player) => {
        setEditingPlayer(player);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingPlayer(null);
        setIsFormOpen(true);
    };

    const handleSavePlayer = (playerData: Player | Omit<Player, 'id'>) => {
        if ('id' in playerData) {
            onUpdatePlayer(playerData);
        } else {
            onAddPlayer(playerData);
        }
        setIsFormOpen(false);
        setEditingPlayer(null);
    };
    
    const handleDeleteRequest = (player: Player) => {
        if (player.id === superAdminPlayerId) {
            toast.error("No puedes eliminar al administrador principal. Primero transfiere el rol.");
            return;
        }
        setPlayerToDelete(player);
    };

    const confirmDelete = () => {
        if (playerToDelete) {
            onDeletePlayer(playerToDelete.id);
            setPlayerToDelete(null);
        }
    };

    const handleTransferAdminRequest = (player: Player) => {
        setPlayerToTransferAdmin(player);
    };

    const confirmTransferAdmin = () => {
        if (playerToTransferAdmin) {
            onTransferSuperAdmin(playerToTransferAdmin.id);
            setPlayerToTransferAdmin(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                 {playerToDelete && (
                    <ConfirmationModal 
                        player={playerToDelete}
                        onConfirm={confirmDelete}
                        onCancel={() => setPlayerToDelete(null)}
                        type="delete"
                    />
                )}
                {playerToTransferAdmin && (
                    <ConfirmationModal 
                        player={playerToTransferAdmin}
                        onConfirm={confirmTransferAdmin}
                        onCancel={() => setPlayerToTransferAdmin(null)}
                        type="transfer"
                        superAdminPlayerId={superAdminPlayerId}
                    />
                )}
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestión de Plantilla</h2>
                    <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <main className="p-6 overflow-y-auto">
                    {isFormOpen ? (
                        <PlayerForm
                            player={editingPlayer}
                            onSave={handleSavePlayer}
                            onCancel={() => setIsFormOpen(false)}
                        />
                    ) : (
                        <>
                            <div className="flex justify-end mb-4">
                                <button
                                    type="button"
                                    onClick={handleAddNew}
                                    className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                                >
                                    Agregar Nuevo Jugador
                                </button>
                            </div>
                            <div className="space-y-3">
                                {sortedPlayers.map(player => {
                                    const isSuperAdminPlayer = player.id === superAdminPlayerId;
                                    const isStaff = player.role === PlayerRole.DT || player.role === PlayerRole.AYUDANTE;
                                    
                                    // Clase condicional para borde negro en cuerpo técnico
                                    const cardClasses = `flex items-center justify-between p-3 rounded-lg ${
                                        isStaff 
                                            ? 'bg-gray-200 dark:bg-gray-600 border-2 border-black dark:border-white shadow-md' 
                                            : 'bg-gray-100 dark:bg-gray-700'
                                    }`;

                                    return (
                                        <div key={player.id} className={cardClasses}>
                                            <div className="flex items-center space-x-4">
                                                {player.photoUrl ? (
                                                    <img src={player.photoUrl} alt={player.nickname} className="w-12 h-12 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-gray-800 dark:text-gray-200">
                                                        {player.lastName}, {player.firstName} "{player.nickname}"
                                                    </p>
                                                    <div className="flex items-center space-x-2">
                                                    <div title={player.role}>
                                                            <RoleIcon role={player.role} className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                    </div>
                                                    <StarRating rating={player.skillLevel} />
                                                    {isSuperAdminPlayer && (
                                                        <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full dark:bg-indigo-900/50 dark:text-indigo-300">ADMIN</span>
                                                    )}
                                                    {isStaff && (
                                                        <span className="ml-2 px-2 py-0.5 bg-gray-800 text-white text-xs font-bold rounded-full dark:bg-white dark:text-black">{player.role}</span>
                                                    )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                {isCurrentUserSuperAdmin && !isSuperAdminPlayer && (
                                                     <button 
                                                        type="button" 
                                                        onClick={() => handleTransferAdminRequest(player)} 
                                                        className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300" 
                                                        title="Designar como Admin Principal"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" /></svg>

                                                    </button>
                                                )}
                                                <button type="button" onClick={() => onViewProfile(player)} className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300" title="Ver Perfil">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0012 11z" clipRule="evenodd" /></svg>
                                                </button>
                                                <button type="button" onClick={() => handleEdit(player)} className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" title="Editar">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleDeleteRequest(player)} 
                                                    className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" 
                                                    title={isSuperAdminPlayer ? "No puedes eliminar al Admin Principal" : "Eliminar"}
                                                    disabled={isSuperAdminPlayer}
                                                >
                                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};